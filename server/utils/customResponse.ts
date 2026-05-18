export interface CustomResponseAttributes {
  success: boolean
  data?: unknown
  message: string
  errors?: Record<string, string>[]
  error?: string
  tracer?: string
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CustomResponse {
  private static generateId(): string {
    return `tr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  static success(
    data: unknown,
    message = "Operación exitosa"
  ): CustomResponseAttributes {
    return {
      success: true,
      data,
      message
    };
  }

  static fail(
    errors: Record<string, string>[],
    message = "Validación fallida"
  ): CustomResponseAttributes {
    return {
      success: false,
      errors,
      message
    };
  }

  static error(
    error: string,
    message = "Error en el proceso",
    tracer?: string
  ): CustomResponseAttributes {
    return {
      success: false,
      error,
      message,
      tracer: tracer || this.generateId()
    };
  }

  static ok(data?: unknown, message = "OK"): CustomResponseAttributes {
    return {
      success: true,
      data,
      message
    };
  }
}
