// Importar useCallback si no está importado
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockLeagueData } from '../data/mockData';
import { zonesService } from '../services/zonesService';
import { supabase, eliminarEquipo, eliminarCategoria } from '../lib/supabase';
import { SupabaseService } from '../services/supabaseService';
import { v4 as uuidv4 } from 'uuid';

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
  puntos: number;  // Cambiar de 'points' a 'puntos'
  pj: number;      // Cambiar de 'played' a 'pj'
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
  getZonesByLeague: (leagueId: string) => Zone[];
  getCategoriesByZone: (zoneId: string) => Category[];
  addZone: (zone: Omit<Zone, 'id'>) => Promise<Zone>;
  updateZone: (id: string, data: Partial<Zone>) => Promise<Zone>;
  deleteZone: (id: string) => Promise<void>;
  
  // Team operations
  getTeamsByZone: (zoneId: string) => Team[];
  addTeam: (team: Omit<Team, 'id'>) => Promise<Team | undefined>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
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
  createStanding: (standing: Omit<Standing, 'id'>) => Promise<void>;
  importStandingsFromCSV: (csvData: string, zoneId: string) => Promise<void>;

  // Course operations
  getCourses: () => Course[];
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  
  // Nuevas funciones de diagnóstico y utilidad
  ensureCategoriesExist: (leagueId: string, leagueName: string) => Promise<void>;
  debugCategorySelection: (selectedLeagueId: string) => void;
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
  // Initialize state with empty arrays instead of mock data
  const [leagues, setLeagues] = useState<League[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Cargar todas las ligas al inicializar
  useEffect(() => {
    const loadAllLeagues = async () => {
      try {
        console.log('=== LOADING LEAGUES FROM SUPABASE ===');
        const supabaseLeagues = await SupabaseService.getLeagues();
        console.log('Leagues from Supabase:', supabaseLeagues);
        
        // Usar solo datos de Supabase (sin combinar con mock)
        setLeagues(supabaseLeagues);
      } catch (error) {
        console.error('Error loading leagues:', error);
      }
    };
    
    loadAllLeagues();
  }, []);

  // SOLUCIÓN 2: Función para asegurar que existan categorías por defecto
  const ensureCategoriesExist = async (leagueId: string, leagueName: string) => {
    const existingCategories = getCategoriesByLeague(leagueId);
    
    if (existingCategories.length === 0) {
      console.log(`📝 Creating default categories for ${leagueName}`);
      
      // Crear categorías por defecto
      const defaultCategories = [
        { name: 'Primera División', leagueId, isEditable: true },
        { name: 'Segunda División', leagueId, isEditable: true }
      ];
      
      for (const categoryData of defaultCategories) {
        try {
          await addCategory(categoryData);
          console.log(`✅ Created category: ${categoryData.name}`);
        } catch (error) {
          console.error(`❌ Error creating category ${categoryData.name}:`, error);
        }
      }
    }
  };

  // SOLUCIÓN 3: Modificar el useEffect que carga las categorías
  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        console.log('=== LOADING CATEGORIES FROM SUPABASE ===');
        const allCategories: Category[] = [];
        
        for (const league of leagues) {
          console.log(`🔍 Loading categories for league: ${league.name} (ID: ${league.id})`);
          
          try {
            const leagueCategories = await SupabaseService.getCategoriesByLeague(league.id);
            console.log(`📋 Categories loaded for ${league.name}:`, leagueCategories);
            
            if (leagueCategories.length === 0) {
              console.warn(`⚠️ No categories found for ${league.name} in database`);
              
              // Opcional: Crear categorías por defecto
              // await ensureCategoriesExist(league.id, league.name);
            }
            
            allCategories.push(...leagueCategories);
          } catch (error) {
            console.error(`❌ Error loading categories for ${league.name}:`, error);
          }
        }
        
        console.log('📊 All categories from Supabase:', allCategories);
        
        // Actualizar el estado
        setCategories(prev => {
          console.log('📋 Previous categories:', prev);
          
          // Evitar duplicados por ID
          const existingIds = prev.map(cat => cat.id);
          const newCategories = allCategories.filter(cat => !existingIds.includes(cat.id));
          
          console.log('➕ New categories to add:', newCategories);
          
          const finalCategories = [...prev, ...newCategories];
          console.log('📈 Final categories:', finalCategories);
          
          return finalCategories;
        });
        
      } catch (error) {
        console.error('❌ Error loading categories:', error);
      }
    };
    
    // Solo cargar si hay ligas disponibles
    if (leagues.length > 0) {
      loadAllCategories();
    }
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

  // SOLUCIÓN 1: Category operations con mejor debugging
  const getCategoriesByLeague = (leagueId: string) => {
    console.log('getCategoriesByLeague called with:', leagueId, 'type:', typeof leagueId);
    console.log('Available categories:', categories);
    
    if (!leagueId) {
      console.warn('⚠️ LeagueId is null/undefined');
      return [];
    }
    
    const filtered = categories.filter(category => {
      if (!category.leagueId) {
        console.warn('⚠️ Category without leagueId:', category);
        return false;
      }
      
      // Normalizar ambos valores a string y eliminar espacios
      const categoryLeagueId = String(category.leagueId).trim();
      const searchLeagueId = String(leagueId).trim();
      
      const match = categoryLeagueId === searchLeagueId;
      
      if (match) {
        console.log(`✅ Category match: ${category.name} for league ${leagueId}`);
      }
      
      return match;
    });
    
    console.log(`📊 Result: ${filtered.length} categories for league ${leagueId}`);
    
    // Si no hay categorías, mostrar advertencia específica
    if (filtered.length === 0) {
      console.warn(`⚠️ No categories found for league ${leagueId}. Available league IDs in categories:`,
        [...new Set(categories.map(c => c.leagueId))]);
    }
    
    return filtered;
  };

  // SOLUCIÓN 4: Función de diagnóstico para debugging
  const debugCategorySelection = useCallback((selectedLeagueId: string) => {
    console.log('🔍 DEBUGGING CATEGORY SELECTION');
    console.log('Selected league ID:', selectedLeagueId);
    console.log('Available leagues:', leagues);
    console.log('Available categories:', categories);
    
    const selectedLeague = leagues.find(l => l.id === selectedLeagueId);
    console.log('Selected league object:', selectedLeague);
    
    const availableCategories = getCategoriesByLeague(selectedLeagueId);
    console.log('Available categories for this league:', availableCategories);
    
    if (availableCategories.length === 0) {
      console.error('❌ NO CATEGORIES FOUND - This will disable the category input');
      console.log('💡 Possible solutions:');
      console.log('1. Check if categories exist in Supabase for this league');
      console.log('2. Verify the league ID matches between leagues and categories tables');
      console.log('3. Check if there are any async loading issues');
    }
  }, [leagues, categories]);

  // Función para obtener categorías por zona
  const getCategoriesByZone = (zoneId: string): Category[] => {
    return categories.filter(category => category.zoneId === zoneId);
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
  
  const getZonesByLeague = (leagueId: string): Zone[] => {
    const filtered = zones.filter(zone => zone.leagueId === leagueId);
    console.log('getZonesByLeague called with:', leagueId, 'returning:', filtered);
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
    console.log('Filtering teams for zoneId:', zoneId, 'type:', typeof zoneId);
    
    const result = teams.filter(team => {
      // Normalizar ambos valores a string para comparación consistente
      const teamZoneId = String(team.zoneId);
      const searchZoneId = String(zoneId);
      
      const match = teamZoneId === searchZoneId;
      
      if (match) {
        console.log(`✅ Team match found: ${team.name} (zone: ${teamZoneId})`);
      }
      
      return match;
    });
    
    console.log(`Found ${result.length} teams for zone ${zoneId}`);
    return result;
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

  const updateTeam = async (id: string, data: Partial<Team>) => {
    try {
      // Buscar el equipo actual para obtener todos los datos
      const currentTeam = teams.find(team => team.id === id);
      if (!currentTeam) {
        console.error('Team not found:', id);
        return;
      }
  
      // Combinar datos actuales con los nuevos
      const updatedData = { ...currentTeam, ...data };
      
      // Actualizar en Supabase
      const updatedTeam = await SupabaseService.updateTeam(
        id,
        updatedData.name,
        updatedData.zoneId,
        updatedData.leagueId,
        updatedData.categoryId,
        updatedData.logo
      );
  
      if (updatedTeam) {
        // Actualizar estado local solo si la actualización en DB fue exitosa
        setTeams(teams.map(team =>
          team.id === id ? updatedTeam : team
        ));
        console.log('Equipo actualizado exitosamente');
      } else {
        console.error('Error al actualizar equipo en la base de datos');
        alert('Error al actualizar el equipo');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Error al actualizar el equipo');
    }
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
    console.log('Filtering fixtures for zoneId:', zoneId, 'type:', typeof zoneId);
    
    const result = fixtures.filter(fixture => {
      // Normalizar ambos valores a string para comparación consistente
      const fixtureZoneId = String(fixture.zoneId);
      const searchZoneId = String(zoneId);
      
      const match = fixtureZoneId === searchZoneId;
      
      if (match) {
        console.log(`✅ Match found: Fixture ${fixture.id} (zone: ${fixtureZoneId})`);
      }
      
      return match;
    });
    
    console.log(`Found ${result.length} fixtures for zone ${zoneId}`);
    return result;
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
    console.log('Calculando standings para zona:', zoneId);
    
    // ✅ CAMBIO: Usar getFixturesByZone en lugar de filtrar directamente
    const zoneFixtures = getFixturesByZone(zoneId);
    const zoneTeams = teams.filter(team => team.zoneId === zoneId);
    
    // CAMBIO: Crear standings automáticamente para todos los equipos de la zona
    const teamStats: { [teamId: string]: Standing } = {};
    
    // Inicializar estadísticas para cada equipo de la zona
    zoneTeams.forEach(team => {
      teamStats[team.id] = {
        id: uuidv4(),
        teamId: team.id,
        leagueId: team.leagueId,
        categoryId: team.categoryId,
        zoneId: team.zoneId,
        puntos: 0,    // Cambio: points -> puntos
        pj: 0,        // Cambio: played -> pj
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
            homeTeam.pj++;  // Cambio: played -> pj
            awayTeam.pj++;  // Cambio: played -> pj
            
            // Actualizar goles
            homeTeam.goalsFor += match.homeScore;
            homeTeam.goalsAgainst += match.awayScore;
            awayTeam.goalsFor += match.awayScore;
            awayTeam.goalsAgainst += match.homeScore;
            
            // Determinar resultado y actualizar estadísticas
            if (match.homeScore > match.awayScore) {
              // Victoria local
              homeTeam.won++;
              homeTeam.puntos += 3;  // Cambio: points -> puntos
              awayTeam.lost++;
            } else if (match.homeScore < match.awayScore) {
              // Victoria visitante
              awayTeam.won++;
              awayTeam.puntos += 3;  // Cambio: points -> puntos
              homeTeam.lost++;
            } else {
              // Empate
              homeTeam.drawn++;
              homeTeam.puntos += 1;  // Cambio: points -> puntos
              awayTeam.drawn++;
              awayTeam.puntos += 1;  // Cambio: points -> puntos
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
  // Cargar standings desde Supabase
  useEffect(() => {
    const loadAllStandings = async () => {
      try {
        console.log('=== LOADING STANDINGS FROM SUPABASE ===');
        const allStandings: Standing[] = [];
        
        // Cargar standings para todas las zonas
        for (const zone of zones) {
          console.log('Loading standings for zone:', zone.id);
          const zoneStandings = await SupabaseService.getStandingsByZone(zone.id);
          console.log('Standings loaded for zone', zone.id, ':', zoneStandings);
          allStandings.push(...zoneStandings);
        }
        
        console.log('All standings from Supabase:', allStandings);
        
        // Reemplazar completamente los standings en lugar de hacer merge
        setStandings(allStandings);
      } catch (error) {
        console.error('Error loading standings:', error);
      }
    };
    
    // Solo cargar si hay zonas
    if (zones.length > 0) {
      loadAllStandings();
    } else {
      // Si no hay zonas, limpiar standings
      setStandings([]);
    }
  }, [zones]); // Mantener solo zones como dependencia
  
  // Agregar después del useEffect que carga standings 
  useEffect(() => { 
    // Generar standings automáticamente para todas las zonas que tienen equipos 
    const generateStandingsForAllZones = () => { 
      zones.forEach(zone => { 
        const zoneTeams = teams.filter(team => team.zoneId === zone.id); 
        if (zoneTeams.length > 0) { 
          calculateStandingsFromMatches(zone.id); 
        } 
      }); 
    }; 
    
    // Solo generar si hay equipos cargados 
    if (teams.length > 0 && zones.length > 0) { 
      generateStandingsForAllZones(); 
    } 
  }, [teams, zones, calculateStandingsFromMatches]);
  
  // Función para obtener standings por zona
  const getStandingsByZone = (zoneId: string): Standing[] => {
    console.log('getStandingsByZone called with:', zoneId);
    console.log('All standings:', standings);
    
    const filtered = standings.filter(standing => {
      // Normalizar ambos valores a string para comparación consistente
      const standingZoneId = String(standing.zoneId);
      const searchZoneId = String(zoneId);
      
      const match = standingZoneId === searchZoneId;
      
      if (match) {
        console.log(`✅ Standing match found: Team ${standing.teamId} (zone: ${standingZoneId})`);
      }
      
      return match;
    });
    
    console.log('Filtered standings:', filtered);
    console.log(`Found ${filtered.length} standings for zone ${zoneId}`);
    
    return filtered;
  };
  
  // Modificar las funciones de standings para usar Supabase
  const addStanding = (standing: Omit<Standing, 'id'>) => {
    // Crear directamente en el estado local (no async)
    const localStanding: Standing = {
      ...standing,
      id: uuidv4()
    };
    
    setStandings(prev => [...prev, localStanding]);
    
    // Opcional: Intentar guardar en Supabase en background
    SupabaseService.createStanding(standing).catch(error => {
      console.error('Error saving standing to Supabase (background):', error);
    });
  };
  
  const updateStanding = async (id: string, data: Partial<Standing>) => {
    try {
      console.log('🔄 Actualizando standing en Supabase:', { id, data });
      
      // Actualizar en Supabase
      const updatedStanding = await SupabaseService.updateStanding(id, data);
      
      if (updatedStanding) {
        console.log('✅ Standing actualizado en Supabase:', updatedStanding);
        
        // Actualizar estado local
        setStandings(standings.map(standing =>
          standing.id === id ? updatedStanding : standing
        ));
        
        console.log('✅ Estado local actualizado');
      } else {
        throw new Error('No se recibió respuesta de Supabase');
      }
    } catch (error) {
      console.error('❌ Error updating standing:', error);
      
      // Fallback: actualizar localmente
      console.log('🔄 Aplicando fallback: actualización local');
      setStandings(standings.map(standing =>
        standing.id === id ? { ...standing, ...data } : standing
      ));
      
      // Re-lanzar el error para que sea manejado por la función que llama
      throw error;
    }
  };

  // Función para crear standing en Supabase
  const createStanding = async (standing: Omit<Standing, 'id'>) => {
    try {
      console.log('🔄 Creando nuevo standing:', standing);
      
      // Crear en Supabase
      const newStanding = await SupabaseService.createStanding(standing);
      
      if (newStanding) {
        console.log('✅ Standing creado en Supabase:', newStanding);
        
        // Actualizar estado local
        setStandings(prev => [...prev, newStanding]);
        
        console.log('✅ Estado local actualizado');
      } else {
        throw new Error('No se recibió respuesta de Supabase');
      }
    } catch (error) {
      console.error('❌ Error creating standing:', error);
      
      // Fallback: crear localmente
      const localStanding: Standing = {
        ...standing,
        id: uuidv4()
      };
      
      setStandings(prev => [...prev, localStanding]);
      
      throw error;
    }
  };

  // Función para importar standings desde CSV
  const importStandingsFromCSV = async (csvData: string, zoneId: string) => {
    try {
      console.log('🔄 Importando standings desde CSV para zona:', zoneId);
      
      // Parsear CSV
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validar headers mínimos requeridos
      const requiredHeaders = ['teamId', 'pj', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'puntos'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Headers faltantes en CSV: ${missingHeaders.join(', ')}`);
      }
      
      const newStandings: Omit<Standing, 'id'>[] = [];
      
      // Procesar cada fila (saltando el header)
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          console.warn(`Fila ${i + 1} tiene ${values.length} columnas, esperadas ${headers.length}`);
          continue;
        }
        
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });
        
        // Crear standing object
        const standing: Omit<Standing, 'id'> = {
          teamId: rowData.teamId,
          leagueId: '', // Se puede obtener del equipo
          categoryId: '', // Se puede obtener del equipo
          zoneId: zoneId,
          pj: parseInt(rowData.pj) || 0,
          won: parseInt(rowData.won) || 0,
          drawn: parseInt(rowData.drawn) || 0,
          lost: parseInt(rowData.lost) || 0,
          goalsFor: parseInt(rowData.goalsFor) || 0,
          goalsAgainst: parseInt(rowData.goalsAgainst) || 0,
          puntos: parseInt(rowData.puntos) || 0
        };
        
        // Obtener leagueId y categoryId del equipo
        const team = teams.find(t => t.id === standing.teamId);
        if (team) {
          standing.leagueId = team.leagueId;
          standing.categoryId = team.categoryId;
        }
        
        newStandings.push(standing);
      }
      
      console.log(`📊 Procesados ${newStandings.length} standings desde CSV`);
      
      // Crear todos los standings
      for (const standing of newStandings) {
        await createStanding(standing);
      }
      
      console.log('✅ Importación de CSV completada');
      
    } catch (error) {
      console.error('❌ Error importing CSV:', error);
      throw error;
    }
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
    getZonesByLeague,
    getCategoriesByZone,
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
    deleteCourse,
    createStanding,
    importStandingsFromCSV,
    // Nuevas funciones
    ensureCategoriesExist,
    debugCategorySelection
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};
