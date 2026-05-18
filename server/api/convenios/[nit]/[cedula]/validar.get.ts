import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const nit = getRouterParam(event, "nit");
    const cedula = getRouterParam(event, "cedula");

    if (!nit) {
      setResponseStatus(event, 400);
      return CustomResponse.error("NIT de empresa no proporcionado", "Error de validación");
    }

    if (!cedula) {
      setResponseStatus(event, 400);
      return CustomResponse.error("Cédula de trabajador no proporcionada", "Error de validación");
    }

    const empresa = await prisma.empresas_convenio.findUnique({
      where: { nit: BigInt(nit) }
    });

    if (!empresa) {
      setResponseStatus(event, 404);
      return CustomResponse.error("Empresa no encontrada", "Recurso no encontrado", "valid: false");
    }

    if (empresa.estado !== "Activo") {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "El convenio no está activo",
        "Convenio inactivo",
        "valid: false, empresa: {razon_social, estado, fecha_vencimiento}"
      );
    }

    const hoy = new Date();
    if (empresa.fecha_vencimiento && empresa.fecha_vencimiento < hoy) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        "El convenio ha vencido",
        "Convenio vencido",
        "valid: false, empresa: {razon_social, estado, fecha_vencimiento}"
      );
    }

    return CustomResponse.success(
      {
        valid: true,
        empresa: {
          nit: empresa.nit.toString(),
          razon_social: empresa.razon_social,
          estado: empresa.estado,
          fecha_convenio: empresa.fecha_convenio,
          fecha_vencimiento: empresa.fecha_vencimiento,
          representante_documento: empresa.representante_documento,
          representante_nombre: empresa.representante_nombre,
          telefono: empresa.telefono,
          correo: empresa.correo,
          direccion: empresa.direccion,
          ciudad: empresa.ciudad,
          departamento: empresa.departamento
        }
      },
      "Convenio válido"
    );
  } catch (error: unknown) {
    const err = error as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    console.error("Error al validar convenio:", error);
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error al validar convenio",
      "Error al validar convenio."
    );
  }
});
