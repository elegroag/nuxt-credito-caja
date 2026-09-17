import prisma from "~~/lib/prisma";
import {
  canAccessPathWithRules,
  isMenuItemVisible
} from "~~/shared/utils/rbac-rules";
import type { RouteAccessRule } from "~~/shared/types/users-session";

export type { RouteAccessRule };
export { canAccessPathWithRules, isMenuItemVisible };

export type MenuItemDto = {
  key: string
  label: string
  to: string
  abbr: string
  icon: string
  section: string
  ordering: number
  requiredPermissions: string[]
  requiredRoles: string[]
  excludedRoles: string[]
};

const SECTION_ORDER = ["General", "Administración", "Parametrización"] as const;

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
};

const abbrFromLabel = (label: string, abbr?: string | null): string => {
  if (abbr?.trim()) return abbr.trim().toUpperCase();
  const parts = label.split(" ").map(s => s.trim()).filter(Boolean);
  const built = parts
    .slice(0, 2)
    .map(p => p[0] || "")
    .join("")
    .toUpperCase();
  return built || (label.trim()[0] || "·").toUpperCase();
};

const rbacService = () => {
  const getPermissionsForRoles = async (roleNames: string[]): Promise<string[]> => {
    const names = [...new Set(roleNames.map(String).filter(Boolean))];
    if (names.length === 0) return [];

    const roles = await prisma.roles.findMany({
      where: {
        nombre: { in: names },
        activo: true,
        tipo: "sistema"
      },
      select: {
        role_permissions: {
          select: {
            permissions: {
              select: { key: true, activo: true }
            }
          }
        }
      }
    });

    const keys = new Set<string>();
    for (const role of roles) {
      for (const rp of role.role_permissions) {
        if (rp.permissions.activo) keys.add(rp.permissions.key);
      }
    }
    return [...keys];
  };

  const getRouteAccessRules = async (): Promise<RouteAccessRule[]> => {
    const rows = await prisma.route_permissions.findMany({
      where: { activo: true },
      orderBy: [{ ordering: "asc" }, { path_prefix: "asc" }],
      select: {
        path_prefix: true,
        ordering: true,
        permissions: { select: { key: true, activo: true } }
      }
    });

    return rows
      .filter(r => r.permissions.activo)
      .map(r => ({
        path_prefix: r.path_prefix,
        permission_key: r.permissions.key,
        ordering: r.ordering
      }));
  };

  const canAccessPath = (
    path: string,
    roles: string[],
    permissions: string[],
    rules: RouteAccessRule[]
  ): boolean => {
    return canAccessPathWithRules(path, roles, permissions, rules);
  };

  const getMenuForUser = async (
    roles: string[],
    permissions: string[]
  ): Promise<{ sections: Array<{ name: string, items: MenuItemDto[] }>, items: MenuItemDto[] }> => {
    const modules = await prisma.modules.findMany({
      where: { active: "S", parent_id: null },
      orderBy: [{ section: "asc" }, { ordering: "asc" }],
      include: {
        module_permissions: {
          include: { permissions: { select: { key: true, activo: true } } }
        }
      }
    });

    const items: MenuItemDto[] = [];
    for (const mod of modules) {
      if (!mod.href) continue;

      const requiredRoles = toStringArray(mod.required_roles);
      const excludedRoles = toStringArray(mod.excluded_roles);
      const requiredPermissions = mod.module_permissions
        .filter(mp => mp.permissions.activo)
        .map(mp => mp.permissions.key);

      if (!isMenuItemVisible(roles, permissions, {
        requiredRoles,
        excludedRoles,
        requiredPermissions
      })) {
        continue;
      }

      items.push({
        key: mod.key,
        label: mod.title,
        to: mod.href,
        abbr: abbrFromLabel(mod.title, mod.abbr),
        icon: mod.icon || "i-lucide-circle",
        section: mod.section || "General",
        ordering: mod.ordering,
        requiredPermissions,
        requiredRoles,
        excludedRoles
      });
    }

    const bySection = new Map<string, MenuItemDto[]>();
    for (const item of items) {
      const list = bySection.get(item.section) || [];
      list.push(item);
      bySection.set(item.section, list);
    }

    const sections = SECTION_ORDER
      .filter(name => (bySection.get(name) || []).length > 0)
      .map(name => ({
        name,
        items: (bySection.get(name) || []).sort((a, b) => a.ordering - b.ordering)
      }));

    for (const [name, sectionItems] of bySection.entries()) {
      if ((SECTION_ORDER as readonly string[]).includes(name)) continue;
      sections.push({
        name,
        items: sectionItems.sort((a, b) => a.ordering - b.ordering)
      });
    }

    return { sections, items };
  };

  const listSystemRoles = async () => {
    return prisma.roles.findMany({
      where: { activo: true, tipo: "sistema" },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        etiqueta: true,
        descripcion: true,
        color: true,
        orden: true
      }
    });
  };

  return {
    getPermissionsForRoles,
    getRouteAccessRules,
    canAccessPath,
    getMenuForUser,
    listSystemRoles,
    SECTION_ORDER
  };
};

export default rbacService;
