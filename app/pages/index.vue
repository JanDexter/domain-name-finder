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

const { data: meta } = await useFetch('/api/meta')

const term = ref('')
const tld = ref('popular')
const sort = ref('price')
const variants = ref(false)

const pending = ref(false)
const error = ref('')
const data = ref<SearchResponse | null>(null)
const open = ref<string | null>(null)

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
    error.value = e?.data?.statusMessage || 'Search failed. Try again.'
    data.value = null
  } finally {
    pending.value = false
  }
}

function clear() {
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

const money = (n: number) => `$${n.toFixed(2)}`

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
</script>

<template>
  <main>
    <!-- hero -->
    <section class="hero">
      <div class="hero-copy">
        <h1>Find a<br />domain.</h1>
        <p>
          Search one name across every extension, see what is actually free, and
          compare the first-year and renewal price at ten registrars side by
          side — before you hand over a card.
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
            placeholder="Search a name, e.g. northwind"
            aria-label="Domain name"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" aria-label="Search">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5 21 21" />
            </svg>
          </button>
        </div>

        <span class="filter-label">Filter</span>

        <div class="field field-select">
          <select v-model="tld" aria-label="Extension">
            <option value="popular">Popular TLDs</option>
            <option value="all">Every TLD we price</option>
            <option v-for="t in meta?.tlds" :key="t" :value="t">.{{ t }}</option>
          </select>
        </div>

        <div class="field field-select">
          <select v-model="sort" aria-label="Sort by">
            <option value="price">Cheapest first year</option>
            <option value="renew">Cheapest renewal</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <button type="button" class="clear" @click="clear">Clear</button>
      </form>

      <p class="hint">
        <label>
          <input
            v-model="variants"
            type="checkbox"
            aria-label="Include name variants"
          />
          Include name variants (get-, try-, -app, -hq)
        </label>
        · Prices are reference estimates updated {{ meta?.updated }} across
        {{ meta?.registrars?.length }} registrars.
      </p>
    </section>

    <!-- results -->
    <section id="results" class="results">
      <div v-if="pending" class="loading-strip" />

      <div v-if="data" class="results-bar">
        <h2>{{ data.query }}</h2>
        <span class="meta">
          {{ data.available }} available of {{ data.count }} checked
        </span>
      </div>

      <p v-if="error" class="empty">{{ error }}</p>

      <p v-else-if="!data && !pending" class="empty">
        Type a name above. Availability is checked live over RDAP; prices come
        from the reference table.
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
            <template v-else>No pricing</template>
          </span>

          <span class="chev">{{ open === r.domain ? 'Close' : 'Prices' }}</span>
        </button>

        <div v-if="open === r.domain" class="row-body">
          <table>
            <thead>
              <tr>
                <th>Registrar</th>
                <th class="num">First year</th>
                <th class="num">Renewal</th>
                <th>Notes</th>
                <th>Go</th>
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
                    Open →
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
        <h2 id="how">How it works</h2>
        <span class="meta">Two data sources</span>
      </div>
      <div class="row" style="padding: 24px 0">
        <p style="margin: 0 0 12px; max-width: 70ch">
          <strong>Availability</strong> is live. Each candidate is looked up over
          RDAP, the registry protocol that replaced WHOIS — that answer is
          authoritative. TLDs with no RDAP service (many ccTLDs: .co, .me, .io)
          fall back to a DNS lookup and are labelled “likely”, with a dashed
          badge, because a registered name with no nameservers looks the same as
          a free one.
        </p>
        <p style="margin: 0; max-width: 70ch">
          <strong>Pricing</strong> comes from a local reference table
          (<code>server/utils/pricing.ts</code>): a per-TLD baseline plus a
          per-registrar markup and promo factor. Registrars have no free public
          price API, so swap that file for real API calls once you hold
          credentials.
        </p>
      </div>
    </section>
  </main>
</template>
