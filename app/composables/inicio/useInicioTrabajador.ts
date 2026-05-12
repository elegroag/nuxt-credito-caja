import { computed, onMounted, ref } from "vue";
import { useApi } from "~/composables/useApi";
import { useParametros } from "~/composables/useParametros";
import { useSession } from "~/composables/useSession";

export function useInicioTrabajador() {
  const { session } = useSession();
  const { getJson } = useApi();

  const {
    cargarParametros,
    loading: loadingParametros,
    error: errorParametros
  } = useParametros();

  const loadingConvenio = ref(false);
  const errorConvenio = ref<string | null>(null);
  const convenioActivo = ref<ConvenioActivo | null>(null);

  const trabajadorEnSesion = computed<Trabajador | null>(
    () => session.value.user?.trabajador ?? null
  );
  const empresaTrabajador = computed(
    () => trabajadorEnSesion.value?.empresa ?? null
  );

  const cargarConvenioActivo = async () => {
    if (!import.meta.client) return;

    loadingConvenio.value = true;
    errorConvenio.value = null;

    try {
      const response = await getJson<{
        success: boolean
        message: string
        data: ConvenioActivo[]
      }>("/api/convenios/activo", { auth: true });

      // La API devuelve un array, tomamos el primer convenio activo
      const convenios = response.data;
      if (Array.isArray(convenios) && convenios.length > 0) {
        convenioActivo.value = convenios[0] as ConvenioActivo;
      } else {
        convenioActivo.value = null;
      }
    } catch (e: unknown) {
      errorConvenio.value
        = e instanceof Error
          ? e.message
          : "No fue posible cargar el convenio activo";
      convenioActivo.value = null;
    } finally {
      loadingConvenio.value = false;
    }
  };

  const cargarInicioTrabajador = async () => {
    await Promise.all([cargarParametros(), cargarConvenioActivo()]);
  };

  onMounted(async () => {
    await cargarInicioTrabajador();
  });

  const nombreBienvenida = computed(() => {
    const user = session.value.user;
    if (!user) return "";

    if (user.trabajador) {
      const t = user.trabajador;
      const nombres = [t.primer_nombre, t.segundo_nombre]
        .filter(Boolean)
        .join(" ")
        .trim();
      const apellidos = [t.primer_apellido, t.segundo_apellido]
        .filter(Boolean)
        .join(" ")
        .trim();
      return `${nombres} ${apellidos}`.trim();
    }

    const full = `${user.nombres || ""} ${user.apellidos || ""}`.trim();
    if (full) return full;

    return user.username;
  });

  return {
    loadingParametros,
    errorParametros,

    loadingConvenio,
    errorConvenio,

    convenioActivo,
    trabajadorEnSesion,
    empresaTrabajador,

    cargarInicioTrabajador,
    cargarConvenioActivo,
    nombreBienvenida
  };
}
