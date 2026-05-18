<script setup lang="ts">
import SolicitudTimeline from "@/components/shared/SolicitudTimeline.vue";
import { useShowSolicitud } from "~/composables/admin/useShowSolicitud";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  solicitud,
  loading,
  error,
  loadingFirmado: _loadingFirmado,
  estadosTimeline,
  fmtMoney,
  fmtDate,
  estadoProgressPercent,
  getTipoIdentificacion,
  getCargoDescripcion,
  getCiudadDescripcion,
  getTipoVivienda,
  formatFileSize,
  descargarDocumento,
  goBack,
  cargarSolicitud,
  iniciarFirmado
} = useShowSolicitud();

const _handleIniciarFirmado = async () => {
  const confirmacion = confirm(
    "¿Está seguro de iniciar el proceso de firmado digital? Se enviará el documento al proveedor de firmas."
  );
  if (!confirmacion) return;
  const resultado = await iniciarFirmado();
  alert(
    resultado?.message
    || (resultado?.success
      ? "Proceso iniciado exitosamente"
      : "Error al iniciar el proceso")
  );
};
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          @click="goBack()"
        />
        <div>
          <h1 class="text-xl font-semibold text-foreground">
            Detalles de Solicitud
          </h1>
          <p class="text-sm text-muted-foreground">
            Información completa de la solicitud de crédito
          </p>
        </div>
      </div>
      <div
        v-if="solicitud"
        class="flex items-center gap-2"
      >
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-file-signature"
          :to="`/admin/firmas/firmado/${solicitud.numero_solicitud}`"
        >
          Gestionar Firmantes
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-clipboard-list"
          :to="`/admin/solicitudes/acciones/${solicitud.numero_solicitud}`"
        >
          Registrar Acción
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 animate-spin text-primary"
      />
      <p class="text-sm">
        Cargando detalles de la solicitud…
      </p>
    </div>

    <!-- Error -->
    <UAlert
      v-else-if="error"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Error al cargar la solicitud"
      :description="error"
    >
      <template #footer>
        <UButton
          size="sm"
          variant="outline"
          color="neutral"
          @click="cargarSolicitud"
        >
          Reintentar
        </UButton>
      </template>
    </UAlert>

    <!-- Contenido -->
    <template v-else-if="solicitud">
      <!-- Timeline -->
      <SolicitudTimeline
        :estados="estadosTimeline"
        :estado-actual-id="solicitud.estado"
        :fecha-envio="solicitud.created_at"
      />

      <!-- Información General -->
      <UPageCard
        title="Información General"
        :ui="{ container: 'sm:p-6' }"
      >
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-file-text"
              class="w-4 h-4 text-primary"
            />
            Información General
          </span>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Número de Solicitud
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{ solicitud.numero_solicitud }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Estado
            </p>
            <div class="flex items-center gap-2 mt-1">
              <UBadge
                color="primary"
                variant="subtle"
              >
                {{
                  solicitud.estado || "-"
                }}
              </UBadge>
              <UProgress
                :model-value="
                  estadoProgressPercent(String(solicitud.estado || ''))
                "
                class="w-24"
              />
            </div>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Monto Solicitado
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{ fmtMoney(solicitud.valor_solicitud || 0) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Plazo
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{ solicitud.plazo_meses || 0 }} meses
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Fecha de Creación
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ fmtDate(solicitud.fecha_radicado) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Línea de Crédito
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.payload?.linea_credito?.detalle_modalidad || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Usuario Propietario
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{ solicitud.solicitante?.nombres }}
              {{ solicitud.solicitante?.apellidos }}
            </p>
          </div>
        </div>
      </UPageCard>

      <!-- Datos del Solicitante -->
      <UPageCard :ui="{ container: 'sm:p-6' }">
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-user"
              class="w-4 h-4 text-primary"
            />
            Datos del Solicitante
          </span>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Nombres Completos
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.nombres }}
              {{ solicitud.solicitante?.apellidos }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Tipo de Identificación
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                getTipoIdentificacion(solicitud.solicitante?.tipo_documento)
                  || "-"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Número de Identificación
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.numero_documento || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Fecha de Nacimiento
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.fecha_nacimiento || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Teléfono
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.telefono_movil || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Email
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.email || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Código Categoría
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.codigo_categoria || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              NIT Empresa
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.nit || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Razón Social Empresa
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.razon_social || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Dirección de Residencia
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.direccion || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Ciudad de Residencia
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ getCiudadDescripcion(solicitud.solicitante?.ciudad) || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Tipo de Vivienda
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ getTipoVivienda(solicitud.solicitante?.tipo_vivienda) || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Personas a Cargo
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.solicitante?.personas_a_cargo || 0 }}
            </p>
          </div>
        </div>
      </UPageCard>

      <!-- Información Laboral -->
      <UPageCard :ui="{ container: 'sm:p-6' }">
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-building-2"
              class="w-4 h-4 text-primary"
            />
            Información Laboral
          </span>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Empresa
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                solicitud.payload?.informacion_laboral?.empresa_razon_social
                  || "-"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              NIT
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.payload?.informacion_laboral?.empresa_nit || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Dirección Empresa
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                solicitud.payload?.informacion_laboral?.empresa_direccion || "-"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Teléfono Empresa
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                solicitud.payload?.informacion_laboral?.empresa_telefono || "-"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Ciudad Empresa
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                getCiudadDescripcion(
                  solicitud.payload?.informacion_laboral?.empresa_ciudad
                ) || "-"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Cargo
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                getCargoDescripcion(
                  solicitud.payload?.informacion_laboral?.cargo
                ) || "-"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Fecha de Ingreso
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.payload?.informacion_laboral?.fecha_ingreso || "-" }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Tiempo de Servicio
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.payload?.informacion_laboral?.tiempo_servicio || 0 }}
              {{
                solicitud.payload?.informacion_laboral
                  ?.tiempo_servicio_unidad || "años"
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Tipo de Contrato
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.payload?.informacion_laboral?.tipo_contrato || "-" }}
            </p>
          </div>
        </div>
      </UPageCard>

      <!-- Información Financiera -->
      <UPageCard :ui="{ container: 'sm:p-6' }">
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-dollar-sign"
              class="w-4 h-4 text-primary"
            />
            Información Financiera
          </span>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Salario Básico
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.ingresos_descuentos
                    ?.salario_basico_mensual || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Subsidio de Transporte
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.ingresos_descuentos?.subsidio_transporte
                    || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Salud y Pensión
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.ingresos_descuentos?.salud_pension || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Total Ingresos
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.ingresos_descuentos?.total_ingresos || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Total Descuentos
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.ingresos_descuentos?.total_descuentos || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Neto Recibido
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.ingresos_descuentos?.total_neto_recibido
                    || 0
                )
              }}
            </p>
          </div>
        </div>
      </UPageCard>

      <!-- Información Económica -->
      <UPageCard :ui="{ container: 'sm:p-6' }">
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-trending-up"
              class="w-4 h-4 text-primary"
            />
            Información Económica
          </span>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Total Activos
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.informacion_economica?.total_activos || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Total Pasivos
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.informacion_economica?.total_pasivos || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Arrendamientos
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.informacion_economica?.arrendamientos || 0
                )
              }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Otros Gastos
            </p>
            <p class="text-base font-semibold text-foreground mt-0.5">
              {{
                fmtMoney(
                  solicitud.payload?.informacion_economica?.total_gastos || 0
                )
              }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Descripción Gastos
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{
                solicitud.payload?.informacion_economica?.gastos_descripcion
                  || "-"
              }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs text-muted-foreground uppercase tracking-wide">
              Descripción Actividades
            </p>
            <p class="text-base text-foreground mt-0.5">
              {{ solicitud.payload?.informacion_economica?.descripcion || "-" }}
            </p>
          </div>
        </div>
      </UPageCard>

      <!-- Documentos Adjuntos -->
      <UPageCard :ui="{ container: 'sm:p-6' }">
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-paperclip"
              class="w-4 h-4 text-primary"
            />
            Documentos Adjuntos
          </span>
        </template>

        <div
          v-if="solicitud.documentos && solicitud.documentos.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="documento in solicitud.documentos"
            :key="documento.documento_uuid"
            class="rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors p-4"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-file-text"
                class="w-8 h-8 text-primary shrink-0 mt-0.5"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ documento.documento_requerido_id || "Sin ID" }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  Subido: {{ fmtDate(documento.created_at) }}
                </p>
                <p
                  v-if="documento.tamano_bytes"
                  class="text-xs text-muted-foreground"
                >
                  Tamaño: {{ formatFileSize(documento.tamano_bytes) }}
                </p>
                <p
                  v-if="documento.tipo_mime"
                  class="text-xs text-muted-foreground"
                >
                  Tipo: {{ documento.tipo_mime }}
                </p>
                <UButton
                  size="xs"
                  variant="outline"
                  color="neutral"
                  icon="i-lucide-download"
                  class="mt-3"
                  @click="descargarDocumento(documento)"
                >
                  Descargar
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground"
        >
          <UIcon
            name="i-lucide-paperclip"
            class="w-10 h-10 opacity-20"
          />
          <p class="text-sm font-medium">
            No hay documentos adjuntos
          </p>
          <p class="text-xs">
            Esta solicitud no tiene documentos cargados actualmente.
          </p>
        </div>
      </UPageCard>
    </template>
  </div>
</template>
