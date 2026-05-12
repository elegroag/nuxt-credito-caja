import { ref, watch, readonly, onMounted } from "vue";

const STORAGE_KEY = "comfaca_simulador_data";

// Estado reactivo para los datos del simulador
const simuladorData = ref<SimuladorStorageData | null>(null);

// Cargar datos desde localStorage
const loadSimuladorData = (): SimuladorStorageData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as SimuladorStorageData;
      simuladorData.value = data;
      // console.log("✅ Datos del simulador cargados desde localStorage:", data);
      return data;
    }
  } catch (error) {
    console.error("Error cargando datos del simulador:", error);
    // Limpiar datos corruptos
    localStorage.removeItem(STORAGE_KEY);
  }
  console.log("⚠️ No se encontraron datos del simulador en localStorage");
  return null;
};

// Guardar datos en localStorage
const saveSimuladorData = (data: SimuladorStorageData): void => {
  try {
    // Validar datos antes de guardar
    if (!data || !data.lineaCredito) {
      throw new Error("Datos del simulador inválidos");
    }

    const dataToStore: SimuladorStorageData = {
      ...data,
      fechaSimulacion: data.fechaSimulacion || new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    simuladorData.value = dataToStore;
  } catch (error) {
    console.error("Error guardando datos del simulador:", error);
  }
};

// Guardar datos sin actualizar el estado reactivo (para evitar recursión)
const saveSimuladorDataSilent = (data: SimuladorStorageData): void => {
  try {
    if (!data || !data.lineaCredito) {
      return;
    }

    const dataToStore: SimuladorStorageData = {
      ...data,
      fechaSimulacion: data.fechaSimulacion || new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.error("Error guardando datos del simulador:", error);
  }
};

// Limpiar datos del simulador
const clearSimuladorData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    simuladorData.value = null;
  } catch (error) {
    console.error("Error limpiando datos del simulador:", error);
  }
};

// Actualizar datos específicos
const updateSimuladorData = (updates: Partial<SimuladorStorageData>): void => {
  if (simuladorData.value) {
    const updatedData = { ...simuladorData.value, ...updates };
    saveSimuladorData(updatedData);
  }
};

// Obtener datos formateados para solicitud
const getDatosParaSolicitud = () => {
  const data = simuladorData.value;
  // console.log('🔍 getDatosParaSolicitud llamado. simuladorData.value:', data)

  if (!data) {
    console.log("❌ No hay datos del simulador disponibles");
    return null;
  }

  const result = {
    lineaCredito: data.lineaCredito,
    valorSolicitud: data.montoCredito,
    plazoMeses: data.plazoMeses,
    tasaInteres: data.tasaInteresAnual,
    cuotaMensual: data.cuotaMensual,
    totalIntereses: data.totalIntereses,
    totalPagar: data.totalPagar,
    fechaSimulacion: data.fechaSimulacion
  };

  // console.log('✅ Datos formateados para solicitud:', result)
  return result;
};

// Verificar si hay datos disponibles
const hasSimuladorData = (): boolean => {
  return simuladorData.value !== null;
};

// Watch para persistir cambios automáticamente
watch(
  simuladorData,
  (newValue) => {
    if (newValue) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      } catch (error) {
        console.error("Error guardando datos del simulador:", error);
      }
    }
  },
  { deep: true }
);

export const useSimuladorStorage = () => {
  // Cargar datos solo después de que el componente se monte en el cliente
  onMounted(() => {
    loadSimuladorData();
  });

  return {
    // Estado
    simuladorData: readonly(simuladorData),

    // Acciones
    loadSimuladorData,
    saveSimuladorData,
    saveSimuladorDataSilent,
    clearSimuladorData,
    updateSimuladorData,

    // Utilidades
    getDatosParaSolicitud,
    hasSimuladorData
  };
};
