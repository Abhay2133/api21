<template>
  <div class="layout-wrapper">
    <TopBar @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed" />
    <div class="layout-main-container">
      <!-- Backdrop for mobile overlay sidebar -->
      <div 
        v-if="!isSidebarCollapsed && isMobile" 
        class="sidebar-backdrop" 
        @click="isSidebarCollapsed = true"
      ></div>
      
      <SideBar :collapsed="isSidebarCollapsed" />
      <main class="layout-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import SideBar from '@/components/SideBar.vue'

const route = useRoute()
const isSidebarCollapsed = ref(true)
const isMobile = ref(false)

const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768
  if (wasMobile && !isMobile.value) {
    isSidebarCollapsed.value = false
  } else if (!wasMobile && isMobile.value) {
    isSidebarCollapsed.value = true
  }
}

watch(() => route.path, () => {
  if (isMobile.value) {
    isSidebarCollapsed.value = true
  }
})

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  isSidebarCollapsed.value = isMobile.value
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
