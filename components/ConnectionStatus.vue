<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isOffline = ref(false);
const showOnlineToast = ref(false);

const updateOnlineStatus = () => {
  const currentStatus = !navigator.onLine;
  if (isOffline.value && !currentStatus) {
    // Transitioned from offline to online
    showOnlineToast.value = true;
    setTimeout(() => {
      showOnlineToast.value = false;
    }, 4000);
  }
  isOffline.value = currentStatus;
};

onMounted(() => {
  if (typeof window !== "undefined") {
    isOffline.value = !navigator.onLine;
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  }
});
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
    <!-- Offline Toast -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOffline"
        class="connection-toast-offline flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/90 dark:bg-black/90 backdrop-blur-md border border-red-500/30 text-white shadow-lg shadow-black/20"
      >
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 2 20 20"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"/><path d="M5 12.5a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.5 8"/><path d="M1.5 8a15.93 15.93 0 0 1 7.29-2.73"/><path d="M12 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold">You are currently offline</p>
          <p class="text-xs text-neutral-400 mt-0.5">Some features may be unavailable.</p>
        </div>
      </div>
    </Transition>

    <!-- Online Toast (Connection Restored) -->
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showOnlineToast"
        class="connection-toast-online flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/90 dark:bg-black/90 backdrop-blur-md border border-green-500/30 text-white shadow-lg shadow-black/20"
      >
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold">Connection restored</p>
          <p class="text-xs text-neutral-400 mt-0.5">You are back online.</p>
        </div>
      </div>
    </Transition>
  </div>
</template>
