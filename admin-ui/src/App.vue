<template>
  <div v-if="isLoginPage">
    <router-view />
  </div>
  <div v-else class="layout-wrapper">
    <!-- TopNavBar -->
    <header class="layout-topbar">
      <div class="flex items-center gap-2">
        <Button icon="pi pi-bars" text rounded @click="isSidebarCollapsed = !isSidebarCollapsed" aria-label="Toggle Sidebar" />
        <span style="font-size: 1.25rem; font-weight: 600;">CloudAdmin</span>
      </div>
      <div class="flex items-center gap-2">
        <Button :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" text rounded @click="toggleDarkMode" aria-label="Toggle Dark Mode" />
        <Button icon="pi pi-sign-out" text rounded @click="logout" aria-label="Sign Out" />
      </div>
    </header>

    <div class="layout-main-container">
      <aside class="layout-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
        <div class="flex flex-col gap-1 py-2">
          <div 
            v-for="item in menuItems" 
            :key="item.to"
            @click="navigate(item.to)"
            class="sidebar-item"
            :class="{ 'active': isActive(item.to) }"
            :title="isSidebarCollapsed ? item.label : ''"
          >
            <span :class="[item.icon, 'sidebar-icon']" />
            <span v-if="!isSidebarCollapsed" class="sidebar-label">{{ item.label }}</span>
          </div>
        </div>
      </aside>
      <main class="layout-main">
        <router-view />
      </main>
    </div>
  </div>
  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import api from './api'


const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.path === '/login')
const isDark = ref(false)
const isSidebarCollapsed = ref(false)

const menuItems = ref([
    {
        label: 'System Metrics',
        icon: 'pi pi-chart-line',
        to: '/'
    },
    {
        label: 'Env Variables',
        icon: 'pi pi-cog',
        to: '/env'
    },
    {
        label: 'Terminal',
        icon: 'pi pi-code',
        to: '/terminal'
    },
    {
        label: 'Sessions',
        icon: 'pi pi-shield',
        to: '/sessions'
    }
]);

const isActive = (to: string) => route.path === to
const navigate = (to: string) => {
  router.push(to)
}

const logout = async () => {
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
    
    if (isDark.value) {
        document.documentElement.classList.add('p-dark');
    } else {
        document.documentElement.classList.remove('p-dark');
    }
})
</script>

