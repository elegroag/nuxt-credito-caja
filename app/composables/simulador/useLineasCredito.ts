export const useLineasCredito = () => {
  const { getJson } = useApi();
  const { clearSolicitudData } = useSimuladorStorage();

  const loading = ref(true);
  const error = ref<string | null>(null);
  const lineasCredito = ref<LineaCreditoSimuladorType[]>([]);

  // Mapeo de modalidades con iconos
  const modalidadesMap: Record<
    number,
    { nombre: string, descripcion: string, icono: string }
  > = {
    1: {
      nombre: "Crédito Libre Inversión",
      descripcion: "Flexibilidad total para usar los fondos como necesites",
      icono: "lucide:banknote"
    },
    2: {
      nombre: "Consumo de Bienes y Servicios",
      descripcion: "Financia la compra de bienes y servicios para tu hogar",
      icono: "lucide:shopping-cart"
    },
    3: {
      nombre: "Créditos Educativos",
      descripcion: "Invierte en tu educación y desarrollo profesional",
      icono: "lucide:graduation-cap"
    },
    4: {
      nombre: "Créditos de Salud",
      descripcion: "Cuida tu salud y la de tu familia",
      icono: "lucide:heart"
    },
    5: {
      nombre: "Créditos de Vivienda",
      descripcion: "Cumple el sueño de tener tu propia vivienda",
      icono: "lucide:home"
    },
    6: {
      nombre: "Fomento y Emprendimiento Empresarial",
      descripcion: "Impulsa tu negocio o proyecto empresarial",
      icono: "lucide:briefcase"
    },
    7: {
      nombre: "Otros Créditos",
      descripcion: "Soluciones de crédito para diferentes necesidades",
      icono: "lucide:more-horizontal"
    },
    8: {
      nombre: "Crédito de Mercadeo",
      descripcion: "Financia tus actividades de mercadeo y ventas",
      icono: "lucide:trending-up"
    },
    9: {
      nombre: "Recreación y Turismo",
      descripcion: "Disfruta de tus momentos de ocio y viajes",
      icono: "lucide:plane"
    }
  };

  const modalidadesAgrupadas = computed<Modalidad[]>(() => {
    const agrupadas: Record<number, LineaCreditoSimuladorType[]> = [];

    // Agrupar líneas por modalidad
    if (lineasCredito.value && Array.isArray(lineasCredito.value)) {
      lineasCredito.value.forEach((linea) => {
        if (linea && typeof linea.modxml4 === "number") {
          const modxml4Key = linea.modxml4;
          if (!agrupadas[modxml4Key]) {
            agrupadas[modxml4Key] = [];
          }
          agrupadas[modxml4Key].push(linea);
        }
      });
    }

    // Convertir a array y ordenar
    return Object.entries(agrupadas)
      .map(([modxml4, lineas]) => {
        const modalidadInfo = modalidadesMap[parseInt(modxml4)] || {
          nombre: `Modalidad ${modxml4}`,
          descripcion: "Líneas de crédito disponibles",
          icono: "lucide:help-circle"
        };

        return {
          modxml4: parseInt(modxml4),
          ...modalidadInfo,
          lineas: lineas.sort((a, b) => a.detalle.localeCompare(b.detalle))
        };
      })
      .sort((a, b) => a.modxml4 - b.modxml4);
  });

  const fetchLineasCredito = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await getJson<{
        success: boolean
        message: string
        data: LineaCreditoSimuladorType[]
      }>("/api/lineas_credito/tipo-creditos", { auth: true });

      if (response.success) {
        // filtra las lineas en estado ='A'
        lineasCredito.value = response.data.filter(
          linea => linea.estado === "A"
        );
      } else {
        error.value
          = response.message || "Error al cargar las líneas de crédito";
      }
    } catch (err) {
      console.error("Error fetching lineas credito:", err);
      error.value
        = "No se pudieron cargar las líneas de crédito. Por favor, intenta nuevamente.";
    } finally {
      loading.value = false;
    }
  };

  const seleccionarLinea = (linea: LineaCreditoSimuladorType) => {
    console.log("Línea seleccionada:", linea);
    // Aquí puedes agregar lógica adicional al seleccionar una línea
  };

  const simularLinea = (linea: LineaCreditoSimuladorType) => {
    clearSolicitudData();
    navigateTo(`/dash/simulador/${linea.tipcre}`);
  };

  const fmt = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Cargar datos al montar el componente
  onMounted(() => {
    fetchLineasCredito();
  });

  return {
    loading: readonly(loading),
    error: readonly(error),
    lineasCredito: readonly(lineasCredito),
    modalidadesAgrupadas,
    fetchLineasCredito,
    seleccionarLinea,
    simularLinea,
    fmt
  };
};
