import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { deleteMediaWithCleanup } from "@/lib/actions/media";
import { auth } from "@/lib/auth";
import { createMedia } from "@/lib/data/media";

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { url, fileName, fileSize, mimeType, projectId } =
			await request.json();

		if (!url || !fileName || !fileSize || !mimeType) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Extract image dimensions from the uploaded file
		let width: number | undefined;
		let height: number | undefined;

		try {
			// Fetch the image from the URL to get dimensions
			const imageResponse = await fetch(url);
			if (imageResponse.ok) {
				const imageBuffer = await imageResponse.arrayBuffer();
				const metadata = await sharp(Buffer.from(imageBuffer)).metadata();
				width = metadata.width;
				height = metadata.height;
			}
		} catch (error) {
			console.warn("Failed to extract image dimensions:", error);
			// Continue without dimensions if extraction fails
		}

		// Create media record
		const mediaResult = await createMedia({
			url,
			width: width || 0,
			height: height || 0,
			alt: fileName,
			size: fileSize,
			mimeType,
			projectId: projectId || undefined,
		});

		if (!mediaResult.success) {
			return NextResponse.json(
				{ error: mediaResult.error || "Failed to create media record" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			mediaId: mediaResult.data?.id,
			width,
			height,
		});
	} catch (error) {
		console.error("Create media error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const mediaId = searchParams.get("id");

		if (!mediaId) {
			return NextResponse.json(
				{ error: "Media ID is required" },
				{ status: 400 },
			);
		}

		// Delete media from both database and R2 storage
		const result = await deleteMediaWithCleanup(mediaId);

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error || "Failed to delete media" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete media error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export const runtime = "nodejs";
export const maxDuration = 30;
