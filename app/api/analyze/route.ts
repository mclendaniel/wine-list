import { NextRequest, NextResponse } from "next/server";
import { analyzeWineList, WineType } from "@/lib/claude";

export const maxDuration = 30;

const VALID_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VALID_WINE_TYPES = new Set(["all", "red", "white", "rose", "sparkling"]);

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType, wineType = "all" } = await request.json();

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Missing image or mediaType" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.has(mediaType)) {
      return NextResponse.json(
        { error: "Invalid image type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    if (!VALID_WINE_TYPES.has(wineType)) {
      return NextResponse.json(
        { error: "Invalid wine type filter." },
        { status: 400 }
      );
    }

    const wines = await analyzeWineList(
      image,
      mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      wineType as WineType
    );

    return NextResponse.json({ wines });
  } catch (error) {
    console.error("Wine analysis error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message.includes("authentication") || message.includes("api_key") || message.includes("401")) {
      return NextResponse.json(
        { error: "API key not configured. Add ANTHROPIC_API_KEY in Vercel environment variables." },
        { status: 500 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Couldn't read that wine list. Try a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
