import prisma from "~~/lib/prisma";

const solicitudService = () => {
  const getSolicitudesByUser = async (
    username: string,
    limit: number = 20,
    offset: number = 0,
  ) => {
    const solicitudes = await prisma.solicitudes_credito.findMany({
      where: {
        owner_username: username,
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip: offset,
      include: {
        estados_solicitud: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
      },
    });

    const total = await prisma.solicitudes_credito.count({
      where: {
        owner_username: username,
      },
    });

    return {
      data: solicitudes.map((solicitud: any) => ({
        numero_solicitud: solicitud.numero_solicitud,
        owner_username: solicitud.owner_username,
        valor_solicitud: String(solicitud.valor_solicitud),
        plazo_meses: solicitud.plazo_meses,
        tasa_interes: String(solicitud.tasa_interes),
        estado: solicitud.estado,
        estado_info: solicitud.estados_solicitud,
        fecha_radicado: solicitud.fecha_radicado?.toISOString() || null,
        producto_tipo: solicitud.producto_tipo,
        ha_tenido_credito: solicitud.ha_tenido_credito,
        detalle_modalidad: solicitud.detalle_modalidad,
        tipo_credito: solicitud.tipo_credito,
        moneda: solicitud.moneda,
        cuota_mensual: solicitud.cuota_mensual
          ? String(solicitud.cuota_mensual)
          : null,
        created_at: solicitud.created_at?.toISOString() || null,
        updated_at: solicitud.updated_at?.toISOString() || null,
      })),
      total: String(total),
      limit: String(limit),
      offset: String(offset),
    };
  };

  const getSolicitudById = async (id: string) => {
    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: {
        numero_solicitud: id,
      },
      include: {
        estados_solicitud: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
        users: {
          select: {
            username: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!solicitud) {
      return null;
    }

    return {
      numero_solicitud: solicitud.numero_solicitud,
      owner_username: solicitud.owner_username,
      valor_solicitud: String(solicitud.valor_solicitud),
      plazo_meses: solicitud.plazo_meses,
      tasa_interes: String(solicitud.tasa_interes),
      estado: solicitud.estado,
      estado_info: solicitud.estados_solicitud,
      fecha_radicado: solicitud.fecha_radicado?.toISOString() || null,
      producto_tipo: solicitud.producto_tipo,
      ha_tenido_credito: solicitud.ha_tenido_credito,
      detalle_modalidad: solicitud.detalle_modalidad,
      tipo_credito: solicitud.tipo_credito,
      moneda: solicitud.moneda,
      cuota_mensual: solicitud.cuota_mensual
        ? String(solicitud.cuota_mensual)
        : null,
      created_at: solicitud.created_at?.toISOString() || null,
      updated_at: solicitud.updated_at?.toISOString() || null,
      user: solicitud.users,
    };
  };

  const getAllSolicitudes = async (limit: number = 20, offset: number = 0) => {
    const solicitudes = await prisma.solicitudes_credito.findMany({
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip: offset,
      include: {
        estados_solicitud: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
        users: {
          select: {
            username: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.solicitudes_credito.count();

    return {
      data: solicitudes.map((solicitud: any) => ({
        numero_solicitud: solicitud.numero_solicitud,
        owner_username: solicitud.owner_username,
        valor_solicitud: String(solicitud.valor_solicitud),
        plazo_meses: solicitud.plazo_meses,
        tasa_interes: String(solicitud.tasa_interes),
        estado: solicitud.estado,
        estado_info: solicitud.estados_solicitud,
        fecha_radicado: solicitud.fecha_radicado?.toISOString() || null,
        producto_tipo: solicitud.producto_tipo,
        ha_tenido_credito: solicitud.ha_tenido_credito,
        detalle_modalidad: solicitud.detalle_modalidad,
        tipo_credito: solicitud.tipo_credito,
        moneda: solicitud.moneda,
        cuota_mensual: solicitud.cuota_mensual
          ? String(solicitud.cuota_mensual)
          : null,
        created_at: solicitud.created_at?.toISOString() || null,
        updated_at: solicitud.updated_at?.toISOString() || null,
        user: solicitud.users,
      })),
      total: String(total),
      limit: String(limit),
      offset: String(offset),
    };
  };

  const getSolicitudesPaginadas = async (params: {
    limit: number;
    skip: number;
    estado?: string;
  }) => {
    const { limit, skip, estado } = params;

    const where: any = {};

    if (estado && estado !== "@") {
      where.estado = estado;
    }

    const [solicitudes, total] = await Promise.all([
      prisma.solicitudes_credito.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        skip: skip,
        include: {
          estados_solicitud: {
            select: {
              id: true,
              nombre: true,
              color: true,
            },
          },
          solicitud_solicitante: {
            select: {
              nombres: true,
              apellidos: true,
              numero_documento: true,
              email: true,
            },
          },
        },
      }),
      prisma.solicitudes_credito.count({ where }),
    ]);

    return {
      collection: solicitudes.map((solicitud: any) => ({
        numero_solicitud: solicitud.numero_solicitud,
        owner_username: solicitud.owner_username,
        valor_solicitud: String(solicitud.valor_solicitud),
        plazo_meses: solicitud.plazo_meses,
        tasa_interes: String(solicitud.tasa_interes),
        estado: solicitud.estado,
        estado_info: solicitud.estados_solicitud,
        fecha_radicado: solicitud.fecha_radicado?.toISOString() || null,
        producto_tipo: solicitud.producto_tipo,
        ha_tenido_credito: solicitud.ha_tenido_credito,
        detalle_modalidad: solicitud.detalle_modalidad,
        tipo_credito: solicitud.tipo_credito,
        moneda: solicitud.moneda,
        cuota_mensual: solicitud.cuota_mensual
          ? String(solicitud.cuota_mensual)
          : null,
        created_at: solicitud.created_at?.toISOString() || null,
        updated_at: solicitud.updated_at?.toISOString() || null,
        solicitante: solicitud.solicitud_solicitante?.[0] || null,
      })),
      pagination: {
        total,
      },
    };
  };

  return {
    getSolicitudesByUser,
    getSolicitudById,
    getAllSolicitudes,
    getSolicitudesPaginadas,
  };
};

export default solicitudService;
