import type { H3Event } from "h3";
import { defineEventHandler, getRouterParam, readValidatedBody, setResponseStatus } from "h3";
import convenioService from "~~/server/services/convenio.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

// Schema de validación para actualizar convenio
const updateConvenioSchema = z.object({
  nit: z.string().min(1, "El NIT es requerido").optional(),
  razon_social: z.string().min(1, "La razón social es requerida").optional(),
  representante_documento: z.string().min(1, "El documento del representante es requerido").optional(),
  representante_nombre: z.string().min(1, "El nombre del representante es requerido").optional(),
  telefono: z.string().max(20, "El teléfono no puede exceder 20 caracteres").optional(),
  correo: z.string().email("El correo no es válido").max(255, "El correo no puede exceder 255 caracteres").optional(),
  fecha_vencimiento: z.string().optional(),
  estado: z.enum(["Activo", "Inactivo", "Suspendido", "Vencido"]).optional(),
  direccion: z.string().optional(),
  ciudad: z.string().max(100, "La ciudad no puede exceder 100 caracteres").optional(),
  departamento: z.string().max(100, "El departamento no puede exceder 100 caracteres").optional(),
  sector_economico: z.string().max(100, "El sector económico no puede exceder 100 caracteres").optional(),
  numero_empleados: z.number().int().nonnegative().optional(),
  tipo_empresa: z.string().max(100, "El tipo de empresa no puede exceder 100 caracteres").optional(),
  descripcion: z.string().optional(),
  notas_internas: z.string().optional()
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const service = convenioService();
    const id = getRouterParam(event, "id");

    if (!id) {
      setResponseStatus(event, 400);
      return CustomResponse.error("ID de convenio no proporcionado", "Error de validación");
    }

    const payload = await readValidatedBody(event, updateConvenioSchema.parse);

    const convenio = await service.actualizarConvenio(Number(id), payload);

    return CustomResponse.success(
      {
        id: String(convenio.id),
        nit: String(convenio.nit),
        razon_social: convenio.razon_social,
        estado: convenio.estado
      },
      "Convenio actualizado exitosamente"
    );
  } catch (e: unknown) {
    const err = e as { statusCode?: number; response?: { status?: number }; data?: { error?: string }; message?: string };
    const status = Number(err?.statusCode || err?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      err?.data?.error || err?.message || "Error conectando con backend",
      "Error al actualizar convenio."
    );
  }
});
