import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSession } from "~/composables/useSession";
import { usePermissions } from "~/composables/usePermissions";
import type { NavItem } from "#shared/types/layout";

// Estado compartido (singleton)
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);
const userMenuOpen = ref(false);

export function useDashboardLayout() {
  const { session, clearSession } = useSession();
  const { hasPermission, isAdministrator, userRoles } = usePermissions();
  const route = useRoute();
  const router = useRouter();

  const _abbr = (label: string): string => {
    const parts = label
      .split(" ")
      .map(s => s.trim())
      .filter(Boolean);

    const abbr = parts
      .slice(0, 2)
      .map(p => p[0] || "")
      .join("")
      .toUpperCase();

    return abbr || (label.trim()[0] || "").toUpperCase() || "·";
  };

  const navItems: NavItem[] = [
    { label: "Inicio", to: "/dash", abbr: _abbr("Inicio"), icon: "i-lucide-home" },
    {
      label: "Simulador",
      to: "/dash/simulador/lineas-credito",
      abbr: _abbr("Simulador"),
      icon: "i-lucide-calculator",
      requiredRoles: ["user_trabajador", "administrator", "adviser", "user_empresa", "empleador"]
    },
    {
      label: "Contratos",
      to: "/dash/responsabilidades",
      abbr: _abbr("Contratos"),
      icon: "i-lucide-file-signature",
      requiredRoles: ["user_codeudor", "user_trabajador"]
    },
    {
      label: "Mis codeudores",
      to: "/dash/codeudores",
      abbr: _abbr("Codeudores"),
      icon: "i-lucide-users",
      requiredRoles: ["user_trabajador", "administrator"]
    },
    {
      label: "Notificaciones",
      to: "/dash/notify",
      abbr: _abbr("Notificaciones"),
      icon: "i-lucide-bell"
    },
    {
      label: "Gestión firmas",
      to: "/admin/firmas",
      abbr: _abbr("Gestión firmas"),
      icon: "i-lucide-share-2",
      requiredPermissions: ["firmas.view"],
      category: "admin"
    },
    {
      label: "Solicitudes",
      to: "/admin/solicitudes",
      abbr: _abbr("Solicitudes"),
      icon: "i-lucide-list",
      requiredPermissions: ["solicitudes.view"],
      category: "admin"
    },
    {
      label: "Reportes",
      to: "/admin/reportes",
      abbr: _abbr("Reportes"),
      icon: "i-lucide-bar-chart-3",
      adminOnly: true,
      category: "admin"
    },
    {
      label: "Usuarios",
      to: "/admin/users",
      abbr: _abbr("Usuarios"),
      icon: "i-lucide-users",
      adminOnly: true,
      category: "admin"
    },
    {
      label: "Convenios",
      to: "/admin/convenios",
      abbr: _abbr("Convenios"),
      icon: "i-lucide-building-2",
      requiredPermissions: ["convenios.view"],
      excludedRoles: ["user_trabajador"],
      category: "admin"
    },
    {
      label: "Configuraciones",
      to: "/admin/configuraciones",
      abbr: _abbr("Configuraciones"),
      icon: "i-lucide-settings",
      adminOnly: true,
      category: "admin"
    },
    {
      label: "CMS",
      to: "/admin/contenido",
      abbr: _abbr("CMS"),
      icon: "i-lucide-file-text",
      adminOnly: true,
      category: "admin"
    },
    { label: "Perfil", to: "/dash/perfil", abbr: _abbr("Perfil"), icon: "i-lucide-user" },
    {
      label: "Oficinas",
      to: "/dash/oficinas",
      abbr: _abbr("Oficinas"),
      icon: "i-lucide-building-2"
    },
    {
      label: "Terminos",
      to: "/dash/terminos",
      abbr: _abbr("Terminos y condiciones"),
      icon: "i-lucide-file-plus"
    }
  ];

  const isActive = (to: string) => {
    if (to === "/dash")
      return (
        route.path === "/dash"
        || route.path === "/"
        || route.path === "/index"
        || route.name === "index"
      );
    return route.path.startsWith(to);
  };

  // Filtrar items de navegación según los permisos del usuario
  const filteredNavItems = computed(() => {
    return navItems.filter((item) => {
      // Si el item es solo para administrator y el usuario no es administrator, ocultarlo
      if (item.adminOnly && !isAdministrator.value) {
        return false;
      }

      // Si el item requiere permisos específicos, verificarlos
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        const hasAllPermissions = item.requiredPermissions.every(permission =>
          hasPermission(permission)
        );
        if (!hasAllPermissions) {
          return false;
        }
      }

      // Si el item requiere roles específicos, al menos uno debe coincidir
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        const hasRequiredRole = item.requiredRoles.some(role =>
          userRoles.value.includes(role)
        );
        if (!hasRequiredRole) {
          return false;
        }
      }

      // Si el item tiene roles excluidos, verificar que el usuario no tenga esos roles
      if (item.excludedRoles && item.excludedRoles.length > 0) {
        const hasExcludedRole = item.excludedRoles.some(role =>
          userRoles.value.includes(role)
        );
        if (hasExcludedRole) {
          return false;
        }
      }

      // Si no hay restricciones, mostrar el item
      return true;
    });
  });

  // Agrupar items por categoría para mostrar separadores
  const groupedNavItems = computed(() => {
    const items = filteredNavItems.value;
    const grouped: { [key: string]: NavItem[] } = {
      user: [],
      admin: []
    };

    items.forEach((item) => {
      const category = item.category || "user";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  });

  const sectionTitle = computed(() => {
    const hit = filteredNavItems.value.find(x => isActive(x.to));
    return hit?.label || "Inicio";
  });

  const logout = async () => {
    userMenuOpen.value = false;
    clearSession();
    await router.push("/login");
  };

  return {
    session,
    sidebarOpen,
    sidebarCollapsed,
    userMenuOpen,
    navItems: filteredNavItems,
    groupedNavItems,
    sectionTitle,
    isActive,
    logout,
    _abbr
  };
}
