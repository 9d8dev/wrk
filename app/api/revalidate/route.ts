import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		// Verify authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { path, tag, type = "path" } = body;

		if (type === "path" && path) {
			revalidatePath(path);
			// Also try with layout and page types
			revalidatePath(path, "layout");
			revalidatePath(path, "page");
			return NextResponse.json({ revalidated: true, path });
		} else if (type === "tag" && tag) {
			revalidateTag(tag);
			return NextResponse.json({ revalidated: true, tag });
		}

		return NextResponse.json(
			{ error: "Missing path or tag parameter" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("Revalidation error:", error);
		return NextResponse.json(
			{ error: "Failed to revalidate" },
			{ status: 500 },
		);
	}
}
