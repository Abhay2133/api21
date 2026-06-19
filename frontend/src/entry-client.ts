import { createApp } from './main'

const { app } = createApp({ path: window.location.pathname })

// Mount the app
app.mount('#app')
