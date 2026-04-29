import { computed } from "vue";

export const useSolicitanteStep = (props: SolocitanteProps) => {
  // Opciones para tipo persona
  const tiposPersonaOptions = computed(() => [
    { label: "Natural", value: "natural" },
    { label: "Jurídica", value: "juridica" },
  ]);

  // Convertir datos a formato SelectOption
  const tiposDocumentoOptions = computed(() =>
    (props.tiposDocumento || []).map((item) => ({
      label: item.detdoc,
      value: item.coddoc,
    })),
  );

  const ocupacionesOptions = computed(() =>
    (props.ocupaciones || []).map((item) => ({
      label: item.detalle,
      value: item.codocu,
    })),
  );

  const sexosOptions = computed(() =>
    (props.sexos || []).map((item) => ({
      label: item.detsex,
      value: item.codsex,
    })),
  );

  const nivelesEducativosOptions = computed(() =>
    (props.nivelesEducativos || []).map((item) => ({
      label: item.detalle,
      value: item.nivedu,
    })),
  );

  const tiposViviendaOptions = computed(() =>
    (props.tiposVivienda || []).map((item) => ({
      label: item.detalle,
      value: item.vivienda,
    })),
  );

  const estadoCivilesOptions = computed(() =>
    (props.estadoCiviles || []).map((item) => ({
      label: item.detest,
      value: item.estciv,
    })),
  );

  const ciudadesOptions = computed(() =>
    (props.ciudades || []).map((item) => ({
      label: item.detciu,
      value: item.codciu,
      description: `Código: ${item.codciu}`,
    })),
  );

  // Opciones para países (lista básica, puede ser expandida)
  const paisesOptions = computed(() => [
    { label: "Colombia", value: "CO" },
    { label: "Argentina", value: "AR" },
    { label: "Brasil", value: "BR" },
    { label: "Chile", value: "CL" },
    { label: "Ecuador", value: "EC" },
    { label: "Estados Unidos", value: "US" },
    { label: "España", value: "ES" },
    { label: "México", value: "MX" },
    { label: "Perú", value: "PE" },
    { label: "Venezuela", value: "VE" },
  ]);

  // Opciones para booleanos
  const booleanOptions = computed(() => [
    { label: "Sí", value: true },
    { label: "No", value: false },
  ]);

  // Opciones para tipo de contrato
  const tiposContratoOptions = computed(() => [
    { label: "Fijo", value: "fijo" },
    { label: "Término Indefinido", value: "termino_indefinido" },
    { label: "Tiempo Parcial", value: "tiempo_parcial" },
  ]);

  // Event handlers
  const handleCiudadChange = (option: SelectOption) => {
    console.log("Ciudad seleccionada:", option);
    // Aquí puedes agregar lógica adicional cuando se selecciona una ciudad
  };

  return {
    // Opciones para los selects
    tiposPersonaOptions,
    tiposDocumentoOptions,
    ocupacionesOptions,
    sexosOptions,
    nivelesEducativosOptions,
    tiposViviendaOptions,
    estadoCivilesOptions,
    ciudadesOptions,
    paisesOptions,
    booleanOptions,
    tiposContratoOptions,

    // Event handlers
    handleCiudadChange,
  };
};
