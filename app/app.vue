<script setup lang="ts">
const headers = useRequestHeaders(['cf-ipcountry', 'x-country', 'x-vercel-ip-country', 'cloudfront-viewer-country', 'accept-language'])
const detectedCountry = ((headers['cf-ipcountry'] || headers['x-country'] || headers['x-vercel-ip-country'] || headers['cloudfront-viewer-country'] || '') as string).toUpperCase()

const eurCountries = ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'ME', 'XK', 'MC', 'SM', 'VA', 'AD', 'HR']
const gbpCountries = ['GB', 'UK', 'IM', 'JE', 'GG', 'GI', 'SH', 'FK']
const esCountries = ['ES', 'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'GQ']

function resolveLanguage(country: string): 'en' | 'es' {
  if (esCountries.includes(country)) return 'es'
  const acceptLang = ((headers['accept-language'] || '') as string).toLowerCase()
  if (acceptLang.startsWith('es') || (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es'))) return 'es'
  return 'en'
}

function resolveCurrency(country: string): 'USD' | 'EUR' | 'GBP' {
  if (eurCountries.includes(country)) return 'EUR'
  if (gbpCountries.includes(country)) return 'GBP'
  return 'USD'
}

const theme = useState<'light' | 'dark'>('theme', () => 'light')
const language = useState<'en' | 'es'>('language', () => resolveLanguage(detectedCountry))
const currency = useState<'USD' | 'EUR' | 'GBP'>('currency', () => resolveCurrency(detectedCountry))

const shellCopy = computed(() => ({
  en: {
    by: 'BY: Jandexter.me',
    search: 'FIND A DOMAIN',
    registrars: 'REGISTRARS',
    how: 'HOW IT WORKS',
    results: 'RESULTS',
    footerLeft: 'NAMEGRID — DOMAIN PRICE COMPARISON',
    footerRight: 'AVAILABILITY VIA RDAP · PRICES ARE REFERENCE ESTIMATES'
  },
  es: {
    by: 'POR: Jandexter.me',
    search: 'BUSCAR UN DOMINIO',
    registrars: 'REGISTRADORES',
    how: 'CÓMO FUNCIONA',
    results: 'RESULTADOS',
    footerLeft: 'NAMEGRID — COMPARACIÓN DE PRECIOS DE DOMINIOS',
    footerRight: 'DISPONIBILIDAD VÍA RDAP · LOS PRECIOS SON ESTIMACIONES DE REFERENCIA'
  }
}[language.value]))

const themeLabel = computed(() => (theme.value === 'dark' ? 'Dark' : 'Light'))

const languageLabel = computed(() => ({
  en: 'EN',
  es: 'ES'
}[language.value]))

useHead(() => ({
  htmlAttrs: {
    'data-theme': theme.value
  }
}))

onMounted(async () => {
  const savedTheme = localStorage.getItem('namegrid-theme')
  const savedLanguage = localStorage.getItem('namegrid-language')
  const savedCurrency = localStorage.getItem('namegrid-currency')

  if (savedTheme === 'light' || savedTheme === 'dark') theme.value = savedTheme
  if (savedLanguage === 'en' || savedLanguage === 'es') {
    language.value = savedLanguage
  }
  if (savedCurrency === 'USD' || savedCurrency === 'EUR' || savedCurrency === 'GBP') {
    currency.value = savedCurrency
  }

  // By default, check for current country for language and currency when no preference is saved
  if (!savedLanguage || !savedCurrency) {
    let country = detectedCountry
    if (!country) {
      try {
        const meta = await $fetch<{ country?: string }>('/api/meta')
        country = (meta.country || '').toUpperCase()
      } catch {}
    }
    if (!country) {
      try {
        const geo = await $fetch<{ country?: string }>('https://get.geojs.io/v1/ip/country.json', { timeout: 3000 })
        country = (geo?.country || '').toUpperCase()
      } catch {}
    }

    if (!savedLanguage) language.value = resolveLanguage(country)
    if (!savedCurrency) currency.value = resolveCurrency(country)
  }
})

watch(theme, (value) => localStorage.setItem('namegrid-theme', value))
watch(language, (value) => localStorage.setItem('namegrid-language', value))
watch(currency, (value) => localStorage.setItem('namegrid-currency', value))

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="shell">
    <header class="masthead">
      <NuxtLink to="/" class="brand">
        <strong>NAME</strong>
        <span>GRID</span>
      </NuxtLink>

      <nav class="nav">
        <a href="https://jandexter.me" target="_blank" rel="noopener">{{ shellCopy.by }}</a>
        <a href="#search">{{ shellCopy.search }}</a>
        <a href="#registrars">{{ shellCopy.registrars }}</a>
        <a href="#how">{{ shellCopy.how }}</a>
        <a href="#results">{{ shellCopy.results }}</a>
      </nav>

      <div class="masthead-cta">
        <span class="globe" aria-hidden="true" />

        <button class="icon-toggle" type="button" @click="toggleTheme">
          {{ themeLabel }}
        </button>

        <label class="compact-select" aria-label="Language">
          <span class="sr-only">Language</span>
          <select v-model="language">
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </label>

        <label class="compact-select" aria-label="Currency">
          <span class="sr-only">Currency</span>
          <select v-model="currency">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>
    </header>

    <NuxtPage />

    <footer class="foot">
      <span>{{ shellCopy.footerLeft }}</span>
      <span><a href="https://jandexter.me" target="_blank" rel="noopener">{{ shellCopy.by }}</a></span>
      <span>{{ shellCopy.footerRight }}</span>
    </footer>
  </div>
</template>
