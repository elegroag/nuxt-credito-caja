import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const nit = getRouterParam(event, "nit");
    const cedula = getRouterParam(event, "cedula");

    if (!nit) {
      setResponseStatus(event, 400);
      return {
        error: "NIT de empresa no proporcionado",
      };
    }

    if (!cedula) {
      setResponseStatus(event, 400);
      return {
        error: "Cédula de trabajador no proporcionada",
      };
    }

    const empresa = await prisma.empresas_convenio.findUnique({
      where: { nit: BigInt(nit) },
    });

    if (!empresa) {
      setResponseStatus(event, 404);
      return {
        error: "Empresa no encontrada",
        valid: false,
      };
    }

    if (empresa.estado !== "Activo") {
      setResponseStatus(event, 400);
      return {
        error: "El convenio no está activo",
        valid: false,
        empresa: {
          razon_social: empresa.razon_social,
          estado: empresa.estado,
          fecha_vencimiento: empresa.fecha_vencimiento,
        },
      };
    }

    const hoy = new Date();
    if (empresa.fecha_vencimiento && empresa.fecha_vencimiento < hoy) {
      setResponseStatus(event, 400);
      return {
        error: "El convenio ha vencido",
        valid: false,
        empresa: {
          razon_social: empresa.razon_social,
          estado: empresa.estado,
          fecha_vencimiento: empresa.fecha_vencimiento,
        },
      };
    }

    return {
      success: true,
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
        departamento: empresa.departamento,
      },
    };
  } catch (error: any) {
    console.error("Error al validar convenio:", error);
    const status = Number(error?.statusCode || error?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return {
      error: error?.data?.error || error?.message || "Error al validar convenio",
      valid: false,
    };
  }
});
