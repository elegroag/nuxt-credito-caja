<template>
  <div class="min-h-[calc(100vh-4rem)]">
    <div class="container mx-auto py-8 px-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <UButton variant="outline" color="neutral" @click="volver">
          <UIcon name="i-lucide-chevron-left" class="w-4 h-4 mr-2" />
          Volver
        </UButton>
        <div>
          <h1 class="text-2xl font-bold text-foreground">Firma Digital de Solicitud</h1>
          <p class="text-sm text-muted-foreground">
            Gestión de firmantes para la solicitud
            {{ solicitud?.numero_solicitud }}
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 space-y-4">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <p class="text-muted-foreground">Cargando información...</p>
      </div>

      <!-- Error State -->
      <UPageCard v-else-if="error" class="max-w-2xl mx-auto border-destructive/50 bg-destructive/5">
        <div class="text-center p-6">
          <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 class="text-xl font-bold text-destructive mb-2">Error al cargar la información</h3>
          <p class="text-destructive/80 mb-4">
            {{ error }}
          </p>
          <UButton color="destructive" variant="outline" @click="cargarSolicitud">
            <UIcon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
            Reintentar
          </UButton>
        </div>
      </UPageCard>

      <!-- Contenido Principal -->
      <div v-else-if="solicitud" class="space-y-6">
        <!-- Proceso de firma en KIAI -->
        <UPageCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <UIcon name="i-lucide-file-signature" class="w-5 h-5 text-primary" />
                </div>
                <h2 class="text-xl font-bold text-foreground">Proceso de firma KIAI</h2>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-refresh-cw"
                  :loading="loadingProceso"
                  @click="cargarProceso"
                >
                  Actualizar
                </UButton>
                <UButton
                  v-if="procesoAbierto"
                  variant="outline"
                  color="destructive"
                  size="sm"
                  icon="i-lucide-ban"
                  @click="abrirCancelar"
                >
                  Cancelar proceso
                </UButton>
                <UButton
                  v-if="procesoAbierto && proceso?.simulado"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-eraser"
                  @click="abrirDescartar"
                >
                  Descartar simulación
                </UButton>
              </div>
            </div>
          </template>

          <div v-if="loadingProceso && !proceso" class="flex items-center gap-2 text-sm text-muted-foreground">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            Consultando proceso de firma…
          </div>

          <UAlert
            v-else-if="errorProceso"
            color="destructive"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            :title="errorProceso"
          />

          <div v-else-if="!proceso" class="flex items-center gap-2 text-sm text-muted-foreground">
            <UIcon name="i-lucide-info" class="w-4 h-4" />
            La solicitud no tiene un proceso de firma en KIAI.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <p class="text-sm font-medium text-muted-foreground">Estado en KIAI</p>
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="getEstadoFirmaBadgeColor(proceso.estado)"
                  :icon="getEstadoFirmaIcon(proceso.estado)"
                  variant="subtle"
                >
                  {{ getEstadoFirmaLabel(proceso.estado) }}
                </UBadge>
                <UBadge
                  v-if="proceso.simulado"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-flask-conical"
                >
                  Simulado
                </UBadge>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-muted-foreground">Firmantes</p>
              <p class="text-sm text-foreground">
                <span class="font-semibold text-green-600">{{ proceso.firmantes_completados }}</span> firmados ·
                <span class="font-semibold text-yellow-600">{{ proceso.firmantes_pendientes }}</span> pendientes
              </p>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-muted-foreground">ID Proceso</p>
              <p class="text-sm text-foreground break-all">{{ proceso.transaccion_id }}</p>
            </div>
            <div class="space-y-1 text-sm text-muted-foreground md:col-span-3">
              <p>Inicio: {{ formatearFecha(proceso.fecha_inicio) }} · Vence: {{ formatearFecha(proceso.expira_en) }}</p>
              <p v-if="proceso.fecha_completado">Completado: {{ formatearFecha(proceso.fecha_completado) }}</p>
              <p>Última consulta a KIAI: {{ formatearFecha(proceso.ultima_consulta) }}</p>
            </div>
          </div>
        </UPageCard>

        <!-- Gestión de Firmantes -->
        <UPageCard>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-users" class="w-5 h-5 text-success" />
              </div>
              <h2 class="text-xl font-bold text-foreground">Gestión de Firmantes</h2>
            </div>
          </template>

          <GestionFirmantes
            :solicitud-id="solicitud.numero_solicitud"
            :firmantes="firmantes"
            :puede-agregar="puedeAgregarFirmantes"
            :puede-modificar="puedeAgregarFirmantes"
            :puede-enviar="puedeEnviarFirma"
            @iniciar-firmado="cargarProceso"
          />
        </UPageCard>
      </div>
    </div>

    <UModal
      v-model:open="cancelarModalOpen"
      title="Cancelar proceso de firma"
      :description="proceso?.simulado
        ? 'El proceso es simulado: se cancelará solo localmente (no se llama a KIAI) y la solicitud quedará en estado CANCELADA. Esta acción no se puede deshacer.'
        : 'Se cancelará el proceso en KIAI y la solicitud quedará en estado CANCELADA. Esta acción no se puede deshacer.'"
      icon="i-lucide-ban"
      class="max-w-lg"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="errorCancelar"
            color="destructive"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="errorCancelar"
          />
          <UFormField label="Motivo (opcional)" :hint="`${motivoCancelacion.length}/500`">
            <UTextarea
              v-model="motivoCancelacion"
              :rows="3"
              :maxlength="500"
              placeholder="Ej: firmante incorrecto, datos a corregir…"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" :disabled="loadingCancelar" @click="cancelarModalOpen = false">
            Volver
          </UButton>
          <UButton color="destructive" icon="i-lucide-ban" :loading="loadingCancelar" @click="confirmarCancelar">
            Cancelar proceso
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="descartarModalOpen"
      title="Descartar simulación de firma"
      description="El proceso simulado no existe en KIAI. Se descartará localmente y la solicitud volverá a APROBADA para poder reenviarla a firma."
      icon="i-lucide-eraser"
      class="max-w-lg"
    >
      <template #body>
        <UAlert
          v-if="errorDescartar"
          color="destructive"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="errorDescartar"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" :disabled="loadingDescartar" @click="descartarModalOpen = false">
            Volver
          </UButton>
          <UButton color="primary" icon="i-lucide-eraser" :loading="loadingDescartar" @click="confirmarDescartar">
            Descartar simulación
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "#imports";
import { useRoute, useRouter } from "vue-router";

