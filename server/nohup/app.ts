import "dotenv/config";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import prisma from "~~/lib/prisma";
import { loggerService } from "~~/server/utils/logger.service";
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

async function procesarSolicitudesPendientes(): Promise<void> {
  const solicitudes = await prisma.solicitudes_credito.findMany({
    where: { estado: "PENDIENTE_FIRMADO" },
    select: {
      numero_solicitud: true,
      firmantes_solicitud: { select: { id: true } }
    }
  });

  await Log.info("nohup: ciclo iniciado", { total: solicitudes.length });

  for (const solicitud of solicitudes) {
    if (shuttingDown) break;

    const workerData: SolicitudFirmaWorkerData = {
      numero_solicitud: solicitud.numero_solicitud,
      firmantesCount: solicitud.firmantes_solicitud.length
    };

    try {
      const result = await runWorker(workerData);
      await Log.info("nohup: worker completado", {
        numero_solicitud: result.numero_solicitud,
        success: result.success,
        code: result.code
      });
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
  await Log.info("nohup: daemon de consulta FirmaPlus iniciado", {
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
