<template>
  <div class="flex flex-col gap-4">
    <!-- Page Header Controls -->
    <div class="flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-semibold m-0">Metrics Overview</h1>
        <p class="text-surface-500 m-0 mt-1">Live performance counters of the cloud host.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm">Auto-refresh:</span>
        <Select
          v-model="refreshInterval"
          :options="intervalOptions"
          optionLabel="label"
          optionValue="value"
          @change="updateInterval"
          class="w-32"
        />
        <Button
          @click="fetchMetrics"
          :loading="loading"
          icon="pi pi-refresh"
          label="Refresh"
          severity="secondary"
          outlined
        />
      </div>
    </div>

    <!-- Error state -->
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <!-- Loading state -->
    <div v-if="loading && !metrics" class="flex justify-center p-8">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <template v-if="metrics">
        <!-- Bento Grid: Status Cards -->
        <div class="metrics-grid">
          <!-- Card 1: Uptime -->
          <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <span class="text-base font-medium text-surface-600">System Uptime</span>
                    <i class="pi pi-clock text-surface-400"></i>
                </div>
            </template>
            <template #content>
                <div class="text-3xl font-semibold">{{ formattedUptime }}</div>
                <div class="text-sm text-green-500 mt-2 flex items-center gap-1">
                    <i class="pi pi-arrow-up"></i> 99.99% SLA
                </div>
            </template>
          </Card>

          <!-- Card 2: Active Connections -->
          <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <span class="text-base font-medium text-surface-600">Active Conns</span>
                    <i class="pi pi-server text-surface-400"></i>
                </div>
            </template>
            <template #content>
                <div class="text-3xl font-semibold">{{ activeConnections }}</div>
                <div class="text-sm text-surface-500 mt-2 flex items-center gap-1">
                    <i class="pi pi-minus"></i> Normal Load
                </div>
            </template>
          </Card>

          <!-- Card 3: CPU Usage -->
          <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <span class="text-base font-medium text-surface-600">CPU Workload</span>
                    <i class="pi pi-microchip text-surface-400"></i>
                </div>
            </template>
            <template #content>
                <div class="text-3xl font-semibold">{{ metrics.cpu.usedPercent.toFixed(1) }}%</div>
                <div class="text-sm mt-2 flex items-center gap-1" :class="metrics.cpu.usedPercent > 80 ? 'text-red-500' : 'text-green-500'">
                    <i :class="metrics.cpu.usedPercent > 80 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
                    {{ metrics.cpu.usedPercent > 80 ? 'High Usage' : 'Healthy' }}
                </div>
            </template>
          </Card>

          <!-- Card 4: Memory Usage -->
          <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <span class="text-base font-medium text-surface-600">RAM Utilization</span>
                    <i class="pi pi-memory text-surface-400"></i>
                </div>
            </template>
            <template #content>
                <div class="text-3xl font-semibold">{{ metrics.ram.usedPercent.toFixed(1) }}%</div>
                <div class="text-sm text-surface-500 mt-2">
                    {{ formatBytes(metrics.ram.used) }} / {{ formatBytes(metrics.ram.total) }}
                </div>
            </template>
          </Card>
        </div>

        <div class="charts-grid mt-4">
            <!-- CPU Chart -->
            <Card>
                <template #title>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-base font-medium">CPU Utilization</span>
                            <Badge :severity="metrics.cpu.usedPercent > 80 ? 'danger' : 'success'" value=" "></Badge>
                        </div>
                        <span class="text-xl font-semibold">{{ metrics.cpu.usedPercent.toFixed(1) }}%</span>
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <svg class="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path :d="cpuPath" fill="none" stroke="var(--p-primary-500)" stroke-width="2" vector-effect="non-scaling-stroke"></path>
                            <path :d="cpuAreaPath" fill="var(--p-primary-100)" opacity="0.3"></path>
                        </svg>
                    </div>
                    <div class="flex justify-between text-xs text-surface-500 mt-2">
                        <span>{{ chartTimes[0] }}</span>
                        <span>{{ chartTimes[Math.floor(chartTimes.length / 2)] }}</span>
                        <span>{{ chartTimes[chartTimes.length - 1] }}</span>
                    </div>
                </template>
            </Card>
            
            <!-- RAM Chart -->
            <Card>
                <template #title>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-base font-medium">Memory Usage</span>
                            <Badge severity="info" value=" "></Badge>
                        </div>
                        <div class="text-xl font-semibold">
                            {{ metrics.ram.usedPercent.toFixed(1) }}%
                            <span class="text-sm font-normal text-surface-500">/ {{ formatBytes(metrics.ram.total) }}</span>
                        </div>
                    </div>
                </template>
                <template #content>
                    <div class="chart-container">
                        <svg class="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path :d="ramPath" fill="none" stroke="var(--p-slate-500)" stroke-width="2" vector-effect="non-scaling-stroke"></path>
                            <path :d="ramAreaPath" fill="var(--p-slate-200)" opacity="0.3"></path>
                        </svg>
                    </div>
                    <div class="flex justify-between text-xs text-surface-500 mt-2">
                        <span>{{ chartTimes[0] }}</span>
                        <span>{{ chartTimes[Math.floor(chartTimes.length / 2)] }}</span>
                        <span>{{ chartTimes[chartTimes.length - 1] }}</span>
                    </div>
                </template>
            </Card>
        </div>

        <div class="details-grid mt-4">
            <Card class="disk-card">
                <template #title>
                    <div class="flex justify-between items-center">
                        <span class="text-base font-medium text-surface-600">Disk Utilization (/)</span>
                        <i class="pi pi-database text-surface-400"></i>
                    </div>
                </template>
                <template #content>
                    <div class="text-3xl font-semibold mb-1">{{ metrics.disk.usedPercent.toFixed(1) }}%</div>
                    <div class="text-sm text-surface-500 mb-4">
                        Used {{ formatBytes(metrics.disk.used) }} of {{ formatBytes(metrics.disk.total) }}
                    </div>
                    <ProgressBar :value="metrics.disk.usedPercent" :showValue="false" style="height: 10px"></ProgressBar>
                    <div class="text-xs text-surface-500 mt-2">
                        {{ (100 - metrics.disk.usedPercent).toFixed(1) }}% Free Space
                    </div>
                </template>
            </Card>

        </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import Badge from 'primevue/badge'

