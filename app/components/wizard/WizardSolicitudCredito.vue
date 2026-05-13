<template>
  <UCard class="border-border shadow-sm p-0">
    <WizardHeader
      :current-step="step"
      :total-steps="steps.length"
      :title="currentStep?.title || ''"
      :steps="steps"
      :primary-button-text="'Enviar'"
      @prev="prev"
      @next="next"
      @step-change="goToStepByIndex"
      @primary-action="guardarSolicitud(form)"
    />

    <div class="p-4 sm:p-6">
      <form class="grid gap-4" @submit.prevent>
        <SolicitudStep
          v-if="currentStepKey === 'solicitud'"
          :form="form"
          :tipos-inversion="props.parametros?.tipos_de_inversion || []"
          :fecha-radicado="fechaRadicado"
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
        />

        <ConyugeStep
          v-else-if="currentStepKey === 'conyuge'"
          :form="form"
          :toggle-conyuge="toggleConyuge"
          :toggle-empresa-conyuge="toggleEmpresaConyuge"
        />

        <LaboralStep
          v-else-if="currentStepKey === 'laboral'"
          :form="form"
          :ciudades="props.parametros?.ciudades || []"
          :tipos-contrato="props.parametros?.tipo_contrato || []"
          :ocupaciones="props.parametros?.ocupaciones || []"
        />

        <IngresosStep
          v-else-if="currentStepKey === 'ingresos'"
          :form="form"
          :autocalcular-ingresos="autocalcularIngresos"
        />

        <EconomicaStep v-else-if="currentStepKey === 'economica'" :form="form" />

        <PropiedadesStep
          v-else-if="currentStepKey === 'propiedades'"
          :form="form"
          :add-propiedad="addPropiedad"
          :remove-propiedad="removePropiedad"
          :ciudades="props.parametros?.ciudades || []"
        />

        <DeudasStep
          v-else-if="currentStepKey === 'deudas'"
          :form="form"
          :add-deuda="addDeuda"
          :remove-deuda="removeDeuda"
        />

        <ReferenciasStep
          v-else-if="currentStepKey === 'referencias'"
          :form="form"
          :add-referencia="addReferencia"
          :remove-referencia="removeReferencia"
        />

        <RevisionStep
          v-else-if="currentStepKey === 'revision'"
          :pretty-payload="prettyPayload"
          :xml-text="responseFormData"
          :error-msg="errorMsg"
          :mensaje-progreso="mensajeProgreso"
        />
      </form>
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
import { useWizardSolicitud } from "~/composables/solicitud/useWizardSolicitud";
import SuccessModal from "./SuccessModal.vue";
import WizardHeader from "./WizardHeader.vue";
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
  goToStepByIndex,
  mensajeProgreso,
  next,
  prettyPayload,
  prev,
  removeDeuda,
  removePropiedad,
  removeReferencia,
  responseFormData,
  step,
  steps,
  successModalOpen,
  toggleConyuge,
  toggleEmpresaConyuge
} = useWizardSolicitud(props);
</script>
