import fs from 'node:fs/promises'
import { load } from 'js-yaml'
import * as url from 'url'
import { transliterate } from 'tensha'
import { NameHistory} from '../src/types'

const languageNames = {
  'ru': 'ロシア語',
  'uk': 'ウクライナ語',
  'be': 'ベラルーシ語',
  'et': 'エストニア語',
  'lv': 'ラトビア語',
  'lt': 'リトアニア語',
  'uz': 'ウズベク語',
  'tg': 'タジク語',
  'tk': 'トルクメン語',
  'ky': 'キルギス語',
  'kk': 'カザフ語',
  'ka': 'グルジア語',
  'hy': 'アルメニア語',
  'az': 'アゼルバイジャン語',
  'de': 'ドイツ語',
  'pl': 'ポーランド語',
  'hu': 'ハンガリー語',
  'cs': 'チェコ語',
  'sk': 'スロバキア語',
  'ro': 'ルーマニア語',
  'ja': '日本語',
  'en': '英語',
  'cv': 'チュヴァシ語',
  'sah': 'サハ語',
  'os': 'オセット語',
  'tyv': 'トゥヴァ語'
} as { [key: string]: string }

type OriginalCityData = {
  wikipedia: { [key: string]: string }
  latitude: number
  longitude: number
  nameHistory: OriginalNameHistory[]
}

type OriginalCitiesData = {
  [key: string]: {
    [key: string]: {
      [key: string]: OriginalCityData
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
  if (lang !== 'ru') { throw new Error(`${lang}: ${orig}`); }
  console.log(`${lang} ${orig.replaceAll('\u0301', '')}`)
  return transliterate(orig, lang)
}

type OriginalNameHistory = {
  period: string,
  [key: string]: string
}

function compareNameHistory(a: NameHistory, b: NameHistory) {
  const [aPeriod, bPeriod] = [a,b].map(n => n.period.split('-')[1] === '' ? 100000 : parseInt(n.period.split('-')[1]))
  if (aPeriod < bPeriod) {
    return -1
  } else if (aPeriod > bPeriod) {
    return 1
  } else {
    return 0
  }
}

function convertCityData(cityData: OriginalCityData, names: string[], country: string, subject: string, cityId: number): City {
  const convertedNameHistory = {
    nameHistory: [] as NameHistory[]
  }
  for (const n of cityData.nameHistory) {
    for (const period of n.period.split(/, ?/)) {
      const name = {
        period,
        langs: {}
      } as NameHistory
      for (const lang in n) {
        if (lang === 'period') { continue }
        name.langs[languageNames[lang]] = {
          original: n[lang],
          name: transliterations[lang][n[lang].replaceAll("\u0301", "")]
        }
      }
      convertedNameHistory.nameHistory.push(name)
    }
  }
  convertedNameHistory.nameHistory.sort(compareNameHistory)

  return Object.assign({
    id: cityId,
    name: names.filter((name, index, self) => self.indexOf(name) === index),
    country: country,
    subject: subject,
    // key with value `undefined` will be omitted in `JSON.stringify`
    latitude: cityData.latitude,
    longitude: cityData.longitude
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
        const city = cities[a][b][c]
        if (typeof city.wikipedia !== 'object' || city.wikipedia === null) {
          throw new Error(`Wikipedia entry unavailable: ${a}, ${b}, ${c}`)
        }
        if (Object.entries(city.wikipedia).some(n => typeof n[0] !== 'string' || typeof n[1] !== 'string')) {
          throw new Error(`Invalid Wikipedia entry: ${a}, ${b}, ${c}`)
        }
        if (typeof city.latitude !== 'number') {
          throw new Error(`Invalid latitude: ${a}, ${b}, ${c}`)
        }
        if (typeof city.longitude !== 'number') {
          throw new Error(`Invalid longitude: ${a}, ${b}, ${c}`)
        }
        if (city.nameHistory.some(n => Object.keys(n).every(k => typeof n[k] !== 'string'))) {
          throw new Error('Invalid')
        }
      }
    }
  }
  return cities
}) ()

type City = {
  id: number
  name: string[]
  country: string
  subject: string
  nameHistory: NameHistory[]
  latitude?: number
  longitude?: number
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
  names: [] as NameEntry[],
  divisions: {} as Record<string, string[]>
}

for (const country in cities) {
  const countryName = transliterations.en[country]
  if (typeof countryName !== 'string') { throw new Error('') }
  data.divisions[countryName] = []

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
    if (cities[country][subject] === null) { continue }
    if (typeof subjectName !== 'string') {
      throw new Error(`Unavailable administrative division: ${subject}`)
    }
    data.divisions[countryName].push(subjectName)
    for (const city in cities[country][subject]) {
      const latestNames = primaryLanguages.map(lang => getJapanese(searchLatestName(cities[country][subject][city].nameHistory, lang), lang))
      const cityId = data.cities.length
      const cityData = convertCityData(cities[country][subject][city], latestNames.filter((name, index, self) => self.indexOf(name) === index), countryName, subjectName, cityId)
      data.cities.push(cityData)

      for (const name of cities[country][subject][city].nameHistory) {
        for (const period of name.period.split(/, ?/)) {
          for (const language in name) {
            if (language === 'period') { continue }
            data.names.push({
              period,
              cityId,
              name: getJapanese(name[language], language),
              originalName: name[language],
              lang: languageNames[language]
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
