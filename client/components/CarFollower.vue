<template>
  <div v-if="isVisible" class="fixed inset-0 pointer-events-none z-0">
    <!-- Tire Tracks Layer -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <svg class="w-full h-full">
        <template v-for="(track, index) in particlesList" :key="track.id">
          <g v-if="index > 0" :style="{ opacity: (track.opacity + particlesList[index - 1].opacity) / 2 * 0.3 }">
            <line 
              v-if="Math.sqrt(Math.pow(track.lx - particlesList[index - 1].lx, 2) + Math.pow(track.ly - particlesList[index - 1].ly, 2)) <= 30"
              :x1="particlesList[index - 1].lx" 
              :y1="particlesList[index - 1].ly" 
              :x2="track.lx" 
              :y2="track.ly" 
              stroke="currentColor" 
              stroke-width="2.5" 
              class="text-neutral-900 dark:text-neutral-100" 
            />
            <line 
              v-if="Math.sqrt(Math.pow(track.rx - particlesList[index - 1].rx, 2) + Math.pow(track.ry - particlesList[index - 1].ry, 2)) <= 30"
              :x1="particlesList[index - 1].rx" 
              :y1="particlesList[index - 1].ry" 
              :x2="track.rx" 
              :y2="track.ry" 
              stroke="currentColor" 
              stroke-width="2.5" 
              class="text-neutral-900 dark:text-neutral-100" 
            />
          </g>
        </template>
      </svg>
      
      <!-- Mouse target points (trail of blue dots) -->
      <div 
        v-for="pt in mousePoints" 
        :key="pt.id" 
        class="absolute w-1.5 h-1.5 rounded-full bg-blue-500/10 dark:bg-blue-400/30 blur-[0.5px]"
        :style="{ left: pt.x + 'px', top: pt.y + 'px', transform: 'translate(-50%, -50%)' }"
      ></div>
    </div>

    <!-- Car Wrapper -->
    <div 
      ref="carRef" 
      style="position: fixed; left: -25px; top: -12.5px; width: 50px; height: 25px; z-index: 0; pointer-events: none; will-change: transform;"
    >
      <svg 
        viewBox="0 0 50 25" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        class="w-full h-full opacity-70 dark:opacity-90 drop-shadow-md overflow-visible"
      >
        <defs>
          <linearGradient id="headlightGradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" class="stop-color-headlight-start" />
            <stop offset="100%" class="stop-color-headlight-end" />
          </linearGradient>
        </defs>
        
        <!-- Headlight Beams -->
        <g ref="headlightsRef" style="transition: opacity 0.3s ease; opacity: 0;">
          <path d="M48,5 L110,-15 L110,15 L48,9 Z" fill="url(#headlightGradient)" />
          <path d="M48,16 L110,10 L110,40 L48,20 Z" fill="url(#headlightGradient)" />
        </g>
        
        <!-- Car Body -->
        <path 
          d="M5,5 Q10,3 25,3 L40,3 Q48,4 48,12.5 Q48,21 40,22 L10,22 Q5,22 5,12.5 Z" 
          fill="currentColor" 
          class="text-slate-800 dark:text-slate-300" 
        />
        
        <!-- Details -->
        <rect x="25" y="4" width="18" height="17" fill="black" opacity="0.1" />
        <rect x="5" y="9" width="43" height="2" fill="currentColor" class="text-white/20 dark:text-black/20" />
        <rect x="5" y="14" width="43" height="2" fill="currentColor" class="text-white/20 dark:text-black/20" />
        <path d="M22,6 L28,6 L28,19 L22,19 Z" fill="#44CCFF" opacity="0.6" />
        
        <!-- Headlights -->
        <rect x="46" y="5" width="2" height="4" rx="0.5" fill="#FFD700" class="opacity-90 dark:opacity-100" />
        <rect x="46" y="16" width="2" height="4" rx="0.5" fill="#FFD700" class="opacity-90 dark:opacity-100" />
        
        <!-- Taillights / Braking effect -->
        <g :class="['transition-all', 'duration-200', isBraking ? 'opacity-100 scale-x-110' : 'opacity-90']">
          <g v-if="isBraking" class="animate-pulse">
            <rect x="1" y="6" width="4" height="3" fill="#FF0000" opacity="0.4" filter="blur(2px)" />
            <rect x="1" y="10" width="4" height="3" fill="#FF0000" opacity="0.4" filter="blur(2px)" />
            <rect x="1" y="14" width="4" height="3" fill="#FF0000" opacity="0.4" filter="blur(2px)" />
            <rect x="1" y="18" width="4" height="3" fill="#FF0000" opacity="0.4" filter="blur(2px)" />
            <rect x="1" y="22" width="4" height="3" fill="#FF0000" opacity="0.4" filter="blur(2px)" :transform="'translate(0,-11)'" />
            <rect x="1" y="22" width="4" height="3" fill="#FF0000" opacity="0.4" filter="blur(2px)" :transform="'translate(0,-15)'" />
          </g>
          <rect x="3" y="6" width="1" height="3" :fill="isBraking ? '#FF3333' : '#EE0000'" />
          <rect x="3" y="10" width="1" height="3" :fill="isBraking ? '#FF3333' : '#EE0000'" />
          <rect x="3" y="14" width="1" height="3" :fill="isBraking ? '#FF3333' : '#EE0000'" />
          <rect x="3" y="18" width="1" height="3" :fill="isBraking ? '#FF3333' : '#EE0000'" />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  isVisible: boolean
}>()

