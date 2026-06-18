<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#fafafa] dark:bg-[#0a0a0a]">
    <!-- Grid pattern -->
    <svg class="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="gridPattern" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" class="stroke-black/5 dark:stroke-white/5" stroke-width="1"></path>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gridPattern)"></rect>
    </svg>

    <!-- Top-right rotating circle -->
    <svg 
      class="absolute -top-64 -right-64 text-neutral-200/40 dark:text-neutral-800/40" 
      width="800" 
      height="800" 
      viewBox="0 0 800 800" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style="animation: spin 150s linear infinite;"
    >
      <circle cx="400" cy="400" r="300" stroke="currentColor" stroke-width="1"></circle>
      <circle cx="400" cy="400" r="250" stroke="currentColor" stroke-width="1" stroke-dasharray="10 10"></circle>
      <circle cx="400" cy="400" r="200" stroke="currentColor" stroke-width="1"></circle>
      <line x1="100" y1="400" x2="700" y2="400" stroke="currentColor" stroke-width="1"></line>
      <line x1="400" y1="100" x2="400" y2="700" stroke="currentColor" stroke-width="1"></line>
    </svg>

    <!-- Bottom-left floating pattern -->
    <svg 
      class="absolute -bottom-48 -left-48 text-neutral-200/40 dark:text-neutral-800/40" 
      width="600" 
      height="600" 
      viewBox="0 0 600 600" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style="animation: float-y 10s ease-in-out infinite;"
    >
      <path d="M 100 500 L 500 100" stroke="currentColor" stroke-width="1"></path>
      <path d="M 150 500 L 500 150" stroke="currentColor" stroke-width="1"></path>
      <path d="M 200 500 L 500 200" stroke="currentColor" stroke-width="1"></path>
      <path d="M 250 500 L 500 250" stroke="currentColor" stroke-width="1"></path>
      <path d="M 300 500 L 500 300" stroke="currentColor" stroke-width="1"></path>
      <circle cx="300" cy="300" r="10" stroke="currentColor" stroke-width="2"></circle>
    </svg>
  </div>
</template>

<script setup lang="ts">
// Component is purely presentational
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float-y {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
</style>
