# Comfaca Créditos en Línea

Sistema de gestión de créditos en línea desarrollado para la **Caja de Compensación Familiar del Caquetá (Comfaca)**. Plataforma web que permite a los afiliados solicitar créditos de manera digital, con seguimiento en tiempo real y firma electrónica integrada.

## 🎯 Contexto del Proyecto

Este proyecto moderniza el proceso de solicitud y aprobación de créditos para empleados afiliados a Comfaca. Reemplaza los procesos manuales tradicionales por una experiencia digital completa que incluye:

- **Solicitud de créditos** en línea con carga de documentos
- **Firma digital** de documentos contractual
- **Panel administrativo** para gestión de solicitudes
- **Integración con sistemas externos** (SISU, servicios de firma)

## 🛠️ Tecnologías

### Core

| Tecnología                                    | Versión | Descripción                 |
| --------------------------------------------- | ------- | --------------------------- |
| [Nuxt](https://nuxt.com/)                     | ^4.4.2  | Framework full-stack Vue 3  |
| [Vue](https://vuejs.org/)                     | ^3.5.33 | Framework UI progresivo     |
| [TypeScript](https://www.typescriptlang.org/) | ^6.0.3  | Tipado estático             |
| [Tailwind CSS](https://tailwindcss.com/)      | ^4.2.4  | Framework CSS utility-first |

### UI/UX

| Tecnología                              | Versión | Descripción              |
| --------------------------------------- | ------- | ------------------------ |
| [Nuxt UI](https://ui.nuxt.com/)         | ^4.7.0  | Componentes UI para Nuxt |
| [Lucide Icons](https://lucide.dev/)     | ^1.0.0  | Biblioteca de iconos     |
| [Heroicons](https://heroicons.com/)     | ^2.2.0  | Iconos SVG de Tailwind   |
| [Radix Vue](https://www.radix-vue.com/) | ^1.9.17 | Primitivos UI accesibles |

### Backend & Base de Datos

| Tecnología                                                                         | Versión   | Descripción             |
| ---------------------------------------------------------------------------------- | --------- | ----------------------- |
| [Prisma](https://www.prisma.io/)                                                   | ^7.8.0    | ORM para base de datos  |
| [MariaDB Adapter](https://www.prisma.io/docs/concepts/database-connectors/mariadb) | ^7.8.0    | Conector MariaDB/MySQL  |
| [Nitro](https://nitro.unjs.io/)                                                    | Integrado | Engine de servidor Nuxt |
| [Zod](https://zod.dev/)                                                            | ^4.3.6    | Validación de esquemas  |

### Autenticación & Seguridad

| Tecnología                                                   | Versión | Descripción                 |
| ------------------------------------------------------------ | ------- | --------------------------- |
| [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) | ^0.5.29 | Utilidades de autenticación |
| [jose](https://github.com/panva/jose)                        | ^6.2.2  | Implementación JWT          |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js)             | ^3.0.3  | Hash de contraseñas         |

### Integraciones Externas

- **API SISU**: Sistema de información de usuarios
- **API Firma Digital**: Servicio de firma electrónica de documentos
- **API FlaskPDF**: Generación de documentos PDF

## 📋 Casos de Uso

### Para Afiliados (Front-office)

1. **Registro y Autenticación**
   - Login con credenciales empresariales
   - Recuperación de contraseña
   - Gestión de perfil de usuario

2. **Solicitud de Crédito**
   - Selección de línea de crédito
   - Carga de documentos requeridos
   - Visualización de estado de solicitud
   - Descarga de documentos firmados

3. **Firma Digital**
   - Visualización de documentos contractuales
   - Firma electrónica con OTP
   - Descarga de comprobantes

### Para Administradores (Back-office)

1. **Dashboard Administrativo**
   - Estadísticas de solicitudes por estado
   - Gráficos de convenios activos
   - Monitor de actividad reciente
   - Distribución de usuarios por rol

2. **Gestión de Solicitudes**
   - Listado con filtros avanzados
   - Cambio de estados (postulado → aprobado/rechazado)
   - Revisión de documentos adjuntos
   - Descarga de documentos individuales o masivos

3. **Monitoreo de Firmas**
   - Vista en tiempo real de firmas pendientes
   - Estadísticas de completitud
   - Reenvío de notificaciones

## 🚀 Implementación

### Requisitos Previos

- **Node.js** >= 20.x
- **pnpm** >= 10.x (gestor de paquetes)
- **MariaDB** >= 10.6 o **MySQL** >= 8.0
- Variables de entorno configuradas

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repositorio>
cd nuxt-creditos

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.template .env
# Editar .env con tus configuraciones

# 4. Generar cliente Prisma
pnpm db:generate

# 5. Ejecutar migraciones
pnpm db:migrate

# 6. Iniciar servidor de desarrollo
pnpm dev
```

### Configuración de Variables de Entorno

```env
# Base de datos
DATABASE_URL="mysql://user:password@localhost:3306/comfaca_creditos"

# Servidor
NUXT_PORT=3000
NUXT_HOST=localhost
NUXT_JWT_SECRET="tu-secreto-jwt"

# APIs Externas
API_SISU_URL_DEV="http://localhost:5001"
API_SISU_URL_PRO="http://localhost:5000"
API_SISU_CLIENT_ID="client-id"
API_SISU_PASSWORD="password"

API_FIRMA_URL_DEV=""
API_FIRMA_URL_PRO=""
API_FIRMA_BASIC_USER=""
API_FIRMA_BASIC_PASSWORD=""

API_FLASKPDF_URL=""
API_FLASKPDF_USER=""
API_FLASKPDF_PASSWORD=""
```

### Scripts Disponibles

| Comando            | Descripción                           |
| ------------------ | ------------------------------------- |
| `pnpm dev`         | Servidor de desarrollo con hot-reload |
| `pnpm build`       | Compilación para producción           |
| `pnpm preview`     | Previsualizar build de producción     |
| `pnpm lint`        | Ejecutar ESLint                       |
| `pnpm typecheck`   | Verificación de tipos TypeScript      |
| `pnpm db:generate` | Generar cliente Prisma                |
| `pnpm db:migrate`  | Ejecutar migraciones pendientes       |
| `pnpm db:push`     | Sincronizar esquema con base de datos |
| `pnpm db:seed`     | Ejecutar seeders de datos             |

### Estructura del Proyecto

```
nuxt-creditos/
├── app/                    # Código fuente de la aplicación
│   ├── components/         # Componentes Vue reutilizables
│   │   ├── admin/          # Componentes de panel admin
│   │   ├── dashboard/      # Componentes de dashboard
│   │   ├── notifications/  # Sistema de notificaciones
│   │   └── ui/             # Componentes UI base
│   ├── composables/        # Composables Vue (lógica reutilizable)
│   │   └── admin/          # Composables específicos de admin
│   ├── layouts/            # Layouts de la aplicación
│   ├── middleware/         # Middleware de autenticación
│   ├── pages/              # Rutas de la aplicación
│   │   ├── admin/          # Rutas de administración
│   │   ├── auth/           # Rutas de autenticación
│   │   └── dash/           # Dashboard de usuario
│   └── assets/             # Recursos estáticos (CSS, imágenes)
├── server/                 # API y lógica del servidor
│   ├── api/                # Endpoints de la API
│   ├── middleware/         # Middleware del servidor
│   └── utils/              # Utilidades del servidor
├── shared/                 # Código compartido
│   └── types/              # Definiciones de tipos TypeScript
├── prisma/                 # Esquema y migraciones de Prisma
└── public/                 # Archivos públicos estáticos
```

## 🔐 Seguridad

- **Autenticación JWT**: Sesiones de 8 horas con renovación automática
- **Hash de contraseñas**: bcrypt con salt rounds seguro
- **Validación de entrada**: Zod para todos los endpoints
- **CORS configurado**: Orígenes permitidos explícitamente
- **Headers de seguridad**: Implementados via Nitro

## 📝 Licencia

[MIT](LICENSE) - Caja de Compensación Familiar del Caquetá

---

**Desarrollado con ❤️ para Comfaca**

```bash
curl -X 'POST' \
  'https://comfacaenlinea.com.co:9000/api/creditos/datos-generales' \
  -H 'accept: application/json'
```
