import type { MetadataRoute } from "next";
import { MENU_LANGUAGES, SITE_URL, menuLanguageAlternates } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = menuLanguageAlternates();

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages },
    },
    ...MENU_LANGUAGES.map((language) => ({
      url: `${SITE_URL}/menu/${language}`,
      changeFrequency: "daily" as const,
      priority: 1,
      alternates: { languages },
    })),
  ];
}
