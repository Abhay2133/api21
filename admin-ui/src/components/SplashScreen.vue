<template>
  <div :class="['splash-screen', { 'fade-out': !visible }]">
    <div class="splash-logo-container">
      <svg class="splash-cloud" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="splash-cloud-grad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stop-color="#8B5CF6" />
            <stop offset="50%" stop-color="#6366F1" />
            <stop offset="100%" stop-color="#3B82F6" />
          </linearGradient>
        </defs>
        <path d="M46.5 48c3.59 0 6.5-2.91 6.5-6.5 0-3.32-2.5-6.04-5.74-6.44A14.94 14.94 0 0 0 30 20c-7.06 0-13 5.06-14.26 11.9C11.54 32.74 9 36.32 9 40.5 9 44.64 12.36 48 16.5 48h30z" 
              fill="url(#splash-cloud-grad)" />
      </svg>
      <h1 class="splash-title">CloudAdmin</h1>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>
