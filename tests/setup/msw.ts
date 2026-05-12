import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const mswServer = setupServer()

mswServer.use(
  http.post('https://api.example.com/charge', () => {
    return HttpResponse.json({
      id: 'ch_test_123',
      status: 'approved',
      amount: 150000,
    })
  })
)

export function setupMSW() {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'warn' }))
  afterEach(() => mswServer.resetHandlers())
  afterAll(() => mswServer.close())
}