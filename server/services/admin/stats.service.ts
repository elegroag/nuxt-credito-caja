import prisma from "~~/lib/prisma";
import type { H3Event } from "h3";

interface SolicitudPorMesRaw {
  mes: string
  count: bigint
}

interface _SolicitudPorEstado {
  estado: string
  nombre: string
  count: string
  color: string
}

interface EmpresaTop {
  razon_social: string
  nit: bigint
  numero_empleados: number | null
  tipo_empresa: string | null
}

interface _EmpresaPorTipo {
  tipo_empresa: string
  count: bigint
}

interface _UserWithRoles {
  roles: string[]
}

interface EstadoSolicitud {
  id: string
  nombre: string
  color: string
}

// Estados terminales/rechazados: NO cuentan como "solicitudes activas".
// Una solicitud activa es toda aquella que sigue en el flujo de validación/aprobación
// (POSTULADO → DOCUMENTOS_CARGADOS → ENVIADO_VALIDACION → ... → APROBADA).
const ESTADOS_NO_ACTIVOS = [
  "RECHAZADA",
  "DESESTIMADA",
  "CANCELADA",
  "DESISTE"
] as const

interface _PorEstadoResult {
  estado: string
  nombre: string
  count: string
  color: string
}

const statsAdminDashboard = (_event: H3Event) => {
  const statsSolicitudes = async () => {
    const aprobadas = await prisma.solicitudes_credito.count({
      where: {
        estado: "APROBADA"
      }
    });

    const activas = await prisma.solicitudes_credito.count({
      where: {
        estado: {
          notIn: [...ESTADOS_NO_ACTIVOS]
        }
      }
    });

    const pendientesFirma = await prisma.solicitudes_credito.count({
      where: {
        estado: "PENDIENTE_FIRMADO"
      }
    });

    const montoAprobado = await prisma.solicitudes_credito.aggregate({
      _sum: {
        valor_solicitud: true
      },
      where: {
        estado: "APROBADA"
      }
    });

    const total = await prisma.solicitudes_credito.count();

    const tasaAprobacion = total > 0 ? (aprobadas / total) * 100 : 0;

    // Obtener todos los estados de la tabla estados_solicitud
    const estados = await prisma.estados_solicitud.findMany({
      where: {
        activo: true
      },
      orderBy: {
        orden: "asc"
      }
    });

    // Contar solicitudes por cada estado
    const solicitudesPorEstado = await Promise.all(
      estados.map(async (estado: EstadoSolicitud) => {
        const count = await prisma.solicitudes_credito.count({
          where: {
            estado: estado.id
          }
        });

        return {
          estado: estado.id,
          nombre: estado.nombre,
          count: String(count),
          color: estado.color
        };
      })
    );

    const solicitudesPorMesRaw = await prisma.$queryRaw`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as mes,
        COUNT(*) as count
      FROM solicitudes_credito
      WHERE created_at >= ${new Date(new Date().setMonth(new Date().getMonth() - 6))}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY mes ASC
    `;

    const solicitudesPorMes = (solicitudesPorMesRaw as SolicitudPorMesRaw[]).map(
      (item: SolicitudPorMesRaw) => ({
        mes: item.mes,
        nombre: new Date(item.mes + "-01").toLocaleString("es-ES", {
          month: "long",
          year: "numeric"
        }),
        count: Number(item.count)
      })
    );

    const montoTotalAprobado = montoAprobado["_sum"].valor_solicitud;

    return {
      total,
      aprobadas,
      activas,
      pendientesFirma,
      montoTotalAprobado,
      tasaAprobacion,
      porEstado: solicitudesPorEstado,
      porMes: solicitudesPorMes
    };
  };

  const statsConvenios = async () => {
    const activos = await prisma.empresas_convenio.count({
      where: {
        estado: "Activo"
      }
    });

    const totalEmpresasRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT nit) as count
      FROM empresas_convenio
    `;
    const totalEmpresas = Number(totalEmpresasRaw[0]?.count || 0);

    const topEmpresas = await prisma.empresas_convenio.findMany({
      take: 5,
      orderBy: {
        numero_empleados: "desc"
      },
      select: {
        razon_social: true,
        nit: true,
        numero_empleados: true,
        tipo_empresa: true
      }
    });

    const porTipo = await prisma.empresas_convenio.groupBy({
      by: ["tipo_empresa"],
      _count: {
        id: true
      }
    });

    return {
      activos: String(activos),
      totalEmpresas: String(totalEmpresas),
      topEmpresas: topEmpresas.map((empresa: EmpresaTop) => ({
        razon_social: empresa.razon_social,
        nit: String(empresa.nit),
        numero_empleados: String(empresa.numero_empleados),
        tipo_empresa: empresa.tipo_empresa
      })),
      porTipo: porTipo.map((tipo) => ({
        tipo_empresa: tipo.tipo_empresa,
        count: String(tipo._count.id)
      }))
    };
  };

  const statsUsuarios = async () => {
    const total = await prisma.users.count();

    const activos = await prisma.users.count({
      where: {
        disabled: false
      }
    });

    const users = await prisma.users.findMany({
      select: {
        roles: true
      }
    });

    // Aplanar roles y contar cada rol individualmente
    const roleCounts: Record<string, number> = {};
    users.forEach((user) => {
      const roles = (user.roles as string[]) || [];
      roles.forEach((role) => {
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
    });

    const porRol = Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count: String(count)
    }));

    // Usuarios nuevos en últimos 30 días
    const recientes = await prisma.users.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const trabajadores = porRol?.find(
      rol => rol.role === "user_trabajador"
    )?.count;

    return {
      total,
      activos,
      porRol,
      recientes,
      trabajadores
    };
  };

  const actividadReciente = async () => {
    const solicitudesRecientes = await prisma.solicitudes_credito.findMany({
      take: 5,
      orderBy: {
        created_at: "desc"
      },
      select: {
        numero_solicitud: true,
        estado: true,
        created_at: true,
        owner_username: true
      }
    });

    const usuariosRecientes = await prisma.users.findMany({
      take: 5,
      orderBy: {
        created_at: "desc"
      },
      select: {
        username: true,
        created_at: true,
        roles: true,
        numero_documento: true,
        full_name: true
      }
    });

    return {
      solicitudesRecientes,
      usuariosRecientes
    };
  };

  return {
    solicitudes: statsSolicitudes,
    convenios: statsConvenios,
    usuarios: statsUsuarios,
    actividadReciente: actividadReciente
  };
};

export default statsAdminDashboard;
