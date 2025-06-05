// Importar useCallback si no está importado
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockLeagueData } from '../data/mockData';
import { zonesService } from '../services/zonesService';
import { supabase, eliminarEquipo, eliminarCategoria } from '../lib/supabase';
import { SupabaseService } from '../services/supabaseService';

// Types
export interface Team {
  id: string;
  name: string;
  logo?: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
}

export interface Category {
  id: string;
  name: string;
  leagueId: string;
  isEditable: boolean;
}

export interface Zone {
  id: string;
  name: string;
  leagueId: string;
  categoryId: string;
}

export interface Match {
  id: string;
  fixtureId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
}

export interface Fixture {
  id: string;
  date: string;
  matchDate: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  matches: Match[];
}

export interface Standing {
  id: string;
  teamId: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  active: boolean;
}

export interface LeagueContextType {
  leagues: League[];
  categories: Category[];
  zones: Zone[];
  teams: Team[];
  fixtures: Fixture[];
  standings: Standing[];
  courses: Course[];
  
  // League operations
  getLeague: (id: string) => League | undefined;
  
  // Category operations
  getCategoriesByLeague: (leagueId: string) => Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | undefined>;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => Promise<void>;
  
  // Zone operations
  getZonesByCategory: (categoryId: string) => Zone[];
  addZone: (zone: Omit<Zone, 'id'>) => Promise<Zone>;
  updateZone: (id: string, data: Partial<Zone>) => Promise<Zone>;
  deleteZone: (id: string) => Promise<void>;
  
  // Team operations
  getTeamsByZone: (zoneId: string) => Team[];
  addTeam: (team: Omit<Team, 'id'>) => Promise<Team | undefined>;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => Promise<void>;
  
  // Fixture operations
  getFixturesByZone: (zoneId: string) => Fixture[];
  addFixture: (fixture: Omit<Fixture, 'id'>) => void;
  updateFixture: (id: string, data: Partial<Fixture>) => void;
  deleteFixture: (id: string) => Promise<void>;
  refreshFixtures: () => Promise<void>;
  
  // Match operations
  updateMatchResult: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  
  // Standings operations
  getStandingsByZone: (zoneId: string) => Standing[];
  updateStanding: (id: string, data: Partial<Standing>) => void;
  addStanding: (standing: Omit<Standing, 'id'>) => void;
  calculateStandingsFromMatches: (zoneId: string) => Standing[];

  // Course operations
  getCourses: () => Course[];
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
}

// Solo una declaración del contexto
const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

// Solo una declaración de useLeague
export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
}


interface LeagueProviderProps {
  children: React.ReactNode;
}

