import fs from 'node:fs/promises'
import { load } from 'js-yaml'
import * as url from 'url'
import { transliterate } from 'tensha'
import { NameHistory} from '../src/types'

type OriginalCitiesData = {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        nameHistory: OriginalNameHistory[]
      }
    }
  }
}

type TransliterationDictionary = {
  [key: string]: {
    [key: string]: string
  }
}

function getJapanese(orig: string, lang: string) {
  if (transliterations[lang][orig.replaceAll('\u0301', '')]) {
    return transliterations[lang][orig.replaceAll('\u0301', '')]
  }
  if (lang !== 'ru') { throw new Error(); }
  console.log(`${lang} ${orig.replaceAll('\u0301', '')}`)
  return transliterate(orig, lang)
}

type OriginalNameHistory = {
  period: string,
  [key: string]: string
}

function convertCityData(cityData: { nameHistory: OriginalNameHistory[] }, names: string[], country: string, subject: string): City {
  const convertedNameHistory = {
    nameHistory: cityData.nameHistory.map(n => {
      const name = {
        period: n.period,
        langs: {}
      } as NameHistory
      for (const lang in n) {
        if (lang === 'period') { continue }
        name.langs[lang] = {
          original: n[lang],
          name: transliterations[lang][n[lang].replaceAll("\u0301", "")]
        }
      }
      return name
    })
  }

  return Object.assign({
    name: names.filter((name, index, self) => self.indexOf(name) === index),
    country: country,
    subject: subject
  }, convertedNameHistory)
}

function searchLatestName(nameHistory: OriginalNameHistory[], language: string) {
  const result = nameHistory.find(name => name.period.endsWith('-') && typeof name[language] === 'string');
  if (result === undefined) { throw new Error('') }
  return result[language]
}


const transliterations = await (async () => {
  const transliterationFile = url.fileURLToPath(new URL('../transliteration_ja.yml', import.meta.url))
  const transliterationDic = load(await fs.readFile(transliterationFile, 'utf-8'), { filename: transliterationFile }) as TransliterationDictionary

  // type check
  for (const l in transliterationDic) {
    for (const w in transliterationDic[l]) {
      if (typeof transliterationDic[l][w] !== 'string') { throw new Error('Invalid') }
    }
  }
  return transliterationDic
}) ()

const cities = await (async () => {
  const citiesFile = url.fileURLToPath(new URL('../cities.yml', import.meta.url))
  const cities = load(await fs.readFile(citiesFile, { encoding: 'utf-8'}), { filename: citiesFile }) as OriginalCitiesData

  // type check
  for (const a in cities) {
    for (const b in cities[a]) {
      for (const c in cities[a][b]) {
        if (cities[a][b][c].nameHistory.some(n => Object.keys(n).every(k => typeof n[k] !== 'string'))) {
          throw new Error('Invalid')
        }
      }
    }
  }
  return cities
}) ()

type City = {
  name: string[]
  country: string
  subject: string
  nameHistory: NameHistory[]
}

type NameEntry = {
  cityId: number
  name: string
  originalName: string
  lang: string
  period: string
}

const data = {
  cities: [] as City[],
  names: [] as NameEntry[]
}

for (const country in cities) {
  const countryName = transliterations.en[country]
  if (typeof countryName !== 'string') { throw new Error('') }

  const primaryLanguages = ({
    'Ukraine': ['uk', 'ru'],
    'Belarus': ['be', 'ru'],
    'Moldova': ['ro', 'ru'],
    'Estonia': ['et', 'ru'],
    'Latvia': ['lv', 'ru'],
    'Lithuania': ['lt', 'ru'],
    'Uzbekistan': ['uz', 'ru'],
    'Tajikistan': ['tg', 'ru'],
    'Turkmenistan': ['tk', 'ru'],
    'Kyrgyzstan': ['ky', 'ru'],
    'Kazakhstan': ['kk', 'ru'],
    'Georgia': ['ka', 'ru'],
    'Armenia': ['hy', 'ru'],
    'Azerbaijan': ['ru', 'az']
  })[country] || ['ru']

  for (const subject in cities[country]) {
    const subjectName = transliterations.en[subject]
    if (cities[country][subject] !== null && typeof subjectName !== 'string') {
      throw new Error(`Unavailable administrative division: ${subject}`)
    }
    for (const city in cities[country][subject]) {
      const latestNames = primaryLanguages.map(lang => getJapanese(searchLatestName(cities[country][subject][city].nameHistory, lang), lang))
      const cityData = convertCityData(cities[country][subject][city], latestNames.filter((name, index, self) => self.indexOf(name) === index), countryName, subjectName)
      data.cities.push(cityData)
      const cityId = data.cities.length - 1

      for (const name of cities[country][subject][city].nameHistory) {
        for (const period of name.period.split(/, ?/)) {
          for (const language in name) {
            if (language === 'period') { continue }
            data.names.push({
              period,
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
}

function compareNameEntry(a: NameEntry, b: NameEntry) {
  if (a.name > b.name) {
    return 1
  } else if (a.name < b.name) {
    return -1
  }

  const [aPeriod, bPeriod] = [a,b].map(n => n.period.split('-')[1] === '' ? 100000 : parseInt(n.period.split('-')[1]))
  if (aPeriod < bPeriod) {
    return 1
  } else if (aPeriod > bPeriod) {
    return -1
  } else {
    return 0
  }
}

data.names.sort(compareNameEntry)

const citiesDataFile = url.fileURLToPath(new URL('../data/cities_data.ja.json', import.meta.url))
await fs.writeFile(citiesDataFile, JSON.stringify(data))
