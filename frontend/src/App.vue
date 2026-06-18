<template>
  <div class="min-h-screen flex flex-col items-center px-6 sm:px-12 relative overflow-x-hidden">
    <!-- Custom Cursor (Desktop Only) -->
    <div v-if="showCustomCursor" class="hidden md:block">
      <div ref="cursorDot" class="fixed top-0 left-0 w-2 h-2 bg-neutral-900 dark:bg-white rounded-full pointer-events-none z-50 mix-blend-difference"></div>
      <div ref="cursorRing" class="fixed top-0 left-0 w-8 h-8 border border-neutral-950/30 dark:border-white/30 rounded-full pointer-events-none z-50"></div>
    </div>

    <!-- Intro Overlay / Preloader -->
    <div 
      v-if="showIntro" 
      ref="introOverlay" 
      class="fixed inset-0 bg-neutral-955 flex flex-col items-center justify-center z-[999] pointer-events-auto overflow-hidden"
    >
      <h1 ref="introName" class="text-5xl sm:text-7xl font-bold tracking-tight text-white select-none overflow-hidden py-3">
        Abhay Bisht
      </h1>
    </div>

    <!-- Grid and decorative floating background shapes -->
    <GridBackground />

    <!-- Car follower client-side interaction -->
    <CarFollower :isVisible="isCarVisible" />

    <!-- Main Content Container -->
    <div class="w-full max-w-2xl flex flex-col gap-12 sm:gap-20 relative z-10 pt-6 pb-12">
      <!-- Navbar -->
      <nav class="flex justify-between items-center w-full sticky top-6 z-50 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border border-white/60 dark:border-neutral-800/60 p-3 sm:px-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div class="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 px-2 cursor-pointer magnetic-target">
          Abhay Bisht
        </div>
        
        <div class="flex gap-4 items-center px-2">
          <!-- Car follower toggle -->
          <div class="relative group flex items-center justify-center">
            <button 
              @click="toggleCar"
              :class="['transition-all p-1 rounded-md cursor-pointer magnetic-target', isCarVisible ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100']"
              aria-label="Toggle Car Follower"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 sm:w-5 sm:h-5">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </button>
            <!-- Custom Tooltip -->
            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <div class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap shadow-black/10">
                {{ isCarVisible ? 'Disable Car' : 'Enable Car' }}
              </div>
              <div class="w-2.5 h-2.5 -mt-1.5 border-[5px] border-transparent border-t-neutral-900 dark:border-t-white"></div>
            </div>
          </div>

          <!-- Dark mode toggle -->
          <div class="relative group flex items-center justify-center">
            <button 
              @click="toggleDarkMode"
              class="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all p-1 cursor-pointer magnetic-target"
              aria-label="Toggle Dark Mode"
            >
              <!-- Sun Icon (if dark mode active) -->
              <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 sm:w-5 sm:h-5">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
              <!-- Moon Icon (if light mode active) -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 sm:w-5 sm:h-5">
                <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
              </svg>
            </button>
            <!-- Custom Tooltip -->
            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <div class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap shadow-black/10">
                {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
              </div>
              <div class="w-2.5 h-2.5 -mt-1.5 border-[5px] border-transparent border-t-neutral-900 dark:border-t-white"></div>
            </div>
          </div>

          <!-- GitHub Link -->
          <div class="relative group flex items-center justify-center">
            <a 
              href="https://github.com/abhay2133" 
              target="_blank" 
              rel="noreferrer" 
              class="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:scale-110 transition-all p-1 magnetic-target"
              aria-label="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 sm:w-5 sm:h-5">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
              </svg>
            </a>
            <!-- Custom Tooltip -->
            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <div class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap shadow-black/10">
                GitHub Profile
              </div>
              <div class="w-2.5 h-2.5 -mt-1.5 border-[5px] border-transparent border-t-neutral-900 dark:border-t-white"></div>
            </div>
          </div>

          <!-- LinkedIn Link -->
          <div class="relative group flex items-center justify-center">
            <a 
              href="https://www.linkedin.com/in/abhay-21m" 
              target="_blank" 
              rel="noreferrer" 
              class="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 hover:scale-110 transition-all p-1 magnetic-target"
              aria-label="LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 sm:w-5 sm:h-5">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <!-- Custom Tooltip -->
            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <div class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] sm:text-xs font-medium px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap shadow-black/10">
                LinkedIn Profile
              </div>
              <div class="w-2.5 h-2.5 -mt-1.5 border-[5px] border-transparent border-t-neutral-900 dark:border-t-white"></div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="pt-4 sm:pt-8 scroll-animate">
        <h1 ref="splitTitle" class="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-5 overflow-hidden">
          Hi, I'm Abhay Bisht.
        </h1>
        <p ref="heroSubtitle" class="text-neutral-600 dark:text-neutral-400 leading-relaxed text-balance sm:text-lg max-w-xl opacity-0 translate-y-4">
          <span class="text-neutral-950 dark:text-white font-semibold border-b-2 border-purple-500/40 pb-0.5">Software Engineer</span> specializing in Full Stack &amp; AI Systems. I build production SaaS platforms, design robust APIs, and integrate AI models to create scalable and high-performance digital products.
        </p>
        <div ref="heroButtons" class="mt-10 flex flex-wrap gap-4 opacity-0 translate-y-4">
          <a 
            href="#projects" 
            class="text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-2.5 rounded-full shadow-md hover:bg-neutral-800 dark:hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all magnetic-target"
          >
            View Projects
          </a>
          <a 
            href="/Resume_Abhay-Bisht.pdf" 
            target="_blank" 
            class="text-sm font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-2.5 rounded-full shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-neutral-800 dark:text-neutral-200 magnetic-target"
          >
            Resume
          </a>
        </div>
      </section>

      <!-- Technologies I Use Section -->
      <section class="scroll-animate">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 tracking-tight px-1">
          Technologies I Use
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <!-- Technology Category Cards -->
          <div 
            v-for="(techs, category) in technologies" 
            :key="category"
            class="tech-card flex flex-col p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-md transition-[border-color,box-shadow] duration-300"
          >
            <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {{ category }}
            </h3>
            <ul class="flex flex-col gap-2.5">
              <li 
                v-for="tech in techs" 
                :key="tech"
                class="text-sm text-neutral-600 dark:text-neutral-400 flex items-center before:content-[''] before:w-1.5 before:h-1.5 before:bg-neutral-300 dark:before:bg-neutral-600 before:rounded-full before:mr-3"
              >
                {{ tech }}
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Certifications -->
        <div class="mt-8 flex flex-wrap gap-x-6 gap-y-3 px-1">
          <span class="text-[10px] items-center font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Certifications:
          </span>
          <span 
            v-for="cert in certifications" 
            :key="cert"
            class="text-xs font-medium text-neutral-500 dark:text-neutral-400"
          >
            {{ cert }}
          </span>
        </div>
      </section>

      <!-- Notable Achievements Section -->
      <section class="scroll-animate">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 tracking-tight px-1">
          Notable Achievements
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            v-for="achievement in achievements" 
            :key="achievement.title"
            class="achievement-card flex gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-neutral-200 dark:hover:border-neutral-700 transition-all"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <!-- Trophy Icon -->
              <svg v-if="achievement.icon === 'trophy'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-neutral-600 dark:text-neutral-400">
                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/>
                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/>
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/>
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6"/>
              </svg>
              <!-- Star Icon -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-neutral-600 dark:text-neutral-400">
                <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {{ achievement.title }}
              </h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {{ achievement.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Career Journey Section -->
      <section id="journey" class="w-full scroll-animate">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 tracking-tight px-1">
          Career Journey
        </h2>
        <div class="flex flex-col gap-0 relative px-1">
          <!-- Center line -->
          <div ref="journeyLine" class="absolute left-[15px] top-4 bottom-4 w-[2px] bg-neutral-200 dark:bg-neutral-800 origin-top scale-y-0"></div>
          
          <div 
            v-for="job in journey" 
            :key="job.role + job.organization"
            class="journey-item flex gap-5 sm:gap-6 relative z-10 pb-10 last:pb-0 group"
          >
            <!-- Timeline dot -->
            <div class="timeline-dot relative mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fafafa] dark:bg-[#0a0a0a] ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-sm transition-all group-hover:ring-neutral-300 dark:group-hover:ring-neutral-700">
              <div class="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500 transition-colors group-hover:bg-neutral-600 dark:group-hover:bg-neutral-300"></div>
            </div>
            
            <div class="flex flex-col">
              <h3 class="text-base tracking-tight font-medium text-neutral-900 dark:text-neutral-100">
                {{ job.role }}
              </h3>
              <p class="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-0.5">
                {{ job.organization }}
              </p>
              <p class="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                {{ job.period }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Selected Work Section -->
      <section id="projects" class="scroll-animate">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 tracking-tight px-1">
          Selected Work
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Project cards -->
          <div 
            v-for="project in projects" 
            :key="project.title"
            class="project-card group relative flex flex-col p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-neutral-200 dark:hover:border-neutral-700 hover:shadow-md hover:-translate-y-0.5 transition-all gap-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm"
          >
            <!-- Immersive masked reveal image -->
            <a 
              :href="project.link" 
              class="project-img-wrap w-full h-40 shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 block relative magnetic-target"
              style="clip-path: inset(0 100% 0 0)"
            >
              <img 
                :src="project.image" 
                :alt="project.title" 
                class="project-img w-full h-full object-cover object-center scale-125 group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </a>
            
            <div class="flex flex-col grow px-1">
              <div>
                <a 
                  :href="project.link"
                  class="inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base tracking-tight magnetic-target"
                >
                  {{ project.title }}
                  <!-- Arrow Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
                  </svg>
                </a>
              </div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2 mt-1 shrink-0">
                {{ project.description }}
              </p>
              
              <!-- Tech tags -->
              <div class="text-xs font-mono text-neutral-500 dark:text-neutral-500 mt-auto pt-4 flex flex-wrap gap-x-3 gap-y-1">
                <span 
                  v-for="(tech, tIndex) in project.tech" 
                  :key="tech"
                  class="flex items-center"
                >
                  {{ tech }}
                  <span 
                    v-if="tIndex < project.tech.length - 1"
                    class="ml-3 w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full"
                  ></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Get in Touch Section -->
      <div class="perspective-container w-full mt-4">
        <section 
          id="contact" 
          ref="contactCard"
          class="p-8 sm:p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-neutral-200 dark:hover:border-neutral-700 transition-all relative overflow-hidden group scroll-animate"
        >
          <!-- Dynamic Glare Overlay -->
          <div ref="contactGlare" class="absolute inset-0 pointer-events-none opacity-0 z-20 transition-opacity duration-300"></div>

          <div class="relative z-10">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3 tracking-tight">
              Get in touch
            </h2>
            <p class="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-8 max-w-md leading-relaxed">
              I'm currently available for freelance projects and open to full-time roles. Feel free to reach out if you want to collaborate or just say hi.
            </p>
            <a 
              href="mailto:abhaybishthestudent@gmail.com" 
              class="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white dark:bg-neutral-800 border border-white/80 dark:border-white/10 shadow-sm text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:shadow-md hover:-translate-y-0.5 magnetic-target"
            >
              <!-- Mail Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>
              </svg>
              Say Hello
            </a>
          </div>
          
          <!-- Graphic circle in background -->
          <div class="absolute -bottom-24 -right-24 text-neutral-100 dark:text-neutral-800 group-hover:text-neutral-200 dark:group-hover:text-neutral-700 transition-colors duration-700 pointer-events-none">
            <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="5"/>
            </svg>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <footer class="pb-8 pt-4 text-sm text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row justify-between items-center sm:items-end w-full">
        <p>© {{ currentYear }} Abhay Bisht.</p>
        <div class="flex gap-4 mt-6 sm:mt-0">
          <a 
            href="https://github.com/abhay2133" 
            target="_blank" 
            rel="noreferrer" 
            class="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors magnetic-target"
          >
            GitHub
          </a>
          <a 
            href="https://www.linkedin.com/in/abhay-21m" 
            target="_blank" 
            rel="noreferrer" 
            class="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors magnetic-target"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import GridBackground from './components/GridBackground.vue'
import CarFollower from './components/CarFollower.vue'

const isCarVisible = ref(false)
const isDarkMode = ref(false)
const currentYear = new Date().getFullYear()

// Intro preloader state & refs
const showIntro = ref(true)
const introOverlay = ref<HTMLElement | null>(null)
const introName = ref<HTMLElement | null>(null)

// Desktop Custom Cursor state
const showCustomCursor = ref(false)

// DOM Refs
const cursorDot = ref<HTMLElement | null>(null)
const cursorRing = ref<HTMLElement | null>(null)
const splitTitle = ref<HTMLElement | null>(null)
const heroSubtitle = ref<HTMLElement | null>(null)
const heroButtons = ref<HTMLElement | null>(null)
const journeyLine = ref<HTMLElement | null>(null)
const contactCard = ref<HTMLElement | null>(null)
const contactGlare = ref<HTMLElement | null>(null)

// Technologies Data
const technologies = {
  Frontend: ["React", "Next.js", "Vue.js", "TypeScript", "Tailwind CSS"],
  Backend: ["Node.js", "Ruby on Rails", "Express.js", "REST APIs", "Webhooks"],
  "Databases & Tools": ["PostgreSQL", "MySQL", "Git", "API Design", "System Design"]
}

// Certifications Data
const certifications = [
  "Machine Learning – Acmegrade",
  "JS Algorithms – Freecodecamp",
  "Responsive Web Design"
]

// Achievements Data
const achievements = [
  {
    title: "YouTube Downloader",
    description: "Deployed a tool with over 1,000+ active users.",
    icon: "trophy"
  },
  {
    title: "Real-time Chat",
    description: "Built and deployed a chat application supporting concurrent connections.",
    icon: "star"
  }
]

// Career Journey Data
const journey = [
  {
    role: "Full Stack Engineer",
    organization: "Formester",
    period: "July 2025 - Present"
  },
  {
    role: "Full Stack Intern",
    organization: "Acorn Globus",
    period: "Feb 2025 - June 2025"
  },
  {
    role: "SDE Intern",
    organization: "Excelling Technologies",
    period: "June 2024 - Dec 2024"
  },
  {
    role: "Internship",
    organization: "CodeQuotient",
    period: "June 2024 - July 2024"
  }
]

// Selected Projects Data
const projects = [
  {
    title: "NeuroPlan",
    description: "An AI-powered Flutter app that converts natural language goals into structured project roadmaps with pluggable AI providers.",
    tech: ["Flutter", "Dart", "Firebase", "GROQ AI"],
    image: "https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?w=800&q=80&auto=format&fit=crop",
    link: "https://github.com/abhay2133"
  },
  {
    title: "Engineers Day System",
    description: "Event registration system for managing participant data and secure online payments with transaction verification.",
    tech: ["Next.js", "PostgreSQL", "Tailwind CSS"],
    image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800&q=80&auto=format&fit=crop",
    link: "#"
  },
  {
    title: "Quiz Bowl Application",
    description: "Full-stack quiz platform featuring individual submission handling and JSON-based storage for competitive quiz bowls.",
    tech: ["Flutter", "Express.js", "Node.js", "TypeScript"],
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80&auto=format&fit=crop",
    link: "https://github.com/abhay2133"
  }
]

// Car Toggler
const toggleCar = () => {
  isCarVisible.value = !isCarVisible.value
}

// Dark Mode Toggle Logic
const toggleDarkMode = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
    isDarkMode.value = false
  } else {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
    isDarkMode.value = true
  }
}

