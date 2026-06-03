import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSolicitudCreditoForm } from "~/composables/solicitud/useSolicitudCreditoForm";
import { useSimuladorStorage } from "~/composables/useSimuladorStorage";
import { useSession } from "~/composables/useSession";
import { useConfigurations } from "~/composables/admin/useConfigurations";
import type { WizardStep, WizardProps } from "~~/shared/types/wizard";
import type { TiempoServicioUnidad } from "~~/shared/types/enums";

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
  return WIZARD_STEPS.some((step) => step.key === value);
};

export const getStoredWizardStepKey = (): string => {
  if (!import.meta.client) {
    return DEFAULT_WIZARD_STEP_KEY;
  }

  const storedStep = localStorage.getItem(WIZARD_STEP_STORAGE_KEY);
  return storedStep && isWizardStepKey(storedStep) ? storedStep : DEFAULT_WIZARD_STEP_KEY;
};

export function useWizardSolicitud(_props?: WizardProps) {
  const _route = useRoute();
  const router = useRouter();
  const { postJson } = useApi();
  const simuladorStorage = useSimuladorStorage();
  const { hasSimuladorData, getDatosParaSolicitud } = useSimuladorStorage();
  const { session } = useSession();
  const { loadConfigurations, getConfigurationAsNumber } = useConfigurations();

  const loadingFormData = ref(false);
  const responseFormData = ref("");
  const createdSolicitudId = ref("");
  const errorMsg = ref("");
  const numeroSolicitud = ref("");
  const intervalId = ref<ReturnType<typeof setInterval> | null>(null);
  const successModalOpen = ref(false);
  const pdfGenerado = ref(false);
  const mensajeProgreso = ref("");
  const wizardBootstrapped = useState<boolean>("solicitudWizardBootstrapped", () => false);
  const currentStepIndex = useState<number>("solicitudWizardStepIndex", () => 0);

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
    const stepKey = WIZARD_STEPS[currentStepIndex.value]?.key ?? DEFAULT_WIZARD_STEP_KEY;
    return stepKey;
  });

  const step = computed(() => currentStepIndex.value);

  const currentStep = computed(() => WIZARD_STEPS[currentStepIndex.value] ?? WIZARD_STEPS[0]);

  const prettyPayload = computed(() => JSON.stringify(form.value, null, 2));

  const fechaRadicado = new Date().toISOString().split("T")[0] || "";

  const persistCurrentStep = (stepKey: string) => {
    if (!import.meta.client) {
      return;
    }

    localStorage.setItem(WIZARD_STEP_STORAGE_KEY, stepKey);
  };

  const goToStep = (stepKey: string) => {
    const index = WIZARD_STEPS.findIndex((s) => s.key === stepKey);
    if (index >= 0) {
      currentStepIndex.value = index;
    }
  };

  const goToStepByIndex = (index: number) => {
    if (index >= 0 && index < WIZARD_STEPS.length) {
      currentStepIndex.value = index;
    }
  };

  const next = () => {
    if (currentStepIndex.value < WIZARD_STEPS.length - 1) {
      currentStepIndex.value++;
    }
  };

  const prev = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--;
    }
  };

  const consultarNumeroSolicitudDisponible = async () => {
    try {
      const datosSimulador = getDatosParaSolicitud();

      if (!datosSimulador?.lineaCredito?.tipcre) {
        console.warn("No hay línea de crédito disponible para consultar número");
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

  const loadDataWizard = async () => {
    if (wizardBootstrapped.value) {
      return;
    }

    wizardBootstrapped.value = true;

    await loadConfigurations();

    if (hasSimuladorData()) {
      const datosSimulador = getDatosParaSolicitud();
      if (datosSimulador) {
        form.value.solicitud.valor_solicitud = datosSimulador.valorSolicitud;
        form.value.solicitud.cuota_mensual = Math.round(datosSimulador.cuotaMensual);
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
          form.value.solicitud.detalle_modalidad = datosSimulador.lineaCredito.detalle;
        }
      }
    }

    // Cargar datos del trabajador desde localStorage
    let trabajador: Record<string, unknown> = {};
    if (import.meta.client) {
      try {
        const trabajadorStorage = localStorage.getItem("comfaca_credito_trabajador");
        if (trabajadorStorage) {
          trabajador = JSON.parse(trabajadorStorage);
        }
      } catch (error) {
        console.error("Error leyendo datos del trabajador del localStorage:", error);
      }
    }

    // Si no hay datos en localStorage, usar los de la sesión
    if (!trabajador && session.value?.user?.trabajador) {
      trabajador = session.value.user.trabajador;
    }

    // Helper to safely get string values from Record<string, unknown>
    const getString = (
      obj: Record<string, unknown>,
      key: string,
      fallback: string = ""
    ): string => {
      const val = obj[key];
      return typeof val === "string" ? val : fallback;
    };

    if (trabajador) {
      form.value.solicitante.tipo_persona = "natural";
      form.value.solicitante.tipo_documento =
        getString(trabajador, "coddoc") ||
        getString(trabajador, "tipo_documento") ||
        form.value.solicitante.tipo_documento;
      form.value.solicitante.numero_documento =
        getString(trabajador, "cedtra") ||
        getString(trabajador, "cedula") ||
        getString(trabajador, "numero_documento") ||
        form.value.solicitante.numero_documento;
      form.value.solicitante.nombres = [
        getString(trabajador, "prinom") || getString(trabajador, "primer_nombre"),
        getString(trabajador, "segnom") || getString(trabajador, "segundo_nombre")
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      form.value.solicitante.apellidos = [
        getString(trabajador, "priape") || getString(trabajador, "primer_apellido"),
        getString(trabajador, "segape") || getString(trabajador, "segundo_apellido")
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      form.value.solicitante.fecha_nacimiento =
        getString(trabajador, "fecnac") ||
        getString(trabajador, "fecha_nacimiento") ||
        form.value.solicitante.fecha_nacimiento;
      form.value.solicitante.genero =
        getString(trabajador, "sexo") ||
        getString(trabajador, "genero") ||
        form.value.solicitante.genero;
      form.value.solicitante.estado_civil =
        getString(trabajador, "estciv") ||
        getString(trabajador, "estado_civil") ||
        form.value.solicitante.estado_civil;
      form.value.solicitante.nivel_educativo =
        getString(trabajador, "nivedu") ||
        getString(trabajador, "nivel_educativo") ||
        form.value.solicitante.nivel_educativo;
      form.value.solicitante.profesion =
        getString(trabajador, "cargo") ||
        getString(trabajador, "profesion") ||
        form.value.solicitante.profesion;
      form.value.solicitante.email = getString(trabajador, "email") || form.value.solicitante.email;
      form.value.solicitante.telefono =
        getString(trabajador, "telefono") || form.value.solicitante.telefono;
      form.value.solicitante.celular =
        getString(trabajador, "telefono") ||
        getString(trabajador, "celular") ||
        form.value.solicitante.celular;
      form.value.solicitante.direccion =
        getString(trabajador, "direccion") || form.value.solicitante.direccion;
      form.value.solicitante.barrio =
        getString(trabajador, "barrio") ||
        getString(trabajador, "direccion") ||
        form.value.solicitante.barrio;
      form.value.solicitante.ciudad =
        getString(trabajador, "codciu") ||
        getString(trabajador, "ciudad_codigo") ||
        getString(trabajador, "ciudad") ||
        form.value.solicitante.ciudad;
      form.value.solicitante.departamento =
        getString(trabajador, "departamento") || form.value.solicitante.departamento || "Caquetá";
      form.value.solicitante.cargo = getString(trabajador, "cargo") || form.value.solicitante.cargo;
      form.value.solicitante.salario =
        typeof trabajador.salario === "number"
          ? trabajador.salario
          : form.value.solicitante.salario;
      form.value.solicitante.codigo_categoria =
        getString(trabajador, "codcat") ||
        getString(trabajador, "codigo_categoria") ||
        form.value.solicitante.codigo_categoria;
      form.value.solicitud.categoria =
        getString(trabajador, "codcat") ||
        getString(trabajador, "codigo_categoria") ||
        form.value.solicitud.categoria;
      form.value.solicitante.pais_residencia = getString(trabajador, "pais_residencia") || "170";
      form.value.solicitante.personas_a_cargo =
        typeof trabajador.personas_a_cargo === "number"
          ? trabajador.personas_a_cargo
          : form.value.solicitante.personas_a_cargo || 0;
      form.value.solicitante.antiguedad_meses =
        typeof trabajador.antiguedad_meses === "number"
          ? trabajador.antiguedad_meses
          : form.value.solicitante.antiguedad_meses || 0;
      form.value.solicitante.tipo_vivienda =
        getString(trabajador, "vivienda") || form.value.solicitante.tipo_vivienda || "";
      form.value.solicitante.vive_con_nucleo_familiar =
        trabajador.estciv == 2 || trabajador.estciv == 4 || false;
      form.value.solicitante.sector_economico = getString(trabajador, "agro") == "S" ? "1" : "3";

      // Datos de la empresa
      const nit = getString(trabajador, "nit") || getString(trabajador, "empresa_cedrep");
      const razonSocial =
        getString(trabajador, "razsoc") || getString(trabajador, "empresa_razsoc");
      const empresaDireccion =
        getString(trabajador, "empresa_direccion") || getString(trabajador, "dirlab");
      const empresaTelefono =
        getString(trabajador, "empresa_telefono") || getString(trabajador, "telefono");
      const empresaCiudad =
        getString(trabajador, "empresa_codciu") || getString(trabajador, "codciu");
      if (nit) {
        form.value.solicitante.nit = nit || form.value.solicitante.nit;
        form.value.solicitante.razon_social = razonSocial || form.value.solicitante.razon_social;
        form.value.informacion_laboral.empresa_razon_social =
          razonSocial || form.value.informacion_laboral.empresa_razon_social;
        form.value.informacion_laboral.empresa_nit =
          nit || form.value.informacion_laboral.empresa_nit;
        form.value.informacion_laboral.empresa_telefono =
          empresaTelefono || form.value.informacion_laboral.empresa_telefono;
        form.value.informacion_laboral.empresa_direccion =
          empresaDireccion || form.value.informacion_laboral.empresa_direccion;
        form.value.informacion_laboral.empresa_ciudad =
          empresaCiudad || form.value.informacion_laboral.empresa_ciudad;
        form.value.informacion_laboral.cargo =
          getString(trabajador, "cargo") || form.value.informacion_laboral.cargo;
        form.value.informacion_laboral.fecha_ingreso =
          getString(trabajador, "fecafi") ||
          getString(trabajador, "fecha_afiliacion") ||
          getString(trabajador, "fecha_ingreso") ||
          form.value.informacion_laboral.fecha_ingreso;
        form.value.informacion_laboral.tiempo_servicio =
          typeof trabajador.antiguedad_meses === "number" ? trabajador.antiguedad_meses : 1;
        form.value.informacion_laboral.tiempo_servicio_unidad =
          (getString(trabajador, "tiempo_servicio_unidad") as TiempoServicioUnidad) ||
          form.value.informacion_laboral.tiempo_servicio_unidad ||
          "anios";
        form.value.informacion_laboral.tipo_contrato =
          getString(trabajador, "tipcon") || form.value.informacion_laboral.tipo_contrato;
        form.value.informacion_laboral.nombre_pagador =
          getString(trabajador, "repleg") ||
          getString(trabajador, "empresa_repleg") ||
          form.value.informacion_laboral.nombre_pagador;
      }

      if (typeof trabajador.salario === "number") {
        form.value.ingresos_descuentos.salario_basico_mensual = trabajador.salario;
        form.value.ingresos_descuentos.salud_pension = Math.round(trabajador.salario * 0.08);
      }

      const auxilioTransporte = getConfigurationAsNumber("auxilio_transporte", 0);
      if (auxilioTransporte > 0) {
        form.value.ingresos_descuentos.subsidio_transporte = auxilioTransporte;
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

  const guardarSolicitud = async (payloadForm: SolicitudCreditoPayload): Promise<boolean> => {
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
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data !== null &&
        "error" in error.data &&
        typeof error.data.error === "string"
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
