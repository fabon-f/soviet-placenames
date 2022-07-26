<script setup lang="ts">
import { reactive, onMounted, onUpdated } from 'vue'
import { map as lMap, tileLayer, marker, icon } from 'leaflet'
import type { Map as LMap } from 'leaflet'

type City = {
  id: number
  name: string
  latitude: number
  longitude: number
}

const props = defineProps<{ cities: City[], show: boolean }>()

const bound = reactive({
  west: 0,
  east: 0,
  north: 0,
  south: 0
})

const mapId = `mapviewer-${Math.floor(Math.random() * 1048576).toString(16)}`

let map: LMap | null = null

onUpdated(() => {
  map && map.invalidateSize()
})

onMounted(() => {
  // TODO: reflect props change
  const newMap = lMap(mapId).setView([58, 100], 3)
  tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(newMap);

  const myIcon = icon({
    iconUrl: './marker-icon.png',
    iconRetinaUrl: './marker-icon.png',
    shadowUrl: './marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  })

  for (const city of props.cities) {
    marker([city.latitude, city.longitude], { icon: myIcon }).addTo(newMap)
      .bindPopup(city.name, {
        // TODO: https://github.com/Leaflet/Leaflet/issues/8159
        closeButton: false
      })
  }

  const firstBound = newMap.getBounds()
  bound.east = firstBound.getEast()
  bound.west = firstBound.getWest()
  bound.north = firstBound.getNorth()
  bound.south = firstBound.getSouth()

  newMap.on('move', e => {
    const newBound = newMap.getBounds()
    bound.east = newBound.getEast()
    bound.west = newBound.getWest()
    bound.north = newBound.getNorth()
    bound.south = newBound.getSouth()
  })

  map = newMap
})
</script>

<template>
<div v-show="show" :id="mapId"></div>
</template>

<style>
@import 'leaflet';
</style>

<style scoped>

</style>
