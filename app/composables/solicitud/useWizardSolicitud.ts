import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSolicitudCreditoForm } from "~/composables/solicitud/useSolicitudCreditoForm";
import { useSimuladorStorage } from "~/composables/useSimuladorStorage";
import { useSession } from "~/composables/useSession";
import type { WizardStep, WizardProps } from "~~/shared/types/wizard";

export type { WizardStep, WizardProps };

const WIZARD_STEP_STORAGE_KEY = "comfaca_credito_solicitud_current_step";

export const WIZARD_STEPS: WizardStep[] = [
  { key: "solicitud", title: "Solicitud", short: "Solicitud" },
  { key: "solicitante", title: "Datos del solicitante", short: "Solicitante" },
  { key: "conyuge", title: "Datos del cónyuge (opcional)", short: "Cónyuge" },
  { key: "laboral", title: "Información laboral", short: "Laboral" },
  { key: "ingresos", title: "Ingresos y descuentos", short: "Ingresos" },
  { key: "economica", title: "Información económica", short: "Económica" },
  { key: "propiedades", title: "Propiedades", short: "Propiedades" },
  { key: "deudas", title: "Deudas", short: "Deudas" },
  { key: "referencias", title: "Referencias", short: "Referencias" },
  { key: "revision", title: "Revisión y generación", short: "Revisión" }
];

export const DEFAULT_WIZARD_STEP_KEY = WIZARD_STEPS[0]?.key ?? "solicitud";

export const isWizardStepKey = (value: string): boolean => {
  return WIZARD_STEPS.some(step => step.key === value);
};

export const getStoredWizardStepKey = (): string => {
  if (!import.meta.client) {
    return DEFAULT_WIZARD_STEP_KEY;
  }

  const storedStep = localStorage.getItem(WIZARD_STEP_STORAGE_KEY);
  return storedStep && isWizardStepKey(storedStep)
    ? storedStep
    : DEFAULT_WIZARD_STEP_KEY;
};

