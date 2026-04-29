<script setup>
import { ref } from 'vue'

const testimonials = [
  {
    id: 1,
    name: 'María García',
    role: 'Emprendedora',
    content: 'Gracias a CréditoFácil pude expandir mi negocio. El proceso fue increíblemente rápido y sin complicaciones.',
    avatar: 'M'
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    role: 'Ingeniero',
    content: 'Excelente servicio. En menos de 24 horas tenía el dinero en mi cuenta. Lo recomiendo totalmente.',
    avatar: 'C'
  },
  {
    id: 3,
    name: 'Ana Martínez',
    role: 'Docente',
    content: 'La mejor decisión que tomé. Las tasas son competitivas y el equipo de atención es muy profesional.',
    avatar: 'A'
  },
  {
    id: 4,
    name: 'Luis Pérez',
    role: 'Comerciante',
    content: 'Nunca había sido tan fácil obtener un crédito. 100% recomendado para quienes buscan rapidez y confianza.',
    avatar: 'L'
  }
]

const securityBadges = [
  { name: 'SSL Seguro', icon: 'lock' },
  { name: 'Datos Protegidos', icon: 'shield' },
  { name: 'Regulado', icon: 'badge' }
]

const currentIndex = ref(0)

const nextTestimonial = () => {
  currentIndex.value = (currentIndex.value + 1) % testimonials.length
}

const prevTestimonial = () => {
  currentIndex.value = (currentIndex.value - 1 + testimonials.length) % testimonials.length
}
</script>

<template>
  <section id="testimonios" class="py-20 lg:py-32 bg-card">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="text-sm font-semibold text-primary uppercase tracking-wider">Testimonios</span>
        <h2 class="mt-4 text-3xl sm:text-4xl font-serif font-bold text-foreground text-balance">
          Lo que dicen nuestros clientes
        </h2>
        <p class="mt-4 text-lg text-muted-foreground text-pretty">
          Miles de personas ya confían en nosotros para alcanzar sus metas financieras.
        </p>
      </div>
      
      <!-- Testimonials Carousel -->
      <div class="relative max-w-4xl mx-auto">
        <!-- Testimonial Card -->
        <div class="bg-background rounded-2xl p-8 lg:p-12 shadow-sm border border-border">
          <svg class="w-12 h-12 text-primary/20 mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          
          <Transition
            mode="out-in"
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-4"
          >
            <div :key="currentIndex">
              <p class="text-xl lg:text-2xl text-foreground leading-relaxed mb-8">
                "{{ testimonials[currentIndex].content }}"
              </p>
              
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <span class="text-xl font-semibold text-primary">{{ testimonials[currentIndex].avatar }}</span>
                </div>
                <div>
                  <p class="font-semibold text-foreground">{{ testimonials[currentIndex].name }}</p>
                  <p class="text-sm text-muted-foreground">{{ testimonials[currentIndex].role }}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        
        <!-- Navigation -->
        <div class="flex items-center justify-center gap-4 mt-8">
          <button
            @click="prevTestimonial"
            class="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Anterior testimonio"
          >
            <svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <!-- Dots -->
          <div class="flex gap-2">
            <button
              v-for="(_, index) in testimonials"
              :key="index"
              @click="currentIndex = index"
              :class="[
                'w-2.5 h-2.5 rounded-full transition-all',
                currentIndex === index ? 'bg-primary w-8' : 'bg-muted hover:bg-muted-foreground/30'
              ]"
              :aria-label="`Ir al testimonio ${index + 1}`"
            ></button>
          </div>
          
          <button
            @click="nextTestimonial"
            class="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Siguiente testimonio"
          >
            <svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Security Badges -->
      <div class="mt-20 pt-12 border-t border-border">
        <p class="text-center text-sm text-muted-foreground mb-8">Tu seguridad es nuestra prioridad</p>
        <div class="flex flex-wrap justify-center gap-8 lg:gap-16">
          <div
            v-for="badge in securityBadges"
            :key="badge.name"
            class="flex items-center gap-3"
          >
            <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <!-- Lock Icon -->
              <svg v-if="badge.icon === 'lock'" class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <!-- Shield Icon -->
              <svg v-else-if="badge.icon === 'shield'" class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <!-- Badge Icon -->
              <svg v-else-if="badge.icon === 'badge'" class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-foreground">{{ badge.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
