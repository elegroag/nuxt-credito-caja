<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <UButton variant="outline" @click="goBack()">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-2" />
        Volver
      </UButton>
      <div>
        <h1
          class="text-2xl font-semibold text-foreground flex items-center gap-2"
        >
          <UIcon name="i-lucide-building-2" class="w-8 h-8 text-primary" />
          Detalle del Convenio
        </h1>
        <p class="text-sm text-muted-foreground">
          Información completa del convenio con {{ convenio?.razon_social }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <UIcon
        name="i-lucide-loader-2"
        class="w-10 h-10 animate-spin text-primary mb-4"
      />
      <p class="text-muted-foreground">Cargando información del convenio...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon name="i-lucide-x-circle" class="w-10 h-10 text-destructive mb-4" />
      <p class="text-destructive mb-4">{{ error }}</p>
      <UButton variant="outline" @click="cargarConvenio">Reintentar</UButton>
    </div>

    <!-- Convenio Details -->
    <div v-else-if="convenio" class="space-y-6">
      <!-- Información Principal -->
      <UPageCard>
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
            Información Principal
          </span>
        </template>
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-6">
              <!-- Logo/Empresa -->
              <div class="flex-shrink-0">
                <div
                  class="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-building-2"
                    class="w-10 h-10 text-primary"
                  />
                </div>
              </div>

              <!-- Info Principal -->
              <div>
                <h2 class="text-2xl font-semibold text-foreground">
                  {{ convenio.razon_social }}
                </h2>
                <p class="text-lg text-muted-foreground mt-1">
                  NIT: {{ convenio.nit }}
                </p>
                <div class="flex items-center gap-4 mt-2">
                  <UBadge :variant="getEstadoVariant(convenio.estado)">
                    {{ getEstadoLabel(convenio.estado) }}
                  </UBadge>
                  <span class="text-sm text-muted-foreground">
                    Convenio creado: {{ formatDate(convenio.fecha_convenio) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/admin/convenios/edit/${convenio.id}`">
                <UButton variant="outline" size="sm">
                  <UIcon name="i-lucide-pencil" class="w-4 h-4 mr-2" />
                  Editar
                </UButton>
              </NuxtLink>
              <UButton
                variant="outline"
                size="sm"
                @click="toggleEstado"
                :color="
                  convenio.estado === 'Activo' ? 'destructive' : 'primary'
                "
              >
                <UIcon
                  v-if="convenio.estado === 'Activo'"
                  name="i-lucide-x"
                  class="w-4 h-4 mr-2"
                />
                <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-2" />
                {{ convenio.estado === "Activo" ? "Desactivar" : "Activar" }}
              </UButton>
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Información Detallada -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Información del Representante -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-user" class="w-5 h-5 text-primary" />
              Información del Representante
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-id-card"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">Documento</p>
                <p class="font-medium text-foreground">
                  {{ convenio.representante_documento }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">Nombre Completo</p>
                <p class="font-medium text-foreground">
                  {{ convenio.representante_nombre }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Información de Contacto -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-phone" class="w-5 h-5 text-primary" />
              Información de Contacto
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-phone"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">Teléfono</p>
                <p class="font-medium text-foreground">
                  {{ convenio.telefono || "No registrado" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-mail"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">Correo Electrónico</p>
                <p class="font-medium text-foreground">
                  {{ convenio.correo || "No registrado" }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Fechas del Convenio -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
              Fechas del Convenio
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">Fecha de Creación</p>
                <p class="font-medium text-foreground">
                  {{ formatDate(convenio.fecha_convenio) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Fecha de Vencimiento
                </p>
                <p class="font-medium text-foreground">
                  {{
                    convenio.fecha_vencimiento
                      ? formatDate(convenio.fecha_vencimiento)
                      : "No definida"
                  }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-info"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">Estado Actual</p>
                <UBadge :variant="getEstadoVariant(convenio.estado)">
                  {{ getEstadoLabel(convenio.estado) }}
                </UBadge>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Información del Sistema -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-cog" class="w-5 h-5 text-primary" />
              Información del Sistema
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-hash"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">ID Interno</p>
                <p class="font-medium text-foreground font-mono text-sm">
                  {{ convenio.id }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Última Actualización
                </p>
                <p class="font-medium text-foreground">
                  {{ formatDate(convenio.updatedAt) }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Historial de Actividad (Placeholder) -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon name="i-lucide-clock" class="w-5 h-5 text-primary" />
              Historial de Actividad
            </span>
          </template>
          <div class="p-6">
            <div class="text-center py-8">
              <UIcon
                name="i-lucide-clock"
                class="w-12 h-12 mx-auto mb-4 text-muted-foreground"
              />
              <p class="text-muted-foreground">
                El historial de actividad estará disponible próximamente
              </p>
            </div>
          </div>
        </UPageCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "~/composables/useApi";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"],
});

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const error = ref<string | null>(null);
const convenio = ref<any>(null);

// Cargar datos del convenio
const cargarConvenio = async () => {
  loading.value = true;
  error.value = null;

  try {
    const api = useApi();
    const response = await api.getJson<any>(
      `/api/admin/convenios/${route.params.id}`,
      {
        auth: true,
      },
    );

    console.log("Respuesta del convenio:", response);

    // La respuesta del backend usa el formato success_response
    if (response && response.success && response.data) {
      convenio.value = response.data;
    } else {
      throw new Error("Estructura de respuesta inválida");
    }
  } catch (err: any) {
    console.error("Error al cargar convenio:", err);
    error.value = err.message || "Error al cargar la información del convenio";
  } finally {
    loading.value = false;
  }
};

// Cambiar estado del convenio
const toggleEstado = async () => {
  if (!convenio.value) return;

  const nuevoEstado =
    convenio.value.estado === "Activo" ? "Inactivo" : "Activo";

  try {
    const api = useApi();
    await api.putJson(
      `/api/admin/convenios/${convenio.value.id}/estado`,
      {
        estado: nuevoEstado,
      },
      { auth: true },
    );

    // Actualizar estado localmente
    convenio.value.estado = nuevoEstado;
  } catch (err: any) {
    console.error("Error al cambiar estado:", err);
    error.value = err.message || "Error al cambiar el estado del convenio";
  }
};

// Utilidades
const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    Activo: "Activo",
    Inactivo: "Inactivo",
  };
  return labels[estado] || estado;
};

const getEstadoVariant = (
  estado: string,
): "solid" | "outline" | "soft" | "subtle" => {
  const variants: Record<
    string,
    "solid" | "outline" | "soft" | "subtle"
  > = {
    Activo: "soft",
    Inactivo: "outline",
  };
  return variants[estado] || "soft";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Volver a la página anterior
const goBack = () => {
  router.push("/admin/convenios");
};

// Lifecycle
onMounted(() => {
  cargarConvenio();
});
</script>
