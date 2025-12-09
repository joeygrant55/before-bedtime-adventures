import { NextResponse } from "next/server";

// Simple rate limiting using a Map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 3; // 3 requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "You've reached the demo limit. Sign up to create unlimited transformations!" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    // Call Gemini API directly
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 500 }
      );
    }

    const prompt = "Transform this photo into a Disney Pixar animated style cartoon. Maintain the scene composition, people, and overall setting but make it look like a frame from a Disney or Pixar animated movie. Use vibrant colors, smooth character designs, and that signature Disney animation aesthetic. Keep all the people and elements recognizable but in cartoon form.";

    console.log("🎨 Demo transform: Starting Gemini API call...");

    // Retry configuration
    const MAX_RETRIES = 2;
    const INITIAL_DELAY_MS = 2000;

    let geminiResponse: Response | null = null;
    let lastError = "";

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["IMAGE"],
            },
          }),
        }
      );

      if (geminiResponse.ok) {
        console.log("✅ Gemini API call successful on attempt", attempt + 1);
        break;
      }

      // Check if it's a rate limit error
      if (geminiResponse.status === 429 || geminiResponse.status === 503) {
        lastError = await geminiResponse.text();
        console.log(`⚠️ Rate limited (${geminiResponse.status}), will retry...`);
        continue;
      }

      lastError = await geminiResponse.text();
      break;
    }

    if (!geminiResponse || !geminiResponse.ok) {
      console.error("❌ Gemini API failed:", lastError);
      return NextResponse.json(
        { error: "Transformation service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    const result = await geminiResponse.json();

    // Extract the generated image
    const generatedImageBase64 = result.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { data: string } }) => part.inlineData
    )?.inlineData?.data;

    if (!generatedImageBase64) {
      console.error("❌ No image in Gemini response");
      return NextResponse.json(
        { error: "Failed to generate cartoon. Please try a different photo." },
        { status: 500 }
      );
    }

    console.log("✨ Demo transform complete!");

    return NextResponse.json({
      cartoonBase64: generatedImageBase64,
    });
  } catch (error) {
    console.error("Demo transform error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
