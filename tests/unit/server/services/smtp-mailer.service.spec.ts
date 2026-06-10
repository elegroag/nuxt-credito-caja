/**
 * smtp-mailer.service.spec.ts
 *
 * Tests para smtp-mailer.service.ts. Mockeamos nodemailer para no
 * depender de un servidor SMTP real y validamos la lógica del servicio
 * (config, transformación de inputs, manejo de errores).
 *
 * El servicio se instancia con overrideConfig para evitar depender del
 * auto-import `useRuntimeConfig` de Nuxt.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// `vi.hoisted` permite que estas variables existan cuando `vi.mock` se eleva
// al top del módulo (antes de cualquier import).
const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
  verify: vi.fn(),
  close: vi.fn(),
  createTransport: vi.fn()
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: mocks.createTransport
  }
}));

// eslint-disable-next-line import/first
import smtpMailerService from "~~/server/services/shared/smtp-mailer.service";

const baseConfig = {
  env: "dev",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  user: "test@gmail.com",
  pass: "app-password-1234",
  from_name: "Comfaca Créditos",
  from_address: "no-reply@comfaca.com",
  reject_unauthorized: true
};

describe("smtpMailerService", () => {
  beforeEach(() => {
    mocks.sendMail.mockReset();
    mocks.verify.mockReset();
    mocks.close.mockReset();
    mocks.createTransport.mockReset();

    // createTransport devuelve un transporter con los métodos mockeados
    mocks.createTransport.mockImplementation(() => ({
      sendMail: mocks.sendMail,
      verify: mocks.verify,
      close: mocks.close
    }));

    mocks.sendMail.mockResolvedValue({
      messageId: "<abc123@gmail.com>",
      accepted: ["destino@x.com"],
      rejected: []
    });
    mocks.verify.mockResolvedValue(true);
  });

  describe("getConfig", () => {
    it("devuelve la configuración SMTP completa", () => {
      const svc = smtpMailerService(baseConfig);
      const cfg = svc.getConfig();
      expect(cfg.host).toBe("smtp.gmail.com");
      expect(cfg.port).toBe(465);
      expect(cfg.user).toBe("test@gmail.com");
    });

    it("lanza si falta MAIL_HOST", () => {
      const svc = smtpMailerService({ ...baseConfig, host: "" });
      expect(() => svc.getConfig()).toThrow("MAIL_HOST");
    });

    it("lanza si falta password", () => {
      const svc = smtpMailerService({ ...baseConfig, pass: "" });
      expect(() => svc.getConfig()).toThrow("MAIL_PASSWORD");
    });
  });

  describe("send", () => {
    it("envía un correo simple con texto y retorna metadata", async () => {
      const svc = smtpMailerService(baseConfig);
      const result = await svc.send({
        to: "user@example.com",
        subject: "Hola",
        text: "Cuerpo del mensaje"
      });

      expect(result.messageId).toBe("<abc123@gmail.com>");
      expect(result.accepted).toEqual(["destino@x.com"]);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(mocks.sendMail).toHaveBeenCalledTimes(1);
      expect(mocks.close).toHaveBeenCalledTimes(1);

      const mailArg = mocks.sendMail.mock.calls[0]?.[0];
      expect(mailArg.from).toEqual({
        name: "Comfaca Créditos",
        address: "no-reply@comfaca.com"
      });
      expect(mailArg.to).toBe("user@example.com");
      expect(mailArg.subject).toBe("Hola");
    });

    it("usa el from por defecto (user) si from_address está vacío", async () => {
      const svc = smtpMailerService({ ...baseConfig, from_address: "" });
      await svc.send({ to: "user@example.com", subject: "X", text: "Y" });
      const mailArg = mocks.sendMail.mock.calls[0]?.[0];
      expect(mailArg.from).toEqual({
        name: "Comfaca Créditos",
        address: "test@gmail.com"
      });
    });

    it("permite sobreescribir el from", async () => {
      const svc = smtpMailerService(baseConfig);
      await svc.send({
        to: "user@example.com",
        subject: "X",
        text: "Y",
        from: { name: "Otro", address: "otro@x.com" }
      });
      const mailArg = mocks.sendMail.mock.calls[0]?.[0];
      expect(mailArg.from).toEqual({ name: "Otro", address: "otro@x.com" });
    });

    it("transforma lista de destinatarios a array", async () => {
      const svc = smtpMailerService(baseConfig);
      await svc.send({
        to: ["a@x.com", { name: "B", address: "b@x.com" }],
        subject: "X",
        text: "Y"
      });
      const mailArg = mocks.sendMail.mock.calls[0]?.[0];
      expect(mailArg.to).toEqual(["a@x.com", "B <b@x.com>"]);
    });

    it("transforma adjuntos a formato nodemailer", async () => {
      const svc = smtpMailerService(baseConfig);
      const buf = Buffer.from("PDF-content");
      await svc.send({
        to: "user@example.com",
        subject: "Adjunto",
        text: "X",
        attachments: [
          { filename: "doc.pdf", content: buf, contentType: "application/pdf" }
        ]
      });
      const mailArg = mocks.sendMail.mock.calls[0]?.[0];
      expect(mailArg.attachments).toEqual([
        {
          filename: "doc.pdf",
          content: buf,
          path: undefined,
          contentType: "application/pdf",
          cid: undefined,
          encoding: "base64"
        }
      ]);
    });

    it("lanza si no hay text ni html", async () => {
      const svc = smtpMailerService(baseConfig);
      await expect(
        svc.send({ to: "x@x.com", subject: "X" })
      ).rejects.toThrow("text");
    });

    it("propaga errores de nodemailer como createError 502", async () => {
      mocks.sendMail.mockRejectedValueOnce(
        Object.assign(new Error("Invalid login"), { code: "EAUTH" })
      );
      const svc = smtpMailerService(baseConfig);
      try {
        await svc.send({ to: "x@x.com", subject: "X", text: "Y" });
        expect.fail("Debería haber lanzado");
      } catch (err: unknown) {
        const e = err as Error & { statusCode?: number; data?: { code?: string } };
        expect(e.message).toContain("Invalid login");
        expect(e.statusCode).toBe(502);
        expect(e.data?.code).toBe("EAUTH");
      }
      expect(mocks.close).toHaveBeenCalled();
    });
  });

  describe("sendMany", () => {
    it("envía varios correos y devuelve todos los resultados", async () => {
      mocks.sendMail
        .mockResolvedValueOnce({
          messageId: "<1@x>",
          accepted: ["a@x.com"],
          rejected: []
        })
        .mockResolvedValueOnce({
          messageId: "<2@x>",
          accepted: ["b@x.com"],
          rejected: []
        });

      const svc = smtpMailerService(baseConfig);
      const results = await svc.sendMany([
        { to: "a@x.com", subject: "1", text: "x" },
        { to: "b@x.com", subject: "2", text: "y" }
      ]);

      expect(results).toHaveLength(2);
      expect((results[0] as { messageId: string }).messageId).toBe("<1@x>");
      expect((results[1] as { messageId: string }).messageId).toBe("<2@x>");
    });

    it("captura el error por índice sin abortar el resto", async () => {
      mocks.sendMail
        .mockResolvedValueOnce({
          messageId: "<1@x>",
          accepted: ["a@x.com"],
          rejected: []
        })
        .mockRejectedValueOnce(
          Object.assign(new Error("Boom"), { code: "ETIMEDOUT" })
        );

      const svc = smtpMailerService(baseConfig);
      const results = await svc.sendMany([
        { to: "a@x.com", subject: "1", text: "x" },
        { to: "b@x.com", subject: "2", text: "y" }
      ]);

      expect(results).toHaveLength(2);
      expect((results[0] as { messageId: string }).messageId).toBe("<1@x>");
      const second = results[1] as { error: string; index: number };
      expect(second.error).toContain("Boom");
      expect(second.index).toBe(1);
    });
  });

  describe("verify", () => {
    it("devuelve ok=true cuando el transporter responde", async () => {
      const svc = smtpMailerService(baseConfig);
      const r = await svc.verify();
      expect(r.ok).toBe(true);
      expect(r.message).toBe("Conexión SMTP verificada");
    });

    it("devuelve ok=false con el mensaje del error", async () => {
      mocks.verify.mockRejectedValueOnce(new Error("Auth failed"));
      const svc = smtpMailerService(baseConfig);
      const r = await svc.verify();
      expect(r.ok).toBe(false);
      expect(r.message).toBe("Auth failed");
    });
  });

  it("construye el transporter con la configuración correcta", async () => {
    const svc = smtpMailerService(baseConfig);
    await svc.send({ to: "a@x.com", subject: "X", text: "Y" });
    expect(mocks.createTransport).toHaveBeenCalledTimes(1);
    const opts = mocks.createTransport.mock.calls[0]?.[0];
    expect(opts.host).toBe("smtp.gmail.com");
    expect(opts.port).toBe(465);
    expect(opts.secure).toBe(true);
    expect(opts.auth).toEqual({
      user: "test@gmail.com",
      pass: "app-password-1234"
    });
    expect(opts.pool).toBe(true);
  });
});
