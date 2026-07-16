<template>
  <div class="login-wrapper bg-surface-50 dark:bg-surface-950" style="position: relative;">
    <div style="position: absolute; top: 1rem; right: 1rem; z-index: 10;">
      <Button text rounded @click="toggleDarkMode" aria-label="Toggle Dark Mode">
        <component :is="isDark ? Sun : Moon" class="w-5 h-5" />
      </Button>
    </div>
    <div class="login-panel">
      <!-- Brand Header -->
      <div class="flex flex-col items-center justify-center mb-4 gap-2">
        <Cloud class="w-12 h-12 text-primary" />
        <h1 class="text-2xl font-semibold m-0">CloudAdmin</h1>
        <p class="text-surface-500 m-0">Secure Infrastructure Access</p>
      </div>

      <!-- Login Card -->
      <Card>
        <template #content>
            <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label for="username" class="font-semibold text-sm">Username</label>
                <IconField iconPosition="left">
                    <InputIcon>
                      <User class="w-4 h-4" />
                    </InputIcon>
                    <InputText id="username" v-model="username" placeholder="e.g. devops_admin_01" class="w-full" required />
                </IconField>
              </div>

              <div class="flex flex-col gap-2">
                <label for="password" class="font-semibold text-sm">Password</label>
                <IconField iconPosition="left">
                    <InputIcon>
                      <Key class="w-4 h-4" />
                    </InputIcon>
                    <InputText id="password" type="password" v-model="password" placeholder="••••••••••••••••" class="w-full" required />
                </IconField>
              </div>

              <!-- Error Message -->
              <Message v-if="error" severity="error" :closable="false" class="m-0 mt-2">{{ error }}</Message>

              <div class="flex items-center gap-2 mt-2">
                <Checkbox v-model="remember" inputId="stay-logged-in" :binary="true" />
                <label for="stay-logged-in" class="cursor-pointer select-none text-sm">Stay logged in</label>
              </div>

              <Button type="submit" :loading="loading" label="Sign In" iconPos="right" class="w-full mt-2">
                <template #icon>
                  <ArrowRight class="w-4 h-4 ml-1" />
                </template>
              </Button>
            </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { Cloud, User, Key, ArrowRight, Sun, Moon } from '@lucide/vue'

const isDark = ref(false)

const toggleDarkMode = () => {
    isDark.value = !isDark.value;
    if (isDark.value) {
        document.documentElement.classList.add('p-dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('p-dark');
        localStorage.setItem('theme', 'light');
    }
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        isDark.value = savedTheme === 'dark';
    } else {
        isDark.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
})

const username = ref('')
const password = ref('')
const remember = ref(false)
const error = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await api.post('/login', {
      username: username.value,
      password: password.value,
      remember: remember.value
    })
    
    const opaqueToken = res.data.token
    api.defaults.headers.common['Authorization'] = `Bearer ${opaqueToken}`
    
    if (remember.value) {
      localStorage.setItem('adminToken', opaqueToken)
    } else {
      localStorage.removeItem('adminToken')
      sessionStorage.setItem('adminToken', opaqueToken)
    }
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Invalid username or password'
    delete api.defaults.headers.common['Authorization']
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.no-underline { text-decoration: none; }
.hover\:underline:hover { text-decoration: underline; }
</style>
