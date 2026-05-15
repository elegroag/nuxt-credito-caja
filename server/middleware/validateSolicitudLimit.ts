import { defineEventHandler, setResponseStatus } from "h3";
import prisma from "~~/lib/prisma";
import configurationsService from "~~/server/services/configurations.service";
import { CustomResponse } from "~~/server/utils/customResponse";

/**
 * Estados de solicitud considerados "activos" (no terminado).
 * No incluyen: aprobada, rechazada, cancelada, desistida
 */
const SOLICITUDES_ACTIVAS_ESTADOS = [
  "guardada",
  "enviada",
  "en_revision",
  "revision_comite"
];

/**
 * Rutas donde se aplica la validación de límite de solicitudes.
 */
const SOLICITUD_CREATE_PATHS = [
  "/api/solicitudes/guardar-solicitud",
  "/api/solicitudes/enviar-solicitud"
];

export default defineEventHandler(async (event) => {
  const path = event.path || "";
  const method = event.method || "";

  // Solo aplicar en POST de creación de solicitudes
  if (method !== "POST") return;

  const isSolicitudPath = SOLICITUD_CREATE_PATHS.some((p) => path.includes(p));
  if (!isSolicitudPath) return;

  // Obtener sesión (el auth middleware corre antes, así que el usuario ya está en context)
  const session = await getUserSession(event).catch(() => null);

  if (!session?.user?.username) {
    // Si no hay sesión, el auth middleware se encargará (401)
    return;
  }

  try {
    // Obtener límite de solicitudes activas desde configuraciones
    const limiteStr = await configurationsService().getConfigurationByKey("limite_solicitudes");
    const limite = limiteStr ? parseInt(limiteStr, 10) : 10;

    // Si el valor no es válido numéricamente, no aplicar validación
    if (isNaN(limite) || limite <= 0) return;

    // Contar solicitudes activas del usuario
    const count = await prisma.solicitudes_credito.count({
      where: {
        owner_username: session.user.username,
        estado: {
          in: SOLICITUDES_ACTIVAS_ESTADOS
        }
      }
    });

    // Si ya alcanzó el límite, bloquear la creación
    if (count >= limite) {
      setResponseStatus(event, 422);
      event.node.res.end(
        JSON.stringify(
          CustomResponse.error(
            `Has alcanzado el límite de ${limite} solicitudes activas. Completa o cancela una solicitud existente antes de crear una nueva.`,
            "Límite de solicitudes alcanzado"
          )
        )
      );
    }
  } catch (error) {
    // Si falla la consulta de config, no bloquear la operación
    // (mejor dejar pasar que negar por error de infraestructura)
    console.error("[validateSolicitudLimit] Error validando límite:", error);
  }
});