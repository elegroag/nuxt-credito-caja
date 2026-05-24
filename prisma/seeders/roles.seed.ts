export const roles = [
  {
    id: 1,
    nombre: "administrator",
    etiqueta: "Administrador",
    descripcion: "Administrador del sistema con acceso completo",
    permisos: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "solicitudes.create",
      "solicitudes.read",
      "solicitudes.update",
      "solicitudes.delete",
      "trabajadores.read",
      "empresas.read",
      "reports.read",
      "system.admin"
    ],
    color: "#DC2626",
    orden: 1,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    id: 2,
    nombre: "adviser",
    etiqueta: "Asesor de crédito",
    descripcion: "Asesor de crédito con acceso a solicitudes",
    permisos: [
      "solicitudes.create",
      "solicitudes.read",
      "solicitudes.update",
      "trabajadores.read",
      "empresas.read",
      "reports.read"
    ],
    color: "#2563EB",
    orden: 2,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    id: 3,
    nombre: "user_empresa",
    etiqueta: "Empleador",
    descripcion: "Usuario de empresa que postula créditos",
    permisos: ["solicitudes.create", "solicitudes.read", "solicitudes.update", "empresas.read"],
    color: "#059669",
    orden: 3,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    id: 4,
    nombre: "user_trabajador",
    etiqueta: "Trabajador",
    descripcion: "Usuario trabajador que postula créditos",
    permisos: ["solicitudes.create", "solicitudes.read", "solicitudes.update"],
    color: "#7C3AED",
    orden: 4,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    id: 5,
    nombre: "empleador",
    etiqueta: "Empleador convenio",
    descripcion: "Empleador que gestiona créditos empresariales",
    permisos: [
      "solicitudes.create",
      "solicitudes.read",
      "solicitudes.update",
      "empresas.read",
      "trabajadores.read",
      "firma_digital"
    ],
    color: "#0891B2",
    orden: 5,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    id: 6,
    nombre: "codeudor",
    etiqueta: "Codeudor",
    descripcion: "Codeudor que firma créditos como garante",
    permisos: ["solicitudes.read", "firma_digital"],
    color: "#BE185D",
    orden: 6,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  },
  {
    id: 7,
    nombre: "director",
    etiqueta: "Director",
    descripcion: "Director con acceso a reportes y administración",
    permisos: [
      "users.read",
      "solicitudes.create",
      "solicitudes.read",
      "solicitudes.update",
      "trabajadores.read",
      "empresas.read",
      "reports.read",
      "firma_digital",
      "system.admin"
    ],
    color: "#1E3A5F",
    orden: 7,
    activo: true,
    created_at: "2026-02-25 02:06:11.0",
    updated_at: "2026-02-25 02:06:11.0"
  }
];
