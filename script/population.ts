import fs from 'node:fs/promises'
import { load } from 'js-yaml'
import * as url from 'url'

type PopulationFileContent = Record<string, { name: string, population: number }[]> & {
  _year: number
}

function extractPurePopulationData(data: PopulationFileContent) {
  const res = {} as Record<string, { name: string, population: number }[]>
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'number') {
      res[key] = value
    }
  }
  return res
}

export class PopulationData {
  data: {
    [key: string]: PopulationFileContent
  } | null
  constructor() {
    this.data = null
  }
  async load() {
    const countries = ['Russia', 'Ukraine', 'Belarus', 'Kazakhstan']
    this.data = {}
    for (const country of countries) {
      const populationFile = url.fileURLToPath(new URL(`../data/population/${country.toLowerCase()}.yml`, import.meta.url))
      const populationData = load(await fs.readFile(populationFile, 'utf-8'), { filename: populationFile }) as PopulationFileContent
      for (const [subject, citiesPopulation] of Object.entries(extractPurePopulationData(populationData))) {
        if (citiesPopulation.some(c => typeof c.name !== 'string' || typeof c.population !== 'number')) {
          throw new Error(`Invalid populatio data: ${country}, ${subject}`)
        }
      }
      this.data[country] = populationData
    }
  }

  dataLanguage(country: string) {
    const lang = ({
      'Russia': 'ru',
      'Ukraine': 'uk',
      'Belarus': 'ru',
      'Kazakhstan': 'kk'
    })[country]
    if (!lang) { throw new Error('Country not found') }
    return lang
  }

  get(country: string, subject: string, city: string): { count: number, year: number } {
    city = city.replace(/\u0301/g, '')
    if (!this.data) { throw new Error('Population data not loaded') }
    if (!this.data[country]) { throw new Error(`Unknown country: ${country}`) }
    if (!(this.data[country]![subject])) { throw new Error(`Unknown subject: ${subject}`) }
    const result = this.data[country]![subject]!.find(c => c.name.replace(/ё/g, 'е') === city.replace(/ё/g, 'е'))
    if (result) {
      return {
        count: result.population,
        year: this.data[country]!._year
      }
    } else {
      // workaround for Kazakhstan
      if (country === 'Kazakhstan') {
        const redirects = { 'Abai Region': 'East Kazakhstan Region', 'Jetisu Region': 'Almaty Region', 'Ulytau Region': 'Karaganda Region' } as Record<string, string>
        if (redirects[subject]) {
          return this.get(country, redirects[subject]!, city)
        }
        const redirect_cities = { 'Қонаев': 'Қапшағай', 'Степногорск': 'Степногор', 'Зашаған': 'Зачаганск' } as Record<string, string>
        if (redirect_cities[city]) {
          return this.get(country, subject, redirect_cities[city]!)
        }
      }
      throw new Error(`City not found: ${city}`)
    }
  }
}
