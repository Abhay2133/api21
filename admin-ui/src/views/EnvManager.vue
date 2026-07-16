<template>
  <div class="flex flex-col gap-4">
    <!-- Page Header & Actions -->
    <div class="flex justify-between items-center flex-wrap gap-4 mt-2">
      <div>
        <h2 class="text-2xl font-semibold m-0">Environment Variables</h2>
        <p class="text-surface-500 m-0 mt-1">Manage configuration secrets and runtime variables.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <IconField iconPosition="left">
            <InputIcon>
              <Filter class="w-4 h-4" />
            </InputIcon>
            <InputText v-model="searchQuery" placeholder="Filter variables..." class="w-full sm:w-64" />
        </IconField>
        
        <Button @click="openAddModal" label="Add Variable">
          <template #icon>
            <Plus class="w-4 h-4 mr-1 shrink-0" />
          </template>
        </Button>
        <Button @click="saveEnv" :disabled="saving || !hasChanges" :loading="saving" label="Save Changes" severity="success">
          <template #icon>
            <Save class="w-4 h-4 mr-1 shrink-0" />
          </template>
        </Button>
      </div>
    </div>

    <!-- Loading state (Skeleton Table) -->
    <div v-if="loading" class="card mt-4">
      <DataTable :value="Array(5).fill({})" class="border rounded-md">
        <Column header="Key" style="width: 25%">
          <template #body>
            <Skeleton width="60%" height="1.25rem" />
          </template>
        </Column>
        <Column header="Value" style="width: 45%">
          <template #body>
            <Skeleton width="80%" height="1.25rem" />
          </template>
        </Column>
        <Column header="Scope" style="width: 15%">
          <template #body>
            <Skeleton width="40%" height="1.25rem" />
          </template>
        </Column>
        <Column header="Actions" style="width: 15%">
          <template #body>
            <div class="flex justify-center gap-1">
              <Skeleton shape="circle" size="2.5rem" />
              <Skeleton shape="circle" size="2.5rem" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Data Table -->
    <div v-else class="card mt-4">
      <DataTable :value="filteredVarsList" scrollable scrollHeight="flex" class="border rounded-md">
        <Column field="key" header="Key" style="width: 25%">
            <template #body="slotProps">
                <span class="font-semibold" style="word-break: break-all">{{ slotProps.data.key }}</span>
            </template>
        </Column>
        <Column field="value" header="Value" style="width: 45%">
            <template #body="slotProps">
                <div class="flex items-center gap-2">
                    <span class="font-mono" style="word-break: break-all">
                        {{ revealedKeys.includes(slotProps.data.key) ? slotProps.data.value : maskValue(slotProps.data.value) }}
                    </span>
                    <Button 
                        @click="toggleReveal(slotProps.data.key)" 
                        text rounded severity="secondary" size="small"
                        :title="revealedKeys.includes(slotProps.data.key) ? 'Hide Secret' : 'Reveal Secret'"
                    >
                      <component :is="revealedKeys.includes(slotProps.data.key) ? EyeOff : Eye" class="w-4 h-4" />
                    </Button>
                    <Button 
                        @click="copyToClipboard(slotProps.data.value)" 
                        text rounded severity="secondary" size="small"
                        title="Copy Value"
                    >
                      <Copy class="w-4 h-4" />
                    </Button>
                </div>
            </template>
        </Column>
        <Column header="Scope" style="width: 15%">
            <template #body="slotProps">
                <Badge :value="getScope(slotProps.data.key)" severity="secondary" class="text-xs"></Badge>
            </template>
        </Column>
        <Column header="Actions" style="width: 15%" headerStyle="text-align: center" bodyStyle="text-align: center">
            <template #body="slotProps">
                <div class="flex justify-center gap-1">
                    <Button @click="openEditModal(slotProps.data.key, slotProps.data.value)" text rounded severity="secondary">
                      <Pencil class="w-4 h-4" />
                    </Button>
                    <Button @click="deleteVar(slotProps.data.key)" text rounded severity="danger">
                      <Trash2 class="w-4 h-4" />
                    </Button>
                </div>
            </template>
        </Column>
        <template #empty>
            <div class="text-center p-4 text-surface-500">
                No environment variables match your search filter.
            </div>
        </template>
        <template #footer>
            <div class="flex justify-between items-center text-sm text-surface-500">
                <span>Showing {{ filteredVarsList.length }} of {{ Object.keys(envVars).length }} variables</span>
                <Badge v-if="hasChanges" value="Unsaved changes!" severity="warn"></Badge>
            </div>
        </template>
      </DataTable>
    </div>

    <!-- Variable Dialog Modal (Add/Edit) -->
    <Dialog v-model:visible="showModal" modal :header="isEditMode ? 'Edit Environment Variable' : 'Add Environment Variable'" :style="{ width: '25rem' }">
        <form @submit.prevent="submitModal" class="flex flex-col gap-4 mt-2">
            <div class="flex flex-col gap-2">
                <label for="modal-key" class="font-semibold text-sm">Variable Key</label>
                <InputText id="modal-key" v-model="modalKey" placeholder="e.g. PORT" :disabled="isEditMode" required />
            </div>

            <div class="flex flex-col gap-2">
                <label for="modal-val" class="font-semibold text-sm">Variable Value</label>
                <InputText id="modal-val" v-model="modalVal" placeholder="Value details..." required />
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" label="Cancel" severity="secondary" @click="closeModal" />
                <Button type="submit" label="Confirm" />
            </div>
        </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Badge from 'primevue/badge'
