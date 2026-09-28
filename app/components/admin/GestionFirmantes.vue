<template>
  <!-- Lista de Firmantes Actuales -->
  <div v-if="firmantes.length > 0" class="mb-6">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="text-sm font-medium text-foreground">
        Firmantes Registrados ({{ firmantes.length }})
      </h3>
      <UButton
        v-if="puedeAgregar"
        color="primary"
        variant="soft"
        size="sm"
        @click="abrirModalAgregarFirmante"
      >
        <UIcon name="i-lucide-user-plus" class="w-4 h-4 mr-1.5" />
        Agregar firmante
      </UButton>
    </div>
    <UAlert
      v-if="!puedeModificar"
      color="neutral"
      variant="subtle"
      icon="i-lucide-lock"
      class="mb-3"
      description="Los firmantes no se pueden editar ni eliminar mientras exista un proceso de firma con KIAI."
    />
    <div class="space-y-3">
      <div
        v-for="(firmante, index) in firmantes"
        :key="index"
        class="flex items-start justify-between gap-4 p-4 bg-card rounded-xl border shadow-sm"
        :class="firmante._pending ? 'border-warning/50 bg-warning/5' : 'border-border'"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div
            class="mt-0.5 h-9 w-9 rounded-full flex items-center justify-center border shrink-0"
            :class="firmante._pending ? 'bg-warning/10 border-warning/20' : 'bg-primary/10 border-primary/20'"
          >
            <UIcon
              :name="firmante._pending ? 'i-lucide-clock' : 'i-lucide-user'"
              class="w-4 h-4"
              :class="firmante._pending ? 'text-warning' : 'text-primary'"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-foreground truncate">
                  {{ firmante.nombre_completo }}
                </p>
                <UBadge v-if="firmante._pending" color="secondary" variant="subtle" size="xs">
                  Pendiente
                </UBadge>
              </div>
              <UBadge
                v-if="firmante.rol"
                color="secondary"
                variant="subtle"
                size="lg"
                class="text-sm font-semibold tracking-wide"
              >
                {{ firmante.rol }}
              </UBadge>
            </div>
            <div class="mt-2 space-y-1 text-sm text-muted-foreground">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                <span class="truncate">
                  {{ getTipoDocumentoLabel(firmante.tipo || getDefaultTipoDocumento()) }}:
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
        <div v-if="puedeModificar" class="flex items-center gap-2 shrink-0">
          <UButton
            variant="outline"
            size="sm"
            color="neutral"
            title="Editar firmante"
            @click="abrirModalEditarFirmante(index)"
          >
            <UIcon name="i-lucide-pencil" class="w-4 h-4" />
          </UButton>
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
  </div>

  <div v-else class="mb-6 space-y-3">
    <UAlert color="primary" variant="subtle">
      <template #icon>
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4" />
      </template>
      <template #title> No hay firmantes registrados </template>
      <template #description>
        Agregue al menos un firmante para poder iniciar el proceso de firma digital.
      </template>
    </UAlert>
    <div v-if="puedeAgregar" class="flex justify-end">
      <UButton
        color="primary"
        size="sm"
        @click="abrirModalAgregarFirmante"
      >
        <UIcon name="i-lucide-user-plus" class="w-4 h-4 mr-1.5" />
        Agregar firmante
      </UButton>
    </div>
  </div>

  <!-- Botón de Envío para Firma -->
  <div class="border-t mt-6 pt-6">
    <UButton
      type="button"
      color="primary"
      size="lg"
      :disabled="loadingFirmado || firmantes.length === 0 || !puedeEnviar"
      class="w-full md:w-auto"
      @click="handleIniciarFirmado"
    >
      <UIcon v-if="loadingFirmado" name="i-lucide-loader-2" class="w-4 h-4 mr-2 animate-spin" />
      <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-2" />
      {{ loadingFirmado ? "Enviando..." : "Enviar para Firma Digital" }}
    </UButton>
    <p v-if="!puedeEnviar" class="text-sm text-muted-foreground mt-2">
      La solicitud ya está en proceso de firma con KIAI.
    </p>
    <p v-else class="text-sm text-muted-foreground mt-2">
      Se enviará el documento a todos los firmantes registrados para su firma digital.
    </p>
  </div>

  <!-- Modal: Agregar Nuevo Firmante -->
  <UModal
    v-model:open="agregarFirmanteModalOpen"
    title="Agregar Nuevo Firmante"
    description="Complete los datos del firmante a asociar a la solicitud."
    icon="i-lucide-user-plus"
    class="max-w-2xl"
  >
    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            v-model="nuevoFirmante.tipo"
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

        <UFormField label="Teléfono" class="flex-1">
          <div class="flex gap-2">
            <USelectMenu
              v-model="nuevoFirmante.codigo_pais"
              :items="paisOptions"
              value-key="value"
              label-key="label"
              placeholder="Código"
              class="w-28 shrink-0"
            />
            <UInput
              v-model="nuevoFirmante.telefono"
              type="number"
              placeholder="3001234567"
              icon="i-lucide-phone"
              class="w-full"
            />
          </div>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="agregarFirmanteModalOpen = false">
          Cancelar
        </UButton>
        <UButton color="primary" @click="handleAgregarFirmante">
          <UIcon name="i-lucide-user-plus" class="w-4 h-4 mr-2" />
          Agregar Firmante
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Modal: Editar Firmante -->
  <UModal
    v-model:open="editarFirmanteModalOpen"
    title="Editar Firmante"
    description="Actualice los datos de contacto del firmante."
    icon="i-lucide-pencil"
    class="max-w-2xl"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="editarFirmanteError"
          color="destructive"
          variant="soft"
          icon="i-lucide-alert-circle"
          :description="editarFirmanteError"
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Nombre Completo" required>
            <UInput
              v-model="firmanteEditado.nombre_completo"
              placeholder="Nombre completo del firmante"
              icon="i-lucide-user"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Email" required>
            <UInput
              v-model="firmanteEditado.email"
              type="email"
              placeholder="correo@ejemplo.com"
              icon="i-lucide-mail"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Teléfono" class="md:col-span-2">
            <div class="flex gap-2">
              <USelectMenu
                v-model="firmanteEditado.codigo_pais"
                :items="paisOptions"
                value-key="value"
                label-key="label"
                placeholder="Código"
                class="w-28 shrink-0"
              />
              <UInput
                v-model="firmanteEditado.telefono"
                type="number"
                placeholder="3001234567"
                icon="i-lucide-phone"
                class="w-full"
              />
            </div>
          </UFormField>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" :disabled="loadingEditarFirmante" @click="editarFirmanteModalOpen = false">
          Cancelar
        </UButton>
        <UButton color="primary" :loading="loadingEditarFirmante" @click="handleEditarFirmante">
          <UIcon name="i-lucide-save" class="w-4 h-4 mr-2" />
          Guardar cambios
        </UButton>
      </div>
    </template>
  </UModal>

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
    :title="successRedirectOnAccept ? 'Envío Exitoso' : 'Firmante agregado'"
    icon="i-lucide-check-circle"
    class="max-w-md"
    :dismissible="!successRedirectOnAccept"
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
        <UButton color="primary" @click="handleSuccessModalAccept">
          Aceptar
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
import { navigateTo } from "#app";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { getTipoDocumentoLabel, getDefaultTipoDocumento } from "~/lib/tipos_documento";
import { useRolesFirmantes } from "~/composables/useRolesFirmantes";
import { useTiposDocumento } from "~/composables/useTiposDocumento";
import type { FirmanteDb, NuevoFirmante } from "~~/shared/types/documento";

