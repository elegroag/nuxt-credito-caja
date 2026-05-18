<template>
  <UPageCard
    :title="title"
    :description="subtitle"
    :ui="{ root: 'hover:shadow-md transition-shadow duration-200' }"
  >
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div :class="['p-2 rounded-lg flex items-center justify-center', iconBgClass]">
            <component :is="icon" :class="['h-5 w-5', iconClass]" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-muted-foreground">
              {{ title }}
            </p>
            <p :class="['text-2xl font-bold', valueClass]">
              {{ formattedValue }}
            </p>
            <p v-if="subtitle" class="text-xs text-muted-foreground mt-0.5">
              {{ subtitle }}
            </p>
          </div>
        </div>
        <div v-if="trend" class="flex items-center gap-1">
          <component
            :is="trend === 'up' ? TrendingUp : TrendingDown"
            :class="['h-4 w-4', trend === 'up' ? 'text-green-600' : 'text-red-600']"
          />
          <span
            :class="['text-xs font-medium', trend === 'up' ? 'text-green-600' : 'text-red-600']"
            >{{ trendValue }}</span
          >
        </div>
      </div>
    </template>

    <!-- Barra de progreso si aplica -->
    <div v-if="showProgress && progress !== undefined" class="mt-2">
      <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Progreso</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full bg-secondary rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all duration-500"
          :class="progressBarClass"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { TrendingUp, TrendingDown } from "lucide-vue-next";

interface Props {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: object;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  format?: "number" | "currency" | "percentage" | "text";
  trend?: "up" | "down";
  trendValue?: string;
  showProgress?: boolean;
  progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  format: "number",
  showProgress: false,
  progress: 0
});

// Variantes de color
const variantClasses = {
  default: {
    iconBg: "bg-gray-100",
    icon: "text-gray-600",
    value: "text-gray-900",
    progress: "bg-gray-500"
  },
  primary: {
    iconBg: "bg-blue-100",
    icon: "text-blue-600",
    value: "text-blue-900",
    progress: "bg-blue-500"
  },
  success: {
    iconBg: "bg-green-100",
    icon: "text-green-600",
    value: "text-green-900",
    progress: "bg-green-500"
  },
  warning: {
    iconBg: "bg-amber-100",
    icon: "text-amber-600",
    value: "text-amber-900",
    progress: "bg-amber-500"
  },
  danger: {
    iconBg: "bg-red-100",
    icon: "text-red-600",
    value: "text-red-900",
    progress: "bg-red-500"
  },
  info: {
    iconBg: "bg-purple-100",
    icon: "text-purple-600",
    value: "text-purple-900",
    progress: "bg-purple-500"
  }
};

const currentVariant = computed(() => variantClasses[props.variant]);

const iconBgClass = computed(() => currentVariant.value.iconBg);
const iconClass = computed(() => currentVariant.value.icon);
const valueClass = computed(() => currentVariant.value.value);
const progressBarClass = computed(() => currentVariant.value.progress);

// Formateo de valores
const formattedValue = computed(() => {
  if (props.format === "text") return props.value;

  const numValue = typeof props.value === "number" ? props.value : 0;

  switch (props.format) {
    case "currency":
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
      }).format(numValue);

    case "percentage":
      return new Intl.NumberFormat("es-CO", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(numValue / 100);

    case "number":
    default:
      return new Intl.NumberFormat("es-CO").format(numValue);
  }
});
</script>
