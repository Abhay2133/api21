<template>
  <div class="sessions-container flex flex-col gap-6 p-6">
    <div class="flex flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold m-0 flex items-center gap-2">
          <i class="pi pi-shield text-primary" style="font-size: 1.8rem;"></i>
          Session Management
        </h1>
        <p class="text-surface-500 dark:text-surface-400 m-0 mt-1">
          Monitor and manage active admin sessions. Revoke access for other devices if needed.
        </p>
      </div>
      <div class="shrink-0">
        <Button 
          label="Logout All Other Sessions" 
          icon="pi pi-power-off" 
          severity="danger" 
          outlined
          @click="confirmLogoutAllOthers" 
          :disabled="activeSessionsCount <= 1"
        />
      </div>
    </div>

    <!-- Error message if any -->
    <Message v-if="error" severity="error" @close="error = ''" :closable="true">{{ error }}</Message>

    <Card class="border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
      <template #content>
        <DataTable 
          :value="filteredSessions" 
          :loading="loading"
          stripedRows
          responsiveLayout="scroll"
          scrollable
          scrollHeight="400px"
          class="w-full text-sm sticky-header-table"
          tableStyle="min-width: 50rem"
        >
          <!-- Table Header / Audit Filter -->
          <template #header>
            <div class="flex justify-between items-center gap-4 py-1">
              <span class="text-base font-bold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                <i class="pi pi-list text-primary"></i>
                Session Audit Log
              </span>
              <div class="flex items-center gap-2">
                <label for="status-filter" class="font-semibold text-xs text-surface-600 dark:text-surface-400">Filter Status:</label>
                <Select 
                  id="status-filter"
                  v-model="statusFilter" 
                  :options="filterOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  class="w-40 text-xs"
                />
              </div>
            </div>
          </template>
          <!-- Empty State -->
          <template #empty>
            <div class="flex flex-col items-center justify-center py-12 text-surface-500 dark:text-surface-400">
              <i class="pi pi-key text-surface-400 dark:text-surface-600 mb-3" style="font-size: 2.5rem;"></i>
              <h3 class="m-0 text-base font-semibold text-surface-700 dark:text-surface-300">No Active Sessions</h3>
              <p class="m-0 text-sm mt-1">This should not happen as you are currently logged in.</p>
            </div>
          </template>

          <!-- Loading Spinner -->
          <template #loading>
            <div class="flex justify-center items-center py-12">
              <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            </div>
          </template>

          <!-- Browser Column -->
          <Column header="Browser" sortable style="width: 15%">
            <template #body="slotProps">
              <div class="flex items-center gap-2.5 py-1">
                <div class="avatar-icon p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                  <i :class="[parseUA(slotProps.data.user_agent).browserIcon, 'text-lg']"></i>
                </div>
                <div class="flex flex-col">
                  <span class="font-bold text-surface-800 dark:text-surface-100">
                    {{ parseUA(slotProps.data.user_agent).browser }}
                  </span>
                  <span 
                    v-if="isCurrentSession(slotProps.data.token)" 
                    style="white-space: nowrap; padding: 3px 8px;"
                    class="inline-flex items-center gap-1 text-xs font-semibold mt-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                  >
                    <i class="pi pi-check-circle" style="font-size: 0.65rem;"></i> This Device
                  </span>
                </div>
              </div>
            </template>
          </Column>

          <!-- Device / OS Column -->
          <Column header="Device / OS" sortable style="width: 25%">
            <template #body="slotProps">
              <div class="flex items-center gap-2.5 py-1">
                <div class="avatar-icon p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                  <i :class="[parseUA(slotProps.data.user_agent).osIcon, 'text-lg']"></i>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-semibold text-surface-700 dark:text-surface-200">
                    {{ parseUA(slotProps.data.user_agent).os }}
                  </span>
                  <span class="text-xs text-surface-400 mt-0.5" :title="slotProps.data.user_agent">
                    {{ truncateUA(slotProps.data.user_agent) }}
                  </span>
                </div>
              </div>
            </template>
          </Column>

          <!-- IP Address Column -->
          <Column header="IP Address" sortable style="width: 20%">
            <template #body="slotProps">
              <div class="flex items-center gap-2 font-mono text-surface-700 dark:text-surface-300">
                <i class="pi pi-map-marker text-xs text-surface-400"></i>
                <span>{{ slotProps.data.ip_address }}</span>
              </div>
            </template>
          </Column>

          <!-- Username Column -->
          <Column header="Admin User" sortable style="width: 15%">
            <template #body="slotProps">
              <div class="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                <i class="pi pi-user text-xs text-surface-400"></i>
                <span>{{ slotProps.data.username }}</span>
              </div>
            </template>
          </Column>

          <!-- Logged In At Column -->
          <Column header="Logged In Since" sortable style="width: 20%">
            <template #body="slotProps">
              <div class="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                <i class="pi pi-calendar text-xs text-surface-400"></i>
                <span>{{ formatDate(slotProps.data.created_at) }}</span>
              </div>
            </template>
          </Column>

          <!-- Status Column -->
          <Column header="Status" sortable style="width: 15%">
            <template #body="slotProps">
              <Tag 
                v-if="slotProps.data.is_active" 
                severity="success" 
                value="Active" 
                icon="pi pi-check-circle" 
              />
              <Tag 
                v-else 
                severity="secondary" 
                value="Inactive" 
                icon="pi pi-times-circle" 
              />
            </template>
          </Column>

          <!-- Actions Column -->
          <Column header="Action" style="width: 15%; text-align: right">
            <template #body="slotProps">
              <div class="flex justify-end pr-2">
                <Button 
                  v-if="slotProps.data.is_active && !isCurrentSession(slotProps.data.token)"
                  label="Logout" 
                  icon="pi pi-sign-out" 
                  severity="danger" 
                  text 
                  size="small"
                  class="font-semibold"
                  @click="confirmLogout(slotProps.data.id)" 
                />
                <span v-else-if="slotProps.data.is_active && isCurrentSession(slotProps.data.token)" style="white-space: nowrap; padding: 3px 8px;" class="text-xs text-success-500 font-semibold inline-flex items-center gap-1.5 bg-success-50 dark:bg-success-950/20 rounded-full border border-success-200 dark:border-success-800">
                  <i class="pi pi-check-circle text-xs"></i> Current
                </span>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '../api'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'

