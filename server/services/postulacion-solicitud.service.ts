import prisma from "~~/lib/prisma";

// Helper para normalizar valores que pueden ser string u objeto {label, value}
const normalizeValue = (value: any): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.value !== undefined) {
    return String(value.value);
  }
  return String(value);
};

const postulacionSolicitudService = () => {
  // Guardar número de solicitud
  const guardarNumeroSolicitud = async (params: GuardarNumeroSolicitudParams) => {
    const { linea_credito = "03", vigencia } = params;

    // Obtener el último número de secuencia para la vigencia y línea de crédito
    const ultimoNumero = await prisma.numero_solicitudes.findFirst({
      where: {
        linea_credito,
        vigencia
      },
      orderBy: {
        numeric_secuencia: "desc"
      }
    });

    const nuevaSecuencia = (ultimoNumero?.numeric_secuencia || 0) + 1;

    // Generar el radicado con formato: secuencia-vigencia-linea_credito (ej: 000007-2026-01)
    const radicado = `${String(nuevaSecuencia).padStart(6, "0")}-${vigencia}-${linea_credito}`;

    const numeroSolicitud = await prisma.numero_solicitudes.create({
      data: {
        radicado,
        numeric_secuencia: nuevaSecuencia,
        linea_credito,
        vigencia
      }
    });

    return numeroSolicitud;
  };

  // Guardar solicitud de crédito
  const guardarSolicitudCredito = async (params: GuardarSolicitudCreditoParams) => {
    const solicitud = await prisma.solicitudes_credito.create({
      data: params
    });

    return solicitud;
  };

  // Guardar payload
  const guardarPayload = async (params: GuardarPayloadParams) => {
    const payload = await prisma.solicitud_payload.create({
      data: params
    });

    return payload;
  };

  // Guardar solicitante
  const guardarSolicitante = async (params: GuardarSolicitanteParams) => {
    const solicitante = await prisma.solicitud_solicitante.create({
      data: params
    });

    return solicitante;
  };

  // Guardar timeline
  const guardarTimeline = async (params: GuardarTimelineParams) => {
    const timeline = await prisma.solicitud_timeline.create({
      data: params
    });

    return timeline;
  };

  // Guardar firmante
  const guardarFirmante = async (params: GuardarFirmanteParams) => {
    const firmante = await prisma.firmantes_solicitud.create({
      data: params
    });

    return firmante;
  };

  // Método principal para guardar toda la solicitud
  const guardarSolicitudCompleta = async (payload: any) => {
    try {
      const {
        solicitud,
        solicitante,
        linea_credito,
        informacion_laboral,
        ingresos_descuentos,
        informacion_economica,
        propiedades,
        deudas,
        referencias,
        conyuge
      } = payload;

      // 1. Obtener estado inicial válido
      const estadoInicial = await prisma.estados_solicitud.findFirst({
        where: { activo: true },
        orderBy: { orden: "asc" }
      });

      if (!estadoInicial) {
        throw new Error("No hay estados de solicitud activos disponibles");
      }

      // 2. Determinar número de solicitud
      let numeroSolicitudRadicado: string;
      const solicitudIdEnviado = solicitud?.numero_solicitud;

      if (solicitudIdEnviado) {
        // Verificar si el número enviado ya existe
        const solicitudExistente = await prisma.solicitudes_credito.findUnique({
          where: { numero_solicitud: solicitudIdEnviado }
        });

        if (solicitudExistente) {
          // Si existe, generar uno nuevo automáticamente
          const numeroSolicitud = await guardarNumeroSolicitud({
            linea_credito: linea_credito?.tipcre || solicitud?.tipcre || "03",
            vigencia: new Date().getFullYear()
          });
          numeroSolicitudRadicado = numeroSolicitud.radicado;
        } else {
          // Si no existe, usar el enviado y guardarlo en tabla numero_solicitudes
          const lineaCredito = linea_credito?.tipcre || solicitud?.tipcre || "03";
          const vigencia = new Date().getFullYear();
          // Extraer secuencia del formato "000006-202604-01"
          const partes = solicitudIdEnviado.split("-");
          const secuencia = partes.length >= 1 ? parseInt(partes[0], 10) || 1 : 1;

          await prisma.numero_solicitudes.create({
            data: {
              radicado: solicitudIdEnviado,
              numeric_secuencia: secuencia,
              linea_credito: lineaCredito,
              vigencia: vigencia
            }
          });
          numeroSolicitudRadicado = solicitudIdEnviado;
        }
      } else {
        // Si no se envió número, generar uno automáticamente
        const numeroSolicitud = await guardarNumeroSolicitud({
          linea_credito: linea_credito?.tipcre || solicitud?.tipcre || "03",
          vigencia: new Date().getFullYear()
        });
        numeroSolicitudRadicado = numeroSolicitud.radicado;
      }

      // 3. Guardar solicitud de crédito
      const solicitudCredito = await guardarSolicitudCredito({
        numero_solicitud: numeroSolicitudRadicado,
        owner_username: solicitud?.owner_username || "",
        valor_solicitud: solicitud?.valor_solicitud || 0,
        plazo_meses: solicitud?.plazo_meses || 0,
        tasa_interes: solicitud?.tasa_interes || 0,
        estado: solicitud?.estado || estadoInicial.id,
        producto_tipo: solicitud?.producto_tipo,
        ha_tenido_credito: solicitud?.ha_tenido_credito,
        detalle_modalidad: solicitud?.detalle_modalidad,
        tipo_credito: solicitud?.tipcre || linea_credito?.tipcre,
        moneda: solicitud?.moneda || "COP",
        cuota_mensual: solicitud?.cuota_mensual,
        rol_en_solicitud: solicitud?.rol_en_solicitud || "T"
      });

      // 3. Guardar payload
      await guardarPayload({
        solicitud_id: numeroSolicitudRadicado,
        informacion_laboral,
        ingresos_descuentos,
        informacion_economica,
        propiedades,
        deudas,
        referencias,
        linea_credito
      });

      // 4. Guardar solicitante
      if (solicitante) {
        await guardarSolicitante({
          solicitud_id: numeroSolicitudRadicado,
          tipo_persona: normalizeValue(solicitante.tipo_persona) as
            | "natural"
            | "juridica"
            | undefined,
          tipo_documento: solicitante.tipo_documento,
          numero_documento: solicitante.numero_documento,
          nombres: solicitante.nombres,
          apellidos: solicitante.apellidos,
          razon_social: solicitante.razon_social,
          nit: solicitante.nit,
          fecha_nacimiento: solicitante.fecha_nacimiento
            ? new Date(solicitante.fecha_nacimiento)
            : undefined,
          pais_nacimiento: solicitante.pais_nacimiento,
          fecha_expedicion: solicitante.fecha_expedicion
            ? new Date(solicitante.fecha_expedicion)
            : undefined,
          genero: solicitante.genero,
          estado_civil: solicitante.estado_civil,
          nivel_educativo: solicitante.nivel_educativo,
          profesion: solicitante.profesion,
          email: solicitante.email,
          telefono_fijo: solicitante.telefono_fijo,
          telefono_movil: solicitante.celular || solicitante.telefono_movil,
          direccion: solicitante.direccion,
          barrio: solicitante.barrio,
          ciudad: normalizeValue(solicitante.ciudad),
          pais_residencia: solicitante.pais_residencia,
          tipo_vivienda: solicitante.tipo_vivienda,
          vive_con_nucleo_familiar: solicitante.vive_con_nucleo_familiar,
          personas_a_cargo: solicitante.personas_a_cargo,
          departamento: solicitante.departamento,
          codigo_categoria: solicitante.codigo_categoria,
          cargo: solicitante.cargo,
          salario: solicitante.salario,
          antiguedad_meses: solicitante.antiguedad_meses,
          tipo_contrato: solicitante.tipo_contrato,
          sector_economico: solicitante.sector_economico
        });
      }

      // 5. Guardar timeline
      await guardarTimeline({
        solicitud_id: numeroSolicitudRadicado,
        estado: solicitudCredito.estado,
        detalle: "Solicitud creada exitosamente",
        usuario_username: solicitud?.owner_username,
        automatico: true
      });

      return {
        numero_solicitud: numeroSolicitudRadicado,
        solicitud: solicitudCredito,
        payload
      };
    } catch (error: any) {
      throw new Error(`Error al guardar la solicitud: ${error.message}`);
    }
  };

  return {
    guardarNumeroSolicitud,
    guardarSolicitudCredito,
    guardarPayload,
    guardarSolicitante,
    guardarTimeline,
    guardarFirmante,
    guardarSolicitudCompleta
  };
};

export default postulacionSolicitudService;
