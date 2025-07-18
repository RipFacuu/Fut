// Importar useCallback si no está importado
import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { zonesService } from '../services/zonesService';
import { eliminarEquipo, eliminarCategoria, eliminarPosicionPorEquipo } from '../lib/supabase';
import { SupabaseService } from '../services/supabaseService';
import { v4 as uuidv4 } from 'uuid';
import { useDataLoader } from '../hooks/useDataLoader';
import { handleError } from '../utils/errorUtils';

// Types
export interface Team {
  id: string;
  name: string;
  logo?: string;
  leagueId: string;
  categoryId?: string;
  zoneId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  leagueId: string;
  isEditable: boolean;
  zoneId?: string; // Agregar esta línea
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Zone {
  id: string;
  name: string;
  leagueId: string;
  categoryId: string;
  legend?: string; // Campo para leyenda editable (Apertura/Clausura)
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
  leyenda?: string;
  texto_central?: string;
  matches: Match[];
  invalidLeagueId?: boolean; // <-- Agregado para advertencia de fixtures inválidos
}

export interface Standing {
  id: string | number;
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
  orden?: number;
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
  updateZone: (id: string, data: Partial<Omit<Zone, 'id' | 'name' | 'leagueId' | 'categoryId'>> & { name: string; leagueId: string; categoryId: string; }) => Promise<Zone>;
  deleteZone: (id: string) => Promise<void>;
  
  // Team operations
  getTeamsByZone: (zoneId: string) => Team[];
  addTeam: (
    team: Omit<Team, 'id'>,
    standingData?: Partial<Omit<Standing, 'id' | 'teamId' | 'leagueId' | 'categoryId' | 'zoneId'>>
  ) => Promise<Team | undefined>;
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
  repairMissingCategories: (leagueId: string) => Promise<void>;
  ensureBasicCategories: (leagueId: string) => Promise<void>;
  
