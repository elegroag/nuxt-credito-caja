import prisma from "~~/lib/prisma";

const toNum = (id: bigint | number) => Number(id);

export type RbacListParams = {
  page?: number
  limit?: number
  busqueda?: string
  tipo?: string
  activo?: string | boolean
  section?: string
  active?: string
};

const normalizePage = (page = 1, limit = 20) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
};

const rbacAdminService = () => {
  const listRoles = async (params: RbacListParams = {}) => {
    const { page, limit, skip } = normalizePage(params.page, params.limit);
    const busqueda = params.busqueda?.trim();
    const where: Record<string, unknown> = {};
    if (params.tipo) where.tipo = params.tipo;
    if (params.activo === true || params.activo === "true" || params.activo === "1") {
      where.activo = true;
    } else if (params.activo === false || params.activo === "false" || params.activo === "0") {
      where.activo = false;
    }
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda } },
        { etiqueta: { contains: busqueda } },
        { descripcion: { contains: busqueda } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.roles.count({ where }),
      prisma.roles.findMany({
        where,
        orderBy: [{ tipo: "asc" }, { orden: "asc" }],
        skip,
        take: limit,
        include: {
          role_permissions: {
            include: { permissions: { select: { id: true, key: true, etiqueta: true } } }
          }
        }
      })
    ]);

    const items = rows.map(r => ({
      id: toNum(r.id),
      nombre: r.nombre,
      etiqueta: r.etiqueta,
      descripcion: r.descripcion,
      color: r.color,
      orden: r.orden,
      activo: r.activo,
      tipo: r.tipo,
      permission_keys: r.role_permissions.map(rp => rp.permissions.key),
      permission_ids: r.role_permissions.map(rp => toNum(rp.permissions.id))
    }));

    return {
      items,
      total,
      pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) }
    };
  };

  const getRole = async (id: number) => {
    const r = await prisma.roles.findUnique({
      where: { id: BigInt(id) },
      include: {
        role_permissions: {
          include: { permissions: { select: { id: true, key: true, etiqueta: true } } }
        }
      }
    });
    if (!r) return null;
    const permissions = r.role_permissions.map(rp => ({
      id: toNum(rp.permissions.id),
      key: rp.permissions.key,
      etiqueta: rp.permissions.etiqueta
    }));
    return {
      id: toNum(r.id),
      nombre: r.nombre,
      etiqueta: r.etiqueta,
      descripcion: r.descripcion,
      color: r.color,
      orden: r.orden,
      activo: r.activo,
      tipo: r.tipo,
      permissions,
      permission_keys: permissions.map(p => p.key),
      permission_ids: permissions.map(p => p.id)
    };
  };

  const createRole = async (data: {
    nombre: string
    etiqueta?: string | null
    descripcion?: string | null
    color?: string
    orden?: number
    activo?: boolean
    tipo?: string
  }) => {
    const now = new Date();
    const created = await prisma.roles.create({
      data: {
        nombre: data.nombre.trim(),
        etiqueta: data.etiqueta?.trim() || data.nombre.trim(),
        descripcion: data.descripcion || null,
        color: data.color || "#6B7280",
        orden: data.orden ?? 99,
        activo: data.activo ?? true,
        tipo: data.tipo || "sistema",
        created_at: now,
        updated_at: now
      }
    });
    return getRole(toNum(created.id));
  };

  const updateRole = async (
    id: number,
    data: {
      etiqueta?: string | null
      descripcion?: string | null
      color?: string
      orden?: number
      activo?: boolean
      tipo?: string
    }
  ) => {
    await prisma.roles.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.etiqueta !== undefined ? { etiqueta: data.etiqueta } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.orden !== undefined ? { orden: data.orden } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
        ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
        updated_at: new Date()
      }
    });
    return getRole(id);
  };

  const setRolePermissions = async (roleId: number, permissionIds: number[]) => {
    const unique = [...new Set(permissionIds.map(Number).filter(n => Number.isFinite(n) && n > 0))];
    await prisma.$transaction(async (tx) => {
      await tx.role_permissions.deleteMany({ where: { role_id: BigInt(roleId) } });
      if (unique.length) {
        await tx.role_permissions.createMany({
          data: unique.map(permission_id => ({
            role_id: BigInt(roleId),
            permission_id: BigInt(permission_id)
          })),
          skipDuplicates: true
        });
      }
    });
    return getRole(roleId);
  };

  const listPermissions = async (params: RbacListParams = {}) => {
    const { page, limit, skip } = normalizePage(params.page, params.limit);
    const busqueda = params.busqueda?.trim();
    const where: Record<string, unknown> = {};
    if (params.activo === true || params.activo === "true" || params.activo === "1") {
      where.activo = true;
    } else if (params.activo === false || params.activo === "false" || params.activo === "0") {
      where.activo = false;
    }
    if (busqueda) {
      where.OR = [
        { key: { contains: busqueda } },
        { etiqueta: { contains: busqueda } },
        { descripcion: { contains: busqueda } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.permissions.count({ where }),
      prisma.permissions.findMany({
        where,
        orderBy: { key: "asc" },
        skip,
        take: limit
      })
    ]);

    const items = rows.map(p => ({
      id: toNum(p.id),
      key: p.key,
      etiqueta: p.etiqueta,
      descripcion: p.descripcion,
      activo: p.activo
    }));

    return {
      items,
      total,
      pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) }
    };
  };

  /** Catálogo completo para selects (roles/módulos). */
  const listPermissionsCatalog = async () => {
    const rows = await prisma.permissions.findMany({
      where: { activo: true },
      orderBy: { key: "asc" },
      select: { id: true, key: true, etiqueta: true }
    });
    return rows.map(p => ({
      id: toNum(p.id),
      key: p.key,
      etiqueta: p.etiqueta
    }));
  };

  const createPermission = async (data: {
    key: string
    etiqueta: string
    descripcion?: string | null
    activo?: boolean
  }) => {
    const now = new Date();
    const created = await prisma.permissions.create({
      data: {
        key: data.key.trim(),
        etiqueta: data.etiqueta.trim(),
        descripcion: data.descripcion || null,
        activo: data.activo ?? true,
        created_at: now,
        updated_at: now
      }
    });
    return {
      id: toNum(created.id),
      key: created.key,
      etiqueta: created.etiqueta,
      descripcion: created.descripcion,
      activo: created.activo
    };
  };

  const updatePermission = async (
    id: number,
    data: {
      etiqueta?: string
      descripcion?: string | null
      activo?: boolean
    }
  ) => {
    const updated = await prisma.permissions.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.etiqueta !== undefined ? { etiqueta: data.etiqueta } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
        updated_at: new Date()
      }
    });
    return {
      id: toNum(updated.id),
      key: updated.key,
      etiqueta: updated.etiqueta,
      descripcion: updated.descripcion,
      activo: updated.activo
    };
  };

  const listModules = async (params: RbacListParams = {}) => {
    const { page, limit, skip } = normalizePage(params.page, params.limit);
    const busqueda = params.busqueda?.trim();
    const where: Record<string, unknown> = {};
    if (params.section) where.section = params.section;
    if (params.active === "S" || params.active === "N") where.active = params.active;
    if (busqueda) {
      where.OR = [
        { key: { contains: busqueda } },
        { title: { contains: busqueda } },
        { href: { contains: busqueda } },
        { description: { contains: busqueda } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.modules.count({ where }),
      prisma.modules.findMany({
        where,
        orderBy: [{ section: "asc" }, { ordering: "asc" }],
        skip,
        take: limit,
        include: {
          module_permissions: {
            include: { permissions: { select: { id: true, key: true } } }
          }
        }
      })
    ]);

    const items = rows.map(m => ({
      id: toNum(m.id),
      key: m.key,
      title: m.title,
      href: m.href,
      icon: m.icon,
      abbr: m.abbr,
      section: m.section,
      ordering: m.ordering,
      active: m.active,
      description: m.description,
      required_roles: m.required_roles,
      excluded_roles: m.excluded_roles,
      permission_keys: m.module_permissions.map(mp => mp.permissions.key),
      permission_ids: m.module_permissions.map(mp => toNum(mp.permissions.id))
    }));

    return {
      items,
      total,
      pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) }
    };
  };

  const getModule = async (id: number) => {
    const m = await prisma.modules.findUnique({
      where: { id: BigInt(id) },
      include: {
        module_permissions: {
          include: { permissions: { select: { id: true, key: true, etiqueta: true } } }
        }
      }
    });
    if (!m) return null;
    const permissions = m.module_permissions.map(mp => ({
      id: toNum(mp.permissions.id),
      key: mp.permissions.key,
      etiqueta: mp.permissions.etiqueta
    }));
    return {
      id: toNum(m.id),
      key: m.key,
      title: m.title,
      href: m.href,
      icon: m.icon,
      abbr: m.abbr,
      section: m.section,
      ordering: m.ordering,
      active: m.active,
      description: m.description,
      required_roles: m.required_roles,
      excluded_roles: m.excluded_roles,
      permissions,
      permission_keys: permissions.map(p => p.key),
      permission_ids: permissions.map(p => p.id)
    };
  };

  const createModule = async (data: {
    key: string
    title: string
    href?: string | null
    icon?: string | null
    abbr?: string | null
    section?: string
    ordering?: number
    active?: string
    description?: string | null
    required_roles?: string[] | null
    excluded_roles?: string[] | null
    permission_ids?: number[]
  }) => {
    const now = new Date();
    const created = await prisma.modules.create({
      data: {
        key: data.key.trim(),
        title: data.title.trim(),
        href: data.href || null,
        icon: data.icon || null,
        abbr: data.abbr || null,
        section: data.section || "General",
        ordering: data.ordering ?? 99,
        active: data.active === "N" ? "N" : "S",
        description: data.description || null,
        required_roles: data.required_roles ?? null,
        excluded_roles: data.excluded_roles ?? null,
        created_at: now,
        updated_at: now
      }
    });
    if (data.permission_ids?.length) {
      await setModulePermissions(toNum(created.id), data.permission_ids);
    }
    return getModule(toNum(created.id));
  };

  const updateModule = async (
    id: number,
    data: {
      title?: string
      href?: string | null
      icon?: string | null
      abbr?: string | null
      section?: string
      ordering?: number
      active?: string
      description?: string | null
      required_roles?: string[] | null
      excluded_roles?: string[] | null
      permission_ids?: number[]
    }
  ) => {
    await prisma.modules.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.href !== undefined ? { href: data.href } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.abbr !== undefined ? { abbr: data.abbr } : {}),
        ...(data.section !== undefined ? { section: data.section } : {}),
        ...(data.ordering !== undefined ? { ordering: data.ordering } : {}),
        ...(data.active !== undefined ? { active: data.active === "N" ? "N" : "S" } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.required_roles !== undefined ? { required_roles: data.required_roles } : {}),
        ...(data.excluded_roles !== undefined ? { excluded_roles: data.excluded_roles } : {}),
        updated_at: new Date()
      }
    });
    if (data.permission_ids !== undefined) {
      await setModulePermissions(id, data.permission_ids);
    }
    return getModule(id);
  };

  const setModulePermissions = async (moduleId: number, permissionIds: number[]) => {
    const unique = [...new Set(permissionIds.map(Number).filter(n => Number.isFinite(n) && n > 0))];
    await prisma.$transaction(async (tx) => {
      await tx.module_permissions.deleteMany({ where: { module_id: BigInt(moduleId) } });
      if (unique.length) {
        await tx.module_permissions.createMany({
          data: unique.map(permission_id => ({
            module_id: BigInt(moduleId),
            permission_id: BigInt(permission_id)
          })),
          skipDuplicates: true
        });
      }
    });
  };

  const countUsersWithRole = async (roleName: string): Promise<number> => {
    // users.roles es JSON array de strings (nombres de rol)
    const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
      SELECT COUNT(*) AS c
      FROM users
      WHERE roles IS NOT NULL
        AND JSON_CONTAINS(roles, ${JSON.stringify(roleName)})
    `;
    return Number(rows[0]?.c ?? 0);
  };

  const countFirmantesWithRole = async (roleName: string, etiqueta?: string | null): Promise<number> => {
    const names = [...new Set([roleName, etiqueta].filter((v): v is string => !!v?.trim()))];
    if (!names.length) return 0;
    return prisma.firmantes_solicitud.count({
      where: { rol: { in: names } }
    });
  };

  const deleteRole = async (id: number) => {
    const role = await prisma.roles.findUnique({ where: { id: BigInt(id) } });
    if (!role) {
      throw createError({ statusCode: 404, message: "Rol no encontrado" });
    }
    if (role.nombre === "administrator") {
      throw createError({ statusCode: 400, message: "No se puede eliminar el rol administrator" });
    }

    const [usuariosCount, firmantesCount] = await Promise.all([
      countUsersWithRole(role.nombre),
      countFirmantesWithRole(role.nombre, role.etiqueta)
    ]);

    if (usuariosCount > 0 || firmantesCount > 0) {
      const parts: string[] = [];
      if (usuariosCount > 0) {
        parts.push(`${usuariosCount} usuario${usuariosCount === 1 ? "" : "s"}`);
      }
      if (firmantesCount > 0) {
        parts.push(`${firmantesCount} firmante${firmantesCount === 1 ? "" : "s"}`);
      }
      throw createError({
        statusCode: 400,
        message: `No se puede eliminar el rol: tiene datos asociados (${parts.join(" y ")}). Reasigna o elimina esas asociaciones primero.`
      });
    }

    await prisma.roles.delete({ where: { id: BigInt(id) } });
    return { id };
  };

  const deletePermission = async (id: number) => {
    const perm = await prisma.permissions.findUnique({ where: { id: BigInt(id) } });
    if (!perm) {
      throw createError({ statusCode: 404, message: "Permiso no encontrado" });
    }
    if (perm.key === "system.admin") {
      throw createError({ statusCode: 400, message: "No se puede eliminar el permiso system.admin" });
    }
    await prisma.permissions.delete({ where: { id: BigInt(id) } });
    return { id };
  };

  const deleteModule = async (id: number) => {
    const mod = await prisma.modules.findUnique({ where: { id: BigInt(id) } });
    if (!mod) {
      throw createError({ statusCode: 404, message: "Módulo no encontrado" });
    }
    await prisma.modules.delete({ where: { id: BigInt(id) } });
    return { id };
  };

  return {
    listRoles,
    getRole,
    createRole,
    updateRole,
    setRolePermissions,
    deleteRole,
    listPermissions,
    listPermissionsCatalog,
    createPermission,
    updatePermission,
    deletePermission,
    listModules,
    getModule,
    createModule,
    updateModule,
    setModulePermissions,
    deleteModule
  };
};

export default rbacAdminService;
