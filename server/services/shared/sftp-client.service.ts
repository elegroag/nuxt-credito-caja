/**
 * sftp-client.service.ts
 *
 * Servicio de transferencia de archivos sobre SFTP (SSH File Transfer Protocol).
 * Usa `ssh2-sftp-client` que internamente delega en `ssh2`.
 *
 * NOTA: SFTP NO es lo mismo que SMTP. SFTP es para subir/bajar/listar
 * archivos en un servidor remoto (puerto 22 por defecto). Para enviar
 * correos se usa `smtpMailerService` de este mismo paquete.
 *
 * Autenticación soportada (en orden de prioridad):
 *   1. SFTP_PRIVATE_KEY_BASE64 (clave RSA/ED25519, recomendada)
 *   2. SFTP_PASSWORD (credenciales simples)
 *
 * Configuración esperada (runtimeConfig.sftp):
 *   - host, port, username
 *   - password  (opcional, fallback)
 *   - private_key_base64, passphrase  (opcional, preferido)
 *   - base_path  (directorio base remoto, default "/")
 *   - ready_timeout  (ms para handshake inicial)
 *
 * Uso típico:
 *   const sftp = sftpClientService();
 *   await sftp.uploadFile("/local/path/file.pdf", "/remote/folder/file.pdf");
 *   const list = await sftp.listFiles("/remote/folder");
 *   await sftp.disconnect();
 *
 * El servicio mantiene una conexión singleton por instancia. Llamar a
 * `disconnect()` al terminar el proceso o trabajo para liberar la sesión.
 */

import SftpClient from "ssh2-sftp-client";
import { Buffer } from "node:buffer";
import { readFile, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join } from "node:path";

export interface SftpFileInfo {
  name: string;
  /** Ruta completa remota (base_path + ruta relativa). */
  path: string;
  type: "file" | "directory" | "symlink" | "other";
  size: number;
  modifyTime: number;
  accessTime: number;
  /** Permisos en octal (string). */
  rights: string;
  owner: string;
  group: string;
}

export interface UploadOptions {
  /** Si true (default), crea directorios intermedios que no existan. */
  mkdir?: boolean;
  /** Algoritmo de compresión para la transferencia. */
  algorithm?: "zlib@openssh.com" | "none";
}

interface SftpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  private_key_base64: string;
  passphrase: string;
  base_path: string;
  ready_timeout: number;
  env: string;
}

