import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'

export async function render(_url: string) {
  const { app } = createApp()

  // We could route here using Vue Router if it was configured,
  // but this is a single page portfolio.
  
  const ctx = {}
  const html = await renderToString(app, ctx)

  return { html }
}