  // Nuevas funciones para gestión de datos
  refreshCategories: () => Promise<void>;
  refreshZones: () => Promise<void>;
  refreshTeams: () => Promise<void>;
  refreshStandings: () => Promise<void>;
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

// Mejorar las interfaces con campos de auditoría
export interface Team {
  id: string;
  name: string;
  logo?: string;
  leagueId: string;
  categoryId?: string;
  zoneId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  leagueId: string;
  isEditable: boolean;
  zoneId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Zone {
  id: string;
  name: string;
  leagueId: string;
  categoryId: string;
  legend?: string; // Campo para leyenda editable (Apertura/Clausura)
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
  leyenda?: string;
  texto_central?: string;
  matches: Match[];
  invalidLeagueId?: boolean; // <-- Agregado para advertencia de fixtures inválidos
}

export interface Standing {
  id: string | number;
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
  orden?: number;
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

// Hook LeagueProvider refactorizado
export const LeagueProvider: React.FC<LeagueProviderProps> = ({ children }) => {
  // Estados usando el hook personalizado
  const { data: leagues, refresh: refreshLeagues } = useDataLoader<League>(SupabaseService.getLeagues);
  const { data: zones, refresh: refreshZones } = useDataLoader<Zone>(zonesService.getAllZones);
  const { data: courses, refresh: refreshCourses } = useDataLoader<Course>(SupabaseService.getAllCourses);

  // Cargar categorías solo cuando hay ligas
  const { data: categories, refresh: refreshCategories } = useDataLoader<Category>(
    async () => {
      if (!leagues.length) return [];
      let allCategories: Category[] = [];
      for (const league of leagues) {
        const leagueCategories = await SupabaseService.getCategoriesByLeague(league.id);
        allCategories = allCategories.concat(leagueCategories);
      }
      return allCategories;
    },
    [leagues]
  );

  // Cargar equipos solo cuando hay zonas
  const { data: teams, refresh: refreshTeams } = useDataLoader<Team>(
    async () => {
      if (!zones.length) return [];
      return await SupabaseService.getAllTeams();
    },
    [zones]
  );

  // Cargar fixtures solo cuando hay zonas
  const { data: fixtures, refresh: refreshFixtures } = useDataLoader<Fixture>(
    async () => {
      if (!zones.length) return [];
      return await SupabaseService.getFixtures();
    },
    [zones]
  );

  // Cargar standings solo cuando hay zonas
  const { data: standings, refresh: refreshStandings } = useDataLoader<Standing>(
    async () => {
      if (!zones.length) return [];
      let allStandings: Standing[] = [];
      for (const zone of zones) {
        const zoneStandings = await SupabaseService.getStandingsByZone(zone.id);
        allStandings = allStandings.concat(zoneStandings);
      }
      return allStandings;
    },
    [zones]
  );

  // Memoized maps para lookup rápido (solo los realmente útiles)
  const categoriesByLeague = useMemo(() => {
    const map = new Map<string, Category[]>();
    categories.forEach(cat => {
      const key = String(cat.leagueId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(cat);
    });
    return map;
  }, [categories]);

  const zonesByCategory = useMemo(() => {
    const map = new Map<string, Zone[]>();
    zones.forEach(zone => {
      const key = String(zone.categoryId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(zone);
    });
    return map;
  }, [zones]);

  const zonesByLeague = useMemo(() => {
    const map = new Map<string, Zone[]>();
    zones.forEach(zone => {
      const key = String(zone.leagueId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(zone);
    });
    return map;
  }, [zones]);

  const teamsByZone = useMemo(() => {
    const map = new Map<string, Team[]>();
    teams.forEach(team => {
      const key = String(team.zoneId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(team);
    });
    return map;
  }, [teams]);

  // Selectores optimizados
  const getCategoriesByLeague = useCallback((leagueId: string): Category[] => {
    if (!leagueId) return [];
    return categoriesByLeague.get(String(leagueId)) || [];
  }, [categoriesByLeague]);

  const getZonesByCategory = useCallback((categoryId: string): Zone[] => {
    if (!categoryId) return [];
    // Comparar siempre como string
    return zones.filter(zone => String(zone.categoryId) === String(categoryId));
  }, [zones]);

  const getZonesByLeague = useCallback((leagueId: string): Zone[] => {
    if (!leagueId) return [];
    return zonesByLeague.get(String(leagueId)) || [];
  }, [zonesByLeague]);

  const getTeamsByZone = useCallback((zoneId: string): Team[] => {
    if (!zoneId) return [];
    return teamsByZone.get(String(zoneId)) || [];
  }, [teamsByZone]);

  // Operaciones CRUD optimizadas y tipadas
  const addCategory = useCallback(async (category: Omit<Category, 'id'>): Promise<Category | undefined> => {
    try {
      const newCategory = await SupabaseService.createCategoryWithStructure(
        category.name,
        category.leagueId,
        category.zoneId
      );
      if (newCategory) {
        refreshCategories();
        return newCategory;
      }
    } catch (error) {
      handleError(error, 'addCategory', 'Error al crear la categoría');
      throw error;
    }
  }, [refreshCategories]);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>): Promise<void> => {
    try {
      if (data.name) {
        await SupabaseService.updateCategory(id, { name: data.name });
      }
      refreshCategories();
    } catch (error) {
      handleError(error, 'updateCategory', 'Error al actualizar la categoría');
    }
  }, [refreshCategories]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await eliminarCategoria(id);
      if (success) {
        refreshCategories();
      } else {
        handleError('Error al eliminar categoría de la base de datos', 'deleteCategory', 'Error al eliminar la categoría');
      }
    } catch (error) {
      handleError(error, 'deleteCategory', 'Error al eliminar la categoría');
    }
  }, [refreshCategories]);

  // Mover createStanding antes de addTeam para evitar error de hoisting
  const createStanding = useCallback(async (standing: Omit<Standing, 'id'>): Promise<void> => {
    await SupabaseService.createStanding(standing);
    refreshStandings();
  }, [refreshStandings]);

  // updateZone: corregir tipado para requerir los campos obligatorios
  const updateZone = useCallback(async (id: string, data: Partial<Omit<Zone, 'id' | 'name' | 'leagueId' | 'categoryId'>> & { name: string; leagueId: string; categoryId: string; }): Promise<Zone> => {
    try {
      const updatedZone = await zonesService.updateZone(id, data);
      refreshZones();
      return updatedZone;
    } catch (error) {
      handleError(error, 'updateZone', 'Error al actualizar la zona');
      throw error;
    }
  }, [refreshZones]);

  // Zone operations
  const addZone = useCallback(async (zone: Omit<Zone, 'id'>): Promise<Zone> => {
    try {
      const newZone = await zonesService.createZone(zone);
      refreshZones();
      return newZone;
    } catch (error) {
      handleError(error, 'addZone', 'Error al crear la zona');
      // Fallback
      const fallbackZone: Zone = { ...zone, id: `zone_${Date.now()}` };
      refreshZones();
      return fallbackZone;
    }
  }, [refreshZones]);

  const deleteZone = useCallback(async (id: string): Promise<void> => {
    try {
      await zonesService.deleteZone(id);
      refreshZones();
    } catch (error) {
      handleError(error, 'deleteZone', 'Error al eliminar la zona');
      throw error;
    }
  }, [refreshZones]);

  // Team operations
  const addTeam = useCallback(async (
    team: Omit<Team, 'id'>,
    standingData?: Partial<Omit<Standing, 'id' | 'teamId' | 'leagueId' | 'categoryId' | 'zoneId'>>
  ): Promise<Team | undefined> => {
    try {
      if (!team.name || !team.leagueId) throw new Error('Faltan campos obligatorios');
      const savedTeam = await SupabaseService.createTeam(
        team.name,
        team.zoneId || '',
        team.leagueId,
        team.categoryId || '',
        team.logo || ''
      );
      if (savedTeam && savedTeam.id) {
        refreshTeams();
        // Crear standing si corresponde
        if (standingData && savedTeam.zoneId) {
          await createStanding({
            teamId: savedTeam.id,
            leagueId: savedTeam.leagueId,
            categoryId: savedTeam.categoryId || '',
            zoneId: savedTeam.zoneId || '',
            puntos: standingData.puntos || 0,
            pj: standingData.pj || 0,
            won: standingData.won || 0,
            drawn: standingData.drawn || 0,
            lost: standingData.lost || 0,
            goalsFor: standingData.goalsFor || 0,
            goalsAgainst: standingData.goalsAgainst || 0
          });
        }
        return savedTeam;
      }
    } catch (error) {
      handleError(error, 'addTeam', 'Error al crear el equipo');
      throw error;
    }
  }, [refreshTeams, createStanding]);

  const updateTeam = useCallback(async (id: string, data: Partial<Team>): Promise<void> => {
    try {
      const currentTeam = teams.find(team => team.id === id);
      if (!currentTeam) throw new Error('Equipo no encontrado');
      const updatedData = { ...currentTeam, ...data };
      if (!updatedData.name || !updatedData.leagueId) throw new Error('Faltan campos obligatorios');
      await SupabaseService.updateTeam(
        id,
        updatedData.name,
        updatedData.zoneId || '',
        updatedData.leagueId,
        updatedData.categoryId || '',
        updatedData.logo || ''
      );
      refreshTeams();
    } catch (error) {
      handleError(error, 'updateTeam', 'Error al actualizar el equipo');
    }
  }, [teams, refreshTeams]);

  const deleteTeam = useCallback(async (id: string): Promise<void> => {
    try {
      const [deleteSuccess, deleteStandingsSuccess] = await Promise.all([
        eliminarEquipo(id),
        eliminarPosicionPorEquipo(id)
      ]);
      if (!deleteSuccess || !deleteStandingsSuccess) {
        throw new Error('No se pudo eliminar el equipo o sus posiciones asociadas');
      }
      refreshTeams();
    } catch (error) {
      handleError(error, 'deleteTeam', 'No se pudo eliminar el equipo. Por favor, inténtalo de nuevo.');
      throw error;
    }
  }, [refreshTeams]);

  // Fixture operations
  const getFixturesByZone = useCallback((zoneId: string): Fixture[] => {
    return fixtures.filter(fixture => String(fixture.zoneId) === String(zoneId));
  }, [fixtures]);

  const addFixture = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);