export function useWizardSolicitud(props?: WizardProps) {
  const route = useRoute();
  const router = useRouter();
  const { postJson } = useApi();
  const simuladorStorage = useSimuladorStorage();
  const { hasSimuladorData, getDatosParaSolicitud } = useSimuladorStorage();
  const { session } = useSession();

  const loadingFormData = ref(false);
  const responseFormData = ref("");
  const createdSolicitudId = ref("");
  const errorMsg = ref("");
  const numeroSolicitud = ref("");
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null);
  const successModalOpen = ref(false);
  const pdfGenerado = ref(false);
  const mensajeProgreso = ref("");
  const wizardBootstrapped = useState<boolean>(
    "solicitudWizardBootstrapped",
    () => false
  );

  const {
    form,
    toggleConyuge,
    toggleEmpresaConyuge,
    autocalcularIngresos,
    addPropiedad,
    removePropiedad,
    addDeuda,
    removeDeuda,
    addReferencia,
    removeReferencia,
    reset,
    clearPersistedForm
  } = useSolicitudCreditoForm();

  const currentStepKey = computed(() => {
    // Usar initialStep si se proporciona, sino usar route.params.step
    if (props?.initialStep && isWizardStepKey(props.initialStep)) {
      return props.initialStep;
    }

    const rawStep
      = typeof route.params.step === "string"
        ? route.params.step
        : DEFAULT_WIZARD_STEP_KEY;
    return isWizardStepKey(rawStep) ? rawStep : DEFAULT_WIZARD_STEP_KEY;
  });

  const step = computed(() => {
    const index = WIZARD_STEPS.findIndex(
      wizardStep => wizardStep.key === currentStepKey.value
    );
    return index >= 0 ? index : 0;
  });

  const currentStep = computed(
    () => WIZARD_STEPS[step.value] ?? WIZARD_STEPS[0]
  );

  const prettyPayload = computed(() => JSON.stringify(form.value, null, 2));

  const fechaRadicado = new Date().toISOString().split("T")[0] || "";

  const persistCurrentStep = (stepKey: string) => {
    if (!import.meta.client) {
      return;
    }

    localStorage.setItem(WIZARD_STEP_STORAGE_KEY, stepKey);
  };

  const goToStep = async (stepKey: string) => {
    if (!isWizardStepKey(stepKey) || stepKey === currentStepKey.value) {
      return;
    }

    await router.push(`/solicitud/${stepKey}`);
  };

  const goToStepByIndex = async (index: number) => {
    const targetStep = WIZARD_STEPS[index];
    if (!targetStep) {
      return;
    }

    await goToStep(targetStep.key);
  };

  const next = async () => {
    const nextStep
      = WIZARD_STEPS[Math.min(step.value + 1, WIZARD_STEPS.length - 1)];
    if (!nextStep) {
      return;
    }

    await goToStep(nextStep.key);
  };

  const prev = async () => {
    const previousStep = WIZARD_STEPS[Math.max(step.value - 1, 0)];
    if (!previousStep) {
      return;
    }

    await goToStep(previousStep.key);
  };

  const consultarNumeroSolicitudDisponible = async () => {
    try {
      const datosSimulador = getDatosParaSolicitud();

      if (!datosSimulador?.lineaCredito?.tipcre) {
        console.warn(
          "No hay línea de crédito disponible para consultar número"
        );
        return;
      }

      const payload = {
        linea_credito: datosSimulador.lineaCredito.tipcre
      };

      const response = await postJson<{ data: string }>(
        "/api/solicitudes/numero-disponible",
        payload,
        { auth: true }
      );

      if (response?.data) {
        numeroSolicitud.value = response.data;
        form.value.solicitud.numero_solicitud = response.data;
      }
    } catch (error) {
      console.error("Error consultando número de solicitud disponible:", error);
    }
  };

  const iniciarConsultaRecurrente = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value);
    }

    consultarNumeroSolicitudDisponible();

    intervalId.value = setInterval(() => {
      consultarNumeroSolicitudDisponible();
    }, 30000);
  };

  const detenerConsultaRecurrente = () => {
    if (!intervalId.value) {
      return;
    }

    clearInterval(intervalId.value);
    intervalId.value = null;
  };

  const loadDataWizard = () => {
    if (wizardBootstrapped.value) {
      return;
    }

    wizardBootstrapped.value = true;

    if (hasSimuladorData()) {
      const datosSimulador = getDatosParaSolicitud();
      if (datosSimulador) {
        form.value.solicitud.valor_solicitud = datosSimulador.valorSolicitud;
        form.value.solicitud.cuota_mensual = Math.round(
          datosSimulador.cuotaMensual
        );
        form.value.solicitud.plazo_meses = datosSimulador.plazoMeses;

        if (datosSimulador.lineaCredito) {
          form.value.linea_credito = {
            tipcre: datosSimulador.lineaCredito.tipcre,
            modxml4: datosSimulador.lineaCredito.modxml4,
            detalle_modalidad: datosSimulador.lineaCredito.detalle,
            numero_cuotas: datosSimulador.lineaCredito.numcuo,
            estado: datosSimulador.lineaCredito.estado,
            auxest: datosSimulador.lineaCredito.auxest,
            estcre: datosSimulador.lineaCredito.estcre,
            pagseg: datosSimulador.lineaCredito.pagseg,
            repdcr: datosSimulador.lineaCredito.repdcr,
            tipfin: datosSimulador.lineaCredito.tipfin,
            tasa_interes: datosSimulador.tasaInteres,
            total_intereses: datosSimulador.totalIntereses,
            total_pagar: datosSimulador.totalPagar
          };

          form.value.solicitud.tipcre = datosSimulador.lineaCredito.tipcre;
          form.value.solicitud.modxml4 = datosSimulador.lineaCredito.modxml4;
          form.value.solicitud.detalle_modalidad
            = datosSimulador.lineaCredito.detalle;
        }
      }
    }

    // Cargar datos del trabajador desde localStorage
    let trabajador: any = null;
    if (import.meta.client) {
      try {
        const trabajadorStorage = localStorage.getItem(
          "comfaca_credito_trabaajdor"
        );
        if (trabajadorStorage) {
          trabajador = JSON.parse(trabajadorStorage);
        }
      } catch (error) {
        console.error(
          "Error leyendo datos del trabajador del localStorage:",
          error
        );
      }
    }

    // Si no hay datos en localStorage, usar los de la sesión
    if (!trabajador && session.value?.user?.trabajador) {
      trabajador = session.value.user.trabajador;
    }

    if (trabajador) {
      form.value.solicitante.tipo_persona = "natural";
      form.value.solicitante.tipo_documento
        = trabajador.coddoc
          || trabajador.tipo_documento
          || form.value.solicitante.tipo_documento;
      form.value.solicitante.numero_documento
        = trabajador.cedtra
          || trabajador.cedula
          || trabajador.numero_documento
          || form.value.solicitante.numero_documento;
      form.value.solicitante.nombres = [
        trabajador.prinom || trabajador.primer_nombre,
        trabajador.segnom || trabajador.segundo_nombre
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      form.value.solicitante.apellidos = [
        trabajador.priape || trabajador.primer_apellido,
        trabajador.segape || trabajador.segundo_apellido
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      form.value.solicitante.fecha_nacimiento
        = trabajador.fecnac
          || trabajador.fecha_nacimiento
          || form.value.solicitante.fecha_nacimiento;
      form.value.solicitante.genero
        = trabajador.sexo || trabajador.genero || form.value.solicitante.genero;
      form.value.solicitante.estado_civil
        = trabajador.estciv
          || trabajador.estado_civil
          || form.value.solicitante.estado_civil;
      form.value.solicitante.nivel_educativo
        = trabajador.nivedu
          || trabajador.nivel_educativo
          || form.value.solicitante.nivel_educativo;
      form.value.solicitante.profesion
        = trabajador.cargo
          || trabajador.profesion
          || form.value.solicitante.profesion;
      form.value.solicitante.email
        = trabajador.email || form.value.solicitante.email;
      form.value.solicitante.telefono
        = trabajador.telefono || form.value.solicitante.telefono;
      form.value.solicitante.celular
        = trabajador.telefono
          || trabajador.celular
          || form.value.solicitante.celular;
      form.value.solicitante.direccion
        = trabajador.direccion || form.value.solicitante.direccion;
      form.value.solicitante.barrio
        = trabajador.barrio
          || trabajador.direccion
          || form.value.solicitante.barrio;
      form.value.solicitante.ciudad
        = trabajador.codciu
          || trabajador.ciudad_codigo
          || trabajador.ciudad
          || form.value.solicitante.ciudad;
      form.value.solicitante.departamento
        = trabajador.departamento
          || form.value.solicitante.departamento
          || "Caquetá";
      form.value.solicitante.cargo
        = trabajador.cargo || form.value.solicitante.cargo;
      form.value.solicitante.salario
        = trabajador.salario || form.value.solicitante.salario;
      form.value.solicitante.codigo_categoria
        = trabajador.codcat
          || trabajador.codigo_categoria
          || form.value.solicitante.codigo_categoria;
      form.value.solicitud.categoria
        = trabajador.codcat
          || trabajador.codigo_categoria
          || form.value.solicitud.categoria;
      form.value.solicitante.pais_residencia
        = trabajador.pais_residencia || "CO";
      form.value.solicitante.personas_a_cargo
        = trabajador.personas_a_cargo
          || form.value.solicitante.personas_a_cargo
          || 0;
      form.value.solicitante.antiguedad_meses
        = trabajador.antiguedad_meses
          || form.value.solicitante.antiguedad_meses
          || 0;

      // Datos de la empresa
      const nit = trabajador.nit || trabajador.empresa_cedrep;
      const razonSocial = trabajador.razsoc || trabajador.empresa_razsoc;
      const empresaDireccion
        = trabajador.empresa_direccion || trabajador.dirlab;
      const empresaTelefono
        = trabajador.empresa_telefono || trabajador.telefono;
      const empresaCiudad = trabajador.empresa_codciu || trabajador.codciu;
      const representanteLegal = trabajador.repleg || trabajador.empresa_repleg;
      const representanteCedula = trabajador.empresa_cedrep;

      if (nit) {
        form.value.solicitante.nit = nit || form.value.solicitante.nit;
        form.value.solicitante.razon_social
          = razonSocial || form.value.solicitante.razon_social;
        form.value.informacion_laboral.empresa_razon_social
          = razonSocial || form.value.informacion_laboral.empresa_razon_social;
        form.value.informacion_laboral.empresa_nit
          = nit || form.value.informacion_laboral.empresa_nit;
        form.value.informacion_laboral.empresa_telefono
          = empresaTelefono || form.value.informacion_laboral.empresa_telefono;
        form.value.informacion_laboral.empresa_direccion
          = empresaDireccion || form.value.informacion_laboral.empresa_direccion;
        form.value.informacion_laboral.empresa_ciudad
          = empresaCiudad || form.value.informacion_laboral.empresa_ciudad;
        form.value.informacion_laboral.cargo
          = trabajador.cargo || form.value.informacion_laboral.cargo;
        form.value.informacion_laboral.fecha_ingreso
          = trabajador.fecafi
            || trabajador.fecha_afiliacion
            || trabajador.fecha_ingreso
            || form.value.informacion_laboral.fecha_ingreso;
        form.value.informacion_laboral.tiempo_servicio
          = trabajador.tiempo_servicio
            || form.value.informacion_laboral.tiempo_servicio
            || 1;
        form.value.informacion_laboral.tiempo_servicio_unidad
          = trabajador.tiempo_servicio_unidad
            || form.value.informacion_laboral.tiempo_servicio_unidad
            || "anios";
        form.value.informacion_laboral.tipo_contrato
          = trabajador.tipcon || form.value.informacion_laboral.tipo_contrato;
      }

      if (trabajador.salario) {
        form.value.ingresos_descuentos.salario_basico_mensual
          = trabajador.salario;
        form.value.ingresos_descuentos.salud_pension = Math.round(
          trabajador.salario * 0.08
        );
      }
    }

    if (!form.value.solicitud.fecha_radicado) {
      form.value.solicitud.fecha_radicado = fechaRadicado;
    }
  };

  const closeSuccessModal = () => {
    successModalOpen.value = false;
  };

  const clearWizardProgress = () => {
    clearPersistedForm();

    if (!import.meta.client) {
      return;
    }

    localStorage.removeItem(WIZARD_STEP_STORAGE_KEY);
  };

  const goToHome = async () => {
    successModalOpen.value = false;
    clearWizardProgress();
    reset();
    await router.push("/");
  };

  const goToDocumentos = async () => {
    const id = createdSolicitudId.value;
    if (!id) {
      return;
    }

    successModalOpen.value = false;
    clearWizardProgress();
    reset();
    await router.push(`/dash/solicitud/documentos/${id}`);
  };

  const guardarSolicitud = async (
    payloadForm: SolicitudCreditoPayload
  ): Promise<boolean> => {
    pdfGenerado.value = false;
    mensajeProgreso.value = "Generando solicitud...";
    loadingFormData.value = true;
    errorMsg.value = "";
    createdSolicitudId.value = "";

    try {
      const simuladorData = simuladorStorage.loadSimuladorData();

      const payload: SolicitudCreditoPayload = {
        ...payloadForm,
        ...(simuladorData?.lineaCredito && {
          linea_credito: {
            ...payloadForm.linea_credito,
            tipcre: simuladorData.lineaCredito.tipcre,
            modxml4: simuladorData.lineaCredito.modxml4,
            detalle_modalidad: simuladorData.lineaCredito.detalle,
            numero_cuotas: simuladorData.lineaCredito.numcuo,
            estado: simuladorData.lineaCredito.estado,
            auxest: simuladorData.lineaCredito.auxest,
            estcre: simuladorData.lineaCredito.estcre,
            pagseg: simuladorData.lineaCredito.pagseg,
            repdcr: simuladorData.lineaCredito.repdcr,
            tipfin: simuladorData.lineaCredito.tipfin
          }
        })
      };

      const response = await postJson<GuardarSolicitudResponse>(
        "/api/solicitudes/guardar-solicitud",
        payload,
        { auth: true }
      );

      if (!response) {
        throw new Error("Respuesta inválida del servidor");
      }

      console.log("Respuesta del servidor:", response);
      createdSolicitudId.value = response.data?.numero_solicitud || "";
      responseFormData.value = response._data || "";
      successModalOpen.value = true;
      return true;
    } catch (error: unknown) {
      responseFormData.value = "";

      if (
        typeof error === "object"
        && error !== null
        && "data" in error
        && typeof error.data === "object"
        && error.data !== null
        && "error" in error.data
        && typeof error.data.error === "string"
      ) {
        errorMsg.value = error.data.error;
      } else if (error instanceof Error) {
        errorMsg.value = error.message;
      } else {
        errorMsg.value = "Error generando XML";
      }

      return false;
    } finally {
      loadingFormData.value = false;
    }
  };

  watch(
    currentStepKey,
    (value) => {
      persistCurrentStep(value);
    },
    { immediate: true }
  );

  onMounted(() => {
    loadDataWizard();
    iniciarConsultaRecurrente();
  });

  onUnmounted(() => {
    detenerConsultaRecurrente();
  });

  return {
    form,
    step,
    currentStep,
    currentStepKey,
    loadingFormData,
    responseFormData,
    numeroSolicitud,
    createdSolicitudId,
    errorMsg,
    successModalOpen,
    pdfGenerado,
    mensajeProgreso,
    steps: WIZARD_STEPS,
    prettyPayload,
    fechaRadicado,
    next,
    prev,
    goToStep,
    goToStepByIndex,
    toggleConyuge,
    toggleEmpresaConyuge,
    autocalcularIngresos,
    addPropiedad,
    removePropiedad,
    addDeuda,
    removeDeuda,
    addReferencia,
    removeReferencia,
    closeSuccessModal,
    goToHome,
    goToDocumentos,
    guardarSolicitud,
    consultarNumeroSolicitudDisponible,
    iniciarConsultaRecurrente,
    detenerConsultaRecurrente,
    clearWizardProgress
  };
}
