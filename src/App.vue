<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import * as data from '../data/cities_data.ja.json'
import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
import { katakanaToRomaji } from './util'
import CityDescription from './components/CityDescription.vue'

const fuse = new Fuse(data.names.map(n => Object.assign({_search:katakanaToRomaji(n.name, true)},n)), {
  keys: ['_search'],
  threshold: 0.4,
  distance: 10
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
  <div id="searchbox">
    <input type="text" placeholder="都市名を入力" v-model="query">
  </div>
  ヒット数: {{ matchedCities.length }} / {{ data.cities.length }}
  <ul id="cities">
    <li v-for="city in matchedCities" :key="city.id"><CityDescription :city="city"></CityDescription></li>
  </ul>
</template>

<style>
@import './global.css';

#searchbox {
  text-align: center;
}
#searchbox input {
  font-size: 1.5em;
}
#cities {
  padding: 0;
}
#cities li {
  list-style: none;
  border: 1px solid #222;
  border-bottom: none;
  padding: 5px;
}
#cities li:last-child {
  border-bottom: 1px solid #222;
}
</style>
