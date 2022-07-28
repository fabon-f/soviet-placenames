import fs from 'node:fs/promises'
import { load } from 'js-yaml'
import * as url from 'url'

export class PopulationData {
  data: {
    [key: string]: { [key: string]: { name: string, population: number }[] }
  } | null
  constructor() {
    this.data = null
  }
  async load() {
    const countries = ['Russia']
    this.data = {}
    for (const country of countries) {
      const populationFile = url.fileURLToPath(new URL(`../data/population/${country.toLowerCase()}.yml`, import.meta.url))
      const populationData = load(await fs.readFile(populationFile, 'utf-8'), { filename: populationFile }) as { [key: string]: { name: string, population: number }[] }
      for (const subject in populationData) {
        if (populationData[subject].some(c => typeof c.name !== 'string' || typeof c.population !== 'number')) {
          throw new Error(`Invalid populatio data: ${country}, ${subject}`)
        }
      }
      this.data[country] = populationData
    }
  }

  dataLanguage(country: string) {
    const lang = ({
      "Russia": "ru"
    })[country]
    if (!lang) { throw new Error('Country not found') }
    return lang
  }

  get(country: string, subject: string, city: string) {
    city = city.replace(/\u0301/g, "")
    if (!this.data) { throw new Error('Population data not loaded') }
    const result = this.data[country][subject].find(c => c.name.replace(/ё/g, "е") === city.replace(/ё/g, "е"))
    if (result) {
      return result.population
    } else {
      throw new Error(`City not found: ${city}`)
    }
  }
}
