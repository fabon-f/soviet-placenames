import { createApp } from 'vue'
import App from './App.vue'

if (location.protocol === 'http:' && ['lab.fabon.info', 'fabon-f.github.io'].includes(location.host)) {
  location.replace(location.href.replace('http:', 'https:'))
}

createApp(App).mount('#app')

if (typeof document.fonts === 'object' && typeof document.fonts.load === 'function') {
  // preload necessary fonts if CSS Font Loading API is supported
  document.fonts.load('10px \'Source Sans 3\'', 'ағaş')
}
