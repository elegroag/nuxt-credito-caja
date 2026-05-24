import apiSisuweb from "../api-sisuweb";

const datosApiSisuwebService = () => {
  const api = apiSisuweb();

  const dataGeneral = async () => {
    const responseApi = await api.postJson<Record<string, unknown>>(
      "creditos/datos-generales",
      {},
      {
        auth: true
      }
    );
    if (!responseApi) {
      throw createError({
        statusCode: 500,
        message: "Error al obtener los datos generales"
      });
    }
    if (!responseApi.success) {
      throw createError({
        statusCode: 500,
        message: String(responseApi.error || "Error al obtener los datos generales")
      });
    }
    return responseApi.data || null;
  };

  const tipoCreditos = async () => {
    const responseApi = await api.postJson<Record<string, unknown>>(
      "creditos/tipo-creditos",
      {},
      {
        auth: true
      }
    );
    if (!responseApi) {
      throw createError({
        statusCode: 500,
        message: "Error al obtener los tipos de créditos"
      });
    }
    if (!responseApi.success) {
      throw createError({
        statusCode: 500,
        message: String(responseApi.error || "Error al obtener los tipos de créditos")
      });
    }
    return responseApi.data || null;
  };

  const crearSolicitudCredito = async (payload: Record<string, unknown>) => {
    const responseApi = await api.postJson<Record<string, unknown>>(
      "creditos/crear-solicitud",
      payload,
      {
        auth: true
      }
    );
    if (!responseApi) {
      throw createError({
        statusCode: 500,
        message: "Error al crear la solicitud de crédito"
      });
    }
    if (!responseApi.success) {
      throw createError({
        statusCode: 500,
        message: String(responseApi.error || "Error al crear la solicitud de crédito")
      });
    }
    return responseApi.data || null;
  };

  const conyugeTrabajador = async (payload: Record<string, unknown>) => {
    const responseApi = await api.postJson<Record<string, unknown>>(
      "affiliation/listar_conyuges_trabajador",
      payload,
      {
        auth: true
      }
    );
    if (!responseApi) {
      throw createError({
        statusCode: 500,
        message: "Error al obtener el conyuge del trabajador"
      });
    }
    if (!responseApi.success) {
      throw createError({
        statusCode: 500,
        message: String(responseApi.error) || "Error al obtener el conyuge del trabajador"
      });
    }
    return responseApi.data || null;
  };

  const dataFirmaDigitalKeys = async (payload: Record<string, unknown>) => {
    const responseApi = await api.postJson<Record<string, unknown>>(
      "mercurio/firma-digital-keys",
      payload,
      {
        auth: true
      }
    );
    if (!responseApi) {
      throw createError({
        statusCode: 500,
        message: "Error al crear la solicitud de crédito"
      });
    }
    if (!responseApi.success) {
      throw createError({
        statusCode: 500,
        message: String(responseApi.error || "Error al crear la solicitud de crédito")
      });
    }
    return responseApi.data || null;
  };

  return {
    api,
    dataGeneral,
    tipoCreditos,
    crearSolicitudCredito,
    conyugeTrabajador,
    dataFirmaDigitalKeys
  };
};

export default datosApiSisuwebService;