import GestionFirmantes from "@/components/admin/GestionFirmantes.vue";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import {
  ESTADOS_FIRMA_ABIERTOS,
  getEstadoFirmaBadgeColor,
  getEstadoFirmaIcon,
  getEstadoFirmaLabel
} from "~/lib/estados_firma_kiai";
import type { FirmanteDb } from "~~/shared/types/documento";

interface ProcesoFirma {
  transaccion_id: string;
  estado: string;
  proveedor: string;
  simulado: boolean;
  fecha_inicio: string | null;
  expira_en: string | null;
  fecha_completado: string | null;
  ultima_consulta: string | null;
  firmantes_completados: number;
  firmantes_pendientes: number;
}

interface ApiError {
  statusCode?: number;
  data?: { error?: string; message?: string };
  message?: string;
}

const route = useRoute();
const router = useRouter();
const { getJson, postJson } = useApi();
const { ready } = useSession();

// Estado
const solicitud = ref<SolicitudCredito | null>(null);
const firmantes = ref<FirmanteDb[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Obtener ID de la solicitud desde los parámetros
const solicitudId = computed(() => route.params.id as string);

// Cargar datos de la solicitud
const cargarSolicitud = async () => {
  loading.value = true;
  error.value = null;

  try {
    await ready;
    const response = await getJson<{
      success: boolean;
      data: SolicitudCredito;
    }>(`/api/admin/solicitudes/${solicitudId.value}`, { auth: true });

    if (response.success) {
      solicitud.value = response.data;
    } else {
      throw new Error("No se pudo cargar la solicitud");
    }
  } catch (e: unknown) {
    console.error("Error al cargar solicitud:", e);
    const message =
      e instanceof Error ? e.message : "No se pudo cargar la información de la solicitud.";
    error.value = message;
  } finally {
    loading.value = false;
  }
};

// Cargar firmantes de la solicitud
const cargarFirmantes = async () => {
  try {
    await ready;
    const response = await getJson<{
      success: boolean;
      data: FirmanteDb[];
    }>(`/api/admin/solicitudes/${solicitudId.value}/firmantes`, { auth: true });

    if (response.success) {
      firmantes.value = response.data;
    }
  } catch (e: unknown) {
    console.error("Error al cargar firmantes:", e);
  }
};

// Proceso de firma KIAI vigente
const proceso = ref<ProcesoFirma | null>(null);
const loadingProceso = ref(false);
const errorProceso = ref<string | null>(null);

const procesoAbierto = computed(
  () => !!proceso.value && ESTADOS_FIRMA_ABIERTOS.includes(proceso.value.estado)
);

// Debe coincidir con procesoQueBloqueaFirmantes en proceso-firmado-adm.service.ts
const puedeAgregarFirmantes = computed(
  () => !procesoAbierto.value && proceso.value?.estado !== "COMPLETED"
);

const puedeEnviarFirma = computed(
  () => !procesoAbierto.value && proceso.value?.estado !== "COMPLETED"
);

const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return "-";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(fecha));
};

