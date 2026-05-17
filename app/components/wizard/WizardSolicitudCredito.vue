<template>
  <UCard class="border-border shadow-sm p-0">
    <WizardHeader
      :current-step="step"
      :total-steps="steps.length"
      :title="currentStep?.title || ''"
    />

    <div class="p-4 sm:p-6">
      <form class="grid gap-4" @submit.prevent>
        <SolicitudStep
          v-if="currentStepKey === 'solicitud'"
          :form="form"
          :tipos-inversion="props.parametros?.tipos_de_inversion || []"
          :fecha-radicado="fechaRadicado"
          :errors="stepErrors"
        />

        <SolicitanteStep
          v-else-if="currentStepKey === 'solicitante'"
          :form="form"
          :ciudades="props.parametros?.ciudades || []"
          :tipos-documento="props.parametros?.codigos_tipo_documento || []"
          :sexos="props.parametros?.sexos || []"
          :niveles-educativos="props.parametros?.nivel_educativos || []"
          :tipos-vivienda="props.parametros?.tipo_vivienda || []"
          :ocupaciones="props.parametros?.ocupaciones || []"
          :estado-civiles="props.parametros?.estado_civiles || []"
          :sectores-economicos="props.parametros?.sectores_economicos || []"
          :errors="stepErrors"
        />

        <ConyugeStep
          v-else-if="currentStepKey === 'conyuge'"
          :form="form"
          :toggle-conyuge="toggleConyuge"
          :toggle-empresa-conyuge="toggleEmpresaConyuge"
          :errors="stepErrors"
        />

        <LaboralStep
          v-else-if="currentStepKey === 'laboral'"
          :form="form"
          :ciudades="props.parametros?.ciudades || []"
          :tipos-contrato="props.parametros?.tipo_contrato || []"
          :ocupaciones="props.parametros?.ocupaciones || []"
          :errors="stepErrors"
        />

        <IngresosStep
          v-else-if="currentStepKey === 'ingresos'"
          :form="form"
          :autocalcular-ingresos="autocalcularIngresos"
          :errors="stepErrors"
        />

        <EconomicaStep
          v-else-if="currentStepKey === 'economica'"
          :form="form"
          :errors="stepErrors"
        />

        <PropiedadesStep
          v-else-if="currentStepKey === 'propiedades'"
          :form="form"
          :add-propiedad="addPropiedad"
          :remove-propiedad="removePropiedad"
          :ciudades="props.parametros?.ciudades || []"
          :errors="stepErrors"
        />

        <DeudasStep
          v-else-if="currentStepKey === 'deudas'"
          :form="form"
          :add-deuda="addDeuda"
          :remove-deuda="removeDeuda"
          :errors="stepErrors"
        />

        <ReferenciasStep
          v-else-if="currentStepKey === 'referencias'"
          :form="form"
          :add-referencia="addReferencia"
          :remove-referencia="removeReferencia"
          :errors="stepErrors"
        />

        <RevisionStep
          v-else-if="currentStepKey === 'revision'"
          :pretty-payload="prettyPayload"
          :xml-text="responseFormData"
          :error-msg="errorMsg"
        />
      </form>

      <StepContainer
        :current-step="step"
        :total-steps="steps.length"
        :is-last-step="step === steps.length - 1"
        :loading="loadingFormData"
        :form="form"
        class="mt-6"
        @prev="prev"
        @next="handleNext"
        @submit="guardarSolicitud(form)"
      />
    </div>
  </UCard>

  <SuccessModal
    :is-open="successModalOpen"
    :solicitud-id="createdSolicitudId"
    @close="closeSuccessModal"
    @view-solicitudes="goToHome"
    @go-to-documentos="goToDocumentos"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useWizardSolicitud } from "~/composables/solicitud/useWizardSolicitud";
import { useSolicitudValidation } from "~/composables/solicitud/useSolicitudValidation";
import SuccessModal from "./SuccessModal.vue";
import WizardHeader from "./WizardHeader.vue";
import StepContainer from "./StepContainer.vue";
import {
  ConyugeStep,
  DeudasStep,
  EconomicaStep,
  IngresosStep,
  LaboralStep,
  PropiedadesStep,
  ReferenciasStep,
  RevisionStep,
  SolicitanteStep,
  SolicitudStep
} from "./steps";

import type { WizardProps } from "~~/shared/types/wizard";

const props = defineProps<WizardProps>();

const {
  addDeuda,
  addPropiedad,
  addReferencia,
  autocalcularIngresos,
  closeSuccessModal,
  createdSolicitudId,
  currentStep,
  currentStepKey,
  errorMsg,
  fechaRadicado,
  form,
  guardarSolicitud,
  goToDocumentos,
  goToHome,
  loadingFormData,
  next,
  prev,
  prettyPayload,
  responseFormData,
  step,
  steps,
  successModalOpen,
  toggleConyuge,
  toggleEmpresaConyuge,
  removeDeuda,
  removePropiedad,
  removeReferencia
} = useWizardSolicitud(props);

const { validateStep } = useSolicitudValidation();

const stepErrors = computed(() => {
  const result = validateStep(currentStepKey.value, form.value);
  return result.errors;
});

const handleNext = () => {
  validateStep(currentStepKey.value, form.value);
  next();
};
</script>