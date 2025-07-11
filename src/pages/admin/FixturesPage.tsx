import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLeague, Match, Team } from '../../contexts/LeagueContext';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Edit, Trash2, Calendar, Save, X, Users, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SupabaseService } from '../../services/supabaseService';
import { formatLocalDate } from '../../utils/dateUtils';
import FixtureForm from './FixtureForm';
import FixtureList from './FixtureList';

interface FixtureFormData {
  date: string;
  matchDate: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  leyenda?: string;
  texto_central?: string;
  matches: {
    homeTeamId: string;
    awayTeamId: string;
    played?: boolean;
    homeScore?: number;
    awayScore?: number;
  }[];
}

interface FormState {
  isAdding: boolean;
  editingId: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
}

const FixturesPage: React.FC = () => {
  const { 
    leagues, 
    fixtures, 
    teams,
    addFixture, 
    updateFixture, 
    deleteFixture, 
    getCategoriesByLeague, 
    getZonesByCategory,
    getTeamsByZone,
    refreshFixtures,
    getZonesByLeague,
    getCategoriesByZone
  } = useLeague();
  
  // Consolidar estado del formulario
  const [formState, setFormState] = useState<FormState>({
    isAdding: false,
    editingId: null,
    isLoading: true,
    isSubmitting: false
  });
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    selectedLeague: '',
    selectedCategory: '',
    selectedZone: ''
  });
  
  // Form handling
  const form = useForm<FixtureFormData>({
    defaultValues: {
      leagueId: '',
      categoryId: '',
      zoneId: '',
      date: '',
      matchDate: '',
      matches: [{ homeTeamId: '', awayTeamId: '', played: false }]
    }
  });
  
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = form;
  
  // Field array for matches
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'matches'
  });
  
  // Memoized computed values
  const watchedValues = {
    leagueId: watch('leagueId'),
    categoryId: watch('categoryId'),
    zoneId: watch('zoneId')
  };
  
  const isLigaMasculina = useMemo(() => 
    filters.selectedLeague === 'liga_masculina', 
    [filters.selectedLeague]
  );
  
  const computedData = useMemo(() => {
    const leagueCategories = getCategoriesByLeague(filters.selectedLeague);
    const categoryZones = getZonesByCategory(filters.selectedCategory);
    const zoneTeams = getTeamsByZone(filters.selectedZone);
    const formZoneTeams = getTeamsByZone(watchedValues.zoneId);
    const leagueTeams = teams.filter(team => team.leagueId === watchedValues.leagueId);
    
    const availableZones = isLigaMasculina 
      ? getZonesByLeague(filters.selectedLeague) 
      : getZonesByCategory(filters.selectedCategory);
      
    const availableCategories = isLigaMasculina && filters.selectedZone 
      ? getCategoriesByZone(filters.selectedZone) 
      : getCategoriesByLeague(filters.selectedLeague);
    
    return {
      leagueCategories,
      categoryZones,
      zoneTeams,
      formZoneTeams,
      leagueTeams,
      availableZones,
      availableCategories
    };
  }, [
    filters.selectedLeague,
    filters.selectedCategory,
    filters.selectedZone,
    watchedValues.leagueId,
    watchedValues.zoneId,
    isLigaMasculina,
    teams,
    getCategoriesByLeague,
    getZonesByCategory,
    getTeamsByZone,
    getZonesByLeague,
    getCategoriesByZone
  ]);
  
  // Filtrado de fixtures
  const filteredFixtures = useMemo(() => {
    if (!filters.selectedLeague) return [];
    // Ordenar por fecha y luego por número de zona
    return fixtures
      .filter(fixture => fixture.leagueId === filters.selectedLeague)
      .sort((a, b) => {
        // 1. Ordenar por fecha
        if (a.matchDate && b.matchDate) {
          const dateDiff = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
          if (dateDiff !== 0) return dateDiff;
        }
        // 2. Ordenar por número de zona
        const getZoneNumber = (zoneId: string) => {
          const zone = computedData.availableZones.find(z => z.id === zoneId);
          // Extraer el primer número que aparezca en el nombre de la zona
          const match = zone?.name?.match(/\d+/);
          return match ? parseInt(match[0], 10) : 9999;
        };
        return getZoneNumber(a.zoneId) - getZoneNumber(b.zoneId);
      });
  }, [fixtures, filters.selectedLeague, computedData.availableZones]);
  
  // Fixtures inválidos
  const invalidFixtures = useMemo(() => 
    fixtures.filter(f => f.invalidLeagueId), 
    [fixtures]
  );
  
  // Función para obtener nombre del equipo
  const getTeamName = useCallback((teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  }, [teams]);
  
  // Carga inicial
  useEffect(() => {
    const loadFixtures = async () => {
      try {
        console.log('Loading fixtures from Supabase...');
        await refreshFixtures();
        console.log('Fixtures loaded successfully.');
      } catch (error) {
        console.error('Error loading fixtures:', error);
      } finally {
        setFormState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadFixtures();
  }, [refreshFixtures]);
  
  // Inicialización de filtros
  useEffect(() => {
    if (leagues.length > 0 && !filters.selectedLeague) {
      const firstLeague = leagues[0];
      setFilters(prev => ({
        ...prev,
        selectedLeague: firstLeague.id,
        selectedCategory: '',
        selectedZone: ''
      }));
    }
  }, [leagues, filters.selectedLeague]);
  
  // Auto-selección de categoría
  useEffect(() => {
    if (filters.selectedLeague && computedData.availableCategories.length > 0 && !filters.selectedCategory) {
      setFilters(prev => ({
        ...prev,
        selectedCategory: computedData.availableCategories[0].id
      }));
    }
  }, [filters.selectedLeague, computedData.availableCategories, filters.selectedCategory]);
  
  // Auto-selección de zona
  useEffect(() => {
    if (filters.selectedCategory && computedData.availableZones.length > 0 && !filters.selectedZone) {
      setFilters(prev => ({
        ...prev,
        selectedZone: computedData.availableZones[0].id
      }));
    }
  }, [filters.selectedCategory, computedData.availableZones, filters.selectedZone]);
  
  // Handlers
  const handleAddClick = useCallback(() => {
    setFormState(prev => ({ ...prev, isAdding: true, editingId: null }));
    reset({
      leagueId: filters.selectedLeague,
      categoryId: filters.selectedCategory,
      zoneId: filters.selectedZone,
      date: '',
      matchDate: '',
      matches: [{ homeTeamId: '', awayTeamId: '', played: false }]
    });
  }, [filters, reset]);
  
  const handleEditClick = useCallback((fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    
    setFormState(prev => ({ ...prev, isAdding: false, editingId: fixtureId }));
    
    const formattedMatches = fixture.matches.map(match => ({
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      played: match.played,
      homeScore: match.homeScore,
      awayScore: match.awayScore
    }));
    
    reset({
      date: fixture.date,
      matchDate: fixture.matchDate,
      leagueId: fixture.leagueId,
      categoryId: fixture.categoryId,
      zoneId: fixture.zoneId,
      leyenda: fixture.leyenda || '',
      texto_central: fixture.texto_central || '',
      matches: formattedMatches
    });
    
    setFilters({
      selectedLeague: fixture.leagueId,
      selectedCategory: fixture.categoryId,
      selectedZone: fixture.zoneId
    });
  }, [fixtures, reset]);
  
  const handleCancelClick = useCallback(() => {
    setFormState(prev => ({ ...prev, isAdding: false, editingId: null }));
    reset();
  }, [reset]);
  
  const handleDeleteFixture = useCallback(async (id: string) => {
    const confirmed = window.confirm('¿Estás seguro de eliminar este fixture? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    
    try {
      setFormState(prev => ({ ...prev, isLoading: true }));
      await deleteFixture(id);
      await refreshFixtures();
    } catch (error) {
      console.error('Error deleting fixture:', error);
      alert('Error al eliminar el fixture');
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  }, [deleteFixture, refreshFixtures]);
  
  const handleFilterChange = useCallback((type: 'league' | 'category' | 'zone', value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      switch (type) {
        case 'league':
          newFilters.selectedLeague = value;
          newFilters.selectedCategory = '';
          newFilters.selectedZone = '';
          break;
        case 'category':
          newFilters.selectedCategory = value;
          if (!isLigaMasculina) {
            newFilters.selectedZone = '';
          }
          break;
        case 'zone':
          newFilters.selectedZone = value;
          break;
      }
      
      return newFilters;
    });
  }, [isLigaMasculina]);
  
  const onSubmit = useCallback(async (data: FixtureFormData) => {
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      
      // Validar partidos
      const validMatches = data.matches.filter(
        match => match.homeTeamId && 
                match.awayTeamId && 
                match.homeTeamId !== match.awayTeamId
      );
      
      if (validMatches.length === 0) {
        alert('Debes agregar al menos un partido válido con ambos equipos seleccionados y diferentes.');
        return;
      }
      
      const fixtureData = {
        nombre: data.date,
        fechaPartido: data.matchDate,
        ligaId: data.leagueId,
        categoriaId: data.categoryId,
        zonaId: data.zoneId,
        leyenda: data.leyenda,
        texto_central: data.texto_central,
        matches: validMatches.map(match => ({
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId
        }))
      };
      
      let result;
      if (formState.isAdding) {
        console.log('[onSubmit] Creando fixture con datos:', fixtureData);
        result = await SupabaseService.createFixture(fixtureData);
        if (!result.success) {
          throw new Error(result.error || 'Error creando fixture');
        }
        // Esperar un poco para asegurar que los partidos se guarden en la base
        await new Promise(res => setTimeout(res, 400));
        console.log('[onSubmit] Fixture creado con ID:', result.fixtureId);
      } else if (formState.editingId) {
        console.log('[onSubmit] Actualizando fixture con ID:', formState.editingId, fixtureData);
        await SupabaseService.updateFixtureWithMatches(formState.editingId, fixtureData);
      }
      
      // Refrescar fixtures
      console.log('[onSubmit] Refrescando fixtures...');
      await refreshFixtures();
      console.log('[onSubmit] Fixtures refrescados.');
      
      setFilters({
        selectedLeague: data.leagueId,
        selectedCategory: data.categoryId,
        selectedZone: data.zoneId
      });
      
      setFormState(prev => ({ ...prev, isAdding: false, editingId: null }));
      reset();
      
      alert(`Fixture ${formState.isAdding ? 'creado' : 'actualizado'} exitosamente!`);
      
    } catch (error) {
      console.error('Error saving fixture:', error);
      alert(`Error ${formState.isAdding ? 'creando' : 'actualizando'} fixture: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.isAdding, formState.editingId, refreshFixtures, reset]);
  
  // Validación de partidos duplicados
  const validateMatches = useCallback((matches: FixtureFormData['matches']) => {
    const duplicates = new Set();
    return matches.filter(match => {
      const key = `${match.homeTeamId}-${match.awayTeamId}`;
      const reverseKey = `${match.awayTeamId}-${match.homeTeamId}`;
      
      if (duplicates.has(key) || duplicates.has(reverseKey)) {
        return false;
      }
      
      duplicates.add(key);
      return true;
    });
  }, []);
  
  const isFormDisabled = formState.isSubmitting || formState.isLoading;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fixtures</h1>
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={isFormDisabled || formState.isAdding || !!formState.editingId || !filters.selectedLeague}
        >
          <Plus size={18} />
          <span>Agregar Fixture</span>
        </button>
      </div>
      
      {/* Warning for invalid fixtures */}
      {invalidFixtures.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Fixtures con problemas detectados
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Se encontraron {invalidFixtures.length} fixture(s) con liga_id inválido:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {invalidFixtures.map(fixture => (
                    <li key={fixture.id}>
                      <span className="font-medium">ID:</span> {fixture.id} - 
                      <span className="font-medium"> Nombre:</span> {fixture.date || '(sin nombre)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users size={20} className="mr-2 text-indigo-600" />
          Filtros de Búsqueda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="leagueFilter" className="form-label">Liga</label>
            <select
              id="leagueFilter"
              className="form-input"
              value={filters.selectedLeague}
              onChange={(e) => handleFilterChange('league', e.target.value)}
            >
              <option value="">Seleccionar liga</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>{league.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Form */}
      {(formState.isAdding || formState.editingId) && (
        <FixtureForm
          formState={formState}
          setFormState={setFormState}
          filters={filters}
          setFilters={setFilters}
          leagues={leagues}
          teams={teams}
          computedData={computedData}
          reset={reset}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          register={register}
          errors={errors}
          fields={fields}
          append={append}
          remove={remove}
          isFormDisabled={isFormDisabled}
          handleCancelClick={handleCancelClick}
        />
      )}
      
      {/* Fixtures List */}
      <FixtureList
        fixtures={filteredFixtures}
        isLoading={formState.isLoading}
        selectedLeague={filters.selectedLeague}
        onEdit={handleEditClick}
        onDelete={handleDeleteFixture}
        getTeamName={getTeamName}
      />
    </div>
  );
};

export default FixturesPage;