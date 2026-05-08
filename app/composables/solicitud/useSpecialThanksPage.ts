import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePDFGenerator } from "./usePDFGenerator";

export const useSpecialThanksPage = () => {
  const route = useRoute();
  const router = useRouter();

  const solicitudId = computed(() => route.params.id as string);

  const {
    loading: pdfLoading,
    error: pdfError,
    tienePDF,
    estadoPdf,
    verificarEstadoPDF,
    visualizarPDF,
    descargarPDF,
  } = usePDFGenerator();

  const mostrarAlerta = ref(false);
  const mensajeAlerta = ref("");

  // Fecha actual formateada
  const fechaEnvio = computed(() => {
    return new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  // Estados para el timeline
  const estadosTimeline = computed(() => [
    {
      id: "POSTULADO",
      nombre: "Postulado",
      descripcion: "Solicitud recién creada y postulada",
    },
    {
      id: "DOCUMENTOS_CARGADOS",
      nombre: "Documentos cargados",
      descripcion: "Todos los documentos han sido cargados y validados",
    },
    {
      id: "ENVIADO_VALIDACION",
      nombre: "Enviado para validación",
      descripcion: "Enviado para validación de asesores",
    },
    {
      id: "PENDIENTE_FIRMADO",
      nombre: "Pendiente de firmado",
      descripcion: "Solicitud en proceso de firmado",
    },
    {
      id: "ENVIADO_PENDIENTE_APROBACION",
      nombre: "Enviado para aprobación",
      descripcion: "Solicitud enviada y pendiente de aprobación",
    },
    {
      id: "APROBADO",
      nombre: "Aprobado",
      descripcion: "Solicitud aprobada y lista para desembolso",
    },
  ]);

  const handleVisualizarPDF = async () => {
    mostrarAlerta.value = false;

    const disponible = await verificarEstadoPDF(solicitudId.value);

    if (!disponible) {
      mensajeAlerta.value =
        "El PDF aún no está disponible. Por favor espere un momento e intente nuevamente.";
      mostrarAlerta.value = true;
      return;
    }

    const visualizado = await visualizarPDF(solicitudId.value);

    if (!visualizado && pdfError.value) {
      mensajeAlerta.value = pdfError.value;
      mostrarAlerta.value = true;
    }
  };

  const handleDescargarPDF = async () => {
    mostrarAlerta.value = false;

    const disponible = await verificarEstadoPDF(solicitudId.value);

    if (!disponible) {
      mensajeAlerta.value =
        "El PDF aún no está disponible. Por favor espere un momento e intente nuevamente.";
      mostrarAlerta.value = true;
      return;
    }

    const descargado = await descargarPDF(solicitudId.value);

    if (!descargado && pdfError.value) {
      mensajeAlerta.value = pdfError.value;
      mostrarAlerta.value = true;
    }
  };

  const irAlInicio = () => {
    router.push("/dash");
  };

  // Cargar estado del PDF al montar el componente
  onMounted(async () => {
    await verificarEstadoPDF(solicitudId.value);
  });

  return {
    // Estado y datos
    solicitudId,
    mostrarAlerta,
    mensajeAlerta,
    fechaEnvio,
    estadosTimeline,

    // Estado del PDF
    pdfLoading,
    pdfError,
    tienePDF,
    estadoPdf,

    // Funciones
    handleVisualizarPDF,
    handleDescargarPDF,
    irAlInicio,
    verificarEstadoPDF,
  };
};
