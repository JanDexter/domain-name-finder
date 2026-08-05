<script setup lang="ts">
interface Quote {
  registrar: string
  registrarId: string
  first: number
  renew: number
  link: string
  note?: string
}

interface Result {
  domain: string
  name: string
  tld: string
  status: 'available' | 'taken' | 'unknown'
  source: 'rdap' | 'dns' | 'none'
  quotes: Quote[]
  best: Quote | null
}

interface SearchResponse {
  query: string
  count: number
  available: number
  updated: string
  results: Result[]
}

type SupportedCurrency = 'USD' | 'EUR' | 'GBP'
type SupportedLanguage = 'en' | 'es'

const { data: meta } = await useFetch('/api/meta')
const language = useState<SupportedLanguage>('language')
const currency = useState<SupportedCurrency>('currency')

const labels = computed(() => {
  const copy = {
    en: {
      heroTitle: ['Find a', 'domain.'],
      heroText:
        'Search one name across every extension, see what is actually free, and compare the first-year and renewal price at ten registrars side by side — before you hand over a card.',
      searchPlaceholder: 'Search a name, e.g. northwind',
      filter: 'Filter',
      popularTlds: 'Popular TLDs',
      everyTld: 'Every TLD we price',
      sortFirstYear: 'Cheapest first year',
      sortRenewal: 'Cheapest renewal',
      sortName: 'Name A–Z',
      clear: 'Clear',
      variants: 'Include name variants (get-, try-, -app, -hq)',
      pricesUpdated: 'Prices are reference estimates updated',
      registrars: 'registrars',
      empty: 'Type a name above. Availability is checked live over RDAP; prices come from the reference table.',
      searchFailed: 'Search failed. Try again.',
      availableOf: 'available of',
      checked: 'checked',
      noPricing: 'No pricing',
      open: 'Open →',
      close: 'Close',
      prices: 'Prices',
      registrar: 'Registrar',
      firstYear: 'First year',
      renewal: 'Renewal',
      notes: 'Notes',
      go: 'Go',
      howTitle: 'How it works',
      twoSources: 'Two data sources',
      availability: 'Availability',
      availabilityText:
        'is live. Each candidate is looked up over RDAP, the registry protocol that replaced WHOIS — that answer is authoritative. TLDs with no RDAP service (many ccTLDs: .co, .me, .io) fall back to a DNS lookup and are labelled “likely”, with a dashed badge, because a registered name with no nameservers looks the same as a free one.',
      pricing: 'Pricing',
      pricingText:
        'comes from a local reference table (server/utils/pricing.ts): a per-TLD baseline plus a per-registrar markup and promo factor. Registrars have no free public price API, so swap that file for real API calls once you hold credentials.'
    },
    es: {
      heroTitle: ['Encuentra', 'un dominio.'],
      heroText:
        'Busca un nombre en todas las extensiones, mira qué está realmente libre y compara el precio del primer año y la renovación en diez registradores antes de pagar.',
      searchPlaceholder: 'Busca un nombre, por ejemplo northwind',
      filter: 'Filtro',
      popularTlds: 'TLD populares',
      everyTld: 'Todos los TLD que valoramos',
      sortFirstYear: 'Más barato primer año',
      sortRenewal: 'Renovación más barata',
      sortName: 'Nombre A–Z',
      clear: 'Limpiar',
      variants: 'Incluir variantes (get-, try-, -app, -hq)',
      pricesUpdated: 'Precios de referencia actualizados',
      registrars: 'registradores',
      empty: 'Escribe un nombre arriba. La disponibilidad se comprueba en vivo por RDAP; los precios vienen de la tabla de referencia.',
      searchFailed: 'La búsqueda falló. Intenta otra vez.',
      availableOf: 'disponibles de',
      checked: 'comprobados',
      noPricing: 'Sin precio',
      open: 'Abrir →',
      close: 'Cerrar',
      prices: 'Precios',
      registrar: 'Registrador',
      firstYear: 'Primer año',
      renewal: 'Renovación',
      notes: 'Notas',
      go: 'Ir',
      howTitle: 'Cómo funciona',
      twoSources: 'Dos fuentes de datos',
      availability: 'Disponibilidad',
      availabilityText:
        'es en vivo. Cada candidato se consulta por RDAP, el protocolo de registro que reemplazó a WHOIS — esa respuesta es autoritativa. Los TLD sin servicio RDAP (muchos ccTLD: .co, .me, .io) pasan a una consulta DNS y se marcan como “likely”, con una insignia punteada, porque un nombre registrado sin nameservers se ve igual que uno libre.',
      pricing: 'Precio',
      pricingText:
        'sale de una tabla local de referencia (server/utils/pricing.ts): una base por TLD más un margen por registrador y un factor promocional. Los registradores no ofrecen una API pública gratuita, así que cambia ese archivo por llamadas reales cuando tengas credenciales.'
    }
  }

  return copy[language.value ?? 'en']
})

