<template>
  <!-- Lista de Firmantes Actuales -->
  <div v-if="firmantes.length > 0" class="mb-6">
    <h3 class="text-sm font-medium text-foreground mb-3">
      Firmantes Registrados ({{ firmantes.length }})
    </h3>
    <div class="space-y-3">
      <div
        v-for="(firmante, index) in firmantes"
        :key="index"
        class="flex items-start justify-between gap-4 p-4 bg-card rounded-xl border border-border shadow-sm"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div
            class="mt-0.5 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0"
          >
            <UIcon name="i-lucide-user" class="w-4 h-4 text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p class="font-semibold text-foreground truncate">
                {{ firmante.nombre_completo }}
              </p>
              <UBadge v-if="firmante.rol" color="secondary" variant="subtle" size="xs">
                {{ firmante.rol }}
              </UBadge>
            </div>
            <div class="mt-2 space-y-1 text-sm text-muted-foreground">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                <span class="truncate">
                  {{ getTipoDocumentoLabel(firmante.tipo_documento || getDefaultTipoDocumento()) }}:
                  {{ firmante.numero_documento }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-mail" class="w-4 h-4" />
                <span class="truncate">{{ firmante.email }}</span>
              </div>
              <div v-if="firmante.telefono" class="flex items-center gap-2">
                <UIcon name="i-lucide-phone" class="w-4 h-4" />
                <span class="truncate">{{ firmante.telefono }}</span>
              </div>
            </div>
          </div>
        </div>
        <UButton
          variant="outline"
          size="sm"
          color="destructive"
          title="Eliminar firmante"
          @click="eliminarFirmante(index)"
        >
          <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
        </UButton>
      </div>
    </div>
  </div>

  <div v-else class="mb-6">
    <UAlert color="primary" variant="subtle">
      <template #icon>
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
      </template>
      <template #title> No hay firmantes registrados </template>
      <template #description>
        Agregue al menos un firmante para poder iniciar el proceso de firma digital.
      </template>
    </UAlert>
  </div>

  <!-- Formulario para Agregar Nuevo Firmante -->
  <div class="border-t pt-6">
    <h3 class="font-medium text-foreground mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-user-plus" class="w-4 h-4 text-primary" />
      Agregar Nuevo Firmante
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground"> Nombre Completo * </label>
        <UInput
          v-model="nuevoFirmante.nombre_completo"
          placeholder="Nombre completo del firmante"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground"> Email * </label>
        <UInput v-model="nuevoFirmante.email" type="email" placeholder="correo@ejemplo.com" />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground"> Tipo de Documento </label>
        <USelectMenu
          v-model="nuevoFirmante.tipo_documento"
          :items="getTiposDocumentoOptions() as any[]"
          placeholder="Seleccionar tipo"
          by="value"
          option-attribute="label"
          value-attribute="value"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground"> Número de Documento * </label>
        <UInput v-model="nuevoFirmante.numero_documento" placeholder="Número de documento" />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground"> Rol </label>
        <USelectMenu
          v-model="nuevoFirmante.rol"
          :items="(rolOptions as any)"
          placeholder="Seleccionar rol"
          by="value"
          option-attribute="label"
          value-attribute="value"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground"> Teléfono </label>
        <UInput v-model="nuevoFirmante.telefono" type="tel" placeholder="Teléfono (opcional)" />
      </div>
    </div>

    <UButton type="button" variant="outline" class="mt-4" @click="handleAgregarFirmante">
      <UIcon name="i-lucide-user-plus" class="w-4 h-4 mr-2" />
      Agregar Firmante
    </UButton>
  </div>

  <!-- Botón de Envío para Firma -->
  <div class="border-t mt-6 pt-6">
    <UButton
      type="button"
      color="primary"
      size="lg"
      :disabled="loadingFirmado || firmantes.length === 0"
      class="w-full md:w-auto"
      @click="handleIniciarFirmado"
    >
      <UIcon v-if="loadingFirmado" name="i-lucide-loader-2" class="w-4 h-4 mr-2 animate-spin" />
      <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-2" />
      {{ loadingFirmado ? "Enviando..." : "Enviar para Firma Digital" }}
    </UButton>
    <p class="text-sm text-muted-foreground mt-2">
      Se enviará el documento a todos los firmantes registrados para su firma digital
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "#imports";
import {
  getTiposDocumentoOptions,
  getDefaultTipoDocumento,
  getTipoDocumentoLabel
} from "~/lib/tipos_documento";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

interface Props {
  solicitudId: string;
  firmantes: Firmante[];
}

const _emit = defineEmits<{
  "agregar-firmante": [];
  "eliminar-firmante": [index: number];
  "iniciar-firmado": [];
}>();

const props = defineProps<Props>();
const solicitudId = props.solicitudId;

const { postJson } = useApi();
const { ready } = useSession();

// Opciones para el selector de rol
const rolOptions: { label: string; value: string }[] = [
  { label: "Solicitante", value: "Solicitante" },
  { label: "Codeudor", value: "Codeudor" },
  { label: "Empleador", value: "Empleador" },
  { label: "Firmante", value: "Firmante" }
];

// Convertir props.firmantes a una referencia reactiva local
const firmantes = ref<Firmante[]>([...props.firmantes]);

// Watch para sincronizar cambios con el padre
watch(
  () => props.firmantes,
  (newFirmantes) => {
    firmantes.value = [...newFirmantes];
  },
  { deep: true }
);

// Gestión de firmantes
const loadingFirmado = ref(false);
const nuevoFirmante = ref<Firmante>({
  nombre_completo: "",
  email: "",
  numero_documento: "",
  tipo_documento: getDefaultTipoDocumento(), // Cédula de Ciudadanía
  rol: "Firmante",
  telefono: ""
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
      message: "Debe completar todos los campos requeridos del firmante"
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
    telefono: ""
  };

  return { success: true, message: "Firmante agregado exitosamente" };
};

// Iniciar proceso de firmado
const iniciarProcesoDeFirmado = async () => {
  if (firmantes.value.length === 0) {
    return {
      success: false,
      message: "Debe tener al menos un firmante para iniciar el proceso"
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
        message: response.message || "Documento enviado para firma digital exitosamente"
      };
    } else {
      throw new Error(response.message || "Error al iniciar proceso de firmado");
    }
  } catch (e: unknown) {
    console.error("Error al iniciar proceso de firmado:", e);
    const message = e instanceof Error ? e.message : "Error al iniciar el proceso de firmado";
    return {
      success: false,
      message
    };
  } finally {
    loadingFirmado.value = false;
  }
};

const handleIniciarFirmado = async () => {
  const confirmacion = confirm(
    `¿Está seguro de enviar el documento para firma digital a ${firmantes.value.length} firmante(s)?`
  );

  if (!confirmacion) return;

  const resultado = await iniciarProcesoDeFirmado();

  if (resultado.success) {
    alert(resultado.message || "Documento enviado para firma digital exitosamente");
  } else {
    alert(resultado.message || "Error al iniciar el proceso de firmado");
  }
};
</script>
