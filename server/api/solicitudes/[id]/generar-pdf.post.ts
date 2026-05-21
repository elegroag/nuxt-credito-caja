import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import type { Prisma } from "~~/lib/prisma";
import prisma from "~~/lib/prisma";
import apiFlaskPdf from "~~/server/services/api-flaskpdf";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { documentoStorage } from "~~/server/services/storage/documento-storage.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { loggerService } from "~~/server/utils/logger.service";
import {
  buildDatosGeneralesMap,
  resolveCiudadNombre,
  resolvePaisNombre
} from "~~/server/utils/datosGeneralesMap";

const Log = loggerService();

interface PdfPayloadData {
  informacion_laboral?: Record<string, unknown>;
  ingresos_descuentos?: Record<string, unknown>;
  informacion_economica?: Record<string, unknown>;
  propiedades?: unknown[];
  deudas?: unknown[];
  referencias?: { familiares?: unknown[]; personales?: unknown[] };
}

interface FlaskPdfResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  errors?: unknown;
}

const serializeForPdf = (obj: Record<string, unknown> | unknown[] | unknown): Record<string, unknown> | unknown[] | unknown => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return (obj as unknown[]).map(serializeForPdf);
    }
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = serializeForPdf((obj as Record<string, unknown>)[key]);
    }
    return result;
  }
  return obj;
};

