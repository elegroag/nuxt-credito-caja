export interface Configuration {
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  editable: boolean;
  required: boolean;
}

export interface ConfigurationProp extends Configuration {
  form: Record<string, unknown>;
  descripcion: string | null;
}

/**
 *use en configurations.service
 */
export interface SerializedConfiguration {
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  editable: boolean;
  required: boolean;
}

/**
 *use en configurations.service
 */
export interface PrismaConfig {
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

/**
 * use useConfigurations
 */
export interface AppConfiguration {
  clave: string;
  valor: string;
  descripcion: string | null;
  tipo: string;
  categoria: string;
  editable: boolean;
  required: boolean;
}

export interface ConfigurationResponse {
  success: boolean;
  message: string;
  data: AppConfiguration[];
}
