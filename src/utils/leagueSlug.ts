import type { League } from '../contexts/LeagueContext';

// Mapa de IDs reales de liga -> slug legible para la URL
const idToSlug: Record<string, string> = {
  // Ejemplo: la liga con ID '6' es Copa Lobitos
  '6': 'copa-lobitos',
};

// Mapa inverso para resolver desde el slug al ID real
const slugToId: Record<string, string> = Object.fromEntries(
  Object.entries(idToSlug).map(([id, slug]) => [slug, id])
);

/**
 * Devuelve el segmento que se usa en la URL para una liga.
 * Si hay un slug definido para ese ID, lo usa; si no, usa el propio ID.
 */
export function getLeaguePathId(leagueOrId: League | string): string {
  const id = typeof leagueOrId === 'string' ? leagueOrId : leagueOrId.id;
  return idToSlug[id] || id;
}

/**
 * A partir de un slug de la URL, devuelve el ID real de la liga.
 * Si no hay mapeo, devuelve el propio slug (para ligas que ya usan IDs legibles).
 */
export function resolveLeagueIdFromSlug(slugOrId: string): string {
  if (!slugOrId) return slugOrId;
  return slugToId[slugOrId] || slugOrId;
}

