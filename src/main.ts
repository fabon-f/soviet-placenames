import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

if (typeof document.fonts === 'object' && typeof document.fonts.load === 'function') {
  // preload necessary fonts if CSS Font Loading API is supported
  document.fonts.load('10px \'Source Sans 3\'', 'ағaş')
}
