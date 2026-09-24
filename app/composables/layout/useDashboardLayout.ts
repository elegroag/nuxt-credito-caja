import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSession } from "~/composables/useSession";
import type { NavItem, NavSectionGroup } from "#shared/types/layout";

// Estado compartido (singleton)
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);
const userMenuOpen = ref(false);
const menuSections = ref<NavSectionGroup[]>([]);
const menuLoading = ref(false);
const menuLoaded = ref(false);
let menuLoadPromise: Promise<void> | null = null;
// Layout, Sidebar y Header usan el composable: la carga y el watch se registran solo en la primera instancia
let menuLifecycleRegistered = false;

/** Limpia caché de menú (llamar en login/logout para no mezclar roles). */
export function clearDashboardMenu() {
  menuLoaded.value = false;
  menuSections.value = [];
  menuLoadPromise = null;
}

const SECTION_TITLE: Record<string, string> = {
  General: "GENERAL",
  Administración: "ADMINISTRACIÓN",
  Parametrización: "PARAMETRIZACIÓN"
};

export function useDashboardLayout() {
  const { session, clearSession } = useSession();
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

  const loadMenu = async (force = false): Promise<void> => {
    if (!import.meta.client) return;
    if (!session.value.accessToken) return;
    if (menuLoaded.value && !force) return;
    if (menuLoadPromise && !force) return menuLoadPromise;

    menuLoadPromise = (async () => {
      menuLoading.value = true;
      try {
        const { useApi } = await import("~/composables/useApi");
        const api = useApi();
        const response = await api.getJson<{
          success: boolean
          data?: {
            sections?: Array<{ name: string, items: Array<{
              key?: string
              label: string
              to: string
              abbr?: string
              icon?: string
              section?: string
              ordering?: number
              requiredPermissions?: string[]
              requiredRoles?: string[]
              excludedRoles?: string[]
            }> }>
            items?: Array<{
              key?: string
              label: string
              to: string
              abbr?: string
              icon?: string
              section?: string
              ordering?: number
            }>
          }
        }>("/api/nav/menu", { auth: true });

        if (!response.success || !response.data) {
          menuSections.value = [];
          menuLoaded.value = false;
          return;
        }

        const sections = response.data.sections || [];
        menuSections.value = sections.map(section => ({
          name: section.name,
          items: (section.items || []).map(item => ({
            key: item.key,
            label: item.label,
            to: item.to,
            abbr: item.abbr || _abbr(item.label),
            icon: item.icon || "i-lucide-circle",
            section: item.section || section.name,
            ordering: item.ordering,
            requiredPermissions: item.requiredPermissions,
            requiredRoles: item.requiredRoles,
            excludedRoles: item.excludedRoles
          }))
        }));
        menuLoaded.value = true;
      } catch {
        menuSections.value = [];
        menuLoaded.value = false;
      } finally {
        menuLoading.value = false;
        menuLoadPromise = null;
      }
    })();

    return menuLoadPromise;
  };

  if (import.meta.client && !menuLifecycleRegistered) {
    menuLifecycleRegistered = true;

    onMounted(() => {
      void loadMenu(true);
    });

    onUnmounted(() => {
      menuLifecycleRegistered = false;
    });

    // Recargar menú si cambian roles (p.ej. tras verify) o el token
    watch(
      () => [
        session.value.accessToken,
        (session.value.user?.roles || []).join(",")
      ] as const,
      ([token, roles], prev) => {
        const prevToken = prev?.[0];
        const prevRoles = prev?.[1];
        if (!token) {
          clearDashboardMenu();
          return;
        }
        if (token !== prevToken || roles !== prevRoles) {
          clearDashboardMenu();
          void loadMenu(true);
        }
      }
    );
  }

  const isActive = (to: string) => {
    if (to === "/dash") {
      return (
        route.path === "/dash"
        || route.path === "/"
        || route.path === "/index"
        || route.name === "index"
      );
    }
    return route.path.startsWith(to);
  };

  const filteredNavItems = computed(() => {
    return menuSections.value.flatMap(section => section.items);
  });

  const groupedNavItems = computed(() => {
    const grouped: Record<string, NavItem[]> = {};
    for (const section of menuSections.value) {
      if (!section.items.length) continue;
      const title = SECTION_TITLE[section.name] || section.name.toUpperCase();
      grouped[title] = section.items;
    }
    return grouped;
  });

  const sectionTitle = computed(() => {
    const hit = filteredNavItems.value.find(x => isActive(x.to));
    return hit?.label || "Inicio";
  });

  const logout = async () => {
    userMenuOpen.value = false;
    clearDashboardMenu();
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
    menuSections,
    menuLoading,
    sectionTitle,
    isActive,
    logout,
    loadMenu,
    _abbr
  };
}
