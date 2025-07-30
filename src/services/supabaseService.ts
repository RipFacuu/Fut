import { supabase } from '../lib/supabase';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { getNumericLeagueId } from '../lib/supabase';
import {
  agregarEquipoCompleto,
  obtenerEquiposPorZona,
  obtenerTodosLosEquipos,
  crearPartido,
  obtenerPartidosConEquiposYResultados,
  actualizarResultadoPartido,
  obtenerLigas,
  obtenerCategoriasPorLiga,
  crearCategoria,
  eliminarCategoria as eliminarCategoriaSupabase,
  crearFixture,
  crearPartidoConFixture,
  obtenerFixtures,
  obtenerPartidosPorFixture,
  eliminarFixture,
  obtenerPosicionesPorZona,
  actualizarStanding,
  eliminarStanding,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  obtenerZonasPorLiga,
  // Removed obtenerEstructuraLiga since it's not exported from supabase lib
  obtenerCategoriasPorLigaConEstructura,
  obtenerZonasPorLigaConEstructura,
  crearCategoriaConEstructura,
  crearZonaConEstructura
} from '../lib/supabase';

import { League, Category, Zone, Team, Fixture, Match, Standing, Course } from '../contexts/LeagueContext';

// Función auxiliar para obtener IDs numéricos
export async function getNumericIds(
  teamId: string | null,
  zoneId: string,
  leagueId: string,
  categoryId: string
) {
  return {
    teamId: teamId ? parseInt(teamId) : null,
    zoneId: parseInt(zoneId),
    leagueId: parseInt(leagueId),
    categoryId: parseInt(categoryId)
  };
}

// Mapeo de liga
export const mapSupabaseToLeague = (supabaseLeague: any): League => {
  if (!supabaseLeague) throw new Error('League data is required');

  const idMap: { [key: number]: string } = {
    1: 'liga_masculina',
    2: 'lifufe',
    3: 'mundialito'
  };

  const leagueId =
    typeof supabaseLeague.id === 'string'
      ? supabaseLeague.id
      : idMap[supabaseLeague.id] || String(supabaseLeague.id);

  return {
    id: leagueId,
    name: supabaseLeague.nombre || '',
    logo: supabaseLeague.logo || ''
  };
};

// Mapeo de zona
export const mapSupabaseToZone = (supabaseZone: any): Zone => {
  if (!supabaseZone) throw new Error('Zone data is required');

  const idMap: { [key: number]: string } = {
    1: 'liga_masculina',
    2: 'lifufe',
    3: 'mundialito'
  };

  const numericId =
    typeof supabaseZone.liga_id === 'string'
      ? parseInt(supabaseZone.liga_id)
      : supabaseZone.liga_id;

  return {
    id: supabaseZone.id || '',
    name: supabaseZone.nombre || '',
    leagueId: idMap[numericId] || String(numericId),
    categoryId: String(supabaseZone.categoria_id || ''),
    legend: supabaseZone.legend || undefined
  };
};

// Mapeo de categoría
export const mapSupabaseToCategory = (supabaseCategory: any): Category => {
  if (!supabaseCategory) throw new Error('Category data is required');

  const idMap: { [key: number]: string } = {
    1: 'liga_masculina',
    2: 'lifufe', 
    3: 'mundialito'
  };

  const numericId = typeof supabaseCategory.liga_id === 'string' 
    ? parseInt(supabaseCategory.liga_id) 
    : supabaseCategory.liga_id;

  const category: Category & { zoneId?: string } = {
    id: String(supabaseCategory.id || ''),
    name: supabaseCategory.nombre || '',
    leagueId: idMap[numericId] || String(numericId),
    isEditable: supabaseCategory.is_editable !== false
  };

  // Incluir zoneId si existe
  if (supabaseCategory.zona_id) {
    (category as any).zoneId = String(supabaseCategory.zona_id);
  }

  return category;
};

