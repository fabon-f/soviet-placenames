import { ref, computed, watch } from 'vue'
import * as data from '../data/cities_data.ja.json'

import Fuse from 'fuse.js'
import { katakanaToRomaji } from './util'

const searchData = data.names.map(n => Object.assign({_search:katakanaToRomaji(n.name, true)},n))

export const query = ref('')
export const matchedCities = computed(() => {
  const filteredData = country.value === '-' ? searchData : searchData.filter(n => {
    if (subject.value === '-') {
      return data.cities[n.cityId].country === country.value
    } else {
      const city = data.cities[n.cityId]
      return city.country === country.value && city.subject === subject.value
    }
  })

  if (query.value === '' && (new Set(filteredData.map(c => c.cityId))).size <= 100) {
    return [...new Set(filteredData.map(c => data.cities[c.cityId]))]
  }

  const fuse = new Fuse(filteredData, {
    keys: ['_search'],
    threshold: 0.3
  })

  const result = fuse.search(katakanaToRomaji(query.value), {
    limit: 150
  }).map(c => data.cities[c.item.cityId])
  return [...new Set(result)]
})
export const country = ref('-')
export const countryList = ['-'].concat(Object.keys(data.divisions))
export const subject = ref('-')
export const subjectList = computed(() => {
  if (country.value === '-') {
    return ['-']
  }
  return ['-'].concat((data.divisions as Record<string, string[]>)[country.value] || [])
})

watch([subject, subjectList], ([newSubject, newSubjectList]) => {
  if (!newSubjectList.includes(newSubject)) {
    subject.value = '-'
  }
})

export const cityCount = data.cities.length
