import apiSisuweb from "../api-sisuweb";

const datosApiSisuwebService = () => {
  const api = apiSisuweb();

  const dataGeneral = async () => {
    const responseApi = await api.postJson<any>(
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
        message: responseApi.error || "Error al obtener los datos generales"
      });
    }
    return responseApi.data || null;
  };

  const tipoCreditos = async () => {
    const responseApi = await api.postJson<any>(
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
        message: responseApi.error || "Error al obtener los tipos de créditos"
      });
    }
    return responseApi.data || null;
  };

  const crearSolicitudCredito = async (payload: any) => {
    const responseApi = await api.postJson<any>(
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
        message: responseApi.error || "Error al crear la solicitud de crédito"
      });
    }
    return responseApi.data || null;
  };

  const conyugeTrabajador = async (payload: any) => {
    const responseApi = await api.postJson<any>(
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
        message:
          responseApi.error || "Error al obtener el conyuge del trabajador"
      });
    }
    return responseApi.data || null;
  };

  return {
    api,
    dataGeneral,
    tipoCreditos,
    crearSolicitudCredito,
    conyugeTrabajador
  };
};

export default datosApiSisuwebService;
