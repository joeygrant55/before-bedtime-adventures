import { NextRequest, NextResponse } from "next/server";
import { suggestStoryText } from "@/lib/gemini/story-suggest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDescription, pageNumber, totalPages, locationName, bookTitle, previousPageText } = body;

    if (!bookTitle || pageNumber === undefined || totalPages === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: bookTitle, pageNumber, totalPages" },
        { status: 400 }
      );
    }

    const suggestion = await suggestStoryText(
      imageDescription || "a family enjoying their vacation adventure",
      {
        pageNumber,
        totalPages,
        locationName,
        bookTitle,
        previousPageText,
      }
    );

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error generating story suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate story suggestion" },
      { status: 500 }
    );
  }
}
