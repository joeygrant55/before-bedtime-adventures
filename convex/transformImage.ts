import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Action to transform an image to Disney cartoon style
export const transformToDisney = action({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    console.log("🎨 Starting Disney transformation for image:", args.imageId);

    // Get the image record
    const image = await ctx.runQuery(api.images.getImage, {
      imageId: args.imageId,
    });

    if (!image) {
      throw new Error("Image not found");
    }

    console.log("✅ Image record found, original storage ID:", image.originalImageId);

    // Update status to generating
    await ctx.runMutation(api.images.updateImageStatus, {
      imageId: args.imageId,
      status: "generating",
    });

    console.log("📝 Status updated to 'generating'");

    try {
      // Get the original image from storage
      const imageBlob = await ctx.storage.get(image.originalImageId);

      if (!imageBlob) {
        throw new Error("Could not get image from storage");
      }

      // Convert blob to base64 for Gemini API
      const arrayBuffer = await imageBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convert to base64 in chunks to avoid memory issues
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Image = btoa(binaryString);

      console.log("📦 Image converted to base64, size:", base64Image.length, "chars");

      // Call Gemini 3 Pro Image API (Nano Banana Pro) to transform to Disney style
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const prompt = "Transform this photo into a Disney Pixar animated style cartoon. Maintain the scene composition, people, and overall setting but make it look like a frame from a Disney or Pixar animated movie. Use vibrant colors, smooth character designs, and that signature Disney animation aesthetic. Keep all the people and elements recognizable but in cartoon form.";

      // Use Gemini 3 Pro Image (billing enabled)
      const models = [
        { name: "gemini-3-pro-image-preview", label: "Gemini 3 Pro Image" },
      ];

      let geminiResponse: Response | null = null;
      let lastError = "";
      let successfulModel = "";

      // Try each model
      for (const model of models) {
        console.log(`🔑 Trying ${model.label} API...`);

        // Retry configuration for rate limiting
        const MAX_RETRIES = 2;
        const INITIAL_DELAY_MS = 2000;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`⏳ Retry attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }

          geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: imageBlob.type,
                        data: base64Image,
                      },
                    },
                  ],
                }],
                generationConfig: {
                  responseModalities: ["TEXT", "IMAGE"],
                },
              }),
            }
          );

          // If successful, break out of retry loop
          if (geminiResponse.ok) {
            console.log(`✅ ${model.label} request successful on attempt`, attempt + 1);
            successfulModel = model.label;
            break;
          }

          // Check if it's a rate limit error (429) or server error (503)
          if (geminiResponse.status === 429 || geminiResponse.status === 503) {
            lastError = await geminiResponse.text();
            console.log(`⚠️ Rate limited (${geminiResponse.status}), will retry...`);
            continue;
          }

          // For other errors, don't retry this model
          lastError = await geminiResponse.text();
          break;
        }

        // If successful, stop trying other models
        if (geminiResponse?.ok) {
          break;
        }

        console.log(`❌ ${model.label} failed, trying next model...`);
      }

      if (!geminiResponse || !geminiResponse.ok) {
        console.error("❌ All Gemini models failed. Last error:", lastError);

        // Mark as failed
        console.log("⚠️ Marking transformation as failed");

        await ctx.runMutation(api.images.updateImageStatus, {
          imageId: args.imageId,
          status: "failed",
        });

        return { success: false, error: lastError };
      }

      console.log(`🎨 Using ${successfulModel} for transformation`);

      const geminiResult = await geminiResponse.json();
      console.log("✨ Gemini API response received:", JSON.stringify(geminiResult, null, 2));

      // Extract generated image from response
      // Response format: { candidates: [{ content: { parts: [{ inlineData: { data: base64, mimeType: string } }] } }] }
      const generatedImageBase64 = geminiResult.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData
      )?.inlineData?.data;

      let cartoonImageId;

      if (generatedImageBase64) {
        console.log("🖼️ Generated image found in response!");

        // Get MIME type from response
        const generatedMimeType = geminiResult.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData
        )?.inlineData?.mimeType || 'image/png';

        console.log("📸 MIME type:", generatedMimeType);

        // Convert base64 back to blob and store in Convex
        const binaryString = atob(generatedImageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const cartoonBlob = new Blob([bytes], { type: generatedMimeType });

        console.log("💾 Storing cartoon image to Convex Storage...");

        // Upload to Convex storage
        cartoonImageId = await ctx.storage.store(cartoonBlob);

        console.log("✅ Cartoon image stored! Storage ID:", cartoonImageId);
      } else {
        // Mark as failed if no image generated
        console.log("⚠️ No generated image in response");

        await ctx.runMutation(api.images.updateImageStatus, {
          imageId: args.imageId,
          status: "failed",
        });

        return { success: false, error: "No image generated in API response" };
      }

      // Update status to completed
      await ctx.runMutation(api.images.updateImageStatus, {
        imageId: args.imageId,
        status: "completed",
        cartoonImageId,
      });

      console.log("🎉 Transformation complete!");

      return { success: true };
    } catch (error) {
      console.error("Error transforming image:", error);

      await ctx.runMutation(api.images.updateImageStatus, {
        imageId: args.imageId,
        status: "failed",
      });

      throw error;
    }
  },
});
