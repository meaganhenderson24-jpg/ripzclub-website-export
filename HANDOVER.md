# Ripz Club mock-up handover

## Current scope

Ripz Club remains a private, noindex review mock-up. It has no accounts, forms, email capture, payment collection, redemption, analytics vendor, ad pixel, or eBay purchase action. Search indexing stays blocked through page metadata and `client/public/robots.txt`.

The visible routes are Home, How it works, Meet Lee, FAQs, Community, and Privacy policy. `/santas-surprise-box` is a private route. It is absent from `client/public/manus-routes.json`, has `noindex` metadata, is not in the menu while its switch is off, and takes no payments.

## Editing content and visibility

Approved copy, destination links, brand assets, header links, motion paths, social links, and the Santa menu switch are in `client/src/lib/site.ts`.

`client/src/content/home-promo.json` is the editable top advert source. The `santa` object is currently active and has the `See the box` button label. The `wheel` object remains available as the non-interactive fallback. Both objects have an image path and factual image alt text. The Santa banner needs to remain a complete 1600 by 720 image without added overlay copy.

```ts
export const ENABLE_SANTAS_SURPRISE_BOX_MENU = false;
export const ENABLE_SANTAS_SURPRISE_BOX_PROMO = true;
```

`ENABLE_SANTAS_SURPRISE_BOX_MENU` controls the festive header item and remains off. `ENABLE_SANTAS_SURPRISE_BOX_PROMO` controls the Home advert independently and is on, so the top-left Santa banner links to the private Santa page while that page remains noindex.

## Editing shows

Every manual show is a plain JSON row in `client/src/content/shows.json`. Add ordinary shows to `shows` and future Santa shows with the same fields to `santaShows`.

```json
{
  "title": "Saturday's MEGA Wheel - Unified Minds ETB",
  "date": "2026-10-17",
  "startTime": "17:00",
  "durationMinutes": 120,
  "ebayShowLink": "https://www.ebay.com.au/ebaylive/events/f56vnvguM8mplgJA",
  "coverImage": "",
  "note": ""
}
```

`title`, `date`, and `startTime` are required for a manual row to appear. Dates use `YYYY-MM-DD`, and start times use 24-hour Sydney local time, such as `17:00` or `19:00`. A missing or blank date or time leaves that manual row out of the page until the details are supplied. `durationMinutes` is used by calendar entries. `coverImage` accepts a supplied 16:9 local path or approved HTTPS URL. An empty cover uses the yellow Tyson placeholder. `note` is an optional approved one-line note.

The earliest future show appears in the compact Next show tile. That tile uses the show cover as a decorative thumbnail, then has a real countdown and a `Set a reminder` event-page action. It intentionally has no calendar controls. The weekly panel excludes a show as soon as its scheduled Sydney start time passes, then orders the remaining future cards from the earliest date and time at the left through later entries at the right. Each card has its own reminder action and Google, Outlook, and `.ics` calendar controls. If there are no usable future show rows, Home shows `Live six nights a week` and no countdown.

## Public eBay Live refresh

The site server reads only the public Ripz Club seller page at `https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2`. The `/api/shows` endpoint parses public event entries only when a title, event URL, and start time can be established. It caches the result for 60 seconds.

Browser scheduling merges accepted public entries with the JSON list. A manual JSON row with the same eBay event URL takes priority. If eBay blocks the request, changes its page, or provides no usable entries, the page safely uses the manual list alone. This source never reads a private eBay account or visitor data. Implementation notes are in `research/ebay-public-shows.md`.

All scheduling and calendar conversions use `Australia/Sydney`. Cards automatically label each date as AEDT or AEST. Google receives Sydney local timestamps plus `ctz=Australia/Sydney`. Outlook receives UTC start and end timestamps. The generated `.ics` file includes Sydney standard and daylight periods.

## Assets and motion

Website assets are stored in `client/public/assets/`.

- `tyson-logo.webp`, `tyson-mark.webp`, `tyson-wordmark.webp`, and `tyson-favicon.png` provide the supplied Tyson brand artwork.
- `lucky-lee.jpg` is the supplied Lucky Lee caricature.
- `mystery-wheel.jpg` is the standard Mystery Wheel advert image.
- `ripzclub-santa-promo-banner.png` is the supplied Santa Home advert, controlled separately from the hidden Santa navigation switch.
- `ripzclub-wheel-clean.mp4` and `ripzclub-timer.mp4` are the decorative Home and How it works loops.
- `ripzclub-snow.mp4` remains restricted to the private Santa treatment.
- `ripzclub-tyson-kennel.mp4` and `ripzclub-tyson-kennel-poster.jpg` form the Meet Lucky Lee Tyson card.

`client/src/components/MotionVideo.tsx` supplies muted, inline H.264 playback with a poster, reduced-motion fallback, and lazy loading for below-the-fold media. Yellow cover and pack panels are placeholders only. Replace them only with supplied show covers, product packaging, or stream imagery.

## Tracking and external links

Every eBay, Discord, Instagram, Facebook, and TikTok interaction calls `client/src/lib/outbound.ts`. It dispatches a `ripzclub:outbound` browser event for a future approved analytics integration. No analytics, ad pixel, payment provider, store platform, email service, or video host is installed.

Current third parties are Google Fonts, Lucide interface icons, Google Calendar, Outlook calendar links, the public eBay Live seller and event pages, Discord, Instagram, Facebook, and TikTok. Event links receive `utm_source=ripzclub-site` while preserving their event path.

## Before publication

Keep the private Santa route unlinked and noindex until approval. Before public launch, remove noindex controls only with authorization, obtain legal checks for small print and Australian Consumer Law wording, confirm any remaining Copy v2 notes, and add approved product imagery and show covers. The Santa page must remain non-transactional until final requirements are supplied.
