import { supabase } from '../lib/supabase';
import { PostgrestSingleResponse,  } from '@supabase/supabase-js';
import { getNumericLeagueId, } from '../lib/supabase';
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
  crearStanding,
  obtenerPosicionesPorZona,
  actualizarStanding,
  eliminarStanding,
  // Funciones para cursos que faltaban
  crearCurso,
  actualizarCurso,
  eliminarCurso, // Función faltante agregada
} from '../lib/supabase';

import { League, Category, Zone, Team, Fixture, Match, Standing, Course } from '../contexts/LeagueContext';

// Función auxiliar para obtener IDs numéricos (necesaria para createTeam)
async function getNumericIds(teamId: string | null, zoneId: string, leagueId: string, categoryId: string) {
  // Esta función debería implementarse según la lógica de tu aplicación
  // Por ahora retorno los IDs convertidos a números
  return {
    teamId: teamId ? parseInt(teamId) : null,
    zoneId: parseInt(zoneId),
    leagueId: parseInt(leagueId),
    categoryId: parseInt(categoryId)
  };
}

// Mappers con validaciones mejoradas
export const mapSupabaseToLeague = (supabaseLeague: any): League => {
  if (!supabaseLeague) {
    throw new Error('League data is required');
  }
  
  // Convertir liga_id de la base de datos a string para consistencia
  const getStringLeagueId = (dbLeagueId: any): string => {
    // Si ya es string, devolverlo tal como está
    if (typeof dbLeagueId === 'string') {
      return dbLeagueId;
    }
    
    // Si es numérico, mapear a string
    const idMap: { [key: number]: string } = {
      1: 'liga_masculina',
      2: 'lifufe',
      3: 'mundialito'
    };
    
    return idMap[dbLeagueId] || String(dbLeagueId);
  };
  
  // Usar el ID exactamente como está almacenado en la base de datos
  const leagueId = getStringLeagueId(supabaseLeague.id);
  
  console.log('Liga ID recibida de Supabase:', supabaseLeague.id);
  console.log('Liga ID mapeada:', leagueId);
  
  return {
    id: leagueId,
    name: supabaseLeague.nombre || '',
    logo: supabaseLeague.logo || ''
  };
};

