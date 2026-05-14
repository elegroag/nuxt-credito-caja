import prisma from "~~/lib/prisma";

interface SerializedConfiguration {
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  editable: boolean;
  required: boolean;
}

interface PrismaConfig {
  id: bigint;
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  editable: boolean;
  required: boolean;
  created_at: Date | null;
  updated_at: Date | null;
}

const configurationsService = () => {
  const serializeConfig = (config: PrismaConfig): SerializedConfiguration => ({
    clave: config.clave,
    valor: config.valor,
    descripcion: config.descripcion,
    tipo: config.tipo,
    categoria: config.categoria,
    editable: config.editable,
    required: config.required
  });

  const getAllConfigurations = async (): Promise<SerializedConfiguration[]> => {
    const configs = await prisma.configurations.findMany({
      where: { editable: true },
      orderBy: { categoria: "asc" }
    });
    return configs.map(serializeConfig);
  };

  const getConfigurationsMap = async (): Promise<Record<string, string>> => {
    const configs = await getAllConfigurations();
    return configs.reduce((acc, config) => {
      acc[config.clave] = config.valor;
      return acc;
    }, {} as Record<string, string>);
  };

  const getConfigurationByKey = async (key: string): Promise<string | null> => {
    const config = await prisma.configurations.findUnique({
      where: { clave: key }
    });
    return config?.valor ?? null;
  };

  const setConfiguration = async (
    key: string,
    value: string
  ): Promise<SerializedConfiguration> => {
    const config = await prisma.configurations.update({
      where: { clave: key },
      data: {
        valor: value,
        updated_at: new Date()
      }
    });
    return serializeConfig(config);
  };

  return {
    getAllConfigurations,
    getConfigurationsMap,
    getConfigurationByKey,
    setConfiguration
  };
};

export default configurationsService;

export type { SerializedConfiguration };