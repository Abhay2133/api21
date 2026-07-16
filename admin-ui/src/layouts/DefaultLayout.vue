<template>
  <div class="layout-wrapper">
    <TopBar @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed" />
    <div class="layout-main-container">
      <SideBar :collapsed="isSidebarCollapsed" />
      <main class="layout-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '@/components/TopBar.vue'
import SideBar from '@/components/SideBar.vue'

const isSidebarCollapsed = ref(false)
</script>
