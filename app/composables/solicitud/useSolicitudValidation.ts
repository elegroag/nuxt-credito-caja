import type { SolicitudCreditoPayload } from "~~/shared/types/payload";
import { useConfigurations } from "~/composables/admin/useConfigurations";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

type ValidatorFn = (form: SolicitudCreditoPayload, configs: {
  limiteCuotas: number;
  minimaFamiliares: number;
  minimaPersonales: number;
  minimoSalario: number;
  minimoEndeudamiento: number;
}) => ValidationResult;

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return false;
  return false;
};

const isEmptyArray = (arr: unknown[]): boolean => !Array.isArray(arr) || arr.length === 0;

/**
 * Valida el paso de solicitud (rol, plazo).
 * numero_comprobante y producto_tipo se setean desde backend.
 */
const validateSolicitud: ValidatorFn = (form, configs) => {
  const errors: Record<string, string> = {};

  if (!form.solicitud.rol_en_solicitud) {
    errors["solicitud.rol_en_solicitud"] = "El rol en solicitud es requerido";
  }

  // Validar plazo contra configuración
  const plazo = Number(form.solicitud.plazo_meses);
  if (plazo && plazo > configs.limiteCuotas) {
    errors["solicitud.plazo_meses"] = `El plazo máximo permitido es de ${configs.limiteCuotas} meses`;
  }

  return { valid: true, errors };
};

/**
 * Valida el paso de datos del solicitante.
 */
const validateSolicitante: ValidatorFn = (_form, _configs) => {
  const errors: Record<string, string> = {};

  if (!_form.solicitante.tipo_documento) {
    errors["solicitante.tipo_documento"] = "El tipo de documento es requerido";
  }

  if (!_form.solicitante.numero_documento?.trim()) {
    errors["solicitante.numero_documento"] = "El número de documento es requerido";
  }

  if (!_form.solicitante.nombres?.trim()) {
    errors["solicitante.nombres"] = "Los nombres son requeridos";
  }

  if (!_form.solicitante.apellidos?.trim()) {
    errors["solicitante.apellidos"] = "Los apellidos son requeridos";
  }

  if (!_form.solicitante.celular?.trim()) {
    errors["solicitante.celular"] = "El celular es requerido";
  }

  if (!_form.solicitante.direccion?.trim()) {
    errors["solicitante.direccion"] = "La dirección es requerida";
  }

  return { valid: true, errors };
};

/**
 * Valida el paso de datos del cónyuge.
 */
const validateConyuge: ValidatorFn = (form, _configs) => {
  const errors: Record<string, string> = {};

  if (form.conyuge) {
    if (!form.conyuge.identificacion?.trim()) {
      errors["conyuge.identificacion"] = "La identificación del cónyuge es requerida";
    }
    if (!form.conyuge.nombres_apellidos?.trim()) {
      errors["conyuge.nombres_apellidos"] = "El nombre del cónyuge es requerido";
    }
  }

  return { valid: true, errors };
};

/**
 * Valida el paso de información laboral.
 */
const validateLaboral: ValidatorFn = (form, _configs) => {
  const errors: Record<string, string> = {};

  if (!form.informacion_laboral.empresa_razon_social?.trim()) {
    errors["informacion_laboral.empresa_razon_social"] = "La razón social de la empresa es requerida";
  }

  if (!form.informacion_laboral.empresa_nit?.trim()) {
    errors["informacion_laboral.empresa_nit"] = "El NIT de la empresa es requerido";
  }

  if (!form.informacion_laboral.cargo?.trim()) {
    errors["informacion_laboral.cargo"] = "El cargo es requerido";
  }

  if (!form.informacion_laboral.fecha_ingreso?.trim()) {
    errors["informacion_laboral.fecha_ingreso"] = "La fecha de ingreso es requerida";
  }

  return { valid: true, errors };
};

/**
 * Valida el paso de ingresos.
 * Verifica salario básico vs minimo_salario y endeudamiento mínimo.
 */
const validateIngresos: ValidatorFn = (form, configs) => {
  const errors: Record<string, string> = {};

  const salario = Number(form.ingresos_descuentos.salario_basico_mensual);
  if (!salario || salario <= 0) {
    errors["ingresos_descuentos.salario_basico_mensual"] = "El salario básico mensual es requerido";
    return { valid: true, errors };
  }

  // Validar salario mínimo
  if (salario < configs.minimoSalario) {
    errors["ingresos_descuentos.salario_basico_mensual"] =
      `El salario mínimo requerido es de $${configs.minimoSalario.toLocaleString("es-CO")} COP`;
  }

  // Validar porcentaje mínimo de endeudamiento
  // La cuota mensual viene del objeto solicitud, no de ingresos_descuentos
  const cuota = Number(form.solicitud?.cuota_mensual) || 0;
  if (cuota > 0 && salario > 0) {
    const porcentaje = (cuota / salario) * 100;
    if (porcentaje < configs.minimoEndeudamiento) {
      errors["solicitud.cuota_mensual"] =
        `El porcentaje de endeudamiento mínimo permitido es ${configs.minimoEndeudamiento}%. Tu cuota representa ${porcentaje.toFixed(1)}%`;
    }
  }

  return { valid: true, errors };
};

/**
 * Valida el paso de información económica (sin validaciones complejas).
 */
const validateEconomica: ValidatorFn = (_form, _configs) => {
  return { valid: true, errors: {} };
};

/**
 * Valida el paso de propiedades.
 */
