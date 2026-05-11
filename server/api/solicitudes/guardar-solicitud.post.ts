import type { H3Event } from "h3";
import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3";
import postulacionSolicitudService from "~~/server/services/postulacion-solicitud.service";
import { CustomResponse } from "~~/server/utils/customResponse";
import { z } from "zod";

// Schema de validación para la solicitud
const solicitudSchema = z.object({
  owner_username: z.string().optional(),
  valor_solicitud: z
    .number()
    .nonnegative("El valor de la solicitud debe ser no negativo"),
  plazo_meses: z
    .number()
    .int()
    .nonnegative("El plazo debe ser un número no negativo"),
  tasa_interes: z
    .number()
    .nonnegative("La tasa de interés no puede ser negativa")
    .optional(),
  estado: z.string().optional(),
  producto_tipo: z.string().optional(),
  ha_tenido_credito: z.boolean().optional(),
  detalle_modalidad: z.string().optional(),
  tipo_credito: z.string().optional(),
  moneda: z.string().optional(),
  cuota_mensual: z.number().optional(),
  rol_en_solicitud: z.enum(["T", "S", "C", "E"]).optional(),
});

const solicitanteSchema = z
  .object({
    tipo_persona: z
      .union([
        z.enum(["natural", "juridica"]),
        z.object({ label: z.string(), value: z.enum(["natural", "juridica"]) }),
      ])
      .optional(),
    tipo_documento: z.string().optional(),
    numero_documento: z.string().optional(),
    nombres: z.string().optional(),
    apellidos: z.string().optional(),
    razon_social: z.string().optional(),
    nit: z.string().optional(),
    fecha_nacimiento: z.string().or(z.date()).optional(),
    pais_nacimiento: z.string().optional(),
    fecha_expedicion: z.string().or(z.date()).optional(),
    genero: z.enum(["M", "F", "O"]).optional(),
    estado_civil: z.string().optional(),
    nivel_educativo: z.string().optional(),
    profesion: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    telefono_fijo: z.string().optional(),
    telefono_movil: z.string().optional(),
    direccion: z.string().optional(),
    barrio: z.string().optional(),
    ciudad: z
      .union([
        z.string(),
        z.object({
          label: z.string(),
          value: z.string(),
          description: z.string().optional(),
        }),
      ])
      .optional(),
    pais_residencia: z.string().optional(),
    tipo_vivienda: z.string().optional(),
    vive_con_nucleo_familiar: z.boolean().optional(),
    personas_a_cargo: z.number().int().min(0).optional(),
    departamento: z.string().optional(),
    codigo_categoria: z.string().optional(),
    cargo: z.string().optional(),
    salario: z.number().nonnegative().optional(),
    antiguedad_meses: z.number().int().min(0).optional(),
    tipo_contrato: z.string().optional(),
    sector_economico: z.string().optional(),
  })
  .optional();

const bodySchema = z.object({
  solicitud: solicitudSchema,
  solicitante: solicitanteSchema,
  linea_credito: z.any().optional(),
  conyuge: z.any().optional(),
  informacion_laboral: z.any().optional(),
  ingresos_descuentos: z.any().optional(),
  informacion_economica: z.any().optional(),
  propiedades: z.any().optional(),
  deudas: z.any().optional(),
  referencias: z.any().optional(),
});

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await getUserSession(event).catch(() => null);

    if (!session?.user?.username) {
      setResponseStatus(event, 401);
      return CustomResponse.error(
        "No hay sesión activa",
        "Error de autenticación",
      );
    }

    const payload = await readValidatedBody(event, bodySchema.parse);

    // Agregar owner_username desde la sesión si no está en el payload
    if (payload.solicitud && !payload.solicitud.owner_username) {
      payload.solicitud.owner_username = session.user.username;
    }

    const service = postulacionSolicitudService();

    const resultado = await service.guardarSolicitudCompleta(payload);

    return CustomResponse.success(resultado);
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al guardar solicitud.",
    );
  }
});
