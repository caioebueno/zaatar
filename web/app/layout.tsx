import type { Metadata } from "next";
import { Montserrat, Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "./lib/seo";
import { cn } from "@/lib/utils";
import { CartProvider } from "./components/CartContext";
import { NuqsAdapter } from 'nuqs/adapters/next/app'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Zaatar Grill & Pizza",
  description:
    "Order Brazilian pizzas, sfihas and combos online from Zaatar Grill & Pizza in Orlando, FL. Pickup or delivery.",
  // Staff pages (orders, inventory, drivers...) share this layout and must stay
  // out of search. The public menu pages opt back in with their own metadata.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${montserrat.variable} ${montserrat.variable} antialiased`}
      >
        <NuqsAdapter>
          <CartProvider>
            {children}
          </CartProvider>
        </NuqsAdapter>
        {clarityProjectId ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