  const updateFixture = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);

  const deleteFixture = useCallback(async (id: string) => {
    try {
      const success = await SupabaseService.deleteFixture(id);
      if (success) {
        refreshFixtures();
      } else {
        handleError('Error eliminando fixture de la base de datos', 'deleteFixture', 'Error eliminando fixture. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      handleError(error, 'deleteFixture', 'Error inesperado eliminando fixture.');
    }
  }, [refreshFixtures]);

  // Match operations
  const updateMatchResult = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const result = await SupabaseService.updateMatchResult(matchId, homeScore, awayScore);
      if (result) {
        refreshFixtures();
        // Recalcular standings si corresponde
        // ...
      } else {
        handleError('No se pudo actualizar el resultado', 'updateMatchResult', 'No se pudo actualizar el resultado');
      }
    } catch (error) {
      handleError(error, 'updateMatchResult', 'Error actualizando resultado');
      throw error;
    }
  }, [refreshFixtures]);

  // Standings helpers
  const getStandingsByZone = useCallback((zoneId: string): Standing[] => {
    return standings.filter(standing => String(standing.zoneId) === String(zoneId));
  }, [standings]);

  const updateStanding = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);

  const addStanding = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);

  // Calcular standings desde partidos
  const calculateStandingsFromMatches = useCallback((zoneId: string) => {
    if (!zoneId) return [];
    const zoneFixtures = fixtures.filter(f => String(f.zoneId) === String(zoneId));
    const zoneTeams = teams.filter(t => String(t.zoneId) === String(zoneId));
    const standingsMap = zoneTeams.reduce((acc, team) => {
      acc[team.id] = {
        id: uuidv4(),
        teamId: team.id,
        leagueId: team.leagueId,
        categoryId: team.categoryId || '',
        zoneId: team.zoneId || '',
        puntos: 0,
        pj: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
      };
      return acc;
    }, {} as Record<string, Standing>);
    zoneFixtures.forEach(fixture => {
      fixture.matches.forEach(match => {
        if (!match.played || match.homeScore === undefined || match.awayScore === undefined) return;
        const homeTeam = standingsMap[match.homeTeamId];
        const awayTeam = standingsMap[match.awayTeamId];
        if (!homeTeam || !awayTeam) return;
        homeTeam.pj++;
        awayTeam.pj++;
        homeTeam.goalsFor += match.homeScore;
        homeTeam.goalsAgainst += match.awayScore;
        awayTeam.goalsFor += match.awayScore;
        awayTeam.goalsAgainst += match.homeScore;
        if (match.homeScore > match.awayScore) {
          homeTeam.won++;
          homeTeam.puntos += 3;
          awayTeam.lost++;
        } else if (match.homeScore < match.awayScore) {
          awayTeam.won++;
          awayTeam.puntos += 3;
          homeTeam.lost++;
        } else {
          homeTeam.drawn++;
          homeTeam.puntos += 1;
          awayTeam.drawn++;
          awayTeam.puntos += 1;
        }
      });
    });
    const calculatedStandings = Object.values(standingsMap)
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        const diffA = a.goalsFor - a.goalsAgainst;
        const diffB = b.goalsFor - b.goalsAgainst;
        if (diffB !== diffA) return diffB - diffA;
        return b.goalsFor - a.goalsFor;
      })
      .map((standing, index) => ({ ...standing, orden: index + 1 }));
    // Solo local, para persistir usar SupabaseService
    return calculatedStandings;
  }, [fixtures, teams]);

  // Courses helpers
  const getCourses = useCallback(() => courses, [courses]);
  const addCourse = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);
  const updateCourse = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);
  const deleteCourse = useCallback(() => {
    // Solo local, para persistir usar SupabaseService
    // ...
  }, []);

  // Métodos dummy para cumplir con LeagueContextType
  const debugCategorySelection = () => {};
  const repairMissingCategories = async () => {};
  const ensureBasicCategories = async () => {};

  // Valor del contexto
  const value: LeagueContextType = {
    leagues,
    categories,
    zones,
    teams,
    fixtures,
    standings,
    courses,
    getLeague: (id: string) => leagues.find(league => league.id === id),
    getCategoriesByLeague,
    addCategory,
    updateCategory,
    deleteCategory,
    getZonesByCategory,
    getZonesByLeague,
    getCategoriesByZone: () => [],
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
    importStandingsFromCSV: async () => {},
    ensureCategoriesExist: async () => {},
    debugCategorySelection,
    repairMissingCategories,
    ensureBasicCategories,
    refreshCategories,
    refreshZones,
    refreshTeams,
    refreshStandings
  };

  // Efecto de carga inicial unificado
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          refreshLeagues(),
          refreshZones(),
          refreshCourses()
        ]);
        if (leagues.length) await refreshCategories();
        if (zones.length) await Promise.all([
          refreshTeams(),
          refreshStandings(),
          refreshFixtures()
        ]);
      } catch (error) {
        handleError(error, 'loadInitialData', 'Error al cargar los datos iniciales');
      }
    };
    loadInitialData();
    // eslint-disable-next-line
  }, []);

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};
