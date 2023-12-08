<script setup lang="ts">
import { ref } from 'vue'
import { LMap, LTileLayer, LFeatureGroup, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import { useDebounceFn } from '@vueuse/core'
import { icon } from 'leaflet'

type City = {
  id: number
  name: string
  latitude: number
  longitude: number
}

defineProps<{ cities: City[], show: boolean }>()

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

const mapRef = ref<InstanceType<typeof LMap> | null>(null)
const layerRef = ref<InstanceType<typeof LFeatureGroup> | null>(null)

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const handleMarkerLayerUpdate = useDebounceFn(() => {
  if (!layerRef.value || !mapRef.value) {
    return
  }
  const markersLayer = layerRef.value.leafletObject
  const map = mapRef.value.leafletObject
  if (!markersLayer || !map) {
    return
  }
  const newBound = markersLayer.getBounds()
  if (newBound.isValid()) {
    map.fitBounds(newBound, { maxZoom: 7 })
  }
}, 10)
</script>

<template>
  <div v-show="show">
    <LMap ref="mapRef" :center="[58, 100]" :zoom="3">
      <LTileLayer :url="tileUrl" :attribution="attribution"></LTileLayer>
      <!-- markers -->
      <LFeatureGroup ref="layerRef" @layeradd="handleMarkerLayerUpdate" @layerremove="handleMarkerLayerUpdate">
        <template v-for="city in cities">
          <LMarker :latLng="[city.latitude, city.longitude]" :icon="markerIcon">
            <LPopup>{{ city.name }}</LPopup>
          </LMarker>
        </template>
      </LFeatureGroup>
    </LMap>
  </div>
</template>

<style>
@import 'leaflet';
</style>

<style scoped>

</style>