export const mapSupabaseToZone = (supabaseZone: any): Zone => {
  if (!supabaseZone) {
    throw new Error('Zone data is required');
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
  
  return {
    id: supabaseZone.id || '',
    name: supabaseZone.nombre || '',
    leagueId: getStringLeagueId(supabaseZone.liga_id || ''),
    categoryId: String(supabaseZone.categoria_id || '')
  };
};

export const mapSupabaseToCategory = (supabaseCategory: any): Category => {
  if (!supabaseCategory) {
    throw new Error('Category data is required');
  }
  
  // Convertir liga_id de la base de datos a string para consistencia
  const getStringLeagueId = (dbLeagueId: any): string => {
    // Si ya es string, devolverlo tal como está
    if (typeof dbLeagueId === 'string') {
      return dbLeagueId;
    }
    
    // Si es numérico, mapear a string
    const idMap: { [key: number]: string } = {
      1: 'liga_masculina',
      2: 'lifufe',
      3: 'mundialito'
    };
    
    return idMap[dbLeagueId] || String(dbLeagueId);
  };
  
  return {
    id: supabaseCategory.id || '',
    name: supabaseCategory.nombre || '',
    leagueId: getStringLeagueId(supabaseCategory.liga_id),
    isEditable: true
  };
};

export const mapSupabaseToTeam = (supabaseTeam: any): Team => {
  if (!supabaseTeam) {
    throw new Error('Team data is required');
  }
  
  if (!supabaseTeam.id || !supabaseTeam.nombre) {
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

export const mapSupabaseToFixture = (supabaseFixture: any): Fixture => {
  console.log('Mapping fixture from Supabase:', supabaseFixture);
  
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
  
  // Asegurarse de que todos los IDs sean strings y manejar valores nulos
  const fixtureId = supabaseFixture.id ? supabaseFixture.id.toString() : '';
  const leagueId = supabaseFixture.liga_id ? getStringLeagueId(supabaseFixture.liga_id) : '';
  const categoryId = supabaseFixture.categoria_id ? supabaseFixture.categoria_id.toString() : '';
  const zoneId = supabaseFixture.zona_id ? supabaseFixture.zona_id.toString() : '';
  
  console.log('Mapped IDs:', { fixtureId, leagueId, categoryId, zoneId });
  
  return {
    id: fixtureId,
    date: supabaseFixture.nombre || '',
    matchDate: supabaseFixture.fecha_partido || '',
    leagueId: leagueId,
    categoryId: categoryId,
    zoneId: zoneId,
    matches: []
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
export const mapPosicionEditableToStanding = (posicion: any): Standing & { teamName?: string } => {
  if (!posicion) {
    throw new Error('Posicion data is required');
  }

  return {
    id: `${posicion.equipo_id}_${posicion.zona_id}`,
    teamId: String(posicion.equipo_id || ''),
    leagueId: String(posicion.liga_id || ''),
    categoryId: String(posicion.categoria_id || ''),
    zoneId: String(posicion.zona_id || ''),
    puntos: Number(posicion.puntos || 0),
    pj: Number(posicion.pj || 0),
    won: Number(posicion.won || 0),
    drawn: Number(posicion.drawn || 0),
    lost: Number(posicion.lost || 0),
    goalsFor: Number(posicion.goals_for || 0),
    goalsAgainst: Number(posicion.goals_against || 0),
    teamName: posicion.equipo_nombre || posicion.teamName
  };
};

// Mapper para cursos
export const mapSupabaseToCourse = (supabaseCourse: any): Course => {
  // Convertir datos binarios a URL para mostrar en la interfaz
  let imageUrl = '';
  if (supabaseCourse.image_data && typeof window !== 'undefined') {
    // Solo ejecutar en el navegador, no durante el build del servidor
    try {
      const blob = new Blob([supabaseCourse.image_data], { type: 'image/png' });
      imageUrl = URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
    }
  }

  return {
    id: supabaseCourse.id || '',
    title: supabaseCourse.title || '',
    description: supabaseCourse.description || '',
    imageUrl: imageUrl,
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
      // NO convertir a numérico - usar el leagueId original como string
      console.log(`🔍 Querying categories for leagueId: ${leagueId}`);
      
      const data = await obtenerCategoriasPorLiga(leagueId);
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
      const numericIds = await getNumericIds(null, zoneId, leagueId, categoryId);
      
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
      const getNumericLeagueId = (leagueStringId: string): number => {
        const leagueMap: { [key: string]: number } = {
          'liga_masculina': 1,
          'lifufe': 2,
          'mundialito': 3
        };
        return leagueMap[leagueStringId] || parseInt(leagueStringId);
      };
      
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
        zona_id: zoneId,
        liga_id: numericLeagueId,
        categoria_id: categoryId,
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
    matches: {
      homeTeamId: string;
      awayTeamId: string;
    }[];
  }): Promise<{ success: boolean; fixtureId?: string; error?: string }> {
    try {
      const fixtureResult = await crearFixture(
        fixtureData.nombre,
        fixtureData.fechaPartido,
        fixtureData.ligaId,
        fixtureData.categoriaId,
        fixtureData.zonaId
      );

      if (!fixtureResult || fixtureResult.length === 0) {
        return { success: false, error: 'Error creando fixture' };
      }

      const fixtureId = fixtureResult[0].id;

      for (const match of fixtureData.matches) {
        const matchResult = await crearPartidoConFixture(
          match.homeTeamId,
          match.awayTeamId,
          fixtureData.zonaId,
          fixtureData.fechaPartido,
          fixtureId
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
      
      // Cargar matches para cada fixture
      for (const fixture of fixtures) {
        try {
          const matchesData = await obtenerPartidosPorFixture(fixture.id);
          fixture.matches = matchesData.map(mapSupabaseToMatch);
          console.log(`Loaded ${fixture.matches.length} matches for fixture ${fixture.id}`);
        } catch (error) {
          console.error(`Error loading matches for fixture ${fixture.id}:`, error);
          fixture.matches = [];
        }
      }
      
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
      // Usar posiciones_editable en lugar de standings
      const posicionesData = await obtenerPosicionesPorZona(zoneId);
      return posicionesData.map(mapPosicionEditableToStanding);
    } catch (error) {
      console.error('Error getting standings by zone:', error);
      return [];
    }
  }

  static async createStanding(standing: {
    teamId: string;
    leagueId: string;
    categoryId: string;
    zoneId: string;
    points?: number;
    played?: number;
    won?: number;
    drawn?: number;
    lost?: number;
    goalsFor?: number;
    goalsAgainst?: number;
  }): Promise<any> {
    try {
      console.log('🔄 SupabaseService.createStanding llamado con:', standing);
      
      // Validar que no sean IDs temporales
      if (standing.teamId.startsWith('temp-')) {
        throw new Error('No se puede crear standing para equipo temporal');
      }

      // Validar campos requeridos
      if (!standing.teamId || !standing.zoneId) {
        throw new Error('teamId y zoneId son requeridos');
      }
  
      const result = await crearStanding({
        equipo_id: standing.teamId,
        liga_id: standing.leagueId,
        categoria_id: standing.categoryId,
        zona_id: standing.zoneId,
        points: standing.points || 0,
        played: standing.played || 0,
        won: standing.won || 0,
        drawn: standing.drawn || 0,
        lost: standing.lost || 0,
        goals_for: standing.goalsFor || 0,
        goals_against: standing.goalsAgainst || 0
      });
      
      console.log('✅ Standing creado en Supabase:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en SupabaseService.createStanding:', error);
      throw error;
    }
  }

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
    imageFile: File; // Cambiar para recibir archivo en lugar de URL
    date: string;
  }): Promise<Course> {
    try {
      // Convertir archivo a datos binarios
      const arrayBuffer = await course.imageFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
  
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
}

// Exportación específica
export { eliminarCategoriaSupabase as eliminarCategoria };
