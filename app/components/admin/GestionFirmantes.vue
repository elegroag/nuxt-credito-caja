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
  <UCard class="mt-4">
    <template #header>
      <h3 class="font-medium text-foreground flex items-center gap-2">
        <UIcon name="i-lucide-user-plus" class="w-4 h-4 text-primary" />
        Agregar Nuevo Firmante
      </h3>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UFormField label="Nombre Completo" required>
        <UInput
          v-model="nuevoFirmante.nombre_completo"
          placeholder="Nombre completo del firmante"
          icon="i-lucide-user"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Email" required>
        <UInput
          v-model="nuevoFirmante.email"
          type="email"
          placeholder="correo@ejemplo.com"
          icon="i-lucide-mail"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Tipo de Documento">
        <USelectMenu
          v-model="nuevoFirmante.tipo_documento"
          :items="tipoDocumentoOptions"
          value-key="value"
          label-key="label"
          placeholder="Seleccionar tipo"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Número de Documento" required>
        <UInput
          v-model="nuevoFirmante.numero_documento"
          type="number"
          placeholder="Mínimo 6 dígitos"
          icon="i-lucide-hash"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Rol">
        <USelectMenu
          v-model="nuevoFirmante.rol"
          :items="rolOptions"
          value-key="value"
          label-key="label"
          placeholder="Seleccionar rol"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Teléfono">
        <UInput
          v-model="nuevoFirmante.telefono"
          type="number"
          placeholder="3001234567"
          icon="i-lucide-phone"
          class="w-full"
        />
      </UFormField>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton type="button" variant="outline" @click="handleAgregarFirmante">
          <UIcon name="i-lucide-user-plus" class="w-4 h-4 mr-2" />
          Agregar Firmante
        </UButton>
      </div>
    </template>
  </UCard>

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
      Se enviará el documento a todos los firmantes registrados para su firma digital.
    </p>
  </div>

  <!-- Modal de Error de Validación -->
  <UModal
    v-model:open="errorModalOpen"
    title="Error de Validación"
    icon="i-lucide-alert-circle"
    class="max-w-md"
  >
    <template #body>
      <UAlert color="destructive" variant="soft">
        <template #icon>
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4" />
        </template>
        <template #description>
          {{ errorModalMessage }}
        </template>
      </UAlert>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="primary" @click="errorModalOpen = false">
          Entendido
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Modal de Éxito -->
  <UModal
    v-model:open="successModalOpen"
    title="Firmante Agregado"
    icon="i-lucide-check-circle"
    class="max-w-md"
  >
    <template #body>
      <UAlert color="primary" variant="soft">
        <template #icon>
          <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
        </template>
        <template #description>
          {{ successModalMessage }}
        </template>
      </UAlert>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="primary" @click="successModalOpen = false">
          Continuar
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Modal de Confirmación para Envío de Firma -->
  <UModal
    v-model:open="confirmFirmaModalOpen"
    title="Confirmar Envío para Firma Digital"
    icon="i-lucide-help-circle"
    class="max-w-md"
  >
    <template #body>
      <UAlert color="primary" variant="soft">
        <template #icon>
          <UIcon name="i-lucide-help-circle" class="w-4 h-4" />
        </template>
        <template #description>
          ¿Está seguro de enviar el documento para firma digital a {{ firmantes.length }} firmante(s)?
        </template>
      </UAlert>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="outline" @click="confirmFirmaModalOpen = false">
          Cancelar
        </UButton>
        <UButton color="primary" @click="confirmarEnvioFirma">
          Confirmar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from "#imports";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { getTipoDocumentoLabel, getDefaultTipoDocumento } from "~/lib/tipos_documento";
import { useRolesFirmantes } from "~/composables/useRolesFirmantes";
import { useTiposDocumento } from "~/composables/useTiposDocumento";

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
const { cargarRolesFirmantes, rolesFirmantesOptions } = useRolesFirmantes();
const { cargarTiposDocumento, tiposDocumentoOptions } = useTiposDocumento();

onMounted(async () => {
  try {
    await Promise.all([cargarRolesFirmantes(), cargarTiposDocumento()]);
  } catch (err) {
    console.error("Error cargando datos:", err);
  }
});

