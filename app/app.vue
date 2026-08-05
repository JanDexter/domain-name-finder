<template>
  <div class="shell">
    <header class="masthead">
      <NuxtLink to="/" class="brand">
        <strong>NAME</strong>
        <span>GRID</span>
      </NuxtLink>

      <nav class="nav">
        <a href="#search">FIND A DOMAIN</a>
        <a href="#registrars">REGISTRARS</a>
        <a href="#how">HOW IT WORKS</a>
        <a href="#results">RESULTS</a>
      </nav>

      <div class="masthead-cta">
        <span class="globe" aria-hidden="true" />
        <span>EN / USD</span>
      </div>
    </header>

    <NuxtPage />

    <footer class="foot">
      <span>NAMEGRID — DOMAIN PRICE COMPARISON</span>
      <span>AVAILABILITY VIA RDAP · PRICES ARE REFERENCE ESTIMATES</span>
    </footer>
  </div>
</template>