import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { Filter, Plus, Save, Eye, EyeOff, Copy, Pencil, Trash2 } from '@lucide/vue'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const envVars = ref<Record<string, string>>({})
const originalVars = ref<Record<string, string>>({})
const revealedKeys = ref<string[]>([])

const searchQuery = ref('')
const loading = ref(true)
const saving = ref(false)

const showModal = ref(false)
const isEditMode = ref(false)
const modalKey = ref('')
const modalVal = ref('')

const hasChanges = computed(() => {
  return JSON.stringify(envVars.value) !== JSON.stringify(originalVars.value)
})

const getScope = (key: string) => {
  if (['PORT', 'GO_ENV'].includes(key)) return 'SYSTEM'
  if (key.includes('DATABASE') || key.includes('REDIS')) return 'DATABASE'
  return 'GLOBAL'
}

const maskValue = (val: string) => {
  if (!val) return ''
  if (val.length <= 6) return '••••••'
  return val.slice(0, 4) + '••••••••'
}

const toggleReveal = (key: string) => {
  const index = revealedKeys.value.indexOf(key)
  if (index > -1) {
    revealedKeys.value.splice(index, 1)
  } else {
    revealedKeys.value.push(key)
  }
}

const copyToClipboard = async (val: string) => {
  try {
    await navigator.clipboard.writeText(val)
    toast.add({ severity: 'success', summary: 'Copied', detail: 'Value copied to clipboard.', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy value.', life: 3000 })
  }
}

const filteredVarsList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const list = Object.keys(envVars.value).map(key => ({
      key,
      value: envVars.value[key]
  }))

  if (!query) return list

  return list.filter(item => 
      item.key.toLowerCase().includes(query) || 
      item.value.toLowerCase().includes(query)
  )
})

const loadEnv = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      router.push('/login')
      return
    }

    const res = await api.get('/env')
    envVars.value = res.data
    originalVars.value = JSON.parse(JSON.stringify(res.data))
  } catch (err: any) {
    if (err.response?.status === 401) {
      router.push('/login')
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to load variables.', life: 3000 })
    }
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditMode.value = false
  modalKey.value = ''
  modalVal.value = ''
  showModal.value = true
}

const openEditModal = (key: string, val: string) => {
  isEditMode.value = true
  modalKey.value = key
  modalVal.value = val
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitModal = () => {
  const key = modalKey.value.trim()
  const val = modalVal.value
  
  if (key) {
    envVars.value[key] = val
    closeModal()
  }
}

const deleteVar = (key: string) => {
  confirm.require({
    message: `Are you sure you want to delete ${key}?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
    },
    acceptProps: {
        label: 'Delete',
        severity: 'danger'
    },
    accept: () => {
      delete envVars.value[key]
      toast.add({ severity: 'info', summary: 'Removed', detail: `Removed ${key} from local changes.`, life: 3000 })
    }
  })
}

const saveEnv = async () => {
  saving.value = true
  try {
    await api.post('/env', envVars.value)
    toast.add({ severity: 'success', summary: 'Success', detail: 'Environment variables updated.', life: 3000 })
    originalVars.value = JSON.parse(JSON.stringify(envVars.value))
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to save environment variables.', life: 3000 })
  } finally {
    saving.value = false
  }
}

onMounted(loadEnv)
</script>

<style scoped>
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
