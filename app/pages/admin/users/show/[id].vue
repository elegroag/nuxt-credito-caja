<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <UButton
        variant="outline"
        @click="goBack()"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="w-4 h-4 mr-2"
        />
        Volver
      </UButton>
      <div>
        <h1 class="text-2xl font-semibold text-foreground flex items-center gap-2">
          <UIcon
            name="i-lucide-user-circle"
            class="w-8 h-8 text-primary"
          />
          Detalle del Usuario
        </h1>
        <p class="text-sm text-muted-foreground">
          Información completa del usuario {{ usuario?.nombres }}
          {{ usuario?.apellidos }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-10 h-10 animate-spin text-primary mb-4"
      />
      <p class="text-muted-foreground">
        Cargando información del usuario...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-x-circle"
        class="w-10 h-10 text-destructive mb-4"
      />
      <p class="text-destructive mb-4">
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
      <UPageCard>
        <template #title>
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-user-circle"
              class="w-5 h-5 text-primary"
            />
            Información Principal
          </span>
        </template>
        <div class="p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-center gap-6">
              <div class="shrink-0">
                <div
                  class="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-user"
                    class="w-10 h-10 text-primary"
                  />
                </div>
              </div>

              <div>
                <h2 class="text-2xl font-semibold text-foreground">
                  {{ usuario.full_name || `${usuario.nombres} ${usuario.apellidos}` }}
                </h2>
                <p class="text-lg text-muted-foreground mt-1">
                  {{ usuario.tipo_identificacion || getTipoDocumentoLabel(usuario.tipo_documento) }}
                  {{ usuario.numero_documento }}
                </p>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <UBadge
                    v-for="rol in rolesUsuario"
                    :key="rol"
                    :variant="getRolVariant(rol)"
                  >
                    {{ getRolLabel(rol) }}
                  </UBadge>
                  <UBadge :variant="usuario.is_active ? 'soft' : 'outline'">
                    Sesión: {{ usuario.is_active ? "Activa" : "Inactiva" }}
                  </UBadge>
                  <UBadge :variant="usuario.disabled ? 'outline' : 'soft'">
                    Solicitudes: {{ usuario.disabled ? "Deshabilitado" : "Habilitado" }}
                  </UBadge>
                  <span class="text-sm text-muted-foreground">
                    {{ usuario.email }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <NuxtLink :to="`/admin/users/edit/${usuario.id}`">
                <UButton
                  variant="outline"
                  size="sm"
                >
                  <UIcon
                    name="i-lucide-pencil"
                    class="w-4 h-4 mr-2"
                  />
                  Editar
                </UButton>
              </NuxtLink>
              <UButton
                variant="outline"
                size="sm"
                :color="usuario.is_active ? 'destructive' : 'primary'"
                @click="toggleEstadoUsuario"
              >
                <UIcon
                  v-if="usuario.is_active"
                  name="i-lucide-x"
                  class="w-4 h-4 mr-2"
                />
                <UIcon
                  v-else
                  name="i-lucide-check"
                  class="w-4 h-4 mr-2"
                />
                {{ usuario.is_active ? "Desactivar sesión" : "Activar sesión" }}
              </UButton>
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Información Detallada -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Datos Personales -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-primary"
              />
              Datos Personales
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Nombres
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.nombres }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Apellidos
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.apellidos }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-id-card"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Tipo Documento
                </p>
                <p class="font-medium text-foreground">
                  {{ getTipoDocumentoLabel(usuario.tipo_documento) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-hash"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Número Documento
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.numero_documento }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-phone"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Teléfono
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.phone || "No registrado" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-tag"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Código Categoría
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.codigo_categoria || "No aplica" }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Información de Cuenta -->
        <UPageCard>
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon
                name="i-lucide-shield-check"
                class="w-5 h-5 text-primary"
              />
              Información de Cuenta
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-user-circle"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Nombre de Usuario
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.full_name || `${usuario.nombres} ${usuario.apellidos}` }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-mail"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Email
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.email }}
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-badge-check"
                class="w-5 h-5 text-muted-foreground mt-0.5"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Rol
                </p>
                <div class="flex flex-wrap gap-2 mt-1">
                  <UBadge
                    v-for="rol in rolesUsuario"
                    :key="`cuenta-${rol}`"
                    :variant="getRolVariant(rol)"
                  >
                    {{ getRolLabel(rol) }}
                  </UBadge>
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-info"
                class="w-5 h-5 text-muted-foreground mt-0.5"
              />
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-muted-foreground">
                    Sesión
                  </p>
                  <UBadge
                    class="mt-1"
                    :variant="usuario.is_active ? 'soft' : 'outline'"
                  >
                    {{ usuario.is_active ? "Activa" : "Inactiva" }}
                  </UBadge>
                  <p class="text-xs text-muted-foreground mt-1">
                    Permite iniciar sesión en el sistema
                  </p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">
                    Solicitudes
                  </p>
                  <UBadge
                    class="mt-1"
                    :variant="usuario.disabled ? 'outline' : 'soft'"
                  >
                    {{ usuario.disabled ? "Deshabilitado" : "Habilitado" }}
                  </UBadge>
                  <p class="text-xs text-muted-foreground mt-1">
                    Permite crear solicitudes de crédito
                  </p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Fecha Creación
                </p>
                <p class="font-medium text-foreground">
                  {{ formatDate(usuario.created_at || "") }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-clock"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Último Acceso
                </p>
                <p class="font-medium text-foreground">
                  {{ formatDate(usuario.ultimo_acceso) }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Datos Empresa -->
        <UPageCard v-if="usuario.empresa_nit || usuario.empresa_razon_social">
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon
                name="i-lucide-building-2"
                class="w-5 h-5 text-primary"
              />
              Datos Empresa
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-hash"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  NIT Empresa
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.empresa_nit || "No registrado" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-building-2"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Razón Social
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.empresa_razon_social || "No registrada" }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <!-- Dirección -->
        <UPageCard v-if="usuario.direccion || usuario.ciudad || usuario.barrio">
          <template #title>
            <span class="flex items-center gap-2">
              <UIcon
                name="i-lucide-home"
                class="w-5 h-5 text-primary"
              />
              Dirección de Residencia
            </span>
          </template>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-map-pin"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Dirección
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.direccion || "No registrada" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-map"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Ciudad
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.ciudad || "No registrada" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-map-pinned"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Barrio
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.barrio || "No registrado" }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-home"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Tipo Vivienda
                </p>
                <p class="font-medium text-foreground">
                  {{ getTipoViviendaLabel(usuario.tipo_vivienda || "") }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-users"
                class="w-5 h-5 text-muted-foreground"
              />
              <div>
                <p class="text-sm text-muted-foreground">
                  Personas a Cargo
                </p>
                <p class="font-medium text-foreground">
                  {{ usuario.personas_a_cargo || 0 }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>
      </div>

      <!-- Codeudores asociados -->
      <UPageCard>
        <template #title>
          <div class="flex items-center justify-between gap-3 w-full">
            <span class="flex items-center gap-2">
              <UIcon
                name="i-lucide-users"
                class="w-5 h-5 text-primary"
              />
              Codeudores asociados
            </span>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              icon="i-lucide-user-plus"
              @click="abrirModalCodeudor"
            >
              Agregar codeudor
            </UButton>
          </div>
        </template>
        <div class="p-6 space-y-4">
          <UAlert
            v-if="gestionError"
            color="destructive"
            variant="subtle"
            :title="gestionError"
            close
            @update:open="(open: boolean) => { if (!open) gestionError = null }"
          />
          <UAlert
            v-if="gestionSuccess"
            color="success"
            variant="subtle"
            :title="gestionSuccess"
            close
            @update:open="(open: boolean) => { if (!open) gestionSuccess = null }"
          />

          <div
            v-if="loadingCodeudores && vinculos.length === 0"
            class="py-6 text-center text-sm text-muted-foreground"
          >
            Cargando codeudores...
          </div>
          <div
            v-else-if="vinculos.length === 0"
            class="py-6 text-center text-sm text-muted-foreground"
          >
            Este usuario aún no tiene codeudores asociados.
          </div>
          <div
            v-else
            class="divide-y divide-border"
          >
            <div
              v-for="v in vinculos"
              :key="v.id"
              class="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 first:pt-0 last:pb-0"
            >
              <div>
                <p class="font-medium text-foreground">
                  {{ v.codeudor.full_name || v.codeudor.username }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ v.codeudor.tipo_documento }}
                  {{ v.codeudor.numero_documento }} · {{ v.codeudor.email }}
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
                  @click="abrirAutorizar(v.id)"
                >
                  Ingresar código
                </UButton>
                <UButton
                  v-if="v.estado !== 'autorizado'"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  :loading="loadingCodeudores"
                  @click="reenviar(v.id)"
                >
                  Reenviar código
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UPageCard>

      <UModal
        v-model:open="modalCodeudorOpen"
        :title="modalCodeudorTitle"
        :description="modalCodeudorDescription"
        icon="i-lucide-user-plus"
        class="max-w-2xl"
        :dismissible="!loadingCodeudores && !confirming"
      >
        <template #body>
          <div class="space-y-4">
            <UAlert
              v-if="gestionError"
              color="destructive"
              variant="subtle"
              :title="gestionError"
            />
            <UAlert
              v-if="infoMessage"
              color="info"
              variant="subtle"
              :title="infoMessage"
            />
            <UAlert
              v-if="gestionSuccess"
              color="success"
              variant="subtle"
              :title="gestionSuccess"
            />

            <template v-if="hallazgoAutorizado">
              <p class="text-sm text-muted-foreground">
                El codeudor ya está vinculado a este usuario.
              </p>
            </template>

            <template v-else-if="!pendingConfirmId">
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
              v-if="hallazgoAutorizado"
              color="primary"
              @click="cerrarModalHallazgo"
            >
              Entendido
            </UButton>
            <template v-else>
              <UButton
                variant="outline"
                color="neutral"
                :disabled="loadingCodeudores || confirming"
                @click="cerrarModalCodeudor"
              >
                Cancelar
              </UButton>
              <UButton
                v-if="!pendingConfirmId"
                color="primary"
                :loading="loadingCodeudores"
                @click="onCrearCodeudor"
              >
                Registrar y enviar código
              </UButton>
              <UButton
                v-else
                color="primary"
                :loading="confirming"
                @click="onConfirmarCodeudor"
              >
                Confirmar autorización
              </UButton>
              <UButton
                v-if="pendingConfirmId"
                variant="outline"
                color="neutral"
                :loading="loadingCodeudores"
                @click="reenviar(pendingConfirmId)"
              >
                Reenviar código
              </UButton>
            </template>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useShowUser } from "~/composables/admin/useShowUser";
