import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Transform a photo to Disney/Pixar animated style using fal.ai FLUX Kontext
export const transformToDisney = action({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    console.log("🎨 Starting Disney transformation for image:", args.imageId);

    const image = await ctx.runQuery(api.images.getImage, { imageId: args.imageId });
    if (!image) throw new Error("Image not found");

    await ctx.runMutation(api.images.updateImageStatus, {
      imageId: args.imageId,
      status: "generating",
    });

    try {
      // Get image from Convex storage
      const imageBlob = await ctx.storage.get(image.originalImageId);
      if (!imageBlob) throw new Error("Could not get image from storage");

      // Convert to base64 data URI
      const arrayBuffer = await imageBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
      }
      const base64 = btoa(binary);
      const dataUri = `data:${imageBlob.type || "image/jpeg"};base64,${base64}`;
      console.log("📦 Image ready, size:", base64.length, "chars");

      const falApiKey = process.env.FAL_KEY;
      if (!falApiKey) throw new Error("FAL_KEY not configured");

      // Call fal.ai FLUX Kontext sync endpoint — returns result directly, no polling
      console.log("🎨 Calling fal.ai FLUX Kontext...");
      const falResponse = await fetch("https://fal.run/fal-ai/flux-kontext/dev", {
        method: "POST",
        headers: {
          "Authorization": `Key ${falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: dataUri,
          prompt: "Transform into a Disney Pixar animated movie illustration. Vibrant saturated colors, smooth stylized character designs, warm cinematic lighting, that signature Pixar animation aesthetic. Same scene composition and subjects, rendered as a beautiful cartoon.",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: "jpeg",
        }),
      });

      if (!falResponse.ok) {
        const err = await falResponse.text();
        throw new Error(`fal.ai request failed (${falResponse.status}): ${err}`);
      }

      const result = await falResponse.json() as {
        images: Array<{ url: string; content_type: string }>;
      };

      console.log("✅ fal.ai response received, images:", result.images?.length);

      const generatedImageUrl = result.images?.[0]?.url;
      if (!generatedImageUrl) {
        throw new Error("fal.ai returned no image");
      }

      console.log("🖼️ Generated image URL:", generatedImageUrl);

      // Download generated image and store in Convex
      const downloadResponse = await fetch(generatedImageUrl);
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download generated image: ${downloadResponse.status}`);
      }

      const generatedBlob = new Blob(
        [await downloadResponse.arrayBuffer()],
        { type: result.images[0].content_type || "image/jpeg" }
      );

      console.log("💾 Storing cartoon image...");
      const cartoonImageId = await ctx.storage.store(generatedBlob);
      console.log("✅ Stored! ID:", cartoonImageId);

      await ctx.runMutation(api.images.updateImageStatus, {
        imageId: args.imageId,
        status: "completed",
        cartoonImageId,
      });

      console.log("🎉 Transformation complete!");
      return { success: true };

    } catch (error) {
      console.error("❌ Transform error:", error);
      await ctx.runMutation(api.images.updateImageStatus, {
        imageId: args.imageId,
        status: "failed",
      });
      throw error;
    }
  },
});
