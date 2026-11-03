# Public eBay Live schedule source

- Source: https://www.ebay.com.au/ebaylive/sellers/uyrpxfoktc2
- Checked: 19 October 2026
- The public seller page responded with HTTP 200 to a normal browser-style request.
- Its rendered source contains a `liveEvents` JSON array. Each usable event object exposes an event `id`, `title`, UTC `startTime`, and `previewImage.url`.
- Example event URL shape: `https://www.ebay.com.au/ebaylive/events/<event-id>`.
- The website server can safely derive the Sydney calendar date and start time from an explicit UTC `startTime`, cache the public response for 60 seconds, and reject entries that lack required fields.
- The browser should merge accepted public entries with `client/src/content/shows.json`, treating supplied manual rows as overrides. If the public response is unavailable or changes shape, the website must use manual rows only.