const cargarProceso = async () => {
  loadingProceso.value = true;
  errorProceso.value = null;
  try {
    await ready;
    const response = await getJson<{
      success: boolean;
      data: ProcesoFirma & { estado_solicitud: string };
    }>(`/api/admin/solicitudes/${solicitudId.value}/estado-firmado`, { auth: true });

    if (response.success) {
      const { estado_solicitud, ...datos } = response.data;
      proceso.value = datos;
      if (solicitud.value) solicitud.value.estado = estado_solicitud as SolicitudCredito["estado"];
    }
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err?.statusCode === 404) {
      proceso.value = null;
    } else {
      errorProceso.value = err?.data?.error || err?.message || "No se pudo consultar el proceso de firma.";
    }
  } finally {
    loadingProceso.value = false;
  }
};

// Cancelación del proceso a decisión del administrador
const cancelarModalOpen = ref(false);
const motivoCancelacion = ref("");
const loadingCancelar = ref(false);
const errorCancelar = ref<string | null>(null);

const abrirCancelar = () => {
  motivoCancelacion.value = "";
  errorCancelar.value = null;
  cancelarModalOpen.value = true;
};

const confirmarCancelar = async () => {
  loadingCancelar.value = true;
  errorCancelar.value = null;
  try {
    await ready;
    await postJson<{ success: boolean; message: string }>(
      `/api/admin/solicitudes/${solicitudId.value}/cancelar-firmado`,
      { motivo: motivoCancelacion.value.trim() || undefined },
      { auth: true }
    );
    cancelarModalOpen.value = false;
    await Promise.all([cargarSolicitud(), cargarProceso()]);
  } catch (e: unknown) {
    const err = e as ApiError;
    errorCancelar.value = err?.data?.error || err?.message || "No se pudo cancelar el proceso de firma.";
  } finally {
    loadingCancelar.value = false;
  }
};

// Un proceso simulado no existe en KIAI: se descarta localmente
const descartarModalOpen = ref(false);
const loadingDescartar = ref(false);
const errorDescartar = ref<string | null>(null);

const abrirDescartar = () => {
  errorDescartar.value = null;
  descartarModalOpen.value = true;
};

const confirmarDescartar = async () => {
  loadingDescartar.value = true;
  errorDescartar.value = null;
  try {
    await ready;
    await postJson<{ success: boolean; message: string }>(
      `/api/admin/solicitudes/${solicitudId.value}/descartar-simulacion`,
      {},
      { auth: true }
    );
    descartarModalOpen.value = false;
    await Promise.all([cargarSolicitud(), cargarProceso()]);
  } catch (e: unknown) {
    const err = e as ApiError;
    errorDescartar.value = err?.data?.error || err?.message || "No se pudo descartar la simulación.";
  } finally {
    loadingDescartar.value = false;
  }
};

// Volver a la página anterior
const volver = () => {
  router.go(-1);
};

// Cargar datos al montar el componente
onMounted(async () => {
  await cargarSolicitud();
  await Promise.all([cargarFirmantes(), cargarProceso()]);
});

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});
</script>

<style scoped></style>
