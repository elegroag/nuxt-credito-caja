<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-medium text-foreground">
        Anexos registrados ({{ anexos.length }})
      </h3>
      <UButton
        v-if="puedeModificar"
        color="primary"
        variant="soft"
        size="sm"
        icon="i-lucide-file-plus"
        @click="abrirAgregar"
      >
        Agregar anexo
      </UButton>
    </div>

    <p v-if="!puedeModificar" class="text-sm text-muted-foreground">
      La solicitud ya está en proceso de firma con KIAI.
    </p>

    <UAlert
      v-if="errorLista"
      color="destructive"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="errorLista"
    />

    <div v-if="loading" class="flex items-center gap-2 text-sm text-muted-foreground">
      <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
      Cargando anexos…
    </div>

    <div v-else-if="anexos.length === 0" class="flex items-center gap-2 text-sm text-muted-foreground">
      <UIcon name="i-lucide-info" class="w-4 h-4" />
      No hay anexos para firma.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="anexo in anexos"
        :key="anexo.id"
        class="flex items-start justify-between gap-4 p-4 bg-card rounded-xl border border-border shadow-sm"
      >
        <div class="flex items-start gap-3 min-w-0 flex-1">
          <div class="mt-0.5 h-9 w-9 rounded-full flex items-center justify-center border shrink-0 bg-primary/10 border-primary/20">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary" />
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="secondary" variant="solid" class="text-secondary-foreground">
                {{ etiquetaTipo(anexo.tipo_anexo) }}
              </UBadge>
              <p class="font-semibold text-foreground truncate">{{ anexo.nombre_original }}</p>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ formatearTamano(anexo.tamano_bytes) }} · {{ formatearFecha(anexo.created_at) }} · {{ anexo.username }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-lucide-download"
            title="Descargar anexo"
            :to="urlFor(`/api/admin/solicitudes/${solicitudId}/anexos/${anexo.id}/descargar`)"
            external
            target="_blank"
          />
          <UButton
            v-if="puedeModificar"
            variant="outline"
            color="destructive"
            size="sm"
            icon="i-lucide-trash-2"
            title="Eliminar anexo"
            @click="abrirEliminar(anexo)"
          />
        </div>
      </div>
    </div>

    <UModal
      v-model:open="agregarModalOpen"
      title="Agregar anexo para firma"
      description="Solo archivos PDF de hasta 10 MB. Se enviarán a firmar junto con la solicitud."
      icon="i-lucide-file-plus"
      class="max-w-lg"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            v-if="errorAgregar"
            color="destructive"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="errorAgregar"
          />
          <UFormField label="Tipo de anexo" required>
            <USelectMenu
              v-model="tipoSeleccionado"
              :items="tipoOptions"
              value-key="value"
              label-key="label"
              placeholder="Seleccionar tipo"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Archivo PDF" required>
            <UInput
              :key="inputKey"
              type="file"
              accept="application/pdf,.pdf"
              class="w-full"
              @change="seleccionarArchivo"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" :disabled="subiendo" @click="agregarModalOpen = false">
            Cancelar
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-upload"
            :loading="subiendo"
            :disabled="!tipoSeleccionado || !archivoSeleccionado"
            @click="subirAnexo"
          >
            Subir anexo
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="eliminarModalOpen"
      title="Eliminar anexo"
      :description="anexoAEliminar ? `Se eliminará «${anexoAEliminar.nombre_original}» de los anexos para firma.` : ''"
      icon="i-lucide-trash-2"
      class="max-w-md"
    >
      <template #body>
        <UAlert
          v-if="errorEliminar"
          color="destructive"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="errorEliminar"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" :disabled="eliminando" @click="eliminarModalOpen = false">
            Volver
          </UButton>
          <UButton color="destructive" icon="i-lucide-trash-2" :loading="eliminando" @click="confirmarEliminar">
            Eliminar
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "#imports";
import { $fetch } from "ofetch";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";
import { ANEXO_MAX_BYTES, TIPO_ANEXO_LABELS, TIPOS_ANEXO } from "~~/shared/types/firmar-anexos";
import type { FirmarAnexo, TipoAnexo } from "~~/shared/types/firmar-anexos";

interface Props {
  solicitudId: string;
  // false cuando la solicitud ya tiene un proceso de firma KIAI abierto o completado
  puedeModificar?: boolean;
}

interface ApiError {
  data?: { error?: string };
  message?: string;
}

const props = withDefaults(defineProps<Props>(), { puedeModificar: true });

const { getJson, deleteJson, urlFor } = useApi();
const { ready, authHeader } = useSession();

const anexos = ref<FirmarAnexo[]>([]);
const loading = ref(false);
const errorLista = ref<string | null>(null);

const tipoOptions = TIPOS_ANEXO.map((value) => ({ value, label: TIPO_ANEXO_LABELS[value] }));

const etiquetaTipo = (tipo: string): string => TIPO_ANEXO_LABELS[tipo as TipoAnexo] || tipo;

const mensajeError = (e: unknown, porDefecto: string): string => {
  const err = e as ApiError;
  return err?.data?.error || err?.message || porDefecto;
};

const formatearTamano = (bytes: number | null): string => {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatearFecha = (fecha: string | null): string => {
  if (!fecha) return "-";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(fecha));
};

const cargarAnexos = async () => {
  loading.value = true;
  errorLista.value = null;
  try {
    await ready;
    const response = await getJson<{ success: boolean; data: { anexos: FirmarAnexo[] } }>(
      `/api/admin/solicitudes/${props.solicitudId}/anexos`,
      { auth: true }
    );
    anexos.value = response.data?.anexos ?? [];
  } catch (e: unknown) {
    errorLista.value = mensajeError(e, "No se pudieron cargar los anexos.");
  } finally {
    loading.value = false;
  }
};

// Alta de anexo
const agregarModalOpen = ref(false);
const tipoSeleccionado = ref<TipoAnexo | undefined>();
const archivoSeleccionado = ref<File | null>(null);
const inputKey = ref(0);
const subiendo = ref(false);
const errorAgregar = ref<string | null>(null);

const abrirAgregar = () => {
  tipoSeleccionado.value = undefined;
  archivoSeleccionado.value = null;
  errorAgregar.value = null;
  inputKey.value++;
  agregarModalOpen.value = true;
};

const seleccionarArchivo = (event: Event) => {
  errorAgregar.value = null;
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  if (file && !file.name.toLowerCase().endsWith(".pdf")) {
    errorAgregar.value = "Solo se permiten archivos PDF.";
    archivoSeleccionado.value = null;
    return;
  }
  if (file && file.size > ANEXO_MAX_BYTES) {
    errorAgregar.value = "El anexo supera el tamaño máximo de 10 MB.";
    archivoSeleccionado.value = null;
    return;
  }
  archivoSeleccionado.value = file;
};

const subirAnexo = async () => {
  if (!tipoSeleccionado.value || !archivoSeleccionado.value) return;
  subiendo.value = true;
  errorAgregar.value = null;
  try {
    await ready;
    const formData = new FormData();
    formData.append("tipo_anexo", tipoSeleccionado.value);
    formData.append("archivo", archivoSeleccionado.value);
    await $fetch(urlFor(`/api/admin/solicitudes/${props.solicitudId}/anexos`), {
      method: "POST",
      body: formData,
      headers: authHeader.value as unknown as Record<string, string>
    });
    agregarModalOpen.value = false;
    await cargarAnexos();
  } catch (e: unknown) {
    errorAgregar.value = mensajeError(e, "No se pudo subir el anexo.");
  } finally {
    subiendo.value = false;
  }
};

// Baja de anexo
const eliminarModalOpen = ref(false);
const anexoAEliminar = ref<FirmarAnexo | null>(null);
const eliminando = ref(false);
const errorEliminar = ref<string | null>(null);

const abrirEliminar = (anexo: FirmarAnexo) => {
  anexoAEliminar.value = anexo;
  errorEliminar.value = null;
  eliminarModalOpen.value = true;
};

const confirmarEliminar = async () => {
  if (!anexoAEliminar.value) return;
  eliminando.value = true;
  errorEliminar.value = null;
  try {
    await ready;
    await deleteJson(
      `/api/admin/solicitudes/${props.solicitudId}/anexos/${anexoAEliminar.value.id}`,
      {},
      { auth: true }
    );
    eliminarModalOpen.value = false;
    await cargarAnexos();
  } catch (e: unknown) {
    errorEliminar.value = mensajeError(e, "No se pudo eliminar el anexo.");
  } finally {
    eliminando.value = false;
  }
};

onMounted(cargarAnexos);
</script>
