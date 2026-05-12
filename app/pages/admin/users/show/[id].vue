<template>
  <div class="container mx-auto py-8 px-4 max-w-6xl">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <UButton
          variant="outline"
          @click="goBack()"
        >
          <Icon
            name="lucide:chevron-left"
            class="w-4 h-4 mr-2"
          />
          Volver
        </UButton>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCircleIcon class="w-8 h-8 text-blue-500" />
            Detalle del Usuario
          </h1>
          <p class="text-sm text-gray-500">
            Información completa del usuario {{ usuario?.nombre }}
            {{ usuario?.apellido }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-16"
    >
      <ArrowPathIcon class="w-10 h-10 animate-spin text-blue-500 mb-4" />
      <p class="text-gray-500">
        Cargando información del usuario...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16"
    >
      <NoSymbolIcon class="w-10 h-10 text-red-500 mb-4" />
      <p class="text-red-600 mb-4">
        {{ error }}
      </p>
      <UButton
        variant="outline"
        @click="cargarUsuario"
      >
        Reintentar
      </UButton>
    </div>

    <!-- User Details -->
    <div
      v-else-if="usuario"
      class="space-y-6"
    >
      <!-- Información Principal -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-6">
              <!-- Avatar -->
              <div class="shrink-0">
                <div
                  class="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center"
                >
                  <UserCircleIcon class="w-10 h-10 text-gray-600" />
                </div>
              </div>

              <!-- Info Principal -->
              <div>
                <h2 class="text-xl font-semibold text-gray-900">
                  {{ usuario.nombre }} {{ usuario.apellido }}
                </h2>
                <div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
                  <div class="flex items-center gap-1">
                    <EnvelopeIcon class="w-4 h-4" />
                    {{ usuario.email }}
                  </div>
                  <div class="flex items-center gap-1">
                    <IdentificationIcon class="w-4 h-4" />
                    {{ usuario.tipo_identificacion }}
                    {{ usuario.numero_documento }}
                  </div>
                </div>
                <div class="mt-2 flex items-center gap-3">
                  <Badge :variant="getRolVariant(usuario.rol)">
                    {{ getRolLabel(usuario.rol) }}
                  </Badge>
                  <Badge :variant="getEstadoVariant(usuario.estado)">
                    {{ getEstadoLabel(usuario.estado) }}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2">
              <UButton
                variant="outline"
                @click="editarUsuario"
              >
                <PencilIcon class="w-4 h-4 mr-2" />
                Editar
              </UButton>
              <UButton
                :color="usuario.estado === 'active' ? 'destructive' : 'primary'"
                variant="outline"
                @click="toggleEstadoUsuario"
              >
                <NoSymbolIcon
                  v-if="usuario.estado === 'active'"
                  class="w-4 h-4 mr-2"
                />
                <CheckIcon
                  v-else
                  class="w-4 h-4 mr-2"
                />
                {{ usuario.estado === "active" ? "Desactivar" : "Activar" }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Información Detallada -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Datos Personales -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6">
            <h3
              class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
            >
              <UserIcon class="w-5 h-5 text-green-500" />
              Datos Personales
            </h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Nombre</label>
                  <p class="text-sm text-gray-900">
                    {{ usuario.nombre }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Apellido</label>
                  <p class="text-sm text-gray-900">
                    {{ usuario.apellido }}
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Tipo Documento</label>
                  <p class="text-sm text-gray-900">
                    {{ getTipoDocumentoLabel(usuario.tipo_documento) }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Número Documento</label>
                  <p class="text-sm text-gray-900">
                    {{ usuario.numero_documento }}
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Teléfono</label>
                  <p class="text-sm text-gray-900 flex items-center gap-1">
                    <PhoneIcon class="w-4 h-4 text-gray-400" />
                    {{ usuario.telefono || "No registrado" }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Código Categoría</label>
                  <p class="text-sm text-gray-900">
                    {{ usuario.codigo_categoria || "No aplica" }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información de Cuenta -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6">
            <h3
              class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
            >
              <ShieldCheckIcon class="w-5 h-5 text-purple-500" />
              Información de Cuenta
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Nombre de Usuario</label>
                <p class="text-sm text-gray-900 flex items-center gap-1">
                  <UserCircleIcon class="w-4 h-4 text-gray-400" />
                  {{ usuario.username }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Email</label>
                <p class="text-sm text-gray-900 flex items-center gap-1">
                  <EnvelopeIcon class="w-4 h-4 text-gray-400" />
                  {{ usuario.email }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Rol</label>
                  <p class="text-sm text-gray-900">
                    <Badge :variant="getRolVariant(usuario.rol)">
                      {{ getRolLabel(usuario.rol) }}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Estado</label>
                  <p class="text-sm text-gray-900">
                    <Badge :variant="getEstadoVariant(usuario.estado)">
                      {{ getEstadoLabel(usuario.estado) }}
                    </Badge>
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Fecha Creación</label>
                  <p class="text-sm text-gray-900 flex items-center gap-1">
                    <CalendarIcon class="w-4 h-4 text-gray-400" />
                    {{ formatDate(usuario.fecha_creacion) }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Último Acceso</label>
                  <p class="text-sm text-gray-900 flex items-center gap-1">
                    <ClockIcon class="w-4 h-4 text-gray-400" />
                    {{ formatDate(usuario.ultimo_acceso) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Datos Empresa (si aplica) -->
      <div
        v-if="usuario.empresa_nit || usuario.empresa_razon_social"
        class="bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        <div class="p-6">
          <h3
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <BuildingOfficeIcon class="w-5 h-5 text-orange-500" />
            Datos Empresa
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500">NIT Empresa</label>
              <p class="text-sm text-gray-900 flex items-center gap-1">
                <BuildingOffice2Icon class="w-4 h-4 text-gray-400" />
                {{ usuario.empresa_nit || "No registrado" }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Razón Social</label>
              <p class="text-sm text-gray-900">
                {{ usuario.empresa_razon_social || "No registrada" }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Dirección (si aplica) -->
      <div
        v-if="usuario.direccion || usuario.ciudad || usuario.barrio"
        class="bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        <div class="p-6">
          <h3
            class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"
          >
            <HomeIcon class="w-5 h-5 text-teal-500" />
            Dirección de Residencia
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500">Dirección</label>
              <p class="text-sm text-gray-900 flex items-center gap-1">
                <MapPinIcon class="w-4 h-4 text-gray-400" />
                {{ usuario.direccion || "No registrada" }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Ciudad</label>
              <p class="text-sm text-gray-900">
                {{ usuario.ciudad || "No registrada" }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Barrio</label>
              <p class="text-sm text-gray-900">
                {{ usuario.barrio || "No registrado" }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Tipo Vivienda</label>
              <p class="text-sm text-gray-900">
                {{ getTipoViviendaLabel(usuario.tipo_vivienda || "") }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500">Personas a Cargo</label>
              <p class="text-sm text-gray-900 flex items-center gap-1">
                <UserGroupIcon class="w-4 h-4 text-gray-400" />
                {{ usuario.personas_a_cargo || 0 }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useShowUser } from "~/composables/admin/useShowUser";

import Badge from "@/components/shared/Badge.vue";
import {
  UserCircleIcon,
  UserIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PhoneIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  HomeIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  CheckIcon,
  PencilIcon
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

// Usar el composable
const {
  loading,
  error,
  usuario,
  cargarUsuario,
  toggleEstadoUsuario,
  goBack,
  editarUsuario,
  getRolLabel,
  getRolVariant,
  getEstadoLabel,
  getEstadoVariant,
  getTipoDocumentoLabel,
  getTipoViviendaLabel,
  formatDate
} = useShowUser();

// Lifecycle
onMounted(() => {
  cargarUsuario();
});
</script>
