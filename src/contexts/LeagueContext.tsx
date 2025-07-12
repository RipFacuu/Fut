// Importar useCallback si no está importado
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockLeagueData } from '../data/mockData';
import { zonesService } from '../services/zonesService';
import { supabase, eliminarEquipo, eliminarCategoria, crearPosicion, eliminarPosicionPorEquipo } from '../lib/supabase';
import { SupabaseService } from '../services/supabaseService';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Team {
  id: string;
  name: string;
  logo?: string;
  leagueId: string;
  categoryId?: string;
  zoneId?: string;
}

export interface Category {
  id: string;
  name: string;
  leagueId: string;
  isEditable: boolean;
  zoneId?: string; // Agregar esta línea
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
  updateZone: (id: string, data: Partial<Zone>) => Promise<Zone>;
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

// Helper para comparar arrays de objetos (simple, por id)
function arraysAreEqualById(arr1: any[], arr2: any[], idKey = 'id') {
  if (arr1.length !== arr2.length) return false;
  const ids1 = arr1.map(x => x[idKey]).sort();
  const ids2 = arr2.map(x => x[idKey]).sort();
  return JSON.stringify(ids1) === JSON.stringify(ids2);
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
        if (!arraysAreEqualById(supabaseLeagues, leagues)) {
          setLeagues(supabaseLeagues);
        }
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
        let allCategories: Category[] = [];
        for (const league of leagues) {
          const leagueCategories = await SupabaseService.getCategoriesByLeague(league.id);
          allCategories = allCategories.concat(leagueCategories);
        }
        // Ordena por id para comparación estable
        allCategories.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const currentSorted = [...categories].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        // Compara por JSON.stringify solo si los datos son simples
        if (JSON.stringify(allCategories) !== JSON.stringify(currentSorted)) {
          setCategories(allCategories);
        }
      } catch (error) {
        console.error('❌ Error loading categories:', error);
      }
    };
    if (leagues.length > 0) {
      loadAllCategories();
    }
  }, [leagues]); // ✅ Agregar leagues a las dependencias

  // Cargar todas las zonas al inicializar
  useEffect(() => {
    const loadAllZones = async () => {
      try {
        const allZones = await zonesService.getAllZones();
        allZones.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const currentSorted = [...zones].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        if (JSON.stringify(allZones) !== JSON.stringify(currentSorted)) {
          setZones(allZones);
        }
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
        const allTeamsRaw = await SupabaseService.getAllTeams();
        console.log('Equipos crudos de Supabase:', allTeamsRaw);
        // Si tienes un mapeo, hazlo aquí y loguea el resultado
        // const allTeams = allTeamsRaw.map(mapSupabaseToTeam);
        // console.log('Equipos mapeados:', allTeams);
        allTeamsRaw.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const currentSorted = [...teams].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        if (JSON.stringify(allTeamsRaw) !== JSON.stringify(currentSorted)) {
          setTeams(allTeamsRaw);
          console.log('Equipos guardados en estado:', allTeamsRaw);
        }
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
        const allFixtures = await SupabaseService.getFixtures();
        allFixtures.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const currentSorted = [...fixtures].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        if (JSON.stringify(allFixtures) !== JSON.stringify(currentSorted)) {
          setFixtures(allFixtures);
        }
      } catch (error) {
        console.error('Error loading fixtures:', error);
      }
    };
    loadAllFixtures();
  }, []);

  // Cargar cursos al inicializar
  useEffect(() => {
    const loadAllCourses = async () => {
      try {
        const allCourses = await SupabaseService.getAllCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };
    loadAllCourses();
  }, []);

  // League operations
  const getLeague = (id: string) => {
    return leagues.find(league => league.id === id);
  };

  // SOLUCIÓN 1: Category operations con mejor debugging
  const getCategoriesByLeague = (leagueId: string) => {
    console.log('🔍 getCategoriesByLeague called with:', {
      leagueId,
      type: typeof leagueId,
      allCategories: categories.length,
      availableLeagueIds: [...new Set(categories.map(c => c.leagueId))]
    });
    
    if (!leagueId) {
      console.warn('⚠️ LeagueId is null/undefined');
      return [];
    }
    
    // Convertir leagueId a número si es necesario
    const searchLeagueId = typeof leagueId === 'string' && !isNaN(Number(leagueId))
      ? Number(leagueId)
      : leagueId;
    
    const filtered = categories.filter(category => {
      if (!category.leagueId) {
        console.warn('⚠️ Category without leagueId:', category);
        return false;
      }
      
      // Comparación flexible (string y número)
      const categoryLeagueId = category.leagueId;
      const match = categoryLeagueId == searchLeagueId ||
                    String(categoryLeagueId) === String(searchLeagueId);
      
      if (match) {
        console.log(`✅ Category match: ${category.name} (id: ${category.id}) for league ${leagueId}`);
      }
      
      return match;
    });
    
    console.log(`📊 Result: ${filtered.length} categories for league ${leagueId}`, filtered);
    
    if (filtered.length === 0) {
      console.error(`❌ NO CATEGORIES FOUND for league ${leagueId}`);
      console.log('Available categories:', categories);
      console.log('Categories by league:',
        categories.reduce((acc, cat) => {
          (acc as Record<string, string[]>)[cat.leagueId] = (acc as Record<string, string[]>)[cat.leagueId] || [];
          (acc as Record<string, string[]>)[cat.leagueId].push(cat.name);
          return acc;
        }, {})
      );
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

  // 4. FUNCIÓN DE REPARACIÓN AUTOMÁTICA
  const repairMissingCategories = async (leagueId: string) => {
    console.log('🔧 Reparando categorías faltantes para liga:', leagueId);
    
    try {
      // Obtener todos los categoria_id únicos de los equipos de esta liga
      const teamsInLeague = teams.filter(team => String(team.leagueId) === String(leagueId));
      const usedCategoryIds = [...new Set(teamsInLeague.map(team => team.categoryId))];
      
      console.log('📋 Categoria IDs usados por equipos:', usedCategoryIds);
      
      // Verificar cuáles categorías faltan
      const existingCategoryIds = categories
        .filter(cat => String(cat.leagueId) === String(leagueId))
        .map(cat => cat.id);
      
      const missingCategoryIds = usedCategoryIds.filter(id => !existingCategoryIds.includes(String(id || '')));
      
      console.log('❌ Categorías faltantes:', missingCategoryIds);
      
      // Crear categorías faltantes
      for (const categoryId of missingCategoryIds) {
        const categoryName = `Categoría ${categoryId}`; // Puedes personalizar el nombre
        
        try {
          // Crear usando el servicio de Supabase
          const newCategory = await SupabaseService.createCategory(categoryName, leagueId || '');
          
          if (newCategory) {
            console.log(`✅ Categoría creada: ${categoryName} (ID: ${newCategory.id})`);
            
            // Si necesitas que tenga un ID específico, actualízalo
            if (String(newCategory.id || '') !== String(categoryId || '')) {
              console.warn(`⚠️ ID generado (${newCategory.id}) != ID esperado (${categoryId})`);
              // Aquí podrías actualizar los equipos o crear una nueva categoría con el ID correcto
            }
          }
        } catch (error) {
          console.error(`❌ Error creando categoría ${categoryId}:`, error);
        }
      }
      
      // Recargar categorías
      const updatedCategories = await SupabaseService.getCategoriesByLeague(leagueId || '');
      setCategories(prev => {
        const otherLeagueCategories = prev.filter(cat => String(cat.leagueId || '') !== String(leagueId || ''));
        return [...otherLeagueCategories, ...updatedCategories];
      });
      
    } catch (error) {
      console.error('❌ Error en repairMissingCategories:', error);
    }
  };
  
  // 5. SOLUCIÓN RÁPIDA TEMPORAL
  const ensureBasicCategories = async (leagueId: string) => {
    const existingCategories = getCategoriesByLeague(leagueId);
    
    if (existingCategories.length === 0) {
      console.log('🔧 Creando categorías básicas...');
      
      const basicCategories = [
        { name: 'Primera División', leagueId: String(leagueId), isEditable: true },
        { name: 'Segunda División', leagueId: String(leagueId), isEditable: true }
      ];
      
      for (const categoryData of basicCategories) {
        try {
          await addCategory(categoryData);
          console.log(`✅ Categoría creada: ${categoryData.name}`);
        } catch (error) {
          console.error(`❌ Error creando categoría ${categoryData.name}:`, error);
        }
      }
    }
  };

  // Función para obtener categorías por zona
  const getCategoriesByZone = (zoneId: string): Category[] => {
    return categories.filter(category => (category as any).zoneId === zoneId);
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      // Usar la función con estructura que soporta zone_id
      const newCategory = await SupabaseService.createCategoryWithStructure(
        category.name,
        category.leagueId,
        category.zoneId // Pasar el zoneId si existe
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

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      if (data.name) {
        await SupabaseService.updateCategory(id, { name: data.name });
      }
      setCategories(categories.map(cat =>
        cat.id === id ? { ...cat, ...data } : cat
      ));
    } catch (error) {
      console.error('Error actualizando categoría en Supabase:', error);
      // Opcional: muestra un mensaje de error al usuario
    }
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
    const filtered = zones.filter(zone => {
      // Normalizar ambos valores a string para comparación consistente
      const zoneCategoryId = String(zone.categoryId);
      const searchCategoryId = String(categoryId);
      return zoneCategoryId === searchCategoryId;
    });
    console.log('getZonesByCategory called with:', categoryId, 'returning:', filtered);
    return filtered;
  };
  
  const getZonesByLeague = (leagueId: string): Zone[] => {
    const filtered = zones.filter(zone => {
      // Normalizar ambos valores a string para comparación consistente
      const zoneLeagueId = String(zone.leagueId);
      const searchLeagueId = String(leagueId);
      return zoneLeagueId === searchLeagueId;
    });
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
    const result = teams.filter(team => {
      // Normalizar ambos valores a string para comparación consistente
      const teamZoneId = String(team.zoneId);
      const searchZoneId = String(zoneId);
      const match = teamZoneId === searchZoneId;
      return match;
    });
    return result;
  };

  const addTeam = async (
    team: Omit<Team, 'id'>,
    standingData?: Partial<Omit<Standing, 'id' | 'teamId' | 'leagueId' | 'categoryId' | 'zoneId'>>
  ): Promise<Team | undefined> => {
    try {
      const savedTeam = await SupabaseService.createTeam(
        team.name,
        '',
        team.leagueId || '',
        '',
        team.logo || ''
      );
      if (savedTeam && savedTeam.id) {
        setTeams(prev => [...prev, savedTeam]);
        return savedTeam;
      }
    } catch (error) {
      console.error('Error adding team:', error);
      alert('Error al crear el equipo. Verifica los datos e inténtalo de nuevo.');
      return undefined;
    }
  };

  const updateTeam = async (id: string, data: Partial<Team>) => {
    try {
      const currentTeam = teams.find(team => team.id === id);
      if (!currentTeam) {
        console.error('Team not found:', id);
        return;
      }
      const updatedData = { ...currentTeam, ...data };
      
      // Validar que los campos requeridos no estén vacíos
      if (!updatedData.name || !updatedData.leagueId) {
        console.error('Missing required fields:', { name: updatedData.name, leagueId: updatedData.leagueId });
        alert('El nombre y la liga son campos requeridos');
        return;
      }
      
      const updatedTeam = await SupabaseService.updateTeam(
        id,
        updatedData.name,
        updatedData.zoneId || '',  // Usar cadena vacía para campos opcionales
        updatedData.leagueId,
        updatedData.categoryId || '',  // Usar cadena vacía para campos opcionales
        updatedData.logo || ''  // Usar cadena vacía para campos opcionales
      );
      if (updatedTeam) {
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

      // Eliminar posiciones_editable asociadas
      await eliminarPosicionPorEquipo(id);

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
    
    // ✅ CAMBIO: Normalizar IDs a string
    const zoneFixtures = getFixturesByZone(zoneId);
    const zoneTeams = teams.filter(team => String(team.zoneId) === String(zoneId));
    
    // CAMBIO: Crear standings automáticamente para todos los equipos de la zona
    const teamStats: { [teamId: string]: Standing } = {};
    
    // Inicializar estadísticas para cada equipo de la zona
    zoneTeams.forEach(team => {
      teamStats[team.id] = {
        id: uuidv4(),
        teamId: team.id,
        leagueId: team.leagueId,
        categoryId: team.categoryId || '',
        zoneId: team.zoneId || '',
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
      const zoneIdStr = String(zoneId ?? '');
      const otherZoneStandings = prevStandings.filter(s => String(s.zoneId ?? '') !== zoneIdStr);
      return [...otherZoneStandings, ...calculatedStandings];
    });
    
    return calculatedStandings;
  }, [fixtures, teams]);

  // Standings operations
  // Cargar standings desde Supabase
  useEffect(() => {
    const loadAllStandings = async () => {
      try {
        let allStandingsRaw: Standing[] = [];
        for (const zone of zones) {
          const zoneStandings = await SupabaseService.getStandingsByZone(zone.id);
          allStandingsRaw = allStandingsRaw.concat(zoneStandings);
        }
        console.log('Standings crudos de Supabase:', allStandingsRaw);
        // Si tienes un mapeo, hazlo aquí y loguea el resultado
        // const allStandings = allStandingsRaw.map(mapSupabaseToStanding);
        // console.log('Standings mapeados:', allStandings);
        allStandingsRaw.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const currentSorted = [...standings].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        if (JSON.stringify(allStandingsRaw) !== JSON.stringify(currentSorted)) {
          setStandings(allStandingsRaw);
          console.log('Standings guardados en estado:', allStandingsRaw);
        }
      } catch (error) {
        console.error('Error loading standings:', error);
      }
    };
    if (zones.length > 0) {
      loadAllStandings();
    } else {
      setStandings([]);
    }
  }, [zones]);
  
  const refreshFixtures = useCallback(async () => {
    try {
      console.log('=== REFRESHING FIXTURES FROM SUPABASE ===');
      const result = await SupabaseService.getFixtures();
      console.log('Refreshed fixtures:', result);
      console.log('Number of fixtures loaded:', result.length);
      // Usar variable temporal para asegurar que todos los partidos estén cargados
      const allFixturesLoaded = result.every(fixture => Array.isArray(fixture.matches));
      if (allFixturesLoaded) {
        setFixtures(result);
      } else {
        // Si algún fixture no tiene los partidos cargados, esperar y volver a intentar
        console.warn('Algunos fixtures no tienen partidos cargados, reintentando en 300ms...');
        setTimeout(() => refreshFixtures(), 300);
      }
    } catch (error) {
      console.error('Error refreshing fixtures:', error);
      setFixtures([]);
      throw error;
    }
  }, []);

  // --- Standings helpers ---
  const getStandingsByZone = (zoneId: string): Standing[] => {
    return standings.filter(standing => String(standing.zoneId) === String(zoneId));
  };

  const updateStanding = (id: string, data: Partial<Standing>) => {
    setStandings(standings.map(standing =>
      standing.id === id ? { ...standing, ...data } : standing
    ));
  };

  const addStanding = (standing: Omit<Standing, 'id'>) => {
    const newStanding: Standing = { ...standing, id: uuidv4() };
    setStandings(prev => [...prev, newStanding]);
  };

  const createStanding = async (standing: Omit<Standing, 'id'>): Promise<void> => {
    // Guardar en Supabase
    const saved = await SupabaseService.createStanding(standing);
    if (saved) {
      await refreshStandings();
    }
  };

  const importStandingsFromCSV = async (csvData: string, zoneId: string) => {
    // Implementación dummy para evitar error
    return;
  };

  // Nuevas funciones para gestión de datos con useCallback
  const refreshCategories = useCallback(async () => {
    try {
      console.log('=== REFRESHING CATEGORIES FROM SUPABASE ===');
      const allCategories: Category[] = [];
      
      for (const league of leagues) {
        const leagueCategories = await SupabaseService.getCategoriesByLeague(league.id);
        allCategories.push(...leagueCategories);
      }
      
      setCategories(allCategories);
      console.log('Categories refreshed:', allCategories);
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  }, [leagues]);

  const refreshZones = useCallback(async () => {
    try {
      console.log('=== REFRESHING ZONES FROM SUPABASE ===');
      const allZones = await zonesService.getAllZones();
      setZones(allZones);
      console.log('Zones refreshed:', allZones);
    } catch (error) {
      console.error('Error refreshing zones:', error);
    }
  }, []);

  const refreshTeams = useCallback(async () => {
    try {
      console.log('=== REFRESHING TEAMS FROM SUPABASE ===');
      const allTeams = await SupabaseService.getAllTeams();
      setTeams(allTeams);
      console.log('Teams refreshed:', allTeams);
    } catch (error) {
      console.error('Error refreshing teams:', error);
    }
  }, []);

  const refreshStandings = useCallback(async () => {
    try {
      console.log('=== REFRESHING STANDINGS FROM SUPABASE ===');
      const { data: allStandings, error } = await supabase
        .from('standings')
        .select('*');
      
      if (error) {
        console.error('Error fetching standings:', error);
        return;
      }
      setStandings(allStandings);
      console.log('Standings refreshed:', allStandings);
    } catch (error) {
      console.error('Error refreshing standings:', error);
    }
  }, []);

  // --- Courses helpers ---
  const getCourses = () => courses;
  const addCourse = (course: Omit<Course, 'id'>) => {
    const newCourse = { ...course, id: uuidv4() };
    setCourses(prev => [...prev, newCourse]);
  };
  const updateCourse = (id: string, data: Partial<Course>) => {
    setCourses(courses.map(course =>
      course.id === id ? { ...course, ...data } : course
    ));
  };
  const deleteCourse = (id: string) => {
    setCourses(courses.filter(course => course.id !== id));
  };

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
    debugCategorySelection,
    repairMissingCategories,
    ensureBasicCategories,
    // Nuevas funciones para gestión de datos
    refreshCategories,
    refreshZones,
    refreshTeams,
    refreshStandings
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};
