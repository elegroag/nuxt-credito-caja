import { computed, useState } from "#imports";
import { storage } from "~/composables/useStorage";

const STORAGE_KEY_V1 = "comfaca_credito_session";
const STORAGE_TOKEN_KEY = "comfaca_credito_access_token";
const STORAGE_TOKEN_TYPE_KEY = "comfaca_credito_token_type";
const STORAGE_USER_KEY = "comfaca_credito_user";
const STORAGE_TRABAJADOR_KEY = "comfaca_credito_trabajador";
const TOKEN_VALIDATION_KEY = "comfaca_token_validation";
const VALIDATION_TTL = 5 * 60 * 1000; // 5 minutos

const emptySession = (): SessionData => ({
  accessToken: "",
  tokenType: "bearer",
  user: null
});

export const useSession = () => {
  const session = useState<SessionData>("session", () => emptySession());
  const hydrated = useState<boolean>("session_hydrated", () => false);
  const hydrationPromise = useState<Promise<void> | null>(
    "session_hydration_promise",
    () => null
  );

  const hydrate = async () => {
    if (!import.meta.client) return;
    if (hydrated.value) return;
    hydrated.value = true;

    try {
      const token = await storage.getItem(STORAGE_TOKEN_KEY);
      const tokenType = await storage.getItem(STORAGE_TOKEN_TYPE_KEY);
      const userRaw = await storage.getItem(STORAGE_USER_KEY);
      const trabajadorRaw = await storage.getItem(STORAGE_TRABAJADOR_KEY);

      if (typeof token === "string" && token) {
        session.value.accessToken = token;
        if (typeof tokenType === "string" && tokenType) {
          session.value.tokenType = tokenType;
        }

        if (typeof userRaw === "string" && userRaw) {
          const u = JSON.parse(userRaw);
          if (u && typeof u === "object") {
            const username = typeof u.username === "string" ? u.username : "";
            const roles = Array.isArray(u.roles)
              ? u.roles.filter((r: any) => typeof r === "string")
              : [];
            const permissions = Array.isArray(u.permissions)
              ? u.permissions.filter((p: any) => typeof p === "string")
              : [];
            const email = typeof u.email === "string" ? u.email : "";
            const tipo_documento
              = typeof u.tipo_documento === "string" ? u.tipo_documento : "";
            const numero_documento
              = typeof u.numero_documento === "string" ? u.numero_documento : "";
            const nombres = typeof u.nombres === "string" ? u.nombres : "";
            const apellidos
              = typeof u.apellidos === "string" ? u.apellidos : "";

            let trabajador: Trabajador | undefined;
            if (typeof trabajadorRaw === "string" && trabajadorRaw) {
              const t = JSON.parse(trabajadorRaw);
              if (t && typeof t === "object") {
                trabajador = t as Trabajador;
              }
            }

            session.value.user = {
              username,
              roles,
              permissions,
              email,
              tipo_documento,
              numero_documento,
              nombres,
              apellidos,
              trabajador
            };
          }
        }
        return;
      }

      const raw = await storage.getItem(STORAGE_KEY_V1);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      const accessToken
        = typeof parsed.accessToken === "string" ? parsed.accessToken : "";
      const ttype
        = typeof parsed.tokenType === "string" ? parsed.tokenType : "bearer";
      let user: SessionUser | null = null;
      if (parsed.user && typeof parsed.user === "object") {
        const username
          = typeof parsed.user.username === "string" ? parsed.user.username : "";
        const roles = Array.isArray(parsed.user.roles)
          ? parsed.user.roles.filter((r: any) => typeof r === "string")
          : [];
        const permissions = Array.isArray(parsed.user.permissions)
          ? parsed.user.permissions.filter((p: any) => typeof p === "string")
          : [];
        const email
          = typeof parsed.user.email === "string" ? parsed.user.email : "";
        const tipo_documento
          = typeof parsed.user.tipo_documento === "string"
            ? parsed.user.tipo_documento
            : "";
        const numero_documento
          = typeof parsed.user.numero_documento === "string"
            ? parsed.user.numero_documento
            : "";
        const nombres
          = typeof parsed.user.nombres === "string" ? parsed.user.nombres : "";
        const apellidos
          = typeof parsed.user.apellidos === "string"
            ? parsed.user.apellidos
            : "";
        user = {
          username,
          roles,
          permissions,
          email,
          tipo_documento,
          numero_documento,
          nombres,
          apellidos
        };
      }

      session.value.accessToken = accessToken;
      session.value.tokenType = ttype;
      session.value.user = user;

      if (accessToken) {
        await storage.setItem(STORAGE_TOKEN_KEY, accessToken);
        await storage.setItem(STORAGE_TOKEN_TYPE_KEY, ttype);
        if (user) {
          await storage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        } else {
          await storage.removeItem(STORAGE_USER_KEY);
        }
        await storage.removeItem(STORAGE_KEY_V1);
      }
    } catch {
      // noop
    }
  };

  if (import.meta.client && !hydrated.value && !hydrationPromise.value) {
    hydrationPromise.value = hydrate();
  }

  const isAuthenticated = computed(() => Boolean(session.value.accessToken));

  const setSession = async (data: SessionData) => {
    session.value = data;
    if (!import.meta.client) return;

    if (data.accessToken) {
      await storage.setItem(STORAGE_TOKEN_KEY, data.accessToken);
      await storage.setItem(STORAGE_TOKEN_TYPE_KEY, data.tokenType || "bearer");
    } else {
      await storage.removeItem(STORAGE_TOKEN_KEY);
      await storage.removeItem(STORAGE_TOKEN_TYPE_KEY);
    }

    if (data.user) {
      const { trabajador, ...userWithoutTrabajador } = data.user;
      await storage.setItem(
        STORAGE_USER_KEY,
        JSON.stringify(userWithoutTrabajador)
      );

      if (trabajador) {
        await storage.setItem(
          STORAGE_TRABAJADOR_KEY,
          JSON.stringify(trabajador)
        );
      } else {
        await storage.removeItem(STORAGE_TRABAJADOR_KEY);
      }
    } else {
      await storage.removeItem(STORAGE_USER_KEY);
      await storage.removeItem(STORAGE_TRABAJADOR_KEY);
    }
  };

  const clearSession = async () => {
    session.value = emptySession();
    if (!import.meta.client) return;
    await storage.removeItem(STORAGE_TOKEN_KEY);
    await storage.removeItem(STORAGE_TOKEN_TYPE_KEY);
    await storage.removeItem(STORAGE_USER_KEY);
    await storage.removeItem(STORAGE_TRABAJADOR_KEY);
    await storage.removeItem(STORAGE_KEY_V1);
    await storage.removeItem(TOKEN_VALIDATION_KEY);
  };

  const validateToken = async (force: boolean = false): Promise<boolean> => {
    if (!import.meta.client || !session.value.accessToken) return false;

    try {
      // Si no se fuerza, verificar cache primero
      if (!force) {
        const cached = await storage.getItem(TOKEN_VALIDATION_KEY);
        if (cached) {
          const { timestamp, valid } = JSON.parse(cached);
          if (Date.now() - timestamp < VALIDATION_TTL && valid) {
            return true;
          }
        }
      }

      // Validar con backend
      const { useApi } = await import("~/composables/useApi");
      const api = useApi();

      const response = await api.getJson<{
        success: boolean
        data: {
          valid: boolean
          user: {
            roles?: unknown
            permissions?: unknown
            trabajador?: Trabajador | null
          }
        }
      }>("/api/auth/verify", { auth: true });

      const isValid = response.success && response.data.valid;

      // Si el token es válido y hay datos de usuario, actualizar la sesión
      if (isValid && response.data.user) {
        const userData = response.data.user;

        // Actualizar roles y permisos del usuario
        if (session.value.user) {
          session.value.user.roles = Array.isArray(userData.roles)
            ? userData.roles.filter(r => typeof r === "string")
            : [];
          session.value.user.permissions = Array.isArray(userData.permissions)
            ? userData.permissions.filter(p => typeof p === "string")
            : [];

          if ("trabajador" in userData) {
            session.value.user.trabajador = userData.trabajador ?? null;
          }

          // Guardar los datos actualizados en storage (separando trabajador)
          const { trabajador, ...userWithoutTrabajador } = session.value.user;
          await storage.setItem(
            STORAGE_USER_KEY,
            JSON.stringify(userWithoutTrabajador)
          );

          if (trabajador) {
            await storage.setItem(
              STORAGE_TRABAJADOR_KEY,
              JSON.stringify(trabajador)
            );
          } else {
            await storage.removeItem(STORAGE_TRABAJADOR_KEY);
          }
        }
      }

      // Guardar en cache
      await storage.setItem(
        TOKEN_VALIDATION_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          valid: isValid
        })
      );

      if (!isValid) {
        await clearSession();
      }

      return isValid;
    } catch (error) {
      console.error("Error validando token:", error);
      await clearSession();
      return false;
    }
  };

  const validateTokenForce = async (): Promise<boolean> => {
    return await validateToken(true);
  };

  const authHeader = computed(() => {
    if (!session.value.accessToken) return {};
    const scheme = (session.value.tokenType || "bearer").trim();
    const normalized = scheme.toLowerCase() === "bearer" ? "Bearer" : scheme;
    return { Authorization: `${normalized} ${session.value.accessToken}` };
  });

  const isLoggedIn = computed(() => {
    return session.value.accessToken !== "";
  });

  return {
    session,
    isAuthenticated,
    setSession,
    clearSession,
    validateToken,
    validateTokenForce,
    authHeader,
    ready: hydrationPromise.value || Promise.resolve()
  };
};
