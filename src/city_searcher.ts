import { ref, computed } from 'vue'
import * as data from '../data/cities_data.ja.json'

import Fuse from 'fuse.js'
import { katakanaToRomaji } from './util'

const searchData = data.names.map(n => Object.assign({_search:katakanaToRomaji(n.name, true)},n))

const fuse = new Fuse(searchData, {
  keys: ['_search'],
  threshold: 0.3
})

export const query = ref('')
export const matchedCities = computed(() => {
  const result = fuse.search(katakanaToRomaji(query.value), {
    limit: 10
  }).map(c => data.cities[c.item.cityId])
  return [...new Set(result)]
})
export const cityCount = data.cities.length
