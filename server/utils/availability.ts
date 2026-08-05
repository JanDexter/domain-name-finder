/**
 * Availability via RDAP (free, no API key, no rate-limit signup).
 *
 * rdap.org is the IANA bootstrap redirector: it 302s to the registry's own
 * RDAP server when one exists. Following that redirect, 404 = unregistered,
 * 200 = registered. A 404 straight from rdap.org means the TLD has no RDAP
 * service, so the answer is genuinely unknown rather than "available".
 */

export type Status = 'available' | 'taken' | 'unknown'
export type Source = 'rdap' | 'dns' | 'none'

export interface Check {
  status: Status
  /** rdap = authoritative, dns = inferred, none = no answer */
  source: Source
}

interface CacheEntry extends Check {
  at: number
}

const TTL = 10 * 60 * 1000
const cache = new Map<string, CacheEntry>()

async function get(url: string, redirect: RequestRedirect, ms = 6000) {
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
    const boot = await get(`https://rdap.org/domain/${domain}`, 'manual')

    if (boot.status >= 300 && boot.status < 400) {
      const target = boot.headers.get('location')
      if (!target) return 'unknown'
      const res = await get(target, 'follow')
      if (res.status === 404) return 'available'
      if (res.ok) return 'taken'
      return 'unknown'
    }
    // a 404 from the bootstrap itself means the TLD has no RDAP service
    if (boot.ok) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Fallback for TLDs outside RDAP (many ccTLDs: .co, .me, .io, .gg …).
 * NXDOMAIN means the name is not in the zone, which usually — but not
 * always — means unregistered, so callers surface it as inferred.
 */
async function viaDns(domain: string): Promise<Status> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`,
      { headers: { accept: 'application/dns-json' } }
    )
    if (!res.ok) return 'unknown'
    const json = (await res.json()) as { Status?: number; Answer?: unknown[] }
    if (json.Status === 3) return 'available'
    if (json.Status === 0) return 'taken'
    return 'unknown'
  } catch {
    return 'unknown'
  }
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
