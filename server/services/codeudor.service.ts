import bcrypt from "bcryptjs";
import prisma from "~~/lib/prisma";
import smtpMailerService from "~~/server/services/shared/smtp-mailer.service";
import { z } from "zod";

const OTP_TTL_MS = 30 * 60 * 1000;
const CODEUDOR_ROLE = "user_codeudor";

const serialize = <T>(value: T): T => {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? Number(v) : v))
  ) as T;
};

const createCodeudorSchema = z.object({
  tipo_documento: z.string().min(1).max(3),
  numero_documento: z.string().min(3).max(20),
  nombres: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional().nullable(),
  titular_user_id: z.number().int().positive().optional()
});

const confirmarSchema = z.object({
  codigo: z.string().min(4).max(10)
});

const ensureRole = (roles: unknown, role: string): string[] => {
  const list = Array.isArray(roles) ? roles.map(String) : [];
  if (!list.includes(role)) list.push(role);
  return list;
};

const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const generateTempPassword = () =>
  `Cd${Math.random().toString(36).slice(2, 8)}A1$`;

const generateUsername = (numeroDocumento: string) =>
  `cd_${numeroDocumento}`.slice(0, 100);

const codeudorService = () => {
  const validateCreate = (payload: unknown) => createCodeudorSchema.parse(payload);
  const validateConfirmar = (payload: unknown) => confirmarSchema.parse(payload);

  const assertCanManage = (roles: string[]) => {
    const allowed = roles.some(r =>
      ["administrator", "user_trabajador"].includes(r)
    );
    if (!allowed) {
      throw createError({
        statusCode: 403,
        message: "No tiene permiso para gestionar codeudores"
      });
    }
  };

  const resolveTitularId = (
    sessionUser: { id: number | string, roles?: string[] },
    requestedTitularId?: number
  ) => {
    const roles = sessionUser.roles || [];
    const sessionId = Number(sessionUser.id);
    if (roles.includes("administrator") && requestedTitularId) {
      return requestedTitularId;
    }
    return sessionId;
  };

  const sendAuthorizationEmail = async (
    email: string,
    codigo: string,
    titularNombre: string
  ) => {
    const mailer = smtpMailerService();
    await mailer.send({
      to: email,
      subject: "Autorización como codeudor - Comfaca Créditos",
      html: `
        <p>Hola,</p>
        <p><strong>${titularNombre}</strong> te ha registrado como codeudor en Comfaca Créditos.</p>
        <p>Para autorizar el vínculo, comunica este código a quien te registró:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${codigo}</p>
        <p>El código expira en 30 minutos.</p>
      `,
      text: `${titularNombre} te registró como codeudor. Código de autorización: ${codigo} (vence en 30 minutos).`
    });
  };

  const applyOtpToVinculo = async (vinculoId: number, email: string, titularNombre: string) => {
    const codigo = generateOtp();
    const hash = bcrypt.hashSync(codigo, 10);
    const expira = new Date(Date.now() + OTP_TTL_MS);

    await prisma.usuarios_codeudores.update({
      where: { id: vinculoId },
      data: {
        estado: "pendiente",
        codigo_autorizacion: hash,
        codigo_expira_at: expira.toISOString(),
        autorizado_at: null,
        updated_at: new Date().toISOString()
      }
    });

    await sendAuthorizationEmail(email, codigo, titularNombre).catch((mailErr: unknown) => {
      console.warn(
        "[codeudor] No se pudo enviar email de autorización:",
        (mailErr as Error)?.message ?? mailErr
      );
    });

    return { codigo_enviado: true, expira_at: expira };
  };

  const findOrCreateCodeudorUser = async (input: z.infer<typeof createCodeudorSchema>) => {
    const byDoc = await prisma.users.findFirst({
      where: {
        numero_documento: input.numero_documento,
        tipo_documento: input.tipo_documento
      }
    });

    if (byDoc) {
      const roles = ensureRole(byDoc.roles, CODEUDOR_ROLE);
      const updated = await prisma.users.update({
        where: { id: byDoc.id },
        data: {
          roles,
          email: input.email || byDoc.email,
          phone: input.phone ?? byDoc.phone,
          nombres: input.nombres,
          apellidos: input.apellidos,
          full_name: `${input.nombres} ${input.apellidos}`,
          updated_at: new Date().toISOString()
        }
      });
      return { user: updated, created: false };
    }

    const byEmail = await prisma.users.findUnique({
      where: { email: input.email }
    });
    if (byEmail) {
      throw createError({
        statusCode: 409,
        message: "Ya existe un usuario con ese correo electrónico"
      });
    }

    let username = generateUsername(input.numero_documento);
    const usernameExists = await prisma.users.findUnique({ where: { username } });
    if (usernameExists) {
      username = `${username}_${Date.now().toString().slice(-4)}`.slice(0, 100);
    }

    const tempPassword = generateTempPassword();
    const user = await prisma.users.create({
      data: {
        username,
        email: input.email,
        full_name: `${input.nombres} ${input.apellidos}`,
        phone: input.phone || null,
        roles: [CODEUDOR_ROLE],
        disabled: false,
        is_active: true,
        tipo_documento: input.tipo_documento,
        numero_documento: input.numero_documento,
        nombres: input.nombres,
        apellidos: input.apellidos,
        password_hash: bcrypt.hashSync(tempPassword, 10),
        email_verified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    return { user, created: true, tempPassword };
  };

  const crearVinculo = async (
    sessionUser: { id: number | string, roles?: string[], full_name?: string | null, username?: string },
    payload: z.infer<typeof createCodeudorSchema>
  ) => {
    assertCanManage(sessionUser.roles || []);
    const titularId = resolveTitularId(sessionUser, payload.titular_user_id);

    const titular = await prisma.users.findUnique({ where: { id: titularId } });
    if (!titular) {
      throw createError({ statusCode: 404, message: "Titular no encontrado" });
    }

    const { user: codeudor } = await findOrCreateCodeudorUser(payload);

    if (Number(codeudor.id) === titularId) {
      throw createError({
        statusCode: 400,
        message: "No puede registrarse a sí mismo como codeudor"
      });
    }

    const existing = await prisma.usuarios_codeudores.findUnique({
      where: {
        titular_user_id_codeudor_user_id: {
          titular_user_id: titularId,
          codeudor_user_id: codeudor.id
        }
      }
    });

    if (existing?.estado === "autorizado") {
      throw createError({
        statusCode: 409,
        message: "Este codeudor ya está autorizado para el titular"
      });
    }

    let vinculo = existing;
    if (!vinculo) {
      vinculo = await prisma.usuarios_codeudores.create({
        data: {
          titular_user_id: titularId,
          codeudor_user_id: codeudor.id,
          estado: "pendiente",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    const titularNombre = titular.full_name || titular.username;
    await applyOtpToVinculo(Number(vinculo.id), codeudor.email, titularNombre);

    return serialize({
      id: Number(vinculo.id),
      estado: "pendiente",
      codeudor: {
        id: Number(codeudor.id),
        username: codeudor.username,
        email: codeudor.email,
        full_name: codeudor.full_name,
        tipo_documento: codeudor.tipo_documento,
        numero_documento: codeudor.numero_documento
      }
    });
  };

  const listarPorTitular = async (
    sessionUser: { id: number | string, roles?: string[] },
    titularUserId?: number
  ) => {
    assertCanManage(sessionUser.roles || []);
    const titularId = resolveTitularId(sessionUser, titularUserId);

    const rows = await prisma.usuarios_codeudores.findMany({
      where: { titular_user_id: titularId },
      include: {
        codeudor: {
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
            tipo_documento: true,
            numero_documento: true,
            phone: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    return serialize(rows);
  };

  const getVinculoOwned = async (
    vinculoId: number,
    sessionUser: { id: number | string, roles?: string[] }
  ) => {
    assertCanManage(sessionUser.roles || []);
    const vinculo = await prisma.usuarios_codeudores.findUnique({
      where: { id: vinculoId },
      include: { codeudor: true, titular: true }
    });
    if (!vinculo) {
      throw createError({ statusCode: 404, message: "Vínculo no encontrado" });
    }

    const roles = sessionUser.roles || [];
    const sessionId = Number(sessionUser.id);
    if (!roles.includes("administrator") && Number(vinculo.titular_user_id) !== sessionId) {
      throw createError({ statusCode: 403, message: "No es el titular de este vínculo" });
    }

    return vinculo;
  };

  const confirmarCodigo = async (
    vinculoId: number,
    sessionUser: { id: number | string, roles?: string[] },
    codigo: string
  ) => {
    const vinculo = await getVinculoOwned(vinculoId, sessionUser);

    if (vinculo.estado === "autorizado") {
      return serialize({ id: Number(vinculo.id), estado: "autorizado" });
    }

    if (!vinculo.codigo_autorizacion || !vinculo.codigo_expira_at) {
      throw createError({
        statusCode: 400,
        message: "No hay código pendiente. Solicite un reenvío."
      });
    }

    if (new Date(vinculo.codigo_expira_at).getTime() < Date.now()) {
      await prisma.usuarios_codeudores.update({
        where: { id: vinculo.id },
        data: { estado: "expirado", updated_at: new Date().toISOString() }
      });
      throw createError({
        statusCode: 401,
        message: "El código ha expirado. Solicite un reenvío."
      });
    }

    const ok = bcrypt.compareSync(codigo.trim(), vinculo.codigo_autorizacion);
    if (!ok) {
      throw createError({ statusCode: 401, message: "Código inválido" });
    }

    const updated = await prisma.usuarios_codeudores.update({
      where: { id: vinculo.id },
      data: {
        estado: "autorizado",
        codigo_autorizacion: null,
        codigo_expira_at: null,
        autorizado_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    return serialize({ id: Number(updated.id), estado: updated.estado });
  };

  const reenviarCodigo = async (
    vinculoId: number,
    sessionUser: { id: number | string, roles?: string[], full_name?: string | null, username?: string }
  ) => {
    const vinculo = await getVinculoOwned(vinculoId, sessionUser);
    if (vinculo.estado === "autorizado") {
      throw createError({
        statusCode: 400,
        message: "El vínculo ya está autorizado"
      });
    }

    const titularNombre = vinculo.titular.full_name || vinculo.titular.username;
    await applyOtpToVinculo(Number(vinculo.id), vinculo.codeudor.email, titularNombre);

    return { codigo_enviado: true };
  };

  const listarResponsabilidades = async (numeroDocumento: string | null | undefined) => {
    if (!numeroDocumento) {
      return { total: 0, valor_total: 0, items: [] };
    }

    const firmantes = await prisma.firmantes_solicitud.findMany({
      where: { numero_documento: numeroDocumento },
      include: {
        solicitudes_credito: {
          select: {
            numero_solicitud: true,
            valor_solicitud: true,
            plazo_meses: true,
            estado: true,
            fecha_radicado: true,
            cuota_mensual: true,
            tipo_credito: true,
            detalle_modalidad: true,
            created_at: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    const items = firmantes.map((f) => {
      const sol = f.solicitudes_credito;
      const valor = Number(sol.valor_solicitud);
      return {
        solicitud_id: sol.numero_solicitud,
        valor_solicitud: valor,
        plazo_meses: sol.plazo_meses,
        estado: sol.estado,
        fecha_radicado: sol.fecha_radicado,
        cuota_mensual: sol.cuota_mensual != null ? Number(sol.cuota_mensual) : null,
        tipo_credito: sol.tipo_credito,
        detalle_modalidad: sol.detalle_modalidad,
        rol_firmante: f.rol,
        orden_firmante: f.orden,
        nombre_firmante: f.nombre_completo,
        email_firmante: f.email
      };
    });

    const valor_total = items.reduce((acc, i) => acc + i.valor_solicitud, 0);

    return serialize({
      total: items.length,
      valor_total,
      items
    });
  };

  const detalleResponsabilidad = async (
    numeroDocumento: string | null | undefined,
    solicitudId: string
  ) => {
    if (!numeroDocumento) {
      throw createError({ statusCode: 403, message: "Documento no disponible en sesión" });
    }

    const firmante = await prisma.firmantes_solicitud.findFirst({
      where: {
        numero_documento: numeroDocumento,
        solicitud_id: solicitudId
      },
      include: {
        solicitudes_credito: {
          include: {
            solicitud_solicitante: {
              take: 1,
              select: {
                nombres: true,
                apellidos: true,
                numero_documento: true,
                tipo_documento: true
              }
            }
          }
        }
      }
    });

    if (!firmante) {
      throw createError({
        statusCode: 403,
        message: "No tiene responsabilidad sobre esta solicitud"
      });
    }

    const sol = firmante.solicitudes_credito;
    const solicitante = sol.solicitud_solicitante[0] || null;

    return serialize({
      solicitud_id: sol.numero_solicitud,
      valor_solicitud: Number(sol.valor_solicitud),
      plazo_meses: sol.plazo_meses,
      tasa_interes: Number(sol.tasa_interes),
      estado: sol.estado,
      fecha_radicado: sol.fecha_radicado,
      cuota_mensual: sol.cuota_mensual != null ? Number(sol.cuota_mensual) : null,
      tipo_credito: sol.tipo_credito,
      detalle_modalidad: sol.detalle_modalidad,
      moneda: sol.moneda,
      firmante: {
        rol: firmante.rol,
        orden: firmante.orden,
        nombre_completo: firmante.nombre_completo,
        numero_documento: firmante.numero_documento,
        email: firmante.email,
        telefono: firmante.telefono
      },
      solicitante
    });
  };

  return {
    validateCreate,
    validateConfirmar,
    crearVinculo,
    listarPorTitular,
    confirmarCodigo,
    reenviarCodigo,
    listarResponsabilidades,
    detalleResponsabilidad
  };
};

export default codeudorService;
