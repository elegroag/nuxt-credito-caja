<template>
  <div class="grid gap-6">
    <UCard class="border-border/50 bg-muted/10 shadow-none">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-file-signature"
            class="w-5 h-5 text-primary"
          />
        </div>
        <div class="min-w-0 space-y-2">
          <h3 class="text-sm font-semibold text-foreground">
            Codeudores requeridos
          </h3>
          <p class="text-sm text-muted-foreground">
            Debes asignar
            <span class="font-semibold text-foreground">{{ codeudoresRequeridos }}</span>
            codeudor{{ codeudoresRequeridos === 1 ? "" : "es" }} autorizado{{ codeudoresRequeridos === 1 ? "" : "s" }}
            para esta solicitud.
            Seleccionados:
            <span class="font-semibold text-foreground">{{ seleccionados.length }}</span>
            /
            {{ codeudoresRequeridos }}
          </p>
        </div>
      </div>
    </UCard>

    <UAlert
      v-if="gestionError"
      color="error"
      variant="subtle"
      :title="gestionError"
    />
    <UAlert
      v-if="gestionSuccess"
      color="success"
      variant="subtle"
      :title="gestionSuccess"
    />
    <UAlert
      v-if="errors?.['codeudores_asignados']"
      color="error"
      variant="subtle"
      :title="errors['codeudores_asignados']"
    />

    <!-- Seleccionados -->
    <div class="space-y-3">
      <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Asignados a la solicitud
      </h3>
      <div
        v-if="seleccionados.length === 0"
        class="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground"
      >
        Aún no has asignado codeudores.
      </div>
      <div
        v-else
        class="space-y-2"
      >
        <UCard
          v-for="item in seleccionados"
          :key="item.vinculo_id"
          class="border-border/50 bg-muted/20 shadow-none"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="font-medium text-foreground">
                {{ item.nombre_completo }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ item.tipo_documento }} {{ item.numero_documento }} · {{ item.email }}
              </p>
            </div>
            <UButton
              variant="ghost"
              color="error"
              size="sm"
              @click="quitar(item.vinculo_id)"
            >
              Quitar
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Disponibles (autorizados) -->
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 class="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Codeudores autorizados
        </h3>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-lucide-refresh-cw"
            :loading="loading"
            @click="listar"
          >
            Actualizar
          </UButton>
          <UButton
            color="primary"
            size="sm"
            icon="i-lucide-user-plus"
            @click="abrirModalNuevo"
          >
            Agregar nuevo codeudor
          </UButton>
        </div>
      </div>

      <div
        v-if="loading && autorizadosDisponibles.length === 0"
        class="py-6 text-center text-sm text-muted-foreground"
      >
        Cargando...
      </div>
      <div
        v-else-if="autorizadosDisponibles.length === 0"
        class="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground"
      >
        No hay codeudores autorizados disponibles. Usa
        <span class="font-medium text-foreground">Agregar nuevo codeudor</span>
        o autoriza pendientes en Mis codeudores.
      </div>
      <div
        v-else
        class="space-y-2"
      >
        <UCard
          v-for="v in autorizadosDisponibles"
          :key="v.id"
          class="border-border/50 shadow-none"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p class="font-medium text-foreground">
                {{ v.codeudor.full_name || v.codeudor.username }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ v.codeudor.tipo_documento }} {{ v.codeudor.numero_documento }} · {{ v.codeudor.email }}
              </p>
            </div>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              :disabled="!puedeAgregarMas"
              @click="asignar(v)"
            >
              Asignar
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <UModal
      v-model:open="modalNuevoOpen"
      :dismissible="false"
      :title="pendingConfirmId ? 'Autorizar codeudor' : 'Agregar nuevo codeudor'"
      description="Se enviará un código al correo. Debes autorizarlo antes de poder asignarlo."
    >
      <template #body>
        <div class="space-y-4">
          <template v-if="!pendingConfirmId">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Tipo documento">
                <USelect
                  v-model="formNuevo.tipo_documento"
                  :items="tiposDocumento"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Número documento">
                <UInput
                  v-model="formNuevo.numero_documento"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Nombres">
                <UInput
                  v-model="formNuevo.nombres"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Apellidos">
                <UInput
                  v-model="formNuevo.apellidos"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Correo electrónico">
                <UInput
                  v-model="formNuevo.email"
                  type="email"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Teléfono">
                <UInput
                  v-model="formNuevo.phone"
                  class="w-full"
                />
              </UFormField>
            </div>
          </template>

          <template v-else>
            <p class="text-sm text-muted-foreground">
              Ingresa el código de 6 dígitos enviado al correo del codeudor.
            </p>
            <UFormField label="Código de autorización">
              <UInput
                v-model="codigo"
                placeholder="Código"
                class="w-full"
                maxlength="6"
              />
            </UFormField>
          </template>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            variant="outline"
            color="neutral"
            :disabled="loading || confirming"
            @click="cerrarModalNuevo"
          >
            Cancelar
          </UButton>
          <UButton
            v-if="!pendingConfirmId"
            color="primary"
            :loading="loading"
            @click="onCrear"
          >
            Registrar y enviar código
          </UButton>
          <UButton
            v-else
            color="primary"
            :loading="confirming"
            @click="onConfirmar"
          >
            Confirmar autorización
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { CodeudorAsignado, SolicitudCreditoPayload } from "~~/shared/types/payload";
import {
  useGestionCodeudores,
  type CodeudorVinculo
} from "~/composables/codeudor/useGestionCodeudores";