const currencyRates: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79
}

const currencyFormatter = computed(
  () =>
    new Intl.NumberFormat(language.value === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency.value ?? 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
)

const currencyRate = computed(() => currencyRates[currency.value ?? 'USD'])

const term = ref('')
const tld = ref('popular')
const sort = ref('price')
const variants = ref(false)

const pending = ref(false)
const error = ref('')
const data = ref<SearchResponse | null>(null)
const open = ref<string | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function scheduleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!term.value.trim()) {
    data.value = null
    error.value = ''
    open.value = null
    return
  }

  debounceTimer = setTimeout(() => {
    search()
  }, 300)
}

async function search() {
  const q = term.value.trim()
  if (!q) return
  pending.value = true
  error.value = ''
  open.value = null
  try {
    data.value = await $fetch<SearchResponse>('/api/search', {
      query: { q, tld: tld.value, sort: sort.value, variants: variants.value ? 1 : 0 }
    })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || labels.value.searchFailed
    data.value = null
  } finally {
    pending.value = false
  }
}

function clear() {
  if (debounceTimer) clearTimeout(debounceTimer)
  term.value = ''
  tld.value = 'popular'
  sort.value = 'price'
  variants.value = false
  data.value = null
  error.value = ''
  open.value = null
}

function toggle(domain: string) {
  open.value = open.value === domain ? null : domain
}

function money(n: number) {
  return currencyFormatter.value.format(n * currencyRate.value)
}

const statusLabel: Record<Result['status'], string> = {
  available: 'Available',
  taken: 'Taken',
  unknown: 'Unknown'
}

/** DNS-derived answers are an inference, not a registry fact — say so */
function label(r: Result) {
  if (r.status === 'unknown') return 'Unknown'
  return r.source === 'dns' ? `Likely ${statusLabel[r.status].toLowerCase()}` : statusLabel[r.status]
}

const sourceNote: Record<Result['source'], string> = {
  rdap: 'Registry RDAP',
  dns: 'Inferred from DNS — no RDAP for this TLD',
  none: 'No availability source for this TLD'
}

watch([term, tld, sort, variants], () => scheduleSearch())

