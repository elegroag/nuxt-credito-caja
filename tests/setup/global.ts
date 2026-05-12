import { vi, beforeAll, afterAll, afterEach } from 'vitest'

beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

afterAll(() => {
  vi.resetAllMocks()
})