<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { ref, computed } from 'vue'
import CityDescription from './components/CityDescription.vue'
import MapViewer from './components/MapViewer.vue'
import { query, country, subject, countryList, subjectList, matchedCities, cityCount } from './city_searcher'

const displayCities = computed(() => matchedCities.value.slice(0, 100))
const citiesGeoData = computed(() => matchedCities.value.map(c => {
  return {
    id: c.id,
    name: c.name.join(" / "),
    latitude: c.latitude || Infinity,
    longitude: c.longitude || Infinity
  }
}).filter(c => c.latitude !== Infinity && c.longitude !== Infinity))

const mapOpened = ref(false)
</script>

<template>
  <a href="javascript:void(0)" @click="mapOpened = !mapOpened">{{ mapOpened ? '地図を閉じる' : '地図を見る' }}</a>
  <div>
    <p v-show="mapOpened">※開発中: 位置データがなく地図に表示されていない都市があります。</p>
    <MapViewer :show="mapOpened" class="map-viewer" :cities="citiesGeoData"></MapViewer>
  </div>
  <div id="searchbox">
    <input type="text" placeholder="都市名を入力" v-model="query" autofocus>
    <div class="search-detail">
      <label>
        国: <select v-model="country">
          <option v-for="countryName in countryList">{{ countryName }}</option>
        </select>
      </label>
      <label>
        行政区分: <select v-model="subject">
          <option v-for="subjectName in subjectList">{{ subjectName }}</option>
        </select>
      </label>
    </div>
  </div>
  ヒット数: {{ matchedCities.length }} / {{ cityCount }}
  <ul id="cities">
    <li v-for="city in displayCities" :key="city.id"><CityDescription :city="city"></CityDescription></li>
  </ul>
</template>

<style>
@import './global.css';

#searchbox {
  text-align: center;
}
#searchbox input {
  font-size: 1.5em;
}
#cities {
  padding: 0;
}
#cities li {
  list-style: none;
  border: 1px solid #222;
  border-bottom: none;
  padding: 5px;
}
#cities li:last-child {
  border-bottom: 1px solid #222;
}
.search-detail select {
  width: 15em;
}
.search-detail {
  margin: 5px;
  display: flex;
  justify-content: center;
  gap: 5px;
}
.map-viewer {
  height: 500px;
  max-height: 80vh;
  margin-bottom: 5px;
}
</style>
