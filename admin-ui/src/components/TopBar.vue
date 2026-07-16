<template>
  <header class="layout-topbar">
    <div class="flex items-center gap-2">
      <Button class="sidebar-toggle-btn" text rounded @click="$emit('toggle-sidebar')" aria-label="Toggle Sidebar">
        <Menu :size="20" />
      </Button>
      <span style="font-size: 1.25rem; font-weight: 600;">CloudAdmin</span>
    </div>
    <div class="flex items-center gap-2">
      <Button text rounded @click="toggleDarkMode" aria-label="Toggle Dark Mode">
        <component :is="isDark ? Sun : Moon" :size="20" />
      </Button>
      <Button text rounded @click="logout" aria-label="Sign Out">
        <LogOut :size="20" />
      </Button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import api from '@/api'
import { Menu, Sun, Moon, LogOut } from '@lucide/vue'

import { useConfirm } from 'primevue/useconfirm'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const router = useRouter()
const confirm = useConfirm()
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

const logout = () => {
  confirm.require({
    message: 'Are you sure you want to log out of the admin panel?',
    header: 'Confirm Logout',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Logout',
      severity: 'danger'
    },
    accept: async () => {
      try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          await api.post('/logout')
        }
      } catch (e) {
        // Ignore error and proceed to local logout
      }
      localStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminToken')
      delete api.defaults.headers.common['Authorization']
      router.push('/login')
    }
  })
}

onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        isDark.value = savedTheme === 'dark';
    } else {
        isDark.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
})
</script>
