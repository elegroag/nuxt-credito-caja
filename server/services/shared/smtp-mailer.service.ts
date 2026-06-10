/**
 * smtp-mailer.service.ts
 *
 * Servicio de envío de correos vía SMTP. Diseñado para operar con cuentas
 * Gmail usando una App Password (contraseña de aplicación de 16 caracteres),
 * pero también funciona con cualquier servidor SMTP estándar.
 *
 * Para Gmail:
 *  1. Habilitar verificación en 2 pasos en la cuenta.
 *  2. Generar una App Password: https://myaccount.google.com/apppasswords
 *  3. Setear MAIL_USER y MAIL_PASSWORD en .env.
 *
 * Configuración esperada (definida en nuxt.config.ts -> runtimeConfig.mail):
 *   - host, port, secure (SSL/TLS directo vs STARTTLS)
 *   - user, pass  (credenciales SMTP)
 *   - from_name, from_address  (remitente por defecto)
 *   - reject_unauthorized  (validación TLS, true en producción)
 *
 * Uso típico:
 *   const mailer = smtpMailerService();
 *   await mailer.send({
 *     to: "usuario@dominio.com",
 *     subject: "Bienvenido",
 *     text: "Hola ...",
 *     html: "<p>Hola ...</p>",
 *     attachments: [{ filename: "doc.pdf", path: "/tmp/doc.pdf" }]
 *   });
 *
 * El servicio NO mantiene conexión persistente: crea un transporter por
 * envío (nodemailer los gestiona eficientemente con connection pooling
 * interno) y lo cierra al terminar. Para envíos masivos usar sendMany().
 */

import nodemailer, { type Transporter } from "nodemailer";

type MailOptions = NonNullable<Parameters<Transporter["sendMail"]>[0]>;
type NodemailerAttachment = NonNullable<MailOptions["attachments"]>[number];

type Address = string | { name: string; address: string };

export interface MailAttachment {
  /** Nombre del archivo que verá el destinatario. */
  filename: string;
  /** Contenido en Buffer o string UTF-8. */
  content?: Buffer | string;
  /** Ruta absoluta en disco (alternativa a `content`). */
  path?: string;
  /** MIME type. Si se omite, nodemailer intenta inferirlo. */
  contentType?: string;
  /** Si el archivo debe mostrarse inline (imágenes embebidas, etc.). */
  cid?: string;
}

export interface SendMailInput {
  to: Address | Address[];
  cc?: Address | Address[];
  bcc?: Address | Address[];
  subject: string;
  /** Texto plano alternativo. Recomendado para clientes que no soportan HTML. */
  text?: string;
  /** Cuerpo HTML. */
  html?: string;
  attachments?: MailAttachment[];
  /** Sobrescribe el remitente por defecto definido en runtimeConfig. */
  from?: Address;
  /** Identificador de mensaje opcional (correlación con logs externos). */
  messageId?: string;
  /** Headers extra (p.ej. { "X-Aplicacion": "comfaca-creditos" }). */
  headers?: Record<string, string>;
  /** Reply-To explícito. */
  replyTo?: Address;
}

export interface SendMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  /** Tiempo total de envío en milisegundos. */
  durationMs: number;
}

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from_name: string;
  from_address: string;
  reject_unauthorized: boolean;
  env: string;
}

