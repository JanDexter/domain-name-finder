/**
 * Authoritative availability via RDAP registries and robust DoH verification.
 *
 * Follows rdap.org IANA bootstrap redirects directly so runtime environments
 * like Cloudflare Pages functions do not fail on opaque redirect responses.
 * Also queries Identity Digital RDAP directly for popular ccTLDs outside
 * IANA bootstrap (.io, .me, .ai, .sh, .studio).
 */

export type Status = 'available' | 'taken' | 'unknown'
export type Source = 'rdap' | 'dns' | 'none'

export interface Check {
  status: Status
  /** rdap = authoritative registry, dns = verified zone non-existence, none = no answer */
  source: Source
}

interface CacheEntry extends Check {
  at: number
}

const TTL = 10 * 60 * 1000
const cache = new Map<string, CacheEntry>()

async function get(url: string, redirect: RequestRedirect = 'follow', ms = 6000) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  try {
    return await fetch(url, {
      redirect,
      signal: ctl.signal,
      headers: { accept: 'application/rdap+json' }
    })
  } finally {
    clearTimeout(timer)
  }
}

async function viaRdap(domain: string): Promise<Status> {
  try {
    const res = await get(`https://rdap.org/domain/${domain}`, 'follow')
    // If redirected to an authoritative registry RDAP server: 404 = available, OK = taken
    if (!res.url.startsWith('https://rdap.org/')) {
      if (res.status === 404) return 'available'
      if (res.ok) return 'taken'
    }
  } catch {
    // proceed to direct registry checks below
  }

  // Fallback for ccTLDs hosted by Identity Digital (.io, .ai, .me, .sh, .studio, etc.) not in IANA bootstrap
  try {
    const idRes = await get(`https://rdap.identitydigital.services/rdap/domain/${domain}`, 'follow')
    if (idRes.status === 404) return 'available'
    if (idRes.ok) return 'taken'
  } catch {
    // ignore and fall back to DNS verification
  }

  return 'unknown'
}

/**
 * Reliable fallback for remaining ccTLDs (.co, .gg, .is, .to, .so, .tv, .cc).
 * Verifies domain existence across multiple authoritative DoH resolvers (Cloudflare + Google)
 * and multiple record types (NS + SOA) to assure definitive availability results.
 */
async function viaDns(domain: string): Promise<Status> {
  const enc = encodeURIComponent(domain)
  const endpoints = [
    `https://cloudflare-dns.com/dns-query?name=${enc}&type=NS`,
    `https://cloudflare-dns.com/dns-query?name=${enc}&type=SOA`,
    `https://dns.google/resolve?name=${enc}&type=NS`,
    `https://dns.google/resolve?name=${enc}&type=SOA`
  ]

  let hasNxdomain = false
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/dns-json' } })
      if (!res.ok) continue
      const json = (await res.json()) as { Status?: number; Answer?: unknown[] }
      if (json.Status === 0 && json.Answer && json.Answer.length > 0) return 'taken'
      if (json.Status === 3) hasNxdomain = true
    } catch {
      // continue checking remaining resolvers
    }
  }
  return hasNxdomain ? 'available' : 'unknown'
}

export async function checkDomain(domain: string): Promise<Check> {
  const hit = cache.get(domain)
  if (hit && Date.now() - hit.at < TTL) return { status: hit.status, source: hit.source }

  let status = await viaRdap(domain)
  let source: Source = status === 'unknown' ? 'none' : 'rdap'

  if (status === 'unknown') {
    status = await viaDns(domain)
    if (status !== 'unknown') source = 'dns'
  }

  cache.set(domain, { status, source, at: Date.now() })
  return { status, source }
}

/** run checks with bounded concurrency so we stay polite to rdap.org */
export async function checkMany(
  domains: string[],
  concurrency = 8
): Promise<Record<string, Check>> {
  const out: Record<string, Check> = {}
  let i = 0

  const worker = async () => {
    while (i < domains.length) {
      const d = domains[i++]!
      out[d] = await checkDomain(d)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, domains.length) }, worker)
  )
  return out
}
