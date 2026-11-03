# Ripz Club Round 2 mock-up plan

## Scope

Ripz Club remains a private, noindex mock-up for review. It introduces adult visitors to Lucky Lee's eBay Live show, teaches first-time viewers how the show works, and sends visitors to eBay Live, Discord, and active social channels. It remains non-transactional. The Christmas box stays hidden at the unlinked draft route, and YouTube stays hidden.

Round 2 replaces the first build's visual and motion rules. The precise user-supplied wording from `RipzClubwebsitecopy,v2.pdf` is the source for all live page copy. Square-bracket notes are not displayed. No replacement material will be invented for those notes.

## Content and pages

- **Home:** Replace the title and subline with the Copy v2 hero. Include the supplied buttons and the exact line below them. Replace the single next-show strip with This week's shows. Add Copy v2's three cards, New here? explainer, and closing band.
- **How it works:** Use the Copy v2 headline, intro, five numbered steps, What's on the wheel, Sometimes: rip and ship nights, Safe and simple, Set your limit first, For the watchers, and Before you bid: the practical bits. The first step contains the supplied eBay destination. The timer visual appears with step 3 and the wheel visual appears with step 4.
- **Meet Lucky Lee:** Use the Copy v2 headline, approved new Lee story, Tyson card, supplied By the numbers figures, as-of date, and eBay action. Do not render bracketed review notes. Keep the supplied Lee illustration and add a Tyson visual card once the original Tyson logo asset is present.
- **FAQs:** Load all Copy v2 questions and answers under The basics, Bidding and the wheel, Payment and postage, and Play it sensibly. One panel is open at a time. Remove New here? as an FAQ question. The Discord words in the relevant answer link to Discord, exactly in the supplied sentence.
- **Community:** Use Copy v2's headline and body, a Join the Discord action, the Play it sensibly line, and active branded social cards for Instagram, Facebook, TikTok, and Discord. YouTube remains absent.
- **Christmas box:** Retain as a hidden, noindex draft. Use the supplied snow visual as ambient background only. No action, form, checkout, code entry, payment, or public navigation is added.
- **Privacy:** Retain a straightforward Australian draft and update small-print phrasing to Copy v2 where it is supplied.

## This week's shows

The Home panel replaces the earlier static next-show module. It contains six cards, Monday to Saturday, at the supplied default of 7pm in `Australia/Melbourne`. The time-zone label resolves as AEST or AEDT based on date. A client-side schedule helper creates the coming week’s cards, marks the first upcoming card as **Up next**, and moves passed cards to the end as **Finished**, without claiming that a show is presently live.

The schedule lives in one editable content file. It defines the shared 7pm default, one reusable 16:9 cover placeholder, and an empty exceptions array. Meagan can add, replace, or turn off individual dates there without editing page logic. A later real show can override its time, title, note, cover, or eBay action URL. The panel is designed to collapse back to the approved static six-night line only when no real schedule exists. It will not scrape eBay.

No Claude show-cover template arrived. Until it does, the cards will use clear 16:9 show-cover placeholders, not invented stream imagery. The same supplied placeholder is used across the default cards.

## Design direction

**Design movement.** A richer collector’s night-in: dark, cinematic, warm and energetic, with selective colour used to frame anticipation rather than manufacture urgency.

**Core principles.** Establish Tyson as the visual anchor, keep the wheel as a decorative focal point, make each call to action obvious on a phone, and use colour and motion with restraint.

**Colour philosophy.** The specified palette is near-black `#111114` at the base, violet `#8B3DFF` as the primary accent, deep violet `#2A1457` for alternate sections, light violet `#B993FF` for fine highlights, red `#E63946` once per screen, and cyan sampled from the supplied Tyson mark only for tiny detail. Key graphics receive faint violet glows. Cards receive thin violet-gradient borders. Text remains AA contrast or better.

