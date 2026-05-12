import { computed } from "vue";
import { useSession } from "~/composables/useSession";

export const useTrabajador = () => {
  const { session } = useSession();

  const trabajador = computed<Trabajador | null>(() => {
    return session.value.user?.trabajador || null;
  });

  const empresa = computed(() => {
    return trabajador.value?.empresa || null;
  });

  const salario = computed(() => {
    return trabajador.value?.salario || 0;
  });

  const nombreCompleto = computed(() => {
    if (!trabajador.value) return "";
    const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido }
      = trabajador.value;
    return [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
      .filter(Boolean)
      .join(" ");
  });

  const datosBasicos = computed(() => {
    if (!trabajador.value) return null;
    return {
      cedula: trabajador.value.cedula,
      nombre: nombreCompleto.value,
      email: trabajador.value.email,
      telefono: trabajador.value.telefono,
      direccion: trabajador.value.direccion,
      salario: trabajador.value.salario,
      cargo: trabajador.value.cargo,
      empresa: trabajador.value.empresa?.razon_social
    };
  });

  return {
    trabajador,
    empresa,
    salario,
    nombreCompleto,
    datosBasicos
  };
};
