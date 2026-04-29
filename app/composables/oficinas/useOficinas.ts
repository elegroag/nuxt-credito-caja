import { computed, onMounted, ref } from "vue";
import { useApi } from "~/composables/useApi";
import { useParametros } from "~/composables/useParametros";
import { useSession } from "~/composables/useSession";

export type ConvenioOficina = {
  id: string | number;
  nit: string | number;
  razon_social: string;
  fecha_convenio?: string | null;
  fecha_vencimiento?: string | null;
  estado?: string | null;
  representante_nombre?: string | null;
  representante_documento?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  departamento?: string | null;
  sector_economico?: string | null;
  tipo_empresa?: string | null;
};

export function useOficinas() {
  const { session } = useSession();
  const { getJson } = useApi();

  const {
    cargarParametros,
    loading: loadingParametros,
    error: errorParametros,
    getOficinasCredito,
    getDatosGeneralesCredito,
  } = useParametros();

  const loadingConvenio = ref(false);
  const errorConvenio = ref<string | null>(null);
  const convenioActivo = ref<ConvenioOficina | null>(null);

  const trabajadorEnSesion = computed<Trabajador | null>(
    () => session.value.user?.trabajador ?? null,
  );

  const empresaTrabajador = computed(
    () => trabajadorEnSesion.value?.empresa ?? null,
  );

  const cargarConvenioActivo = async () => {
    if (!process.client) return;

    loadingConvenio.value = true;
    errorConvenio.value = null;

    try {
      const response = await getJson<{
        success: boolean;
        message: string;
        data: { convenio: ConvenioOficina; trabajador?: Trabajador | null };
      }>("/api/convenios/activo", { auth: true });

      convenioActivo.value = response.data?.convenio ?? null;

      if (response.data?.trabajador && session.value.user) {
        session.value.user.trabajador = response.data.trabajador;
      }
    } catch (e: unknown) {
      errorConvenio.value =
        e instanceof Error
          ? e.message
          : "No fue posible cargar el convenio activo";
      convenioActivo.value = null;
    } finally {
      loadingConvenio.value = false;
    }
  };

  const cargarOficinas = async () => {
    await Promise.all([cargarParametros(), cargarConvenioActivo()]);
  };

  onMounted(async () => {
    await cargarOficinas();
  });

  return {
    loadingParametros,
    errorParametros,
    loadingConvenio,
    errorConvenio,
    convenioActivo,
    trabajadorEnSesion,
    empresaTrabajador,
    oficinasCredito: getOficinasCredito,
    datosGeneralesCredito: getDatosGeneralesCredito,
    cargarOficinas,
    cargarConvenioActivo,
  };
}