**Layout paradigm.** Home opens on a two-part hero with the animated wheel. The show programme forms a horizontal, touch-scrollable rail on phones and a six-card desktop grid. Subsequent content alternates near-black and deep-violet surfaces, creating a readable editorial sequence rather than a flat block stack.

**Signature elements.** The Tyson logo is used in header, footer, favicon, share image, and the Meet Lee Tyson card. The wheel, timer, and snow clips are contained visual motifs. The desktop-only paw cursor remains a small private interaction detail.

**Interaction philosophy.** Outbound actions remain visibly external. The schedule data is simple and local. FAQs open one answer at a time. Motion is decorative rather than interactive and never suggests a result, a value, a winner, or a live status.

**Animation.** The 851KB, 440×440 H.264 wheel clip plays muted, looped, and inline as the Home hero decoration. The 71KB timer clip is confined to The 20 seconds card and step 3. The 80KB snow clip is a quiet loop behind the private Christmas draft. Videos carry poster-frame fallbacks, have `playsInline`, expose a concise accessible description, pause or fall back when reduced motion is requested, and do not delay first readable content. The raw HTML source is not used because it references the unavailable `logo_transparent.png`; the MP4s are the cross-browser route for Chrome, Safari including iPhone, Edge, and Firefox.

**Typography system.** Sora remains the bold sentence-case display face, with Inter for concise, high-legibility supporting copy. Headings are not all caps. All user-facing wording avoids em dashes.

**Brand essence.** A lively eBay Live wheel show, hosted by Lucky Lee, that feels clear and approachable before the first bid.

**Personality.** Warm, energetic, direct.

**Wordmark and logo.** The supplied Tyson logo now replaces the temporary paw mark in the header, footer, browser icon, and social-sharing metadata. The paw remains only as a desktop cursor, never on touch devices.

## Technical implementation

- Store user-approved Copy v2 wording, social links, show schedule defaults, and date exceptions in clearly named TypeScript content modules.
- Copy the three MP4s into `client/public/assets/` and create static poster frames from the supplied clips.
- Add a reusable decorative `MotionVideo` component that respects reduced motion and falls back to its poster.
- Add an accessible, reusable show schedule component with Melbourne time-zone calculations and no dependence on eBay data.
- Replace temporary interface artwork and Lucide social stand-ins with actual brand social logos where available in the existing icon set.
- Replace temporary paw branding with the Tyson image in all specified places after receiving the original logo asset. Update `app.config.ts` with a durable public Tyson image URL for project metadata, as required for a checkpoint.
- Remove the unused tooltip provider and source-level tooling remnants. If a control is platform-injected in the Manus Preview chrome rather than application source, it cannot be removed from the website itself and will not appear in a published production website.

## Show calendar and Santa template

The Home route adopts the supplied `home_preview.html` structure: a large next-show card first, followed by a weekly card list. It keeps the site’s existing Sora and Inter typography, Tyson branding, and violet, cyan, and red palette rather than switching to the reference file’s Anton sample. Until supplied cover images arrive, every cover position uses an explicit yellow placeholder.

Show data moves to one plain JSON file, with one row per show and the requested `title`, `date`, `startTime`, `durationMinutes`, `ebayShowLink`, and `coverImage` fields. The first configured row is the supplied Saturday event dated 2026-10-17 in Melbourne time, with the supplied title, event page, the confirmed 7pm default, and 120-minute default duration. A separate same-shape Santa array is ready for Lee’s future date. The client derives the earliest future row as the next show and displays `Live six nights a week` when none exists. It does not scrape eBay or create default show titles.

Calendar actions derive their start and end time from Melbourne local time. Google receives local timestamp values plus `ctz=Australia/Melbourne`; Outlook receives calculated UTC timestamps; and the download action creates a real `.ics` file containing the Melbourne time zone standard and daylight periods. The on-page countdown calculates from the selected event timestamp every second, rather than using a simulated value.

The new `/santas-surprise-box` template follows the reference’s dark-red product layout with a red navigation treatment ready for future activation. A named Boolean setting controls whether the navigation button renders and remains `false`. The page stays unlisted, has `noindex`, remains non-transactional, and uses no photos other than Tyson until asset delivery. Its Santa schedule panel reads the same JSON show-object fields and displays a yellow date placeholder while no Santa row exists.