// Obtener categorías por liga (estructura dinámica)
export async function getCategoriesByLeague(
  leagueId: string,
  zoneId?: string
): Promise<Category[]> {
  try {
    const data = await obtenerCategoriasPorLigaConEstructura(leagueId, zoneId);
    return data.map(mapSupabaseToCategory);
  } catch (error) {
    console.error('Error getting categories by league:', error);
    return [];
  }
}

// Obtener zonas por liga (estructura dinámica)
export async function getZonesByLeague(
  leagueId: string,
  categoryId?: string
): Promise<Zone[]> {
  try {
    const data = await obtenerZonasPorLigaConEstructura(leagueId, categoryId);
    return data.map(mapSupabaseToZone);
  } catch (error) {
    console.error('Error getting zones by league:', error);
    return [];
  }
}

// Crear categoría con estructura
export async function createCategoryWithStructure(
  name: string,
  leagueId: string,
  zoneId?: string
): Promise<Category | null> {
  try {
    const data = await crearCategoriaConEstructura(name, leagueId, zoneId);
    return data ? mapSupabaseToCategory(data) : null;
  } catch (error) {
    console.error('Error creating category with structure:', error);
    return null;
  }
}

// Crear zona con estructura
export async function createZoneWithStructure(
  name: string,
  leagueId: string,
  categoryId?: string,
  legend?: string
): Promise<Zone | null> {
  const supabaseZone = await crearZonaConEstructura(name, leagueId, categoryId, legend);
  return supabaseZone ? mapSupabaseToZone(supabaseZone) : null;
}


export const mapSupabaseToTeam = (supabaseTeam: any): Team => {
  if (!supabaseTeam) {
    console.error('Team data is required', supabaseTeam);
    throw new Error('Team data is required');
  }
  
  if (!supabaseTeam.id || !supabaseTeam.nombre) {
    console.error('Team must have id and name', supabaseTeam);
    throw new Error('Team must have id and name');
  }
  
  // Mapear IDs numéricos de liga a strings
  const getStringLeagueId = (numericId: number | string): string => {
    const idMap: { [key: number]: string } = {
      1: 'liga_masculina',
      2: 'lifufe', 
      3: 'mundialito'
    };
    
    const numId = typeof numericId === 'string' ? parseInt(numericId) : numericId;
    return idMap[numId] || String(numericId);
  };
  
  // Agregar validación y logging
  console.log('Liga ID recibida:', supabaseTeam.liga_id);
  const mappedLeagueId = supabaseTeam.liga_id ? getStringLeagueId(supabaseTeam.liga_id) : '';
  console.log('Liga ID mapeada:', mappedLeagueId);
  
  return {
    id: supabaseTeam.id,
    name: supabaseTeam.nombre,
    logo: supabaseTeam.logo || '',
    leagueId: mappedLeagueId,
    categoryId: String(supabaseTeam.categoria_id || ''),
    zoneId: String(supabaseTeam.zona_id || '')
  };
};

export const mapSupabaseToFixture = (supabaseFixture: any): Fixture & { invalidLeagueId?: boolean } => {
  console.log('Mapping fixture from Supabase:', supabaseFixture);
  
  // Función para mapear IDs numéricos de liga a strings
  const getStringLeagueId = (numericId: number | string | null | undefined): string => {
    const idMap: { [key: number]: string } = {
      1: 'liga_masculina',
      2: 'lifufe',
      3: 'mundialito'
    };
    if (numericId === null || numericId === undefined || isNaN(Number(numericId))) return '__INVALID__';
    const numId = typeof numericId === 'string' ? parseInt(numericId) : numericId;
    return idMap[numId] || '__INVALID__';
  };
  
  // Asegurarse de que todos los IDs sean strings y manejar valores nulos
  const fixtureId = supabaseFixture.id ? supabaseFixture.id.toString() : '';
  const leagueId = getStringLeagueId(supabaseFixture.liga_id);
  const categoryId = supabaseFixture.categoria_id ? supabaseFixture.categoria_id.toString() : '';
  const zoneId = supabaseFixture.zona_id ? supabaseFixture.zona_id.toString() : '';
  const invalidLeagueId = leagueId === '__INVALID__';
  
  console.log('Mapped IDs:', { fixtureId, leagueId, categoryId, zoneId, invalidLeagueId });
  
  return {
    id: fixtureId,
    date: supabaseFixture.nombre || '',
    matchDate: supabaseFixture.fecha_partido || '',
    leagueId: leagueId,
    categoryId: categoryId,
    zoneId: zoneId,
    leyenda: supabaseFixture.leyenda || '',
    texto_central: supabaseFixture.texto_central || '',
    matches: [],
    invalidLeagueId
  };
};

