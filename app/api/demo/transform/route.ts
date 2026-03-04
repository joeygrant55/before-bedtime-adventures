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

    // Use fal.ai FLUX Kontext — no safety filter issues with real family photos
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 500 }
      );
    }

    const dataUri = `data:${mimeType};base64,${imageBase64}`;

    console.log("🎨 Demo transform: Calling fal.ai FLUX Kontext...");

    const falResponse = await fetch("https://fal.run/fal-ai/flux-kontext/dev", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: dataUri,
        prompt: "Transform this photo into a Disney Pixar animated movie still frame. Big expressive eyes, smooth rounded character designs, rich saturated jewel-tone colors, soft warm rim lighting, painterly background details, whimsical storybook atmosphere. Render every person as a loveable Disney Pixar character while keeping their likeness and personality. Make it look like an actual frame from a Pixar feature film — magical, joyful, and cinematic.",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
      }),
    });

    if (!falResponse.ok) {
      const err = await falResponse.text();
      console.error("❌ fal.ai request failed:", falResponse.status, err);
      return NextResponse.json(
        { error: "Transformation service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    const result = await falResponse.json() as {
      images: Array<{ url: string; content_type: string }>;
    };

    const generatedImageUrl = result.images?.[0]?.url;
    if (!generatedImageUrl) {
      console.error("❌ fal.ai returned no image");
      return NextResponse.json(
        { error: "Failed to generate cartoon. Please try a different photo." },
        { status: 500 }
      );
    }

    // Download and return as base64 so the client can display it
    const downloadResponse = await fetch(generatedImageUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download generated image: ${downloadResponse.status}`);
    }

    const arrayBuffer = await downloadResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
    }
    const cartoonBase64 = btoa(binary);

    console.log("✨ Demo transform complete!");

    return NextResponse.json({ cartoonBase64 });
  } catch (error) {
    console.error("Demo transform error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
