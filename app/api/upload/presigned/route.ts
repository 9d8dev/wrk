import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

		const { fileName, fileType, fileSize } = await request.json();

		if (!fileName || !fileType) {
			return NextResponse.json(
				{ error: "Missing fileName or fileType" },
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
		if (!allowedTypes.includes(fileType)) {
			return NextResponse.json(
				{
					error:
						"Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed",
				},
				{ status: 400 },
			);
		}

		// Validate file size (can be more generous since this bypasses serverless limits)
		const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for direct upload
		if (fileSize > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `File too large: ${(fileSize / 1024 / 1024).toFixed(
						2,
					)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
				},
				{ status: 400 },
			);
		}

		const key = `uploads/${randomUUID()}-${fileName}`;

		const command = new PutObjectCommand({
			Bucket: process.env.R2_BUCKET!,
			Key: key,
			ContentType: fileType,
		});

		// Generate presigned URL (valid for 5 minutes)
		const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

		const publicUrl = `https://images.wrk.so/${key}`;

		return NextResponse.json({
			presignedUrl,
			publicUrl,
			key,
		});
	} catch (error) {
		console.error("Presigned URL generation error:", error);
		return NextResponse.json(
			{ error: "Failed to generate upload URL" },
			{ status: 500 },
		);
	}
}

export const runtime = "nodejs";
export const maxDuration = 30;
