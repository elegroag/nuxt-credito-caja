<template>
  <div class="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-foreground flex items-center gap-2">
        <UIcon
          name="i-lucide-users"
          class="w-5 h-5 text-primary"
        />
        Mis codeudores
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Registra codeudores externos. Ellos recibirán un código por correo que debes ingresar para autorizar el vínculo.
      </p>
    </div>

    <UAlert
      v-if="error"
      color="destructive"
      variant="subtle"
      :title="error"
      close
      @update:open="(open: boolean) => { if (!open) error = null }"
    />
    <UAlert
      v-if="infoMessage"
      color="info"
      variant="subtle"
      :title="infoMessage"
      close
      @update:open="(open: boolean) => { if (!open) infoMessage = null }"
    />
    <UAlert
      v-if="successMessage"
      color="success"
      variant="subtle"
      :title="successMessage"
      close
      @update:open="(open: boolean) => { if (!open) successMessage = null }"
    />

    <UPageCard>
      <h2 class="text-base font-semibold mb-4">
        Registrar codeudor
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Tipo documento">
          <USelect
            v-model="form.tipo_documento"
            :items="tiposDocumento"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Número documento">
          <UInput
            v-model="form.numero_documento"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Nombres">
          <UInput
            v-model="form.nombres"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Apellidos">
          <UInput
            v-model="form.apellidos"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Correo electrónico">
          <UInput
            v-model="form.email"
            type="email"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Teléfono">
          <UInput
            v-model="form.phone"
            class="w-full"
          />
        </UFormField>
      </div>
      <div class="flex justify-end mt-4">
        <UButton
          color="primary"
          :loading="loading"
          @click="crear"
        >
          Registrar y enviar código
        </UButton>
      </div>
    </UPageCard>

    <UPageCard v-if="pendingConfirmId">
      <h2 class="text-base font-semibold mb-2">
        Autorizar vínculo
      </h2>
      <p class="text-sm text-muted-foreground mb-4">
        Ingresa el código de 6 dígitos que recibió el codeudor por correo.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="codigo"
          placeholder="Código"
          class="w-full sm:max-w-xs"
          maxlength="6"
        />
        <UButton
          color="primary"
          :loading="confirming"
          @click="confirmar()"
        >
          Confirmar autorización
        </UButton>
      </div>
    </UPageCard>

    <UPageCard>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold">
          Codeudores vinculados
        </h2>
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="listar"
        >
          Actualizar
        </UButton>
      </div>

      <div
        v-if="loading && vinculos.length === 0"
        class="py-8 text-center text-sm text-muted-foreground"
      >
        Cargando...
      </div>
      <div
        v-else-if="vinculos.length === 0"
        class="py-8 text-center text-sm text-muted-foreground"
      >
        Aún no has registrado codeudores.
      </div>
      <div
        v-else
        class="divide-y divide-border"
      >
        <div
          v-for="v in vinculos"
          :key="v.id"
          class="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <p class="font-medium text-foreground">
              {{ v.codeudor.full_name || v.codeudor.username }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ v.codeudor.tipo_documento }} {{ v.codeudor.numero_documento }} · {{ v.codeudor.email }}
            </p>
            <UBadge
              class="mt-2"
              :color="v.estado === 'autorizado' ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ v.estado }}
            </UBadge>
          </div>
          <div class="flex gap-2">
            <UButton
              v-if="v.estado !== 'autorizado'"
              variant="soft"
              color="primary"
              size="sm"
              @click="pendingConfirmId = v.id"
            >
              Ingresar código
            </UButton>
            <UButton
              v-if="v.estado !== 'autorizado'"
              variant="outline"
              color="neutral"
              size="sm"
              :loading="loading"
              @click="reenviar(v.id)"
            >
              Reenviar código
            </UButton>
            <UButton
              variant="ghost"
              color="error"
              size="sm"
              icon="i-lucide-trash-2"
              aria-label="Eliminar vínculo"
              @click="askDelete(v)"
            />
          </div>
        </div>
      </div>
    </UPageCard>

    <UModal
      v-model:open="deleteOpen"
      title="Eliminar codeudor vinculado"
    >
      <template #body>
        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          :title="error"
          class="mb-3"
        />
        <p class="text-sm text-muted-foreground">
          ¿Eliminar el vínculo con
          <strong class="text-foreground">{{ deleting?.codeudor.full_name || deleting?.codeudor.username }}</strong>
          ({{ deleting?.codeudor.numero_documento }})?
          Ya no podrás asignarlo en nuevas solicitudes; las solicitudes existentes no se modifican.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            variant="ghost"
            @click="deleteOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="error"
            :loading="loading"
            @click="confirmDelete"
          >
            Eliminar
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  useGestionCodeudores,
  type CodeudorVinculo
} from "~/composables/codeudor/useGestionCodeudores";
import { usePermissions } from "~/composables/usePermissions";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const { isTrabajador, isAdministrator } = usePermissions();
const router = useRouter();

const tiposDocumento = [
  { label: "Cédula de Ciudadanía", value: "1" },
  { label: "Cédula de Extranjería", value: "2" },
  { label: "NIT", value: "3" },
  { label: "Tarjeta de Identidad", value: "4" }
];

const {
  loading,
  confirming,
  error,
  successMessage,
  infoMessage,
  vinculos,
  pendingConfirmId,
  codigo,
  form,
  listar,
  crear,
  confirmar,
  reenviar,
  eliminar
} = useGestionCodeudores();

const deleteOpen = ref(false);
const deleting = ref<CodeudorVinculo | null>(null);

const askDelete = (v: CodeudorVinculo) => {
  deleting.value = v;
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  if (!deleting.value) return;
  const ok = await eliminar(deleting.value.id);
  if (ok) {
    deleteOpen.value = false;
    deleting.value = null;
  }
};

onMounted(() => {
  if (!isTrabajador.value && !isAdministrator.value) {
    router.replace("/dash");
    return;
  }
  listar();
});
</script>
