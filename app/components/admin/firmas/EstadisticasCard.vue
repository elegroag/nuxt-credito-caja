<template>
  <UCard>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">
        {{ titulo }}
      </h3>
      <div :class="['p-3 rounded-lg', colorFondo]">
        <Icon
          :name="icono"
          :class="['h-6 w-6', colorIcono]"
        />
      </div>
    </div>
    <div class="space-y-2">
      <p :class="['text-3xl font-bold', colorTexto]">
        {{ valor }}
      </p>
      <p class="text-sm text-gray-500">
        {{ descripcion }}
      </p>
      <div
        v-if="porcentaje !== undefined"
        class="flex items-center gap-2 mt-2"
      >
        <div class="flex-1 bg-gray-200 rounded-full h-2">
          <div
            :class="[
              'h-2 rounded-full transition-all duration-500',
              colorBarra
            ]"
            :style="{ width: `${porcentaje}%` }"
          />
        </div>
        <span class="text-xs font-medium text-gray-600">{{ porcentaje }}%</span>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  titulo: string
  valor: string | number
  descripcion: string
  icono: string
  colorFondo: string
  colorIcono: string
  colorTexto: string
  colorBarra?: string
  porcentaje?: number
}

withDefaults(defineProps<Props>(), {
  colorFondo: "bg-blue-100",
  colorIcono: "text-blue-600",
  colorTexto: "text-gray-900",
  colorBarra: "bg-blue-600"
});
</script>
