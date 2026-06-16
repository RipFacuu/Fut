/**
 * Utilidades para el manejo de ligas y mapeo de IDs entre Supabase (numéricos) 
 * y la aplicación (strings descriptivos).
 */

export const LEAGUE_IDS = {
  LIGA_MASCULINA: '1',
  LIFUFE: '2',
  MUNDIALITO: '3'
} as const;

/** Liga Participando usa zona → categoría (no al revés). */
export const isLigaParticipando = (
  leagueId: string | null | undefined,
  leagueName?: string
): boolean => {
  if (!leagueId) return false;
  const id = String(leagueId);
  if (id === LEAGUE_IDS.LIGA_MASCULINA || id === 'liga_masculina') return true;
  return (leagueName?.toLowerCase().includes('participando') ?? false);
};

/**
 * Convierte un ID de liga (string o número) a su representación en string.
 */
export const getLeagueStringId = (id: string | number | null | undefined): string => {
  if (id === null || id === undefined) return '__INVALID__';
  return String(id);
};

/**
 * Convierte un ID de liga string a su representación numérica para Supabase.
 */
export const getLeagueNumericId = (id: string): number => {
  const numericId = parseInt(id);
  return isNaN(numericId) ? 1 : numericId;
};

/**
 * Obtiene el logo por defecto para una liga si no tiene uno definido.
 */
export const getLeagueDefaultLogo = (leagueId: string, leagueName: string = ''): string | null => {
  if (leagueId === '1' || leagueName.toLowerCase().includes('masculina')) return "/liga_participando.jpeg";
  if (leagueId === '2' || leagueName.toLowerCase().includes('lifufe')) return "/lifufe.jpeg";
  if (leagueId === '3' || leagueName.toLowerCase().includes('mundialito')) return "/mundialito.jpeg";
  
  if (leagueName.toLowerCase().includes('lobitos')) return "/images/lobitos.jpeg";
  if (leagueName.toLowerCase().includes('dief')) return "/dief_logo.png";
  
  return null;
};
