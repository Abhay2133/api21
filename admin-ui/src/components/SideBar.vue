<template>
  <aside class="layout-sidebar" :class="{ 'collapsed': collapsed }">
    <div class="flex flex-col gap-1 py-2">
      <div 
        v-for="item in menuItems" 
        :key="item.to"
        @click="navigate(item.to)"
        class="sidebar-item"
        :class="{ 'active': isActive(item.to) }"
        :title="collapsed ? item.label : ''"
      >
        <component :is="item.icon" :size="20" class="sidebar-icon" />
        <span v-if="!collapsed" class="sidebar-label">{{ item.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Activity, Settings, Terminal, Shield } from '@lucide/vue'

defineProps<{
  collapsed: boolean
}>()

const route = useRoute()
const router = useRouter()

const menuItems = ref([
    {
        label: 'System Metrics',
        icon: Activity,
        to: '/'
    },
    {
        label: 'Env Variables',
        icon: Settings,
        to: '/env'
    },
    {
        label: 'Terminal',
        icon: Terminal,
        to: '/terminal'
    },
    {
        label: 'Sessions',
        icon: Shield,
        to: '/sessions'
    }
]);

const isActive = (to: string) => route.path === to
const navigate = (to: string) => {
  router.push(to)
}
</script>
