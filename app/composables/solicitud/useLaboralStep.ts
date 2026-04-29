import { computed } from "vue";

export const useLaboralStep = (props: LaboralProps) => {
  // Opciones para unidades de tiempo
  const tiempoUnidadOptions: SelectOption[] = [
    { label: "Meses", value: "meses" },
    { label: "Años", value: "anios" },
  ];

  // Convertir ocupaciones a formato SelectOption
  const cargosOptions = computed(() =>
    (props.ocupaciones || []).map((item) => ({
      label: item.detalle,
      value: item.codocu,
    })),
  );

  // Convertir ciudades a formato SelectOption
  const ciudadesOptions = computed(() =>
    (props.ciudades || []).map((item) => ({
      label: item.detciu,
      value: item.codciu,
    })),
  );

  // Convertir tipos de contrato a formato SelectOption
  const tiposContratoOptions = computed(() =>
    (props.tiposContrato || []).map((item) => ({
      label: item.detalle,
      value: item.tipcon,
    })),
  );

  return {
    // Opciones para los selects
    tiempoUnidadOptions,
    cargosOptions,
    ciudadesOptions,
    tiposContratoOptions,
  };
};
