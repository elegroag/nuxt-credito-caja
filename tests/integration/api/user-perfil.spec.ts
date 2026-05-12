import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest'
import { fetch } from 'ofetch'

const BASE_URL = 'http://localhost:4000'

let sessionCookie: string

async function doLogin() {
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'Admin123$.',
    }),
  })
  const setCookieHeader = loginResponse.headers.get('set-cookie')
  if (setCookieHeader) {
    sessionCookie = setCookieHeader.split(';')[0]
  }
}

describe('GET /api/user/perfil — integración', () => {
  beforeAll(async () => {
    await doLogin()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('autenticación', () => {
    it('retorna 401 cuando no hay sesión', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'GET',
      })
      expect(response.status).toBe(401)
    })

    it('retorna 401 cuando el token en authorization es inválido', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'GET',
        headers: { Authorization: 'Bearer token-invalido' },
      })
      expect(response.status).toBe(401)
    })
  })

  describe('respuesta con sesión válida', () => {
    it('retorna 200 cuando la cookie de sesión es válida', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      expect(response.status).toBe(200)
    })

    it('retorna estructura esperada con campos de usuario', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: expect.any(Number),
        username: expect.any(String),
        email: expect.any(String),
        full_name: expect.any(String),
        roles: expect.any(Array),
        is_active: expect.any(Boolean),
      })
    })

    it('contiene campos personales del usuario', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      const data = await response.json()

      const user = data.data
      expect(user).toHaveProperty('nombres')
      expect(user).toHaveProperty('apellidos')
      expect(user).toHaveProperty('phone')
      expect(user).toHaveProperty('tipo_documento')
      expect(user).toHaveProperty('numero_documento')
    })

    it('contiene timestamps de creación y actualización', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      const data = await response.json()

      expect(data.data).toHaveProperty('created_at')
      expect(data.data).toHaveProperty('updated_at')
    })
  })
})

describe('PUT /api/user/perfil — integración', () => {
  beforeAll(async () => {
    await doLogin()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('autenticación', () => {
    it('retorna 401 cuando no hay header authorization ni cookie', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres: 'Juan' }),
      })
      expect(response.status).toBe(401)
    })

    it('retorna 401 cuando el token en authorization es inválido', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-invalido',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombres: 'Juan' }),
      })
      expect(response.status).toBe(401)
    })
  })

  describe('respuesta con sesión válida', () => {
    it('retorna 401 sin authorization header (el PUT requiere header explícito)', async () => {
      const response = await fetch(`${BASE_URL}/api/user/perfil`, {
        method: 'PUT',
        headers: {
          Cookie: sessionCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombres: 'Juan Actualizado' }),
      })
      expect(response.status).toBe(401)
    })
  })
})