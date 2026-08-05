# NAMEGRID

Lightweight Nuxt 4 domain search: one name, every TLD, availability checked live
and registrar prices side by side. No UI library, no CSS framework — plain CSS,
bold-border editorial layout.

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## How it works

| Piece | Source |
| --- | --- |
| Availability | Live RDAP lookup via `rdap.org` bootstrap (`server/utils/availability.ts`). 302 → registry RDAP; 404 there = free, 200 = taken (`source: "rdap"`, authoritative). TLDs with no RDAP service — many ccTLDs, incl. `.co` `.me` `.io` — fall back to a Cloudflare DoH NS lookup (`source: "dns"`, shown as "Likely …" with a dashed badge); NXDOMAIN is a strong but not certain signal. 10-minute in-memory cache, concurrency 8. |
| Prices | Local reference table (`server/utils/pricing.ts`): per-TLD baseline × per-registrar markup, with a first-year promo factor. **Estimates, not live quotes.** |

Registrars do not publish free price APIs. To make pricing live, replace
`quotesFor()` with per-registrar API calls (Namecheap, Dynadot, GoDaddy and
Porkbun all have keyed APIs) and keep the same `Quote` shape.

## API

```
GET /api/search?q=northwind&tld=popular&sort=price&variants=0
GET /api/meta
```

`tld`: `popular` | `all` | a single TLD. `sort`: `price` | `renew` | `name`.
Candidates capped at 36 per search.

## Layout

```
app/pages/index.vue     hero, search panel, result rows, price tables
app/app.vue             masthead + footer shell
app/assets/css/main.css design system (colours, borders, grid)
server/api/             search + meta endpoints
server/utils/           availability (RDAP) + pricing model
```
