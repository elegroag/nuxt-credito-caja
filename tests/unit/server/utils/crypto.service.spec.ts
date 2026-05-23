import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptPayload,
  decryptPayload,
  createKeyFromHex,
  isTokenExpired,
  generateFirmaToken,
  type TokenPayload
} from '~~/server/utils/crypto.service';

describe('crypto.service', () => {
  const TEST_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const TEST_KEY = Buffer.from(TEST_KEY_HEX, 'hex');

  describe('createKeyFromHex', () => {
    it('creates a 32-byte buffer from valid hex', () => {
      const key = createKeyFromHex(TEST_KEY_HEX);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('throws for wrong length hex', () => {
      expect(() => createKeyFromHex('too-short')).toThrow('API_FIRMA_KEY must be');
    });
  });

  describe('encryptPayload / decryptPayload', () => {
    const payload: TokenPayload = {
      numero_solicitud: '000003-2026-06',
      identificacion: '12345678',
      created_at: '2026-05-23T12:00:00.000Z',
      expires_at: '2026-05-26T12:00:00.000Z'
    };

    it('encrypts and decrypts roundtrip correctly', () => {
      const token = encryptPayload(payload, TEST_KEY);
      const decrypted = decryptPayload(token, TEST_KEY);

      expect(decrypted).toEqual(payload);
    });

    it('produces different tokens for same payload (random IV)', () => {
      const token1 = encryptPayload(payload, TEST_KEY);
      const token2 = encryptPayload(payload, TEST_KEY);

      expect(token1).not.toBe(token2);
    });

    it('token format is iv:authTag:ciphertext', () => {
      const token = encryptPayload(payload, TEST_KEY);
      const parts = token.split(':');

      expect(parts.length).toBe(3);
      expect(parts[0].length).toBeGreaterThan(0); // iv
      expect(parts[1].length).toBeGreaterThan(0); // authTag
      expect(parts[2].length).toBeGreaterThan(0); // ciphertext
    });

    it('throws on invalid token format', () => {
      expect(() => decryptPayload('invalid', TEST_KEY)).toThrow('Invalid token format');
    });

    it('throws on tampered ciphertext', () => {
      const token = encryptPayload(payload, TEST_KEY);
      const parts = token.split(':');
      parts[2] = Buffer.from('tampered').toString('base64url');
      const tamperedToken = parts.join(':');

      expect(() => decryptPayload(tamperedToken, TEST_KEY)).toThrow();
    });

    it('throws on wrong key', () => {
      const token = encryptPayload(payload, TEST_KEY);
      const wrongKey = Buffer.from('abcdefabcdefabcdefabcdefabcdefabcdef', 'hex');

      expect(() => decryptPayload(token, wrongKey)).toThrow();
    });
  });

  describe('isTokenExpired', () => {
    it('returns false for future date', () => {
      const payload: TokenPayload = {
        numero_solicitud: '000003-2026-06',
        identificacion: '12345678',
        created_at: '2026-05-23T12:00:00.000Z',
        expires_at: '2099-05-26T12:00:00.000Z'
      };

      expect(isTokenExpired(payload)).toBe(false);
    });

    it('returns true for past date', () => {
      const payload: TokenPayload = {
        numero_solicitud: '000003-2026-06',
        identificacion: '12345678',
        created_at: '2026-05-23T12:00:00.000Z',
        expires_at: '2020-01-01T00:00:00.000Z'
      };

      expect(isTokenExpired(payload)).toBe(true);
    });
  });

  describe('generateFirmaToken', () => {
    beforeEach(() => {
      vi.stubEnv('API_FIRMA_KEY', TEST_KEY_HEX);
    });

    it('generates a valid token', () => {
      const token = generateFirmaToken('000003-2026-06', '12345678');

      expect(token).toBeDefined();
      expect(token.split(':').length).toBe(3);
    });

    it('token contains correct payload data', () => {
      const token = generateFirmaToken('000003-2026-06', '12345678', 72);
      const payload = decryptPayload(token, TEST_KEY);

      expect(payload.numero_solicitud).toBe('000003-2026-06');
      expect(payload.identificacion).toBe('12345678');
      expect(payload.created_at).toBeDefined();
      expect(payload.expires_at).toBeDefined();
    });

    it('token expires in correct hours', () => {
      const before = Date.now();
      const token = generateFirmaToken('000003-2026-06', '12345678', 24);
      const payload = decryptPayload(token, TEST_KEY);
      const after = Date.now();

      const expiresMs = new Date(payload.expires_at).getTime();
      const expectedMin = before + 24 * 60 * 60 * 1000;
      const expectedMax = after + 24 * 60 * 60 * 1000;

      expect(expiresMs).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresMs).toBeLessThanOrEqual(expectedMax);
    });

    it('throws if API_FIRMA_KEY not set', () => {
      vi.stubEnv('API_FIRMA_KEY', '');
      expect(() => generateFirmaToken('000003-2026-06', '12345678')).toThrow('API_FIRMA_KEY');
    });
  });
});