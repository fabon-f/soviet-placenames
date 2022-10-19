export type NameHistory = {
  period: string
  langs: {
    [key: string]: {
      name: string
      original: string
    } | undefined
  }
}

export type CityData = {
  id: number
  name: string[]
  country: string
  subject: string
  nameHistory: NameHistory[]
  latitude: number
  longitude: number
  population: number | undefined
}

export type NameEntry = {
  period: string
  cityId: number
  name: string
  originalName: string
  lang: string
}
