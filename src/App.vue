<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import * as data from '../data/cities_data.ja.json'
import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
import { katakanaToRomaji } from './util'

const fuse = new Fuse(data.names.map(n => Object.assign({_search:katakanaToRomaji(n.name, true)},n)), {
  keys: ['_search'],
  threshold: 0.4
})

const query = ref('')
const matchedCities = computed(() => {
  const result = fuse.search(katakanaToRomaji(query.value), {
    limit: 10
  }).map(c => data.cities[c.item.cityId])
  return [...new Set(result)]
})
</script>

<template>
  <input type="text" v-model="query">
  ヒット数: {{ matchedCities.length }}
  <ul>
    <li v-for="city in matchedCities"><strong>{{ city.name.join(" / ") }}</strong> {{ `${city.country}、${city.subject}` }}</li>
  </ul>
</template>

<style>
@font-face {
  font-family: Cyrillic;
  src: local("Helvetica Neue"), local("Arial");
  font-weight: normal;
  /* only cyrillic */
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116, U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
@font-face {
  font-family: Cyrillic;
  src: local("Helvetica Neue Bold"), local("Arial Bold");
  font-weight: bold;
  /* only cyrillic */
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116, U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
#app {
  font-family: Cyrillic, Meiryo, sans-serif;
  color: #222;
}
</style>
