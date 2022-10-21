<script setup lang="ts">
import { ref } from 'vue'
import type { CityData, NameHistory } from '../types'
defineProps<{ city: CityData }>()

const opened = ref(false)

function shouldShowHistory(nameHistory: NameHistory[]) {
  if (nameHistory.length === 0) { return false }
  if (nameHistory.length !== 1) { return true }
  return nameHistory[0]!.period !== '-'
}
</script>

<template>
<div :class="opened ? 'opened' : ''">
  <div class="summary" @click="opened = !opened">
    <h1>{{ city.name.join((' / ')) }}</h1>
    <p>{{ `${city.country}、${city.subject}` }}</p>
  </div>
  <div v-show="opened">
    <p v-if="city.population">人口: {{ city.population }}人</p>
    <p v-if="city.nameHistory.find(n => n.period === '-')">
      <span v-for="(name, lang) in city.nameHistory.find(n => n.period === '-')?.langs">
        <strong>{{ lang }}</strong>: {{ name?.name }} (<span class="orig">{{ name?.original }}</span>)<br/>
      </span>
    </p>
    <table v-if="shouldShowHistory(city.nameHistory)">
      <thead>
        <tr><th>期間</th><th>名前</th></tr>
      </thead>
      <tbody>
        <tr v-for="nameEntry in city.nameHistory.filter(n => n.period !== '-')">
          <td>{{ nameEntry.period.replace('-', '〜') }}</td>
          <td><span v-for="(name, lang) in nameEntry.langs"><strong>{{ lang }}</strong>: {{ name?.name }} (<span class="orig">{{ name?.original }}</span>)<br></span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

</template>

<style scoped>
h1 {
  font-size: 1.2rem;
}

.summary {
  cursor: pointer;
}
.summary h1::before {
  content: '';
  display: inline-block;
  background-size: 1rem;
  height: 1rem;
  width: 1.2rem;
  background-repeat: no-repeat;
  /* https://iconmonstr.com/arrow-63-svg/ */
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNy4zMyAyNGwtMi44My0yLjgyOSA5LjMzOS05LjE3NS05LjMzOS05LjE2NyAyLjgzLTIuODI5IDEyLjE3IDExLjk5NnoiLz48L3N2Zz4=');
}
.opened .summary h1::before {
  /* https://iconmonstr.com/arrow-65-svg/ */
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMCA3LjMzbDIuODI5LTIuODMgOS4xNzUgOS4zMzkgOS4xNjctOS4zMzkgMi44MjkgMi44My0xMS45OTYgMTIuMTd6Ii8+PC9zdmc+')
}

.orig {
  font-family: 'Source Sans 3', sans-serif;
  font-size: 1.08em;
}

table {
  border-collapse: collapse;
}
table th, table td {
  border: 1px solid #999;
  padding: 0.5em 0.5em;
}
</style>
