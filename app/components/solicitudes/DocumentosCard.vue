<template>
  <SectionCard
    title="Documentos Cargados"
    icon-bg-class="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
  >
    <template #icon>
      <FolderOpen class="h-5 w-5" />
    </template>

    <div
      v-if="documentos.length === 0"
      class="text-center py-12"
    >
      <FolderOpen
        class="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
      />
      <p class="text-gray-500 dark:text-gray-400">
        No se han cargado documentos aún.
      </p>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="doc in documentos"
        :key="doc.id"
        class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <FileText class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ doc.nombre_original }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(doc.created_at) }}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          class="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        >
          Cargado
        </Badge>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { FileText, FolderOpen } from "lucide-vue-next";
import SectionCard from "./SectionCard.vue";
import Badge from "@/components/shared/Badge.vue";

interface Documento {
  id: string
  nombre_original: string
  created_at: string
}

interface Props {
  documentos: Documento[]
}

const props = defineProps<Props>();

const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};
</script>
