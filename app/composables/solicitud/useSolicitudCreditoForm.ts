import { watch } from "vue";

const STORAGE_KEY = "comfaca_credito_solicitud_form";

const createInitialSolicitudCreditoForm = (): SolicitudCreditoPayload => ({
  solicitud: {
    numero_solicitud: "",
    numero_comprobante: "",
    valor_solicitud: 0,
    categoria: "",
    rol_en_solicitud: "T",
    valor_solicitado: 0,
    cuota_mensual: 0,
    plazo_meses: 0,
    moneda: "COP",
    tipcre: "",
    modxml4: 0,
    detalle_modalidad: "",
    fecha_radicado: "",
    producto_tipo: "",
    ha_tenido_credito: false,
  },
  linea_credito: {
    detalle_modalidad: "",
    estado: "",
    estcre: 0,
    modxml4: 0,
    numero_cuotas: 0,
    pagseg: "",
    repdcr: "",
    tipcre: "",
    tipfin: "",
    tasa_interes: 0,
    total_intereses: 0,
    total_pagar: 0,
  },
  solicitante: {
    tipo_persona: "",
    tipo_documento: "1",
    numero_documento: "",
    nombres: "",
    apellidos: "",
    razon_social: "",
    nit: "",
    fecha_nacimiento: "",
    genero: "M",
    estado_civil: "",
    nivel_educativo: "universitario",
    profesion: "",
    email: "",
    telefono: "",
    celular: "",
    direccion: "",
    barrio: "",
    ciudad: "",
    departamento: "",
    cargo: "",
    salario: 0,
    antiguedad_meses: 0,
    tipo_contrato: "",
    sector_economico: "",
    codigo_categoria: "",
  },
  conyuge: undefined,
  informacion_laboral: {
    empresa_razon_social: "",
    empresa_nit: "",
    empresa_telefono: "",
    empresa_direccion: "",
    empresa_ciudad: "",
    cargo: "",
    fecha_ingreso: "",
    tipo_contrato: "",
    nombramiento_o_pagador: "",
    tiempo_servicio: 0,
    tiempo_servicio_unidad: "meses",
  },
  ingresos_descuentos: {
    moneda: "COP",
    salario_basico_mensual: 0,
    subsidio_transporte: 0,
    horas_extras: 0,
    comisiones: 0,
    otros_ingresos: 0,
    total_ingresos: 0,
    salud_pension: 0,
    libranzas_comfaca: 0,
    otras_libranzas: 0,
    judiciales: 0,
    otras_deducciones: 0,
    total_descuentos: 0,
    total_neto_recibido: 0,
  },
  informacion_economica: {
    moneda: "COP",
    arrendamientos: 0,
    otros: 0,
    descripcion: "",
    total_gastos: 0,
    gastos_descripcion: "",
    total_activos: 0,
    total_pasivos: 0,
  },
  propiedades: [],
  deudas: [],
  referencias: {
    familiares: [],
    personales: [],
  },
});

const cloneInitialSolicitudCreditoForm = (): SolicitudCreditoPayload => {
  return structuredClone(createInitialSolicitudCreditoForm());
};

export const useSolicitudCreditoForm = () => {
  const form = useState<SolicitudCreditoPayload>(
    "solicitudCreditoForm",
    cloneInitialSolicitudCreditoForm,
  );
  const hydrated = useState<boolean>(
    "solicitudCreditoFormHydrated",
    () => false,
  );
  const persistenceInitialized = useState<boolean>(
    "solicitudCreditoFormPersistenceInitialized",
    () => false,
  );

  const hydrate = () => {
    if (!process.client || hydrated.value) {
      return;
    }

    hydrated.value = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as SolicitudCreditoPayload;
      form.value = parsed;
    } catch (error) {
      console.error(
        "Error cargando formulario de solicitud desde storage:",
        error,
      );
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  hydrate();

  if (process.client && !persistenceInitialized.value) {
    watch(
      form,
      (value) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch (error) {
          console.error(
            "Error guardando formulario de solicitud en storage:",
            error,
          );
        }
      },
      { deep: true },
    );

    persistenceInitialized.value = true;
  }

  const clearPersistedForm = () => {
    if (!process.client) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  };

  const toggleConyuge = (checked: boolean) => {
    if (!checked) {
      form.value.conyuge = undefined;
      return;
    }

    form.value.conyuge = {
      identificacion: "",
      nombres_apellidos: "",
      ingresos_laborales: 0,
      trabaja: false,
      telefono_movil: "",
    };
  };

  const toggleEmpresaConyuge = (checked: boolean) => {
    if (!form.value.conyuge) {
      return;
    }

    if (!checked) {
      form.value.conyuge.empresa = undefined;
      return;
    }

    form.value.conyuge.empresa = {
      nombre: "",
      direccion: "",
      telefono: "",
      email: "",
    };
  };

  const autocalcularIngresos = () => {
    const ing = form.value.ingresos_descuentos;

    ing.total_ingresos =
      Number(ing.salario_basico_mensual || 0) +
      Number(ing.subsidio_transporte || 0) +
      Number(ing.horas_extras || 0) +
      Number(ing.comisiones || 0) +
      Number(ing.otros_ingresos || 0);

    ing.total_descuentos =
      Number(ing.salud_pension || 0) +
      Number(ing.libranzas_comfaca || 0) +
      Number(ing.otras_libranzas || 0) +
      Number(ing.judiciales || 0) +
      Number(ing.otras_deducciones || 0);

    ing.total_neto_recibido = Math.max(
      ing.total_ingresos - ing.total_descuentos,
      0,
    );
  };

  const addPropiedad = () => {
    form.value.propiedades.push({
      tipo_bien: "vivienda",
      descripcion: "",
      ciudad: "",
      matricula_inmobiliaria: "",
      valor_comercial: 0,
    });
  };

  const removePropiedad = (idx: number) => {
    form.value.propiedades.splice(idx, 1);
  };

  const addDeuda = () => {
    form.value.deudas.push({
      acreedor_nombre: "",
      concepto: "",
      valor_cuota: 0,
      saldo_obligacion: 0,
    });
  };

  const removeDeuda = (idx: number) => {
    form.value.deudas.splice(idx, 1);
  };

  const addReferencia = (kind: "familiares" | "personales") => {
    form.value.referencias[kind].push({ nombre_apellidos: "", celular: "" });
  };

  const removeReferencia = (kind: "familiares" | "personales", idx: number) => {
    form.value.referencias[kind].splice(idx, 1);
  };

  const reset = () => {
    form.value = cloneInitialSolicitudCreditoForm();
    clearPersistedForm();
  };

  return {
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
    clearPersistedForm,
  };
};
