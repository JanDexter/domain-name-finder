<script setup lang="ts">
const theme = useState<'light' | 'dark'>('theme', () => 'light')
const language = useState<'en' | 'es'>('language', () => 'en')
const currency = useState<'USD' | 'EUR' | 'GBP'>('currency', () => 'USD')

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

onMounted(() => {
  const savedTheme = localStorage.getItem('namegrid-theme')
  const savedLanguage = localStorage.getItem('namegrid-language')
  const savedCurrency = localStorage.getItem('namegrid-currency')

  if (savedTheme === 'light' || savedTheme === 'dark') theme.value = savedTheme
  if (savedLanguage === 'en' || savedLanguage === 'es') language.value = savedLanguage
  if (savedCurrency === 'USD' || savedCurrency === 'EUR' || savedCurrency === 'GBP') {
    currency.value = savedCurrency
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
