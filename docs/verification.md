# Verification Commands

This document describes all test and verification commands available in the project.

## Prerequisites

```bash
# Install dependencies
pnpm install
```

---

## Development

```bash
pnpm dev
```

Starts the Nuxt development server with hot-reload at `http://localhost:3000`.

---

## Linting

```bash
pnpm lint
```

Runs ESLint on the entire project.

---

## Type Checking

```bash
pnpm typecheck
```

Runs Nuxt typecheck (vue-tsc) for full TypeScript type validation.

---

## Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client from schema |
| `pnpm db:push` | Push schema changes to database (without migrations) |
| `pnpm db:pull` | Pull schema from existing database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:reset` | Reset database (runs migrations from scratch) |
| `pnpm db:seed` | Seed database with initial data |

---

## Testing

### Unit Tests

```bash
# Run all unit tests (server + client)
pnpm test:unit

# Run only server unit tests
pnpm test:unit:server

# Run only client unit tests
pnpm test:unit:client
```

### Integration Tests

```bash
pnpm test:integration
```

### End-to-End Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run e2e tests with Playwright UI
pnpm test:e2e:ui
```

### All Tests

```bash
# Run all vitest tests (unit + integration)
pnpm test

# Run with vitest UI
pnpm test:ui
```

### Coverage

```bash
pnpm test:coverage
```

Generates coverage reports in `./coverage/`.

---

## Coverage Thresholds

The project enforces minimum coverage thresholds:

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 75% |
| Statements | 80% |

Coverage is provided by `@vitest/coverage-v8` and reports are generated in multiple formats (text, json, html, lcov) to `./coverage/`.

---

## CI Order

The CI pipeline runs in this order:

1. **Checkout** - Checkout repository
2. **Install pnpm** - Setup pnpm package manager
3. **Install node** - Setup Node.js (v22)
4. **Install dependencies** - `pnpm install`
5. **Lint** - `pnpm lint`
6. **Typecheck** - `pnpm typecheck`

> **Note**: Unit tests, integration tests, e2e tests, and coverage are not currently in the CI pipeline but should be added for complete verification.

---

## Build Verification

Before running e2e tests, ensure the build works:

```bash
pnpm build
pnpm preview
```

The e2e Playwright configuration includes a web server that automatically builds and previews the application at `http://localhost:3000`.