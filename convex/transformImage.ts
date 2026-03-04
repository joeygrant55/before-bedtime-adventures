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

      const falApiKey = process.env.FAL_KEY;
      if (!falApiKey) {
        throw new Error("FAL_KEY not configured");
      }

      // Step 1: Convert image to base64 data URI for fal.ai
      const arrayBuffer = await imageBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Image = btoa(binaryString);
      const mimeType = imageBlob.type || "image/jpeg";
      const imageUrl = `data:${mimeType};base64,${base64Image}`;
      console.log("✅ Image converted to base64 data URI, size:", base64Image.length, "chars");

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
      console.log("⏳ fal.ai job queued, request_id:", queueResult.request_id, "status:", queueResult.status);

      const requestId = queueResult.request_id;
      const statusUrl = `https://queue.fal.run/fal-ai/flux-kontext/pro/requests/${requestId}/status`;
      const resultUrl = `https://queue.fal.run/fal-ai/flux-kontext/pro/requests/${requestId}`;
      const maxPolls = 40;
      const pollIntervalMs = 4000;

      let completed = false;

      for (let i = 0; i < maxPolls; i++) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

        const statusResponse = await fetch(statusUrl, {
          headers: { "Authorization": `Key ${falApiKey}` },
        });

        if (!statusResponse.ok) {
          console.log(`⏳ Poll ${i + 1}: status check failed (${statusResponse.status})`);
          continue;
        }

        const statusData = await statusResponse.json() as { status: string; error?: string };
        console.log(`⏳ Poll ${i + 1}: status = ${statusData.status}`);

        if (statusData.status === "COMPLETED") {
          completed = true;
          break;
        }

        if (statusData.status === "FAILED") {
          throw new Error(`fal.ai job failed: ${statusData.error || "Unknown error"}`);
        }
        // IN_QUEUE or IN_PROGRESS — keep polling
      }

      if (!completed) {
        throw new Error("fal.ai job timed out after polling");
      }

      // Fetch the result
      const resultResponse = await fetch(resultUrl, {
        headers: { "Authorization": `Key ${falApiKey}` },
      });

      if (!resultResponse.ok) {
        throw new Error(`Failed to fetch fal.ai result: ${resultResponse.status}`);
      }

      const resultData = await resultResponse.json() as { images?: Array<{ url: string; content_type: string }> };

      if (!resultData?.images?.[0]?.url) {
        throw new Error("fal.ai returned no image in result");
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
