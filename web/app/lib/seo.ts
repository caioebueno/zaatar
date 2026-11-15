import type { Metadata } from "next";

/** Public address of the ordering site, used for canonical links and the sitemap. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.zaatargrillpizza.com"
).replace(/\/+$/, "");

export const MENU_LANGUAGES = ["en", "pt", "es"] as const;
type TMenuLanguage = (typeof MENU_LANGUAGES)[number];

const HREFLANG_BY_LANGUAGE: Record<TMenuLanguage, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-US",
};

const OG_LOCALE_BY_LANGUAGE: Record<TMenuLanguage, string> = {
  en: "en_US",
  pt: "pt_BR",
  es: "es_US",
};

const COPY_BY_LANGUAGE: Record<
  TMenuLanguage,
  { title: (name: string) => string; description: (name: string) => string }
> = {
  en: {
    title: (name) => `${name} | Order Pizza & Sfihas Online in Orlando`,
    description: (name) =>
      `Order Brazilian pizzas, sfihas and combos online from ${name} in Orlando, FL. Pickup or delivery.`,
  },
  pt: {
    title: (name) => `${name} | Peça Pizza e Esfiha Online em Orlando`,
    description: (name) =>
      `Peça pizzas, esfihas e combos online no ${name} em Orlando, FL. Retirada ou delivery.`,
  },
  es: {
    title: (name) => `${name} | Pide Pizza y Esfihas en Línea en Orlando`,
    description: (name) =>
      `Pide pizzas brasileñas, esfihas y combos en línea de ${name} en Orlando, FL. Para recoger o a domicilio.`,
  },
};

export const isMenuLanguage = (value: string): value is TMenuLanguage =>
  (MENU_LANGUAGES as readonly string[]).includes(value);

/** hreflang links between the three menu languages, plus x-default. */
export const menuLanguageAlternates = (): Record<string, string> => ({
  ...Object.fromEntries(
    MENU_LANGUAGES.map((language) => [
      HREFLANG_BY_LANGUAGE[language],
      `${SITE_URL}/menu/${language}`,
    ]),
  ),
  "x-default": `${SITE_URL}/menu/en`,
});

export const buildMenuMetadata = ({
  lg,
  businessName,
  imageUrl,
}: {
  lg: string;
  businessName: string;
  imageUrl?: string | null;
}): Metadata => {
  const language: TMenuLanguage = isMenuLanguage(lg) ? lg : "en";
  const copy = COPY_BY_LANGUAGE[language];
  const title = copy.title(businessName);
  const description = copy.description(businessName);
  const url = `${SITE_URL}/menu/${language}`;
  const images = imageUrl ? [{ url: imageUrl, alt: businessName }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: menuLanguageAlternates(),
    },
    openGraph: {
      type: "website",
      url,
      siteName: businessName,
      title,
      description,
      locale: OG_LOCALE_BY_LANGUAGE[language],
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
};
