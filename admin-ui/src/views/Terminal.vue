<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Terminal Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <h1 class="text-2xl font-semibold m-0">Interactive Terminal</h1>
        <p class="text-surface-500 m-0 mt-1">Direct secure shell access to the host instance.</p>
      </div>
    </div>

    <!-- Terminal Frame -->
    <div class="flex-1 overflow-hidden flex flex-col rounded-md shadow-sm min-h-[300px] terminal-frame">
      <!-- Terminal Toolbar -->
      <div class="h-12 px-4 flex items-center justify-between flex-shrink-0 terminal-toolbar">
        <div class="flex items-center gap-2">
        </div>
        <div class="flex items-center gap-2">
          <Button @click="reconnect" icon="pi pi-refresh" label="Reconnect" text size="small" severity="secondary" />
          <Button @click="clearTerminal" icon="pi pi-trash" label="Clear" text size="small" severity="secondary" />
          <div class="w-px h-4 mx-1 terminal-divider"></div>
          <Button @click="copyTerminalSelection" icon="pi pi-copy" text rounded size="small" severity="secondary" title="Copy Selected Text" />
        </div>
      </div>

      <!-- Terminal Output Container -->
      <div class="flex-1 relative overflow-hidden p-2 terminal-output-container">
        <div ref="terminalContainer" class="w-full h-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()
const terminalContainer = ref<HTMLElement | null>(null)
let term: Terminal | null = null
let ws: WebSocket | null = null
let fitAddon: FitAddon | null = null
let observer: MutationObserver | null = null

const darkTheme = {
  background: '#0c0a09',
  foreground: '#f5f5f4',
  cursor: '#38bdf8',
  black: '#000000',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
  magenta: '#a855f7',
  cyan: '#06b6d4',
  white: '#f5f5f4',
  brightBlack: '#78716c',
  brightRed: '#f87171',
  brightGreen: '#4ade80',
  brightYellow: '#facc15',
  brightBlue: '#60a5fa',
  brightMagenta: '#c084fc',
  brightCyan: '#22d3ee',
  brightWhite: '#fafaf9'
}

const lightTheme = {
  background: '#fafaf9',
  foreground: '#1c1917',
  cursor: '#0284c7',
  black: '#1c1917',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#fafaf9',
  brightBlack: '#78716c',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#eab308',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#ffffff'
}

const isDark = () => document.documentElement.classList.contains('p-dark')

const getTerminalTheme = () => {
  return isDark() ? darkTheme : lightTheme
}

const updateTerminalTheme = () => {
  if (term) {
    term.options.theme = getTerminalTheme()
  }
}

const startThemeObserver = () => {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        updateTerminalTheme()
      }
    })
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
}

const clearTerminal = () => {
  if (term) term.clear()
}

const copyTerminalSelection = () => {
  if (term) {
    const selection = term.getSelection()
    if (selection) {
      navigator.clipboard.writeText(selection)
      toast.add({ severity: 'success', summary: 'Copied', detail: 'Selected terminal text copied to clipboard!', life: 3000 });
    } else {
      toast.add({ severity: 'warn', summary: 'Notice', detail: 'Please select some text in the terminal first.', life: 3000 });
    }
  }
}

const reconnect = async () => {
  if (ws) ws.close()
  if (term) term.clear()
  setupWebSocket()
}

const setupWebSocket = () => {
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
  if (!token) return

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.abhaybisht.com/admin'
  const parsedUrl = new URL(baseUrl)
  const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  
  const wsUrl = `${wsProtocol}//${parsedUrl.host}${parsedUrl.pathname}/terminal`
  
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    // Send opaque token as the first authentication message
    ws?.send(JSON.stringify({
      type: 'auth',
      token: token
    }))
    term?.writeln('\x1b[32mSuccessfully connected to server terminal.\x1b[0m')
  }

  ws.onmessage = (event) => {
    term?.write(event.data)
  }

  ws.onerror = () => {
    term?.writeln('\x1b[31mWebSocket Error. Ensure the backend is running and CORS/Auth allows the connection.\x1b[0m')
  }

  ws.onclose = () => {
    term?.writeln('\r\n\x1b[33mConnection closed.\x1b[0m')
  }
}

onMounted(async () => {
  const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
  if (!token) {
    return router.push('/login')
  }

  term = new Terminal({
    cursorBlink: true,
    theme: getTerminalTheme(),
    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
    fontSize: 14
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)

  await nextTick()
  if (terminalContainer.value) {
    term.open(terminalContainer.value)
    fitAddon.fit()
  }

  setupWebSocket()
  startThemeObserver()

  term.onData((data) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data)
    }
  })

  window.addEventListener('resize', handleResize)
  setTimeout(() => handleResize(), 100)
})

const handleResize = () => {
  if (fitAddon) fitAddon.fit()
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (ws) ws.close()
  if (term) term.dispose()
  if (observer) observer.disconnect()
})
</script>

<style scoped>
:deep(.xterm-viewport) {
  overflow-y: auto !important;
  background-color: transparent !important;
}
:deep(.xterm-screen) {
  height: 100% !important;
}
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

.terminal-frame {
  border: 1px solid var(--p-surface-200);
  background-color: var(--p-surface-50);
}
:root.p-dark .terminal-frame {
  border-color: var(--p-surface-800);
  background-color: var(--p-surface-950);
}

.terminal-toolbar {
  border-bottom: 1px solid var(--p-surface-200);
  background-color: var(--p-surface-100);
}
:root.p-dark .terminal-toolbar {
  border-color: var(--p-surface-800);
  background-color: var(--p-surface-900);
}

.terminal-divider {
  background-color: var(--p-surface-200);
}
:root.p-dark .terminal-divider {
  background-color: var(--p-surface-700);
}

.terminal-output-container {
  background-color: #fafaf9;
}
:root.p-dark .terminal-output-container {
  background-color: #0c0a09;
}
</style>
