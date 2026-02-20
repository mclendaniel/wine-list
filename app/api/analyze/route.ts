import { NextRequest, NextResponse } from "next/server";
import { analyzeWineList } from "@/lib/claude";

const VALID_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType } = await request.json();

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

    // Check approximate base64 size
    const sizeInBytes = (image.length * 3) / 4;
    if (sizeInBytes > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const wines = await analyzeWineList(
      image,
      mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
    );

    return NextResponse.json({ wines });
  } catch (error) {
    console.error("Wine analysis error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse wine list from image. Try a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze wine list. Please try again." },
      { status: 500 }
    );
  }
}
