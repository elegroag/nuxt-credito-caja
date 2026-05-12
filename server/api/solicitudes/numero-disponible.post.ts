import type { H3Event } from "h3";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { prisma } from "~~/lib/prisma";
import { CustomResponse } from "~~/server/utils/customResponse";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const payload = await readBody(event);
    const linea_credito = payload.linea_credito;
    const ultimo_numero = await prisma.numero_solicitudes.findFirst({
      where: {
        linea_credito: linea_credito
      },
      orderBy: {
        numeric_secuencia: "desc"
      }
    });
    const nuevaSecuencia = (ultimo_numero?.numeric_secuencia ?? 0) + 1;
    const now = new Date();
    const vigencia = parseInt(now.toISOString().slice(0, 7).replace("-", ""));
    const radicado = `${String(nuevaSecuencia).padStart(6, "0")}-${vigencia}-${linea_credito}`;

    return CustomResponse.success(radicado, "Verificación completado.");
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    return CustomResponse.error(
      e?.data?.error || e?.message || "Error conectando con backend",
      "Error al obtener número disponible."
    );
  }
});
