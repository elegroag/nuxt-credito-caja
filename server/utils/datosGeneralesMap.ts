import type { Ciudades, Paises } from "~~/shared/types/parametros";

/**
 * Códigos y nombres de países/ciudades para resolver antes de enviar a Flask.
 * Estos datos vienen de la API SISUWEB (datos-generales).
 */
export interface DatosGeneralesMap {
  ciudades: Map<string, string>; // codciu → detciu (ej: "18001" → "FLORENCIA")
  paises: Map<string, string>; // cod1 → nombre (ej: "170" → "Colombia")
}

/**
 * Construye mapas de búsqueda para ciudades y países.
 * Se llama una vez y se reutiliza para no consultar la API repetidamente.
 */
export const buildDatosGeneralesMap = (datos: {
  ciudades?: readonly Ciudades[];
  paises?: readonly Paises[];
}): DatosGeneralesMap => {
  const ciudades = new Map<string, string>();
  const paises = new Map<string, string>();

  (datos.ciudades || []).forEach((c) => {
    if (c.codciu) ciudades.set(c.codciu, c.detciu);
  });

  (datos.paises || []).forEach((p) => {
    // La clave es cod1 (ej: "170") que es lo que el frontend guarda en pais_residencia
    if (p.cod1) paises.set(p.cod1, p.nombre);
  });

  return { ciudades, paises };
};

/**
 * Resuelve código de ciudad a nombre.
 * Fallback: si no existe, retorna el código original.
 */
export const resolveCiudadNombre = (
  codigo: string | null | undefined,
  map: DatosGeneralesMap
): string => {
  if (!codigo) return "";
  return map.ciudades.get(codigo) ?? codigo;
};

/**
 * Resuelve código de país a nombre.
 * El frontend guarda pais_residencia como cod1 (ej: "170").
 * Fallback: si no existe, retorna el código original.
 */
export const resolvePaisNombre = (
  codigo: string | null | undefined,
  map: DatosGeneralesMap
): string => {
  if (!codigo) return "";
  return map.paises.get(codigo) ?? codigo;
};