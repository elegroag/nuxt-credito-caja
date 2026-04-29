<template>
  <div class="container mx-auto p-4 space-y-6">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">Nueva Solicitud de Crédito</h1>
      <p class="text-base-content/70">
        Complete todos los pasos para generar su solicitud
      </p>
    </div>

    <!-- Validación de Convenio (si aplica) -->
    <div v-if="mostrarValidacionConvenio" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Validar Convenio Empresarial</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">NIT Empresa</span>
            </label>
            <UInput
              v-model="nitEmpresa"
              type="text"
              placeholder="900123456"
              class="input input-bordered"
              :disabled="convenioValidado"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Cédula Trabajador</span>
            </label>
            <UInput
              v-model="cedulaTrabajador"
              type="text"
              placeholder="1234567890"
              class="input input-bordered"
              :disabled="convenioValidado"
            />
          </div>
        </div>

        <button
          v-if="!convenioValidado"
          class="btn btn-primary"
          :disabled="!nitEmpresa || !cedulaTrabajador || loadingConvenio"
          @click="validarConvenio"
        >
          <span v-if="!loadingConvenio">Validar Convenio</span>
          <span v-else class="loading loading-spinner loading-sm"></span>
        </button>

        <!-- Resultado de validación -->
        <ConvenioAlert
          v-if="mensajeConvenio"
          :titulo="mensajeConvenio.titulo"
          :descripcion="mensajeConvenio.descripcion"
          :tipo="mensajeConvenio.tipo"
        />
      </div>
    </div>

    <!-- PDF Actions (después de crear solicitud) -->
    <PDFActions
      v-if="solicitudCreada"
      :solicitud-id="solicitudId"
      :mostrar-boton-regenerar="true"
      @pdf-generado="handlePDFGenerado"
      @error="handleError"
    />

    <!-- Firmado Digital (después de generar PDF) -->
    <FirmadoStatus
      v-if="pdfGenerado"
      :solicitud-id="solicitudId"
      :auto-actualizar="true"
      :intervalo-polling="10000"
      @firmado-iniciado="handleFirmadoIniciado"
      @firmado-completado="handleFirmadoCompletado"
    />

    <!-- Progreso del flujo -->
    <div v-if="solicitudCreada" class="card bg-base-200">
      <div class="card-body">
        <h3 class="card-title text-sm">Progreso del Proceso</h3>
        <ul class="steps steps-vertical lg:steps-horizontal w-full">
          <li class="step step-primary">Solicitud Creada</li>
          <li class="step" :class="{ 'step-primary': convenioValidado }">
            Convenio {{ convenioValidado ? "Validado" : "Pendiente" }}
          </li>
          <li class="step" :class="{ 'step-primary': pdfGenerado }">
            PDF {{ pdfGenerado ? "Generado" : "Pendiente" }}
          </li>
          <li class="step" :class="{ 'step-primary': firmadoIniciado }">
            Firmado {{ firmadoIniciado ? "Iniciado" : "Pendiente" }}
          </li>
          <li class="step" :class="{ 'step-primary': firmadoCompletado }">
            {{ firmadoCompletado ? "Completado" : "En Proceso" }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "#imports";
import { useConvenioValidation } from "~/composables/solicitud/useConvenioValidation";
import ConvenioAlert from "~/components/solicitud/ConvenioAlert.vue";
import PDFActions from "~/components/solicitud/PDFActions.vue";
import FirmadoStatus from "~/components/solicitud/FirmadoStatus.vue";

interface Props {
  solicitudId?: string;
  mostrarValidacionConvenio?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mostrarValidacionConvenio: true,
});

const emit = defineEmits<{
  convenioValidado: [elegible: boolean];
  pdfGenerado: [];
  firmadoCompletado: [];
}>();

// Convenio
const {
  loading: loadingConvenio,
  error: errorConvenio,
  isElegible,
  validarConvenio: validarConvenioFn,
  getMensajeError,
} = useConvenioValidation();

const nitEmpresa = ref("");
const cedulaTrabajador = ref("");

// Estados del flujo
const solicitudCreada = computed(() => Boolean(props.solicitudId));
const solicitudId = computed(() => props.solicitudId || "");
const convenioValidado = ref(false);
const pdfGenerado = ref(false);
const firmadoIniciado = ref(false);
const firmadoCompletado = ref(false);

const mensajeConvenio = computed(() => {
  if (convenioValidado.value && isElegible.value) {
    return {
      titulo: "✅ Elegible para Convenio Empresarial",
      descripcion:
        "El trabajador cumple con todos los requisitos y tiene beneficios especiales",
      tipo: "success" as const,
    };
  }

  return getMensajeError.value;
});

const validarConvenio = async () => {
  const elegible = await validarConvenioFn(
    nitEmpresa.value,
    cedulaTrabajador.value,
  );
  convenioValidado.value = true;
  emit("convenioValidado", elegible);
};

const handlePDFGenerado = () => {
  pdfGenerado.value = true;
  emit("pdfGenerado");
};

const handleFirmadoIniciado = () => {
  firmadoIniciado.value = true;
};

const handleFirmadoCompletado = () => {
  firmadoCompletado.value = true;
  emit("firmadoCompletado");
};

const handleError = (error: string) => {
  console.error("Error:", error);
};
</script>
