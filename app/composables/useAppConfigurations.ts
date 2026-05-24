import { ref } from "vue";
import { storage } from "~/composables/useStorage";
import type { AppConfiguration } from "~~/shared/types/configuration";

// Cache local para configuraciones
const configCache = ref<AppConfiguration[]>([]);

export const useAppConfigurations = () => {
  const getConfig = async (clave: string): Promise<string | null> => {
    // Cargar desde storage solo si el cache está vacío
    if (!configCache.value) {
      try {
        const stored = await storage.getItem("app_configurations");
        console.log(stored);
        if (stored) {
          configCache.value = JSON.parse(stored) as AppConfiguration[];
        } else {
          configCache.value = [];
        }
      } catch {
        configCache.value = [];
      }
    }

    return configCache.value.find((o) => o.clave === clave)?.valor ?? null;
  };

  const getAppConfiguration = async (clave: string): Promise<string | null> => {
    return getConfig(clave);
  };

  return {
    getConfig,
    getAppConfiguration
  };
};
