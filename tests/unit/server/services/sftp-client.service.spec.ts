/**
 * sftp-client.service.spec.ts
 *
 * Tests para sftp-client.service.ts. Mockeamos ssh2-sftp-client para
 * no depender de un servidor SFTP real.
 *
 * El servicio se instancia con overrideConfig para evitar depender del
 * auto-import `useRuntimeConfig` de Nuxt.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtemp, rm, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const mocks = vi.hoisted(() => ({
  SftpClient: vi.fn(),
  connect: vi.fn(),
  end: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  mkdir: vi.fn(),
  delete: vi.fn(),
  rmdir: vi.fn(),
  exists: vi.fn()
}));

vi.mock("ssh2-sftp-client", () => {
  // Mock class constructor. Se usa con `new SftpClient()` desde el servicio.
  // Las llamadas a sus métodos se redirigen a los `vi.fn()` del hoist.
  function SftpClientMockClass(this: Record<string, unknown>) {
    this.connect = mocks.connect;
    this.end = mocks.end;
    this.put = mocks.put;
    this.get = mocks.get;
    this.list = mocks.list;
    this.mkdir = mocks.mkdir;
    this.delete = mocks.delete;
    this.rmdir = mocks.rmdir;
    this.exists = mocks.exists;
  }
  // Permitir que `SftpClientMock()` (sin new) también funcione, ya que
  // ssh2-sftp-client es instanciable de las dos formas.
  const callable = SftpClientMockClass as unknown as {
    new (): Record<string, unknown>;
    (): Record<string, unknown>;
  };
  // Necesario para `mocks.SftpClient.mockImplementation(...)` en beforeEach
  mocks.SftpClient.mockImplementation(() => ({
    connect: mocks.connect,
    end: mocks.end,
    put: mocks.put,
    get: mocks.get,
    list: mocks.list,
    mkdir: mocks.mkdir,
    delete: mocks.delete,
    rmdir: mocks.rmdir,
    exists: mocks.exists
  }));
  return { default: callable };
});

// eslint-disable-next-line import/first
import sftpClientService from "~~/server/services/shared/sftp-client.service";

const baseConfig = {
  env: "dev",
  host: "sftp.example.com",
  port: 22,
  username: "usuario",
  password: "secreto",
  private_key_base64: "",
  passphrase: "",
  base_path: "/uploads",
  ready_timeout: 20000
};

describe("sftpClientService", () => {
  beforeEach(() => {
    mocks.connect.mockReset();
    mocks.end.mockReset();
    mocks.put.mockReset();
    mocks.get.mockReset();
    mocks.list.mockReset();
    mocks.mkdir.mockReset();
    mocks.delete.mockReset();
    mocks.rmdir.mockReset();
    mocks.exists.mockReset();
    mocks.SftpClient.mockClear();

    mocks.connect.mockResolvedValue(undefined);
    mocks.end.mockResolvedValue(undefined);
    mocks.put.mockResolvedValue("ok");
    mocks.mkdir.mockResolvedValue(undefined);
    mocks.delete.mockResolvedValue(undefined);
    mocks.rmdir.mockResolvedValue(undefined);
  });

  describe("getConfig", () => {
    it("devuelve la configuración SFTP completa", () => {
      const svc = sftpClientService(baseConfig);
      const cfg = svc.getConfig();
      expect(cfg.host).toBe("sftp.example.com");
      expect(cfg.port).toBe(22);
      expect(cfg.username).toBe("usuario");
    });

    it("lanza si falta host", () => {
      const svc = sftpClientService({ ...baseConfig, host: "" });
      expect(() => svc.getConfig()).toThrow("SFTP_HOST");
    });

    it("lanza si falta usuario", () => {
      const svc = sftpClientService({ ...baseConfig, username: "" });
      expect(() => svc.getConfig()).toThrow("SFTP_USER");
    });

    it("lanza si no hay password ni clave privada", () => {
      const svc = sftpClientService({
        ...baseConfig,
        password: "",
        private_key_base64: ""
      });
      expect(() => svc.getConfig()).toThrow("SFTP_PASSWORD");
    });
  });

  describe("resolvePath", () => {
    it("concatena base_path con una subruta relativa", () => {
      const svc = sftpClientService(baseConfig);
      expect(svc.resolvePath("docs/file.pdf")).toBe("/uploads/docs/file.pdf");
    });

    it("normaliza barras múltiples y trailing slashes", () => {
      const svc = sftpClientService({ ...baseConfig, base_path: "/uploads/" });
      expect(svc.resolvePath("docs//file.pdf")).toBe("/uploads/docs/file.pdf");
    });

    it("respeta rutas absolutas sin anteponer base_path", () => {
      const svc = sftpClientService(baseConfig);
      expect(svc.resolvePath("/etc/passwd")).toBe("/etc/passwd");
    });
  });

  describe("verify", () => {
    it("devuelve ok=true cuando la conexión es exitosa", async () => {
      const svc = sftpClientService(baseConfig);
      const r = await svc.verify();
      expect(r.ok).toBe(true);
      expect(mocks.connect).toHaveBeenCalled();
    });

    it("devuelve ok=false con el mensaje si falla la conexión", async () => {
      mocks.connect.mockRejectedValueOnce(
        Object.assign(new Error("connect ECONNREFUSED"), {
          code: "ECONNREFUSED"
        })
      );
      const svc = sftpClientService(baseConfig);
      const r = await svc.verify();
      expect(r.ok).toBe(false);
      expect(r.message).toContain("ECONNREFUSED");
    });
  });

  describe("uploadBuffer", () => {
    it("sube un buffer y crea el directorio destino", async () => {
      const svc = sftpClientService(baseConfig);
      const result = await svc.uploadBuffer(
        Buffer.from("contenido"),
        "carpeta/archivo.txt"
      );
      expect(result.remotePath).toBe("/uploads/carpeta/archivo.txt");
      expect(result.size).toBe(9);
      expect(mocks.mkdir).toHaveBeenCalledWith("/uploads/carpeta", true);
      expect(mocks.put).toHaveBeenCalledWith(
        expect.any(Buffer),
        "/uploads/carpeta/archivo.txt",
        {}
      );
    });

    it("acepta string como contenido y lo codifica a utf8", async () => {
      const svc = sftpClientService(baseConfig);
      await svc.uploadBuffer("hola", "x.txt");
      const arg = mocks.put.mock.calls[0]?.[0] as Buffer;
      expect(arg.toString("utf8")).toBe("hola");
    });
  });

  describe("uploadFile", () => {
    it("sube un archivo local y usa basename si remotePath no se da", async () => {
      const svc = sftpClientService(baseConfig);
      const dir = await mkdtemp(join(tmpdir(), "sftp-test-"));
      try {
        const local = join(dir, "test.pdf");
        await writeFile(local, "PDF-data");
        const result = await svc.uploadFile(local);
        expect(result.remotePath).toBe("/uploads/test.pdf");
        expect(result.size).toBe(8);
        expect(mocks.mkdir).toHaveBeenCalledWith("/uploads", true);
        expect(mocks.put).toHaveBeenCalledWith(local, "/uploads/test.pdf", {});
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    it("lanza si el archivo local no existe", async () => {
      const svc = sftpClientService(baseConfig);
      try {
        await svc.uploadFile("/tmp/archivo-que-no-existe-12345.txt");
        expect.fail("Debería haber lanzado");
      } catch (err: unknown) {
        const e = err as Error & { statusCode?: number };
        expect(e.statusCode).toBe(404);
      }
    });

    it("acepta remotePath y lo respeta", async () => {
      const svc = sftpClientService(baseConfig);
      const dir = await mkdtemp(join(tmpdir(), "sftp-test-"));
      try {
        const local = join(dir, "data.bin");
        await writeFile(local, "X");
        const result = await svc.uploadFile(local, "/custom/remote/path.bin");
        expect(result.remotePath).toBe("/custom/remote/path.bin");
        expect(mocks.mkdir).toHaveBeenCalledWith("/custom/remote", true);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });

  describe("downloadFile", () => {
    it("descarga un archivo remoto a disco", async () => {
      mocks.get.mockImplementation(async (_remote: string, local: string) => {
        await writeFile(local, "remote-content");
        return "ok";
      });

      const svc = sftpClientService(baseConfig);
      const dir = await mkdtemp(join(tmpdir(), "sftp-test-"));
      try {
        const dest = join(dir, "out.txt");
        const result = await svc.downloadFile("remote/path.txt", dest);
        expect(result.localPath).toBe(dest);
        expect(result.size).toBe(14);
        const s = await stat(dest);
        expect(s.isFile()).toBe(true);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });

  describe("downloadBuffer", () => {
    it("descarga un archivo y devuelve su contenido como Buffer", async () => {
      mocks.get.mockResolvedValueOnce(Buffer.from("DATA"));
      const svc = sftpClientService(baseConfig);
      const buf = await svc.downloadBuffer("archivo.bin");
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.toString("utf8")).toBe("DATA");
    });
  });

  describe("listFiles", () => {
    it("mapea entradas del listado a la estructura SftpFileInfo", async () => {
      mocks.list.mockResolvedValueOnce([
        {
          name: "doc.pdf",
          type: "file",
          size: 1024,
          modifyTime: 1700000000,
          accessTime: 1700000000,
          rights: { user: "rwx", group: "rx", other: "rx" },
          owner: "user1",
          group: "group1"
        },
        {
          name: "subdir",
          type: "directory",
          size: 0,
          modifyTime: 1700000001,
          accessTime: 1700000001,
          rights: "rwxr-xr-x",
          owner: "user1",
          group: "group1"
        }
      ]);

      const svc = sftpClientService(baseConfig);
      const files = await svc.listFiles("/");
      expect(files).toHaveLength(2);
      expect(files[0]?.name).toBe("doc.pdf");
      expect(files[0]?.type).toBe("file");
      expect(files[0]?.path).toBe("/uploads/doc.pdf");
      expect(files[0]?.rights).toBe("rwxrxrx");
      expect(files[1]?.type).toBe("directory");
    });
  });

  describe("mkdir / remove / exists", () => {
    it("mkdir recursivo por defecto", async () => {
      const svc = sftpClientService(baseConfig);
      await svc.mkdir("a/b/c");
      expect(mocks.mkdir).toHaveBeenCalledWith("/uploads/a/b/c", true);
    });

    it("remove recursivo usa rmdir(true)", async () => {
      const svc = sftpClientService(baseConfig);
      await svc.remove("a/b", true);
      expect(mocks.rmdir).toHaveBeenCalledWith("/uploads/a/b", true);
    });

    it("remove simple usa delete()", async () => {
      const svc = sftpClientService(baseConfig);
      await svc.remove("a/file.txt");
      expect(mocks.delete).toHaveBeenCalledWith("/uploads/a/file.txt");
    });

    it("exists devuelve true/false según el resultado", async () => {
      mocks.exists.mockResolvedValueOnce(true);
      const svc = sftpClientService(baseConfig);
      expect(await svc.exists("archivo.txt")).toBe(true);

      mocks.exists.mockResolvedValueOnce(false);
      expect(await svc.exists("no-existe.txt")).toBe(false);
    });

    it("exists devuelve false si la llamada falla", async () => {
      mocks.exists.mockRejectedValueOnce(new Error("connection lost"));
      const svc = sftpClientService(baseConfig);
      expect(await svc.exists("x.txt")).toBe(false);
    });
  });

  describe("disconnect", () => {
    it("cierra la conexión activa", async () => {
      const svc = sftpClientService(baseConfig);
      await svc.verify();
      await svc.disconnect();
      expect(mocks.end).toHaveBeenCalled();
    });

    it("es idempotente", async () => {
      const svc = sftpClientService(baseConfig);
      await svc.disconnect();
      await svc.disconnect();
      expect(mocks.end).not.toHaveBeenCalled();
    });
  });

  describe("autenticación por clave privada", () => {
    it("usa la clave base64 cuando está disponible", async () => {
      const svc = sftpClientService({
        ...baseConfig,
        private_key_base64: Buffer.from("FAKE-KEY-PEM").toString("base64")
      });
      await svc.verify();
      const opts = mocks.connect.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(opts.privateKey).toBeInstanceOf(Buffer);
      expect((opts.privateKey as Buffer).toString("utf8")).toBe("FAKE-KEY-PEM");
      expect(opts.password).toBeUndefined();
    });

    it("pasa passphrase si está configurada", async () => {
      const svc = sftpClientService({
        ...baseConfig,
        private_key_base64: Buffer.from("FAKE-KEY-PEM").toString("base64"),
        passphrase: "mypass"
      });
      await svc.verify();
      const opts = mocks.connect.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(opts.passphrase).toBe("mypass");
    });
  });
});
