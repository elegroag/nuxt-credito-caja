import type { H3Event } from "h3";
import { defineEventHandler, setResponseStatus } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  try {
    return {
      success: true,
      message: "Proceso de verificación completado.",
    };
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.response?.status || 502);
    setResponseStatus(event, Number.isFinite(status) ? status : 502);

    if (e?.data && typeof e.data === "object") {
      return e.data;
    }

    return {
      error: e?.data?.error || e?.message || "Error conectando con backend",
    };
  }
});
