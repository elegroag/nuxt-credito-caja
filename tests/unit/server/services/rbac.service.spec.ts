/**
 * rbac.service.spec.ts
 *
 * Tests unitarios del resolver RBAC: longest-prefix de rutas y filtros de menú.
 */

import { describe, it, expect } from "vitest";
import {
  canAccessPathWithRules,
  isMenuItemVisible,
  type RouteAccessRule
} from "~~/shared/utils/rbac-rules";

describe("rbac resolver", () => {
  const rules: RouteAccessRule[] = [
    { path_prefix: "/admin", permission_key: "system.admin", ordering: 100 },
    { path_prefix: "/admin/solicitudes", permission_key: "solicitudes.view", ordering: 10 },
    { path_prefix: "/admin/firmas", permission_key: "firmas.view", ordering: 20 },
    { path_prefix: "/api/admin/solicitudes", permission_key: "solicitudes.view", ordering: 10 },
    { path_prefix: "/api/admin", permission_key: "system.admin", ordering: 100 }
  ];

  describe("canAccessPathWithRules (longest prefix)", () => {
    it("deniega sin roles", () => {
      expect(canAccessPathWithRules("/admin/solicitudes", [], ["solicitudes.view"], rules)).toBe(false);
    });

    it("permite administrator siempre", () => {
      expect(canAccessPathWithRules("/admin/users", ["administrator"], [], rules)).toBe(true);
    });

    it("permite con system.admin", () => {
      expect(canAccessPathWithRules("/admin/users", ["adviser"], ["system.admin"], rules)).toBe(true);
    });

    it("elige el prefijo más largo: solicitudes.view gana sobre system.admin en /admin/solicitudes", () => {
      expect(
        canAccessPathWithRules(
          "/admin/solicitudes/123",
          ["adviser"],
          ["solicitudes.view"],
          rules
        )
      ).toBe(true);
    });

    it("deniega adviser en /admin/users (cae en /admin → system.admin)", () => {
      expect(
        canAccessPathWithRules(
          "/admin/users",
          ["adviser"],
          ["solicitudes.view", "firmas.view"],
          rules
        )
      ).toBe(false);
    });

    it("permite API admin de solicitudes con solicitudes.view", () => {
      expect(
        canAccessPathWithRules(
          "/api/admin/solicitudes",
          ["adviser"],
          ["solicitudes.view"],
          rules
        )
      ).toBe(true);
    });

    it("permite rutas sin regla coincidente", () => {
      expect(
        canAccessPathWithRules("/dash/perfil", ["user_trabajador"], [], rules)
      ).toBe(true);
    });

    it("ignora query string al evaluar prefijo", () => {
      expect(
        canAccessPathWithRules(
          "/admin/solicitudes?page=1",
          ["adviser"],
          ["solicitudes.view"],
          rules
        )
      ).toBe(true);
    });
  });

  describe("isMenuItemVisible", () => {
    it("muestra ítem sin restricciones", () => {
      expect(isMenuItemVisible(["user_trabajador"], [], {})).toBe(true);
    });

    it("exige al menos un requiredRole", () => {
      expect(
        isMenuItemVisible(["user_codeudor"], [], {
          requiredRoles: ["user_trabajador", "administrator"]
        })
      ).toBe(false);
      expect(
        isMenuItemVisible(["user_trabajador"], [], {
          requiredRoles: ["user_trabajador", "administrator"]
        })
      ).toBe(true);
    });

    it("oculta por excludedRoles", () => {
      expect(
        isMenuItemVisible(["user_trabajador"], ["convenios.view"], {
          requiredPermissions: ["convenios.view"],
          excludedRoles: ["user_trabajador"]
        })
      ).toBe(false);
    });

    it("exige todos los requiredPermissions (AND)", () => {
      expect(
        isMenuItemVisible(["adviser"], ["solicitudes.view"], {
          requiredPermissions: ["solicitudes.view", "firmas.view"]
        })
      ).toBe(false);
      expect(
        isMenuItemVisible(["adviser"], ["solicitudes.view", "firmas.view"], {
          requiredPermissions: ["solicitudes.view", "firmas.view"]
        })
      ).toBe(true);
    });

    it("administrator bypass de permisos y excludedRoles de menú", () => {
      expect(
        isMenuItemVisible(["administrator"], [], {
          requiredPermissions: ["cms.view"]
        })
      ).toBe(true);
      expect(
        isMenuItemVisible(["administrator", "user_trabajador"], [], {
          requiredPermissions: ["convenios.view"],
          excludedRoles: ["user_trabajador"]
        })
      ).toBe(true);
    });

    it("oculta Convenios a trabajador sin ser admin", () => {
      expect(
        isMenuItemVisible(["user_trabajador"], ["convenios.view"], {
          requiredPermissions: ["convenios.view"],
          excludedRoles: ["user_trabajador"]
        })
      ).toBe(false);
    });
  });
});
