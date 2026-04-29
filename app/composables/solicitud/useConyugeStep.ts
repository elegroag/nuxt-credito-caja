import { ref } from "vue";
import { useSession } from "~/composables/useSession";
import { useConyugeTrabajador } from "./useConyugeComposable";

export const useConyugeStep = (props: ConyugeProps) => {
  // Obtener datos del trabajador desde la sesión
  const { session } = useSession();

  // Obtener composable de cónyuge
  const { buscarConyuge } = useConyugeTrabajador();

  // Estado local para loading
  const loadingLocal = ref(false);

  // Función para buscar datos del cónyuge usando el composable
  const buscarDatosConyuge = async (cedulaTrabajador: string) => {
    try {
      const conyuges = await buscarConyuge(cedulaTrabajador, "A");

      if (conyuges.length > 0) {
        const conyugeData = conyuges[0];

        // Validar que conyugeData exista
        if (!conyugeData) {
          console.warn("No se encontraron datos válidos del cónyuge");
          return;
        }

        // Mapear datos del cónyuge al formulario
        if (props.form.conyuge) {
          props.form.conyuge.identificacion = conyugeData.cedcon || "";
          props.form.conyuge.nombres_apellidos = conyugeData.nombre || "";
          props.form.conyuge.ingresos_laborales = conyugeData.salario || 0;
          props.form.conyuge.trabaja = (conyugeData.salario || 0) > 0;
          props.form.conyuge.telefono_movil = conyugeData.telefono || "";

          // Cargar datos de la empresa si tiene
          if ((conyugeData.salario || 0) > 0) {
            props.form.informacion_laboral.empresa = {
              nombre: "Empresa del cónyuge", // Valor por defecto ya que no viene en la API
              direccion: conyugeData.direccion || "",
              telefono: conyugeData.telefono || "",
              email: conyugeData.email || "",
            };
          }
        }
      }
    } catch (error) {
      console.error("Error buscando datos del cónyuge:", error);
    } finally {
      loadingLocal.value = false;
    }
  };

  // Función modificada para toggleConyuge que busca datos del backend
  const toggleConyugeHandler = async (checked: boolean) => {
    loadingLocal.value = checked; // Activar loading si se está activando
    props.toggleConyuge(checked);

    // Si se está activando el cónyuge y tenemos la cédula del trabajador, buscar datos
    if (checked && session.value?.user?.trabajador?.cedula) {
      await buscarDatosConyuge(session.value.user.trabajador.cedula);
    } else {
      loadingLocal.value = false;
    }
  };

  // Función para toggle de empresa del cónyuge
  const toggleEmpresaConyuge = (checked: boolean) => {
    if (checked) {
      props.form.conyuge!.empresa = {
        nombre: "",
        direccion: "",
        telefono: "",
        email: "",
      };
    } else {
      props.form.conyuge!.empresa = null;
    }
  };

  return {
    // Estado
    loadingLocal,

    // Funciones
    buscarDatosConyuge,
    toggleConyugeHandler,
    toggleEmpresaConyuge,
  };
};
