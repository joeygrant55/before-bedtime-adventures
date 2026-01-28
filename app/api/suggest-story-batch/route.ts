import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, bookTitle, context } = body;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "images array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!bookTitle) {
      return NextResponse.json(
        { error: "bookTitle is required" },
        { status: 400 }
      );
    }

    // Fetch images and convert to base64
    const imageDataArray = await Promise.all(
      images.map(async (imageUrl: string) => {
        try {
          const response = await fetch(imageUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = response.headers.get("content-type") || "image/jpeg";
          return {
            inlineData: {
              data: base64,
              mimeType,
            },
          };
        } catch (error) {
          console.error(`Failed to fetch image ${imageUrl}:`, error);
          return null;
        }
      })
    );

    // Filter out failed fetches
    const validImages = imageDataArray.filter((img) => img !== null);

    if (validImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch any valid images" },
        { status: 400 }
      );
    }

    const prompt = `You are a children's storybook author. Given these illustrations from a family photo book titled "${bookTitle}", write a short, warm story caption for each page.

Guidelines:
- Each caption should be 1-2 sentences (under 150 characters)
- Use warm, whimsical language appropriate for a children's bedtime story
- Reference what you see in the illustrations
- Create a narrative flow across pages (beginning, middle, end)
- Use the child's perspective when possible
- Make it feel magical and loving
${context ? `\n\nAdditional context: ${context}` : ""}

Return your response as a JSON array of strings, one for each image, in order. Only return the JSON array, nothing else.

Example format:
["Caption for first image", "Caption for second image", "Caption for third image"]`;

    // Create content parts with all images
    const parts = [...validImages, { text: prompt }];

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let suggestions: string[];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        suggestions = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.replace(/^[0-9]+\.\s*/, "").replace(/^["']|["']$/g, "").trim());
      }

      // Ensure we have the right number of suggestions
      while (suggestions.length < validImages.length) {
        suggestions.push("A magical moment from our adventure.");
      }
      suggestions = suggestions.slice(0, validImages.length);
    } catch (parseError) {
      console.error("Failed to parse suggestions:", parseError);
      // Fallback: generic suggestions
      suggestions = validImages.map(
        (_, i) => `A wonderful moment from page ${i + 1} of our adventure.`
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error generating story suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate story suggestions" },
      { status: 500 }
    );
  }
}