let scrollTriggers: ScrollTrigger[] = []

// Client-side initialization and GSAP setup
onMounted(() => {
  // Theme check
  const isDark = document.documentElement.classList.contains('dark') || 
                 (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  isDarkMode.value = isDark
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger)

  // 1. Detect Desktop for Custom Cursor
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!isTouchDevice) {
    showCustomCursor.value = true
    
    // Smooth cursor follow
    setTimeout(() => {
      if (!cursorDot.value || !cursorRing.value) return

      gsap.set(cursorDot.value, { xPercent: -50, yPercent: -50 })
      gsap.set(cursorRing.value, { xPercent: -50, yPercent: -50 })

      const xToDot = gsap.quickTo(cursorDot.value, "x", { duration: 0.1, ease: "power3" })
      const yToDot = gsap.quickTo(cursorDot.value, "y", { duration: 0.1, ease: "power3" })
      const xToRing = gsap.quickTo(cursorRing.value, "x", { duration: 0.35, ease: "power3" })
      const yToRing = gsap.quickTo(cursorRing.value, "y", { duration: 0.35, ease: "power3" })

      window.addEventListener("mousemove", (e) => {
        xToDot(e.clientX)
        yToDot(e.clientY)
        xToRing(e.clientX)
        yToRing(e.clientY)
      })

      // Hover snaps & Magnet effects
      const magneticTargets = document.querySelectorAll(".magnetic-target")
      
      magneticTargets.forEach((target) => {
        const el = target as HTMLElement

        el.addEventListener("mouseenter", () => {
          gsap.to(cursorRing.value, {
            scale: 1.5,
            backgroundColor: "rgba(168, 85, 247, 0.05)",
            borderColor: "#a855f7",
            duration: 0.3
          })
          gsap.to(cursorDot.value, {
            scale: 1.5,
            backgroundColor: "#a855f7",
            duration: 0.3
          })
        })

        el.addEventListener("mouseleave", () => {
          gsap.to(cursorRing.value, {
            scale: 1,
            backgroundColor: "transparent",
            borderColor: isDarkMode.value ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
            duration: 0.3
          })
          gsap.to(cursorDot.value, {
            scale: 1,
            backgroundColor: isDarkMode.value ? "#ffffff" : "#171717",
            duration: 0.3
          })
          gsap.to(el, { x: 0, y: 0, ease: "power3.out", duration: 0.5 })
        })

        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2

          gsap.to(el, {
            x: x * 0.3,
            y: y * 0.3,
            ease: "power2.out",
            duration: 0.3
          })
        })
      })
    }, 100)
  }

  // 2. Intro Preloader & Staggered Entrance Timeline
  if (introName.value && introOverlay.value) {
    const rawName = introName.value.textContent?.trim() || ""
    introName.value.innerHTML = "" // Clear standard text
    
    // Construct word and character spans for preloader
    const words = rawName.split(" ")
    words.forEach((word) => {
      const wordSpan = document.createElement("span")
      wordSpan.className = "inline-block whitespace-nowrap mr-3"
      
      const characters = word.split("")
      characters.forEach((char) => {
        const charSpan = document.createElement("span")
        charSpan.className = "intro-char inline-block opacity-0 translate-y-[110%] rotate-6"
        charSpan.textContent = char
        wordSpan.appendChild(charSpan)
      })
      
      introName.value?.appendChild(wordSpan)
    })

    const tl = gsap.timeline({
      onComplete: () => {
        showIntro.value = false
      }
    })

    // Animate preloader characters in
    tl.to(".intro-char", {
      opacity: 1,
      y: 0,
      rotate: 0,
      duration: 0.9,
      ease: "power4.out",
      stagger: 0.04
    })
    // Slide preloader overlay up and out of viewport
    .to(introOverlay.value, {
      yPercent: -100,
      duration: 1.1,
      ease: "expo.inOut",
      delay: 0.3
    })

    // Programmatically split and reveal the main hero title
    if (splitTitle.value) {
      const rawText = splitTitle.value.textContent?.trim() || ""
      splitTitle.value.innerHTML = ""
      
      const heroWords = rawText.split(" ")
      heroWords.forEach((word) => {
        const wordSpan = document.createElement("span")
        wordSpan.className = "inline-block whitespace-nowrap mr-2"
        
        const characters = word.split("")
        characters.forEach((char) => {
          const charSpan = document.createElement("span")
          charSpan.className = "char-span inline-block opacity-0 translate-y-[110%] rotate-6"
          charSpan.textContent = char
          wordSpan.appendChild(charSpan)
        })
        
        splitTitle.value?.appendChild(wordSpan)
      })

      // Stagger main heading characters (overlapping with overlay slide-out)
      tl.to(".char-span", {
        opacity: 1,
        y: 0,
        rotate: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.03
      }, "-=0.8")
    }

    // Cascade subtitle and buttons
    if (heroSubtitle.value && heroButtons.value) {
      tl.to(heroSubtitle.value, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6")
      .to(heroButtons.value, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.6")
    }
  }

  // 3. ScrollTrigger reveals for sections
  document.querySelectorAll('.scroll-animate').forEach(section => {
    // Skip sections with custom child stagger triggers
    if (section.querySelector('.tech-card') || section.querySelector('.achievement-card') || section.querySelector('.journey-item') || section.querySelector('.project-card')) {
      return
    }

    gsap.set(section, { opacity: 0, y: 30 })
    const scrollReveal = gsap.to(section, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        once: true
      }
    })
    scrollTriggers.push(scrollReveal.scrollTrigger!)
  })

  // 4. Stagger Technologies Section Cards (3D Swing-in Entrance + Mouse Hover Tilt)
  const techCards = document.querySelectorAll('.tech-card')
  if (techCards.length > 0) {
    gsap.set(techCards, { 
      opacity: 0, 
      y: 60,
      rotateX: -20,
      transformPerspective: 1000,
      transformOrigin: "top center"
    })
    
    const techTrigger = gsap.to(techCards, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 1,
      stagger: 0.15,
      ease: "back.out(1.5)",
      scrollTrigger: {
        trigger: ".tech-card",
        start: "top 85%",
        once: true
      }
    })
    scrollTriggers.push(techTrigger.scrollTrigger!)

    // Add 3D perspective tilt on mouse hover
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!isTouch) {
      techCards.forEach((card) => {
        const el = card as HTMLElement
        el.addEventListener("mousemove", (e) => {
          const rect = el.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width - 0.5
          const y = (e.clientY - rect.top) / rect.height - 0.5

          gsap.to(el, {
            rotationY: x * 10, // gentle horizontal rotation
            rotationX: -y * 10, // gentle vertical rotation
            y: -6, // lift card slightly
            transformPerspective: 800,
            ease: "power2.out",
            duration: 0.4
          })
        })

        el.addEventListener("mouseleave", () => {
          gsap.to(el, {
            rotationY: 0,
            rotationX: 0,
            y: 0,
            ease: "power3.out",
            duration: 0.6
          })
        })
      })
    }
  }

  // 5. Stagger Achievements
  const achieveCards = document.querySelectorAll('.achievement-card')
  if (achieveCards.length > 0) {
    gsap.set(achieveCards, { opacity: 0, y: 30 })
    const achieveTrigger = gsap.to(achieveCards, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".achievement-card",
        start: "top 85%",
        once: true
      }
    })
    scrollTriggers.push(achieveTrigger.scrollTrigger!)
  }

  // 6. Career Journey grow vertical line + node reveals
  if (journeyLine.value) {
    const growTrigger = gsap.to(journeyLine.value, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#journey",
        start: "top 75%",
        end: "bottom 70%",
        scrub: 1
      }
    })
    scrollTriggers.push(growTrigger.scrollTrigger!)
  }

  const journeyItems = document.querySelectorAll('.journey-item')
  if (journeyItems.length > 0) {
    journeyItems.forEach((item) => {
      const dot = item.querySelector('.timeline-dot')
      const content = item.querySelector('div:last-child')
      
      if (dot && content) {
        gsap.set(dot, { scale: 0, opacity: 0 })
        gsap.set(content, { opacity: 0, x: 20 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            once: true
          }
        })

        tl.to(dot, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
          .to(content, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")

        scrollTriggers.push(tl.scrollTrigger!)
      }
    })
  }

  // 7. Selected Work Project Cards Reveal (Clip-Path & Image Parallax)
  const projectCards = document.querySelectorAll('.project-card')
  if (projectCards.length > 0) {
    projectCards.forEach((card) => {
      const wrap = card.querySelector('.project-img-wrap')
      const img = card.querySelector('.project-img')
      const content = card.querySelector('.grow')

      if (wrap && img && content) {
        gsap.set(content, { opacity: 0, y: 15 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            once: true
          }
        })

        tl.to(wrap, {
          clipPath: "inset(0 0% 0 0)", // Slide reveal horizontal wipe
          duration: 1,
          ease: "power3.inOut"
        })
        .to(img, {
          scale: 1, // Smoothly scale down
          duration: 1,
          ease: "power3.inOut"
        }, "<")
        .to(content, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        }, "-=0.4")

        scrollTriggers.push(tl.scrollTrigger!)
      }
    })
  }

  // 8. Interactive 3D Glare Tilt for Get In Touch Card
  if (contactCard.value && contactGlare.value) {
    const card = contactCard.value
    const glare = contactGlare.value

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      gsap.to(card, {
        rotationY: x * 15,
        rotationX: -y * 15,
        transformPerspective: 1000,
        ease: "power2.out",
        duration: 0.5
      })

      gsap.to(glare, {
        opacity: 1,
        background: `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(168, 85, 247, 0.18) 0%, transparent 60%)`,
        ease: "power2.out",
        duration: 0.5
      })
    })

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        ease: "power3.out",
        duration: 0.8
      })
      gsap.to(glare, {
        opacity: 0,
        ease: "power3.out",
        duration: 0.8
      })
    })
  }
})

onUnmounted(() => {
  // Clear all instances of ScrollTrigger to avoid memory leaks
  scrollTriggers.forEach((trigger) => trigger.kill())
  ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill())
})
</script>

<style scoped>
/* Base styling for splitting characters to avoid layout shifts */
:deep(.char-span) {
  display: inline-block;
  transform-origin: bottom center;
}

:deep(.intro-char) {
  display: inline-block;
  transform-origin: bottom center;
}

.perspective-container {
  perspective: 1200px;
}
</style>
