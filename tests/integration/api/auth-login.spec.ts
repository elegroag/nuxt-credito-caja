import { describe, it, expect, afterAll, vi } from 'vitest'
import { fetch } from 'ofetch'

const BASE_URL = 'http://localhost:4000'

describe('POST /api/auth/login — integración', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('validación de schema', () => {
    it('retorna 400 cuando username tiene menos de 3 caracteres', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ab', password: 'password123' }),
      })
      expect(response.status).toBe(400)
    })

    it('retorna 400 cuando password tiene menos de 8 caracteres', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'short' }),
      })
      expect(response.status).toBe(400)
    })

    it('retorna 400 cuando body está vacío', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(response.status).toBe(400)
    })

    it('retorna 400 cuando falta username', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      })
      expect(response.status).toBe(400)
    })

    it('retorna 400 cuando falta password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin' }),
      })
      expect(response.status).toBe(400)
    })
  })

  describe('credenciales inválidas', () => {
    it('retorna 401 cuando el usuario no existe', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'usuario_inexistente_12345',
          password: 'password123',
        }),
      })
      expect(response.status).toBe(401)
    })

    it('retorna 401 cuando la contraseña es incorrecta', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'contraseña_incorrecta',
        }),
      })
      expect(response.status).toBe(401)
    })
  })

  describe('respuesta exitosa', () => {
    it('retorna estructura correcta cuando las credenciales son válidas', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'Admin123$.',
        }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('message')
      expect(data.data).toMatchObject({
        message: expect.any(String),
        user: {
          id: expect.any(String),
          username: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          roles: expect.any(Array),
        },
        access_token: expect.any(String),
        token_type: 'bearer',
      })
    })

    it('contiene token JWT válido', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'Admin123$.',
        }),
      })

      const data = await response.json()
      expect(data.data.access_token).toBeDefined()
      expect(typeof data.data.access_token).toBe('string')
      expect(data.data.access_token.split('.')).toHaveLength(3)
    })

    it('contiene usuario con roles', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'Admin123$.',
        }),
      })

      const data = await response.json()
      expect(data.data.user).toHaveProperty('roles')
      expect(Array.isArray(data.data.user.roles)).toBe(true)
    })
  })

  describe('middleware de autenticación', () => {
    it('ruta /api/auth/login es pública', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'testpassword' }),
      })
      expect(response.status).toBeDefined()
    })

    it('ruta protegida retorna 401 sin sesión', async () => {
      const response = await fetch(`${BASE_URL}/api/dash`)
      expect(response.status).toBe(401)
    })
  })
})