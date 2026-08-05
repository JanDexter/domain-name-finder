/**
 * Reference pricing model.
 *
 * Base data is from ICANN registry costs + recent registrar public pricing.
 * Registrars do not expose free public price APIs, so this is a local
 * reference table: a per-TLD baseline (roughly registry cost + ICANN fee)
 * combined with a per-registrar markup and first-year promo factor.
 * Numbers are indicative, not live quotes.
 *
 * To integrate live pricing:
 * 1. Namecheap: https://api.namecheap.com/
 * 2. Dynadot: https://www.dynadot.com/api/
 * 3. GoDaddy: https://developer.godaddy.com/
 * 4. Porkbun: https://porkbun.com/api/json/v3/documentation
 *
 * Replace `quotesFor()` with per-registrar API calls when you have credentials.
 */

export const PRICES_UPDATED = '2026-08-05'

export interface Registrar {
  id: string
  name: string
  /** renewal multiplier applied to the TLD baseline */
  markup: number
  /** first-year multiplier applied to the renewal price */
  promo: number
  /** if set, the promo only applies to these TLDs — elsewhere year 1 = renewal */
  promoTlds?: string[]
  /** TLDs this registrar does not sell */
  excludes?: string[]
  /** search URL template, {domain} replaced */
  link: string
  note?: string
}

/** the TLDs registrars actually run loss-leader first-year promos on */
const PROMO_HEAVY = [
  'com',
  'net',
  'org',
  'xyz',
  'site',
  'online',
  'store',
  'shop',
  'space',
  'fun',
  'live',
  'digital',
  'cloud',
  'link',
  'page',
  'blog',
  'world'
]

export const REGISTRARS: Registrar[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    markup: 1.0,
    promo: 1.0,
    excludes: ['ai', 'gg', 'sh', 'so', 'is', 'to', 'ninja'],
    link: 'https://dash.cloudflare.com/?to=/:account/domains/register/{domain}',
    note: 'At-cost, no first-year discount, no upsells'
  },
  {
    id: 'porkbun',
    name: 'Porkbun',
    markup: 1.07,
    promo: 0.82,
    link: 'https://porkbun.com/checkout/search?q={domain}',
    note: 'Free WHOIS privacy + SSL'
  },
  {
    id: 'namesilo',
    name: 'NameSilo',
    markup: 1.09,
    promo: 0.93,
    link: 'https://www.namesilo.com/domain/search-domains?query={domain}',
    note: 'Flat pricing, free privacy'
  },
  {
    id: 'dynadot',
    name: 'Dynadot',
    markup: 1.13,
    promo: 0.8,
    promoTlds: [...PROMO_HEAVY, 'dev', 'app', 'me', 'tech'],
    link: 'https://www.dynadot.com/domain/search?domain={domain}',
    note: 'Bulk tools, decent API'
  },
  {
    id: 'namecheap',
    name: 'Namecheap',
    markup: 1.18,
    promo: 0.6,
    promoTlds: PROMO_HEAVY,
    link: 'https://www.namecheap.com/domains/registration/results/?domain={domain}',
    note: 'Aggressive year 1, higher renewal'
  },
  {
    id: 'spaceship',
    name: 'Spaceship',
    markup: 1.05,
    promo: 0.7,
    excludes: ['gg', 'sh'],
    link: 'https://www.spaceship.com/domain-search/?query={domain}',
    note: 'Low renewals, free privacy'
  },
  {
    id: 'gandi',
    name: 'Gandi',
    markup: 1.5,
    promo: 1.0,
    link: 'https://shop.gandi.net/domain/suggest?search={domain}',
    note: 'EU registrar, premium support'
  },
  {
    id: 'hover',
    name: 'Hover',
    markup: 1.38,
    promo: 0.95,
    excludes: ['gg', 'sh', 'so'],
    link: 'https://www.hover.com/domains/results?q={domain}',
    note: 'No upsells, clean UI'
  },
  {
    id: 'godaddy',
    name: 'GoDaddy',
    markup: 1.55,
    promo: 0.25,
    promoTlds: PROMO_HEAVY,
    link: 'https://www.godaddy.com/domainsearch/find?domainToCheck={domain}',
    note: 'Cheap year 1, steep renewal + add-ons'
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    markup: 1.42,
    promo: 1.0,
    excludes: ['ai', 'gg', 'sh', 'so', 'is', 'to'],
    link: 'https://domains.squarespace.com/domain-search?query={domain}',
    note: 'Ex Google Domains'
  }
]

/** baseline annual price in USD before registrar markup */
export const TLD_BASE: Record<string, number> = {
  com: 10.6,
  net: 12.9,
  org: 12.2,
  co: 27.0,
  io: 42.0,
  ai: 70.0,
  dev: 13.5,
  app: 14.5,
  sh: 34.0,
  gg: 62.0,
  so: 38.0,
  is: 46.0,
  me: 18.5,
  tv: 34.0,
  cc: 11.5,
  to: 55.0,
  xyz: 11.0,
  tech: 42.0,
  site: 28.0,
  online: 32.0,
  store: 48.0,
  shop: 30.0,
  cloud: 20.0,
  digital: 30.0,
  studio: 26.0,
  agency: 22.0,
  design: 42.0,
  page: 12.0,
  link: 10.5,
  live: 26.0,
  world: 30.0,
  space: 22.0,
  fun: 26.0,
  blog: 26.0,
  wiki: 30.0,
  ninja: 16.0,
  cool: 26.0,
  build: 60.0,
  chat: 30.0,
  team: 26.0,
  works: 26.0,
  group: 18.0
}

export const DEFAULT_TLDS = [
  'com',
  'io',
  'ai',
  'co',
  'dev',
  'app',
  'net',
  'org',
  'xyz',
  'me',
  'sh',
  'studio'
]

export const ALL_TLDS = Object.keys(TLD_BASE).sort()

export interface Quote {
  registrar: string
  registrarId: string
  first: number
  renew: number
  link: string
  note?: string
}

const round = (n: number) => Math.round(n * 100) / 100

/** quotes for one TLD, cheapest first year first */
export function quotesFor(tld: string, domain: string): Quote[] {
  const base = TLD_BASE[tld]
  if (!base) return []

  return REGISTRARS.filter((r) => !r.excludes?.includes(tld))
    .map((r) => {
      const renew = round(base * r.markup)
      const promo = !r.promoTlds || r.promoTlds.includes(tld) ? r.promo : 1
      // promos are capped so cheap TLDs never go below a plausible floor
      const first = round(Math.max(renew * promo, base * 0.08 + 0.9))
      return {
        registrar: r.name,
        registrarId: r.id,
        first,
        renew,
        link: r.link.replace('{domain}', encodeURIComponent(domain)),
        note: r.note
      }
    })
    .sort((a, b) => a.first - b.first || a.renew - b.renew)
}
