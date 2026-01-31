import { textModel } from "./client";

export type StoryStyle = 
  | 'classic'      // Simple, classic children's book style
  | 'rhyming'      // Rhyming verses, Dr. Seuss style
  | 'adventure'    // Action-packed, exciting narrative
  | 'educational'; // Teaching moments, facts woven in

interface StoryContext {
  // Page information
  pageNumber: number;
  totalPages: number;
  locationName?: string;
  // Book context
  bookTitle: string;
  // Previous page text (for continuity)
  previousPageText?: string;
  // Story style preference
  style?: StoryStyle;
}

/**
 * Get style-specific instructions for the prompt
 */
function getStyleInstructions(style: StoryStyle = 'classic'): string {
  const styleGuides = {
    classic: `Write 1-2 sentences of simple, engaging text.
Use clear, straightforward language that flows naturally.
Think: "We had so much fun at the beach!" or "The waves splashed and sparkled in the sun."`,
    
    rhyming: `Write 2-4 lines of rhyming verse, like Dr. Seuss or children's poetry.
Make it playful, rhythmic, and fun to read aloud.
Example style: "We jumped and played beneath the sun, / Our beach adventure had begun!"`,
    
    adventure: `Write 1-2 exciting, action-packed sentences.
Use dynamic verbs and vivid descriptions.
Make the reader feel the excitement and energy of the moment.
Example: "We raced down the sandy hill, whooping with joy as the wind whipped through our hair!"`,
    
    educational: `Write 1-2 sentences that teach something interesting.
Weave in a fun fact or learning moment naturally.
Example: "We spotted a hermit crab scuttling along! Did you know hermit crabs find empty shells to use as their homes?"`,
  };
  
  return styleGuides[style];
}

/**
 * Generate story text suggestions for a page based on image and context
 * Uses Gemini to create age-appropriate, engaging children's book text
 * Supports multiple story styles (classic, rhyming, adventure, educational)
 */
export async function suggestStoryText(
  imageDescription: string,
  context: StoryContext
): Promise<string> {
  const { pageNumber, totalPages, locationName, bookTitle, previousPageText, style = 'classic' } =
    context;

  const styleInstructions = getStyleInstructions(style);
  
  const prompt = `You are writing a children's storybook called "${bookTitle}".
This is page ${pageNumber} of ${totalPages}.
${locationName ? `The location for this page is: ${locationName}` : ""}
${previousPageText ? `The previous page said: "${previousPageText}"` : ""}

The image shows: ${imageDescription}

STORY STYLE: ${style}
${styleInstructions}

Requirements:
- Age-appropriate for 4-8 year olds
- Positive and encouraging tone
- Fun to read aloud
- Connect to the image details
${style === 'rhyming' ? '- Maintain rhythm and rhyme scheme' : ''}
${style === 'adventure' ? '- Use exciting, vivid language' : ''}
${style === 'educational' ? '- Include an interesting fact or learning moment' : ''}

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
