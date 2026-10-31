import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env/public";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in areas and pages that only make sense mid-flow.
      disallow: [
        "/admin",
        "/owner",
        "/researcher",
        "/payment",
        "/forbidden",
        "/api",
      ],
    },
    sitemap: `${publicEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
