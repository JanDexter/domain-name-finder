# NAMEGRID

Lightweight Nuxt 4 domain search: one name, every TLD, availability checked live
and registrar prices side by side. No UI library, no CSS framework — plain CSS,
bold-border editorial layout.

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Branch Workflow

`dev` is the default working branch for pull requests and testing.
`release` is the published branch and should be connected to Cloudflare Pages
as the production branch for `namegrid.jandexter.me`.

If you connect this repo to Cloudflare Pages directly, set:

- Production branch: `release`
- Preview branch: `dev`

## How it works

| Piece | Source |
| --- | --- |
| Availability | Live authoritative RDAP lookup via `rdap.org` IANA bootstrap and direct registry servers (e.g. Identity Digital for `.io`, `.me`, `.ai`, `.sh`, `.studio`) in `server/utils/availability.ts`. Following redirects ensures compatibility with Cloudflare Pages Functions; 404 = free, 200 = taken (`source: "rdap"`, authoritative). Remaining ccTLDs without RDAP services fall back to a reliable multi-record DoH lookup (`source: "dns"`), checking both NS and SOA records across Cloudflare and Google DoH resolvers to verify zone non-existence before confirming availability. 10-minute in-memory cache, concurrency 8. |
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
