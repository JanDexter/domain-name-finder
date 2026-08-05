import { ALL_TLDS, DEFAULT_TLDS, PRICES_UPDATED, REGISTRARS } from '../utils/pricing'

export default defineEventHandler((event) => {
  const headers = getRequestHeaders(event)
  const country = (headers['cf-ipcountry'] || headers['x-country'] || headers['x-vercel-ip-country'] || headers['cloudfront-viewer-country'] || '') as string

  return {
    tlds: ALL_TLDS,
    popular: DEFAULT_TLDS,
    registrars: REGISTRARS.map((r) => ({ id: r.id, name: r.name, note: r.note })),
    updated: PRICES_UPDATED,
    country: typeof country === 'string' ? country.toUpperCase() : ''
  }
})
