<script setup lang="ts">
// Access the global $pwa helper injected by @vite-pwa/nuxt on the client side only
const pwa = typeof window !== 'undefined' ? useNuxtApp().$pwa : null;
</script>

<template>
  <ClientOnly>
    <div
      v-if="pwa?.needRefresh"
      class="fixed bottom-6 left-6 z-50 max-w-sm w-full px-4 sm:px-0 animate-bounce-short"
    >
      <div
        class="p-4 rounded-2xl bg-neutral-900/90 dark:bg-black/90 backdrop-blur-md border border-indigo-500/30 text-white shadow-lg shadow-black/20 flex flex-col gap-3"
      >
        <div class="flex gap-3 items-start">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold">Update Available</p>
            <p class="text-xs text-neutral-400 mt-0.5">A new version of the application is available. Reload to update.</p>
          </div>
        </div>
        
        <div class="flex gap-2 justify-end text-xs font-semibold mt-1">
          <button
            @click="pwa?.cancelPrompt()"
            class="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
          >
            Later
          </button>
          <button
            @click="pwa?.updateServiceWorker()"
            class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white transition-opacity cursor-pointer"
          >
            Update & Reload
          </button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
@keyframes bounceShort {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
.animate-bounce-short {
  animation: bounceShort 2s infinite ease-in-out;
}
</style>