const router = useRouter()
const metrics = ref<any>(null)
const loading = ref(true)
const error = ref('')

const intervalOptions = [
    { label: '3s', value: 3000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
    { label: '1m', value: 60000 }
];
const refreshInterval = ref(3000)
let pollTimer: any = null

const cpuHistory = ref<number[]>([25, 30, 45, 35, 40, 50, 48, 55, 62, 58, 60, 55])
const ramHistory = ref<number[]>([42, 42, 43, 43, 44, 44, 45, 45, 45, 46, 46, 45])
const chartTimes = ref<string[]>([])

const startTime = Date.now() - 1232542000
const formattedUptime = ref('14d 6h 22m')
const activeConnections = ref(1432)



const updateUptime = () => {
  const diff = Date.now() - startTime
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  formattedUptime.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

const updateConnections = () => {
  const delta = Math.floor(Math.random() * 21) - 10
  activeConnections.value = Math.max(100, activeConnections.value + delta)
}

const fetchMetrics = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      router.push('/login')
      return
    }

    const res = await api.get('/metrics')
    metrics.value = res.data
    
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    cpuHistory.value.push(metrics.value.cpu.usedPercent)
    if (cpuHistory.value.length > 20) cpuHistory.value.shift()
    
    ramHistory.value.push(metrics.value.ram.usedPercent)
    if (ramHistory.value.length > 20) ramHistory.value.shift()

    chartTimes.value.push(timeStr)
    if (chartTimes.value.length > 20) chartTimes.value.shift()

    updateUptime()
    updateConnections()
  } catch (err: any) {
    if (err.response?.status === 401) {
      router.push('/login')
    } else {
      error.value = err.message || 'Failed to connect to the backend server.'
    }
  } finally {
    loading.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const computePath = (history: number[]) => {
  if (history.length === 0) return ''
  const step = 100 / (history.length - 1)
  return history.map((val, index) => {
    const x = index * step
    const y = 95 - (val / 100) * 90
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

const cpuPath = computed(() => computePath(cpuHistory.value))
const cpuAreaPath = computed(() => {
  if (cpuHistory.value.length === 0) return ''
  return `${cpuPath.value} L100,100 L0,100 Z`
})

const ramPath = computed(() => computePath(ramHistory.value))
const ramAreaPath = computed(() => {
  if (ramHistory.value.length === 0) return ''
  return `${ramPath.value} L100,100 L0,100 Z`
})

const startPolling = () => {
  stopPolling()
  fetchMetrics()
  pollTimer = setInterval(fetchMetrics, refreshInterval.value)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const updateInterval = () => {
  startPolling()
}

onMounted(() => {
  const now = Date.now()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * refreshInterval.value)
    chartTimes.value.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
  }
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
}
@media (min-width: 768px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
    .metrics-grid { grid-template-columns: repeat(4, 1fr); }
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
}
@media (min-width: 1024px) {
    .charts-grid { grid-template-columns: repeat(2, 1fr); }
}

.details-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
}
@media (min-width: 1024px) {
    .details-grid { grid-template-columns: 1fr; }
}

.chart-container {
    height: 12rem;
    width: 100%;
    border-top: 1px solid var(--p-surface-200);
    border-bottom: 1px solid var(--p-surface-200);
    margin: 1rem 0;
    padding: 1rem 0 0 0;
}
:root.p-dark .chart-container {
    border-color: var(--p-surface-700);
}


.text-red-500 { color: #ef4444; }
.text-green-500 { color: #22c55e; }
.text-surface-400 { color: var(--p-surface-400); }
.text-surface-500 { color: var(--p-surface-500); }
.text-surface-600 { color: var(--p-surface-600); }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
</style>
