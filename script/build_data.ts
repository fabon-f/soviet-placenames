import fs from 'node:fs/promises'
import YAML from 'yaml'
import * as url from 'url'
import { transliterate } from 'tensha'
import * as v from 'valibot'
import type { NameHistory, CityData, NameEntry } from '../src/types'
import { PopulationData } from './population.js'

const argv = process.argv.slice(2)
if (argv.includes('--clean')) {
  for await (const json of fs.glob('data/*.json')) {
    await fs.rm(json)
  }
}

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
  'tt': 'タタール語',
  'tyv': 'トゥヴァ語',
  'kjh': 'ハカス語',
  'fi': 'フィンランド語',
  'sv': 'スウェーデン語'
} as { [key: string]: string }

const OriginalNameHistorySchema = v.objectWithRest({
  period: v.string()
}, v.string())

type OriginalNameHistory = v.InferOutput<typeof OriginalNameHistorySchema>

const OriginalCityDataSchema = v.object({
  wikipedia: v.record(v.string(), v.string()),
  latitude: v.number(),
  longitude: v.number(),
  nameHistory: v.array(OriginalNameHistorySchema)
})

type OriginalCityData = v.InferOutput<typeof OriginalCityDataSchema>

const OriginalCitiesDataSchema = v.record(
  v.string(),
  v.record(
    v.string(),
    v.union([v.record(v.string(), OriginalCityDataSchema), v.null()])
  )
)

const TransliterationDictionarySchema = v.objectWithRest({
  en: v.record(v.string(), v.string())
}, v.record(v.string(), v.string()))

function getJapanese(orig: string, lang: string) {
  const dic = transliterations[lang]
  if (!dic) { throw new Error(`Language unavailable: ${lang}`) }
  const nameWithoutAccent = orig.replaceAll('\u0301', '')

  const dicResult = dic[nameWithoutAccent]
  if (dicResult !== undefined) {
    return dicResult
  }
  if (lang !== 'ru') { throw new Error(`${lang}: ${orig}`); }
  console.log(`${lang} ${nameWithoutAccent}`)
  return transliterate(orig, lang)
}

function getEndYearFromPeriod(period: string) {
  const [start, end] = period.split('-')
  if (start === undefined || end === undefined) { throw new Error(`Invalid period format: ${period}`) }
  return end === '' ? null : parseInt(end)
}

function compareNameHistory(a: NameHistory, b: NameHistory) {
  const [aPeriod, bPeriod] = [a,b].map(n => getEndYearFromPeriod(n.period) ?? 100000)
  if (!aPeriod || !bPeriod) { throw new Error('') }
  if (aPeriod < bPeriod) {
    return -1
  } else if (aPeriod > bPeriod) {
    return 1
  } else {
    return 0
  }
}

function convertCityData(cityData: OriginalCityData, names: string[], country: string, subject: string, cityId: number, population?: { count: number, year: number }): CityData {
  const convertedNameHistory = {
    nameHistory: [] as NameHistory[]
  }
  for (const n of cityData.nameHistory) {
    for (const period of n.period.split(/, ?/)) {
      const name = {
        period,
        langs: {}
      } as NameHistory
      for (const [langCode, cityName] of Object.entries(n)) {
        if (langCode === 'period') { continue }
        const languageName = languageNames[langCode]
        if (languageName === undefined) { throw new Error(`Unknown language identifier: ${langCode}`) }
        name.langs[languageName] = {
          original: cityName,
          name: getJapanese(cityName, langCode)
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
    latitude: cityData.latitude,
    longitude: cityData.longitude,
    // key with value `undefined` will be omitted in `JSON.stringify`
    population
  }, convertedNameHistory)
}

function searchLatestName(nameHistory: OriginalNameHistory[], language: string) {
  const result = nameHistory.find(name => name.period.endsWith('-') && typeof name[language] === 'string');
  if (result === undefined) { throw new Error('') }
  const name = result[language]
  if (name === undefined) { throw new Error('') }
  return name
}


const transliterations = await (async () => {
  const transliterationFile = url.fileURLToPath(new URL('../transliteration_ja.yml', import.meta.url))
  return v.parse(
    TransliterationDictionarySchema,
    YAML.parse(await fs.readFile(transliterationFile, 'utf-8'))
  )
}) ()

const cities = await (async () => {
  const citiesFile = url.fileURLToPath(new URL('../cities.yml', import.meta.url))
  return v.parse(
    OriginalCitiesDataSchema,
    YAML.parse(await fs.readFile(citiesFile, { encoding: 'utf-8'}))
  )
}) ()

const populationData = new PopulationData()
await populationData.load()

const data = {
  cities: [] as CityData[],
  names: [] as NameEntry[],
  divisions: {} as Record<string, string[]>
}

for (const [country, subjects] of Object.entries(cities)) {
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

  for (const [subject, citiesInSubject] of Object.entries(subjects)) {
    const subjectName = transliterations.en[subject]
    if (citiesInSubject === null) { continue }
    if (typeof subjectName !== 'string') {
      throw new Error(`Unavailable administrative division: ${subject}`)
    }
    data.divisions[countryName].push(subjectName)
    for (const [_city, originalCityData] of Object.entries(citiesInSubject)) {
      const latestNames = primaryLanguages.map(lang => getJapanese(searchLatestName(originalCityData.nameHistory, lang), lang))
      let population: { year: number, count: number } | undefined = undefined
      try {
        const latestName = searchLatestName(originalCityData.nameHistory, populationData.dataLanguage(country))
        population = populationData.get(country, subject, latestName)
      } catch {}
      const cityId = data.cities.length
      const cityData = convertCityData(originalCityData, latestNames.filter((name, index, self) => self.indexOf(name) === index), countryName, subjectName, cityId, population)
      data.cities.push(cityData)

      for (const name of originalCityData.nameHistory) {
        for (const period of name.period.split(/, ?/)) {
          for (const [language, originalName] of Object.entries(name)) {
            if (language === 'period') { continue }
            const langName = languageNames[language]
            if (langName === undefined) { throw new Error(`Unknown language: ${langName}`) }
            data.names.push({
              period,
              cityId,
              name: getJapanese(originalName, language),
              originalName,
              lang: langName
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

  const [aPeriod, bPeriod] = [a,b].map(n => getEndYearFromPeriod(n.period) ?? 100000)
  if (!aPeriod || !bPeriod) { throw new Error('') }
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
