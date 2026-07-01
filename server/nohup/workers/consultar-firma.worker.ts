import { parentPort, workerData } from "node:worker_threads";
import apiFirmaPlus from "~~/server/services/api-firmaplus";
import { loggerService } from "~~/server/utils/logger.service";
import { loadStandaloneFirmaConfig } from "../lib/config";
import type { SolicitudFirmaWorkerData, SolicitudFirmaWorkerResult } from "../lib/types";

const Log = loggerService();

interface FirmaPlusConsultaResponse {
  Code: string
  Data?: {
    NroSolicitud?: string
    Fecha?: string
    Link?: string
  }
  Message?: string
}

async function consultarSolicitud(): Promise<SolicitudFirmaWorkerResult> {
  const { numero_solicitud, firmantesCount } = workerData as SolicitudFirmaWorkerData;

  try {
    const api = apiFirmaPlus(loadStandaloneFirmaConfig());
    const respuesta = await api.getJson<FirmaPlusConsultaResponse>(
      `consultarsolicitud/${numero_solicitud}`,
      { auth: true }
    );

    const result: SolicitudFirmaWorkerResult = {
      numero_solicitud,
      success: respuesta.Code === "1",
      code: respuesta.Code,
      message: respuesta.Message || "",
      data: respuesta.Data
    };

    if (result.success) {
      await Log.info("nohup: consulta FirmaPlus exitosa", {
        numero_solicitud,
        firmantesCount,
        nroSolicitud: respuesta.Data?.NroSolicitud,
        fecha: respuesta.Data?.Fecha,
        link: respuesta.Data?.Link
      });
    } else {
      await Log.warn("nohup: consulta FirmaPlus con error", {
        numero_solicitud,
        firmantesCount,
        code: respuesta.Code,
        message: respuesta.Message
      });
    }

    return result;
  } catch (error: unknown) {
    const err = error as Error;
    await Log.error("nohup: error consultando FirmaPlus", {
      numero_solicitud,
      firmantesCount,
      error: err?.message || "Unknown"
    });

    return {
      numero_solicitud,
      success: false,
      code: "0",
      message: err?.message || "Error desconocido",
      error: err?.message
    };
  }
}

consultarSolicitud()
  .then((result) => {
    parentPort?.postMessage(result);
  })
  .catch((error: unknown) => {
    const err = error as Error;
    parentPort?.postMessage({
      numero_solicitud: (workerData as SolicitudFirmaWorkerData).numero_solicitud,
      success: false,
      code: "0",
      message: err?.message || "Error fatal en worker",
      error: err?.message
    } satisfies SolicitudFirmaWorkerResult);
  });