interface Props {
  solicitudId: string;
  firmantes: FirmanteDb[];
  // false cuando la solicitud ya tiene un proceso de firma KIAI abierto o completado
  puedeAgregar?: boolean;
  // false cuando el último proceso KIAI está abierto o completado
  puedeEnviar?: boolean;
  // false cuando un proceso KIAI impide editar o eliminar firmantes
  puedeModificar?: boolean;
}

const emit = defineEmits<{
  "agregar-firmante": [];
  "eliminar-firmante": [index: number];
  "iniciar-firmado": [];
}>();

const props = withDefaults(defineProps<Props>(), { puedeAgregar: true, puedeEnviar: true, puedeModificar: true });
const solicitudId = props.solicitudId;

const { postJson, putJson, deleteJson } = useApi();
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

const firmantes = ref<FirmanteDb[]>([...props.firmantes]);

watch(
  () => props.firmantes,
  (newFirmantes) => {
    firmantes.value = [...newFirmantes];
  },
  { deep: true }
);

const loadingFirmado = ref(false);
const agregarFirmanteModalOpen = ref(false);
const nuevoFirmante = ref<NuevoFirmante>({
  tipo: "1",
  nombre_completo: "",
  email: "",
  numero_documento: "",
  rol: "Firmante",
  telefono: "",
  codigo_pais: "57"
});

