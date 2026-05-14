import type { SolicitudCreditoPayload } from "~~/shared/types/payload";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

type ValidatorFn = (form: SolicitudCreditoPayload) => ValidationResult;

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return false;
  return false;
};

const isEmptyArray = (arr: unknown[]): boolean => !Array.isArray(arr) || arr.length === 0;

const validateSolicitud: ValidatorFn = (form) => {
  const errors: Record<string, string> = {};

  if (!form.solicitud.numero_comprobante?.trim()) {
    errors["solicitud.numero_comprobante"] = "El número de comprobante es requerido";
  }

  if (!form.solicitud.rol_en_solicitud) {
    errors["solicitud.rol_en_solicitud"] = "El rol en solicitud es requerido";
  }

  if (!form.solicitud.producto_tipo) {
    errors["solicitud.producto_tipo"] = "El producto es requerido";
  }

  return { valid: true, errors };
};

const validateSolicitante: ValidatorFn = (form) => {
  const errors: Record<string, string> = {};

  if (!form.solicitante.tipo_documento) {
    errors["solicitante.tipo_documento"] = "El tipo de documento es requerido";
  }

  if (!form.solicitante.numero_documento?.trim()) {
    errors["solicitante.numero_documento"] = "El número de documento es requerido";
  }

  if (!form.solicitante.nombres?.trim()) {
    errors["solicitante.nombres"] = "Los nombres son requeridos";
  }

  if (!form.solicitante.apellidos?.trim()) {
    errors["solicitante.apellidos"] = "Los apellidos son requeridos";
  }

  if (!form.solicitante.celular?.trim()) {
    errors["solicitante.celular"] = "El celular es requerido";
  }

  if (!form.solicitante.direccion?.trim()) {
    errors["solicitante.direccion"] = "La dirección es requerida";
  }

  return { valid: true, errors };
};

const validateConyuge: ValidatorFn = (form) => {
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

const validateLaboral: ValidatorFn = (form) => {
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

const validateIngresos: ValidatorFn = (form) => {
  const errors: Record<string, string> = {};

  if (!form.ingresos_descuentos.salario_basico_mensual || form.ingresos_descuentos.salario_basico_mensual <= 0) {
    errors["ingresos_descuentos.salario_basico_mensual"] = "El salario básico mensual es requerido";
  }

  return { valid: true, errors };
};

const validateEconomica: ValidatorFn = (_form) => {
  return { valid: true, errors: {} };
};

const validatePropiedades: ValidatorFn = (form) => {
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

const validateDeudas: ValidatorFn = (form) => {
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

const validateReferencias: ValidatorFn = (form) => {
  const errors: Record<string, string> = {};

  if (isEmptyArray(form.referencias.familiares)) {
    errors["referencias.familiares"] = "Al menos una referencia familiar es requerida";
  } else {
    form.referencias.familiares.forEach((ref, index) => {
      if (!ref.nombre_apellidos?.trim()) {
        errors[`referencias.familiares.${index}.nombre_apellidos`] = `El nombre es requerido (familiar ${index + 1})`;
      }
      if (!ref.celular?.trim()) {
        errors[`referencias.familiares.${index}.celular`] = `El celular es requerido (familiar ${index + 1})`;
      }
    });
  }

  if (isEmptyArray(form.referencias.personales)) {
    errors["referencias.personales"] = "Al menos una referencia personal es requerida";
  } else {
    form.referencias.personales.forEach((ref, index) => {
      if (!ref.nombre_apellidos?.trim()) {
        errors[`referencias.personales.${index}.nombre_apellidos`] = `El nombre es requerido (personal ${index + 1})`;
      }
      if (!ref.celular?.trim()) {
        errors[`referencias.personales.${index}.celular`] = `El celular es requerido (personal ${index + 1})`;
      }
    });
  }

  return { valid: true, errors };
};

const validateRevision: ValidatorFn = (_form) => {
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
  const validateStep = (
    stepKey: string,
    form: SolicitudCreditoPayload
  ): ValidationResult => {
    const validator = stepValidators[stepKey];
    if (!validator) {
      return { valid: true, errors: {} };
    }
    return validator(form);
  };

  return {
    validateStep,
    stepValidators
  };
}