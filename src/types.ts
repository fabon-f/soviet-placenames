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
}

export type NameData = {
  period: string
  cityId: number
  name: string
  originalName: string
  lang: string
}

export type JsonData = {
  names: NameData[]
  cities: CityData[]
}
