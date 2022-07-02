export type CityData = {
  name: string[]
  country: string
  subject: string
  nameHistory: {
    period: string
    [key: string]: string | undefined
  }[]
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
