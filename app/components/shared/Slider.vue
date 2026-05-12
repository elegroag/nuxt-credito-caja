<script setup lang="ts">
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack
} from "radix-vue";

const modelValue = defineModel<number[]>({ required: true });

defineProps<{
  min?: number
  max?: number
  step?: number
}>();
</script>

<template>
  <SliderRoot
    v-model="modelValue"
    :min="min"
    :max="max"
    :step="step"
    class="relative flex w-full touch-none select-none items-center"
  >
    <SliderTrack
      class="relative h-2 w-full grow overflow-hidden rounded-full bg-muted"
    >
      <SliderRange class="absolute h-full bg-primary" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, i) in modelValue"
      :key="i"
      class="block h-5 w-5 rounded-full border-2 border-primary bg-card ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
    />
  </SliderRoot>
</template>
