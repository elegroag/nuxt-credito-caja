<script setup>
import { ref, computed } from "vue";
const amount = ref([5000000]);
const term = ref([12]);

const minAmount = 1000000;
const maxAmount = 50000000;
const minTerm = 6;
const maxTerm = 60;

const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const monthlyPayment = computed(() => {
  const rate = 0.018; // 1.8% mensual
  const n = term.value[0];
  const p = amount.value[0];
  const payment =
    (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  return formatCurrency(payment);
});
</script>

<template>
  <section
    id="inicio"
    class="relative min-h-screen flex items-center pt-20 lg:pt-0"
  >
    <!-- Background Pattern -->
    <div
      class="absolute inset-0 bg-linear-to-br from-background via-background to-secondary/30"
    ></div>
    <div
      class="absolute inset-0 opacity-[0.02]"
      style="
        background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);
      "
    ></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <!-- Left Content -->
        <div class="text-center lg:text-left">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium mb-6"
          >
            <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            100% Online y Seguro
          </div>

          <h1
            class="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight text-balance"
          >
            El impulso que necesitas,
            <span class="text-primary">a un clic</span> de distancia
          </h1>

          <p
            class="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty"
          >
            Obtén el crédito que necesitas de forma rápida, segura y sin
            trámites físicos. Tu aliado financiero para hacer realidad tus
            proyectos.
          </p>

          <div
            class="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <a
              href="#creditos"
              class="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              Ver opciones de crédito
              <svg
                class="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
            <a
              href="#proceso"
              class="inline-flex items-center justify-center px-8 py-4 bg-card text-foreground font-medium rounded-xl border border-border hover:bg-secondary transition-colors"
            >
              Conoce el proceso
            </a>
          </div>
        </div>

        <!-- Credit Simulator -->
        <div
          class="bg-card rounded-2xl shadow-xl border border-border p-6 lg:p-8"
        >
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-foreground">
                Simula tu crédito
              </h2>
              <p class="text-sm text-muted-foreground">
                Calcula tu cuota mensual
              </p>
            </div>
          </div>

          <!-- Amount Slider -->
          <div class="mb-8">
            <div class="flex justify-between items-center mb-3">
              <label class="text-sm font-medium text-foreground"
                >Monto del crédito</label
              >
              <span class="text-lg font-semibold text-primary">{{
                formatCurrency(amount[0])
              }}</span>
            </div>
            <SharedSlider
              v-model="amount"
              :min="minAmount"
              :max="maxAmount"
              :step="500000"
              class="mb-2"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ formatCurrency(minAmount) }}</span>
              <span>{{ formatCurrency(maxAmount) }}</span>
            </div>
          </div>

          <!-- Term Slider -->
          <div class="mb-8">
            <div class="flex justify-between items-center mb-3">
              <label class="text-sm font-medium text-foreground"
                >Plazo en meses</label
              >
              <span class="text-lg font-semibold text-primary"
                >{{ term[0] }} meses</span
              >
            </div>
            <SharedSlider
              v-model="term"
              :min="minTerm"
              :max="maxTerm"
              :step="6"
              class="mb-2"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ minTerm }} meses</span>
              <span>{{ maxTerm }} meses</span>
            </div>
          </div>

          <!-- Result -->
          <div class="bg-secondary/50 rounded-xl p-5 mb-6">
            <p class="text-sm text-muted-foreground mb-1">
              Tu cuota mensual aproximada
            </p>
            <p class="text-3xl font-bold text-foreground">
              {{ monthlyPayment }}
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              *Tasa de interés referencial. Sujeto a aprobación.
            </p>
          </div>

          <button
            class="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            Solicitar este crédito
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
