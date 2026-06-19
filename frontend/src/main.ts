import { createSSRApp } from 'vue'
import App from './App.vue'
import './style.css'

export function createApp(props?: Record<string, any>) {
  const app = createSSRApp(App, props)
  return { app }
}