export const mapSupabaseToMatch = (supabaseMatch: any): Match => ({
  id: supabaseMatch.id,
  fixtureId: supabaseMatch.fixture_id,
  homeTeamId: supabaseMatch.equipo_local?.id || supabaseMatch.equipo_local_id,
  awayTeamId: supabaseMatch.equipo_visitante?.id || supabaseMatch.equipo_visitante_id,
  homeScore: supabaseMatch.resultado_local || 0,
  awayScore: supabaseMatch.resultado_visitante || 0,
  played: supabaseMatch.resultado_local !== null && supabaseMatch.resultado_visitante !== null
});

export const mapSupabaseToStanding = (supabaseStanding: any): Standing => {
  // Validar que los campos requeridos existan
  if (!supabaseStanding) {
    throw new Error('Standing data is required');
  }

  // Función para mapear IDs numéricos de liga a strings
  const getStringLeagueId = (numericId: number | string): string => {
    const idMap: { [key: number]: string } = {
      1: 'liga_masculina',
      2: 'lifufe',
      3: 'mundialito'
    };
    
    const numId = typeof numericId === 'string' ? parseInt(numericId) : numericId;
    return idMap[numId] || String(numericId);
  };

  return {
    id: supabaseStanding.id || '',
    teamId: String(supabaseStanding.equipo_id || supabaseStanding.teamId || ''),
    leagueId: getStringLeagueId(supabaseStanding.liga_id || supabaseStanding.leagueId || ''),
    categoryId: String(supabaseStanding.categoria_id || supabaseStanding.categoryId || ''),
    zoneId: String(supabaseStanding.zona_id || supabaseStanding.zoneId || ''),
    puntos: Number(supabaseStanding.points || supabaseStanding.puntos || 0),
    pj: Number(supabaseStanding.played || supabaseStanding.pj || 0),
    won: Number(supabaseStanding.won || 0),
    drawn: Number(supabaseStanding.drawn || 0),
    lost: Number(supabaseStanding.lost || 0),
    goalsFor: Number(supabaseStanding.goals_for || supabaseStanding.goalsFor || 0),
    goalsAgainst: Number(supabaseStanding.goals_against || supabaseStanding.goalsAgainst || 0)
  };
};

// Mapper para posiciones_editable
export const mapPosicionEditableToStanding = (posicion: any): Standing => ({
  id: String(posicion.id ?? `${posicion.equipo_id}_${posicion.zona_id}_${posicion.categoria_id}`),
  teamId: String(posicion.equipo_id),
  leagueId: String(posicion.liga_id ?? ''),
  categoryId: String(posicion.categoria_id ?? ''),
  zoneId: String(posicion.zona_id ?? ''),
  puntos: Number(posicion.puntos ?? 0),
  pj: Number(posicion.pj ?? 0),
  orden: typeof posicion.orden === 'number' ? posicion.orden : 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0
});

