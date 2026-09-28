import { parentPort, workerData } from "node:worker_threads";
import apiKiai from "~~/server/services/api-kiai";
import { loggerService } from "~~/server/utils/logger.service";
import { loadStandaloneKiaiConfig } from "../lib/config";
import type { SolicitudFirmaWorkerData, SolicitudFirmaWorkerResult } from "../lib/types";

const Log = loggerService();

async function consultarProceso(): Promise<SolicitudFirmaWorkerResult> {
  const { numero_solicitud, proceso_id, firmantesCount, accessToken } = workerData as SolicitudFirmaWorkerData;

  try {
    const api = apiKiai(loadStandaloneKiaiConfig(), { accessToken });
    const detalle = await api.consultarProceso(proceso_id);

    await Log.info("nohup: consulta KIAI exitosa", {
      numero_solicitud,
      proceso_id,
      firmantesCount,
      status: detalle.status,
      firmantes: detalle.signers?.map((s) => ({ signingOrder: s.signingOrder, status: s.status }))
    });

    return {
      numero_solicitud,
      proceso_id,
      success: true,
      message: detalle.status,
      detalle
    };
  } catch (error: unknown) {
    const err = error as Error;
    await Log.error("nohup: error consultando KIAI", {
      numero_solicitud,
      proceso_id,
      firmantesCount,
      error: err?.message || "Unknown"
    });

    return {
      numero_solicitud,
      proceso_id,
      success: false,
      message: err?.message || "Error desconocido",
      error: err?.message
    };
  }
}

consultarProceso()
  .then((result) => {
    parentPort?.postMessage(result);
  })
  .catch((error: unknown) => {
    const err = error as Error;
    const data = workerData as SolicitudFirmaWorkerData;
    parentPort?.postMessage({
      numero_solicitud: data.numero_solicitud,
      proceso_id: data.proceso_id,
      success: false,
      message: err?.message || "Error fatal en worker",
      error: err?.message
    } satisfies SolicitudFirmaWorkerResult);
  });
