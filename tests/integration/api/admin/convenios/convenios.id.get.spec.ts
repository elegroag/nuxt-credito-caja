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

describe('GET /api/admin/convenios/:id — integración', () => {
  beforeAll(async () => {
    await doLogin()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  describe('autenticación', () => {
    it('retorna 401 cuando no hay sesión', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/1`, {
        method: 'GET',
      })
      expect(response.status).toBe(401)
    })

    it('retorna 401 cuando el token en authorization es inválido', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/1`, {
        method: 'GET',
        headers: { Authorization: 'Bearer token-invalido' },
      })
      expect(response.status).toBe(401)
    })
  })

  describe('respuesta con sesión válida', () => {
    it('retorna 404 cuando el convenio no existe', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/999999999`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Convenio no encontrado')
    })

    it('retorna estructura esperada con campos de convenio', async () => {
      const listResponse = await fetch(`${BASE_URL}/api/admin/convenios?page=1&limit=1`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      const listData = await listResponse.json()

      if (!listData.data?.empresas || listData.data.empresas.length === 0) {
        it.skip('skip: no hay convenios en la base de datos', () => {})
        return
      }

      const firstConvenio = listData.data.empresas[0]
      const id = firstConvenio.id

      const response = await fetch(`${BASE_URL}/api/admin/convenios/${id}`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: expect.any(String),
        nit: expect.any(String),
        razon_social: expect.any(String),
        estado: expect.any(String),
      })
    })

    it('contiene todos los campos del convenio', async () => {
      const listResponse = await fetch(`${BASE_URL}/api/admin/convenios?page=1&limit=1`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      const listData = await listResponse.json()

      if (!listData.data?.empresas || listData.data.empresas.length === 0) {
        it.skip('skip: no hay convenios en la base de datos', () => {})
        return
      }

      const firstConvenio = listData.data.empresas[0]
      const id = firstConvenio.id

      const response = await fetch(`${BASE_URL}/api/admin/convenios/${id}`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      const data = await response.json()
      const convenio = data.data

      expect(convenio).toHaveProperty('id')
      expect(convenio).toHaveProperty('nit')
      expect(convenio).toHaveProperty('razon_social')
      expect(convenio).toHaveProperty('representante_documento')
      expect(convenio).toHaveProperty('representante_nombre')
      expect(convenio).toHaveProperty('telefono')
      expect(convenio).toHaveProperty('correo')
      expect(convenio).toHaveProperty('fecha_convenio')
      expect(convenio).toHaveProperty('fecha_vencimiento')
      expect(convenio).toHaveProperty('estado')
      expect(convenio).toHaveProperty('direccion')
      expect(convenio).toHaveProperty('ciudad')
      expect(convenio).toHaveProperty('departamento')
      expect(convenio).toHaveProperty('sector_economico')
      expect(convenio).toHaveProperty('numero_empleados')
      expect(convenio).toHaveProperty('tipo_empresa')
      expect(convenio).toHaveProperty('descripcion')
      expect(convenio).toHaveProperty('notas_internas')
      expect(convenio).toHaveProperty('created_at')
      expect(convenio).toHaveProperty('updated_at')
    })

    it('retorna 502 cuando el ID no es numérico (NaN -> BigInt lanza error)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/convenios/abc`, {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      })
      expect(response.status).toBe(502)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('cannot be converted to a BigInt')
    })
  })
})