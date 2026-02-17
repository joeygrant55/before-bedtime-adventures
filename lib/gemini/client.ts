import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

function getGenAI(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Lazy-initialized instances (avoids build-time crash when env var is missing)
let _genAI: GoogleGenerativeAI | null = null;
let _imageModel: GenerativeModel | null = null;
let _textModel: GenerativeModel | null = null;

export const genAI = new Proxy({} as GoogleGenerativeAI, {
  get(_target, prop) {
    if (!_genAI) _genAI = getGenAI();
    return (_genAI as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Gemini 3 Pro Image model for cartoon transformations
export const imageModel = new Proxy({} as GenerativeModel, {
  get(_target, prop) {
    if (!_imageModel) _imageModel = getGenAI().getGenerativeModel({ model: "gemini-3-pro-image" });
    return (_imageModel as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Gemini model for text generation (story suggestions)
export const textModel = new Proxy({} as GenerativeModel, {
  get(_target, prop) {
    if (!_textModel) _textModel = getGenAI().getGenerativeModel({ model: "gemini-pro" });
    return (_textModel as unknown as Record<string | symbol, unknown>)[prop];
  },
});