## Compliance and validation

The site keeps noindex metadata and crawler blocking. The Christmas draft stays unlinked, noindex, and non-transactional. The banned terms are excluded from site-visible copy, headings, metadata, alt text, routes, and filenames. All supplied social and eBay destinations retain external-tab behaviour and click instrumentation. The eBay action keeps the approved `utm_source=ripzclub-site` tag after verifying it resolves correctly.

Validation will include TypeScript diagnostics, production build, noindex and route-manifest checks, first-party outbound URL checks, screenshots at phone and desktop widths, and a specific iPhone-sized check of the MP4 `playsInline` and reduced-motion fallback behaviours. The project will be checkpointed but not published.

## Open items

1. **Show-cover template:** no 16:9 Claude cover template was received. The show panel uses an explicitly marked placeholder until it arrives.
2. **Open Copy v2 notes:** review notes, claims needing confirmation, and bracketed annotations stay invisible. No substitute answers have been written.
3. **Source-level versus Preview controls:** no Made with Manus, Edit, or Live updates disconnected strings are present in the website application source, and the application no longer loads a tooltip provider. Unused starter components remain in the repository but are not imported or rendered. Any remaining host Preview chrome is outside site source and is not part of a production build.

## October 17 content and Home correction

The latest brief supersedes prior Home scheduling and copy decisions where they conflict. The current supplied Copy v2 replaces all earlier live wording, without patching older prose. Every square-bracket note stays absent. The Home hero uses the supplied headline and subline; the current Asia comparison, claims about small prizes, any wheel quantity, and `every night but Sunday` wording are removed. All ordinary eBay actions retain `Check us out on eBay Live`. The separate private Santa action retains its supplied wording when that hidden page is reviewed.

Home changes to a compact sequence: a two-column top panel with an editable promo banner and a compact next-show card, then the wheel and main headline, three animated story panels, and This week's shows. The promo data moves to a small JSON content file so its image, headline, line, and destination are editable without changing components. On phones the next-show card precedes the promo. At desktop width the top panel remains below roughly 420 pixels and leaves the hero heading visible without scrolling.

Show data remains a plain JSON list. A row without an explicit real date and start time is ignored rather than receiving a generated show time. Weekly cards use only the real entered rows, sort future entries before recent finished entries, display the real Melbourne time and daylight abbreviation, and omit the timer entirely when no upcoming entry exists. The existing event row stays editable and its specific event destination is retained. The header gains a Shows anchor. The footer loses its extra eBay action.

The old duplicate Christmas draft route is removed. `/santas-surprise-box` remains the single private, noindex template, hidden behind its existing menu switch. Its future menu treatment receives the requested festive light string and bauble details while preserving the off state.

## October 19 Santa banner and show refresh

The Home top section becomes a 320 to 340px two-tile composition. It keeps the Next show tile first on narrow screens. The left tile is a data-driven advert: Mystery Wheel artwork when the hidden Santa route is off, and the supplied Santa banner, shown whole without crop or overlay copy, when the existing Santa menu switch is enabled. Its source stays in a plain JSON file for easy replacement. The simplified Next show tile contains only the label, title, Sydney date and time, a real countdown, the supplied event reminder action, and an internal shows link.

The show JSON remains the manual override source. It stores supplied dates, times, titles, event URLs, duration, and optional cover. Client scheduling moves from Melbourne to `Australia/Sydney`, requires supplied date and time, derives AEDT or AEST from each selected show date, and supports actual past entries as Finished. The weekly panel owns individual reminder and Google, Outlook, and ICS calendar actions. It stays horizontally scrollable on phones and uses a desktop grid.

