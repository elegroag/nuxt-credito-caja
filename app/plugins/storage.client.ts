import { storage } from "@/composables/useStorage";

export default defineNuxtPlugin(async () => {
  // Inicializar el storage cuando la aplicación se carga
  if (import.meta.client) {
    try {
      // Forzar inicialización del adaptador de storage
      await storage.getItem("__init__");
      console.log("Storage adapter initialized successfully");
    } catch (error) {
      console.error("Error initializing storage adapter:", error);
    }
  }
});
