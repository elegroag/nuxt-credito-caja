import prisma from "~~/lib/prisma";
import type { InformacionLaboral, IngresosDescuentos, InformacionEconomica, Propiedad, Deuda, Referencia } from "~~/shared/types/payload";
import type { LineaCreditoSimulador } from "~~/shared/types/simulador";

// Helper para normalizar valores que pueden ser string u objeto {label, value}
const normalizeValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && 'value' in value) {
    return String((value as { value: unknown }).value);
  }
  return String(value);
};

// Types for the payload structure
interface PayloadSolicitud {
  numero_solicitud?: string;
  owner_username?: string;
  valor_solicitud?: number;
  plazo_meses?: number;
  tasa_interes?: number;
  estado?: string;
  producto_tipo?: string;
  ha_tenido_credito?: boolean;
  detalle_modalidad?: string;
  tipcre?: string;
  moneda?: string;
  cuota_mensual?: number;
  rol_en_solicitud?: string;
}

interface PayloadSolicitante {
  tipo_persona?: unknown;
  tipo_documento?: string;
  numero_documento?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  nit?: string;
  fecha_nacimiento?: string | Date;
  pais_nacimiento?: string;
  fecha_expedicion?: string | Date;
  genero?: string;
  estado_civil?: string;
  nivel_educativo?: string;
  profesion?: string;
  email?: string;
  telefono_fijo?: string;
  celular?: string;
  telefono_movil?: string;
  direccion?: string;
  barrio?: string;
  ciudad?: unknown;
  pais_residencia?: string;
  tipo_vivienda?: string;
  vive_con_nucleo_familiar?: boolean;
  personas_a_cargo?: number;
  departamento?: string;
  codigo_categoria?: string;
  cargo?: string;
  salario?: number;
  antiguedad_meses?: number;
  tipo_contrato?: string;
  sector_economico?: string;
}

interface PayloadLineaCredito {
  tipcre?: string;
}

