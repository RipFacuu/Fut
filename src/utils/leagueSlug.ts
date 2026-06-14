import type { League } from '../contexts/LeagueContext';

// Slugs antiguos que siguen funcionando aunque el nombre haya cambiado
const legacySlugToId: Record<string, string> = {
  'copa-lobitos': '6',
};

/**
 * Convierte el nombre de una liga en un segmento de URL legible.
 * Ej: "TORNEO 'MINI CUP'" → "torneo-mini-cup"
 */
export function slugifyLeagueName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Devuelve el segmento que se usa en la URL para una liga.
 * Se genera a partir del nombre actual, así la URL se actualiza si cambia el torneo.
 */
export function getLeaguePathId(leagueOrId: League | string): string {
  if (typeof leagueOrId === 'string') {
    return leagueOrId;
  }

  const slug = slugifyLeagueName(leagueOrId.name);
  return slug || leagueOrId.id;
}

/**
 * A partir de un slug de la URL, devuelve el ID real de la liga.
 */
export function resolveLeagueIdFromSlug(
  slugOrId: string,
  leagues: League[] = []
): string {
  if (!slugOrId) return slugOrId;

  if (legacySlugToId[slugOrId]) {
    return legacySlugToId[slugOrId];
  }

  const byId = leagues.find((league) => league.id === slugOrId);
  if (byId) return byId.id;

  const bySlug = leagues.find(
    (league) => slugifyLeagueName(league.name) === slugOrId
  );
  if (bySlug) return bySlug.id;

  return slugOrId;
}
