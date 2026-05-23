<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

const route = useRoute();
const token = route.params.token as string;

interface SolicitudData {
  numero_solicitud: string;
  valor_solicitud: string;
  plazo_meses: number;
  tasa_interes: string;
  estado: string;
  estado_detallado: string;
  fecha_radicado: string | null;
  created_at: string;
  updated_at: string;
  solicitante: {
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
  } | null;
  firmantes: Array<{
    id: number;
    nombre_completo: string;
    numero_documento: string;
    email: string;
    tipo: string;
    orden: number;
    rol: string;
  }>;
  url_firma: string | null;
}

const { data, error, status } = await useFetch<SolicitudData>(
  `/api/public/firma/${token}`
);

const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(num);
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateStr));
};

const estadoColor = (estado: string): 'primary' | 'secondary' | 'accent' | 'destructive' | 'muted' | 'neutral' => {
  const map: Record<string, 'primary' | 'secondary' | 'accent' | 'destructive' | 'muted' | 'neutral'> = {
    '01': 'muted',
    '02': 'muted',
    '03': 'muted',
    '04': 'primary',
    '05': 'destructive'
  };
  return map[estado] ?? 'neutral';
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Solicitud de Crédito
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Revisa la información y firma tu solicitud
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="status === 'pending'" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p class="text-gray-500">Cargando información...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
        <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto mb-4 text-error" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No pudimos cargar la solicitud
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ error.data?.error || 'El enlace puede haber expirado o ser inválido.' }}
        </p>
        <p class="text-sm text-gray-500">
          Si crees que esto es un error, contacta al administrador.
        </p>
      </div>

      <!-- Success State -->
      <template v-else-if="data">
        <!-- Solicitud Card -->
        <UCard class="mb-6">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-lg">Solicitud {{ data.numero_solicitud }}</h3>
                <UBadge :color="estadoColor(data.estado)" class="mt-1" />
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-primary">
                  {{ formatCurrency(data.valor_solicitud) }}
                </p>
                <p class="text-sm text-gray-500">Valor solicitado</p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Detalles del crédito -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Plazo</p>
                <p class="font-medium">{{ data.plazo_meses }} meses</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Tasa de interés</p>
                <p class="font-medium">{{ data.tasa_interes }}%</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Fecha de radicación</p>
                <p class="font-medium">{{ formatDate(data.fecha_radicado) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Cuota mensual estimada</p>
                <p class="font-medium">{{ formatCurrency(String(parseFloat(data.valor_solicitud) / data.plazo_meses)) }}</p>
              </div>
            </div>

            <UDivider />

            <!-- Solicitante -->
            <div v-if="data.solicitante">
              <h4 class="font-semibold mb-3">Solicitante</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Nombre completo</p>
                  <p class="font-medium">
                    {{ data.solicitante.nombres }} {{ data.solicitante.apellidos }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Documento</p>
                  <p class="font-medium">
                    {{ data.solicitante.tipo_documento }} {{ data.solicitante.numero_documento }}
                  </p>
                </div>
              </div>
            </div>

            <UDivider />

            <!-- Firmantes -->
            <div>
              <h4 class="font-semibold mb-3">Firmantes</h4>
              <div class="space-y-3">
                <div
                  v-for="firmante in data.firmantes"
                  :key="firmante.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p class="font-medium">
                      {{ firmante.nombre_completo }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ firmante.tipo }} {{ firmante.numero_documento }}
                    </p>
                  </div>
                  <UBadge color="neutral">
                    {{ firmante.rol }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Firma Card -->
        <UCard class="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <template #header>
            <h3 class="font-semibold text-lg text-primary-900 dark:text-primary-100">
              Firmar Solicitud
            </h3>
          </template>

          <p class="text-primary-800 dark:text-primary-200 mb-4">
            Al firmar, aceptas los términos y condiciones del crédito. El proceso de firma electrónica es legalmente vinculante.
          </p>

          <UButton
            color="primary"
            size="lg"
            class="w-full"
            icon="i-lucide-pen-tool"
          >
            Firmar Solicitud
          </UButton>
        </UCard>

        <!-- Footer info -->
        <div class="mt-6 text-center text-sm text-gray-500">
          <p>Esta solicitud fue creada el {{ formatDate(data.created_at) }}</p>
          <p>Última actualización: {{ formatDate(data.updated_at) }}</p>
        </div>
      </template>
    </div>
  </div>
</template>