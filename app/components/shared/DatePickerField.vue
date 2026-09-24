<template>
  <UPopover v-model:open="open" :disabled="disabled">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-calendar"
      class="w-full justify-start font-normal"
      :class="{ 'text-muted-foreground': !modelValue }"
      :disabled="disabled"
    >
      {{ displayValue || placeholder }}
    </UButton>

    <template #content>
      <UCalendar
        v-model="calendarValue"
        :min-value="minDate"
        :max-value="maxDate"
        locale="es-CO"
        class="p-2"
      />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { type CalendarDate, parseDate } from "@internationalized/date";

const props = withDefaults(
  defineProps<{
    /** Fecha en formato YYYY-MM-DD */
    modelValue?: string | null;
    /** Límites en formato YYYY-MM-DD */
    min?: string;
    max?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: "",
    min: undefined,
    max: undefined,
    placeholder: "Seleccionar fecha",
    disabled: false
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);

const toCalendarDate = (value?: string | null): CalendarDate | undefined => {
  if (!value) return undefined;
  try {
    return parseDate(value.slice(0, 10));
  } catch {
    return undefined;
  }
};

const minDate = computed(() => toCalendarDate(props.min));
const maxDate = computed(() => toCalendarDate(props.max));

const calendarValue = computed({
  get: () => toCalendarDate(props.modelValue),
  set: (value: CalendarDate | undefined) => {
    emit("update:modelValue", value ? value.toString() : "");
    open.value = false;
  }
});

const displayValue = computed(() => {
  const date = calendarValue.value;
  if (!date) return "";
  return `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}/${date.year}`;
});
</script>
