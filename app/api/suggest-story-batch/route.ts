import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookTitle, pageCount, context, style = 'classic' } = body;

    if (!bookTitle) {
      return NextResponse.json(
        { error: "bookTitle is required" },
        { status: 400 }
      );
    }

    if (!pageCount || pageCount < 1) {
      return NextResponse.json(
        { error: "pageCount is required and must be at least 1" },
        { status: 400 }
      );
    }

    // Style-specific guidelines
    const styleGuides: Record<string, string> = {
      classic: `- Each caption should be 1-2 simple sentences
- Use warm, whimsical language appropriate for a children's bedtime story
- Think classic storybook style: "We had so much fun at the beach!"`,
      
      rhyming: `- Each caption should be 2-4 lines of rhyming verse
- Make it playful and rhythmic, like Dr. Seuss
- Example: "We jumped and played beneath the sun, / Our beach adventure had begun!"`,
      
      adventure: `- Each caption should be 1-2 exciting, action-packed sentences
- Use dynamic verbs and vivid descriptions
- Example: "We raced down the sandy hill, whooping with joy!"`,
      
      educational: `- Each caption should be 1-2 sentences that teach something
- Weave in fun facts naturally
- Example: "We spotted a hermit crab! Did you know they find empty shells to use as homes?"`,
    };

    // Generate story captions based on book title and page count (text-only, no image analysis)
    const prompt = `You are a children's storybook author. I need you to write a warm, engaging story for a family photo book titled "${bookTitle}" with ${pageCount} pages.

STORY STYLE: ${style}
${styleGuides[style] || styleGuides.classic}

Guidelines:
- Write EXACTLY ${pageCount} captions, one for each page
- Age-appropriate for 4-8 year olds
- Create a narrative arc: beginning → middle → end
- Use the child's perspective when possible
- Make it feel magical, loving, and adventurous
- Since this is a photo book, reference moments, memories, and family experiences${context ? `\n\nAdditional context: ${context}` : ""}

Return your response as a JSON array of strings, one caption for each page, in order. Only return the JSON array, nothing else.

Example format for a 6-page book (classic style):
["Once upon a time, our adventure began...", "We discovered magical new places.", "Every moment was filled with wonder.", "Together we laughed and played.", "We made memories to treasure forever.", "And they lived happily ever after."]

Now generate ${pageCount} captions in ${style} style for "${bookTitle}":`;

    const result = await model.generateContent(prompt);
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
          .map((line) => line.replace(/^[0-9]+\.\s*/, "").replace(/^["']|["']$/g, "").trim())
          .filter((line) => line.length > 0);
      }

      // Ensure we have exactly the right number of suggestions
      while (suggestions.length < pageCount) {
        suggestions.push("A magical moment from our adventure.");
      }
      suggestions = suggestions.slice(0, pageCount);
    } catch (parseError) {
      console.error("Failed to parse suggestions:", parseError);
      // Fallback: generic suggestions
      suggestions = Array.from({ length: pageCount }, (_, i) => {
        if (i === 0) return "Once upon a time, our adventure began...";
        if (i === pageCount - 1) return "And they lived happily ever after.";
        return `A wonderful moment from page ${i + 1} of our adventure.`;
      });
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