export default defineEventHandler(async (event: H3Event) => {
  let solicitudId: string = "";

  try {
    const rawSolicitudId = getRouterParam(event, "id");

    if (!rawSolicitudId) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "ID de solicitud no proporcionado",
        "Error de validación"
      );
    }

    solicitudId = rawSolicitudId;

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
      include: {
        pdfs_generados: true,
        solicitud_solicitante: true,
        firmantes_solicitud: {
          orderBy: { orden: "asc" }
        },
        solicitud_payload: {
          orderBy: { created_at: "desc" },
          take: 1
        }
      }
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        "Solicitud no encontrada",
        "Recurso no encontrado"
      );
    }

    const flaskPdf = apiFlaskPdf();

    // Obtener mapas de ciudades y países para resolver códigos a nombres
    const datosApi = datosApiSisuwebService();
    let datosGeneralesMap = { ciudades: new Map<string, string>(), paises: new Map<string, string>() };
    try {
      const datosGenerales = await datosApi.dataGeneral() as { ciudades?: readonly Ciudades[]; paises?: readonly Paises[] } | null;
      if (datosGenerales) {
        datosGeneralesMap = buildDatosGeneralesMap({
          ciudades: datosGenerales.ciudades,
          paises: datosGenerales.paises
        });
      }
    } catch {
      await Log.warn("No se pudieron cargar datos generales, usando códigos sin resolver", { solicitudId });
    }

    // Extraer datos
    const {
      solicitud_solicitante,
      firmantes_solicitud,
      solicitud_payload,
      pdfs_generados,
      ...solicitudData
    } = solicitud;
    const solicitante = solicitud_solicitante?.[0];

    // Obtener datos del payload JSON si existe
    const rawPayload = solicitud_payload?.[0];
    const payloadData = (rawPayload as Record<string, unknown> | null) as PdfPayloadData | undefined;
    const informacionLaboral = (payloadData?.informacion_laboral || {}) as Record<string, unknown>;
    const ingresosDescuentos = (payloadData?.ingresos_descuentos || {}) as Record<string, unknown>;
    const informacionEconomica = (payloadData?.informacion_economica || {}) as Record<string, unknown>;
    const propiedades = payloadData?.propiedades || [];
    const deudas = payloadData?.deudas || [];
    const referencias = payloadData?.referencias || { familiares: [], personales: [] };

    // Construir el payload completo para Flask PDF
    const payload = {
      solicitud_id: solicitudId,
      solicitud: {
        fecha_radicado: solicitudData.fecha_radicado,
        numero_solicitud: solicitudData.numero_solicitud,
        valor_solicitud: solicitudData.valor_solicitud?.toString() || "0",
        plazo_meses: solicitudData.plazo_meses,
        numero_comprobante: 0,
        rol_en_solicitud: solicitudData.rol_en_solicitud || "T",
        categoria: solicitante?.codigo_categoria || "B",
        producto_tipo: solicitudData.producto_tipo || "",
        ha_tenido_credito_comfaca: solicitudData.ha_tenido_credito || false,
        tipo_credito: solicitudData.tipo_credito || "01"
      },
      solicitante: {
        fecha_vinculacion:
          solicitante?.created_at?.toISOString().split("T")[0] || "",
        tipo_documento: solicitante?.tipo_documento || "",
        numero_documento: solicitante?.numero_documento || "",
        fecha_nacimiento:
          solicitante?.fecha_nacimiento?.toISOString().split("T")[0] || "",
        pais_nacimiento: solicitante?.pais_nacimiento || "",
        nombre_completo:
          solicitante?.tipo_persona === "juridica"
            ? solicitante?.razon_social || ""
            : `${solicitante?.nombres || ""} ${solicitante?.apellidos || ""}`.trim(),
        fecha_expedicion_documento:
          solicitante?.fecha_expedicion?.toISOString().split("T")[0] || null,
        profesion_ocupacion: solicitante?.profesion || solicitante?.cargo || "",
        sexo: solicitante?.genero || "",
        nivel_educativo: solicitante?.nivel_educativo || "",
        barrio_residencia: solicitante?.barrio || "",
        ciudad_residencia: resolveCiudadNombre(solicitante?.ciudad, datosGeneralesMap),
        pais_residencia: resolvePaisNombre(solicitante?.pais_residencia, datosGeneralesMap),
        telefono_fijo: solicitante?.telefono_fijo || "",
        telefono_movil: solicitante?.telefono_movil || "",
        email: solicitante?.email || "",
        tipo_vivienda: solicitante?.tipo_vivienda || "",
        vive_con_nucleo_familiar:
          solicitante?.vive_con_nucleo_familiar || false,
        personas_a_cargo: solicitante?.personas_a_cargo || 0,
        direccion_residencia: solicitante?.direccion || ""
      },
      laboral: {
        cargo: solicitante?.cargo || informacionLaboral.cargo || "",
        empresa_nit: solicitante?.nit || informacionLaboral.empresa_nit || "",
        fecha_ingreso:
          informacionLaboral.fecha_ingreso
          || solicitante?.created_at?.toISOString().split("T")[0]
          || "",
        tipo_contrato:
          solicitante?.tipo_contrato || informacionLaboral.tipo_contrato || "",
        empresa_ciudad:
          resolveCiudadNombre(
            (informacionLaboral.empresa_ciudad as string) || solicitante?.ciudad,
            datosGeneralesMap
          ),
        tiempo_servicio:
          informacionLaboral.tiempo_servicio
          || solicitante?.antiguedad_meses
          || 0,
        empresa_telefono: informacionLaboral.empresa_telefono || "",
        empresa_direccion: informacionLaboral.empresa_direccion || "",
        empresa_razon_social:
          solicitante?.razon_social
          || informacionLaboral.empresa_razon_social
          || "",
        nombramiento_o_pagador:
          informacionLaboral.nombramiento_o_pagador || null,
        tiempo_servicio_unidad:
          informacionLaboral.tiempo_servicio_unidad || "meses"
      },
      economica: {
        otros: informacionEconomica.otros || 0,
        moneda: informacionEconomica.moneda || "COP",
        descripcion: informacionEconomica.descripcion || null,
        total_gastos: informacionEconomica.total_gastos || 0,
        total_activos: informacionEconomica.total_activos || 0,
        total_pasivos: informacionEconomica.total_pasivos || 0,
        arrendamientos: informacionEconomica.arrendamientos || 0,
        gastos_descripcion: informacionEconomica.gastos_descripcion || null
      },
      ingresos: {
        moneda: ingresosDescuentos.moneda || "COP",
        comisiones: ingresosDescuentos.comisiones || 0,
        horas_extras: ingresosDescuentos.horas_extras || 0,
        otros_ingresos: ingresosDescuentos.otros_ingresos || 0,
        total_ingresos:
          ingresosDescuentos.total_ingresos
          || solicitante?.salario?.toNumber()
          || 0,
        total_neto_recibido: ingresosDescuentos.total_neto_recibido || 0,
        salario_basico_mensual:
          ingresosDescuentos.salario_basico_mensual
          || solicitante?.salario?.toNumber()
          || 0
      },
      descuentos: {
        judiciales: ingresosDescuentos.judiciales || 0,
        salud_pension: ingresosDescuentos.salud_pension || 0,
        otras_libranzas: ingresosDescuentos.otras_libranzas || 0,
        total_descuentos: ingresosDescuentos.total_descuentos || 0,
        libranzas_comfaca: ingresosDescuentos.libranzas_comfaca || 0,
        otras_deducciones: ingresosDescuentos.otras_deducciones || 0,
        subsidio_transporte: ingresosDescuentos.subsidio_transporte || 0,
        total_neto_recibido: ingresosDescuentos.total_neto_recibido || 0
      },
      conyuge: [],
      referencias: {
        familiares: referencias.familiares || [],
        personales: referencias.personales || []
      },
      deudas: Array.isArray(deudas) ? deudas : [],
      propiedades: Array.isArray(propiedades) ? propiedades : [],
      firmantes:
        firmantes_solicitud?.map(f => ({
          tipo: f.tipo,
          rol: f.rol,
          nombre_completo: f.nombre_completo,
          numero_documento: f.numero_documento,
          email: f.email,
          orden: f.orden
        })) || [],
      convenio: {
        representante_documento:
          informacionLaboral.representante_documento || "",
        representante_nombre: informacionLaboral.representante_nombre || "",
        fecha_vencimiento: informacionLaboral.fecha_vencimiento || "",
        fecha_convenio: informacionLaboral.fecha_convenio || "",
        nit: solicitante?.nit || informacionLaboral.nit || "",
        razon_social:
          solicitante?.razon_social || informacionLaboral.razon_social || "",
        estado: informacionLaboral.estado || "Activo"
      },
      proceso_firmado: {
        proveedor: "CAJA DE COMPENSACIÓN FAMILIAR DEL CAQUETÁ",
        estado: "POSTULADO",
        transaccion_id: "0",
        fecha_inicio: new Date().toLocaleString("es-CO")
      },
      encabezado: {
        fecha_radicado:
          solicitudData.fecha_radicado?.toISOString()
          || new Date().toISOString(),
        solicitud_id: solicitudId
      },
      pdf_metadata: {
        fecha_generacion: new Date().toLocaleString("es-CO"),
        solicitud_id: solicitudId,
        version: "2.0"
      },
      trabajador: {
        cedula: solicitante?.numero_documento || "",
        tipo_documento: solicitante?.tipo_documento || "",
        primer_apellido: solicitante?.apellidos?.split(" ")[0] || "",
        segundo_apellido:
          solicitante?.apellidos?.split(" ").slice(1).join(" ") || "",
        primer_nombre: solicitante?.nombres?.split(" ")[0] || "",
        segundo_nombre:
          solicitante?.nombres?.split(" ").slice(1).join(" ") || "",
        direccion: solicitante?.direccion || "",
        ciudad_codigo: solicitante?.ciudad || "",
        telefono:
          solicitante?.telefono_movil || solicitante?.telefono_fijo || "",
        email: solicitante?.email || "",
        salario: solicitante?.salario?.toNumber() || 0,
        fecha_salario: new Date().toISOString().split("T")[0],
        sexo: solicitante?.genero || "",
        estado_civil: solicitante?.estado_civil || "",
        fecha_nacimiento:
          solicitante?.fecha_nacimiento?.toISOString().split("T")[0] || "",
        ciudad_nacimiento: solicitante?.pais_nacimiento || "",
        nivel_educativo: solicitante?.nivel_educativo || "",
        codigo_categoria: solicitante?.codigo_categoria || "",
        empresa: {
          nit: solicitante?.nit || "",
          razon_social: solicitante?.razon_social || "",
          direccion: informacionLaboral.empresa_direccion || "",
          telefono: informacionLaboral.empresa_telefono || "",
          ciudad_codigo:
            informacionLaboral.empresa_ciudad || solicitante?.ciudad || "",
          representante_legal: informacionLaboral.representante_nombre || "",
          representante_cedula:
            informacionLaboral.representante_documento || "",
          estado: "A"
        },
        estado: "A",
        fecha_afiliacion:
          solicitante?.created_at?.toISOString().split("T")[0] || "",
        cargo: solicitante?.cargo || "",
        tipo_contrato: solicitante?.tipo_contrato || "",
        personas_a_cargo: solicitante?.personas_a_cargo || 0,
        antiguedad_meses: solicitante?.antiguedad_meses || 0
      }
    };

    await Log.info("=== INICIO GENERAR PDF ===", {
      solicitudId,
      fechaSolicitud: new Date().toISOString()
    });

    await Log.debug("Payload construido para Flask PDF", {
      solicitudId,
      payloadKeys: Object.keys(payload),
      solicitud: {
        numero_solicitud: payload.solicitud.numero_solicitud,
        valor_solicitud: payload.solicitud.valor_solicitud,
        producto_tipo: payload.solicitud.producto_tipo
      },
      solicitante: {
        tipo_documento: payload.solicitante.tipo_documento,
        numero_documento: payload.solicitante.numero_documento,
        nombre_completo: payload.solicitante.nombre_completo
      },
      laboral: {
        cargo: payload.laboral.cargo,
        empresa_nit: payload.laboral.empresa_nit,
        empresa_razon_social: payload.laboral.empresa_razon_social
      },
      firmantesCount: payload.firmantes.length,
      deudasCount: payload.deudas.length,
      propiedadesCount: payload.propiedades.length
    });

    await Log.info("Enviando solicitud a servicio externo Flask PDF", {
      solicitudId,
      serviceUrl: "flask-pdf-api/generate"
    });

    await Log.info("Payload enviado a Flask PDF", {
      solicitudId,
      payload: serializeForPdf(payload)
    });

    const response = await flaskPdf.generatePdf<FlaskPdfResponse>(payload);

    await Log.info("=== RESPUESTA RECIBIDA DE FLASK PDF ===", {
      solicitudId,
      success: response.success,
      hasData: !!response.data,
      message: response.message,
      dataKeys: response.data ? Object.keys(response.data as object) : []
    });

    if (response.data) {
      const pdfData = response.data as Record<string, unknown>;
      await Log.debug("Datos del PDF recibido", {
        solicitudId,
        hasPath: !!pdfData.api_path || !!pdfData.path,
        hasFilename: !!pdfData.api_filename || !!pdfData.filename,
        hasContent: !!pdfData.api_content || !!pdfData.content,
        contentLength: ((pdfData.api_content || pdfData.content) as string || "").length
      });
    }

    if (!response.success) {
      await Log.error("Flask PDF retornó error", {
        solicitudId,
        success: response.success,
        message: response.message,
        errors: response.errors
      });
      setResponseStatus(event, 500);
      return CustomResponse.error(
        response.message || "Error al generar el PDF",
        "Error en Flask PDF"
      );
    }

    const pdfData = response.data as Record<string, unknown>;

    // Usar api_path si está disponible, sino usar path
    const pdfPath = String(pdfData.api_path || pdfData.path || "");
    const pdfFilename = String(pdfData.api_filename || pdfData.filename || "");
    const pdfContent = String(pdfData.api_content || pdfData.content || "");

    // Guardar el PDF en storage si hay contenido base64
    let storagePath = pdfPath;
    if (pdfContent) {
      try {
        storagePath = await documentoStorage.guardarPdf(
          solicitudId,
          pdfContent,
          pdfFilename
        );
        await Log.info("PDF guardado en storage exitosamente", {
          solicitudId,
          storagePath,
          filename: pdfFilename
        });
      } catch (storageError) {
        await Log.error("Error al guardar PDF en storage", storageError as Error, {
          solicitudId,
          filename: pdfFilename
        });
      }
    }

    if (solicitud.pdfs_generados) {
      await prisma.pdfs_generados.update({
        where: { solicitud_id: solicitudId },
        data: {
          path: storagePath,
          filename: pdfFilename,
          generado_en: pdfData as unknown as Prisma.InputJsonValue,
          updated_at: new Date()
        }
      });
    } else {
      await prisma.pdfs_generados.create({
        data: {
          solicitud_id: solicitudId,
          path: storagePath,
          filename: pdfFilename,
          generado_en: pdfData as unknown as Prisma.InputJsonValue,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    return CustomResponse.success(
      {
        solicitud_id: solicitudId,
        filename: pdfFilename,
        path: pdfPath
      },
      "PDF generado exitosamente"
    );
  } catch (error: unknown) {
    const err = error as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string; stack?: string };
    const sid = typeof solicitudId === "string" ? solicitudId : "unknown";
    await Log.error("Error al generar PDF", error as Error, {
      solicitudId: sid,
      stack: err?.stack
    });
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al generar el PDF",
      "Error al generar PDF."
    );
  }
});
