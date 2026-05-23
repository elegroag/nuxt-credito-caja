import type { H3Event } from 'h3';
import {
  defineEventHandler,
  getRouterParam,
  setResponseStatus
} from 'h3';
import prisma from '~~/lib/prisma';
import {
  decryptPayload,
  createKeyFromHex,
  isTokenExpired,
  type TokenPayload
} from '~~/server/utils/crypto.service';
import { CustomResponse } from '~~/server/utils/customResponse';

interface SolicitudDatosGenerales {
  numero_solicitud: string;
  valor_solicitud: string;
  plazo_meses: number;
  tasa_interes: string;
  estado: string;
  estado_detallado: string;
  fecha_radicado: string | null;
  created_at: string;
  updated_at: string;
  solicitante: {
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
  } | null;
  firmantes: Array<{
    id: number;
    nombre_completo: string;
    numero_documento: string;
    email: string;
    tipo: string;
    orden: number;
    rol: string;
  }>;
  url_firma: string | null;
}

async function getSolicitudDatosGenerales(
  numeroSolicitud: string
): Promise<SolicitudDatosGenerales | null> {
  const solicitud = await prisma.solicitudes_credito.findUnique({
    where: { numero_solicitud: numeroSolicitud },
    include: {
      solicitud_solicitante: true,
      firmantes_solicitud: {
        orderBy: { orden: 'asc' }
      },
      estados_solicitud: true
    }
  });

  if (!solicitud) return null;

  const solicitante = solicitud.solicitud_solicitante?.[0] ?? null;

  return {
    numero_solicitud: solicitud.numero_solicitud,
    valor_solicitud: String(solicitud.valor_solicitud),
    plazo_meses: solicitud.plazo_meses,
    tasa_interes: String(solicitud.tasa_interes),
    estado: solicitud.estado,
    estado_detallado: solicitud.estados_solicitud?.descripcion ?? '',
    fecha_radicado: solicitud.fecha_radicado?.toISOString() ?? null,
    created_at: solicitud.created_at?.toISOString() ?? '',
    updated_at: solicitud.updated_at?.toISOString() ?? '',
    solicitante: solicitante
      ? {
          nombres: solicitante.nombres ?? '',
          apellidos: solicitante.apellidos ?? '',
          tipo_documento: solicitante.tipo_documento ?? '',
          numero_documento: solicitante.numero_documento ?? ''
        }
      : null,
    firmantes: (solicitud.firmantes_solicitud ?? []).map((f) => ({
      id: Number(f.id),
      nombre_completo: f.nombre_completo ?? '',
      numero_documento: f.numero_documento ?? '',
      email: f.email ?? '',
      tipo: f.tipo ?? '',
      orden: f.orden,
      rol: f.rol ?? ''
    })),
    url_firma: null
  };
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const token = getRouterParam(event, 'token');

    if (!token) {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        'Token no proporcionado',
        'Error de validación'
      );
    }

    // Decrypt token
    let payload: TokenPayload;
    try {
      const keyHex = process.env.API_FIRMA_KEY;
      if (!keyHex) {
        throw new Error('API_FIRMA_KEY no configurada');
      }
      const key = createKeyFromHex(keyHex);
      payload = decryptPayload(token, key);
    } catch {
      setResponseStatus(event, 400);
      return CustomResponse.error(
        'Token inválido o corrupto',
        'Error de autenticación'
      );
    }

    // Check expiration
    if (isTokenExpired(payload)) {
      setResponseStatus(event, 410);
      return CustomResponse.error(
        'El enlace de firma ha expirado',
        'Enlace expirado'
      );
    }

    // Get solicitud data
    const datos = await getSolicitudDatosGenerales(payload.numero_solicitud);

    if (!datos) {
      setResponseStatus(event, 404);
      return CustomResponse.error(
        'Solicitud no encontrada',
        'Recurso no encontrado'
      );
    }

    // Verify identificacion matches solicitante
    if (payload.identificacion !== datos.solicitante?.numero_documento) {
      setResponseStatus(event, 403);
      return CustomResponse.error(
        'El documento no corresponde a esta solicitud',
        'Acceso denegado'
      );
    }

    return CustomResponse.success(datos, 'Datos de la solicitud');
  } catch (error) {
    console.error('Error en /api/public/firma/[token]:', error);
    setResponseStatus(event, 500);
    return CustomResponse.error(
      'Error al procesar la solicitud',
      'Error interno'
    );
  }
});