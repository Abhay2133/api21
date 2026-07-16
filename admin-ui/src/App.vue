<template>
  <!-- Splash Screen / Loader Overlay -->
  <SplashScreen :visible="isInitializing" />

  <router-view v-if="isLoginPage" />
  <DefaultLayout v-else>
    <router-view />
  </DefaultLayout>

  <Toast />
  <ConfirmDialog>
    <template #icon>
      <AlertTriangle class="w-8 h-8 text-yellow-500 mr-2 shrink-0" />
    </template>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import SplashScreen from '@/components/SplashScreen.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { AlertTriangle } from '@lucide/vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
const isInitializing = ref(true)

onMounted(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
        document.documentElement.classList.add('p-dark');
    } else {
        document.documentElement.classList.remove('p-dark');
    }

    setTimeout(() => {
        isInitializing.value = false;
    }, 1200);
})
</script>
