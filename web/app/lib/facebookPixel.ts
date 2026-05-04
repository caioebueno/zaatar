export type FacebookPixelEventName =
  | "PageView"
  | "AddToCart"
  | "Purchase"
  | string;

type FbqTrackFunction = (
  command: "track" | "trackCustom",
  eventName: string,
  ...parameters: unknown[]
) => void;

declare global {
  interface Window {
    fbq?: FbqTrackFunction;
  }
}

export function trackFacebookPixelEvent(
  eventName: FacebookPixelEventName,
  parameters?: Record<string, unknown>,
  maxAttempts = 15,
  delayMs = 200,
): void {
  if (typeof window === "undefined") return;

  const tryTrack = (attempt: number) => {
    if (typeof window.fbq === "function") {
      if (parameters) {
        window.fbq("track", eventName, parameters);
      } else {
        window.fbq("track", eventName);
      }
      return;
    }

    if (attempt >= maxAttempts) return;

    window.setTimeout(() => {
      tryTrack(attempt + 1);
    }, delayMs);
  };

  tryTrack(0);
}
