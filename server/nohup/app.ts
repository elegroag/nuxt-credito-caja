import "dotenv/config";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import prisma from "~~/lib/prisma";
import apiKiai from "~~/server/services/api-kiai";
import type { KiaiProcessDetail } from "~~/server/services/api-kiai";
import { KIAI_PROVEEDOR, mapEstadoSolicitud } from "~~/server/services/firma/kiai-firmado.mapper";
import { loggerService } from "~~/server/utils/logger.service";
import { loadStandaloneKiaiConfig } from "./lib/config";
import type { SolicitudFirmaWorkerData, SolicitudFirmaWorkerResult } from "./lib/types";

const Log = loggerService();
const INTERVAL_MS = 5 * 60 * 1000;
const WORKER_PATH = fileURLToPath(new URL("./workers/consultar-firma.worker.ts", import.meta.url));

let shuttingDown = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runWorker(workerData: SolicitudFirmaWorkerData): Promise<SolicitudFirmaWorkerResult> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const worker = new Worker(WORKER_PATH, {
      workerData,
      execArgv: ["--import", "tsx"]
    });

    worker.on("message", (result: SolicitudFirmaWorkerResult) => {
      settled = true;
      resolve(result);
    });

    worker.on("error", (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    worker.on("exit", (code) => {
      if (!settled && code !== 0) {
        settled = true;
        reject(new Error(`Worker detenido con código ${code}`));
      }
    });
  });
}

async function sincronizarProceso(
  procesoDbId: bigint,
  numeroSolicitud: string,
  detalle: KiaiProcessDetail
): Promise<void> {
  const now = new Date();
  const final = mapEstadoSolicitud(detalle.status);

  await prisma.$transaction(async (tx) => {
    await tx.procesos_firma.update({
      where: { id: procesoDbId },
      data: {
        estado: detalle.status,
        completado_en: detalle.completedAt ? new Date(detalle.completedAt) : null,
        ultima_consulta: now,
        respuesta: JSON.parse(JSON.stringify(detalle)),
        updated_at: now
      }
    });

    if (!final) return;

    const { count } = await tx.solicitudes_credito.updateMany({
      where: { numero_solicitud: numeroSolicitud, estado: "PENDIENTE_FIRMADO" },
      data: { estado: final.estado, updated_at: now }
    });
    if (count === 0) return;

    await tx.solicitud_timeline.create({
      data: {
        solicitud_id: numeroSolicitud,
        estado: final.estado,
        fecha: now,
        detalle: `${final.detalle} Proceso: ${detalle.id}`,
        automatico: true
      }
    });
  });

  if (final) {
    await Log.info("nohup: solicitud sincronizada con KIAI", {
      numero_solicitud: numeroSolicitud,
      status: detalle.status,
      estado: final.estado
    });
  }
}

async function procesarSolicitudesPendientes(): Promise<void> {
  const solicitudes = await prisma.solicitudes_credito.findMany({
    where: { estado: "PENDIENTE_FIRMADO" },
    select: {
      numero_solicitud: true,
      firmantes_solicitud: { select: { id: true } },
      procesos_firma: {
        where: { proveedor: KIAI_PROVEEDOR },
        orderBy: { id: "desc" },
        take: 1,
        select: { id: true, proceso_id: true, simulado: true }
      }
    }
  });

  const pendientes = solicitudes.filter((s) => s.procesos_firma[0] && !s.procesos_firma[0].simulado);
  const simuladas = solicitudes.filter((s) => s.procesos_firma[0]?.simulado).map((s) => s.numero_solicitud);
  const sinProceso = solicitudes.filter((s) => !s.procesos_firma[0]).map((s) => s.numero_solicitud);

  await Log.info("nohup: ciclo iniciado", {
    total: solicitudes.length,
    aConsultar: pendientes.length,
    omitidasSimuladas: simuladas.length
  });
  if (simuladas.length > 0) {
    await Log.debug("nohup: solicitudes con proceso simulado omitidas", { solicitudes: simuladas });
  }
  if (sinProceso.length > 0) {
    await Log.warn("nohup: solicitudes sin proceso KIAI registrado", { solicitudes: sinProceso });
  }
  if (pendientes.length === 0) return;

  let accessToken: string;
  try {
    accessToken = await apiKiai(loadStandaloneKiaiConfig()).getToken();
  } catch (error: unknown) {
    const err = error as Error;
    await Log.error("nohup: no se pudo obtener token KIAI; se omite el ciclo", {
      error: err?.message || "Unknown"
    });
    return;
  }

  for (const solicitud of pendientes) {
    if (shuttingDown) break;

    const proceso = solicitud.procesos_firma[0]!;

    const workerData: SolicitudFirmaWorkerData = {
      numero_solicitud: solicitud.numero_solicitud,
      proceso_id: proceso.proceso_id,
      firmantesCount: solicitud.firmantes_solicitud.length,
      accessToken
    };

    try {
      const result = await runWorker(workerData);
      await Log.info("nohup: worker completado", {
        numero_solicitud: result.numero_solicitud,
        success: result.success,
        status: result.detalle?.status
      });

      if (result.success && result.detalle) {
        await sincronizarProceso(proceso.id, solicitud.numero_solicitud, result.detalle);
      }
    } catch (error: unknown) {
      const err = error as Error;
      await Log.error("nohup: worker falló", {
        numero_solicitud: solicitud.numero_solicitud,
        error: err?.message || "Unknown"
      });
    }
  }

  await Log.info("nohup: ciclo finalizado", { total: solicitudes.length });
}

async function iniciar(): Promise<void> {
  await Log.info("nohup: daemon de consulta KIAI iniciado", {
    intervalMinutes: INTERVAL_MS / 60000
  });

  while (!shuttingDown) {
    try {
      await procesarSolicitudesPendientes();
    } catch (error: unknown) {
      const err = error as Error;
      await Log.error("nohup: error en ciclo principal", {
        error: err?.message || "Unknown"
      });
    }

    if (shuttingDown) break;

    await Log.info("nohup: esperando próximo ciclo", { minutes: INTERVAL_MS / 60000 });
    await sleep(INTERVAL_MS);
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  await Log.info("nohup: señal recibida, cerrando daemon", { signal });
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

iniciar().catch(async (error: unknown) => {
  const err = error as Error;
  await Log.error("nohup: error fatal", { error: err?.message || "Unknown" });
  await prisma.$disconnect();
  process.exit(1);
});