const smtpMailerService = (overrideConfig?: Partial<MailConfig>) => {
  /**
   * Cache del override para no tener que pasarlo en cada llamada.
   * Si se define al instanciar el servicio, todos sus métodos lo usan.
   */
  const fixedOverride = overrideConfig;

  /**
   * Resuelve la configuración SMTP desde runtimeConfig.
   * Lanza si faltan credenciales obligatorias.
   * Acepta overrideConfig para testing o para multi-cuenta.
   */
  const getConfig = (): MailConfig => {
    const mail: MailConfig = fixedOverride
      ? (fixedOverride as MailConfig)
      : (useRuntimeConfig().mail as MailConfig);

    if (!mail.host) {
      throw createError({
        statusCode: 500,
        statusMessage: "MAIL_HOST no está configurado en runtimeConfig"
      });
    }
    if (!mail.user || !mail.pass) {
      throw createError({
        statusCode: 500,
        statusMessage: "MAIL_USER y MAIL_PASSWORD son obligatorios para enviar correos"
      });
    }
    return mail;
  };

  /**
   * Construye un transporter de nodemailer con la configuración actual.
   * `pool: true` permite reusar conexiones entre envíos del mismo proceso.
   */
  const buildTransporter = (cfg: MailConfig): Transporter => {
    return nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      // Para Gmail con port 465 -> secure:true. Para 587 -> secure:false + requireTLS:true.
      requireTLS: !cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      tls: {
        // En dev permite inspeccionar problemas de cert. En pro debe quedar true.
        rejectUnauthorized: cfg.reject_unauthorized,
        // Sugerencia: para Gmail no hace falta setServerIndentity; el cert
        // de smtp.gmail.com ya está firmado por una CA confiable.
        minVersion: "TLSv1.2"
      }
    });
  };

  /**
   * Convierte un Address o lista a un formato seguro para nodemailer.
   */
  const toAddressList = (
    addr: Address | Address[] | undefined
  ): string | string[] | undefined => {
    if (addr === undefined) return undefined;
    if (Array.isArray(addr)) {
      return addr.map((a) =>
        typeof a === "string" ? a : `${a.name} <${a.address}>`
      );
    }
    return typeof addr === "string" ? addr : `${addr.name} <${addr.address}>`;
  };

  /**
   * Envía un correo electrónico.
   * Devuelve metadata del envío (messageId, destinatarios aceptados, duración).
   */
  const send = async (input: SendMailInput): Promise<SendMailResult> => {
    const cfg = getConfig();
    const transporter = buildTransporter(cfg);

    const fromAddress: Address
      = input.from
        || {
          name: cfg.from_name,
          address: cfg.from_address || cfg.user
        };

    const message: MailOptions = {
      from: fromAddress,
      to: toAddressList(input.to),
      cc: toAddressList(input.cc),
      bcc: toAddressList(input.bcc),
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: toAddressList(input.replyTo),
      attachments: input.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.contentType,
        cid: att.cid,
        encoding: "base64"
      })) as NodemailerAttachment[] | undefined,
      headers: input.headers,
      messageId: input.messageId
    };

    if (!message.text && !message.html) {
      throw createError({
        statusCode: 400,
        statusMessage: "El correo debe incluir al menos `text` o `html`"
      });
    }

    const start = Date.now();
    try {
      const info = await transporter.sendMail(message);
      return {
        messageId: info.messageId,
        accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [],
        rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
        durationMs: Date.now() - start
      };
    } catch (err: unknown) {
      const e = err as { code?: string; responseCode?: number; message?: string };
      throw createError({
        statusCode: 502,
        statusMessage: `Error enviando correo SMTP: ${e?.message || "desconocido"}`,
        data: { code: e?.code, responseCode: e?.responseCode }
      });
    } finally {
      // Cerrar el pool: en envíos aislados libera la conexión. sendMany
      // llamará a send() por cada item, así que no necesitamos mantenerlo
      // abierto entre invocaciones.
      transporter.close();
    }
  };

  /**
   * Envía varios correos en serie. nodemailer ya hace pooling interno,
   * pero enviar en serie evita saturar la cuota de Gmail (500/día aprox
   * para cuentas estándar, 2000/día para Workspace).
   *
   * Devuelve un array con el resultado de cada envío (o el error por índice).
   */
  const sendMany = async (
    inputs: SendMailInput[]
  ): Promise<Array<SendMailResult | { error: string; index: number }>> => {
    const results: Array<SendMailResult | { error: string; index: number }> = [];
    for (let i = 0; i < inputs.length; i++) {
      const item = inputs[i];
      if (!item) continue;
      try {
        results.push(await send(item));
      } catch (err: unknown) {
        const e = err as { message?: string };
        results.push({ error: e?.message || "Error desconocido", index: i });
      }
    }
    return results;
  };

  /**
   * Verifica la conexión SMTP y autenticación sin enviar nada.
   * Útil para diagnóstico / healthcheck.
   */
  const verify = async (): Promise<{ ok: boolean; message: string }> => {
    const cfg = getConfig();
    const transporter = buildTransporter(cfg);
    try {
      await transporter.verify();
      return { ok: true, message: "Conexión SMTP verificada" };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { ok: false, message: e?.message || "Fallo al verificar SMTP" };
    } finally {
      transporter.close();
    }
  };

  return {
    send,
    sendMany,
    verify,
    getConfig
  };
};

export default smtpMailerService;