import { useGestionCodeudores } from "~/composables/codeudor/useGestionCodeudores";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth"]
});

const {
  loading,
  error,
  usuario,
  cargarUsuario,
  toggleEstadoUsuario,
  goBack,
  getRolLabel,
  getRolVariant,
  getTipoDocumentoLabel,
  getTipoViviendaLabel,
  formatDate
} = useShowUser();

const titularUserId = computed(() =>
  usuario.value?.id ? Number(usuario.value.id) : undefined
);

const {
  loading: loadingCodeudores,
  confirming,
  error: gestionError,
  successMessage: gestionSuccess,
  infoMessage,
  vinculos,
  pendingConfirmId,
  codigo,
  form: formNuevo,
  listar,
  crear,
  confirmar,
  reenviar
} = useGestionCodeudores({ titularUserId });

const rolesUsuario = computed(() => {
  const roles = usuario.value?.roles;
  if (Array.isArray(roles) && roles.length > 0) {
    return roles;
  }
  return usuario.value?.rol ? [usuario.value.rol] : [];
});

const tiposDocumento = [
  { label: "Cédula de Ciudadanía", value: "1" },
  { label: "Cédula de Extranjería", value: "2" },
  { label: "NIT", value: "3" },
  { label: "Tarjeta de Identidad", value: "4" }
];

