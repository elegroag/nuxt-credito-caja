/**
 * AES-256-GCM encryption/decryption service for secure token generation
 */
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface TokenPayload {
  numero_solicitud: string;
  identificacion: string;
  created_at: string;
  expires_at: string;
}

/**
 * Creates a 32-byte key buffer from a hex-encoded string
 */
export function createKeyFromHex(hexKey: string): Buffer {
  const keyBuffer = Buffer.from(hexKey, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`API_FIRMA_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`);
  }
  return keyBuffer;
}

/**
 * Encrypts a payload object into a URL-safe base64 token
 * Format: iv:authTag:ciphertext (all base64 encoded)
 */
export function encryptPayload(data: TokenPayload, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const ivB64 = iv.toString('base64url');
  const authTagB64 = authTag.toString('base64url');
  const ciphertextB64 = ciphertext.toString('base64url');

  return `${ivB64}:${authTagB64}:${ciphertextB64}`;
}

/**
 * Decrypts a URL-safe base64 token back into a payload object
 * Throws if token is malformed or tampered
 */
export function decryptPayload(token: string, key: Buffer): TokenPayload {
  const parts = token.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts as [string, string, string];

  const iv = Buffer.from(ivB64, 'base64url');
  const authTag = Buffer.from(authTagB64, 'base64url');
  const ciphertext = Buffer.from(ciphertextB64, 'base64url');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString('utf8');

  return JSON.parse(plaintext) as TokenPayload;
}

/**
 * Checks if a token payload has expired
 */
export function isTokenExpired(payload: TokenPayload): boolean {
  const expiresAt = new Date(payload.expires_at);
  return expiresAt.getTime() <= Date.now();
}

/**
 * Generates a firma token for a solicitud
 */
export function generateFirmaToken(
  numeroSolicitud: string,
  identificacion: string,
  validityHours: number = 72
): string {
  const keyHex = process.env.API_FIRMA_KEY;
  if (!keyHex) {
    throw new Error('API_FIRMA_KEY environment variable is not set');
  }

  const key = createKeyFromHex(keyHex);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validityHours * 60 * 60 * 1000);

  const payload: TokenPayload = {
    numero_solicitud: numeroSolicitud,
    identificacion,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString()
  };

  return encryptPayload(payload, key);
}