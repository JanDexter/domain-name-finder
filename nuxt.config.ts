export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: true,
  nitro: {
    preset: 'cloudflare_pages'
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'NAMEGRID — find a domain, compare every registrar',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Search a name across every TLD, see availability and side-by-side registrar pricing.'
        }
      ]
    }
  }
})
