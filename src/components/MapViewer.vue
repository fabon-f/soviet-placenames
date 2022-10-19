<script setup lang="ts">
import { reactive, onMounted, onUpdated, watch, toRef } from 'vue'
import { map as lMap, tileLayer, marker, icon, featureGroup } from 'leaflet'
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

const markerIcon = icon({
  iconUrl: './marker-icon.png',
  iconRetinaUrl: './marker-icon.png',
  shadowUrl: './marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

const createMarkersLayerGroup = (cities: City[]) => {
  const layer = featureGroup()
  for (const city of cities) {
    marker([city.latitude, city.longitude], { icon: markerIcon }).addTo(layer)
      .bindPopup(city.name)
  }
  return layer
}

let map: LMap | null = null
let markersLayer = createMarkersLayerGroup(props.cities)

let shown = false

onUpdated(() => {
  if (!map) { return }
  if (props.show && (!shown)) {
    map.invalidateSize()
  }
  if (props.show) {
    map.fitBounds(markersLayer.getBounds(), { maxZoom: 7 })
  }
  shown = props.show
})

watch(toRef(props, 'cities'), (newCities, _oldCities) => {
  if (!map) { return }
  map.removeLayer(markersLayer)
  markersLayer = createMarkersLayerGroup(newCities)
  markersLayer.addTo(map)
  // map.fitBounds(markersLayer.getBounds(), { maxZoom: 7 })
})

onMounted(() => {
  const newMap = lMap(mapId).setView([58, 100], 3)
  tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(newMap);

  markersLayer.addTo(newMap)

  const firstBound = newMap.getBounds()
  bound.east = firstBound.getEast()
  bound.west = firstBound.getWest()
  bound.north = firstBound.getNorth()
  bound.south = firstBound.getSouth()

  newMap.on('move', _e => {
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