export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children }) => {
  // Initialize state with mock data
  const [leagues, setLeagues] = useState<League[]>(mockLeagueData.leagues);
  const [categories, setCategories] = useState<Category[]>(mockLeagueData.categories);
  const [zones, setZones] = useState<Zone[]>([]);
  const [teams, setTeams] = useState<Team[]>(mockLeagueData.teams);
  const [fixtures, setFixtures] = useState<Fixture[]>(mockLeagueData.fixtures);
  const [standings, setStandings] = useState<Standing[]>(mockLeagueData.standings);
  const [courses, setCourses] = useState<Course[]>([]);

  // Cargar todas las categorías al inicializar
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        console.log('=== LOADING CATEGORIES FROM SUPABASE ===');
        // Cargar categorías para todas las ligas
        const allCategories: Category[] = [];
        for (const league of leagues) {
          console.log('Loading categories for league:', league.id);
          const leagueCategories = await SupabaseService.getCategoriesByLeague(league.id);
          console.log('Categories loaded for league', league.id, ':', leagueCategories);
          allCategories.push(...leagueCategories);
        }
        
        console.log('All categories from Supabase:', allCategories);
        
        // Combinar con las categorías mock existentes (evitar duplicados)
        setCategories(prev => {
          console.log('Previous categories:', prev);
          const existingIds = prev.map(cat => cat.id);
          const newCategories = allCategories.filter(cat => !existingIds.includes(cat.id));
          console.log('New categories to add:', newCategories);
          const finalCategories = [...prev, ...newCategories];
          console.log('Final categories:', finalCategories);
          return finalCategories;
        });
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadAllCategories();
  }, [leagues]);

  // Cargar todas las zonas al inicializar
  useEffect(() => {
    const loadAllZones = async () => {
      try {
        console.log('=== LOADING ZONES FROM SUPABASE ===');
        const allZones = await zonesService.getAllZones();
        console.log('All zones from Supabase:', allZones);
        setZones(allZones);
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    };
    
    loadAllZones();
  }, []);

  // Cargar todos los equipos al inicializar
  useEffect(() => {
    const loadAllTeams = async () => {
      try {
        console.log('=== LOADING TEAMS FROM SUPABASE ===');
        const allTeams = await SupabaseService.getAllTeams();
        console.log('All teams from Supabase:', allTeams);
        
        // Combinar con equipos mock existentes (evitar duplicados)
        setTeams(prev => {
          const existingIds = prev.map(team => team.id);
          const newTeams = allTeams.filter(team => !existingIds.includes(team.id));
          return [...prev, ...newTeams];
        });
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    };
    
    loadAllTeams();
  }, []);

  // Cargar fixtures al inicializar
  useEffect(() => {
    const loadAllFixtures = async () => {
      try {
        console.log('=== LOADING FIXTURES FROM SUPABASE ===');
        const allFixtures = await SupabaseService.getFixtures();
        console.log('All fixtures from Supabase:', allFixtures);
        console.log('Number of fixtures loaded:', allFixtures.length);
        
        // Verificar que cada fixture tenga matches
        allFixtures.forEach((fixture, index) => {
          console.log(`Fixture ${index + 1}:`, {
            id: fixture.id,
            date: fixture.date,
            matchDate: fixture.matchDate,
            leagueId: fixture.leagueId,
            categoryId: fixture.categoryId,
            zoneId: fixture.zoneId,
            matchesCount: fixture.matches.length,
            matches: fixture.matches
          });
        });
        
        setFixtures(allFixtures);
      } catch (error) {
        console.error('Error loading fixtures:', error);
      }
    };
    
    loadAllFixtures();
  }, []);

  // League operations
  const getLeague = (id: string) => {
    return leagues.find(league => league.id === id);
  };

  // Category operations
  const getCategoriesByLeague = (leagueId: string) => {
    const filtered = categories.filter(category => category.leagueId === leagueId);
    console.log('getCategoriesByLeague called with:', leagueId, 'returning:', filtered);
    return filtered;
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await SupabaseService.createCategory(
        category.name,
        category.leagueId
      );
      
      if (newCategory) {
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      }
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, ...data } : cat
    ));
  };

  const deleteCategory = async (id: string) => {
    try {
      // Eliminar de Supabase
      const success = await eliminarCategoria(id);
      
      if (success) {
        // Eliminar del estado local
        setCategories(categories.filter(cat => cat.id !== id));
        console.log('Categoría eliminada exitosamente');
      } else {
        console.error('Error al eliminar categoría de la base de datos');
        alert('Error al eliminar la categoría');
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert('Error al eliminar la categoría');
    }
  };

  // Zone operations
  const getZonesByCategory = (categoryId: string): Zone[] => {
    const filtered = zones.filter(zone => zone.categoryId === categoryId);
    console.log('getZonesByCategory called with:', categoryId, 'returning:', filtered);
    return filtered;
  };
  
  const addZone = async (zone: Omit<Zone, 'id'>): Promise<Zone> => {
    try {
      const newZone = await zonesService.createZone(zone);
      setZones(prev => [...prev, newZone]);
      return newZone;
    } catch (error) {
      console.error('Error creating zone:', error);
      // Crear zona fallback en caso de error
      const fallbackZone: Zone = {
        ...zone,
        id: `zone_${Date.now()}`
      };
      setZones(prev => [...prev, fallbackZone]);
      return fallbackZone;
    }
  };
  
  const updateZone = async (id: string, data: Partial<Zone>): Promise<Zone> => {
    try {
      const updatedZone = await zonesService.updateZone(id, data as any);
      setZones(prev => prev.map(zone => zone.id === id ? updatedZone : zone));
      return updatedZone;
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    }
  };
  
  const deleteZone = async (id: string): Promise<void> => {
    try {
      await zonesService.deleteZone(id);
      setZones(prev => prev.filter(zone => zone.id !== id));
    } catch (error) {
      console.error('Error deleting zone:', error);
      throw error;
    }
  };

  // Team operations
  const getTeamsByZone = (zoneId: string) => {
    return teams.filter(team => team.zoneId === zoneId);
  };

  const addTeam = async (team: Omit<Team, 'id'>): Promise<Team | undefined> => {
    try {
      const savedTeam = await SupabaseService.createTeam(
        team.name,
        team.zoneId,
        team.leagueId,
        team.categoryId,
        team.logo
      );
  
      if (savedTeam) {
        setTeams(prev => [...prev, savedTeam]);
        return savedTeam;
      }
    } catch (error) {
      console.error('Error adding team:', error);
      // Fallback al estado local
      const newTeam = {
        ...team,
        id: `team_${Date.now()}`
      };
      setTeams(prev => [...prev, newTeam]);
      return newTeam;
    }
  };

  const updateTeam = (id: string, data: Partial<Team>) => {
    setTeams(teams.map(team =>
      team.id === id ? { ...team, ...data } : team
    ));
  };

  const deleteTeam = async (id: string) => {
    try {
      // Eliminar de Supabase
      const success = await eliminarEquipo(id);
      
      if (success) {
        // Eliminar del estado local
        setTeams(teams.filter(team => team.id !== id));
        console.log('Equipo eliminado exitosamente');
      } else {
        console.error('Error al eliminar equipo de la base de datos');
        alert('Error al eliminar el equipo');
      }
    } catch (error) {
      console.error('Error eliminando equipo:', error);
      alert('Error al eliminar el equipo');
    }
  };

  // Fixture operations
  const getFixturesByZone = (zoneId: string) => {
    return fixtures.filter(fixture => fixture.zoneId === zoneId);
  };

  const addFixture = (fixture: Omit<Fixture, 'id'>) => {
    const newFixture = {
      ...fixture,
      id: `fixture_${Date.now()}`
    };
    setFixtures([...fixtures, newFixture]);
  };

  const updateFixture = (id: string, data: Partial<Fixture>) => {
    setFixtures(fixtures.map(fixture =>
      fixture.id === id ? { ...fixture, ...data } : fixture
    ));
  };

  const deleteFixture = async (id: string) => {
    try {
      // Eliminar de la base de datos
      const success = await SupabaseService.deleteFixture(id);
      
      if (success) {
        // Solo eliminar del estado local si se eliminó correctamente de la base de datos
        setFixtures(fixtures.filter(fixture => fixture.id !== id));
        console.log('Fixture eliminado correctamente:', id);
      } else {
        console.error('Error eliminando fixture de la base de datos');
        alert('Error eliminando fixture. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error eliminando fixture:', error);
      alert('Error inesperado eliminando fixture.');
    }
  };

  // Match operations - Corregida para ser asíncrona
  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      // Primero actualizar en Supabase
      const result = await SupabaseService.updateMatchResult(matchId, homeScore, awayScore);
      
      if (result) {
        // Encontrar la zona del partido para recalcular automáticamente
        let matchZoneId = '';
        
        // Buscar el partido en los fixtures para obtener la zona
        fixtures.forEach(fixture => {
          fixture.matches.forEach(match => {
            if (match.id === matchId) {
              matchZoneId = fixture.zoneId;
            }
          });
        });
        
        // Actualizar el estado local
        setFixtures(fixtures.map(fixture => ({
          ...fixture,
          matches: fixture.matches.map(match =>
            match.id === matchId
              ? { ...match, homeScore, awayScore, played: true }
              : match
          )
        })));
        
        // Recalcular automáticamente las posiciones de la zona
        if (matchZoneId) {
          setTimeout(() => {
            calculateStandingsFromMatches(matchZoneId);
          }, 100); // Pequeño delay para asegurar que el estado se actualice
        }
        
        console.log('Resultado actualizado exitosamente en Supabase');
      } else {
        console.error('Error al actualizar resultado en Supabase');
        throw new Error('No se pudo actualizar el resultado');
      }
    } catch (error) {
      console.error('Error actualizando resultado:', error);
      throw error;
    }
  };

  // Función para calcular automáticamente las posiciones
  const calculateStandingsFromMatches = useCallback((zoneId: string) => {
    // Obtener todos los partidos de la zona
    const zoneFixtures = fixtures.filter(fixture => fixture.zoneId === zoneId);
    const zoneTeams = teams.filter(team => team.zoneId === zoneId);
    
    // Inicializar estadísticas para cada equipo
    const teamStats: { [teamId: string]: Standing } = {};
    
    zoneTeams.forEach(team => {
      teamStats[team.id] = {
        id: `standing-${team.id}`,
        teamId: team.id,
        leagueId: team.leagueId,
        categoryId: team.categoryId,
        zoneId: team.zoneId,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
      };
    });

    // Procesar todos los partidos jugados
    zoneFixtures.forEach(fixture => {
      fixture.matches.forEach(match => {
        if (match.played && match.homeScore !== undefined && match.awayScore !== undefined) {
          const homeTeam = teamStats[match.homeTeamId];
          const awayTeam = teamStats[match.awayTeamId];
          
          if (homeTeam && awayTeam) {
            // Actualizar partidos jugados
            homeTeam.played++;
            awayTeam.played++;
            
            // Actualizar goles
            homeTeam.goalsFor += match.homeScore;
            homeTeam.goalsAgainst += match.awayScore;
            awayTeam.goalsFor += match.awayScore;
            awayTeam.goalsAgainst += match.homeScore;
            
            // Determinar resultado y actualizar estadísticas
            if (match.homeScore > match.awayScore) {
              // Victoria local
              homeTeam.won++;
              homeTeam.points += 3;
              awayTeam.lost++;
            } else if (match.homeScore < match.awayScore) {
              // Victoria visitante
              awayTeam.won++;
              awayTeam.points += 3;
              homeTeam.lost++;
            } else {
              // Empate
              homeTeam.drawn++;
              homeTeam.points += 1;
              awayTeam.drawn++;
              awayTeam.points += 1;
            }
          }
        }
      });
    });
    
    // Convertir a array y actualizar standings
    const calculatedStandings = Object.values(teamStats);
    
    // Actualizar solo los standings de esta zona
    setStandings(prevStandings => {
      const otherZoneStandings = prevStandings.filter(s => s.zoneId !== zoneId);
      return [...otherZoneStandings, ...calculatedStandings];
    });
    
    return calculatedStandings;
  }, [fixtures, teams]);

  // Standings operations
  // Standings operations
  const getStandingsByZone = (zoneId: string) => {
  return standings.filter(standing => standing.zoneId === zoneId);
  };
  
  const updateStanding = (id: string, data: Partial<Standing>) => {
  setStandings(standings.map(standing =>
  standing.id === id ? { ...standing, ...data } : standing
  ));
  };
  
  const addStanding = (standing: Omit<Standing, 'id'>) => {
  const newStanding: Standing = {
  ...standing,
  id: `standing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  setStandings(prev => [...prev, newStanding]);
  };

  // Course operations
  const getCourses = () => {
    return courses;
  };

  const addCourse = (course: Omit<Course, 'id'>) => {
    const newCourse = {
      ...course,
      id: `course_${Date.now()}`
    };
    setCourses([...courses, newCourse]);
  };

  const updateCourse = (id: string, data: Partial<Course>) => {
    setCourses(courses.map(course =>
      course.id === id ? { ...course, ...data } : course
    ));
  };

  const deleteCourse = (id: string) => {
    setCourses(courses.filter(course => course.id !== id));
  };

  // Función refreshFixtures envuelta en useCallback
  const refreshFixtures = useCallback(async () => {
    try {
      console.log('=== REFRESHING FIXTURES FROM SUPABASE ===');
      const result = await SupabaseService.getFixtures();
      console.log('Refreshed fixtures:', result);
      console.log('Number of fixtures loaded:', result.length);
      setFixtures(result);
    } catch (error) {
      console.error('Error refreshing fixtures:', error);
      setFixtures([]);
      throw error;
    }
  }, []);

  const value: LeagueContextType = {
    leagues,
    categories,
    zones,
    teams,
    fixtures,
    standings,
    courses,
    getLeague,
    getCategoriesByLeague,
    addCategory,
    updateCategory,
    deleteCategory,
    getZonesByCategory,
    addZone,
    updateZone,
    deleteZone,
    getTeamsByZone,
    addTeam,
    updateTeam,
    deleteTeam,
    getFixturesByZone,
    addFixture,
    updateFixture,
    deleteFixture,
    refreshFixtures,
    updateMatchResult,
    getStandingsByZone,
    updateStanding,
    addStanding,
    calculateStandingsFromMatches,
    getCourses,
    addCourse,
    updateCourse,
    deleteCourse
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};
