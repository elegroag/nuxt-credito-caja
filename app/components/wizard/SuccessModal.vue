<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-background/80 backdrop-blur-sm"
        @click="$emit('close')"
      />
      <UCard
        class="relative w-full max-w-md shadow-2xl border-primary/20 animate-in zoom-in-95 duration-200 text-center"
        @click.stop
      >
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20 text-secondary"
        >
          <CheckCircle2 class="h-6 w-6" />
        </div>
        <h2 class="text-xl font-bold text-foreground mb-1">
          Solicitud creada con éxito
        </h2>
        <p class="text-sm text-muted-foreground mb-4">
          Tu solicitud fue enviada y quedó en estado
          <span
            class="font-bold text-secondary-foreground bg-secondary/30 px-1.5 py-0.5 rounded"
          >Postulado</span>.
        </p>

        <div class="space-y-4 text-left">
          <div
            v-if="solicitudId"
            class="rounded-lg bg-muted p-3 space-y-1"
          >
            <div
              class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              ID de Solicitud
            </div>
            <div class="font-mono text-sm break-all text-foreground">
              {{ solicitudId }}
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2 pt-2">
            <UButton
              variant="solid"
              class="w-full"
              @click="$emit('viewSolicitudes')"
            >
              <ClipboardList class="mr-2 h-4 w-4" />
              Ver mis solicitudes
            </UButton>

            <UButton
              v-if="solicitudId"
              class="w-full bg-primary hover:bg-primary/90"
              @click="$emit('goToDocumentos')"
            >
              <FileText class="mr-2 h-4 w-4" />
              Continuar a Carga de Documentos
            </UButton>

            <UButton
              variant="ghost"
              class="w-full text-muted-foreground hover:text-foreground"
              @click="$emit('close')"
            >
              Cerrar
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, ClipboardList, FileText } from "lucide-vue-next";

interface Props {
  isOpen: boolean
  solicitudId?: string
  filename?: string
}

defineProps<Props>();

defineEmits<{
  close: []
  viewSolicitudes: []
  goToDocumentos: []
}>();
</script>
