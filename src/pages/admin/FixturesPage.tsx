import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLeague, Team, League } from '../../contexts/LeagueContext';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Users, AlertTriangle } from 'lucide-react';
import FixtureList from './FixtureList';
import FixtureForm from './FixtureForm';

interface FixtureFormData {
  date: string;
  matchDate: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  leyenda?: string;
  texto_central?: string;
  matches: Array<{
    homeTeamId: string;
    awayTeamId: string;
    played?: boolean;
    homeScore?: number;
    awayScore?: number;
  }>;
}

interface FormState {
  isAdding: boolean;
  editingId: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
}

interface Filters {
  selectedLeague: string;
  selectedCategory: string;
  selectedZone: string;
}

interface ComputedData {
  leagueCategories: unknown[];
  categoryZones: unknown[];
  zoneTeams: Team[];
  formZoneTeams: Team[];
  leagueTeams: Team[];
  availableZones: unknown[];
  availableCategories: unknown[];
}

const INITIAL_FORM_STATE: FormState = {
  isAdding: false,
  editingId: null,
  isLoading: true,
  isSubmitting: false
};

const INITIAL_FILTERS: Filters = {
  selectedLeague: '',
  selectedCategory: '',
  selectedZone: ''
};

const FiltersSection: React.FC<{
  filters: Filters;
  leagues: League[];
  onChange: (type: keyof Filters, value: string) => void;
  isDisabled: boolean;
}> = ({ filters, leagues, onChange, isDisabled }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-4">
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
          onChange={e => onChange('selectedLeague', e.target.value)}
          disabled={isDisabled}
        >
          <option value="">Seleccionar liga</option>
          {leagues.map(league => (
            <option key={league.id} value={league.id}>{league.name}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

const ErrorBanner: React.FC<{ error: string | null }> = ({ error }) => (
  error ? (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
      <p>{error}</p>
    </div>
  ) : null
);

const FixturesPage: React.FC = () => {
  const { 
    leagues, 
    fixtures, 
    teams,
    getCategoriesByLeague, 
    getZonesByCategory,
    refreshFixtures,
    getZonesByLeague,
    getCategoriesByZone,
    addFixture,
    updateFixture,
    deleteFixture
  } = useLeague();

  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  const { watch, reset, handleSubmit, register, formState: { errors }, setValue, control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'matches'
  });

  const teamsByZone = useMemo(() => {
    const cache = new Map<string, Team[]>();
    teams.forEach(team => {
      if (!cache.has(team.zoneId)) {
        cache.set(team.zoneId, []);
      }
      cache.get(team.zoneId)!.push(team);
    });
    return cache;
  }, [teams]);

  const teamNamesCache = useMemo(() => {
    const cache = new Map<string, string>();
    teams.forEach(team => {
      cache.set(team.id, team.name);
    });
    return cache;
  }, [teams]);

  const isLigaMasculina = filters.selectedLeague === 'liga_masculina';

  const computedData: ComputedData = useMemo(() => {
    const leagueCategories = getCategoriesByLeague(filters.selectedLeague);
    const categoryZones = getZonesByCategory(filters.selectedCategory);
    const zoneTeams = teamsByZone.get(filters.selectedZone) || [];
    const formZoneTeams = teamsByZone.get(watch('zoneId') || '') || [];
    const selectedLeagueId = watch('leagueId') || '';
    const leagueTeams = selectedLeagueId 
      ? teams.filter(team => team.leagueId === selectedLeagueId)
      : teams; // Mostrar todos los equipos si no hay liga seleccionada

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
    teams,
    teamsByZone,
    getCategoriesByLeague,
    getZonesByCategory,
    getZonesByLeague,
    getCategoriesByZone,
    isLigaMasculina,
    watch
  ]);

  const sortFixtures = useCallback((fixturesToSort: typeof fixtures) => {
    return [...fixturesToSort].sort((a, b) => {
      if (a.matchDate && b.matchDate) {
        const dateDiff = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
        if (dateDiff !== 0) return dateDiff;
      }
      const getZoneNumber = (zoneId: string) => {
        const zone = computedData.availableZones.find((z: any) => z.id === zoneId);
        const match = zone?.name?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 9999;
      };
      return getZoneNumber(a.zoneId) - getZoneNumber(b.zoneId);
    });
  }, [computedData.availableZones]);

  const filteredFixtures = useMemo(() => {
    if (!filters.selectedLeague) return [];
    const filtered = fixtures.filter(fixture => fixture.leagueId === filters.selectedLeague);
    return sortFixtures(filtered);
  }, [fixtures, filters.selectedLeague, sortFixtures]);

  const invalidFixtures = useMemo(() => 
    fixtures.filter(f => f.invalidLeagueId), 
    [fixtures]
  );

  const getTeamName = useCallback((teamId: string): string => {
    return teamNamesCache.get(teamId) || 'Equipo desconocido';
  }, [teamNamesCache]);

  const handleFilterChange = useCallback((type: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  }, []);

  const handleAddFixture = useCallback(() => {
    setFormState(prev => ({ ...prev, isAdding: true, editingId: null }));
    setShowForm(true);
    reset({
      leagueId: filters.selectedLeague || '',
      categoryId: '',
      zoneId: '',
      date: '',
      matchDate: '',
      matches: [{ homeTeamId: '', awayTeamId: '', played: false }]
    });
  }, [filters.selectedLeague, reset]);

  const handleEditFixture = useCallback((fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    setFormState(prev => ({ ...prev, isAdding: false, editingId: fixtureId }));
    setShowForm(true);
    
    reset({
      leagueId: fixture.leagueId,
      categoryId: fixture.categoryId,
      zoneId: fixture.zoneId,
      date: fixture.date,
      matchDate: fixture.matchDate,
      leyenda: fixture.leyenda || '',
      texto_central: fixture.texto_central || '',
      matches: fixture.matches.length > 0 ? fixture.matches.map(match => ({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        played: match.played || false,
        homeScore: match.homeScore,
        awayScore: match.awayScore
      })) : [{ homeTeamId: '', awayTeamId: '', played: false }]
    });
  }, [fixtures, reset]);

  const handleDeleteFixture = useCallback(async (fixtureId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este fixture?')) return;
    
    try {
      setFormState(prev => ({ ...prev, isLoading: true }));
      await deleteFixture(fixtureId);
      setError(null);
    } catch (err) {
      setError('Error al eliminar el fixture.');
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  }, [deleteFixture]);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setFormState(prev => ({ ...prev, isAdding: false, editingId: null }));
    reset();
  }, [reset]);

  const handleSubmitForm = useCallback(async (data: FixtureFormData) => {
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      
      if (formState.isAdding) {
        // Crear nuevo fixture
        await addFixture({
          ...data,
          id: '', // Se generará automáticamente
          matches: data.matches.filter(match => match.homeTeamId && match.awayTeamId)
        });
      } else if (formState.editingId) {
        // Actualizar fixture existente
        await updateFixture(formState.editingId, {
          ...data,
          matches: data.matches.filter(match => match.homeTeamId && match.awayTeamId)
        });
      }
      
      setShowForm(false);
      setFormState(prev => ({ ...prev, isAdding: false, editingId: null, isSubmitting: false }));
      reset();
      setError(null);
    } catch (err) {
      setError('Error al guardar el fixture.');
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.isAdding, formState.editingId, addFixture, updateFixture, reset]);

  useEffect(() => {
    const loadFixtures = async () => {
      if (leagues.length === 0) return;
      try {
        setFormState(prev => ({ ...prev, isLoading: true }));
        setError(null);
        await refreshFixtures();
      } catch (err) {
        setError('Error al cargar los fixtures.');
      } finally {
        setFormState(prev => ({ ...prev, isLoading: false }));
      }
    };
    loadFixtures();
  }, [leagues, refreshFixtures]);

  return (
    <div className="space-y-6">
      <FiltersSection
        filters={filters}
        leagues={leagues}
        onChange={handleFilterChange}
        isDisabled={formState.isLoading}
      />
      <ErrorBanner error={error} />
      
      {showForm ? (
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
          onSubmit={handleSubmitForm}
          register={register}
          errors={errors}
          fields={fields}
          append={append}
          remove={remove}
          isFormDisabled={formState.isSubmitting}
          handleCancelClick={handleCancelForm}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Fixtures</h1>
            <button
              className="btn btn-primary flex items-center space-x-2"
              disabled={formState.isLoading || formState.isAdding || !!formState.editingId || !filters.selectedLeague}
              onClick={handleAddFixture}
            >
              <Plus size={18} />
              <span>Agregar Fixture</span>
            </button>
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <FixtureList
              fixtures={filteredFixtures}
              isLoading={formState.isLoading}
              selectedLeague={filters.selectedLeague}
              onEdit={handleEditFixture}
              onDelete={handleDeleteFixture}
              getTeamName={getTeamName}
            />
          </div>
        </>
      )}
      
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
    </div>
  );
};

export default FixturesPage;