interface _PayloadStructure {
  solicitud?: PayloadSolicitud;
  solicitante?: PayloadSolicitante;
  linea_credito?: PayloadLineaCredito;
  informacion_laboral?: InformacionLaboral;
  ingresos_descuentos?: IngresosDescuentos;
  informacion_economica?: InformacionEconomica;
  propiedades?: Propiedad[];
  deudas?: Deuda[];
  referencias?: { familiares: Referencia[]; personales: Referencia[] };
  conyuge?: unknown;
}

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

    const numeric_secuencia = (ultimoNumero?.numeric_secuencia || 0) + 1;

    // Generar el radicado con formato: secuencia-vigencia-linea_credito (ej: 000007-2026-01)
    const radicado = `${String(numeric_secuencia).padStart(6, "0")}-${vigencia}-${linea_credito}`;

    const numeroSolicitud = await prisma.numero_solicitudes.create({
      data: {
        radicado,
        numeric_secuencia,
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
      data: params as Parameters<typeof prisma.solicitud_payload.create>[0]["data"]
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
  const guardarSolicitudCompleta = async (payload: Record<string, unknown>) => {
    try {
      const {
        solicitud: solicitudRaw,
        solicitante: solicitanteRaw,
        linea_credito: lineaCreditoRaw,
        informacion_laboral,
        ingresos_descuentos,
        informacion_economica,
        propiedades,
        deudas,
        referencias,
        conyuge: _conyuge
      } = payload;

      // Cast payload sections to proper types
      const solicitud = solicitudRaw as PayloadSolicitud | undefined;
      const solicitante = solicitanteRaw as PayloadSolicitante | undefined;
      const linea_credito = lineaCreditoRaw as PayloadLineaCredito | undefined;

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
          const secuencia = partes.length >= 1 ? parseInt(partes[0] || "1", 10) || 1 : 1;

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
      const productoTipoBackend = linea_credito?.tipcre || solicitud?.producto_tipo || null;
      const solicitudCredito = await guardarSolicitudCredito({
        numero_solicitud: numeroSolicitudRadicado,
        owner_username: solicitud?.owner_username || "",
        valor_solicitud: Number(solicitud?.valor_solicitud) || 0,
        plazo_meses: Number(solicitud?.plazo_meses) || 0,
        tasa_interes: Number(solicitud?.tasa_interes) || 0,
        estado: solicitud?.estado || estadoInicial.id,
        producto_tipo: productoTipoBackend ?? undefined,
        ha_tenido_credito: solicitud?.ha_tenido_credito ?? undefined,
        detalle_modalidad: solicitud?.detalle_modalidad ?? undefined,
        tipo_credito: (solicitud?.tipcre || linea_credito?.tipcre) ?? undefined,
        moneda: solicitud?.moneda || "COP",
        cuota_mensual: Number(solicitud?.cuota_mensual) || undefined,
        rol_en_solicitud: (solicitud?.rol_en_solicitud as "T" | "S" | "C" | "E") || "T",
        fecha_radicado: new Date()
      });

      // 4. Obtener numeric_secuencia para numero_comprobante
      const numeroSolicitudRecord = await prisma.numero_solicitudes.findUnique({
        where: { radicado: numeroSolicitudRadicado }
      });

      if (numeroSolicitudRecord) {
        const numeroComprobante = String(numeroSolicitudRecord.numeric_secuencia).padStart(6, "0");
        await prisma.solicitudes_credito.update({
          where: { numero_solicitud: numeroSolicitudRadicado },
          data: { numero_comprobante: numeroComprobante }
        });
      }

      // 5. Guardar payload
      await guardarPayload({
        solicitud_id: numeroSolicitudRadicado,
        informacion_laboral: informacion_laboral as InformacionLaboral | undefined,
        ingresos_descuentos: ingresos_descuentos as IngresosDescuentos | undefined,
        informacion_economica: informacion_economica as InformacionEconomica | undefined,
        propiedades: propiedades as Propiedad[] | undefined,
        deudas: deudas as Deuda[] | undefined,
        referencias: referencias as { familiares: Referencia[]; personales: Referencia[] } | undefined,
        linea_credito: linea_credito as LineaCreditoSimulador | undefined
      });

      // 4. Guardar solicitante
      if (solicitante) {
        const solicitanteData = solicitante as PayloadSolicitante;
        await guardarSolicitante({
          solicitud_id: numeroSolicitudRadicado,
          tipo_persona: normalizeValue(solicitanteData.tipo_persona) as
            | "natural"
            | "juridica"
            | undefined,
          tipo_documento: solicitanteData.tipo_documento || "",
          numero_documento: solicitanteData.numero_documento || "",
          nombres: solicitanteData.nombres,
          apellidos: solicitanteData.apellidos,
          razon_social: solicitanteData.razon_social,
          nit: solicitanteData.nit,
          fecha_nacimiento: solicitanteData.fecha_nacimiento
            ? new Date(solicitanteData.fecha_nacimiento as string)
            : undefined,
          pais_nacimiento: solicitanteData.pais_nacimiento,
          fecha_expedicion: solicitanteData.fecha_expedicion
            ? new Date(solicitanteData.fecha_expedicion as string)
            : undefined,
          genero: solicitanteData.genero as "M" | "F" | "O" | undefined,
          estado_civil: solicitanteData.estado_civil,
          nivel_educativo: solicitanteData.nivel_educativo,
          profesion: solicitanteData.profesion,
          email: solicitanteData.email,
          telefono_fijo: solicitanteData.telefono_fijo,
          telefono_movil: solicitanteData.celular || solicitanteData.telefono_movil,
          direccion: solicitanteData.direccion,
          barrio: solicitanteData.barrio,
          ciudad: normalizeValue(solicitanteData.ciudad),
          pais_residencia: solicitanteData.pais_residencia,
          tipo_vivienda: solicitanteData.tipo_vivienda,
          vive_con_nucleo_familiar: solicitanteData.vive_con_nucleo_familiar,
          personas_a_cargo: solicitanteData.personas_a_cargo,
          departamento: solicitanteData.departamento,
          codigo_categoria: solicitanteData.codigo_categoria,
          cargo: solicitanteData.cargo,
          salario: solicitanteData.salario,
          antiguedad_meses: solicitanteData.antiguedad_meses,
          tipo_contrato: solicitanteData.tipo_contrato,
          sector_economico: solicitanteData.sector_economico
        });
      }

      // 5. Guardar timeline
      await guardarTimeline({
        solicitud_id: numeroSolicitudRadicado,
        estado: solicitudCredito.estado,
        detalle: "Solicitud creada exitosamente",
        usuario_username: (solicitud as PayloadSolicitud)?.owner_username,
        automatico: true
      });

      return {
        numero_solicitud: numeroSolicitudRadicado,
        solicitud: solicitudCredito,
        payload
      };
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(`Error al guardar la solicitud: ${err.message}`);
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
