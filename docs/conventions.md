# Code Conventions

This document outlines the code style and conventions used in the Nuxt 4 + TypeScript project.

## Table of Contents

- [ESLint Configuration](#eslint-configuration)
- [TypeScript Strict Mode](#typescript-strict-mode)
- [Vue 3 Composition API](#vue-3-composition-api)
- [Zod Validation](#zod-validation)
- [Nuxt UI Patterns](#nuxt-ui-patterns)
- [Naming Conventions](#naming-conventions)

---

## ESLint Configuration

The project uses **@nuxt/eslint** with the following setup:

```javascript
// eslint.config.mjs
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintConfigPrettier from "eslint-config-prettier";

export default withNuxt({}, [
  eslintConfigPrettier,
  {
    rules: {
      "no-trailing-spaces": ["error"]
    }
  }
]);
```

### ESLint Stylistic Rules (nuxt.config.ts)

```typescript
eslint: {
  config: {
    stylistic: {
      commaDangle: "never",    // No trailing commas
      braceStyle: "1tbs"       // One True Brace Style
    }
  }
}
```

### Key Rules

- **No trailing commas** on function parameters, array elements, or object properties
- **1TBS brace style**: opening brace on the same line
- **No trailing spaces** at end of lines
- **Prettier integration**: eslint-config-prettier disables conflicting rules

### Running Lint

```bash
pnpm lint          # Run ESLint on all files
pnpm typecheck     # Run Nuxt typecheck
```

---

## TypeScript Strict Mode

The project uses Nuxt's built-in TypeScript configuration with references to four tsconfig files:

```json
// tsconfig.json (root)
{
  "references": [
    { "path": ".nuxt/tsconfig.app.json" },
    { "path": ".nuxt/tsconfig.server.json" },
    { "path": ".nuxt/tsconfig.shared.json" },
    { "path": ".nuxt/tsconfig.node.json" }
  ]
}
```

### Path Aliases

| Alias | Resolution |
|-------|------------|
| `@/*` | `./app/*` |
| `~/*` | `./app/*` |
| `~~/*` | `./*` |
| `@@/*` | `./*` |

### Type Roots

Types are resolved from:
- `./shared/types`
- `./node_modules/@types`

### Best Practices

1. **Always use explicit types** for function parameters and return values
2. **Avoid `any`**: Use `unknown` and narrow the type
3. **Use strict null checks**: Handle `null` and `undefined` explicitly
4. **Prefer interfaces** for object shapes over type aliases when possible
5. **Use type imports** (`import type { Foo }`) when only importing types

---

## Vue 3 Composition API

### Script Setup

Use `<script setup lang="ts">` for all Vue components:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { z } from 'zod'

interface Props {
  title: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', value: string): void
}>()
</script>
```

### Composables Naming

Composables use the `use` prefix and follow a clear naming pattern:

```
use<Feature>.ts
```

Examples:
- `useLogin.ts` - Authentication login logic
- `useSolicitudValidation.ts` - Solicitud form validation
- `useAdminDashboard.ts` - Admin dashboard logic

### Composable Structure

```typescript
// app/composables/useExample.ts
export function useExample() {
  // State
  const data = ref(null)
  
  // Computed
  const processedData = computed(() => data.value)
  
  // Methods
  async function fetchData() { /* ... */ }
  
  // Return public API
  return {
    data,
    processedData,
    fetchData
  }
}
```

### Component Organization

Components are organized by feature in subdirectories:

```
components/
├── admin/          # Admin-related components
├── auth/           # Authentication components
├── dashboard/      # Dashboard components
├── shared/         # Reusable components
├── solicitud/      # Solicitud-related components
├── solicitudes/    # Solicitudes list components
└── wizard/         # Wizard/step form components
    └── steps/      # Individual wizard steps
```

### Page Organization

Pages use Nuxt 4 routing conventions with groups:

```
pages/
├── (auth)/         # Auth layout group
├── (public)/       # Public layout group
├── admin/          # Admin section (dashboard layout)
│   ├── solicitudes/
│   │   ├── index.vue       # List
│   │   ├── show/[id].vue    # Detail
│   │   └── edit/[id].vue    # Edit
│   └── users/
└── dash/           # User dashboard section
    └── solicitud/
        └── [id].vue        # Dynamic route
```

### definePageMeta

Always specify layout and other page metadata:

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})
</script>
```

---

## Zod Validation

### Schema Definition Pattern

Define schemas at the top of files using `z.object()`:

```typescript
import { z } from 'zod'

const bodySchema = z.object({
  username: z.string().min(3, "Username debe tener al menos 3 caracteres"),
  password: z.string().min(8, "Password debe tener al menos 8 caracteres")
})
```

### Server API Validation

Use `readValidatedBody` with Zod schemas for type-safe request handling:

```typescript
import type { H3Event } from 'h3'
import { defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { CustomResponse } from '~~/server/utils/customResponse'

const bodySchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8)
})

export default defineEventHandler(async (event: H3Event) => {
  const { username, password } = await readValidatedBody(
    event,
    bodySchema.parse
  )
  // ... handler logic
})
```

### Client-Side Validation

```typescript
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional()
})

// In component
const form = ref({
  name: "",
  email: "",
  phone: ""
})

const errors = ref<Record<string, string>>({})

const validateField = (field: keyof typeof form.value) => {
  const result = formSchema.safeParse({ ...form.value })
  if (!result.success) {
    const fieldError = result.error.issues.find(e => e.path[0] === field)
    if (fieldError) {
      errors.value[field] = fieldError.message
    }
  }
}

const submitForm = async () => {
  const result = formSchema.safeParse(form.value)
  if (!result.success) {
    result.error.issues.forEach((e) => {
      errors.value[e.path[0] as string] = e.message
    })
    return
  }
  // Handle valid form
}
```

### Complex Schemas with Enums

```typescript
const tipoPersonaSchema = z.enum(["natural", "juridica"])

const solicitanteSchema = z.object({
  tipo_persona: z.union([
    tipoPersonaSchema,
    z.object({ label: z.string(), value: tipoPersonaSchema })
  ]).optional(),
  genero: z.enum(["M", "F", "O"]).optional(),
  rol_en_solicitud: z.enum(["T", "S", "C", "E"]).optional()
})
```

---

## Nuxt UI Patterns

### Button Component

```vue
<UButton
  color="primary"
  size="md"
  :loading="isLoading"
  @click="handleClick"
>
  <template #leading>
    <UIcon name="i-lucide-plus" class="w-4 h-4" />
  </template>
  Button Text
</UButton>
```

### Icon Usage

Use the `i-` prefix for Iconify icons:

```vue
<UIcon name="i-lucide-user" class="w-5 h-5" />
<UIcon name="i-lucide-mail" class="w-4 h-4" />
<UIcon name="i-lucide-check" class="w-10 h-10 text-primary" />
```

### Form Layout

```vue
<form @submit.prevent="submitForm">
  <div class="grid sm:grid-cols-2 gap-6">
    <div class="relative">
      <label class="block text-sm font-medium text-foreground mb-2">
        Label <span class="text-primary">*</span>
      </label>
      <div class="relative">
        <UIcon name="i-lucide-user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="form.field"
          type="text"
          placeholder="Placeholder"
          class="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-xl border-0 text-foreground"
          :class="{ 'ring-2 ring-red-500/20': errors.field }"
        >
      </div>
      <p v-if="errors.field" class="mt-1 text-xs text-red-500">
        {{ errors.field }}
      </p>
    </div>
  </div>
</form>
```

### Card Layout

```vue
<div class="bg-card rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
  <!-- Card content -->
</div>
```

### Theme Colors

Configured in `nuxt.config.ts`:

```typescript
ui: {
  theme: {
    colors: ["primary", "secondary", "accent", "destructive", "muted"]
  }
}
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Vue Components | PascalCase | `AdminStatsCard.vue` |
| Composables | camelCase with `use` prefix | `useAdminDashboard.ts` |
| Server API | kebab-case HTTP method suffix | `login.post.ts` |
| Types/Interfaces | PascalCase | `SolicitudCreditoPayload` |
| Utilities | camelCase | `tipos_documento.ts` |

### Vue Components

Components are named descriptively with feature prefix:

```vue
<!-- admin components -->
AdminStatsCard.vue
AdminRecentActivity.vue
GestionFirmantes.vue

<!-- feature-specific components -->
SolicitudTimeline.vue
ProgresoSteps.vue

<!-- wizard steps -->
WizardSolicitudCredito.vue
steps/SolicitanteStep.vue
```

### Composables

```typescript
// Named with "use" prefix
useLogin.ts
useAdminDashboard.ts
useSolicitudValidation.ts

// Step-specific validation composables
useConyugeStep.ts
useLaboralStep.ts
useIngresosStep.ts
```

### Server API Routes

```
server/api/
├── auth/
│   ├── login.post.ts
│   └── register.post.ts
├── admin/
│   ├── users/
│   │   ├── index.get.ts
│   │   └── [id].put.ts
│   └── solicitudes/
│       ├── index.get.ts
│       └── [id].put.ts
└── solicitudes/
    └── guardar-solicitud.post.ts
```

### TypeScript Types

```typescript
// Interface naming
interface SolicitudCreditoPayload {
  solicitud: Solicitud
  solicitante: Solicitante
}

// Type alias naming
type ValidationResult = {
  valid: boolean
  errors: Record<string, string>
}

// Enum naming (in enums.ts)
enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA'
}
```

### CSS Classes

Use Tailwind utility classes directly in templates. Custom CSS in `app/assets/css/`.

---

## Additional Resources

- [Nuxt 4 Docs](https://nuxt.com/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Docs](https://zod.dev/)
- [Nuxt UI](https://ui.nuxt.com/)
- [Tailwind CSS](https://tailwindcss.com/)