interface Session {
  id: number
  token: string
  username: string
  ip_address: string
  user_agent: string
  is_active: boolean
  created_at: string
}

const sessions = ref<Session[]>([])
const loading = ref(false)
const error = ref('')
const activeSessionsCount = computed(() => sessions.value.filter(s => s.is_active).length)

// Client-side filtering for Audit
const statusFilter = ref('all')
const filterOptions = ref([
  { label: 'All Sessions', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
])

const filteredSessions = computed(() => {
  if (statusFilter.value === 'active') {
    return sessions.value.filter(s => s.is_active)
  }
  if (statusFilter.value === 'inactive') {
    return sessions.value.filter(s => !s.is_active)
  }
  return sessions.value
})
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const getLocalToken = () => {
  return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || ''
}

const isCurrentSession = (token: string) => {
  return token === getLocalToken()
}

const fetchSessions = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = getLocalToken()
    if (!token) {
      router.push('/login')
      return
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const res = await api.get('/sessions')
    sessions.value = res.data
  } catch (err: any) {
    if (err.response?.status === 401) {
      router.push('/login')
    } else {
      error.value = err.message || 'Failed to fetch sessions.'
    }
  } finally {
    loading.value = false
  }
}

const parseUA = (ua: string) => {
  if (!ua) return { 
    browser: 'Unknown Browser', 
    os: 'Unknown OS', 
    browserIcon: 'pi pi-globe', 
    osIcon: 'pi pi-desktop' 
  }
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'
  let browserIcon = 'pi pi-globe'
  let osIcon = 'pi pi-desktop'

  if (ua.includes('Firefox')) {
    browser = 'Firefox'
    browserIcon = 'pi pi-globe'
  } else if (ua.includes('Chrome') || ua.includes('Chromium')) {
    browser = 'Chrome'
    browserIcon = 'pi pi-google'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari'
    browserIcon = 'pi pi-compass'
  } else if (ua.includes('Edge') || ua.includes('Edg')) {
    browser = 'Edge'
    browserIcon = 'pi pi-microsoft'
  }

  if (ua.includes('Windows')) {
    os = 'Windows'
    osIcon = 'pi pi-microsoft'
  } else if (ua.includes('Macintosh') || ua.includes('Mac OS')) {
    os = 'macOS'
    osIcon = 'pi pi-apple'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
    osIcon = 'pi pi-desktop'
  } else if (ua.includes('Android')) {
    os = 'Android'
    osIcon = 'pi pi-android'
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS'
    osIcon = 'pi pi-mobile'
  }

  return { browser, os, browserIcon, osIcon }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const truncateUA = (ua: string) => {
  if (!ua) return ''
  const limit = 40
  return ua.length > limit ? ua.slice(0, limit) + '...' : ua
}

const confirmLogout = (id: number) => {
  confirm.require({
    message: 'Are you sure you want to log out this session? The device will be logged out immediately.',
    header: 'Logout Session Access',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Logout',
      severity: 'danger'
    },
    accept: async () => {
      try {
        const token = getLocalToken()
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await api.delete(`/sessions/${id}`)
        toast.add({ severity: 'success', summary: 'Inactive', detail: 'Session logged out successfully.', life: 3000 })
        fetchSessions()
      } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to logout session.', life: 3000 })
      }
    }
  })
}

const confirmLogoutAllOthers = () => {
  confirm.require({
    message: 'Are you sure you want to log out all other active sessions? All other logged-in devices will lose access immediately.',
    header: 'Logout All Other Sessions',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Logout All Others',
      severity: 'danger'
    },
    accept: async () => {
      try {
        const token = getLocalToken()
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const currentToken = getLocalToken()
        
        // Loop and logout other sessions (only active ones)
        for (const session of sessions.value) {
          if (session.is_active && session.token !== currentToken) {
            await api.delete(`/sessions/${session.id}`)
          }
        }
        
        toast.add({ severity: 'success', summary: 'Success', detail: 'All other sessions logged out successfully.', life: 3000 })
        fetchSessions()
      } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to logout some sessions.', life: 3000 })
      }
    }
  })
}

onMounted(() => {
  fetchSessions()
})
</script>

<style scoped>
.sessions-container {
  max-width: 1200px;
  margin: 0 auto;
}
.avatar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
}
</style>
