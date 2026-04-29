<template>
  <!-- Lista de Firmantes Actuales -->
  <div v-if="firmantes.length > 0" class="mb-6">
    <h3 class="text-sm font-medium text-slate-700 mb-3">
      Firmantes Registrados ({{ firmantes.length }})
    </h3>
    <div class="space-y-2">
      <div
        v-for="(firmante, index) in firmantes"
        :key="index"
        class="flex items-start justify-between gap-4 p-4 bg-white/70 rounded-xl border border-emerald-100/70 shadow-sm"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div
            class="mt-0.5 h-9 w-9 rounded-full bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center border border-emerald-200/70 shrink-0"
          >
            <UserIcon class="h-4 w-4 text-emerald-700" />
          </div>
          <div class="min-w-0 flex-1">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <p class="font-semibold text-slate-900 truncate">
                {{ firmante.nombre_completo }}
              </p>
              <span
                v-if="firmante.rol"
                class="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700"
              >
                {{ firmante.rol }}
              </span>
            </div>
            <div class="mt-1 space-y-1 text-sm text-slate-600">
              <div class="flex items-center gap-2">
                <CheckBadgeIcon class="h-4 w-4 text-slate-400" />
                <span class="truncate">
                  {{
                    getTipoDocumentoLabel(
                      firmante.tipo_documento || getDefaultTipoDocumento(),
                    )
                  }}:
                  {{ firmante.numero_documento }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <EnvelopeIcon class="h-4 w-4 text-slate-400" />
                <span class="truncate">{{ firmante.email }}</span>
              </div>
              <div v-if="firmante.telefono" class="flex items-center gap-2">
                <PhoneIcon class="h-4 w-4 text-slate-400" />
                <span class="truncate">{{ firmante.telefono }}</span>
              </div>
            </div>
          </div>
        </div>
        <UButton
          variant="outline"
          size="sm"
          @click="eliminarFirmante(index)"
          class="shrink-0 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
          title="Eliminar firmante"
        >
          <TrashIcon class="h-4 w-4" />
        </UButton>
      </div>
    </div>
  </div>

  <div v-else class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
    <p class="text-sm text-amber-800 flex items-start gap-2">
      <ExclamationTriangleIcon class="h-4 w-4 mt-0.5 shrink-0" />
      No hay firmantes registrados. Agregue al menos un firmante para poder
      iniciar el proceso de firma digital.
    </p>
  </div>

  <!-- Formulario para Agregar Nuevo Firmante -->
  <div class="border-t pt-6">
    <h3 class="font-medium text-slate-700 mb-3 flex items-center gap-2">
      <UserPlusIcon class="h-4 w-4 text-emerald-700" />
      Agregar Nuevo Firmante
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="text-sm font-medium text-gray-700 sm:w-40 sm:shrink-0">
            Nombre Completo *
          </label>
          <UInput
            v-model="nuevoFirmante.nombre_completo"
            type="text"
            class="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Nombre completo del firmante"
          />
        </div>
      </div>

      <div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="text-sm font-medium text-gray-700 sm:w-40 sm:shrink-0">
            Email *
          </label>
          <UInput
            v-model="nuevoFirmante.email"
            type="email"
            class="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="correo@ejemplo.com"
          />
        </div>
      </div>

      <div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="text-sm font-medium text-gray-700 sm:w-40 sm:shrink-0">
            Tipo de Documento
          </label>
          <select
            v-model="nuevoFirmante.tipo_documento"
            class="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option
              v-for="tipo in getTiposDocumentoOptions()"
              :key="tipo.value"
              :value="tipo.value"
            >
              {{ tipo.label }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="text-sm font-medium text-gray-700 sm:w-40 sm:shrink-0">
            Número de Documento *
          </label>
          <UInput
            v-model="nuevoFirmante.numero_documento"
            type="text"
            class="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Número de documento"
          />
        </div>
      </div>

      <div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="text-sm font-medium text-gray-700 sm:w-40 sm:shrink-0">
            Rol
          </label>
          <select
            v-model="nuevoFirmante.rol"
            class="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="Solicitante">Solicitante</option>
            <option value="Codeudor">Codeudor</option>
            <option value="Empleador">Empleador</option>
            <option value="Firmante">Firmante</option>
          </select>
        </div>
      </div>

      <div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="text-sm font-medium text-gray-700 sm:w-40 sm:shrink-0">
            Teléfono
          </label>
          <UInput
            v-model="nuevoFirmante.telefono"
            type="tel"
            class="w-full sm:flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Teléfono (opcional)"
          />
        </div>
      </div>
    </div>

    <UButton
      type="button"
      variant="outline"
      class="mt-4 gap-2 border-emerald-200 bg-white/70 hover:bg-white"
      @click="handleAgregarFirmante"
    >
      <UserPlusIcon class="h-4 w-4" />
      Agregar Firmante
    </UButton>
  </div>

  <!-- Botón de Envío para Firma -->
  <div class="border-t mt-6 pt-6">
    <UButton
      type="button"
      variant="default"
      class="gap-2 bg-linear-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white"
      :disabled="loadingFirmado || firmantes.length === 0"
      @click="handleIniciarFirmado"
    >
      <ArrowPathIcon v-if="loadingFirmado" class="h-4 w-4 animate-spin" />
      <PaperAirplaneIcon v-else class="h-4 w-4" />
      {{ loadingFirmado ? "Enviando..." : "Enviar para Firma Digital" }}
    </UButton>
    <p class="text-xs text-gray-500 mt-2">
      Se enviará el documento a todos los firmantes registrados para su firma
      digital
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "#imports";
import {
  getTiposDocumentoOptions,
  getDefaultTipoDocumento,
  getTipoDocumentoLabel,
} from "~/lib/tipos_documento";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

import {
  UserIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  PhoneIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from "@heroicons/vue/24/outline";

interface Props {
  solicitudId: string;
  firmantes: Firmante[];
}

interface Emits {
  (e: "agregar-firmante"): void;
  (e: "eliminar-firmante", index: number): void;
  (e: "iniciar-firmado"): void;
}

const props = defineProps<Props>();
const solicitudId = props.solicitudId;

const { postJson } = useApi();
const { ready } = useSession();

// Convertir props.firmantes a una referencia reactiva local
const firmantes = ref<Firmante[]>([...props.firmantes]);

// Watch para sincronizar cambios con el padre
watch(
  () => props.firmantes,
  (newFirmantes) => {
    firmantes.value = [...newFirmantes];
  },
  { deep: true },
);

// Gestión de firmantes
const loadingFirmado = ref(false);
const nuevoFirmante = ref<Firmante>({
  nombre_completo: "",
  email: "",
  numero_documento: "",
  tipo_documento: getDefaultTipoDocumento(), // Cédula de Ciudadanía
  rol: "Firmante",
  telefono: "",
});

const handleAgregarFirmante = () => {
  const resultado = agregarFirmante();
  if (resultado.success) {
    alert(resultado.message || "Firmante agregado exitosamente");
  } else {
    alert(resultado.message || "Error al agregar firmante");
  }
};

const eliminarFirmante = (index: number) => {
  firmantes.value.splice(index, 1);
};

// Gestión de firmantes
const agregarFirmante = () => {
  if (
    !nuevoFirmante.value.nombre_completo ||
    !nuevoFirmante.value.email ||
    !nuevoFirmante.value.numero_documento
  ) {
    return {
      success: false,
      message: "Debe completar todos los campos requeridos del firmante",
    };
  }

  firmantes.value.push({ ...nuevoFirmante.value });

  // Resetear formulario
  nuevoFirmante.value = {
    nombre_completo: "",
    email: "",
    numero_documento: "",
    tipo_documento: getDefaultTipoDocumento(), // Cédula de Ciudadanía
    rol: "Firmante",
    telefono: "",
  };

  return { success: true, message: "Firmante agregado exitosamente" };
};

// Iniciar proceso de firmado
const iniciarProcesoDeFirmado = async () => {
  if (firmantes.value.length === 0) {
    return {
      success: false,
      message: "Debe tener al menos un firmante para iniciar el proceso",
    };
  }

  loadingFirmado.value = true;
  try {
    await ready;

    const response = await postJson<{
      success: boolean;
      message: string;
      data?: unknown;
    }>(`/api/solicitudes/${solicitudId}/iniciar-firmado`, {}, { auth: true });

    if (response.success) {
      return {
        success: true,
        message:
          response.message ||
          "Documento enviado para firma digital exitosamente",
      };
    } else {
      throw new Error(
        response.message || "Error al iniciar proceso de firmado",
      );
    }
  } catch (e: unknown) {
    console.error("Error al iniciar proceso de firmado:", e);
    const message =
      e instanceof Error ? e.message : "Error al iniciar el proceso de firmado";
    return {
      success: false,
      message,
    };
  } finally {
    loadingFirmado.value = false;
  }
};

const handleIniciarFirmado = async () => {
  const confirmacion = confirm(
    `¿Está seguro de enviar el documento para firma digital a ${firmantes.value.length} firmante(s)?`,
  );

  if (!confirmacion) return;

  const resultado = await iniciarProcesoDeFirmado();

  if (resultado.success) {
    alert(
      resultado.message || "Documento enviado para firma digital exitosamente",
    );
  } else {
    alert(resultado.message || "Error al iniciar el proceso de firmado");
  }
};
</script>
