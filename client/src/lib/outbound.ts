export type OutboundDestination = "ebay" | "discord" | "instagram" | "facebook" | "tiktok";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, string>>;
  }
}

export function trackOutboundClick(destination: OutboundDestination) {
  if (typeof window === "undefined") return;

  const detail = { destination };
  window.dispatchEvent(new CustomEvent("ripzclub:outbound", { detail }));
  window.dataLayer?.push({ event: "ripzclub_outbound_click", destination });
}
