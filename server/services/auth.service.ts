import type { H3Event } from "h3";
import bcrypt from "bcryptjs";
import userService from "./user.service";
import apiSisuweb from "./api-sisuweb";
import type {
  UserSession,
  LoginCredentials,
  RegisterPayload,
  RecoveryPayload
} from "~~/shared/types/users-session";
import jwtManager from "~~/shared/utils/jwt";

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

  const createToken = async (user: any) => {
    return await jwt.signJwt({
      sub: user.id,
      email: user.email,
      roles: user.roles
    });
  };

  const validateCredentials = async (
    credentials: LoginCredentials
  ): Promise<{ user: any, isValid: boolean }> => {
    const user = await userSrv.findByUsername(credentials.username);

    if (!user) {
      return { user: null, isValid: false };
    }

    const isPasswordValid = bcrypt.compareSync(
      credentials.password,
      user.password_hash
    );

    return { user, isValid: isPasswordValid };
  };

  const generateRandomPin = (): string => {
    return Math.floor(1000 + Math.random() * 9999).toString();
  };

  const createUserSession = (
    user: any,
    trabajador: any | null,
    adviser: any | null
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
    let trabajadorData: any = null;

    // valida en user.roles si hay rol de user_trabajador
    if (user.roles.includes("user_trabajador")) {
      // usamos la api_sisuweb
      const responseApi = await api.postJson<any>(
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

        if (trabajadorData) {
          trabajadorSesion = {
            nit: trabajadorData.nit,
            estado: trabajadorData.estado,
            sucursal: trabajadorData.codsuc,
            phone: trabajadorData.telefono,
            email: trabajadorData.email
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
    let trabajadorData: any = null;
    const roles = (user.roles as string[]) || [];
    if (roles.includes("user_trabajador")) {
      const responseApi = await api.postJson<any>(
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
    let adviserData: any = null;

    // valida en user.roles si hay rol de adviser
    if (user.roles.includes("adviser")) {
      throw createError({
        status: 400,
        message: "Bad request (adviser user not supported)"
      });
    }

    let trabajadorSesion = null;
    let trabajadorData: any = null;

    // usamos la api_sisuweb
    const responseApi = await api.getJson<any>(
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

    const estadoAdviser = adviserData.estado || null;

    if (!estadoAdviser || estadoAdviser !== "A") {
      throw createError({
        status: 400,
        message: "Bad request (estado del asesor no activo)"
      });
    }

    adviserSesion = {
      estado: estadoAdviser,
      phone: adviserData.telefono,
      email: adviserData.email,
      codigo_funcionario: adviserData.tipfun,
      tipo_funcionario: adviserData.tipfun_detalle
    };

    // valida en user.roles si hay rol de user_trabajador
    if (user.roles.includes("user_trabajador")) {
      // usamos la api_sisuweb
      const responseApi = await api.postJson<any>(
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

        if (trabajadorData) {
          trabajadorSesion = {
            nit: trabajadorData.nit,
            estado: trabajadorData.estado,
            sucursal: trabajadorData.codsuc,
            phone: trabajadorData.telefono,
            email: trabajadorData.email
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
    const dataPuntos = await api.getJson<any>(
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

  const recovery = async (event: H3Event, payload: RecoveryPayload) => {
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
      email_verified_at: new Date().toISOString(),
      remember_token: null,
      password_hash: bcrypt.hashSync(payload.password, 10)
    };

    const user = await userSrv.createUserTrabajador(userData);

    const pin = generateRandomPin();

    const body = `<html>
      <head>
          <title>Gracias por registrarte en Comfaca Credito</title>
      </head>
      <body>
          <h1>Gracias por registrarte en Comfaca Credito</h1>
          <p>Gracias por registrarte en Comfaca Credito. Ahora puedes iniciar sesión con tu correo electrónico y contraseña.</p>
          <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString("es-CO")}</p>
          <p><strong>Entorno:</strong> ${process.env.NODE_ENV}</p>
          <p><strong>PIN:</strong> ${pin}</p>
          <hr>
          <p><small>Este correo fue enviado automáticamente desde el sistema de Comfaca Credito.</small></p>
      </body>
      </html>`;

    await api.postJson<any>(
      "/utils/sender-email",
      {
        body: body,
        subject: "Gracias por registrarte en Comfaca Credito",
        to: user.email
      },
      {
        auth: true
      }
    );

    const token = await createToken(user);

    return {
      message: "Register successful",
      user,
      pin,
      access_token: token,
      token_type: "bearer"
    };
  };

  return {
    login,
    validateCredentials,
    createUserSession,
    verify,
    adviser,
    recovery,
    register
  };
};

export default authService;
