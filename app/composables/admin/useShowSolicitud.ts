import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "~/composables/useApi";
import { useSession } from "~/composables/useSession";

export function useShowSolicitud() {
  const route = useRoute();
  const router = useRouter();
  const { getJson, postJson, urlFor } = useApi();
  const { ready, authHeader } = useSession();

  const solicitudId = route.params.id as string;
  const solicitud = ref<SolicitudCredito | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const loadingFirmado = ref(false);

  // Funciones de utilidad
  const fmtMoney = (value: number | undefined) => {
    if (!value) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(value);
  };

  const fmtDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const estadoBadgeClass = (estado: string) => {
    const classes: Record<string, string> = {
      "Postulado": "bg-gray-100 text-gray-700",
      "Documentos cargados": "bg-yellow-100 text-yellow-700",
      "Firmado": "bg-green-100 text-green-700",
      "Aprobado": "bg-emerald-100 text-emerald-700",
      "Rechazado": "bg-red-100 text-red-700"
    };
    return classes[estado] || "bg-gray-100 text-gray-700";
  };

  const estadoProgressPercent = (estado: string) => {
    const estados = ["Postulado", "Documentos cargados", "Firmado", "Aprobado"];
    const index = estados.indexOf(estado);
    return index >= 0 ? ((index + 1) / estados.length) * 100 : 0;
  };

  const getTipoIdentificacion = (tipo: string | undefined) => {
    const tipos: Record<string, string> = {
      1: "Cédula de Ciudadanía",
      2: "Cédula de Extranjería",
      3: "Tarjeta de Identidad",
      4: "Pasaporte"
    };
    return tipo ? tipos[tipo] || tipo : "";
  };

  const getCargoDescripcion = (cargo: string | undefined) => {
    const cargos: Record<string, string> = {
      2519: "Profesional",
      2520: "Técnico",
      2521: "Auxiliar",
      2522: "Operativo"
    };
    return cargo ? cargos[cargo] || cargo : "";
  };

  const getCiudadDescripcion = (ciudad: string | undefined) => {
    const ciudades: Record<string, string> = {
      "18001": "Florencia - Caquetá",
      "73001": "Bogotá D.C.",
      "76001": "Cali - Valle del Cauca",
      "05001": "Medellín - Antioquia",
      "11001": "Bucaramanga - Santander",
      "13001": "Cartagena - Bolívar",
      "20001": "Valledupar - Cesar",
      "27001": "Cúcuta - Norte de Santander",
      "41001": "Neiva - Huila",
      "44001": "Ibagué - Tolima",
      "47001": "Villavicencio - Meta",
      "50001": "Pasto - Nariño",
      "52001": "Cúcuta - Norte de Santander",
      "54001": "Armenia - Quindío",
      "66001": "Pereira - Risaralda",
      "68001": "Manizales - Caldas",
      "70001": "Popayán - Cauca",
      "77001": "Sincelejo - Sucre",
      "78001": "Montería - Córdoba",
      "80001": "Barranquilla - Atlántico",
      "85001": "Santa Marta - Magdalena"
    };
    return ciudad ? ciudades[ciudad] || ciudad : "";
  };

  const getTipoVivienda = (tipo: string | undefined) => {
    const tipos: Record<string, string> = {
      propia: "Propia",
      arrendada: "Arrendada",
      familiar: "Casa de familiar",
      otra: "Otra"
    };
    return tipo ? tipos[tipo] || tipo : "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDocumentoNombre = (documento: {
    nombre_original?: unknown
    id?: unknown
  }): string => {
    if (
      typeof documento?.nombre_original === "string"
      && documento.nombre_original.trim()
    ) {
      return documento.nombre_original;
    }

    if (typeof documento?.id === "string" && documento.id.trim()) {
      return documento.id;
    }

    return "documento";
  };

  // Funciones de manejo de documentos
  const descargarDocumento = async (documento: unknown) => {
    try {
      const docId = typeof documento === "object" && documento !== null && "id" in documento
        ? String((documento as Record<string, unknown>).id)
        : "";
      const docFilename = typeof documento === "object" && documento !== null && "saved_filename" in documento
        ? String((documento as Record<string, unknown>).saved_filename)
        : "";
      const path = urlFor(
        `/api/solicitudes/${solicitudId}/documentos/${docId}/descargar`
      );
      const headers: Record<string, string> = {
        ...(authHeader.value as Record<string, string>)
      };

      const res = await fetch(path, { method: "GET", headers });
      if (!res.ok) {
        throw new Error(`No se pudo obtener el archivo (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = objectUrl;
      a.download = getDocumentoNombre({ nombre_original: docFilename });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error al descargar documento:", error);
    }
  };

  // Eliminar documento
  const eliminarDocumento = async (documento: unknown): Promise<boolean> => {
    try {
      const docId = typeof documento === "object" && documento !== null && "id" in documento
        ? String((documento as Record<string, unknown>).id)
        : "";

      if (!docId) {
        console.error("No se pudo obtener el ID del documento");
        return false;
      }

      const response = await $fetch<{
        success: boolean
        message?: string
      }>(`/api/solicitudes/${solicitudId}/documentos/${docId}/delete`, {
        method: "DELETE",
        headers: {
          ...(authHeader.value as Record<string, string>)
        }
      });

      if (response?.success) {
        // Recargar la solicitud para actualizar la lista de documentos
        await cargarSolicitud();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      return false;
    }
  };

  // Función principal de carga
  const cargarSolicitud = async () => {
    loading.value = true;
    error.value = null;
    try {
      await ready;
      const response = await getJson<{
        success: boolean
        data: SolicitudCredito
      }>(`/api/admin/solicitudes/${solicitudId}`, { auth: true });
      solicitud.value = response.data;
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      error.value = message || "No se pudo cargar la información de la solicitud.";
    } finally {
      loading.value = false;
    }
  };

  // Estados del timeline
  const estadosTimeline = ref([
    {
      id: "POSTULADO",
      nombre: "Postulado",
      descripcion: "Solicitud creada y registrada en el sistema"
    },
    {
      id: "DOCUMENTOS_CARGADOS",
      nombre: "Documentos cargados",
      descripcion: "Documentación requerida adjuntada"
    },
    {
      id: "ENVIADO_VALIDACION",
      nombre: "Enviado para validación",
      descripcion: "En proceso de revisión por asesores"
    },
    {
      id: "APROBADA",
      nombre: "Aprobada",
      descripcion: "Crédito aprobado"
    },
    {
      id: "PENDIENTE_FIRMADO",
      nombre: "Pendiente de firmado",
      descripcion: "Esperando firma digital del documento"
    },
    {
      id: "FIRMADO",
      nombre: "Firmado",
      descripcion: "Documento firmado digitalmente"
    },
    {
      id: "ENVIADO_PENDIENTE_APROBACION",
      nombre: "Enviado (pendiente de aprobación)",
      descripcion: "Solicitud en evaluación final"
    },
    {
      id: "DESEMBOLSADO",
      nombre: "Desembolsado",
      descripcion: "Monto desembolsado al solicitante"
    }
  ]);

  // Función para iniciar proceso de firmado
  const iniciarFirmado = async () => {
    if (!solicitud.value) return;

    loadingFirmado.value = true;
    try {
      const response = await postJson<{
        success: boolean
        data: unknown
        message: string
      }>(`/api/solicitudes/${solicitudId}/iniciar-firmado`, {}, { auth: true });

      if (response.success) {
        await cargarSolicitud();
        return {
          success: true,
          message:
            response.message || "Proceso de firmado iniciado exitosamente"
        };
      } else {
        throw new Error(response.message || "Error al iniciar firmado");
      }
    } catch (e: unknown) {
      console.error("Error al iniciar firmado:", e);
      const message = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        message: message || "Error al iniciar el proceso de firmado"
      };
    } finally {
      loadingFirmado.value = false;
    }
  };

  // Navegación
  const goBack = () => {
    router.back();
  };

  const goToEdit = () => {
    router.push(`/admin/solicitudes/edit/${solicitudId}`);
  };

  // Cargar datos al montar
  onMounted(() => {
    cargarSolicitud();
  });

  return {
    // Estado
    solicitud,
    loading,
    error,
    solicitudId,
    loadingFirmado,
    estadosTimeline,

    // Funciones de utilidad
    fmtMoney,
    fmtDate,
    estadoBadgeClass,
    estadoProgressPercent,
    getTipoIdentificacion,
    getCargoDescripcion,
    getCiudadDescripcion,
    getTipoVivienda,
    formatFileSize,

    // Funciones de documentos
    descargarDocumento,
    eliminarDocumento,

    // Funciones de navegación
    goBack,
    goToEdit,

    // Función principal
    cargarSolicitud,

    // Funciones de firmado
    iniciarFirmado
  };
}
