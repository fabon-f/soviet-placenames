import fs from 'node:fs/promises'
import { load } from 'js-yaml'
import * as url from 'url'
import { transliterate } from 'tensha'

const citiesFile = url.fileURLToPath(new URL('../cities.yml', import.meta.url))
const transliterationFile = url.fileURLToPath(new URL('../transliteration_ja.yml', import.meta.url))

const cities = load(await fs.readFile(citiesFile, { encoding: 'utf-8'}), { filename: citiesFile }) as any
const transliterations = load(await fs.readFile(transliterationFile, 'utf-8'), { filename: transliterationFile }) as any

const data = {
  cities: [] as any[],
  names: [] as any[]
}

function getJapanese(orig: string, lang: string) {
  if (transliterations[lang][orig.replaceAll('\u0301', '')]) {
    return transliterations[lang][orig.replaceAll('\u0301', '')]
  }
  if (lang !== 'ru') { throw new Error(); }
  console.log(`${lang} ${orig.replaceAll('\u0301', '')}`)
  return transliterate(orig, lang)
}

type NameHistory = {
  period: string,
  [key: string]: string
}

function searchLatestName(nameHistory: NameHistory[], language: string) {
  const result = nameHistory.find(name => name.period.endsWith('-') && typeof name[language] === 'string');
  if (result === undefined) { throw new Error('') }
  return result[language]
}

for (const country in cities) {
  const countryName = transliterations.en[country]
  if (typeof countryName !== 'string') { throw new Error('') }

  const primaryLanguages = ({
    'Ukraine': ['uk', 'ru']
  })[country] || ['ru']

  for (const subject in cities[country]) {
    const subjectName = transliterations.en[subject]
    for (const city in cities[country][subject]) {
      const latestNames = primaryLanguages.map(lang => getJapanese(searchLatestName(cities[country][subject][city].nameHistory, lang), lang))
      const cityData = Object.assign({
        name: latestNames.filter((name, index, self) => self.indexOf(name) === index),
        country: countryName,
        subject: subjectName
      }, cities[country][subject][city])
      data.cities.push(cityData)
      const cityId = data.cities.length - 1

      for (const name of cityData.nameHistory) {
        for (const language in name) {
          if (language === 'period') { continue }
          data.names.push({
            cityId,
            name: getJapanese(name[language], language),
            originalName: name[language],
            lang: language
          })
        }
      }
    }
  }
}

const citiesDataFile = url.fileURLToPath(new URL('../data/cities_data.ja.json', import.meta.url))
await fs.writeFile(citiesDataFile, JSON.stringify(data))
