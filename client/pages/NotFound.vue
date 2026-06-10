<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 relative">
    <GridBackground />

    <!-- Main Content Container -->
    <div class="w-full max-w-md flex flex-col items-center text-center gap-8 relative z-10 py-12">
      <!-- 404 Visual Card -->
      <div class="w-full p-8 sm:p-10 rounded-3xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-white/60 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col items-center">
        <!-- Animated 404 Text -->
        <h1 class="text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-950 to-neutral-500 dark:from-white dark:to-neutral-600 mb-2">
          404
        </h1>
        
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
          Page Not Found
        </h2>
        
        <p class="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
          The page you are looking for doesn't exist or has been moved to another URL.
        </p>

        <router-link 
          to="/" 
          class="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-8 py-3 rounded-full shadow-md hover:bg-neutral-800 dark:hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all w-full cursor-pointer"
        >
          <!-- Back arrow icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-1">
            <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
          </svg>
          Back to Home
        </router-link>
      </div>

      <!-- Footer-like indicator -->
      <p class="text-xs text-neutral-400 dark:text-neutral-600 font-mono">
        HTTP Status 404 • Not Found
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import GridBackground from '../components/GridBackground.vue'

onMounted(() => {
  // Sync dark mode class with documentElement from localStorage
  const isDark = document.documentElement.classList.contains('dark') || 
                 (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>