const paisOptions = [
  { value: "57", label: "+57 Colombia" },
  { value: "54", label: "+54 Argentina" },
  { value: "52", label: "+52 México" },
  { value: "1", label: "+1 USA" },
  { value: "34", label: "+34 España" }
];

const errorModalOpen = ref(false);
const errorModalMessage = ref("");
const successModalOpen = ref(false);
const successModalMessage = ref("");
const successRedirectOnAccept = ref(false);
const confirmFirmaModalOpen = ref(false);

const resetNuevoFirmante = () => {
  nuevoFirmante.value = {
    tipo: "1",
    nombre_completo: "",
    email: "",
    numero_documento: "",
    rol: "Firmante",
    telefono: "",
    codigo_pais: "57"
  };
};

const abrirModalAgregarFirmante = () => {
  resetNuevoFirmante();
  agregarFirmanteModalOpen.value = true;
};

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
    agregarFirmanteModalOpen.value = false;
    successRedirectOnAccept.value = false;
    successModalMessage.value = resultado.message || "Firmante agregado exitosamente";
    successModalOpen.value = true;
  } else {
    errorModalMessage.value = resultado.message || "Error al agregar firmante";
    errorModalOpen.value = true;
  }
};

const eliminarFirmante = async (index: number) => {
  const firmante = firmantes.value[index];
  if (!firmante?.id) return;

  if (firmante._pending) {
    firmantes.value.splice(index, 1);
    return;
  }

  try {
    await ready;
    const response = await deleteJson<{
      success: boolean;
      message?: string;
    }>(`/api/admin/solicitudes/${solicitudId}/firmantes`, { firmanteId: firmante.id }, { auth: true });
    if (response.success) {
      firmantes.value.splice(index, 1);
    }
  } catch (e: unknown) {
    console.error("Error al eliminar firmante:", e);
    const err = e as { data?: { error?: string; message?: string }; message?: string };
    errorModalMessage.value
      = err?.data?.error || err?.data?.message || err?.message || "Error al eliminar el firmante.";
    errorModalOpen.value = true;
  }
};

const editarFirmanteModalOpen = ref(false);
const editarFirmanteIndex = ref<number | null>(null);
const editarFirmanteError = ref("");
const loadingEditarFirmante = ref(false);
const firmanteEditado = ref({
  nombre_completo: "",
  email: "",
  telefono: "",
  codigo_pais: "57"
});