const carRef = ref<HTMLDivElement | null>(null)
const headlightsRef = ref<SVGElement | null>(null)

// Physics and state references
const mousePoints = ref<{ x: number; y: number; id: number }[]>([])
const pointCounter = ref(0)
const particleCounter = ref(0)
const carPos = ref({ x: 0, y: 0 })
const carAngle = ref(0)
const carSpeed = ref(0)
const steerAngle = ref(0)
const isBraking = ref(false)

const lastPointId = ref<number | null>(null)
const frameCounter = ref(0)
const targetFrames = ref(0)

const particlesList = ref<{ lx: number; ly: number; rx: number; ry: number; opacity: number; id: number }[]>([])
const lastParticlePos = ref({ x: 0, y: 0 })

let animationFrameId: number

const onMouseMove = (e: MouseEvent) => {
  const lastPoint = mousePoints.value[mousePoints.value.length - 1]
  const newPoint = { x: e.clientX, y: e.clientY, id: pointCounter.value++ }
  
  if (!lastPoint || Math.sqrt(Math.pow(newPoint.x - lastPoint.x, 2) + Math.pow(newPoint.y - lastPoint.y, 2)) > 40) {
    mousePoints.value.push(newPoint)
  }
}

const updateCarPhysics = () => {
  if (!carRef.value) return

  const minSpeed = 1.5
  const maxSpeed = 7.5
  const speedIncrement = 0.05
  const maxSteerAngle = 0.2
  const stopDistance = 30
  const steeringResponsiveness = 0.15
  
  let steeringForce = 0

  if (mousePoints.value.length > 0) {
    const target = mousePoints.value[0]
    
    if (target.id !== lastPointId.value) {
      const dx = target.x - carPos.value.x
      const dy = target.y - carPos.value.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      lastPointId.value = target.id
      frameCounter.value = 0
      targetFrames.value = (dist / maxSpeed) * 1.5 + 40
    }
    
    frameCounter.value++
    
    const dx = target.x - carPos.value.x
    const dy = target.y - carPos.value.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    let targetSpeed = maxSpeed
    if (frameCounter.value > targetFrames.value) {
      const framesOver = frameCounter.value - targetFrames.value
      const decelerationFactor = Math.max(0, 1 - framesOver / 60)
      targetSpeed = minSpeed + (maxSpeed - minSpeed) * decelerationFactor
    }
    
    if (carSpeed.value < targetSpeed) {
      carSpeed.value = Math.min(targetSpeed, carSpeed.value + speedIncrement)
      isBraking.value = false
    } else if (carSpeed.value > targetSpeed) {
      carSpeed.value = Math.max(targetSpeed, carSpeed.value - speedIncrement * 3)
      isBraking.value = true
    } else {
      isBraking.value = false
    }
    
    const speedRatio = (carSpeed.value - minSpeed) / (maxSpeed - minSpeed)
    const steerLimit = maxSteerAngle * (1 - Math.max(0, speedRatio) * 0.6)
    
    let angleDiff = Math.atan2(dy, dx) - carAngle.value
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    
    const steerAdjustment = angleDiff * steeringResponsiveness
    steeringForce = Math.max(-steerLimit, Math.min(steerLimit, steerAdjustment))
    carAngle.value += steeringForce
    
    if (Math.abs(steeringForce) > 0.08 && carSpeed.value > 4) {
      const steerDrift = steeringForce * 2.5
      steerAngle.value += (steerDrift - steerAngle.value) * 0.1
    } else {
      steerAngle.value *= 0.92
    }
    
    const actualAngle = carAngle.value + steerAngle.value
    carPos.value.x += Math.cos(actualAngle) * carSpeed.value
    carPos.value.y += Math.sin(actualAngle) * carSpeed.value
    
    if (dist < stopDistance) {
      mousePoints.value.shift()
    }
  } else {
    // Decelerate to stop
    if (carSpeed.value > 0) {
      carSpeed.value = Math.max(0, carSpeed.value - speedIncrement * 4)
      isBraking.value = true
    } else {
      isBraking.value = false
    }
    
    steerAngle.value *= 0.8
    const actualAngle = carAngle.value + steerAngle.value
    carPos.value.x += Math.cos(actualAngle) * carSpeed.value
    carPos.value.y += Math.sin(actualAngle) * carSpeed.value
  }

  // Fade existing tire track particles
  particlesList.value = particlesList.value
    .map(p => ({ ...p, opacity: p.opacity - 0.005 }))
    .filter(p => p.opacity > 0)

  // Generate new tire track particles
  const travelDist = Math.sqrt(
    Math.pow(carPos.value.x - lastParticlePos.value.x, 2) +
    Math.pow(carPos.value.y - lastParticlePos.value.y, 2)
  )
  
  const particleSpacing = Math.abs(steerAngle.value) > 0.05 ? 5 : 12
  
  if (carSpeed.value > 0.5 && travelDist > particleSpacing) {
    const rearX = carPos.value.x - Math.cos(carAngle.value) * 15
    const rearY = carPos.value.y - Math.sin(carAngle.value) * 15
    const perpX = Math.cos(carAngle.value + Math.PI / 2)
    const perpY = Math.sin(carAngle.value + Math.PI / 2)
    
    const newParticle = {
      lx: rearX + perpX * 8,
      ly: rearY + perpY * 8,
      rx: rearX - perpX * 8,
      ry: rearY - perpY * 8,
      opacity: 1,
      id: particleCounter.value++
    }
    
    particlesList.value.push(newParticle)
    if (particlesList.value.length > 200) {
      particlesList.value.shift()
    }
    
    lastParticlePos.value = { x: carPos.value.x, y: carPos.value.y }
  }

  // Apply CSS transforms
  const rotationDegrees = carAngle.value * (180 / Math.PI)
  carRef.value.style.transform = `translate3d(${carPos.value.x}px, ${carPos.value.y}px, 0) rotate(${rotationDegrees}deg)`
  
  if (headlightsRef.value) {
    headlightsRef.value.style.opacity = mousePoints.value.length > 0 ? "1" : "0"
  }

  animationFrameId = requestAnimationFrame(updateCarPhysics)
}

const startCar = () => {
  carPos.value = { x: -100, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300 }
  window.addEventListener("mousemove", onMouseMove)
  animationFrameId = requestAnimationFrame(updateCarPhysics)
}

const stopCar = () => {
  window.removeEventListener("mousemove", onMouseMove)
  cancelAnimationFrame(animationFrameId)
  mousePoints.value = []
  particlesList.value = []
  lastPointId.value = null
  carSpeed.value = 0
  steerAngle.value = 0
  isBraking.value = false
}

watch(() => props.isVisible, (visible) => {
  if (visible) {
    startCar()
  } else {
    stopCar()
  }
})

onMounted(() => {
  if (props.isVisible) {
    startCar()
  }
})

onUnmounted(() => {
  stopCar()
})
</script>

<style scoped>
.stop-color-headlight-start {
  stop-color: rgba(255, 230, 100, 0.8);
}
.stop-color-headlight-end {
  stop-color: rgba(255, 230, 100, 0);
}
:global(.dark) .stop-color-headlight-start {
  stop-color: rgba(255, 255, 200, 0.7);
}
:global(.dark) .stop-color-headlight-end {
  stop-color: rgba(255, 255, 200, 0);
}
</style>
