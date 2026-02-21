import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/books/", "/orders/", "/settings/", "/api/"],
    },
    sitemap: "https://before-bedtime-adventures.vercel.app/sitemap.xml",
  };
}