const abrirModalEditarFirmante = (index: number) => {
  const firmante = firmantes.value[index];
  if (!firmante) return;

  editarFirmanteIndex.value = index;
  editarFirmanteError.value = "";
  firmanteEditado.value = {
    nombre_completo: firmante.nombre_completo || "",
    email: firmante.email || "",
    telefono: firmante.telefono ? String(firmante.telefono) : "",
    codigo_pais: firmante.codigo_pais || "57"
  };
  editarFirmanteModalOpen.value = true;
};

const handleEditarFirmante = async () => {
  const index = editarFirmanteIndex.value;
  const firmante = index !== null ? firmantes.value[index] : undefined;
  if (index === null || !firmante) return;

  const datos = {
    nombre_completo: firmanteEditado.value.nombre_completo.trim(),
    email: firmanteEditado.value.email.trim(),
    telefono: String(firmanteEditado.value.telefono ?? "").trim(),
    codigo_pais: firmanteEditado.value.codigo_pais
  };

  if (!datos.nombre_completo || !datos.email) {
    editarFirmanteError.value = "Debe completar el nombre y el email del firmante.";
    return;
  }
  if (!isValidEmail(datos.email)) {
    editarFirmanteError.value = "El correo electrónico no es válido.";
    return;
  }
  if (!isValidPhone(datos.telefono)) {
    editarFirmanteError.value = "El teléfono debe ser un número móvil válido (inicia con 3 y tiene 10 dígitos).";
    return;
  }

  editarFirmanteError.value = "";

  if (firmante._pending) {
    firmantes.value[index] = { ...firmante, ...datos };
    editarFirmanteModalOpen.value = false;
    return;
  }

  loadingEditarFirmante.value = true;
  try {
    await ready;
    const response = await putJson<{
      success: boolean;
      message?: string;
      data?: FirmanteDb;
    }>(
      `/api/admin/solicitudes/${solicitudId}/firmantes`,
      { firmanteId: firmante.id, ...datos },
      { auth: true }
    );

    if (response.success) {
      firmantes.value[index] = { ...firmante, ...(response.data ?? datos) };
      editarFirmanteModalOpen.value = false;
    } else {
      editarFirmanteError.value = response.message || "Error al actualizar el firmante.";
    }
  } catch (e: unknown) {
    console.error("Error al actualizar firmante:", e);
    const err = e as { data?: { error?: string; message?: string }; message?: string };
    editarFirmanteError.value
      = err?.data?.error || err?.data?.message || err?.message || "Error al actualizar el firmante.";
  } finally {
    loadingEditarFirmante.value = false;
  }
};

const agregarFirmante = () => {
  if (
    !nuevoFirmante.value.nombre_completo
    || !nuevoFirmante.value.email
    || !nuevoFirmante.value.numero_documento
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

  const nuevo: FirmanteDb = {
    _pending: true,
    id: `pending_${Date.now()}`,
    solicitud_id: solicitudId,
    orden: 0,
    tipo: nuevoFirmante.value.tipo,
    nombre_completo: nuevoFirmante.value.nombre_completo,
    email: nuevoFirmante.value.email,
    numero_documento: nuevoFirmante.value.numero_documento,
    rol: nuevoFirmante.value.rol,
    telefono: nuevoFirmante.value.telefono,
    created_at: null,
    updated_at: null
  };
  firmantes.value.push(nuevo);
  resetNuevoFirmante();

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
    const apiError = (e as { data?: { error?: string } })?.data?.error;
    const message = apiError || (e instanceof Error ? e.message : "Error al iniciar el proceso de firmado.");
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
    emit("iniciar-firmado");
    successRedirectOnAccept.value = true;
    successModalMessage.value = resultado.message || "Documento enviado para firma digital exitosamente.";
    successModalOpen.value = true;
  } else {
    errorModalMessage.value = resultado.message || "Error al iniciar el proceso de firmado.";
    errorModalOpen.value = true;
  }
};

const handleSuccessModalAccept = () => {
  successModalOpen.value = false;
  if (successRedirectOnAccept.value) {
    navigateTo("/admin/solicitudes");
  }
};
</script>
