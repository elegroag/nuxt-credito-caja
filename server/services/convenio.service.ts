import apiSisuweb from "./api-sisuweb";
import userService from "./user.service";
import prisma from "~~/lib/prisma";

const convenioService = () => {
  const api = apiSisuweb();
  const userSrv = userService();

  const getConveniosByUser = async (username: string) => {
    // Obtener datos del usuario
    const user = await userSrv.findByUsername(username);

    if (!user || !user.numero_documento) {
      return [];
    }

    // Obtener datos del trabajador desde sisuweb
    const trabajadorData = await api.postJson<any>(
      "company/informacion_trabajador",
      {
        cedtra: user.numero_documento,
      },
      {
        auth: true,
      },
    );

    if (!trabajadorData.success || !trabajadorData.data) {
      return [];
    }

    const nit = BigInt(trabajadorData.data.nit);

    // Buscar convenios por NIT
    const convenios = await prisma.empresas_convenio.findMany({
      where: {
        nit: nit,
        estado: "Activo",
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return convenios.map((convenio: any) => ({
      id: String(convenio.id),
      nit: String(convenio.nit),
      razon_social: convenio.razon_social,
      tipo_empresa: convenio.tipo_empresa,
      numero_empleados: String(convenio.numero_empleados),
      estado: convenio.estado,
      created_at: convenio.created_at?.toISOString() || null,
      updated_at: convenio.updated_at?.toISOString() || null,
    }));
  };

  const getConvenioByNit = async (nit: string) => {
    const convenio = await prisma.empresas_convenio.findFirst({
      where: {
        nit: BigInt(nit),
      },
    });

    if (!convenio) {
      return null;
    }

    return {
      id: String(convenio.id),
      nit: String(convenio.nit),
      razon_social: convenio.razon_social,
      tipo_empresa: convenio.tipo_empresa,
      numero_empleados: String(convenio.numero_empleados),
      estado: convenio.estado,
      created_at: convenio.created_at?.toISOString() || null,
      updated_at: convenio.updated_at?.toISOString() || null,
    };
  };

  const getAllConvenios = async () => {
    const convenios = await prisma.empresas_convenio.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return convenios.map((convenio: any) => ({
      id: String(convenio.id),
      nit: String(convenio.nit),
      razon_social: convenio.razon_social,
      tipo_empresa: convenio.tipo_empresa,
      numero_empleados: String(convenio.numero_empleados),
      estado: convenio.estado,
      created_at: convenio.created_at?.toISOString() || null,
      updated_at: convenio.updated_at?.toISOString() || null,
    }));
  };

  const crearConvenio = async (data: {
    nit: string;
    razon_social: string;
    representante_documento?: string;
    representante_nombre?: string;
    telefono?: string;
    correo?: string;
    fecha_vencimiento?: string;
    estado?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    sector_economico?: string;
    numero_empleados?: number;
    tipo_empresa?: string;
    descripcion?: string;
    notas_internas?: string;
  }) => {
    const convenio = await prisma.empresas_convenio.create({
      data: {
        nit: BigInt(data.nit),
        razon_social: data.razon_social,
        representante_documento: data.representante_documento,
        representante_nombre: data.representante_nombre,
        telefono: data.telefono,
        correo: data.correo,
        fecha_vencimiento: data.fecha_vencimiento
          ? new Date(data.fecha_vencimiento)
          : null,
        fecha_convenio: new Date(),
        estado: (data.estado as any) || "Activo",
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        sector_economico: data.sector_economico,
        numero_empleados: data.numero_empleados,
        tipo_empresa: data.tipo_empresa,
        descripcion: data.descripcion,
        notas_internas: data.notas_internas,
      },
    });

    return convenio;
  };

  const getConveniosPaginados = async (params: {
    page: number;
    limit: number;
    estado?: string;
    nit?: string;
    busqueda?: string;
  }) => {
    const { page, limit, estado, nit, busqueda } = params;
    const offset = (page - 1) * limit;

    // Construir where clause
    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (nit) {
      where.nit = BigInt(nit.replace(/\s/g, ""));
    }

    if (busqueda) {
      where.OR = [
        { razon_social: { contains: busqueda, mode: "insensitive" } },
        { representante_nombre: { contains: busqueda, mode: "insensitive" } },
        {
          representante_documento: { contains: busqueda, mode: "insensitive" },
        },
      ];
    }

    // Obtener convenios con paginación
    const [convenios, total] = await Promise.all([
      prisma.empresas_convenio.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.empresas_convenio.count({ where }),
    ]);

    // Calcular conteo de estados
    const conteoEstados = await prisma.empresas_convenio.groupBy({
      by: ["estado"],
      _count: {
        id: true,
      },
    });

    const conteoEstadosMap: Record<string, number> = {};
    conteoEstados.forEach((item) => {
      conteoEstadosMap[item.estado] = item._count.id;
    });

    // Transformar datos
    const empresas = convenios.map((convenio: any) => ({
      id: String(convenio.id),
      nit: String(convenio.nit),
      razon_social: convenio.razon_social,
      representante_nombre: convenio.representante_nombre,
      representante_documento: convenio.representante_documento,
      correo: convenio.correo,
      telefono: convenio.telefono,
      estado: convenio.estado,
      fecha_convenio: convenio.fecha_convenio?.toISOString() || null,
      fecha_vencimiento: convenio.fecha_vencimiento?.toISOString() || null,
      direccion: convenio.direccion,
      ciudad: convenio.ciudad,
      departamento: convenio.departamento,
      sector_economico: convenio.sector_economico,
      numero_empleados: convenio.numero_empleados,
      tipo_empresa: convenio.tipo_empresa,
      created_at: convenio.created_at?.toISOString() || null,
      updated_at: convenio.updated_at?.toISOString() || null,
    }));

    return {
      empresas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      conteo_estados: conteoEstadosMap,
    };
  };

  const obtenerConvenioPorId = async (id: number) => {
    const convenio = await prisma.empresas_convenio.findUnique({
      where: { id: BigInt(id) },
    });

    if (!convenio) {
      return null;
    }

    return {
      id: String(convenio.id),
      nit: String(convenio.nit),
      razon_social: convenio.razon_social,
      representante_documento: convenio.representante_documento,
      representante_nombre: convenio.representante_nombre,
      telefono: convenio.telefono,
      correo: convenio.correo,
      fecha_convenio: convenio.fecha_convenio?.toISOString() || null,
      fecha_vencimiento: convenio.fecha_vencimiento?.toISOString() || null,
      estado: convenio.estado,
      direccion: convenio.direccion,
      ciudad: convenio.ciudad,
      departamento: convenio.departamento,
      sector_economico: convenio.sector_economico,
      numero_empleados: convenio.numero_empleados,
      tipo_empresa: convenio.tipo_empresa,
      descripcion: convenio.descripcion,
      notas_internas: convenio.notas_internas,
      created_at: convenio.created_at?.toISOString() || null,
      updated_at: convenio.updated_at?.toISOString() || null,
    };
  };

  const actualizarConvenio = async (
    id: number,
    data: {
      nit?: string;
      razon_social?: string;
      representante_documento?: string;
      representante_nombre?: string;
      telefono?: string;
      correo?: string;
      fecha_vencimiento?: string;
      estado?: string;
      direccion?: string;
      ciudad?: string;
      departamento?: string;
      sector_economico?: string;
      numero_empleados?: number;
      tipo_empresa?: string;
      descripcion?: string;
      notas_internas?: string;
    },
  ) => {
    const updateData: any = {};

    if (data.nit !== undefined) updateData.nit = BigInt(data.nit);
    if (data.razon_social !== undefined)
      updateData.razon_social = data.razon_social;
    if (data.representante_documento !== undefined)
      updateData.representante_documento = data.representante_documento;
    if (data.representante_nombre !== undefined)
      updateData.representante_nombre = data.representante_nombre;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.correo !== undefined) updateData.correo = data.correo;
    if (data.fecha_vencimiento !== undefined)
      updateData.fecha_vencimiento = new Date(data.fecha_vencimiento);
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.direccion !== undefined) updateData.direccion = data.direccion;
    if (data.ciudad !== undefined) updateData.ciudad = data.ciudad;
    if (data.departamento !== undefined)
      updateData.departamento = data.departamento;
    if (data.sector_economico !== undefined)
      updateData.sector_economico = data.sector_economico;
    if (data.numero_empleados !== undefined)
      updateData.numero_empleados = data.numero_empleados;
    if (data.tipo_empresa !== undefined)
      updateData.tipo_empresa = data.tipo_empresa;
    if (data.descripcion !== undefined)
      updateData.descripcion = data.descripcion;
    if (data.notas_internas !== undefined)
      updateData.notas_internas = data.notas_internas;

    const convenio = await prisma.empresas_convenio.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return convenio;
  };

  return {
    getConveniosByUser,
    getConvenioByNit,
    getAllConvenios,
    crearConvenio,
    getConveniosPaginados,
    obtenerConvenioPorId,
    actualizarConvenio,
  };
};

export default convenioService;
