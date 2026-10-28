import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/auth", "/login", "/profile", "/chat", "/payment", "/terminal"],
    },
    sitemap: `${(process.env.NEXT_PUBLIC_DOMAIN || process.env.DOMAIN || "https://www.studic.in").replace(/\/+$/, "")}/sitemap.xml`,
  };
}