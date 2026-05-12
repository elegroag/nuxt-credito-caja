import prisma from "~~/lib/prisma";
import datosApiSisuwebService from "~~/server/services/shared/datos-api-sisuweb.service";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event) => {
  const datosApi = datosApiSisuwebService();

  const numero_solicitud = getRouterParam(event, "slug");

  const solicitudCredito = await prisma.solicitudes_credito.findUnique({
    where: {
      numero_solicitud: numero_solicitud
    },
    include: {
      solicitud_documentos: true,
      solicitud_payload: true,
      solicitud_solicitante: true
    }
  });

  const solicitante = solicitudCredito?.solicitud_solicitante?.[0] ?? null;
  const solicitud_payload = solicitudCredito?.solicitud_payload?.[0] ?? null;

  const numeroDocumento = solicitante?.numero_documento ?? "";
  const codigoCategoria = solicitante?.codigo_categoria ?? "";
  const salario = solicitante?.salario ? Number(solicitante.salario) : 0;
  const ciudad = solicitante?.ciudad ?? "";

  const datosLaborales = (solicitud_payload?.informacion_laboral as any) ?? [];
  const ingresosDescuentos
    = (solicitud_payload?.ingresos_descuentos as any) ?? [];
  const informacionEconomica
    = (solicitud_payload?.informacion_economica as any) ?? [];

  const payload = {
    documento: numero_solicitud,
    fecha: solicitudCredito?.fecha_radicado,
    ofiafi: "01", // Oficina afiliada (valor por defecto)
    usuario: solicitudCredito?.owner_username ?? "SYSTEM",
    numdoc: numeroDocumento,
    codcat: codigoCategoria,
    forpag: "M", // Forma de pago (M=Mensual)
    pigsub: "N", // Pignoración subsidio (N=No)
    sueldo: salario,
    otring: ingresosDescuentos?.otros_ingresos ?? 0,
    otrcre: informacionEconomica?.total_otros_creditos ?? 0,
    cappag: solicitudCredito?.valor_solicitud,
    numcue: "",
    tipcue: "A", // A=Ahorros
    codcue: "",
    mancat: solicitudCredito?.producto_tipo,
    tipcre: solicitudCredito?.tipo_credito ?? "CONSUMO",
    perpag: solicitudCredito?.plazo_meses,
    facfin: solicitudCredito?.tasa_interes
      ? Number(solicitudCredito.tasa_interes) / 100
      : 0, // Convertir a factor
    nocts: solicitudCredito?.plazo_meses,
    nitseg: "",
    facseg: 0.01, // Factor seguro (1% por defecto)
    valcre: solicitudCredito?.valor_solicitud,
    tipapr: "N", // Tipo aprobación (N=Normal)
    tipinv: "N", // Tipo inversión (N=Normal)
    estado: solicitudCredito?.estado ?? "PENDIENTE",
    fecrec: solicitudCredito?.fecha_radicado,
    usuest: solicitudCredito?.owner_username ?? "SYSTEM",
    fecest: solicitudCredito?.fecha_radicado,
    acta: "",
    modrec: "API",
    valapr: solicitudCredito?.valor_solicitud,
    nota: "Solicitud generada via API",
    migrado: "N",
    operacion: "CREAR",
    numcre: "",
    cancelado: "N",
    aprseg: "N",
    documentos: JSON.stringify(
      solicitudCredito?.solicitud_documentos?.map(
        doc => doc.documento_requerido_id
      ) ?? []
    )
  };

  const response = await datosApi.crearSolicitudCredito(payload);

  if (!response) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: `Error creating solicitud with numero ${numero_solicitud}`,
      data: {
        numero_solicitud,
        state: process.env.STAGE
      },

      stack: process.env.STAGE !== "prod" ? new Error().stack : ""
    });
  }

  if (!solicitudCredito) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: `Solicitud with numero ${numero_solicitud} not found`,
      data: {
        numero_solicitud,
        state: process.env.STAGE
      },

      stack: process.env.STAGE !== "prod" ? new Error().stack : ""
    });
  }

  return CustomResponse.success(solicitudCredito);
});
