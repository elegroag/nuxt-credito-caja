<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <UButton variant="outline" color="neutral" icon="i-lucide-chevron-left" @click="volver">
          Volver
        </UButton>
        <div>
          <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <UIcon name="i-lucide-history" class="w-5 h-5 text-primary" />
            Historial de Procesos de Firma
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Solicitud {{ solicitudId }}
            <span v-if="historial?.solicitante"> · {{ historial.solicitante }}</span>
          </p>
        </div>
      </div>
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        :disabled="loading"
        @click="cargarHistorial"
      >
        Refrescar
      </UButton>
    </div>

    <div
      v-if="loading && !historial"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
      <p class="text-sm">Cargando historial…</p>
    </div>

    <UAlert
      v-else-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="error"
    />

    <div
      v-else-if="historial && historial.procesos.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon name="i-lucide-file-signature" class="w-10 h-10 opacity-30" />
      <p class="text-sm">Esta solicitud no tiene procesos de firma registrados</p>
    </div>

    <div v-else-if="historial" class="space-y-4">
      <UPageCard v-for="(proceso, index) in historial.procesos" :key="proceso.id">
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="getEstadoFirmaBadgeColor(proceso.estado)"
                  variant="subtle"
                  :icon="getEstadoFirmaIcon(proceso.estado)"
                >
                  {{ getEstadoFirmaLabel(proceso.estado) }}
                </UBadge>
                <UBadge v-if="index === 0" color="primary" variant="outline">
                  Vigente
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
              <p class="mt-2 text-sm text-muted-foreground break-all">
                ID Proceso: {{ proceso.transaccion_id }} · {{ proceso.proveedor }}
              </p>
            </div>
            <div class="flex gap-6 text-sm shrink-0">
              <div>
                <p class="text-muted-foreground">Firmados</p>
                <p class="text-lg font-semibold text-green-600">
                  {{ proceso.firmantes_completados }}
                </p>
              </div>
              <div>
                <p class="text-muted-foreground">Pendientes</p>
                <p class="text-lg font-semibold text-yellow-600">
                  {{ proceso.firmantes_pendientes }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
            <p>Inicio: {{ formatearFecha(proceso.fecha_inicio) }}</p>
            <p>Vence: {{ formatearFecha(proceso.expira_en) }}</p>
            <p>Completado: {{ formatearFecha(proceso.fecha_completado) }}</p>
            <p>Última consulta: {{ formatearFecha(proceso.ultima_consulta) }}</p>
          </div>

          <div class="border-t pt-4">
            <h3 class="text-sm font-medium text-foreground mb-3">Firmantes</h3>
            <p v-if="!proceso.firmantes?.length" class="text-sm text-muted-foreground">
              Sin detalle de firmantes: el proceso aún no se ha consultado en el proveedor.
            </p>
            <div v-else class="space-y-2">
              <div
                v-for="firmante in proceso.firmantes"
                :key="`${proceso.id}-${firmante.orden}-${firmante.email}`"
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border"
              >
                <div class="min-w-0">
                  <p class="font-medium text-foreground truncate">
                    {{ firmante.orden }}. {{ firmante.nombre || "Sin nombre" }}
                  </p>
                  <p class="text-sm text-muted-foreground truncate">{{ firmante.email }}</p>
                  <p v-if="firmante.motivo_rechazo" class="text-sm text-destructive mt-1">
                    Motivo de rechazo: {{ firmante.motivo_rechazo }}
                  </p>
                </div>
                <div class="flex flex-col sm:items-end gap-1 shrink-0">
                  <UBadge :color="getEstadoFirmanteColor(firmante.estado)" variant="subtle">
                    {{ getEstadoFirmanteLabel(firmante.estado) }}
                  </UBadge>
                  <span v-if="firmante.firmado_en" class="text-xs text-muted-foreground">
                    Firmó: {{ formatearFecha(firmante.firmado_en) }}
                  </span>
                  <span v-if="firmante.rechazado_en" class="text-xs text-muted-foreground">
                    Rechazó: {{ formatearFecha(firmante.rechazado_en) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UPageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "#imports";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import {
  type BadgeColorFirma,
  getEstadoFirmaBadgeColor,
  getEstadoFirmaIcon,
  getEstadoFirmaLabel
} from "~/lib/estados_firma_kiai";

interface FirmanteProceso {
  orden: number;
  nombre: string;
  email: string;
  estado: string;
  firmado_en: string | null;
  rechazado_en: string | null;
  motivo_rechazo: string | null;
}

interface ProcesoHistorial {
  id: string;
  transaccion_id: string;
  proveedor: string;
  estado: string;
  simulado: boolean;
  fecha_inicio: string | null;
  expira_en: string | null;
  fecha_completado: string | null;
  ultima_consulta: string | null;
  firmantes_completados: number;
  firmantes_pendientes: number;
  firmantes: FirmanteProceso[] | null;
}

interface HistorialProcesos {
  solicitud_id: string;
  estado_solicitud: string;
  solicitante: string | null;
  procesos: ProcesoHistorial[];
}

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const route = useRoute();
const router = useRouter();
const { getJson } = useApi();
const { ready } = useSession();

const solicitudId = computed(() => route.params.id as string);
const historial = ref<HistorialProcesos | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const ESTADOS_FIRMANTE: Record<string, { label: string; color: BadgeColorFirma }> = {
  SIGNED: { label: "Firmó", color: "primary" },
  DECLINED: { label: "Rechazó", color: "destructive" },
  PENDING: { label: "Pendiente", color: "accent" }
};

const getEstadoFirmanteLabel = (estado: string) => ESTADOS_FIRMANTE[estado]?.label || estado || "Desconocido";
const getEstadoFirmanteColor = (estado: string): BadgeColorFirma => ESTADOS_FIRMANTE[estado]?.color || "neutral";

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

const cargarHistorial = async () => {
  loading.value = true;
  error.value = null;

  try {
    await ready;
    const response = await getJson<{
      success: boolean;
      data: HistorialProcesos;
      message?: string;
    }>(`/api/admin/solicitudes/${solicitudId.value}/procesos-firma`, { auth: true });

    if (response.success) {
      historial.value = response.data;
    } else {
      error.value = response.message || "No se pudo cargar el historial de procesos de firma.";
    }
  } catch (e: unknown) {
    console.error("Error al cargar historial de procesos de firma:", e);
    const err = e as { data?: { error?: string; message?: string }; message?: string };
    error.value = err?.data?.error || err?.data?.message || err?.message || "Error al cargar el historial.";
  } finally {
    loading.value = false;
  }
};

const volver = () => {
  router.go(-1);
};

onMounted(() => {
  cargarHistorial();
});
</script>