const props = defineProps<{
  form: SolicitudCreditoPayload
  codeudoresRequeridos: number
  errors?: Record<string, string>
}>();

const tiposDocumento = [
  { label: "Cédula de Ciudadanía", value: "1" },
  { label: "Cédula de Extranjería", value: "2" },
  { label: "NIT", value: "3" },
  { label: "Tarjeta de Identidad", value: "4" }
];

const modalNuevoOpen = ref(false);

const {
  loading,
  confirming,
  error: gestionError,
  successMessage: gestionSuccess,
  vinculos,
  pendingConfirmId,
  codigo,
  form: formNuevo,
  listar,
  crear,
  confirmar
} = useGestionCodeudores();

const seleccionados = computed(() => props.form.codeudores_asignados ?? []);

const idsSeleccionados = computed(() => new Set(seleccionados.value.map((c) => c.vinculo_id)));

const autorizadosDisponibles = computed(() =>
  vinculos.value.filter(
    (v) => v.estado === "autorizado" && !idsSeleccionados.value.has(v.id)
  )
);

const puedeAgregarMas = computed(
  () => seleccionados.value.length < props.codeudoresRequeridos
);

const resetFormNuevo = () => {
  formNuevo.tipo_documento = "1";
  formNuevo.numero_documento = "";
  formNuevo.nombres = "";
  formNuevo.apellidos = "";
  formNuevo.email = "";
  formNuevo.phone = "";
  codigo.value = "";
  pendingConfirmId.value = null;
};

const abrirModalNuevo = () => {
  resetFormNuevo();
  gestionError.value = null;
  gestionSuccess.value = null;
  modalNuevoOpen.value = true;
};

const cerrarModalNuevo = () => {
  modalNuevoOpen.value = false;
  resetFormNuevo();
};

const asignar = (v: CodeudorVinculo) => {
  if (!puedeAgregarMas.value) return;
  if (!props.form.codeudores_asignados) {
    props.form.codeudores_asignados = [];
  }
  const item: CodeudorAsignado = {
    vinculo_id: v.id,
    user_id: v.codeudor.id,
    tipo_documento: String(v.codeudor.tipo_documento || "1"),
    numero_documento: String(v.codeudor.numero_documento || ""),
    nombre_completo: v.codeudor.full_name || v.codeudor.username,
    email: v.codeudor.email,
    telefono: v.codeudor.phone ?? null
  };
  props.form.codeudores_asignados.push(item);
};

const quitar = (vinculoId: number) => {
  if (!props.form.codeudores_asignados) return;
  props.form.codeudores_asignados = props.form.codeudores_asignados.filter(
    (c) => c.vinculo_id !== vinculoId
  );
};

const onCrear = async () => {
  const created = await crear();
  // Si se creó, pendingConfirmId queda activo y el modal muestra el OTP
  if (!created) return;
};

const onConfirmar = async () => {
  const ok = await confirmar();
  if (ok) {
    await listar();
    modalNuevoOpen.value = false;
    resetFormNuevo();
  }
};

onMounted(() => {
  listar();
  if (!props.form.codeudores_asignados) {
    props.form.codeudores_asignados = [];
  }
  if (
    props.codeudoresRequeridos > 0
    && Number(props.form.linea_credito?.codeudores ?? 0) !== props.codeudoresRequeridos
  ) {
    props.form.linea_credito.codeudores = props.codeudoresRequeridos;
  }
});
</script>
