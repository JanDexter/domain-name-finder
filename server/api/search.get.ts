import { checkMany, type Source, type Status } from '../utils/availability'
import {
  ALL_TLDS,
  DEFAULT_TLDS,
  PRICES_UPDATED,
  TLD_BASE,
  quotesFor,
  type Quote
} from '../utils/pricing'

const VARIANTS = ['get', 'try', 'use', 'my', 'go', 'hq', 'app']
const MAX_CANDIDATES = 36

export interface Result {
  domain: string
  name: string
  tld: string
  status: Status
  source: Source
  quotes: Quote[]
  best: Quote | null
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const raw = String(q.q ?? '').trim()
  const tldParam = String(q.tld ?? 'popular')
  const variants = String(q.variants ?? '') === '1'
  const sort = String(q.sort ?? 'price')

  if (!raw) {
    return { query: '', results: [], updated: PRICES_UPDATED }
  }

  // "acme.io" pins that TLD to the front of the list
  const [rawName, rawTld] = raw.includes('.') ? raw.split('.') : [raw, '']
  const name = slug(rawName ?? '')
  const pinned = slug(rawTld ?? '')

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid name' })
  }

  let tlds: string[]
  if (tldParam === 'all') tlds = ALL_TLDS
  else if (TLD_BASE[tldParam]) tlds = [tldParam]
  else tlds = [...DEFAULT_TLDS]

  if (pinned && TLD_BASE[pinned]) {
    tlds = [pinned, ...tlds.filter((t) => t !== pinned)]
  }

  const names = [name]
  if (variants) {
    for (const v of VARIANTS) names.push(`${v}${name}`)
    names.push(`${name}app`, `${name}hq`)
  }

  const candidates: { name: string; tld: string; domain: string }[] = []
  // interleave so variants never crowd out the primary name's TLDs
  for (const t of tlds) {
    for (const n of names) {
      if (candidates.length >= MAX_CANDIDATES) break
      candidates.push({ name: n, tld: t, domain: `${n}.${t}` })
    }
  }

  const statuses = await checkMany(candidates.map((c) => c.domain))

  const results: Result[] = candidates.map((c) => {
    const quotes = quotesFor(c.tld, c.domain)
    const check = statuses[c.domain] ?? { status: 'unknown' as Status, source: 'none' as Source }
    return {
      domain: c.domain,
      name: c.name,
      tld: c.tld,
      status: check.status,
      source: check.source,
      quotes,
      best: quotes[0] ?? null
    }
  })

  const rank: Record<Status, number> = { available: 0, unknown: 1, taken: 2 }
  results.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status]
    if (sort === 'name') return a.domain.localeCompare(b.domain)
    if (sort === 'renew') return (a.best?.renew ?? 1e9) - (b.best?.renew ?? 1e9)
    return (a.best?.first ?? 1e9) - (b.best?.first ?? 1e9)
  })

  return {
    query: raw,
    count: results.length,
    available: results.filter((r) => r.status === 'available').length,
    updated: PRICES_UPDATED,
    results
  }
})
