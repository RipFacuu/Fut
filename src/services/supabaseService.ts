import { supabase } from '../lib/supabase';
import {
  obtenerZonas,
  obtenerZonasPorCategoria,
  obtenerZonasPorLigaYCategoria,
  obtenerTodasLasZonas,
  agregarEquipo,
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
  obtenerZonasPorCategoria,
  crearZona,
  obtenerEquiposPorZona,
  crearEquipo,
  obtenerFixtures,
  crearPartido,
  obtenerPartidosConEquiposYResultados,
  obtenerEquipos,
  crearFixture,
  crearPartidoConFixture,
  obtenerPartidosPorFixture,
  eliminarFixture  // Agregar esta línea
} from '../lib/supabase';

import { League, Category, Zone, Team, Fixture, Match } from '../contexts/LeagueContext';

// Mappers
export const mapSupabaseToLeague = (supabaseLeague: any): League => ({
  id: supabaseLeague.id,
  name: supabaseLeague.nombre,
  description: supabaseLeague.descripcion,
  logo: supabaseLeague.logo
});

export const mapSupabaseToCategory = (supabaseCategory: any): Category => ({
  id: supabaseCategory.id,
  name: supabaseCategory.nombre,
  leagueId: supabaseCategory.liga_id,
  isEditable: true
});

export const mapSupabaseToZone = (supabaseZone: any): Zone => ({
  id: supabaseZone.id,
  name: supabaseZone.nombre,
  leagueId: supabaseZone.liga_id,
  categoryId: supabaseZone.categoria_id
});

export const mapSupabaseToTeam = (supabaseTeam: any): Team => ({
  id: supabaseTeam.id,
  name: supabaseTeam.nombre,
  logo: supabaseTeam.logo,
  leagueId: supabaseTeam.liga_id,
  categoryId: supabaseTeam.categoria_id,
  zoneId: supabaseTeam.zona_id
});

export const mapSupabaseToFixture = (supabaseFixture: any): Fixture => {
  console.log('Mapping fixture from Supabase:', supabaseFixture);
  
  // Asegurarse de que todos los IDs sean strings y manejar valores nulos
  const fixtureId = supabaseFixture.id ? supabaseFixture.id.toString() : '';
  const leagueId = supabaseFixture.liga_id ? supabaseFixture.liga_id.toString() : '';
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

// Mover esta función FUERA de la clase SupabaseService
export const mapSupabaseToMatch = (supabaseMatch: any): Match => ({
  id: supabaseMatch.id,
  fixtureId: supabaseMatch.fixture_id,
  homeTeamId: supabaseMatch.equipo_local?.id || supabaseMatch.equipo_local_id,
  awayTeamId: supabaseMatch.equipo_visitante?.id || supabaseMatch.equipo_visitante_id,
  homeScore: supabaseMatch.resultado_local || 0,
  awayScore: supabaseMatch.resultado_visitante || 0,
  played: supabaseMatch.resultado_local !== null && supabaseMatch.resultado_visitante !== null
});

// Servicio principal
export class SupabaseService {
  // Ligas
  static async getLeagues(): Promise<League[]> {
    const data = await obtenerLigas();
    return data.map(mapSupabaseToLeague);
  }

  // Categorías
  static async getCategoriesByLeague(leagueId: string): Promise<Category[]> {
    const data = await obtenerCategoriasPorLiga(leagueId);
    return data.map(mapSupabaseToCategory);
  }

  static async createCategory(name: string, leagueId: string): Promise<Category | null> {
    const data = await crearCategoria(name, leagueId);
    return data ? mapSupabaseToCategory(data[0]) : null;
  }

  static async deleteCategory(id: string): Promise<boolean> {
    const result = await eliminarCategoria(id);
    return !!result;
  }

  // Zonas
  static async getZonas(): Promise<Zone[]> {
    const { data } = await supabase.from('zonas').select('*').order('created_at', { ascending: false });
    return data ? data.map(mapSupabaseToZone) : [];
  }

  static async getZonasByCategory(categoryId: string): Promise<Zone[]> {
    const { data } = await supabase
      .from('zonas')
      .select('*')
      .eq('categoria_id', categoryId)
      .order('created_at', { ascending: false });
    return data ? data.map(mapSupabaseToZone) : [];
  }

  static async getZonasByLeagueAndCategory(leagueId: string, categoryId: string): Promise<Zone[]> {
    const data = await obtenerZonasPorLigaYCategoria(leagueId, categoryId);
    return data.map(mapSupabaseToZone);
  }

  static async createZone(name: string, leagueId: string, categoryId: string): Promise<Zone | null> {
    const data = await crearZona(name, leagueId, categoryId);
    return data ? mapSupabaseToZone(data[0]) : null;
  }

  static async updateZone(id: string, zoneData: Partial<Zone>): Promise<Zone | null> {
    const { data } = await supabase
      .from('zonas')
      .update({
        nombre: zoneData.name,
        liga_id: zoneData.leagueId,
        categoria_id: zoneData.categoryId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    return data ? mapSupabaseToZone(data) : null;
  }

  static async deleteZone(id: string): Promise<boolean> {
    const { error } = await supabase.from('zonas').delete().eq('id', id);
    if (error) {
      console.error('Error deleting zone:', error);
      return false;
    }
    return true;
  }

  static async getAllZones(): Promise<Zone[]> {
    const data = await obtenerTodasLasZonas();
    return data.map(mapSupabaseToZone);
  }

  // Equipos
  static async getTeamsByZone(zoneId: string): Promise<Team[]> {
    const data = await obtenerEquiposPorZona(zoneId);
    return data.map(mapSupabaseToTeam);
  }

  static async getAllTeams(): Promise<Team[]> {
    const data = await obtenerTodosLosEquipos();
    return data.map(mapSupabaseToTeam);
  }

  static async createTeam(
    name: string,
    zoneId: string,
    leagueId: string,
    categoryId: string,
    logo?: string
  ): Promise<Team | null> {
    const data = await agregarEquipoCompleto(name, zoneId, leagueId, categoryId, logo);
    if (!data || data.length === 0) {
      console.error('Error creando equipo: No se pudo insertar');
      return null;
    }
    return mapSupabaseToTeam(data[0]);
  }

  // Partidos
  static async createMatch(homeTeamId: string, awayTeamId: string, zoneId: string, date: string) {
    return await crearPartido(homeTeamId, awayTeamId, zoneId, date);
  }

  static async getMatchesWithTeamsAndResults() {
    return await obtenerPartidosConEquiposYResultados();
  }

  static async updateMatchResult(matchId: string, homeScore: number, awayScore: number) {
    return await actualizarResultadoPartido(matchId, homeScore, awayScore);
  }

  // Fixtures
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
      throw error;
    }
  }

  static async getMatchesByFixture(fixtureId: string): Promise<Match[]> {
    return await obtenerPartidosPorFixture(fixtureId);
  }

  static async deleteFixture(fixtureId: string): Promise<boolean> {
    try {
      return await eliminarFixture(fixtureId);
    } catch (error) {
      console.error('Error in deleteFixture:', error);
      return false;
    }
  }
}

// Exportación específica
export { eliminarCategoria };
