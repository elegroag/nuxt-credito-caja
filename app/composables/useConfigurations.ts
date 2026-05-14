import { storage } from "~/composables/useStorage";
import { useApi } from "~/composables/useApi";

const CONFIGURATIONS_KEY = "app_configurations";
const CONFIGURATIONS_TIMESTAMP_KEY = "app_configurations_timestamp";
const CONFIGURATIONS_TTL_MS = 5 * 60 * 1000;

export interface AppConfiguration {
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  editable: boolean;
  required: boolean;
}

export function useConfigurations() {
  const api = useApi();
  const configurations = ref<AppConfiguration[]>([]);
  const isLoaded = ref(false);

  const loadConfigurationsFromAPI = async (): Promise<AppConfiguration[]> => {
    const response = await api.getJson<AppConfiguration[]>("/api/configurations", {
      auth: true
    });
    return response;
  };

  const saveConfigurationsToStorage = async (
    configs: AppConfiguration[]
  ): Promise<void> => {
    await storage.setItem(CONFIGURATIONS_KEY, JSON.stringify(configs));
    await storage.setItem(
      CONFIGURATIONS_TIMESTAMP_KEY,
      Date.now().toString()
    );
  };

  const loadConfigurationsFromStorage =
    async (): Promise<AppConfiguration[] | null> => {
      const cached = await storage.getItem(CONFIGURATIONS_KEY);
      if (!cached) return null;
      try {
        return JSON.parse(cached) as AppConfiguration[];
      } catch {
        return null;
      }
    };

  const isCacheValid = async (): Promise<boolean> => {
    const timestamp = await storage.getItem(CONFIGURATIONS_TIMESTAMP_KEY);
    if (!timestamp) return false;
    const age = Date.now() - parseInt(timestamp, 10);
    return age < CONFIGURATIONS_TTL_MS;
  };

  const loadConfigurations = async (forceRefresh = false) => {
    if (forceRefresh) {
      const configs = await loadConfigurationsFromAPI();
      await saveConfigurationsToStorage(configs);
      configurations.value = configs;
      isLoaded.value = true;
      return;
    }

    const cached = await loadConfigurationsFromStorage();
    const cacheValid = await isCacheValid();

    if (cached && cacheValid) {
      configurations.value = cached;
      isLoaded.value = true;
      return;
    }

    const configs = await loadConfigurationsFromAPI();
    await saveConfigurationsToStorage(configs);
    configurations.value = configs;
    isLoaded.value = true;
  };

  const refreshConfigurations = async () => {
    await loadConfigurations(true);
  };

  const updateConfiguration = async (
    clave: string,
    valor: string
  ): Promise<AppConfiguration> => {
    const response = await api.putJson<AppConfiguration>(
      `/api/configurations/${clave}`,
      { valor },
      { auth: true }
    );
    return response;
  };

  const getConfigurationValue = (
    key: string,
    defaultValue: string = ""
  ): string => {
    const config = configurations.value.find((c) => c.clave === key);
    return config?.valor ?? defaultValue;
  };

  const getConfigurationAsNumber = (
    key: string,
    defaultValue: number = 0
  ): number => {
    const config = configurations.value.find((c) => c.clave === key);
    if (!config) return defaultValue;
    const parsed = parseFloat(config.valor);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const getConfigurationAsBoolean = (
    key: string,
    defaultValue: boolean = false
  ): boolean => {
    const config = configurations.value.find((c) => c.clave === key);
    if (!config) return defaultValue;
    return config.valor === "true" || config.valor === "1";
  };

  return {
    configurations: readonly(configurations),
    isLoaded: readonly(isLoaded),
    loadConfigurations,
    refreshConfigurations,
    updateConfiguration,
    getConfigurationValue,
    getConfigurationAsNumber,
    getConfigurationAsBoolean
  };
}