const sftpClientService = (overrideConfig?: Partial<SftpConfig>) => {
  let client: SftpClient | null = null;
  let connectingPromise: Promise<SftpClient> | null = null;
  const fixedOverride = overrideConfig;

  const getConfig = (): SftpConfig => {
    const sftp: SftpConfig = fixedOverride
      ? (fixedOverride as SftpConfig)
      : (useRuntimeConfig().sftp as SftpConfig);

    if (!sftp.host) {
      throw createError({
        statusCode: 500,
        statusMessage: "SFTP_HOST no está configurado en runtimeConfig"
      });
    }
    if (!sftp.username) {
      throw createError({
        statusCode: 500,
        statusMessage: "SFTP_USER no está configurado en runtimeConfig"
      });
    }
    if (!sftp.password && !sftp.private_key_base64) {
      throw createError({
        statusCode: 500,
        statusMessage:
          "Se requiere SFTP_PASSWORD o SFTP_PRIVATE_KEY_BASE64 para autenticar"
      });
    }
    return sftp;
  };

  /**
   * Resuelve una ruta remota anteponiendo base_path si la ruta es relativa.
   * Normaliza separadores y elimina segmentos `..` redundantes.
   */
  const resolveRemotePath = (remotePath: string, basePath: string): string => {
    const normalized = remotePath.replace(/\\/g, "/");
    if (isAbsolute(normalized) || normalized.startsWith("/")) {
      return normalized;
    }
    const base = basePath.replace(/\\/g, "/").replace(/\/+$/u, "");
    const rel = normalized.replace(/^\/+/u, "");
    return `${base}/${rel}`.replace(/\/{2,}/gu, "/");
  };

  /**
   * Decodifica la clave privada en base64. Si falla, devuelve la cadena
   * cruda (compatibilidad con usuarios que pasen la clave en texto plano).
   */
  const decodePrivateKey = (raw: string): Buffer => {
    try {
      return Buffer.from(raw, "base64");
    } catch {
      return Buffer.from(raw, "utf8");
    }
  };

  const buildConnectionOptions = (cfg: SftpConfig) => {
    const options: Record<string, unknown> = {
      host: cfg.host,
      port: cfg.port,
      username: cfg.username,
      readyTimeout: cfg.ready_timeout,
      // Mantener la sesión viva para transferencias largas.
      keepaliveInterval: 10000,
      keepaliveCountMax: 3
    };

    if (cfg.private_key_base64) {
      options.privateKey = decodePrivateKey(cfg.private_key_base64);
      if (cfg.passphrase) {
        options.passphrase = cfg.passphrase;
      }
    } else {
      options.password = cfg.password;
    }

    return options;
  };

  /**
   * Obtiene (o crea) la conexión singleton. Las llamadas concurrentes
   * comparten la misma promesa para evitar doble handshake.
   */
  const getClient = async (): Promise<SftpClient> => {
    if (client) return client;
    if (connectingPromise) return connectingPromise;

    const cfg = getConfig();
    const c = new SftpClient();

    connectingPromise = (async () => {
      try {
        await c.connect(buildConnectionOptions(cfg));
        client = c;
        return c;
      } catch (err: unknown) {
        const e = err as { message?: string; code?: string };
        await c.end().catch(() => {});
        throw createError({
          statusCode: 502,
          statusMessage: `No se pudo conectar al servidor SFTP ${cfg.host}:${cfg.port}: ${e?.message || "error desconocido"}`,
          data: { code: e?.code }
        });
      } finally {
        connectingPromise = null;
      }
    })();

    return connectingPromise;
  };

  /**
   * Verifica la conexión SFTP y la autenticación sin transferir nada.
   * Útil como healthcheck.
   */
  const verify = async (): Promise<{ ok: boolean; message: string }> => {
    try {
      await getClient();
      return { ok: true, message: "Conexión SFTP verificada" };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { ok: false, message: e?.message || "Fallo al verificar SFTP" };
    }
  };

  /**
   * Cierra la conexión activa. Idempotente.
   */
  const disconnect = async (): Promise<void> => {
    if (client) {
      const c = client;
      client = null;
      try {
        await c.end();
      } catch {
        // Ignorar errores al cerrar: la sesión puede ya estar caída.
      }
    }
  };

  /**
   * Sube un archivo local al servidor remoto.
   * Si la ruta remota no incluye nombre, usa el basename del archivo local.
   */
  const uploadFile = async (
    localPath: string,
    remotePath?: string,
    opts: UploadOptions = {}
  ): Promise<{ remotePath: string; size: number }> => {
    const cfg = getConfig();
    const c = await getClient();

    // Resolver destino remoto
    const fileName = basename(localPath);
    const finalRemote = remotePath
      ? resolveRemotePath(remotePath, cfg.base_path)
      : resolveRemotePath(fileName, cfg.base_path);

    // Verificar que el archivo local existe y obtener tamaño
    let size: number;
    try {
      const s = await stat(localPath);
      size = s.size;
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      throw createError({
        statusCode: 404,
        statusMessage: `Archivo local no encontrado: ${localPath}`,
        data: { code: e?.code, message: e?.message }
      });
    }

    // Crear directorios intermedios si se pidió
    if (opts.mkdir !== false) {
      const dir = dirname(finalRemote);
      if (dir && dir !== "/" && dir !== ".") {
        await c.mkdir(dir, true).catch(() => {
          // ssh2-sftp-client lanza si el directorio ya existe; ignorar.
        });
      }
    }

    try {
      const transferOptions: Record<string, unknown> = {};
      if (opts.algorithm) transferOptions.algorithm = opts.algorithm;
      await c.put(localPath, finalRemote, transferOptions);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error subiendo archivo a SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }

    return { remotePath: finalRemote, size };
  };

  /**
   * Sube contenido en memoria (Buffer o string) como un archivo remoto.
   */
  const uploadBuffer = async (
    content: Buffer | string,
    remotePath: string,
    opts: UploadOptions = {}
  ): Promise<{ remotePath: string; size: number }> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);
    const buffer = typeof content === "string" ? Buffer.from(content, "utf8") : content;

    if (opts.mkdir !== false) {
      const dir = dirname(finalRemote);
      if (dir && dir !== "/" && dir !== ".") {
        await c.mkdir(dir, true).catch(() => {});
      }
    }

    try {
      const transferOptions: Record<string, unknown> = {};
      if (opts.algorithm) transferOptions.algorithm = opts.algorithm;
      await c.put(buffer, finalRemote, transferOptions);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error subiendo buffer a SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }

    return { remotePath: finalRemote, size: buffer.length };
  };

  /**
   * Descarga un archivo remoto a disco local.
   */
  const downloadFile = async (
    remotePath: string,
    localPath: string
  ): Promise<{ localPath: string; size: number }> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);

    try {
      await c.get(finalRemote, localPath);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error descargando archivo desde SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }

    const s = await stat(localPath);
    return { localPath, size: s.size };
  };

  /**
   * Descarga un archivo remoto y devuelve su contenido como Buffer.
   */
  const downloadBuffer = async (remotePath: string): Promise<Buffer> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);

    try {
      const data = (await c.get(finalRemote)) as Buffer | string;
      return Buffer.isBuffer(data) ? data : Buffer.from(data);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error leyendo archivo desde SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }
  };

  /**
   * Lista el contenido de un directorio remoto. Devuelve archivos y subdirs
   * con metadata básica (sin entradas `.` y `..`).
   */
  const listFiles = async (remotePath = "/"): Promise<SftpFileInfo[]> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);

    let entries: Array<{
      name: string;
      type: string;
      size: number;
      modifyTime: number;
      accessTime: number;
      rights: { user?: string; group?: string; other?: string } | string;
      owner: string;
      group: string;
    }>;
    try {
      entries = (await c.list(finalRemote)) as unknown as typeof entries;
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error listando directorio SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }

    const baseTrim = cfg.base_path.replace(/\/+$/u, "");
    return entries.map((entry) => {
      const fullPath = `${baseTrim}/${entry.name}`.replace(/\/{2,}/gu, "/");
      const rights
        = typeof entry.rights === "string"
          ? entry.rights
          : [entry.rights?.user, entry.rights?.group, entry.rights?.other]
            .filter(Boolean)
            .join("");
      return {
        name: entry.name,
        path: fullPath,
        type: (["file", "directory", "symlink"].includes(entry.type)
          ? entry.type
          : "other") as SftpFileInfo["type"],
        size: entry.size,
        modifyTime: entry.modifyTime,
        accessTime: entry.accessTime,
        rights,
        owner: entry.owner,
        group: entry.group
      };
    });
  };

  /**
   * Crea un directorio remoto (recursivo por defecto).
   */
  const mkdir = async (remotePath: string, recursive = true): Promise<void> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);

    try {
      await c.mkdir(finalRemote, recursive);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error creando directorio SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }
  };

  /**
   * Elimina un archivo o directorio remoto.
   * Para directorios, debe estar vacío salvo que recursive=true.
   */
  const remove = async (
    remotePath: string,
    recursive = false
  ): Promise<void> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);

    try {
      if (recursive) {
        await c.rmdir(finalRemote, true);
      } else {
        await c.delete(finalRemote);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error eliminando en SFTP: ${e?.message || "error desconocido"}`,
        data: { code: e?.code, remotePath: finalRemote }
      });
    }
  };

  /**
   * Verifica si una ruta remota existe.
   */
  const exists = async (remotePath: string): Promise<boolean> => {
    const cfg = getConfig();
    const c = await getClient();
    const finalRemote = resolveRemotePath(remotePath, cfg.base_path);
    try {
      const result = await c.exists(finalRemote);
      return Boolean(result);
    } catch {
      return false;
    }
  };

  /**
   * Une la ruta base configurada con una subruta. Útil para construir
   * paths completos desde código cliente.
   */
  const resolvePath = (subPath: string): string => {
    const cfg = getConfig();
    return resolveRemotePath(subPath, cfg.base_path);
  };

  /**
   * Helper para leer un archivo local y subirlo, útil para integraciones
   * que reciben un path y necesitan persistirlo en SFTP.
   */
  const uploadFromDisk = async (
    localPath: string,
    remoteSubPath?: string
  ): Promise<{ remotePath: string; size: number }> => {
    const cfg = getConfig();
    const c = await getClient();
    const fileName = basename(localPath);
    const finalRemote = resolveRemotePath(
      remoteSubPath ? join(remoteSubPath, fileName) : fileName,
      cfg.base_path
    );

    let data: Buffer;
    try {
      data = await readFile(localPath);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      throw createError({
        statusCode: 404,
        statusMessage: `No se pudo leer el archivo local: ${localPath}`,
        data: { code: e?.code, message: e?.message }
      });
    }

    const dir = dirname(finalRemote);
    if (dir && dir !== "/" && dir !== ".") {
      await c.mkdir(dir, true).catch(() => {});
    }
    await c.put(data, finalRemote);
    return { remotePath: finalRemote, size: data.length };
  };

  return {
    verify,
    disconnect,
    uploadFile,
    uploadBuffer,
    uploadFromDisk,
    downloadFile,
    downloadBuffer,
    listFiles,
    mkdir,
    remove,
    exists,
    resolvePath,
    getConfig
  };
};

export default sftpClientService;
