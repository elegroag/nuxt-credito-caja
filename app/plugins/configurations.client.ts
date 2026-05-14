import { useConfigurations } from "~/composables/admin/useConfigurations";

export default defineNuxtPlugin(async () => {
  const { loadConfigurations } = useConfigurations();
  const { isAuthenticated } = useSession();

  if (import.meta.client) {
    if (isAuthenticated.value) {
      await loadConfigurations(true);
    }

    watch(
      isAuthenticated,
      async (authenticated) => {
        if (authenticated) {
          await loadConfigurations(true);
        }
      },
      { immediate: true }
    );
  }
});
