import { type NextRequest, NextResponse } from "next/server";
import { generateUsernameSuggestions } from "@/lib/utils/username";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const baseUsername = searchParams.get("base");
		const alternatives = searchParams.get("alternatives")?.split(",") || [];

		if (!baseUsername) {
			return NextResponse.json(
				{ error: "Base username parameter is required" },
				{ status: 400 },
			);
		}

		// Basic validation
		if (baseUsername.length < 1) {
			return NextResponse.json(
				{ error: "Base username cannot be empty" },
				{ status: 400 },
			);
		}

		const suggestions = await generateUsernameSuggestions(
			baseUsername,
			alternatives.length > 0 ? alternatives : undefined,
		);

		return NextResponse.json({ suggestions });
	} catch (error) {
		console.error("Username suggestions error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
