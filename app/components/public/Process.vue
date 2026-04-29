<script setup>
const steps = [
  {
    number: '01',
    title: 'Aplica',
    description: 'Llena el formulario en menos de 2 minutos con tus datos básicos.',
    icon: 'edit'
  },
  {
    number: '02',
    title: 'Recibe',
    description: 'Aprobamos tu crédito en tiempo récord. Sin esperas innecesarias.',
    icon: 'check'
  },
  {
    number: '03',
    title: 'Disfruta',
    description: 'Desembolso directo a tu cuenta bancaria. Listo para usar.',
    icon: 'cash'
  }
]
</script>

<template>
  <section id="proceso" class="py-20 lg:py-32 bg-foreground text-background">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="text-sm font-semibold text-primary uppercase tracking-wider">Proceso Simple</span>
        <h2 class="mt-4 text-3xl sm:text-4xl font-serif font-bold text-background text-balance">
          Tu crédito en tres simples pasos
        </h2>
        <p class="mt-4 text-lg text-background/70 text-pretty">
          Hemos simplificado todo el proceso para que puedas obtener tu crédito de la manera más rápida y sencilla posible.
        </p>
      </div>
      
      <!-- Steps -->
      <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
        <div
          v-for="(step, index) in steps"
          :key="step.number"
          class="relative"
        >
          <!-- Connector Line (Desktop) -->
          <div
            v-if="index < steps.length - 1"
            class="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-background/20"
          ></div>
          
          <div class="relative bg-background/5 backdrop-blur-sm rounded-2xl p-8 border border-background/10 hover:bg-background/10 transition-colors">
            <!-- Step Number -->
            <div class="w-24 h-24 mx-auto bg-primary rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <!-- Edit Icon -->
              <svg v-if="step.icon === 'edit'" class="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <!-- Check Icon -->
              <svg v-else-if="step.icon === 'check'" class="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Cash Icon -->
              <svg v-else-if="step.icon === 'cash'" class="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            
            <div class="text-center">
              <span class="text-5xl font-bold text-background/20 font-serif">{{ step.number }}</span>
              <h3 class="text-2xl font-semibold text-background mt-2">{{ step.title }}</h3>
              <p class="text-background/70 mt-3">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- CTA -->
      <div class="text-center mt-16">
        <a
          href="#inicio"
          class="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/30"
        >
          Comenzar ahora
          <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>