const validatePropiedades: ValidatorFn = (form, _configs) => {
  const errors: Record<string, string> = {};

  form.propiedades.forEach((propiedad, index) => {
    if (!propiedad.tipo_bien?.trim()) {
      errors[`propiedades.${index}.tipo_bien`] = `El tipo de bien es requerido (propiedad ${index + 1})`;
    }
    if (!propiedad.descripcion?.trim()) {
      errors[`propiedades.${index}.descripcion`] = `La descripción es requerida (propiedad ${index + 1})`;
    }
  });

  return { valid: true, errors };
};

/**
 * Valida el paso de deudas.
 */
const validateDeudas: ValidatorFn = (form, _configs) => {
  const errors: Record<string, string> = {};

  form.deudas.forEach((deuda, index) => {
    if (!deuda.acreedor_nombre?.trim()) {
      errors[`deudas.${index}.acreedor_nombre`] = `El acreedor es requerido (deuda ${index + 1})`;
    }
    if (!deuda.concepto?.trim()) {
      errors[`deudas.${index}.concepto`] = `El concepto es requerido (deuda ${index + 1})`;
    }
  });

  return { valid: true, errors };
};

/**
 * Valida el paso de referencias.
 * Verifica cantidad mínima de referencias por tipo desde app_configurations.
 */
const validateReferencias: ValidatorFn = (form, configs) => {
  const errors: Record<string, string> = {};

  // Validar referencias familiares (solo si minimaFamiliares > 0)
  if (configs.minimaFamiliares > 0 && isEmptyArray(form.referencias.familiares)) {
    errors["referencias.familiares"] = `Al menos ${configs.minimaFamiliares} referencia familiar es requerida`;
  } else {
    form.referencias.familiares.forEach((ref, index) => {
      if (!String(ref.nombre_apellidos || '').trim()) {
        errors[`referencias.familiares.${index}.nombre_apellidos`] = `El nombre es requerido (familiar ${index + 1})`;
      }
      if (!String(ref.celular || '').trim()) {
        errors[`referencias.familiares.${index}.celular`] = `El celular es requerido (familiar ${index + 1})`;
      }
    });
  }

  // Validar referencias personales (solo si minimaPersonales > 0)
  if (configs.minimaPersonales > 0 && isEmptyArray(form.referencias.personales)) {
    errors["referencias.personales"] = `Al menos ${configs.minimaPersonales} referencia personal es requerida`;
  } else {
    form.referencias.personales.forEach((ref, index) => {
      if (!String(ref.nombre_apellidos || '').trim()) {
        errors[`referencias.personales.${index}.nombre_apellidos`] = `El nombre es requerido (personal ${index + 1})`;
      }
      if (!String(ref.celular || '').trim()) {
        errors[`referencias.personales.${index}.celular`] = `El celular es requerido (personal ${index + 1})`;
      }
    });
  }

  // Validar cantidad mínima por tipo (solo si la config es > 0)
  if (configs.minimaFamiliares > 0 && (form.referencias.familiares?.length || 0) < configs.minimaFamiliares) {
    errors["referencias.familiares.cantidad"] =
      `Debes agregar al menos ${configs.minimaFamiliares} referencia familiar (actualmente tienes ${form.referencias.familiares?.length || 0})`;
  }

  if (configs.minimaPersonales > 0 && (form.referencias.personales?.length || 0) < configs.minimaPersonales) {
    errors["referencias.personales.cantidad"] =
      `Debes agregar al menos ${configs.minimaPersonales} referencia personal (actualmente tienes ${form.referencias.personales?.length || 0})`;
  }

  return { valid: true, errors };
};

/**
 * Valida el paso de revisión (sin validaciones).
 */
const validateRevision: ValidatorFn = (_form, _configs) => {
  return { valid: true, errors: {} };
};

export const stepValidators: Record<string, ValidatorFn> = {
  solicitud: validateSolicitud,
  solicitante: validateSolicitante,
  conyuge: validateConyuge,
  laboral: validateLaboral,
  ingresos: validateIngresos,
  economica: validateEconomica,
  propiedades: validatePropiedades,
  deudas: validateDeudas,
  referencias: validateReferencias,
  revision: validateRevision
};

export function useSolicitudValidation() {
  const { getConfigurationAsNumber } = useConfigurations();

  /**
   * Obtiene los valores de configuración para validaciones.
   * Se_called cada vez para que refleje cambios en la config sin recargar página.
   */
  const getValidationConfigs = () => ({
    limiteCuotas: getConfigurationAsNumber("limite_cuotas", 60),
    minimaFamiliares: getConfigurationAsNumber("referencias_familiares", 1),
    minimaPersonales: getConfigurationAsNumber("referencias_personales", 1),
    minimoSalario: getConfigurationAsNumber("minimo_salario", 1300000),
    minimoEndeudamiento: getConfigurationAsNumber("minimo_endeudamiento", 30)
  });

  /**
   * Valida un paso específico del wizard.
   */
  const validateStep = (
    stepKey: string,
    form: SolicitudCreditoPayload
  ): ValidationResult => {
    const validator = stepValidators[stepKey];
    if (!validator) {
      return { valid: true, errors: {} };
    }
    return validator(form, getValidationConfigs());
  };

  /**
   * Valida todos los pasos y retorna errores combinados.
   * Útil para el resumen en el paso de revisión.
   */
  const validateAllSteps = (form: SolicitudCreditoPayload): Record<string, ValidationResult> => {
    const results: Record<string, ValidationResult> = {};
    const configs = getValidationConfigs();

    Object.entries(stepValidators).forEach(([key, validator]) => {
      results[key] = validator(form, configs);
    });

    return results;
  };

  return {
    validateStep,
    validateAllSteps,
    stepValidators,
    getValidationConfigs
  };
}