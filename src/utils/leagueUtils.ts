/**
 * Utilidades para el manejo de ligas y mapeo de IDs entre Supabase (numéricos) 
 * y la aplicación (strings descriptivos).
 */

export const LEAGUE_IDS = {
  LIGA_MASCULINA: 'liga_masculina',
  LIFUFE: 'lifufe',
  MUNDIALITO: 'mundialito'
} as const;

export const NUMERIC_TO_STRING_MAP: Record<number, string> = {
  1: LEAGUE_IDS.LIGA_MASCULINA,
  2: LEAGUE_IDS.LIFUFE,
  3: LEAGUE_IDS.MUNDIALITO
};

export const STRING_TO_NUMERIC_MAP: Record<string, number> = {
  [LEAGUE_IDS.LIGA_MASCULINA]: 1,
  [LEAGUE_IDS.LIFUFE]: 2,
  [LEAGUE_IDS.MUNDIALITO]: 3
};

/**
 * Convierte un ID de liga (string o número) a su representación en string.
 */
export const getLeagueStringId = (id: string | number | null | undefined): string => {
  if (id === null || id === undefined) return '__INVALID__';
  
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  
  if (!isNaN(numericId) && NUMERIC_TO_STRING_MAP[numericId]) {
    return NUMERIC_TO_STRING_MAP[numericId];
  }
  
  return String(id);
};

/**
 * Convierte un ID de liga string a su representación numérica para Supabase.
 */
export const getLeagueNumericId = (id: string): number => {
  if (STRING_TO_NUMERIC_MAP[id]) {
    return STRING_TO_NUMERIC_MAP[id];
  }
  
  const numericId = parseInt(id);
  return isNaN(numericId) ? 1 : numericId; // Default a 1 (Liga Masculina) si no es válido
};

/**
 * Obtiene el logo por defecto para una liga si no tiene uno definido.
 */
export const getLeagueDefaultLogo = (leagueId: string, leagueName: string = ''): string | null => {
  if (leagueId === LEAGUE_IDS.LIGA_MASCULINA) return "/liga_participando.jpeg";
  if (leagueId === LEAGUE_IDS.LIFUFE) return "/lifufe.jpeg";
  if (leagueId === LEAGUE_IDS.MUNDIALITO) return "/mundialito.jpeg";
  
  if (leagueName.toLowerCase().includes('lobitos')) return "/images/lobitos.jpeg";
  if (leagueName.toLowerCase().includes('dief')) return "/dief_logo.png";
  
  return null;
};
