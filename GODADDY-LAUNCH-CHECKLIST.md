# Ripz Club: GoDaddy launch checklist

Prepared for Meg, 3 November 2026. Based on the inspected website code at `1f0148e`.

**The simple version:** GitHub is the filing cabinet, Claude is the editor, and GoDaddy is the shopfront. Saving code to GitHub does not put it live until GoDaddy receives, builds and starts that version.

This is a preparation checklist, not a completed migration. The exact GoDaddy plan and application setup still need checking.

Environment review: see `GODADDY-ENVIRONMENT-REVIEW.md` and the credential-free `.env.example`. Variable requirements have been checked against the code; actual GoDaddy values have not been verified.

## 1. Put the right code in the filing cabinet

- [x] Export the latest website to `meaganhenderson24-jpg/ripzclub-website-export`. The source snapshot was uploaded as `6a5d3e9`. Preserve any later work Claude adds; do not force-push over it.
- [ ] Include the complete application, images, videos, dependency lockfile and existing database migration files, not just the built pages.
- [ ] Keep passwords, bot tokens and `.env` files out of GitHub. Review repository visibility and sensitive files before uploading.
- [ ] Make this GitHub repository the agreed working copy for Claude. Do not keep making separate, unmerged changes in Manus.

**Done means:** Claude can open the correct repository and identify the version being deployed.

## 2. Check GoDaddy can run this particular app

- [ ] Confirm Node.js 22, the version used by the current Dockerfile, or explicitly test a supported alternative. The app currently uses modern Node features, including `import.meta.dirname` and built-in `fetch`.
- [ ] Confirm the hosting supports an always-running Node application, HTTPS, protected environment settings, outgoing HTTPS requests and automatic restart after a crash. Node support alone does not confirm all of these.
- [ ] Confirm how the plan starts an app and connects the public domain to its assigned port. Do not assume the Dockerfile is used by that plan.

**Done means:** the host can serve both the pages and the backend, including when nobody has a browser open.

## 3. Give the app its private settings

- [ ] Set `NODE_ENV=production`. Confirm the host's assigned numeric `PORT`; the code falls back to 3000 but that is not proof the host routes traffic there.
- [ ] Add `DISCORD_BOT_TOKEN` through protected hosting settings. Do not paste it into chat, frontend code or GitHub.
- [ ] If keeping the database features, create a GoDaddy MySQL database/user and securely set `DATABASE_URL` in `mysql://USER:URL_ENCODED_PASSWORD@HOST:PORT/DATABASE` format using actual private values. Separate `MYSQL_*` or `DB_*` settings are not read by this version. Confirm the host's connection and TLS requirements in both runtime and migration settings.
- [ ] Have Claude audit the unused Manus login, storage and email-capture scaffolding. Remove or replace what is not needed. Do not assume Manus platform credentials or managed services transfer with the code.
- [ ] Restart the Node app after changing its environment. Do not publish secrets through frontend variables or `/api/platform/config.js`.

**Done means:** GoDaddy has its own settings, without depending on this Manus session.

## 4. Build and start a test copy first

- [ ] Install the pinned dependencies with `pnpm install --frozen-lockfile`, using pnpm `10.18.0` as declared in the repository.
- [ ] Run `pnpm check`, `pnpm test` and `pnpm build`. Resolve failures before launch.
- [ ] Configure production startup to run `node dist/index.js` with `NODE_ENV=production`. The build creates backend code in `dist/index.js` and website files in `dist/public`.
- [ ] Do not upload only `dist/public`: that would omit the show reader and Discord callback. Do not run the development server as the live service.
- [ ] Check production dependencies carefully. The current server imports Vite helpers even in production, although Vite is a development dependency. Claude should separate those imports or verify the full installed dependency set supports startup before pruning packages.
- [ ] On the test address, confirm `/api/health` returns a successful JSON response and refreshing an interior page such as `/meet-lee` works.

**Done means:** the production build actually runs on GoDaddy, not just on Claude's computer.

## 5. Decide what to do with the database

- [ ] Confirm whether any existing user or email-subscriber records need preserving. The current visible website has no login or email signup interface, so a new customer database is not required just to display its pages.
- [ ] If keeping those features, back up any existing data, create the required tables using the committed migrations and import only the data you need. The existing migration command is `pnpm db:migrate`.
- [ ] Test the actual application database settings with a private read-only `SELECT 1`, then verify the required tables and retained features. `/api/health` does not test MySQL and the Drizzle client is created lazily. Ensure migration commands receive the intended environment too. Keep backups private and set up scheduled backups if retaining business data.

**Done means:** no needed records are left behind and no live feature points to the wrong database.

## 6. Check the eBay shows still update

- [ ] Confirm GoDaddy can fetch the public seller page and that `/api/shows` returns JSON with `source: "public"` and verified shows. A fallback response is not proof that scraping works.
- [ ] Confirm titles, covers, dates, event links and AEDT/AEST times display correctly. Keep the existing `Australia/Sydney` conversion, which currently matches Melbourne time.
- [ ] Confirm the earliest future show is selected, past shows disappear, and the upcoming list is chronological. Check calendar downloads too.
- [ ] Review manual show overrides after a reschedule so an old date does not hide an event. Check how the page behaves if eBay cannot be read.

