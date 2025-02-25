import fs from 'node:fs/promises'
import YAML from 'yaml'
import * as url from 'url'
import * as v from 'valibot'

const PopulationFileContentSchema = v.objectWithRest(
  {
    _year: v.number()
  },
  v.array(v.object({ name: v.string(), population: v.number() }))
)

type PopulationFileContent = v.InferOutput<typeof PopulationFileContentSchema>

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
      const populationData = v.parse(PopulationFileContentSchema, YAML.parse(await fs.readFile(populationFile, 'utf-8')))
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
    if (!(this.data[country][subject])) { throw new Error(`Unknown subject: ${subject}`) }
    const result = this.data[country][subject].find(c => c.name.replace(/ё/g, 'е') === city.replace(/ё/g, 'е'))
    if (result) {
      return {
        count: result.population,
        year: this.data[country]._year
      }
    } else {
      // workaround for Kazakhstan
      if (country === 'Kazakhstan') {
        const redirects = { 'Abai Region': 'East Kazakhstan Region', 'Jetisu Region': 'Almaty Region', 'Ulytau Region': 'Karaganda Region' } as Record<string, string>
        if (redirects[subject]) {
          return this.get(country, redirects[subject], city)
        }
        const redirect_cities = { 'Қонаев': 'Қапшағай', 'Степногорск': 'Степногор', 'Зашаған': 'Зачаганск' } as Record<string, string>
        const redirected_city = redirect_cities[city]
        if (redirected_city) {
          return this.get(country, subject, redirected_city)
        }
      }
      throw new Error(`City not found: ${city}`)
    }
  }
}