// Mapper para cursos
export const mapSupabaseToCourse = (supabaseCourse: any): Course => {
  return {
    id: supabaseCourse.id || '',
    title: supabaseCourse.title || '',
    description: supabaseCourse.description || '',
    imageUrl: supabaseCourse.image_url || '',
    date: supabaseCourse.date || '',
    active: supabaseCourse.active !== undefined ? supabaseCourse.active : true
  };
};

// Servicio principal
export class SupabaseService {
  // Ligas
  static async getLeagues(): Promise<League[]> {
    try {
      const data = await obtenerLigas();
      return data.map(mapSupabaseToLeague);
    } catch (error) {
      console.error('Error getting leagues:', error);
      return [];
    }
  }

  // Categorías
  static async getCategoriesByLeague(leagueId: string): Promise<Category[]> {
    try {
      // ✅ SOLUCIÓN: Convertir string ID a numérico para todas las ligas
      const numericLeagueId = getNumericLeagueId(leagueId);
      console.log(`🔍 Querying categories for leagueId: ${leagueId} -> ${numericLeagueId}`);
      
      const data = await obtenerCategoriasPorLiga(numericLeagueId.toString());
      return data.map(mapSupabaseToCategory);
    } catch (error) {
      console.error('Error getting categories by league:', error);
      return [];
    }
  }

