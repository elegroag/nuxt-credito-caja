import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import apiFlaskPdf from "~~/server/services/api-flaskpdf";
import { documentoStorage } from "~~/server/services/storage/documento-storage.service";

// Helper para serializar datos antes de enviar a Flask PDF
const serializeForPdf = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "bigint") return obj.toString();
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeForPdf);
    }
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeForPdf(obj[key]);
    }
    return result;
  }
  return obj;
};

export default defineEventHandler(async (event: H3Event) => {
  try {
    const solicitudId = getRouterParam(event, "id");

    if (!solicitudId) {
      setResponseStatus(event, 400);
      return {
        error: "ID de solicitud no proporcionado",
      };
    }

    const solicitud = await prisma.solicitudes_credito.findUnique({
      where: { numero_solicitud: solicitudId },
      include: {
        pdfs_generados: true,
        solicitud_solicitante: true,
        firmantes_solicitud: {
          orderBy: { orden: "asc" },
        },
        solicitud_payload: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!solicitud) {
      setResponseStatus(event, 404);
      return {
        error: "Solicitud no encontrada",
      };
    }

    const flaskPdf = apiFlaskPdf();

    // Extraer datos
    const {
      solicitud_solicitante,
      firmantes_solicitud,
      solicitud_payload,
      pdfs_generados,
      ...solicitudData
    } = solicitud;
    const payloadData = solicitud_payload?.[0];
    const solicitante = solicitud_solicitante?.[0];

    // Obtener datos del payload JSON si existe
    const informacionLaboral = (payloadData?.informacion_laboral as any) || {};
    const ingresosDescuentos = (payloadData?.ingresos_descuentos as any) || {};
    const informacionEconomica =
      (payloadData?.informacion_economica as any) || {};
    const propiedades = (payloadData?.propiedades as any) || [];
    const deudas = (payloadData?.deudas as any) || [];
    const referencias = (payloadData?.referencias as any) || {
      familiares: [],
      personales: [],
    };

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
        ha_tenido_credito: solicitudData.ha_tenido_credito || false,
        tipo_credito: solicitudData.tipo_credito || "01",
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
        ciudad_residencia: solicitante?.ciudad || "",
        pais_residencia: solicitante?.pais_residencia || "CO",
        telefono_fijo: solicitante?.telefono_fijo || "",
        telefono_movil: solicitante?.telefono_movil || "",
        email: solicitante?.email || "",
        tipo_vivienda: solicitante?.tipo_vivienda || "",
        vive_con_nucleo_familiar:
          solicitante?.vive_con_nucleo_familiar || false,
        personas_a_cargo: solicitante?.personas_a_cargo || 0,
        direccion_residencia: solicitante?.direccion || "",
      },
      laboral: {
        cargo: solicitante?.cargo || informacionLaboral.cargo || "",
        empresa_nit: solicitante?.nit || informacionLaboral.empresa_nit || "",
        fecha_ingreso:
          informacionLaboral.fecha_ingreso ||
          solicitante?.created_at?.toISOString().split("T")[0] ||
          "",
        tipo_contrato:
          solicitante?.tipo_contrato || informacionLaboral.tipo_contrato || "",
        empresa_ciudad:
          informacionLaboral.empresa_ciudad || solicitante?.ciudad || "",
        tiempo_servicio:
          informacionLaboral.tiempo_servicio ||
          solicitante?.antiguedad_meses ||
          0,
        empresa_telefono: informacionLaboral.empresa_telefono || "",
        empresa_direccion: informacionLaboral.empresa_direccion || "",
        empresa_razon_social:
          solicitante?.razon_social ||
          informacionLaboral.empresa_razon_social ||
          "",
        nombramiento_o_pagador:
          informacionLaboral.nombramiento_o_pagador || null,
        tiempo_servicio_unidad:
          informacionLaboral.tiempo_servicio_unidad || "meses",
      },
      economica: {
        otros: informacionEconomica.otros || 0,
        moneda: informacionEconomica.moneda || "COP",
        descripcion: informacionEconomica.descripcion || null,
        total_gastos: informacionEconomica.total_gastos || 0,
        total_activos: informacionEconomica.total_activos || 0,
        total_pasivos: informacionEconomica.total_pasivos || 0,
        arrendamientos: informacionEconomica.arrendamientos || 0,
        gastos_descripcion: informacionEconomica.gastos_descripcion || null,
      },
      ingresos: {
        moneda: ingresosDescuentos.moneda || "COP",
        comisiones: ingresosDescuentos.comisiones || 0,
        horas_extras: ingresosDescuentos.horas_extras || 0,
        otros_ingresos: ingresosDescuentos.otros_ingresos || 0,
        total_ingresos:
          ingresosDescuentos.total_ingresos ||
          solicitante?.salario?.toNumber() ||
          0,
        total_neto_recibido: ingresosDescuentos.total_neto_recibido || 0,
        salario_basico_mensual:
          ingresosDescuentos.salario_basico_mensual ||
          solicitante?.salario?.toNumber() ||
          0,
      },
      descuentos: {
        judiciales: ingresosDescuentos.judiciales || 0,
        salud_pension: ingresosDescuentos.salud_pension || 0,
        otras_libranzas: ingresosDescuentos.otras_libranzas || 0,
        total_descuentos: ingresosDescuentos.total_descuentos || 0,
        libranzas_comfaca: ingresosDescuentos.libranzas_comfaca || 0,
        otras_deducciones: ingresosDescuentos.otras_deducciones || 0,
        subsidio_transporte: ingresosDescuentos.subsidio_transporte || 0,
        total_neto_recibido: ingresosDescuentos.total_neto_recibido || 0,
      },
      conyuge: [],
      referencias: {
        familiares: referencias.familiares || [],
        personales: referencias.personales || [],
      },
      deudas: Array.isArray(deudas) ? deudas : [],
      propiedades: Array.isArray(propiedades) ? propiedades : [],
      firmantes:
        firmantes_solicitud?.map((f) => ({
          tipo: f.tipo,
          rol: f.rol,
          nombre_completo: f.nombre_completo,
          numero_documento: f.numero_documento,
          email: f.email,
          orden: f.orden,
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
        estado: informacionLaboral.estado || "Activo",
      },
      proceso_firmado: {
        proveedor: "CAJA DE COMPENSACIÓN FAMILIAR DEL CAQUETÁ",
        estado: "POSTULADO",
        transaccion_id: "0",
        fecha_inicio: new Date().toLocaleString("es-CO"),
      },
      encabezado: {
        fecha_radicado:
          solicitudData.fecha_radicado?.toISOString() ||
          new Date().toISOString(),
        solicitud_id: solicitudId,
      },
      pdf_metadata: {
        fecha_generacion: new Date().toLocaleString("es-CO"),
        solicitud_id: solicitudId,
        version: "2.0",
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
          estado: "A",
        },
        estado: "A",
        fecha_afiliacion:
          solicitante?.created_at?.toISOString().split("T")[0] || "",
        cargo: solicitante?.cargo || "",
        tipo_contrato: solicitante?.tipo_contrato || "",
        personas_a_cargo: solicitante?.personas_a_cargo || 0,
        antiguedad_meses: solicitante?.antiguedad_meses || 0,
      },
    };

    console.log("Generando PDF para solicitud:", solicitudId);

    const response = await flaskPdf.generatePdf<any>(payload);

    console.log("Respuesta de Flask PDF:", response);

    if (!response.success) {
      setResponseStatus(event, 500);
      return {
        error: response.message || "Error al generar el PDF",
      };
    }

    const pdfData = response.data as any;

    // Usar api_path si está disponible, sino usar path
    const pdfPath = pdfData.api_path || pdfData.path || "";
    const pdfFilename = pdfData.api_filename || pdfData.filename || "";
    const pdfContent = pdfData.api_content || pdfData.content || "";

    // Guardar el PDF en storage si hay contenido base64
    let storagePath = pdfPath;
    if (pdfContent) {
      try {
        storagePath = await documentoStorage.guardarPdf(
          solicitudId,
          pdfContent,
          pdfFilename,
        );
        console.log("PDF guardado en storage:", storagePath);
      } catch (storageError) {
        console.error("Error al guardar PDF en storage:", storageError);
      }
    }

    if (solicitud.pdfs_generados) {
      await prisma.pdfs_generados.update({
        where: { solicitud_id: solicitudId },
        data: {
          path: storagePath,
          filename: pdfFilename,
          generado_en: pdfData,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.pdfs_generados.create({
        data: {
          solicitud_id: solicitudId,
          path: storagePath,
          filename: pdfFilename,
          generado_en: pdfData,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return {
      success: true,
      message: "PDF generado exitosamente",
      data: {
        solicitud_id: solicitudId,
        filename: pdfFilename,
        path: pdfPath,
      },
    };
  } catch (error: any) {
    console.error("Error al generar PDF:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al generar el PDF",
    };
  }
});
