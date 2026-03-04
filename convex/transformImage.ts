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
      const falApiKey = process.env.FAL_KEY;
      if (!falApiKey) {
        throw new Error("FAL_KEY not configured");
      }

      // Step 1: Get a public URL for the image from Convex storage
      const imageUrl = await ctx.storage.getUrl(image.originalImageId);
      if (!imageUrl) {
        throw new Error("Could not get public URL for image from Convex storage");
      }
      console.log("✅ Got Convex image URL:", imageUrl);

      // Step 2: Call FLUX Kontext to transform to Disney/Pixar style
      const prompt = "Transform into a Disney Pixar animated movie frame. Vibrant colors, smooth stylized character designs, warm cinematic lighting, that signature Disney Pixar animation aesthetic. Beautiful cartoon illustration style, same scene composition and subjects.";

      console.log("🎨 Calling FLUX Kontext for Disney transformation...");

      const falResponse = await fetch("https://queue.fal.run/fal-ai/flux-kontext/pro", {
        method: "POST",
        headers: {
          "Authorization": `Key ${falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: "jpeg",
        }),
      });

      if (!falResponse.ok) {
        const falError = await falResponse.text();
        throw new Error(`fal.ai FLUX Kontext request failed: ${falError}`);
      }

      // fal.ai queue response — poll for result
      const queueResult = await falResponse.json() as { request_id: string; status: string; response_url?: string };
      console.log("⏳ fal.ai job queued:", queueResult.request_id);

      // Poll for completion
      const requestId = queueResult.request_id;
      const resultUrl = `https://queue.fal.run/fal-ai/flux-kontext/pro/requests/${requestId}`;
      const maxPolls = 30;
      const pollIntervalMs = 3000;

      let resultData: { images?: Array<{ url: string; content_type: string }> } | null = null;

      for (let i = 0; i < maxPolls; i++) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

        const pollResponse = await fetch(resultUrl, {
          headers: { "Authorization": `Key ${falApiKey}` },
        });

        if (!pollResponse.ok) {
          console.log(`⏳ Poll ${i + 1}: not ready yet`);
          continue;
        }

        const pollData = await pollResponse.json() as { status?: string; images?: Array<{ url: string; content_type: string }>; error?: string };
        console.log(`⏳ Poll ${i + 1}: status =`, pollData.status);

        if (pollData.status === "COMPLETED" || pollData.images) {
          resultData = pollData;
          break;
        }

        if (pollData.status === "FAILED" || pollData.error) {
          throw new Error(`fal.ai job failed: ${pollData.error || "Unknown error"}`);
        }
      }

      if (!resultData?.images?.[0]?.url) {
        throw new Error("fal.ai job timed out or returned no image");
      }

      const generatedImageUrl = resultData.images[0].url;
      const generatedMimeType = resultData.images[0].content_type || "image/jpeg";
      console.log("🖼️ Generated image URL:", generatedImageUrl);

      // Step 3: Download the generated image and store in Convex
      const generatedImageResponse = await fetch(generatedImageUrl);
      if (!generatedImageResponse.ok) {
        throw new Error("Failed to download generated image from fal.ai");
      }

      const generatedImageBlob = await generatedImageResponse.blob();
      const cartoonBlob = new Blob([await generatedImageBlob.arrayBuffer()], { type: generatedMimeType });

      console.log("💾 Storing cartoon image to Convex Storage...");
      const cartoonImageId = await ctx.storage.store(cartoonBlob);
      console.log("✅ Cartoon image stored! Storage ID:", cartoonImageId);

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
