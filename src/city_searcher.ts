import { ref, computed, watch } from 'vue'
import data from '../data/cities_data.ja.json' with { type: 'json' }

import Fuse from 'fuse.js'
import { katakanaToRomaji } from './util'
import type { CityData } from './types'

const searchData = data.names.map(n => Object.assign({_search:katakanaToRomaji(n.name, true)},n))

export const query = ref('')
export const matchedCities = computed(() => {
  const cities = data.cities as CityData[]
  const filteredData = country.value === '-' ? searchData : searchData.filter(n => {
    const city = cities[n.cityId]
    if (!city) {
      console.warn(`City not found: ID ${n.cityId}`)
      return false
    }
    if (subject.value === '-') {
      return city.country === country.value
    } else {
      if (!city) {
        console.warn(`City not found: ID ${n.cityId}`)
        return false
      }
      return city.country === country.value && city.subject === subject.value
    }
  })

  if (query.value === '') {
    const citiesSet = new Set(filteredData.map(c => cities[c.cityId]))
    citiesSet.delete(undefined)
    return [...citiesSet] as CityData[]
  }

  const fuse = new Fuse(filteredData, {
    keys: ['_search'],
    threshold: 0.3
  })

  const result = fuse.search(katakanaToRomaji(query.value), {
    limit: 1500
  }).map(c => cities[c.item.cityId])
  const resultSet = new Set(result)
  resultSet.delete(undefined)
  return [...new Set(result)] as CityData[]
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