**How it works:** ordinary server-side HTTP fetching and parsing of eBay's embedded `liveEvents` data, not Firecrawl. The server cache lasts 60 seconds; an open website checks the endpoint every minute. It is not a background social-posting service.

**Done means:** the feed works from GoDaddy itself, without requiring Manus to run.

## 7. Move the existing Discord app, not the whole community

- [ ] Keep the existing Discord application, bot, server, roles, channel IDs and button identifiers. Moving hosting does not require rebuilding the Discord server or reposting its messages.
- [ ] Deploy the callback at the new HTTPS address, for example `https://ripz.club/api/discord/interactions`, and install the existing bot token securely. Confirm the application's public verification key is still correct.
- [ ] Preserve signature verification and raw request bodies. The endpoint must remain reachable without a login or browser challenge, and it must acknowledge interactions within Discord's deadline.
- [ ] Keep the old Manus callback running while preparing the replacement. Only change the Discord Developer Portal's **Interactions Endpoint URL** after the new endpoint is reachable. Let Discord validate it.
- [ ] Test Read Rules, Get Help, Show Alerts On/Off, and each collecting-interest Add/Remove button using a consenting test member. Check private replies and that unrelated roles remain untouched.
- [ ] Keep the bot above the ordinary roles it manages, with the required role-management permission. Do not grant Administrator just to make it work.
- [ ] Keep the old callback available as a rollback option until the move is verified. Do not stop the working Manus service prematurely.

**Done means:** existing Discord buttons work through GoDaddy. This does not enable automatic show announcements or Metricool posting.

## 8. Finish the public-facing website

- [ ] Replace approved pack-shot and stream-image placeholders, and check mobile layouts, navigation, image loading and reduced-motion behaviour.
- [ ] Confirm every page-changing navigation link opens at the top of the destination page. Test eBay, Discord and social links.
- [ ] Review draft privacy/legal wording and responsible-bidding copy before public launch.
- [ ] Choose deliberately what happens to Santa's Surprise Box. Its menu is currently off, but its Home banner is on and links to the page. `noindex` is not a privacy lock; add real access protection if it must remain private.
- [ ] When public pages are approved for search, update the HTML robots tag, `RouteMeta` defaults, `robots.txt`, sitemap and canonical/share URLs together. Keep unfinished pages excluded.

**Done means:** the approved site is ready for visitors, with no accidental draft exposure or unwanted search blocking.

## 9. Switch on the domain safely

- [ ] Save the existing DNS settings and record a working rollback route.
- [ ] Point the intended website records to the GoDaddy application using the hosting account's actual instructions. Preserve email records, including MX, SPF, DKIM and DMARC.
- [ ] Confirm HTTPS works on the chosen main domain and redirects are correct for its other version, such as `www`.
- [ ] Test the real domain on a phone and computer: main pages, interior-page refresh, show feed, images, calendar downloads and Discord callback.
- [ ] Record the deployed Git commit and verify the GoDaddy restart and backup procedures.

**Done means:** visitors reach the tested production version and there is a way back if something breaks.

## 10. Keep making changes without breaking the live site

- [ ] Agree this routine: **Claude edits a branch → test → approve/merge to main → deploy on GoDaddy → restart if required → smoke-test.** GitHub does not perform deployment by itself.
- [ ] Set up the deployment method your exact GoDaddy plan supports. It may be manual initially; automatic deployment is an additional setup step.
- [ ] Keep a test environment and an easy previous-version rollback. Avoid editing production files directly.
- [ ] Decide whether you want a real CMS. The current site has organised copy/data files and image folders, but no finished admin dashboard for uploading pack shots.

**Done means:** publishing an edit is a repeatable process, not a rebuild from scratch.

## Handy map for Claude

- Copy, brand links and Santa visibility switches: `client/src/lib/site.ts`
- Home promotional image settings: `client/src/content/home-promo.json`
- Manual show rows and Santa show rows: `client/src/content/shows.json`
- Pack-shot placeholders: `client/src/pages/ContentPages.tsx` and `client/src/pages/SantasSurpriseBox.tsx`
- Santa landing-page template: `client/src/pages/SantasSurpriseBox.tsx`
- Image and video files: `client/public/assets/`
- eBay server reader: `server/ebayLiveShows.ts`
- Show merging, date conversion and calendars: `client/src/lib/showSchedule.ts`
- Discord callback and category controls: `server/discordWelcome.ts` and `server/discordCollectingRoles.ts`
- Server entrypoint: `server/_core/index.ts`
- Database schema and migrations: `drizzle/schema.ts` and `drizzle/`

**Do not change yet:** GoDaddy DNS, the working Discord callback, bot credentials or live data until the replacement has been tested. This checklist does not authorise an unreviewed cutover.
