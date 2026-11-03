const EBAY_SELLER_URL = "https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2";
const SYDNEY_TIME_ZONE = "Australia/Sydney";
const CACHE_MS = 60_000;

export interface PublicEbayShow {
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  ebayShowLink: string;
  coverImage: string;
  note: string;
}

interface EbayEvent {
  id?: unknown;
  title?: unknown;
  startTime?: unknown;
  previewImage?: { url?: unknown };
}

interface CacheValue {
  expiresAt: number;
  shows: PublicEbayShow[];
  source: "public" | "fallback";
}

let cache: CacheValue = { expiresAt: 0, shows: [], source: "fallback" };

function isAllowedTitle(value: string) {
  return !/(raffle|lottery|gamble|gambling|spin to win|odds|chance|prize draw|luck of the draw)/i.test(value);
}

function extractJsonArray(html: string, marker: string) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) throw new Error("eBay liveEvents data was not found");

  const start = html.indexOf("[", markerIndex);
  if (start < 0) throw new Error("eBay liveEvents array did not start");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }

  throw new Error("eBay liveEvents array did not end");
}

function toSydneyDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});

  if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) return null;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, startTime: `${parts.hour}:${parts.minute}` };
}

function toPublicShow(event: EbayEvent): PublicEbayShow | null {
  if (typeof event.id !== "string" || typeof event.title !== "string" || typeof event.startTime !== "string") return null;
  const title = event.title.trim();
  const local = toSydneyDateTime(event.startTime);
  if (!title || !local || !/^[A-Za-z0-9_-]+$/.test(event.id) || !isAllowedTitle(title)) return null;

  const coverImage = typeof event.previewImage?.url === "string" && event.previewImage.url.startsWith("https://")
    ? event.previewImage.url
    : "";

  return {
    title,
    date: local.date,
    startTime: local.startTime,
    durationMinutes: 120,
    ebayShowLink: `https://www.ebay.com.au/ebaylive/events/${event.id}`,
    coverImage,
    note: "",
  };
}

export async function getPublicEbayShows() {
  if (cache.expiresAt > Date.now()) return cache;

  try {
    const response = await fetch(EBAY_SELLER_URL, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (compatible; RipzClubSchedule/1.0)",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`eBay response ${response.status}`);

    const html = await response.text();
    const rawEvents = JSON.parse(extractJsonArray(html, '"liveEvents":')) as unknown;
    if (!Array.isArray(rawEvents)) throw new Error("eBay liveEvents payload was not an array");

    const shows = rawEvents
      .map(event => toPublicShow(event as EbayEvent))
      .filter((show): show is PublicEbayShow => Boolean(show))
      .slice(0, 24);

    cache = { expiresAt: Date.now() + CACHE_MS, shows, source: "public" };
  } catch {
    cache = { expiresAt: Date.now() + CACHE_MS, shows: [], source: "fallback" };
  }

  return cache;
}
