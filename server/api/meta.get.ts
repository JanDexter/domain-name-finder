import { ALL_TLDS, DEFAULT_TLDS, PRICES_UPDATED, REGISTRARS } from '../utils/pricing'

export default defineEventHandler(() => ({
  tlds: ALL_TLDS,
  popular: DEFAULT_TLDS,
  registrars: REGISTRARS.map((r) => ({ id: r.id, name: r.name, note: r.note })),
  updated: PRICES_UPDATED
}))
