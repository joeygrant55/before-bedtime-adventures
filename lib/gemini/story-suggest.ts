import { textModel } from "./client";

interface StoryContext {
  // Page information
  pageNumber: number;
  totalPages: number;
  locationName?: string;
  // Book context
  bookTitle: string;
  // Previous page text (for continuity)
  previousPageText?: string;
}

/**
 * Generate story text suggestions for a page based on image and context
 * Uses Gemini to create age-appropriate, engaging children's book text
 */
export async function suggestStoryText(
  imageDescription: string,
  context: StoryContext
): Promise<string> {
  const { pageNumber, totalPages, locationName, bookTitle, previousPageText } =
    context;

  const prompt = `You are writing a children's storybook called "${bookTitle}".
This is page ${pageNumber} of ${totalPages}.
${locationName ? `The location for this page is: ${locationName}` : ""}
${previousPageText ? `The previous page said: "${previousPageText}"` : ""}

The image shows: ${imageDescription}

Write 1-2 sentences of engaging, age-appropriate text for this page (suitable for ages 4-8).
Make it exciting and capture the adventure and wonder of the vacation moment.
Keep it simple, positive, and fun to read aloud.

Only return the story text, nothing else.`;

  try {
    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error("Error generating story text:", error);
    throw new Error("Failed to generate story text suggestion");
  }
}

/**
 * Generate a book title based on vacation theme and locations
 */
export async function suggestBookTitle(locations: string[]): Promise<string> {
  const prompt = `Generate a creative, fun title for a children's storybook about a family vacation.
The vacation included these locations: ${locations.join(", ")}

The title should be:
- Exciting and adventurous
- Age-appropriate (4-8 years old)
- 3-6 words long
- Capture the magic of family travel

Only return the title, nothing else.`;

  try {
    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    const title = response.text();

    return title.trim();
  } catch (error) {
    console.error("Error generating book title:", error);
    return "Our Amazing Adventure";
  }
}