  static async createCategory(name: string, leagueId: string): Promise<Category | null> {
    try {
      const data = await crearCategoria(name, leagueId);
      return data ? mapSupabaseToCategory(data[0]) : null;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }

  static async createCategoryWithStructure(
    name: string,
    leagueId: string,
    zoneId?: string
  ): Promise<Category | null> {
    try {
      const data = await crearCategoriaConEstructura(name, leagueId, zoneId);
      return data ? mapSupabaseToCategory(data) : null;
    } catch (error) {
      console.error('Error creating category with structure:', error);
      return null;
    }
  }

  static async deleteCategory(id: string): Promise<boolean> {
    try {
      const result = await eliminarCategoriaSupabase(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  // Zonas
  static async getZonas(): Promise<Zone[]> {
    try {
      const { data, error }: PostgrestSingleResponse<any[]> = await supabase
        .from('zonas')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error getting zonas:', error);
        return [];
      }
      
      return data ? data.map(mapSupabaseToZone) : [];
    } catch (error) {
      console.error('Error getting zonas:', error);
      return [];
    }
  }

  static async getZonasByCategory(categoryId: string): Promise<Zone[]> {
    try {
      const { data, error }: PostgrestSingleResponse<any[]> = await supabase
        .from('zonas')
        .select('*')
        .eq('categoria_id', categoryId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error getting zonas by category:', error);
        return [];
      }
      
      return data ? data.map(mapSupabaseToZone) : [];
    } catch (error) {
      console.error('Error getting zonas by category:', error);
      return [];
    }
  }

  // Equipos
  static async getTeamsByZone(zoneId: string): Promise<Team[]> {
    try {
      const data = await obtenerEquiposPorZona(zoneId);
      return data.map(mapSupabaseToTeam);
    } catch (error) {
      console.error('Error getting teams by zone:', error);
      return [];
    }
  }

  static async getAllTeams(): Promise<Team[]> {
    try {
      const data = await obtenerTodosLosEquipos();
      return data.map(mapSupabaseToTeam);
    } catch (error) {
      console.error('Error getting all teams:', error);
      return [];
    }
  }

  // Equipos - Funciones separadas para mayor claridad
  private static async createTeamWithUUIDs(
    name: string,
    zoneId: string,
    leagueId: string,
    categoryId: string,
    logo?: string
  ): Promise<Team | null> {
    try {
// Removed unused numericIds assignment since the values weren't being used
      
      const data = await agregarEquipoCompleto(
        name, 
        zoneId, 
        leagueId, 
        categoryId, 
        logo
      );
      
      if (!data || data.length === 0) {
        console.error('Error creando equipo: No se pudo insertar');
        return null;
      }
      
      return mapSupabaseToTeam(data[0]);
    } catch (error) {
      console.error('Error creating team with UUIDs:', error);
      return null;
    }
  }

  private static async createTeamWithIntegers(
    name: string,
    zoneId: string,
    leagueId: string,
    categoryId: string,
    logo?: string
  ): Promise<Team | null> {
    try {
      const numericLeagueId = getNumericLeagueId(leagueId);
      
      const { data, error }: PostgrestSingleResponse<any[]> = await supabase
        .from('equipos')
        .insert([{
          nombre: name,
          zona_id: parseInt(zoneId),
          liga_id: numericLeagueId,
          categoria_id: parseInt(categoryId),
          logo: logo || null
        }])
        .select();
        
      if (error || !data || data.length === 0) {
        console.error('Error creando equipo:', error);
        return null;
      }
      
      return mapSupabaseToTeam(data[0]);
    } catch (error) {
      console.error('Error creating team with integers:', error);
      return null;
    }
  }

  static async createTeam(
    name: string,
    zoneId: string,
    leagueId: string,
    categoryId: string,
    logo?: string
  ): Promise<Team | null> {
    try {
      console.log('Creating team with IDs:', { zoneId, leagueId, categoryId });
      
      // Verificar si los IDs son UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(zoneId)) {
        return await this.createTeamWithUUIDs(name, zoneId, leagueId, categoryId, logo);
      } else {
        return await this.createTeamWithIntegers(name, zoneId, leagueId, categoryId, logo);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }
  // Agregar después de createTeam (línea 498)
static async updateTeam(
  id: string,
  name: string,
  zoneId: string,
  leagueId: string,
  categoryId: string,
  logo?: string
): Promise<Team | null> {
  try {
    console.log('Updating team with ID:', id, { name, zoneId, leagueId, categoryId });
    
    // Determinar el formato de IDs para la actualización
    const numericLeagueId = getNumericLeagueId(leagueId);
    
    const { data, error } = await supabase
      .from('equipos')
      .update({
        nombre: name,
        zona_id: zoneId === '' ? null : zoneId,
        liga_id: numericLeagueId,
        categoria_id: categoryId === '' ? null : categoryId,
        logo: logo || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return null;
    }

    return mapSupabaseToTeam(data);
  } catch (error) {
    console.error('Error updating team:', error);
    return null;
  }
}

  // Partidos - updateMatchResult ya está completo
  static async updateMatchResult(matchId: string, homeScore: number, awayScore: number) {
    try {
      return await actualizarResultadoPartido(matchId, homeScore, awayScore);
    } catch (error) {
      console.error('Error updating match result:', error);
      return null;
    }
  }

  static async createMatch(homeTeamId: string, awayTeamId: string, zoneId: string, date: string) {
    try {
      return await crearPartido(homeTeamId, awayTeamId, zoneId, date);
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }

  static async getMatchesWithTeamsAndResults() {
    try {
      return await obtenerPartidosConEquiposYResultados();
    } catch (error) {
      console.error('Error getting matches with teams and results:', error);
      return [];
    }
  }

  static async createFixture(fixtureData: {
    nombre: string;
    fechaPartido: string;
    ligaId: string;
    categoriaId: string;
    zonaId: string;
    leyenda?: string;
    texto_central?: string;
    matches: {
      homeTeamId: string;
      awayTeamId: string;
    }[];
  }): Promise<{ success: boolean; fixtureId?: string; error?: string }> {
    try {
      // Mapear leagueId string a número SIEMPRE antes de guardar
      const numericLeagueId = getNumericLeagueId(fixtureData.ligaId);
      const fixtureResult = await crearFixture(
        fixtureData.nombre,
        fixtureData.fechaPartido,
        numericLeagueId, // Usar el ID numérico correcto
        Number(fixtureData.categoriaId),
        fixtureData.zonaId ? Number(fixtureData.zonaId) : null,
        fixtureData.leyenda || null,
        fixtureData.texto_central || null
      );

      if (!fixtureResult || fixtureResult.length === 0) {
        return { success: false, error: 'Error creando fixture' };
      }

      const fixtureId = fixtureResult[0].id;

      // Obtener todos los equipos para mapear UUID a ID numérico
      const allTeams = await SupabaseService.getAllTeams();
      // Crear un mapa de UUID a ID numérico
      const uuidToNumericId: Record<string, number> = {};
      for (const team of allTeams) {
        if (team.id && (team as any).numericId) {
          uuidToNumericId[team.id] = (team as any).numericId;
        }
      }

      // Obtener todas las zonas para mapear UUID a ID numérico de zona
      const allZones = await SupabaseService.getZonesByLeague(fixtureData.ligaId);
      const zoneUuidToNumericId: Record<string, number> = {};
      for (const zone of allZones) {
        if (zone.id && (zone as any).numericId) {
          zoneUuidToNumericId[zone.id] = (zone as any).numericId;
        }
      }

      for (const match of fixtureData.matches) {
        // Mapear los IDs de equipo y zona a numérico si es posible
        const homeTeamNumericId = uuidToNumericId[match.homeTeamId] || Number(match.homeTeamId);
        const awayTeamNumericId = uuidToNumericId[match.awayTeamId] || Number(match.awayTeamId);
        const zoneNumericId = zoneUuidToNumericId[fixtureData.zonaId] || Number(fixtureData.zonaId);

        const matchResult = await crearPartidoConFixture(
          homeTeamNumericId,
          awayTeamNumericId,
          zoneNumericId,
          fixtureData.fechaPartido,
          Number(fixtureId)
        );

        if (!matchResult) {
          console.error('Error creando partido para fixture:', fixtureId);
        }
      }

      return { success: true, fixtureId };
    } catch (error) {
      console.error('Error en createFixture:', error);
      return { success: false, error: 'Error inesperado creando fixture' };
    }
  }

  static async getFixtures(): Promise<Fixture[]> {
    try {
      console.log('=== GETTING FIXTURES FROM SUPABASE ===');
      const data = await obtenerFixtures();
      console.log('Raw fixtures data from Supabase:', data);
      
      if (!data || data.length === 0) {
        console.log('No fixtures found in database');
        return [];
      }
      
      const fixtures = data.map(mapSupabaseToFixture);
      console.log('Mapped fixtures:', fixtures);
      
      // Cargar matches para cada fixture EN PARALELO
      await Promise.all(
        fixtures.map(async (fixture) => {
          try {
            const matchesData = await obtenerPartidosPorFixture(fixture.id);
            fixture.matches = matchesData.map(mapSupabaseToMatch);
            console.log(`Loaded ${fixture.matches.length} matches for fixture ${fixture.id}`);
          } catch (error) {
            console.error(`Error loading matches for fixture ${fixture.id}:`, error);
            fixture.matches = [];
          }
        })
      );
      
      console.log('Final fixtures with matches:', fixtures);
      return fixtures;
    } catch (error) {
      console.error('Error in getFixtures:', error);
      return [];
    }
  }

  static async getMatchesByFixture(fixtureId: string): Promise<Match[]> {
    try {
      const data = await obtenerPartidosPorFixture(fixtureId);
      return data.map(mapSupabaseToMatch);
    } catch (error) {
      console.error('Error getting matches by fixture:', error);
      return [];
    }
  }

  static async deleteFixture(fixtureId: string): Promise<boolean> {
    try {
      return await eliminarFixture(fixtureId);
    } catch (error) {
      console.error('Error in deleteFixture:', error);
      return false;
    }
  }

  // Standings
  static async getStandingsByZone(zoneId: string): Promise<Standing[]> {
    try {
      const posicionesData = await obtenerPosicionesPorZona(zoneId);
      return posicionesData.map(mapPosicionEditableToStanding);
    } catch (error) {
      console.error('Error getting standings by zone:', error);
      return [];
    }
  }

  static async createStanding(standing: Omit<Standing, 'id'>): Promise<Standing | null> {
    try {
      const { data, error } = await supabase
        .from('standings')
        .insert([standing])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating standing:', error);
      return null;
    }
  };

  static async updateStanding(standingId: string, updates: Partial<Standing>): Promise<Standing | null> {
    try {
      console.log('🔄 SupabaseService.updateStanding:', { standingId, updates });
      
      // Validar que el ID sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(standingId)) {
        console.error('❌ ID inválido, no es un UUID:', standingId);
        throw new Error(`ID inválido: ${standingId}. Debe ser un UUID válido.`);
      }
      
      const supabaseUpdates: any = {};
      
      // Mapear campos con validación
      if (updates.puntos !== undefined && !isNaN(Number(updates.puntos))) {
        supabaseUpdates.points = Number(updates.puntos);
        console.log('📊 Mapeando points:', updates.puntos, '->', supabaseUpdates.points);
      }
      if (updates.pj !== undefined && !isNaN(Number(updates.pj))) {
        supabaseUpdates.played = Number(updates.pj);
        console.log('📊 Mapeando played:', updates.pj, '->', supabaseUpdates.played);
      }
      if (updates.won !== undefined && !isNaN(Number(updates.won))) {
        supabaseUpdates.won = Number(updates.won);
      }
      if (updates.drawn !== undefined && !isNaN(Number(updates.drawn))) {
        supabaseUpdates.drawn = Number(updates.drawn);
      }
      if (updates.lost !== undefined && !isNaN(Number(updates.lost))) {
        supabaseUpdates.lost = Number(updates.lost);
      }
      if (updates.goalsFor !== undefined && !isNaN(Number(updates.goalsFor))) {
        supabaseUpdates.goals_for = Number(updates.goalsFor);
      }
      if (updates.goalsAgainst !== undefined && !isNaN(Number(updates.goalsAgainst))) {
        supabaseUpdates.goals_against = Number(updates.goalsAgainst);
      }
      
      console.log('📤 Enviando a Supabase:', supabaseUpdates);
      
      const supabaseStanding = await actualizarStanding(standingId, supabaseUpdates);
      
      if (supabaseStanding && supabaseStanding[0]) {
        console.log('📥 Respuesta de Supabase:', supabaseStanding[0]);
        const mappedStanding = mapSupabaseToStanding(supabaseStanding[0]);
        console.log('✅ Standing mapeado:', mappedStanding);
        return mappedStanding;
      }
      
      console.error('❌ No se recibió respuesta válida de Supabase');
      return null;
    } catch (error) {
      console.error('❌ Error updating standing:', error);
      throw error;
    }
  }

  static async deleteStanding(standingId: string): Promise<boolean> {
    try {
      return await eliminarStanding(standingId);
    } catch (error) {
      console.error('Error deleting standing:', error);
      return false;
    }
  }

  // Métodos para Cursos

  static async createCourse(course: {
    title: string;
    description: string;
    imageFile: File;
    date: string;
  }): Promise<Course> {
    try {
      // Convertir archivo a datos binarios
      const arrayBuffer = await course.imageFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
      console.log('🟣 [createCourse] imageData:', imageData, 'length:', imageData.length, 'type:', typeof imageData);
      const supabaseCourse = await crearCurso({
        title: course.title,
        description: course.description,
        image_data: imageData, // Usar datos binarios
        date: course.date,
      });
      return mapSupabaseToCourse(supabaseCourse);
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  static async updateCourse(courseId: string, updates: {
    title?: string;
    description?: string;
    imageFile?: File; // Cambiar de imageUrl a imageFile
    date?: string;
  }): Promise<Course | null> {
    try {
      const supabaseUpdates: any = {};
      if (updates.title !== undefined) supabaseUpdates.title = updates.title;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.imageFile !== undefined) {
        // Convertir archivo a datos binarios
        const arrayBuffer = await updates.imageFile.arrayBuffer();
        supabaseUpdates.image_data = new Uint8Array(arrayBuffer);
      }
      if (updates.date !== undefined) supabaseUpdates.date = updates.date;
  
      const supabaseCourse = await actualizarCurso(courseId, supabaseUpdates);
      return supabaseCourse ? mapSupabaseToCourse(supabaseCourse) : null;
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  static async deleteCourse(courseId: string): Promise<boolean> {
    try {
      return await eliminarCurso(courseId);
    } catch (error) {
      console.error('Error deleting course:', error);
      return false;
    }
  }

  static async getZonesByLeague(leagueId: string): Promise<Zone[]> {
    try {
      const data = await obtenerZonasPorLiga(leagueId);
      return data.map(mapSupabaseToZone);
    } catch (error) {
      console.error('Error getting zones by league:', error);
      return [];
    }
  }

  static async updateCategory(id: string, updates: { name: string }) {
    const { error } = await supabase
      .from('categorias')
      .update({ nombre: updates.name })
      .eq('id', id);
    if (error) throw error;
  }

  static async updateFixtureWithMatches(fixtureId: string, fixtureData: {
    nombre: string;
    fechaPartido: string;
    ligaId: string;
    categoriaId: string;
    zonaId: string;
    leyenda?: string;
    texto_central?: string;
    matches: {
      homeTeamId: string;
      awayTeamId: string;
    }[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('fixtures')
        .update({
          nombre: fixtureData.nombre,
          fecha_partido: fixtureData.fechaPartido,
          leyenda: fixtureData.leyenda || null,
          texto_central: fixtureData.texto_central || null,
          zona_id: fixtureData.zonaId ? Number(fixtureData.zonaId) : null
        })
        .eq('id', Number(fixtureId));

      // Borrar partidos existentes
      await supabase
        .from('partidos')
        .delete()
        .eq('fixture_id', Number(fixtureId));

      // Insertar nuevos partidos
      for (const match of fixtureData.matches) {
        await crearPartidoConFixture(
          Number(match.homeTeamId),
          Number(match.awayTeamId),
          fixtureData.zonaId ? Number(fixtureData.zonaId) : null,
          fixtureData.fechaPartido,
          Number(fixtureId)
        );
      }
      return { success: true };
    } catch (error) {
      console.error('Error actualizando fixture y partidos:', error);
      return { success: false, error: 'Error actualizando fixture y partidos' };
    }
  }

  static async uploadCourseImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `courses/${fileName}`;

    console.log('🟠 Subiendo archivo:', file, 'size:', file.size, 'type:', file.type, 'filePath:', filePath);

    // Sube la imagen al bucket
    const { error } = await supabase.storage
      .from('courses-images')
      .upload(filePath, file);

    if (error) {
      console.error('🔴 Error subiendo imagen a Storage:', error.message || error);
      throw error;
    }

    // Obtiene la URL pública
    const { data } = supabase.storage
      .from('courses-images')
      .getPublicUrl(filePath);

    console.log('🟢 Imagen subida correctamente. URL pública:', data.publicUrl);
    return data.publicUrl;
  }

  static async createCourseWithImageUrl(course: {
    title: string;
    description: string;
    imageUrl: string;
    date: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        title: course.title,
        description: course.description,
        image_url: course.imageUrl,
        date: course.date,
      }])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async updateCourseWithImageUrl(courseId: string, updates: {
    title?: string;
    description?: string;
    imageUrl?: string;
    date?: string;
  }): Promise<any> {
    // Solo incluir campos definidos
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.date !== undefined) updateData.date = updates.date;

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapSupabaseToCourse);
  }
}

// Exportación específica
export { eliminarCategoriaSupabase as eliminarCategoria };
