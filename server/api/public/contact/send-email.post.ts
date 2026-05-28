import { z } from "zod";
import apiSisuweb from "~~/server/services/api-sisuweb";

const sendEmailSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  identification: z.string().min(5),
  phone: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10)
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const result = sendEmailSchema.safeParse(body);
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Datos inválidos",
      data: result.error.issues
    });
  }

  const api = apiSisuweb();
  const response = await api.postJson<{
    success: boolean;
    message?: string;
    error?: string;
  }>("api/creditos/sender-email-contacts", {
    nombre: result.data.name,
    email: result.data.email,
    identificacion: result.data.identification,
    telefono: result.data.phone ?? null,
    asunto: result.data.subject,
    mensaje: result.data.message
  });

  return response;
});
