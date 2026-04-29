import { onMounted } from 'vue'
import { useParametros } from '~/composables/useParametros'

export function useTerminos() {
  const {
    cargarParametros,
    loading: loadingParametros,
    error: errorParametros,
    getMotivosRechazo,
  } = useParametros()

  const cargarTerminos = async () => {
    await cargarParametros()
  }

  onMounted(async () => {
    await cargarTerminos()
  })

  return {
    loadingParametros,
    errorParametros,
    motivosRechazo: getMotivosRechazo,
    cargarTerminos,
  }
}