const modalCodeudorOpen = ref(false);
const hallazgoAutorizado = ref(false);

const modalCodeudorTitle = computed(() => {
  if (hallazgoAutorizado.value) return "Codeudor ya vinculado";
  if (pendingConfirmId.value) return "Autorizar codeudor";
  return "Agregar codeudor";
});

const modalCodeudorDescription = computed(() => {
  if (hallazgoAutorizado.value) {
    return "Se encontró un vínculo existente con este codeudor.";
  }
  if (pendingConfirmId.value) {
    return "Ingresa el código de autorización enviado por correo.";
  }
  return "El codeudor quedará asociado a este usuario. Se enviará un código por correo.";
});

const resetFormNuevo = () => {
  formNuevo.tipo_documento = "1";
  formNuevo.numero_documento = "";
  formNuevo.nombres = "";
  formNuevo.apellidos = "";
  formNuevo.email = "";
  formNuevo.phone = "";
  codigo.value = "";
  pendingConfirmId.value = null;
  hallazgoAutorizado.value = false;
};

const abrirModalCodeudor = () => {
  resetFormNuevo();
  gestionError.value = null;
  gestionSuccess.value = null;
  infoMessage.value = null;
  modalCodeudorOpen.value = true;
};

const abrirAutorizar = (vinculoId: number) => {
  resetFormNuevo();
  pendingConfirmId.value = vinculoId;
  gestionError.value = null;
  gestionSuccess.value = null;
  infoMessage.value = null;
  modalCodeudorOpen.value = true;
};

const cerrarModalCodeudor = () => {
  modalCodeudorOpen.value = false;
  resetFormNuevo();
  infoMessage.value = null;
  gestionError.value = null;
  gestionSuccess.value = null;
};

const cerrarModalHallazgo = async () => {
  await listar();
  cerrarModalCodeudor();
};

const onCrearCodeudor = async () => {
  const result = await crear();
  if (!result.vinculo) return;
  if (result.hallazgo === "YA_VINCULADO_AUTORIZADO") {
    hallazgoAutorizado.value = true;
  }
};

const onConfirmarCodeudor = async () => {
  const ok = await confirmar();
  if (ok) {
    cerrarModalCodeudor();
  }
};

watch(
  () => usuario.value?.id,
  async (id) => {
    if (id) await listar();
  }
);

onMounted(() => {
  cargarUsuario();
});
</script>
