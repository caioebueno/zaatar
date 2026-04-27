import Script from "next/script";
import { Suspense } from "react";
import FacebookPixelPageView from "@/app/components/FacebookPixelPageView";

export default function OrderingMenuLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim();
  const noScriptPixelUrl = facebookPixelId
    ? `https://www.facebook.com/tr?id=${encodeURIComponent(
        facebookPixelId,
      )}&ev=PageView&noscript=1`
    : "";

  return (
    <>
      {children}
      {facebookPixelId ? (
        <>
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <Suspense fallback={null}>
            <FacebookPixelPageView />
          </Suspense>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height={1}
              width={1}
              style={{ display: "none" }}
              src={noScriptPixelUrl}
              alt=""
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
