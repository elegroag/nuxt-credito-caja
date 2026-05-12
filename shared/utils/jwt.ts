import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { JwtPayload } from "~~/shared/types/users-session";

const jwtManager = () => {
  /** Duración del token JWT: 24 horas */
  const JWT_EXPIRY = "24h";

  /**
   * Convierte la clave secreta a formato de bytes para `jose`.
   */
  const getSecretKey = (): Uint8Array => {
    const config = useRuntimeConfig();
    if (!config.jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }
    return new TextEncoder().encode(config.jwtSecret as string);
  };

  /**
   * Genera un JWT firmado con los datos del usuario.
   *
   * @param payload - Datos del usuario a incluir en el token
   * @returns Token JWT firmado como string
   */
  const signJwt = async (
    payload: Omit<JwtPayload, "iat" | "exp">
  ): Promise<string> => {
    return new SignJWT({
      sub: String(payload.sub),
      email: payload.email,
      roles: payload.roles
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .setIssuer("sistema-creditos")
      .setAudience("sistema-creditos-users")
      .sign(getSecretKey());
  };

  /**
   * Verifica y decodifica un JWT.
   * Lanza un error si el token es inválido o ha expirado.
   *
   * @param token - Token JWT a verificar
   * @returns Payload decodificado del token
   */
  const verifyJwt = async (token: string): Promise<JwtPayload> => {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "sistema-creditos",
      audience: "sistema-creditos-users"
    });

    return {
      sub: Number(payload.sub),
      email: payload.email as string,
      roles: payload.roles as string[],
      iat: payload.iat,
      exp: payload.exp
    };
  };

  /**
   * Extrae el token JWT de los headers de Authorization.
   * Soporta formato: `Bearer <token>`
   *
   * @param authHeader - Valor del header Authorization
   * @returns Token sin el prefijo "Bearer", o null si no existe
   */
  const extractBearerToken = (
    authHeader: string | undefined
  ): string | null => {
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.slice(7);
  };

  return {
    signJwt,
    verifyJwt,
    extractBearerToken
  };
};

export default jwtManager;
