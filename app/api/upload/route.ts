import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { createMedia } from "@/lib/data/media";

const s3 = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
});

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const projectId = formData.get("projectId") as string | null;

		if (!file || file.size === 0) {
			return NextResponse.json({ error: "Missing file" }, { status: 400 });
		}

		// Validate file size (15MB max for API route, direct upload handles larger files)
		const MAX_FILE_SIZE = 15 * 1024 * 1024; // Back to 15MB
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `File size exceeds 15MB limit. Your file is ${(
						file.size / 1024 / 1024
					).toFixed(2)}MB`,
				},
				{ status: 400 },
			);
		}

		// Validate file type
		const allowedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
			"image/gif",
		];
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{
					error:
						"Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed",
				},
				{ status: 400 },
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const key = `uploads/${randomUUID()}-${file.name}`;

		// Get image dimensions using sharp
		const metadata = await sharp(buffer, {
			animated: file.type === "image/gif",
		}).metadata();

		if (!metadata.width || !metadata.height) {
			return NextResponse.json(
				{ error: "Could not get image dimensions" },
				{ status: 400 },
			);
		}

		const width = metadata.width;
		const height = metadata.height;

		// Use the original buffer since client already compressed
		const finalBuffer = buffer;
		const contentType = file.type;

		await s3.send(
			new PutObjectCommand({
				Bucket: process.env.R2_BUCKET!,
				Key: key,
				Body: finalBuffer,
				ContentType: contentType,
			}),
		);

		const url = `https://images.wrk.so/${key}`;

		// Store image metadata in the media table
		const mediaResult = await createMedia({
			url,
			width,
			height,
			alt: file.name,
			size: finalBuffer.length,
			mimeType: contentType,
			projectId: projectId || undefined,
		});

		if (!mediaResult.success) {
			console.error("Failed to save media metadata:", mediaResult.error);
		}

		const mediaId =
			mediaResult.success && mediaResult.data ? mediaResult.data.id : undefined;

		return NextResponse.json({
			success: true,
			url,
			width,
			height,
			mediaId,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload image" },
			{ status: 500 },
		);
	}
}

// Configure route segment to allow larger payloads (though limited by Vercel)
export const runtime = "nodejs";
export const maxDuration = 60;
