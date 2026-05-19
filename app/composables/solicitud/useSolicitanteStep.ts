import { computed } from "vue";

export const useSolicitanteStep = (props: SolicitanteProps) => {
  // Opciones para tipo persona
  const tiposPersonaOptions = computed(() => [
    { label: "Natural", value: "natural" },
    { label: "Jurídica", value: "juridica" }
  ]);

  // Convertir datos a formato SelectOption
  const tiposDocumentoOptions = computed(() =>
    (props.tiposDocumento || []).map((item) => ({
      label: item.detdoc,
      value: item.coddoc
    }))
  );

  const ocupacionesOptions = computed(() =>
    (props.ocupaciones || []).map((item) => ({
      label: item.detalle,
      value: item.codocu
    }))
  );

  const sexosOptions = computed(() =>
    (props.sexos || []).map((item) => ({
      label: item.detsex,
      value: item.codsex
    }))
  );

  const nivelesEducativosOptions = computed(() =>
    (props.nivelesEducativos || []).map((item) => ({
      label: item.detalle,
      value: item.nivedu
    }))
  );

  const tiposViviendaOptions = computed(() =>
    (props.tiposVivienda || []).map((item) => ({
      label: item.detalle,
      value: item.vivienda
    }))
  );

  const estadoCivilesOptions = computed(() =>
    (props.estadoCiviles || []).map((item) => ({
      label: item.detest,
      value: item.estciv
    }))
  );

  const sectoresEconomicosOptions = computed(() =>
    (props.sectoresEconomicos || []).map((item) => ({
      label: item.detalle,
      value: item.sector
    }))
  );

  const ciudadesOptions = computed(() =>
    (props.ciudades || [])
      .filter((item) => item.codciu && item.codciu.trim() !== "")
      .map((item) => ({
        label: item.detciu,
        value: item.codciu,
        description: `Código: ${item.codciu}`
      }))
  );

  // Opciones para países desde el API
  const paisesOptions = computed(() =>
    (props.paises || []).map((item) => ({
      label: item.nombre,
      value: item.cod1,
      description: `Código: ${item.cod1}`
    }))
  );

  // Opciones para booleanos
  const booleanOptions = computed(() => [
    { label: "Sí", value: true },
    { label: "No", value: false }
  ]);

  // Opciones para tipo de contrato
  const tiposContratoOptions = computed(() => [
    { label: "Fijo", value: "F" },
    { label: "Término Indefinido", value: "I" }
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
    sectoresEconomicosOptions,
    ciudadesOptions,
    paisesOptions,
    booleanOptions,
    tiposContratoOptions,

    // Event handlers
    handleCiudadChange
  };
};