watch([language, currency], () => {
  if (term.value.trim()) scheduleSearch()
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <main>
    <!-- hero -->
    <section class="hero">
      <div class="hero-copy">
        <h1>{{ labels.heroTitle[0] }}<br />{{ labels.heroTitle[1] }}</h1>
        <p>
          {{ labels.heroText }}
        </p>
      </div>

      <div class="hero-art">
        <svg viewBox="0 0 800 520" role="img" aria-label="Stylised globe surrounded by domain extensions">
          <circle cx="400" cy="260" r="170" fill="#0b4dd6" />
          <path d="M300 150c60 40 140 40 200 0 40 60 40 160 0 220-60-40-140-40-200 0-40-60-40-160 0-220z" fill="#4cd964" />
          <path d="M230 260h340" stroke="#000" stroke-width="4" />
          <ellipse cx="400" cy="260" rx="80" ry="170" fill="none" stroke="#000" stroke-width="4" />
          <circle cx="400" cy="260" r="170" fill="none" stroke="#000" stroke-width="5" />

          <g stroke="#000" stroke-width="5">
            <rect x="70" y="90" width="150" height="60" rx="30" fill="#ffc72c" />
            <rect x="600" y="130" width="140" height="60" rx="30" fill="#f04e23" />
            <rect x="90" y="380" width="150" height="60" rx="30" fill="#00aeef" />
            <rect x="590" y="360" width="160" height="60" rx="30" fill="#ffffff" />
          </g>

          <g font-family="inherit" font-weight="700" font-size="30" text-anchor="middle">
            <text x="145" y="131">.com</text>
            <text x="670" y="171" fill="#fff">.io</text>
            <text x="165" y="421">.ai</text>
            <text x="670" y="401">.dev</text>
          </g>
        </svg>
        <span class="hero-credit">RDAP + 10 registrars</span>
      </div>
    </section>

    <!-- search panel -->
    <section id="search" class="panel-wrap">
      <form class="panel" @submit.prevent="search">
        <div class="field field-search">
          <input
            v-model="term"
            type="text"
            :placeholder="labels.searchPlaceholder"
            aria-label="Domain name"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" aria-label="Search" :disabled="pending">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5 21 21" />
            </svg>
          </button>
        </div>

        <span class="filter-label">{{ labels.filter }}</span>

        <div class="field field-select">
          <select v-model="tld" aria-label="Extension">
            <option value="popular">{{ labels.popularTlds }}</option>
            <option value="all">{{ labels.everyTld }}</option>
            <option v-for="t in meta?.tlds" :key="t" :value="t">.{{ t }}</option>
          </select>
        </div>

        <div class="field field-select">
          <select v-model="sort" aria-label="Sort by">
            <option value="price">{{ labels.sortFirstYear }}</option>
            <option value="renew">{{ labels.sortRenewal }}</option>
            <option value="name">{{ labels.sortName }}</option>
          </select>
        </div>

        <button type="button" class="clear" @click="clear">{{ labels.clear }}</button>
      </form>

      <p class="hint">
        <label>
          <input
            v-model="variants"
            type="checkbox"
            aria-label="Include name variants"
          />
          {{ labels.variants }}
        </label>
        · {{ labels.pricesUpdated }} {{ meta?.updated }} across
        {{ meta?.registrars?.length }} {{ labels.registrars }}.
      </p>
    </section>

    <!-- results -->
    <section id="results" class="results">
      <div v-if="pending" class="loading-strip" />

      <div v-if="data" class="results-bar">
        <h2>{{ data.query }}</h2>
        <span class="meta">
          {{ data.available }} {{ labels.availableOf }} {{ data.count }} {{ labels.checked }}
        </span>
      </div>

      <p v-if="error" class="empty">{{ error }}</p>

      <p v-else-if="!data && !pending" class="empty">
        {{ labels.empty }}
      </p>

      <div v-for="r in data?.results" :key="r.domain" class="row">
        <button class="row-head" type="button" @click="toggle(r.domain)">
          <span class="domain">
            {{ r.name }}<span class="tld">.{{ r.tld }}</span>
          </span>

          <span
            class="badge"
            :class="[`badge-${r.status}`, { 'badge-soft': r.source === 'dns' }]"
            :title="sourceNote[r.source]"
          >
            {{ label(r) }}
          </span>

          <span class="best">
            <template v-if="r.best">
              <strong>{{ money(r.best.first) }}</strong> yr 1 ·
              {{ money(r.best.renew) }} renew · {{ r.best.registrar }}
            </template>
            <template v-else>{{ labels.noPricing }}</template>
          </span>

          <span class="chev">{{ open === r.domain ? labels.close : labels.prices }}</span>
        </button>

        <div v-if="open === r.domain" class="row-body">
          <table>
            <thead>
              <tr>
                <th>{{ labels.registrar }}</th>
                <th class="num">{{ labels.firstYear }}</th>
                <th class="num">{{ labels.renewal }}</th>
                <th>{{ labels.notes }}</th>
                <th>{{ labels.go }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(q, i) in r.quotes"
                :key="q.registrarId"
                :class="{ cheapest: i === 0 }"
              >
                <td>{{ q.registrar }}</td>
                <td class="num">{{ money(q.first) }}</td>
                <td class="num">{{ money(q.renew) }}</td>
                <td>{{ q.note }}</td>
                <td>
                  <a class="buy" :href="q.link" target="_blank" rel="noopener">
                    {{ labels.open }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- registrars / how -->
    <section id="registrars" class="results" style="padding-top: 0">
      <div class="results-bar">
        <h2 id="how">{{ labels.howTitle }}</h2>
        <span class="meta">{{ labels.twoSources }}</span>
      </div>
      <div class="row" style="padding: 24px 0">
        <p style="margin: 0 0 12px; max-width: 70ch">
          <strong>{{ labels.availability }}</strong> {{ labels.availabilityText }}
        </p>
        <p style="margin: 0; max-width: 70ch">
          <strong>{{ labels.pricing }}</strong> {{ labels.pricingText }}
        </p>
      </div>
    </section>
  </main>
</template>
