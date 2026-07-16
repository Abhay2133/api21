import { createApp } from 'vue'
import '@/style.css'
import 'primeicons/primeicons.css'
import App from '@/App.vue'
import router from '@/router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

const app = createApp(App)
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.p-dark'
        }
    }
})
app.use(ToastService)
app.use(ConfirmationService)
app.mount('#app')
