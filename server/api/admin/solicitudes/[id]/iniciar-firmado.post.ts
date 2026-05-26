import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus, readBody } from "h3";
import { procesoFirmadoAdm } from "~~/server/services/admin/proceso-firmado-adm.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import prisma from "~~/lib/prisma";
import { loggerService } from "~~/server/utils/logger.service";

const Log = loggerService();

interface FirmanteInput {
  id: string;
  orden: number;
  tipo: string;
  nombre_completo: string;
  numero_documento: string;
  email: string;
  rol: string;
  telefono?: string;
  codigo_pais?: string;
}

interface IniciarFirmadoBody {
  firmantes: FirmanteInput[];
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, "id");

    Log.info("iniciar-firmado: Iniciando proceso", { solicitudId: id });

    if (!id) {
      Log.warn("iniciar-firmado: ID no proporcionado");
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de solicitud no proporcionado", "Error de validación");
    }

    const body = await readBody<IniciarFirmadoBody>(event);
    const firmantesData = body.firmantes;

    Log.info("iniciar-firmado: Firmantes recibidos", {
      count: firmantesData?.length ?? 0,
      firmantes: firmantesData
    });

    if (!firmantesData || firmantesData.length === 0) {
      Log.warn("iniciar-firmado: Sin firmantes", { solicitudId: id });
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "La solicitud no tiene firmantes asociados",
        "Error de validación"
      );
    }

    const firmantesConOrden = firmantesData.map((f, index) => ({
      id: f.id,
      orden: f.orden || index + 1,
      tipo: f.tipo || "1",
      nombre_completo: f.nombre_completo,
      numero_documento: String(f.numero_documento),
      email: f.email,
      rol: f.rol,
      telefono: f.telefono || null,
      codigo_pais: f.codigo_pais || "57"
    }));

    Log.info("iniciar-firmado: Eliminando firmantes existentes", { solicitudId: id });
    await prisma.firmantes_solicitud.deleteMany({
      where: { solicitud_id: id }
    });

    Log.info("iniciar-firmado: Creando firmantes en BD", {
      solicitudId: id,
      count: firmantesConOrden.length,
      firmantes: firmantesConOrden.map((f) => ({
        orden: f.orden,
        tipo: f.tipo,
        nombre_completo: f.nombre_completo,
        numero_documento: f.numero_documento,
        email: f.email,
        rol: f.rol,
        telefono: f.telefono,
        codigo_pais: f.codigo_pais
      }))
    });
    await prisma.firmantes_solicitud.createMany({
      data: firmantesConOrden.map((f) => ({
        solicitud_id: id,
        orden: f.orden,
        tipo: f.tipo,
        nombre_completo: f.nombre_completo,
        numero_documento: f.numero_documento,
        email: f.email,
        rol: f.rol,
        telefono: f.telefono ? String(f.telefono) : null,
        codigo_pais: f.codigo_pais
      }))
    });

    Log.info("iniciar-firmado: Invocando servicio procesoFirmadoAdm", { solicitudId: id });
    const resultado = await procesoFirmadoAdm.iniciarFirmado({
      solicitudId: id
    });

    if (!resultado.success) {
      Log.error("iniciar-firmado: Error en procesoFirmadoAdm", {
        solicitudId: id,
        message: resultado.message
      });
      setResponseStatus(event, 400);
      return CustomResponse.error(resultado.message, "Error al iniciar firmado");
    }

    Log.info("iniciar-firmado: Actualizando estado a PENDIENTE_FIRMADO", { solicitudId: id });
    const session = await getUserSession(event).catch(() => null);
    const username = session?.user?.username || "system";

    await prisma.solicitudes_credito.update({
      where: { numero_solicitud: id },
      data: {
        estado: "PENDIENTE_FIRMADO",
        updated_at: new Date()
      }
    });

    await prisma.solicitud_timeline.create({
      data: {
        solicitud_id: id,
        estado: "PENDIENTE_FIRMADO",
        fecha: new Date(),
        observacion: `Solicitud enviada para firma digital. Transaction ID: ${resultado.data?.transaccion_id || "N/A"}`,
        usuario_username: username
      }
    });

    Log.info("iniciar-firmado: Proceso completado exitosamente", {
      solicitudId: id,
      data: resultado.data
    });
    return CustomResponse.success(resultado.data, resultado.message);
  } catch (e: unknown) {
    const err = e as {
      statusCode?: number;
      response?: { status?: number };
      data?: { error?: string };
      message?: string;
    };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    Log.error("iniciar-firmado: Error catch", { error: err?.message || "Unknown", stack: err });

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al iniciar firmado."
    );
  }
});
