import { ref, computed, onMounted } from "vue";
import { useApi } from "~/composables/useApi";

export function useAdminDashboard() {
  const { getJson } = useApi();

  // Estado
  const loading = ref(false);
  const error = ref("");
  const stats = ref<AdminStats>({
    totalSolicitudes: 0,
    solicitudesActivas: 0,
    conveniosActivos: 0,
    trabajadoresRegistrados: 0,
    solicitudesPendientesFirma: 0,
    tasaAprobacion: 0,
    montoTotalAprobado: 0,
    solicitudesPorEstado: [],
    actividadReciente: [],
    usuariosPorRol: [],
    topEmpresas: []
  });

  // Última actualización
  const lastUpdated = ref<Date | null>(null);

  // Función para cargar estadísticas de usuarios
  const cargarEstadisticasUsuarios = async () => {
    try {
      type UsuariosStatsResponse = {
        data: {
          trabajadores?: number
          usuariosPorRol?: Array<{ rol: string, count: number }>
        }
      };

      const response = await getJson<UsuariosStatsResponse>(
        "/api/admin/users/estadisticas",
        { auth: true }
      );
      const data = response.data;

      stats.value.trabajadoresRegistrados = data?.trabajadores ?? 0;
      stats.value.usuariosPorRol = data?.usuariosPorRol ?? [];
    } catch (e: unknown) {
      console.error("Error cargando estadísticas de usuarios:", e);
    }
  };

  // Función para cargar estadísticas de convenios
  const cargarEstadisticasConvenios = async () => {
    try {
      const response = await getJson<{ data: unknown }>(
        "/api/admin/empresas-convenios",
        { auth: true }
      );
      void response;
    } catch (e: unknown) {
      console.error("Error cargando estadísticas de convenios:", e);
    }
  };

  // Función para cargar estadísticas de solicitudes
  const cargarEstadisticasSolicitudes = async () => {
    try {
      type DashboardResponse = {
        data: {
          solicitudes?: {
            total?: number
            activas?: number
            activos?: number
            pendientesFirma?: number
            tasaAprobacion?: number
            montoTotalAprobado?: number
            porEstado?: Array<{
              estado: string
              count: string | number
              color: string
            }>
          }
          convenios?: {
            activos?: number
            topEmpresas?: Array<{
              razon_social: string
              nit: string
              numero_empleados: string
              tipo_empresa: string
            }>
          }
          usuarios?: {
            trabajadores?: number
            porRol?: Array<{ role: string, count: string | number }>
          }
          actividadReciente?: {
            solicitudesRecientes?: Array<{
              numero_solicitud: string
              estado: string
              created_at: string
              owner_username: string
            }>
            usuariosRecientes?: Array<{
              username: string
              created_at: string
              full_name: string
              roles: string[]
            }>
          }
        }
      };

      const response = await getJson<DashboardResponse>(
        "/api/admin/dashboard/estadisticas",
        { auth: true }
      );
      const data = response.data;

      const solicitudes = data?.solicitudes;
      stats.value.totalSolicitudes = solicitudes?.total ?? 0;
      stats.value.solicitudesActivas
        = solicitudes?.activos ?? solicitudes?.activas ?? 0;
      stats.value.solicitudesPendientesFirma
        = solicitudes?.pendientesFirma ?? 0;
      stats.value.tasaAprobacion = solicitudes?.tasaAprobacion ?? 0;
      stats.value.montoTotalAprobado = solicitudes?.montoTotalAprobado ?? 0;
      stats.value.solicitudesPorEstado
        = solicitudes?.porEstado?.map(e => ({
          estado: e.estado,
          count: Number(e.count),
          color: e.color
        })) ?? [];

      const convenios = data?.convenios;
      // Backend devuelve `activos` como string (Prisma: String(count)); normalizar a number
      stats.value.conveniosActivos = Number(convenios?.activos ?? 0) || 0;
      stats.value.topEmpresas
        = convenios?.topEmpresas?.map(e => ({
          nombre: e.razon_social,
          convenio: e.tipo_empresa,
          trabajadores: Number(e.numero_empleados)
        })) ?? [];

      const usuarios = data?.usuarios;
      if (usuarios) {
        // `trabajadores` viene como string desde porRol[].count; normalizar
        const parsedTrabajadores = Number(usuarios.trabajadores ?? 0);
        stats.value.trabajadoresRegistrados
          = Number.isFinite(parsedTrabajadores) && parsedTrabajadores > 0
            ? parsedTrabajadores
            : stats.value.trabajadoresRegistrados;
        stats.value.usuariosPorRol
          = usuarios.porRol?.map(r => ({
            rol: r.role,
            count: Number(r.count)
          })) ?? stats.value.usuariosPorRol;
      }

      // Transformar actividadReciente al formato esperado por el frontend
      const actividades: Array<{
        id: string
        tipo: string
        descripcion: string
        fecha: string
      }> = [];

      if (data?.actividadReciente?.solicitudesRecientes) {
        data.actividadReciente.solicitudesRecientes.forEach((s) => {
          actividades.push({
            id: s.numero_solicitud,
            tipo: "solicitud",
            descripcion: `Nueva solicitud ${s.numero_solicitud} - Estado: ${s.estado}`,
            fecha: s.created_at || new Date().toISOString()
          });
        });
      }

      if (data?.actividadReciente?.usuariosRecientes) {
        data.actividadReciente.usuariosRecientes.forEach((u) => {
          actividades.push({
            id: u.username,
            tipo: "usuario",
            descripcion: `Nuevo usuario registrado: ${u.full_name}`,
            fecha: u.created_at
          });
        });
      }

      // Ordenar por fecha descendente
      actividades.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      stats.value.actividadReciente = actividades;
    } catch (e: unknown) {
      console.error("Error cargando estadísticas de solicitudes:", e);
      throw e;
    }
  };

  // Función principal para cargar todas las estadísticas
  const cargarEstadisticas = async () => {
    if (loading.value) return;

    loading.value = true;
    error.value = "";

    try {
      await cargarEstadisticasSolicitudes();

      lastUpdated.value = new Date();
    } catch (e: unknown) {
      error.value
        = e instanceof Error ? e.message : "Error al cargar las estadísticas";
      console.error("Error en cargarEstadisticas:", e);
    } finally {
      loading.value = false;
    }
  };

  // Refrescar estadísticas
  const refrescarEstadisticas = async () => {
    await cargarEstadisticas();
  };

  // Computed properties para facilitar el uso
  const tieneDatos = computed(
    () =>
      stats.value.totalSolicitudes > 0
      || stats.value.conveniosActivos > 0
      || stats.value.trabajadoresRegistrados > 0
  );

  const tiempoSinActualizar = computed(() => {
    if (!lastUpdated.value) return null;
    const ahora = new Date();
    const diffMinutos = Math.floor(
      (ahora.getTime() - lastUpdated.value.getTime()) / (1000 * 60)
    );

    if (diffMinutos < 1) return "Actualizado ahora";
    if (diffMinutos < 60) return `Actualizado hace ${diffMinutos} min`;

    const diffHoras = Math.floor(diffMinutos / 60);
    if (diffHoras < 24) return `Actualizado hace ${diffHoras} h`;

    const diffDias = Math.floor(diffHoras / 24);
    return `Actualizado hace ${diffDias} días`;
  });

  // Total de usuarios para la gráfica
  const totalUsuarios = computed(() => {
    return stats.value.usuariosPorRol.reduce((sum, rol) => sum + rol.count, 0);
  });

  // Inicializar
  onMounted(async () => {
    await cargarEstadisticas();
  });

  return {
    // Estado
    loading,
    error,
    stats,
    lastUpdated,
    tieneDatos,
    tiempoSinActualizar,

    // Acciones
    cargarEstadisticas,
    refrescarEstadisticas,
    totalUsuarios,
    cargarEstadisticasUsuarios,
    cargarEstadisticasConvenios
  };
}
