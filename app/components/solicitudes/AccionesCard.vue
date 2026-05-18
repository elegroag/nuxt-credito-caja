<template>
  <SectionCard
    title="Acciones"
    icon-bg-class="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
  >
    <template #icon>
      <Settings class="h-5 w-5" />
    </template>

    <div class="flex flex-wrap gap-3">
      <NuxtLink :to="`/dash/solicitud/documentos/${solicitudId}`">
        <UButton
          variant="outline"
          class="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          <FolderOpen class="h-4 w-4" />
          Gestionar Documentos
        </UButton>
      </NuxtLink>

      <NuxtLink
        v-if="mostrarEnviar"
        :to="`/dash/solicitud/resumen/${solicitudId}`"
      >
        <UButton
          variant="outline"
          class="gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
        >
          <PenTool class="h-4 w-4" />
          Enviar Solicitud
        </UButton>
      </NuxtLink>

      <UButton
        variant="outline"
        class="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
        :disabled="!tienePdf"
        @click="$emit('descargar-pdf')"
      >
        <Download class="h-4 w-4" />
        Descargar PDF
      </UButton>

      <UButton
        color="destructive"
        variant="outline"
        class="gap-2"
        @click="$emit('eliminar')"
      >
        <Trash2 class="h-4 w-4" />
        Eliminar Solicitud
      </UButton>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import {
  FolderOpen,
  PenTool,
  Download,
  Trash2,
  Settings
} from "lucide-vue-next";
import SectionCard from "./SectionCard.vue";

interface Props {
  solicitudId: string
  mostrarEnviar: boolean
  tienePdf: boolean
}

defineProps<Props>();

defineEmits<{
  "descargar-pdf": []
  eliminar: []
}>();
</script>