An unauthenticated server endpoint reads only the public Ripz Club eBay Live seller page. It accepts an automated entry only when an explicit title, event URL, and date and time can be established, caches results for 60 seconds, and sends no private or visitor data to eBay. The browser merges that response with manual rows by event URL, preserving manual fields as overrides and safely falling back to manual data when eBay changes or blocks the public page.

The supplied Santa banner and Tyson kennel H.264 loop are added as website assets. The kennel loop becomes the decorative Tyson card on Meet Lucky Lee, with a still poster and reduced-motion fallback. The private Santa route, its menu switch, and noindex protections remain unchanged. The active Home advert follows the switch, so the Santa banner is absent while the Santa route remains hidden.

## Discord welcome-panel extension

Add a backend-only Discord interactions module at `/api/discord/interactions`; preserve existing website pages, public configuration allowlist, show reader, static assets, noindex controls, and visual design. Register the module before the general JSON body parser. Use Node's built-in Ed25519 verification against the app's public key, reject unsigned or stale requests, and restrict all member actions to the Ripz Club server and private bot-test channel while testing. The four controls return private rule/help text or add/remove only the clicking member's ordinary zero-permission Show Alerts role. Suppress all mention notifications. Acknowledge slow role operations promptly with a private deferred response and complete their result through Discord's interaction response API. The managed role membership in Discord remains the authoritative durable subscription state; no new queue, database schema, AI service, or third-party moderation app is required.

Keep the existing bot token in protected backend environment input, reusing the saved connector through the platform's secure selection card. Do not retrieve or copy its value into source or configuration. The current deployed backend is on-demand and may sleep; cold starts can exceed Discord's three-second response deadline. Private preview testing is not permanent deployment. Obtain the appropriate owner-approved hosting and publication choice before announcing reliable public operation. Preserve the current no-publication instruction until the owner explicitly approves deploying this backend addition. Public Discord panel placement also remains pending owner approval.

## Approved live welcome and rules

On 19 October 2026 the owner confirmed the private Show Alerts On/Off test succeeded and approved the exact friendly welcome and rules draft for public placement. This authorization covers two messages in existing `welcome-and-rules` channel 1561562395674021989 and backend-only publication through the existing website. It does not authorize public show announcements, reminders, or scheduled events. Add only that public welcome channel to the signed interaction allowlist while preserving private bot-test. Read Rules must return the same approved rules, not the earlier brief test summary. Keep button replies private, preserve the fixed self-only zero-permission subscriber role, suppress all pings, and retain the corrected ten-second post-acknowledgment request timeout.

The existing protected bot token is configured for all runtime environments. Ask the platform for its always-on hosting confirmation before treating the handler as ready for public operation. After the confirmed hosting state and a successful backend deployment, move Discord's callback from Preview to the published origin and require Discord's validation before posting the public panel and rules. Website pages and assets remain unchanged. If hosting or publication is declined or fails, keep public buttons unpublished and report the blocker without a keep-alive workaround.

## Optional collecting-category controls

The owner requested automated self-assignment of favourite collecting categories. Reuse the existing signed HTTP button handler rather than adding a reaction-event bot or another service. Start with Pokémon, Sports Cards, Other TCGs and Other Collectibles as optional badges, with separate Add and Remove controls for each category and support for multiple selections or no selection. The new panel belongs in existing welcome-and-rules, with a private bot-test preview. Keep each category role unmanaged, unmentionable and permission-free; add no channel access overrides. Do not assign roles on join or change Show Alerts.

Store only the explicit created role IDs and button IDs in a backend-only collecting-role module. Reuse the existing signature/application/server/channel checks and deferred ephemeral responses, and validate the fixed target role still has zero permissions before each add/remove. Role data and target user IDs must never come from button payloads. Discord membership remains the durable authoritative state, and individual PUT/DELETE role endpoints preserve other roles. Preserve the current welcome/rules/help/Show Alerts behavior, private-channel access, native AutoMod and all website-visible source. Publish only this backend extension through the already approved always-on website, then post the no-ping optional-interest panel after deployment success. No new scheduler, database, gateway service, privileged role or automated category ping is introduced.
