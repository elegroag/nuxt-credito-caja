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
        solicitud_solicitante: {
          select: {
            nombres: true,
            apellidos: true,
            tipo_documento: true,
            numero_documento: true,
            fecha_nacimiento: true,
            genero: true,
            estado_civil: true,
            nivel_educativo: true,
            profesion: true,
            email: true,
            telefono_fijo: true,
            telefono_movil: true,
            direccion: true,
            ciudad: true,
            departamento: true,
            tipo_persona: true,
            razon_social: true,
            codigo_categoria: true,
            nit: true,
            tipo_vivienda: true,
          },
        },
        solicitud_documentos: {
          select: {
            id: true,
            documento_requerido_id: true,
            nombre_original: true,
            saved_filename: true,
            tipo_mime: true,
            tamano_bytes: true,
            ruta_archivo: true,
            activo: true,
            created_at: true,
            updated_at: true,
          },
        },
        solicitud_payload: {
          select: {
            id: true,
            version: true,
            informacion_laboral: true,
            ingresos_descuentos: true,
            informacion_economica: true,
            propiedades: true,
            deudas: true,
            referencias: true,
            linea_credito: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!solicitud) {
      return null;
    }

    // Construir payload completo basado en los datos reales
    const payload = {
      solicitud: {
        numero_solicitud: solicitud.numero_solicitud,
        valor_solicitud: String(solicitud.valor_solicitud),
        rol_en_solicitud: solicitud.rol_en_solicitud,
        valor_solicitado: String(solicitud.valor_solicitud),
        cuota_mensual: solicitud.cuota_mensual
          ? String(solicitud.cuota_mensual)
          : null,
        plazo_meses: solicitud.plazo_meses,
        moneda: solicitud.moneda,
        detalle_modalidad: solicitud.detalle_modalidad,
        fecha_radicado: solicitud.fecha_radicado?.toISOString() || null,
        producto_tipo: solicitud.producto_tipo,
        ha_tenido_credito: solicitud.ha_tenido_credito,
        tipo_credito: solicitud.tipo_credito,
      },
      linea_credito: solicitud.solicitud_payload?.[0]?.linea_credito || {
        detalle_modalidad: solicitud.detalle_modalidad,
        estado: solicitud.estado,
        numero_cuotas: solicitud.plazo_meses,
        tasa_interes: solicitud.tasa_interes
          ? Number(solicitud.tasa_interes)
          : 0,
        total_intereses: 0,
        total_pagar: 0,
      },
      solicitante: solicitud.solicitud_solicitante?.[0] || null,
      informacion_laboral:
        solicitud.solicitud_payload?.[0]?.informacion_laboral || null,
      ingresos_descuentos:
        solicitud.solicitud_payload?.[0]?.ingresos_descuentos || null,
      informacion_economica:
        solicitud.solicitud_payload?.[0]?.informacion_economica || null,
      propiedades: solicitud.solicitud_payload?.[0]?.propiedades || null,
      deudas: solicitud.solicitud_payload?.[0]?.deudas || null,
      referencias: solicitud.solicitud_payload?.[0]?.referencias || null,
    };

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
      solicitante: solicitud.solicitud_solicitante?.[0]
        ? {
            nombres: solicitud.solicitud_solicitante[0].nombres,
            apellidos: solicitud.solicitud_solicitante[0].apellidos,
            tipo_documento: solicitud.solicitud_solicitante[0].tipo_documento,
            numero_documento:
              solicitud.solicitud_solicitante[0].numero_documento,
            fecha_nacimiento:
              solicitud.solicitud_solicitante[0].fecha_nacimiento,
            genero: solicitud.solicitud_solicitante[0].genero,
            estado_civil: solicitud.solicitud_solicitante[0].estado_civil,
            nivel_educativo: solicitud.solicitud_solicitante[0].nivel_educativo,
            profesion: solicitud.solicitud_solicitante[0].profesion,
            email: solicitud.solicitud_solicitante[0].email,
            telefono_fijo: solicitud.solicitud_solicitante[0].telefono_fijo,
            telefono_movil: solicitud.solicitud_solicitante[0].telefono_movil,
            direccion: solicitud.solicitud_solicitante[0].direccion,
            ciudad: solicitud.solicitud_solicitante[0].ciudad,
            departamento: solicitud.solicitud_solicitante[0].departamento,
            tipo_persona: solicitud.solicitud_solicitante[0].tipo_persona,
            razon_social: solicitud.solicitud_solicitante[0].razon_social,
            nit: solicitud.solicitud_solicitante[0].nit,
            codigo_categoria:
              solicitud.solicitud_solicitante[0].codigo_categoria,
            tipo_vivienda: solicitud.solicitud_solicitante[0].tipo_vivienda,
          }
        : null,
      payload,
      documentos:
        solicitud.solicitud_documentos?.map((doc) => ({
          ...doc,
          id: String(doc.id),
          tamano_bytes: doc.tamano_bytes ? String(doc.tamano_bytes) : null,
        })) || [],
      payload_raw: solicitud.solicitud_payload?.[0]
        ? {
            ...solicitud.solicitud_payload[0],
            id: String(solicitud.solicitud_payload[0].id),
          }
        : null,
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
