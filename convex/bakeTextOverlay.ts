import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Font descriptions for Gemini prompt
const FONT_DESCRIPTIONS: Record<string, string> = {
  storybook: "elegant serif font like Georgia, with fairy tale styling",
  adventure: "bold playful font like Fredoka One, fun and bouncy",
  playful: "rounded friendly sans-serif font like Nunito",
  classic: "timeless elegant serif font like Palatino or Lora",
};

// Font size descriptions
const SIZE_DESCRIPTIONS: Record<string, string> = {
  small: "small text (about 10pt equivalent)",
  medium: "medium readable text (about 16pt equivalent)",
  large: "large prominent text (about 26pt equivalent)",
  title: "very large title text (about 38pt equivalent)",
};

// Action to bake text overlays onto a cartoon image using Gemini
export const bakeTextOverlay = action({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    console.log("🎨 Starting text baking for image:", args.imageId);

    // Get the image record
    const image = await ctx.runQuery(api.images.getImage, {
      imageId: args.imageId,
    });

    if (!image) {
      throw new Error("Image not found");
    }

    if (!image.cartoonImageId) {
      throw new Error("No cartoon image to bake text onto");
    }

    // Get all text overlays for this image
    const overlays = await ctx.runQuery(api.textOverlays.getImageOverlays, {
      imageId: args.imageId,
    });

    // If no overlays, nothing to bake - just clear any existing baked image
    if (!overlays || overlays.length === 0) {
      console.log("No overlays to bake, clearing baked image");
      await ctx.runMutation(api.textOverlays.updateBakingStatus, {
        imageId: args.imageId,
        status: "completed",
      });
      return { success: true };
    }

    console.log(`📝 Found ${overlays.length} text overlays to bake`);

    // Update status to baking
    await ctx.runMutation(api.textOverlays.updateBakingStatus, {
      imageId: args.imageId,
      status: "baking",
    });

    try {
      // Get the cartoon image from storage
      const imageBlob = await ctx.storage.get(image.cartoonImageId);

      if (!imageBlob) {
        throw new Error("Could not get cartoon image from storage");
      }

      // Convert blob to base64 for Gemini API
      const arrayBuffer = await imageBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64 in chunks to avoid memory issues
      let binaryString = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Image = btoa(binaryString);

      console.log("📦 Cartoon image converted to base64");

      // Build the text overlay description for Gemini
      const textElements = overlays
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((overlay, index) => {
          const fontDesc = FONT_DESCRIPTIONS[overlay.style.fontFamily] || "serif font";
          const sizeDesc = SIZE_DESCRIPTIONS[overlay.style.fontSize] || "medium text";

          let positionDesc = "";
          if (overlay.position.y < 20) {
            positionDesc = "near the top";
          } else if (overlay.position.y > 70) {
            positionDesc = "near the bottom";
          } else {
            positionDesc = "in the middle area";
          }

          if (overlay.position.x < 30) {
            positionDesc += ", aligned left";
          } else if (overlay.position.x > 70) {
            positionDesc += ", aligned right";
          } else {
            positionDesc += ", centered horizontally";
          }

          let effectsDesc = "";
          if (overlay.style.hasBackground) {
            effectsDesc += " with a semi-transparent white background behind it";
          }
          if (overlay.style.hasShadow) {
            effectsDesc += " with a subtle drop shadow for readability";
          }

          return `Text ${index + 1}:
- Content: "${overlay.content}"
- Position: ${positionDesc} (approximately ${Math.round(overlay.position.y)}% from top, ${Math.round(overlay.position.x)}% from left)
- Width: approximately ${Math.round(overlay.position.width)}% of image width
- Style: ${sizeDesc} in ${fontDesc}
- Color: ${overlay.style.color}
- Alignment: ${overlay.style.textAlign}${effectsDesc}`;
        })
        .join("\n\n");

      const prompt = `Add the following text elements to this cartoon illustration.
Render the text in a high-quality, print-ready style that matches the Disney/Pixar aesthetic of the image.
The text should look like it's part of a professional children's storybook.

IMPORTANT:
- Keep the original illustration completely intact
- Only add the specified text elements
- Make text crisp and readable for printing at 300 DPI
- Position text exactly as specified
- Use the exact text content provided (do not modify or add to it)

${textElements}

Output the image with all text elements added, maintaining the same dimensions and quality as the input.`;

      console.log("📝 Prompt built, calling Gemini API...");

      // Call Gemini API
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const geminiResponse = await fetch(
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
                      mime_type: imageBlob.type,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("❌ Gemini API error:", errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiResult = await geminiResponse.json();
      console.log("✨ Gemini API response received");

      // Extract generated image from response
      const generatedImageBase64 = geminiResult.candidates?.[0]?.content?.parts?.find(
        (part: { inlineData?: { data: string } }) => part.inlineData
      )?.inlineData?.data;

      if (!generatedImageBase64) {
        console.error("❌ No image in Gemini response:", JSON.stringify(geminiResult, null, 2));
        throw new Error("No image generated in API response");
      }

      console.log("🖼️ Baked image received from Gemini");

      // Get MIME type from response
      const generatedMimeType =
        geminiResult.candidates?.[0]?.content?.parts?.find(
          (part: { inlineData?: { mimeType: string } }) => part.inlineData
        )?.inlineData?.mimeType || "image/png";

      // Convert base64 back to blob and store in Convex
      const binaryStr = atob(generatedImageBase64);
      const bakedBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bakedBytes[i] = binaryStr.charCodeAt(i);
      }
      const bakedBlob = new Blob([bakedBytes], { type: generatedMimeType });

      console.log("💾 Storing baked image to Convex Storage...");

      // Upload to Convex storage
      const bakedImageId = await ctx.storage.store(bakedBlob);

      console.log("✅ Baked image stored! Storage ID:", bakedImageId);

      // Update status to completed with baked image ID
      await ctx.runMutation(api.textOverlays.updateBakingStatus, {
        imageId: args.imageId,
        status: "completed",
        bakedImageId,
      });

      console.log("🎉 Text baking complete!");

      return { success: true };
    } catch (error) {
      console.error("Error baking text overlay:", error);

      await ctx.runMutation(api.textOverlays.updateBakingStatus, {
        imageId: args.imageId,
        status: "failed",
      });

      return { success: false, error: String(error) };
    }
  },
});
