import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Webhook to trigger cartoon transformation after image upload
http.route({
  path: "/transform-image",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { imageId } = await request.json();

    // Get the image record
    const image = await ctx.runQuery(api.images.getPageImages, {
      pageId: imageId as any, // We'll need to adjust this
    });

    // TODO: Call Gemini API here
    // For now, just update status
    await ctx.runMutation(api.images.updateImageStatus, {
      imageId: imageId as any,
      status: "generating",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
