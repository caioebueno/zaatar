import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/menu/"],
      // Cart and checkout steps have nothing to rank; staff tools are private.
      disallow: ["/api/", "/menu/*/cart", "/menu/*/confirmation/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
