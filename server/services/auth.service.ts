import type { H3Event } from "h3";
import bcrypt from "bcryptjs";
import userService from "./user.service";
import apiSisuweb from "./api-sisuweb";
import smtpMailerService from "~~/server/services/shared/smtp-mailer.service";
import type {
  UserSession,
  LoginCredentials,
  RegisterPayload,
  RecoveryPayload,
  VerifyCodePayload,
  ResendCodePayload
} from "~~/shared/types/users-session";
import jwtManager from "~~/shared/utils/jwt";

interface UserWithPassword {
  id: number
  username: string
  email: string
  full_name: string
  password_hash: string
  roles: string[]
  numero_documento: string | null
}

interface TrabajadorData {
  nit: string
  estado: string
  sucursal: string
  phone: string
  email: string
}

interface AdviserData {
  estado: string
  phone: string
  email: string
  codigo_funcionario: string
  tipo_funcionario: string
}

const authService = () => {
  const userSrv = userService();
  const api = apiSisuweb();
  const jwt = jwtManager();

  const permissionsData = (roles: string[]) => {
    const permissions: string[] = [];

    // Handle null or empty roles
    if (roles.length === 0) {
      return permissions;
    }

    // Define role permissions
    const rolePermissions = {
      administrator: [
        "users.create",
        "users.edit",
        "users.delete",
        "users.view",
        "applications.create",
        "applications.edit",
        "applications.delete",
        "applications.view_all",
        "roles.manage",
        "system.admin"
      ],
      adviser: [
        "applications.create",
        "applications.edit",
        "applications.delete",
        "applications.view_all",
        "applications.approve",
        "applications.reject",
        "solicitudes.manage",
        "solicitudes.view",
        "convenios.manage",
        "convenios.view",
        "firmas.manage",
        "firmas.view",
        "system.admin"
      ],
      user_empresa: [
        "applications.create",
        "applications.edit",
        "applications.delete",
        "applications.view_own"
      ],
      user_trabajador: [
        "applications.create",
        "applications.edit",
        "applications.delete",
        "applications.view_own"
      ]
    };

    const allPermissions: string[] = [];
    // Get permissions for each role
    for (const role of roles) {
      if (rolePermissions[role as keyof typeof rolePermissions]) {
        allPermissions.push(
          ...rolePermissions[role as keyof typeof rolePermissions]
        );
      }
    }
    return allPermissions;
  };

  const createToken = async (user: UserWithPassword) => {
    return await jwt.signJwt({
      sub: user.id,
      email: user.email || "",
      roles: user.roles
    });
  };

  const validateCredentials = async (
    credentials: LoginCredentials
  ): Promise<{ user: UserWithPassword | null, isValid: boolean }> => {
    const prismaUser = await userSrv.findByUsername(credentials.username);

    if (!prismaUser) {
      return { user: null, isValid: false };
    }

    const isPasswordValid = bcrypt.compareSync(
      credentials.password,
      prismaUser.password_hash
    );

    const user: UserWithPassword = {
      id: Number(prismaUser.id),
      username: prismaUser.username,
      email: prismaUser.email || "",
      full_name: prismaUser.full_name || "",
      password_hash: prismaUser.password_hash,
      roles: (prismaUser.roles as string[]) || [],
      numero_documento: prismaUser.numero_documento
    };

    return { user, isValid: isPasswordValid };
  };

  const generateRandomPin = (): string => {
    return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  };

  const RESEND_COOLDOWN_MS = 30_000;

  const getPinSentAt = (rememberToken: string | null | undefined): number | null => {
    if (!rememberToken?.startsWith("pin_sent:")) return null;
    const timestamp = Number(rememberToken.replace("pin_sent:", ""));
    return Number.isFinite(timestamp) ? timestamp : null;
  };

  const sendVerificationEmail = async (email: string, pin: string, subject: string) => {
    const mailer = smtpMailerService();
    const body = `<html>
      <head>
          <title>${subject}</title>
      </head>
      <body>
          <h1>${subject}</h1>
          <p>Usa el siguiente código para verificar tu identidad en Comfaca Crédito.</p>
          <p><strong>Código:</strong> ${pin}</p>
          <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString("es-CO")}</p>
          <p><strong>Entorno:</strong> ${process.env.NODE_ENV}</p>
          <hr>
          <p><small>Este correo fue enviado automáticamente desde el sistema de Comfaca Crédito.</small></p>
      </body>
      </html>`;

    await mailer.send({
      to: email,
      subject,
      html: body,
      text: `Tu código de verificación es: ${pin}`
    }).catch((mailErr: unknown) => {
      console.warn(
        "[auth] No se pudo enviar el email de verificación:",
        (mailErr as Error)?.message ?? mailErr
      );
    });
  };

  const createUserSession = (
    user: UserWithPassword,
    trabajador: TrabajadorData | null,
    adviser: AdviserData | null
  ): UserSession => {
    const session = {
      id: user.id.toString(),
      username: user.username,
      name: user.full_name || "",
      email: user.email || "",
      roles: user.roles as string[],
      trabajador: trabajador || null,
      adviser: adviser || null
    };
    return session;
  };

  const login = async (event: H3Event, credentials: LoginCredentials) => {
    const { user, isValid } = await validateCredentials(credentials);

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: "Bad credentials (password)"
      });
    }

    if (!user) {
      throw createError({
        status: 401,
        message: "Bad credentials (user not found)"
      });
    }

    let trabajadorSesion = null;
    let trabajadorData: unknown = null;

    // valida en user.roles si hay rol de user_trabajador
    if (user.roles.includes("user_trabajador")) {
      // usamos la api_sisuweb
      const responseApi = await api.postJson<Record<string, unknown>>(
        "company/informacion_trabajador",
        {
          cedtra: user.numero_documento
        },
        {
          auth: true
        }
      );
      if (responseApi.success) {
        // procesar dataApi.data
        trabajadorData = responseApi.data || null;

        if (trabajadorData && typeof trabajadorData === 'object') {
          const td = trabajadorData as Record<string, unknown>;
          trabajadorSesion = {
            nit: td.nit as string,
            estado: td.estado as string,
            sucursal: td.codsuc as string,
            phone: td.telefono as string,
            email: td.email as string
          };
        }
      }
    }

    const userSession = createUserSession(user, trabajadorSesion, null);

    await setUserSession(event, {
      user: userSession,
      loggedInAt: new Date()
    });

    await userSrv.updateLastLogin(user.id);

    const token = await createToken(user);

    return {
      message: "Login successful",
      user: userSession,
      trabajador: trabajadorData,
      access_token: token,
      token_type: "bearer"
    };
  };

  const verify = async (event: H3Event) => {
    // se debe validar el token que llega en el header Authorization
    const authHeader = getHeader(event, "Authorization");
    const token = jwt.extractBearerToken(authHeader);

    if (!token) {
      throw createError({
        statusCode: 401,
        message: "No token provided"
      });
    }

    const jwtPayload = await jwt.verifyJwt(token);

    const session = await getUserSession(event).catch(() => null);

    if (jwtPayload.sub !== Number(session?.user?.id)) {
      throw createError({
        statusCode: 401,
        statusMessage: "Token inválido",
        message: "La sesión no es válida"
      });
    }

    const user = await userSrv.findById(Number(session?.user?.id));

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Usuario no encontrado",
        message: "La sesión no es válida"
      });
    }

    // buscamos los datos del trabajador
    let trabajadorData: unknown = null;
    const roles = (user.roles as string[]) || [];
    if (roles.includes("user_trabajador")) {
      const responseApi = await api.postJson<Record<string, unknown>>(
        "company/informacion_trabajador",
        {
          cedtra: user.numero_documento
        },
        {
          auth: true
        }
      );
      if (responseApi.success) {
        trabajadorData = responseApi.data || null;
      }
    }

    return {
      message: "Verification successful",
      valid: true,
      expires_at: jwtPayload.exp,
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        roles: user.roles,
        disabled: user.disabled,
        is_active: user.is_active,
        tipo_documento: user.tipo_documento,
        numero_documento: user.numero_documento,
        nombres: user.nombres,
        apellidos: user.apellidos,
        permissions: permissionsData(user.roles as string[]),
        trabajador: trabajadorData
      }
    };
  };

  const adviser = async (event: H3Event, credentials: LoginCredentials) => {
    const { user, isValid } = await validateCredentials(credentials);

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: "Bad credentials (password)"
      });
    }

    if (!user) {
      throw createError({
        status: 401,
        message: "Bad credentials (user not found)"
      });
    }

    let adviserSesion = null;
    let adviserData: unknown = null;

    // valida en user.roles si hay rol de adviser
    if (user.roles.includes("adviser")) {
      throw createError({
        status: 400,
        message: "Bad request (adviser user not supported)"
      });
    }

    let trabajadorSesion = null;
    let trabajadorData: unknown = null;

    // usamos la api_sisuweb
    const responseApi = await api.getJson<Record<string, unknown>>(
      "usuarios/trae_usuario/" + user.username,
      {
        auth: true
      }
    );

    if (!responseApi.success) {
      throw createError({
        status: 500,
        message: "Error al obtener datos del asesor"
      });
    }

    // procesar dataApi.data
    adviserData = responseApi.data || null;

    if (!adviserData) {
      throw createError({
        status: 500,
        message: "Error al obtener datos del asesor"
      });
    }

    const ad = adviserData as Record<string, unknown>;
    const estadoAdviser = (ad.estado as string) || null;

    if (!estadoAdviser || estadoAdviser !== "A") {
      throw createError({
        status: 400,
        message: "Bad request (estado del asesor no activo)"
      });
    }

    adviserSesion = {
      estado: estadoAdviser,
      phone: ad.telefono as string,
      email: ad.email as string,
      codigo_funcionario: ad.tipfun as string,
      tipo_funcionario: ad.tipfun_detalle as string
    };

    // valida en user.roles si hay rol de user_trabajador
    if (user.roles.includes("user_trabajador")) {
      // usamos la api_sisuweb
      const responseApi = await api.postJson<Record<string, unknown>>(
        "company/informacion_trabajador",
        {
          cedtra: user.numero_documento
        },
        {
          auth: true
        }
      );
      if (responseApi.success) {
        // procesar dataApi.data
        trabajadorData = responseApi.data || null;

        if (trabajadorData && typeof trabajadorData === 'object') {
          const td = trabajadorData as Record<string, unknown>;
          trabajadorSesion = {
            nit: td.nit as string,
            estado: td.estado as string,
            sucursal: td.codsuc as string,
            phone: td.telefono as string,
            email: td.email as string
          };
        }
      }
    }

    const userSession = createUserSession(
      user,
      trabajadorSesion,
      adviserSesion
    );

    await setUserSession(event, {
      user: userSession,
      loggedInAt: new Date()
    });

    await userSrv.updateLastLogin(user.id);

    // consultar puntos del asesor
    const dataPuntos = await api.getJson<Record<string, unknown>>(
      "creditos/puntos-asesor/" + user.username,
      {
        auth: true
      }
    );

    if (!dataPuntos.success) {
      throw createError({
        status: 500,
        message: "Error al obtener puntos del asesor"
      });
    }

    const puntosAsesor = dataPuntos.data || null;

    const token = await createToken(user);

    return {
      message: "Login successful",
      user: userSession,
      adviser: adviserData,
      trabajador: trabajadorData,
      puntos_asesorias: puntosAsesor,
      access_token: token,
      token_type: "bearer"
    };
  };

  const _recovery = async (_event: H3Event, _payload: RecoveryPayload) => {
    return {
      message: "Recovery successful"
    };
  };

  const register = async (event: H3Event, payload: RegisterPayload) => {
    // valda si el nombre de usuario ya está en uso
    const usernameExists = await userSrv.findByUsername(payload.username);
    if (usernameExists) {
      throw createError({
        status: 409,
        message: "Username already in use"
      });
    }

    const full_name = `${payload.nombres} ${payload.apellidos}`;
    const pin = generateRandomPin();
    const pinSentAt = Date.now();

    const userData = {
      username: payload.username,
      email: payload.email,
      roles: ["user_trabajador"],
      full_name: full_name,
      phone: payload.telefono,
      disabled: false,
      is_active: true,
      tipo_documento: payload.tipo_documento,
      numero_documento: payload.numero_documento,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      last_login: new Date().toISOString(),
      email_verified_at: null,
      remember_token: `pin_sent:${pinSentAt}`,
      pin_verification: pin,
      password_hash: bcrypt.hashSync(payload.password, 10)
    };

    const user = await userSrv.createUserTrabajador(userData);

    const userForToken: UserWithPassword = {
      id: Number(user.id),
      username: user.username,
      email: user.email || "",
      full_name: user.full_name || "",
      password_hash: user.password_hash,
      roles: (user.roles as string[]) || [],
      numero_documento: user.numero_documento
    };

    await sendVerificationEmail(
      user.email,
      pin,
      "Gracias por registrarte en Comfaca Credito"
    );

    const token = await createToken(userForToken);

    return {
      message: "Register successful",
      user,
      pin,
      access_token: token,
      token_type: "bearer"
    };
  };

  const verifyCode = async (event: H3Event, payload: VerifyCodePayload) => {
    const user = await userSrv.findByDocumento(payload.coddoc, payload.documento);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Usuario no encontrado"
      });
    }

    const normalizedCode = payload.codigo.replace(/\D/g, "").padStart(4, "0").slice(-4);
    const storedPin = (user.pin_verification || "").padStart(4, "0");

    if (!storedPin || storedPin !== normalizedCode) {
      throw createError({
        statusCode: 401,
        message: "Código inválido o expirado"
      });
    }

    const verifiedUser = await userSrv.markPinVerified(Number(user.id));

    const userForToken: UserWithPassword = {
      id: Number(verifiedUser.id),
      username: verifiedUser.username,
      email: verifiedUser.email || "",
      full_name: verifiedUser.full_name || "",
      password_hash: verifiedUser.password_hash,
      roles: (verifiedUser.roles as string[]) || [],
      numero_documento: verifiedUser.numero_documento
    };

    const userSession = createUserSession(userForToken, null, null);

    await setUserSession(event, {
      user: userSession,
      loggedInAt: new Date()
    });

    const token = await createToken(userForToken);

    return {
      message: "Verificación exitosa",
      user: verifiedUser,
      access_token: token,
      token_type: "bearer"
    };
  };

  const resendCode = async (payload: ResendCodePayload) => {
    const user = await userSrv.findByDocumento(payload.coddoc, payload.documento);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Usuario no encontrado"
      });
    }

    const lastSentAt = getPinSentAt(user.remember_token);
    if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000
      );
      throw createError({
        statusCode: 429,
        message: `Debes esperar ${remainingSeconds} segundos antes de solicitar un nuevo código`
      });
    }

    const pin = generateRandomPin();
    const pinSentAt = Date.now();

    await userSrv.updatePinVerification(Number(user.id), pin, pinSentAt);

    await sendVerificationEmail(
      user.email,
      pin,
      "Nuevo código de verificación - Comfaca Credito"
    );

    return {
      message: "Código reenviado correctamente",
      cooldown_seconds: RESEND_COOLDOWN_MS / 1000
    };
  };

  return {
    login,
    validateCredentials,
    createUserSession,
    verify,
    adviser,
    _recovery,
    register,
    verifyCode,
    resendCode
  };
};

export default authService;
