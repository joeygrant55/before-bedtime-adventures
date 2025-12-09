import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini 3 Pro Image model for cartoon transformations
export const imageModel = genAI.getGenerativeModel({
  model: "gemini-3-pro-image", // Update with actual model name
});

// Gemini model for text generation (story suggestions)
export const textModel = genAI.getGenerativeModel({
  model: "gemini-pro",
});