const rolOptions = computed(() => rolesFirmantesOptions.value);
const tipoDocumentoOptions = computed(() => tiposDocumentoOptions.value ?? []);

const firmantes = ref<Firmante[]>([...props.firmantes]);

watch(
  () => props.firmantes,
  (newFirmantes) => {
    firmantes.value = [...newFirmantes];
  },
  { deep: true }
);

const loadingFirmado = ref(false);
const nuevoFirmante = ref<Firmante>({
  nombre_completo: "",
  email: "",
  numero_documento: "",
  tipo_documento: "1",
  rol: "Firmante",
  telefono: ""
});

const errorModalOpen = ref(false);
const errorModalMessage = ref("");
const successModalOpen = ref(false);
const successModalMessage = ref("");
const confirmFirmaModalOpen = ref(false);

const isValidEmail = (email: string | undefined) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (telefono: string | undefined) => {
  if (!telefono) return true;
  return /^3\d{9}$/.test(telefono);
};

const isValidDocument = (documento: string | undefined) => {
  if (!documento) return false;
  return /^\d{6,}$/.test(documento);
};

const handleAgregarFirmante = () => {
  const resultado = agregarFirmante();
  if (resultado.success) {
    successModalMessage.value = resultado.message || "Firmante agregado exitosamente";
    successModalOpen.value = true;
  } else {
    errorModalMessage.value = resultado.message || "Error al agregar firmante";
    errorModalOpen.value = true;
  }
};

const eliminarFirmante = (index: number) => {
  firmantes.value.splice(index, 1);
};

const agregarFirmante = () => {
  if (
    !nuevoFirmante.value.nombre_completo ||
    !nuevoFirmante.value.email ||
    !nuevoFirmante.value.numero_documento
  ) {
    return {
      success: false,
      message: "Debe completar todos los campos requeridos del firmante."
    };
  }

  if (!isValidEmail(nuevoFirmante.value.email)) {
    return {
      success: false,
      message: "El correo electrónico no es válido."
    };
  }

  if (!isValidDocument(nuevoFirmante.value.numero_documento)) {
    return {
      success: false,
      message: "El número de documento debe tener mínimo 6 dígitos."
    };
  }

  if (!isValidPhone(nuevoFirmante.value.telefono)) {
    return {
      success: false,
      message: "El teléfono debe ser un número móvil válido (inicia con 3 y tiene 10 dígitos)."
    };
  }

  firmantes.value.push({ ...nuevoFirmante.value });

  nuevoFirmante.value = {
    nombre_completo: "",
    email: "",
    numero_documento: "",
    tipo_documento: "1",
    rol: "Firmante",
    telefono: ""
  };

  return { success: true, message: "Firmante agregado exitosamente." };
};

const iniciarProcesoDeFirmado = async () => {
  if (firmantes.value.length === 0) {
    return {
      success: false,
      message: "Debe tener al menos un firmante para iniciar el proceso."
    };
  }

  loadingFirmado.value = true;
  try {
    await ready;

    const response = await postJson<{
      success: boolean;
      message: string;
      data?: unknown;
    }>(`/api/admin/solicitudes/${solicitudId}/iniciar-firmado`, { firmantes: firmantes.value }, { auth: true });

    if (response.success) {
      return {
        success: true,
        message: response.message || "Documento enviado para firma digital exitosamente."
      };
    } else {
      throw new Error(response.message || "Error al iniciar proceso de firmado.");
    }
  } catch (e: unknown) {
    console.error("Error al iniciar proceso de firmado:", e);
    const message = e instanceof Error ? e.message : "Error al iniciar el proceso de firmado.";
    return {
      success: false,
      message
    };
  } finally {
    loadingFirmado.value = false;
  }
};

const handleIniciarFirmado = () => {
  confirmFirmaModalOpen.value = true;
};

const confirmarEnvioFirma = async () => {
  confirmFirmaModalOpen.value = false;

  const resultado = await iniciarProcesoDeFirmado();

  if (resultado.success) {
    successModalMessage.value = resultado.message || "Documento enviado para firma digital exitosamente.";
    successModalOpen.value = true;
  } else {
    errorModalMessage.value = resultado.message || "Error al iniciar el proceso de firmado.";
    errorModalOpen.value = true;
  }
};
</script>
