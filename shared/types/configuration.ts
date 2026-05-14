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
  form: any;
  descripcion: string | null;
}
