import { ref, nextTick } from "vue";
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
    console.log(
      "[ConyugeStep] Buscando datos del cónyuge para trabajador:",
      cedulaTrabajador,
    );
    console.log("[ConyugeStep] Estado de form.conyuge:", props.form.conyuge);

    // Verificar que el objeto conyuge exista
    if (!props.form.conyuge) {
      console.warn(
        "[ConyugeStep] form.conyuge no está disponible, esperando...",
      );
      await nextTick();
      if (!props.form.conyuge) {
        console.error(
          "[ConyugeStep] form.conyuge sigue sin estar disponible después de nextTick",
        );
        loadingLocal.value = false;
        return;
      }
    }

    try {
      const conyuges = await buscarConyuge(cedulaTrabajador, "A");
      console.log("[ConyugeStep] Respuesta de búsqueda:", conyuges);

      if (conyuges.length > 0) {
        const conyugeData = conyuges[0];

        // Validar que conyugeData exista
        if (!conyugeData) {
          console.warn(
            "[ConyugeStep] No se encontraron datos válidos del cónyuge",
          );
          return;
        }

        // Mapear datos del cónyuge al formulario
        if (props.form.conyuge) {
          console.log("[ConyugeStep] Mapeando datos del cónyuge:", conyugeData);
          props.form.conyuge.identificacion = conyugeData.cedcon || "";
          props.form.conyuge.nombres_apellidos = conyugeData.nombre || "";
          props.form.conyuge.ingresos_laborales = conyugeData.salario || 0;
          props.form.conyuge.trabaja = (conyugeData.salario || 0) > 0;
          props.form.conyuge.telefono_movil = conyugeData.telefono || "";
          console.log("[ConyugeStep] Datos mapeados correctamente");

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
      } else {
        console.log(
          "[ConyugeStep] No se encontraron cónyuges para este trabajador",
        );
      }
    } catch (error) {
      console.error("[ConyugeStep] Error buscando datos del cónyuge:", error);
    } finally {
      loadingLocal.value = false;
    }
  };

  // Función modificada para toggleConyuge que busca datos del backend
  const toggleConyugeHandler = async (checked: boolean) => {
    // Primero llamar a toggleConyuge para inicializar/limpiar el objeto
    props.toggleConyuge(checked);

    // Si se está activando el cónyuge y tenemos la cédula del trabajador, buscar datos
    const cedulaTrabajador =
      session.value?.user?.trabajador?.cedula ||
      session.value?.user?.trabajador?.cedtra;
    console.log("[ConyugeStep] Cédula del trabajador:", cedulaTrabajador);
    console.log(
      "[ConyugeStep] Datos del trabajador en sesión:",
      session.value?.user?.trabajador,
    );

    if (checked && cedulaTrabajador) {
      loadingLocal.value = true; // Activar loading solo cuando vamos a buscar

      // Esperar a que Vue actualice la reactividad del objeto conyuge
      await nextTick();

      await buscarDatosConyuge(cedulaTrabajador);
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
