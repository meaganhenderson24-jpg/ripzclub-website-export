# GoDaddy environment settings: code review

Reviewed 3 November 2026 against GitHub export `6a5d3e9` (website source `1f0148e`). This is a review of what the code needs, not verification of settings saved in GoDaddy. No GoDaddy account settings, production database, DNS or Discord callback were changed.

## The short version

The live website needs production mode and the hosting plan's correct port arrangement. Discord's role buttons also need the bot token. MySQL is needed only if you keep the existing database-backed features. GoDaddy's actual values remain **not verified**.

Use `.env.example` as a list of setting names, not a ready-to-run production configuration. It deliberately contains no credentials.

## Settings to check in GoDaddy

### NODE_ENV

- [ ] Set `NODE_ENV` to `production`, exactly.

`server/_core/index.ts` otherwise treats `development` specially and starts Vite. The intended production command is `node dist/index.js`, run from the application root after building. Node version and startup command are hosting settings, not environment variables: the current Dockerfile uses Node 22 and the repository pins pnpm 10.18.0.

### PORT

- [ ] Confirm how your exact GoDaddy plan routes requests to the application. If it assigns a numeric `PORT`, let that assigned value reach the Node process.

The code reads `PORT`, converts it to a number and accepts integers from 1 to 65535. If absent, it listens on 3000. Do not set 80, 443 or 3000 blindly; use the plan's actual application configuration. A named pipe/socket value is not compatible with the current numeric-port check and would need an application/adapter change.

### DISCORD_BOT_TOKEN

- [ ] Add the existing bot token in protected server-side settings if the Discord buttons are moving to GoDaddy.

This is the only Discord environment variable the current handler reads. Application ID, public verification key, channel IDs and role IDs are currently constants in the source. Creating variables called `DISCORD_CLIENT_ID`, `DISCORD_PUBLIC_KEY` or `DISCORD_GUILD_ID` will not change those constants unless Claude changes the code to read them.

The token is not required to display website pages, but role-management button actions require it. Keep the existing Discord callback active until the new HTTPS callback has passed Discord validation and real button tests.

### DATABASE_URL

- [ ] If keeping the database features, set a private `DATABASE_URL` containing the actual GoDaddy MySQL host, port, full database name and full database-user name.

The format is:

```text
mysql://USER:URL_ENCODED_PASSWORD@HOST:PORT/DATABASE
```

This is a format example, not a usable connection string. Encode username/password components correctly, especially characters such as `@`, `:`, `#`, `%` or `/`. Do not encode the whole URL. Do not include literal placeholder words or angle brackets in the real setting.

The app and Drizzle migration configuration read **only `DATABASE_URL`** for MySQL. They do not read `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `DB_HOST`, `DB_USER` or `DB_PASSWORD`. Setting those separately will not connect this version unless the connection code is changed.

- [ ] Confirm that the database user is assigned to the intended database with the necessary permissions, and that the app host may connect to it. Do not assume `localhost` or a particular port is correct.
- [ ] Confirm GoDaddy's TLS requirements. There is no implemented `MYSQL_SSL`, `DB_SSL` or similar environment flag in this code. If TLS is required, Claude must configure compatible MySQL driver options and the trusted certificate requirements in both runtime and migration connections. Do not disable certificate verification to make a failing connection pass.
- [ ] Ensure the migration command receives the same intended database settings. Settings saved for the running app may not automatically be present in a separate SSH/deployment command. Do not print connection strings in logs.

The current tables are `users` and `email_subscribers`. There is no finished CMS and neither eBay shows nor Discord role membership are stored in these tables. MySQL alone will not create an image-upload dashboard.

## Existing Manus settings: do not copy them blindly

The repository still contains starter modules referencing:

- `MANUS_PROJECT_ID`
- `MANUS_JWT_SECRET`
- `MANUS_OAUTH_API_URL`
- `MANUS_OAUTH_PORTAL_URL`
- `OWNER_OPEN_ID`
- `MANUS_API_URL`
- `MANUS_API_KEY`
- `MANUS_API_BROWSER_KEY`

These are for Manus login/platform helpers, not MySQL configuration. They are not required by the independent eBay reader or Discord interaction handler. The current public pages have no login interface.

An unset `MANUS_OAUTH_API_URL` currently produces a startup warning because the unused authentication SDK is imported. That warning alone does not stop the public website from starting. Do not invent a URL or copy protected platform credentials to silence it. Have Claude remove/disable unused authentication routes and helpers, or deliberately configure a supported authentication solution if one is needed later. Login would require its own complete migration, not merely a new JWT secret.

Backend secrets must never be exposed through frontend code or `/api/platform/config.js`. That endpoint currently uses an explicit public-value allowlist; preserve that boundary.

## Other settings that are not required

`TZ=Australia/Sydney` may be useful for host logs, but the show/calendar code explicitly uses `Australia/Sydney` already. It must not be replaced by a hardcoded UTC offset because daylight saving changes.

There is no `FIRECRAWL_API_KEY`, eBay API credential or Metricool credential required for the current show reader. GitHub deployment credentials, if later needed, belong to the deployment system, not the browser or application source.

## How to prove the settings actually work

- [ ] Restart the Node application after saving protected environment changes; already-running processes may retain old settings.
- [ ] Check startup logs and `/api/health` through the intended HTTPS address. This proves only that the HTTP server responds.
- [ ] For MySQL, use the same application connection settings to execute a private, read-only `SELECT 1`. Verify TLS too if required. Do not add a public database-debug endpoint or print the URL.
- [ ] Back up any needed data, confirm the intended target database, then run the existing `pnpm db:migrate` command once as a controlled migration. A migration writes schema; it is not a read-only connectivity test.
- [ ] Confirm the expected tables exist and test any retained database-backed feature. Merely constructing the Drizzle client does not prove a successful database connection.
- [ ] Check `/api/shows` returns usable verified events with `source: "public"`. This tests outgoing access to eBay, not MySQL.
- [ ] Validate the Discord callback and test role buttons with a consenting test member. That checks the bot token and role permissions; an HTTP health response does not.

## One deployment issue unrelated to environment variables

The current server statically imports the Vite helper module, which imports Vite and its configuration even in production. Vite is listed as a development dependency. Installing only production dependencies can therefore prevent startup. Claude must separate the development-only imports or ensure the required dependencies remain installed, then test the actual production build. Changing environment variables alone does not resolve this.

## What is still needed from GoDaddy

To verify the live configuration, provide the exact hosting-plan name and a screenshot of the Node setup showing the Node version, application root, startup command and variable names. Hide bot tokens, database URLs, passwords and all other secret values. A screenshot can verify names and visible non-secret settings, but an on-host connectivity test is still needed to prove private MySQL values work.
