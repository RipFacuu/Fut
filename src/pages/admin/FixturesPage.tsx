import React, { useState, useEffect } from 'react';
import { useLeague, Match, Team } from '../../contexts/LeagueContext';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Edit, Trash2, Calendar, Save, X, Users } from 'lucide-react';
import { cn } from '../../utils/cn';
import { SupabaseService } from '../../services/supabaseService';

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

// Remover completamente la línea de hasLoadedOnce
// const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

const FixturesPage: React.FC = () => {
  const { 
    leagues, 
    fixtures, 
    teams, // Agregar teams aquí
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
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // ELIMINADO: Verificar si la liga seleccionada es "Liga Participando"
  // const isLigaParticipando = selectedLeague === 'liga_masculina';
  
  // Get form handling
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FixtureFormData>({
    defaultValues: {
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      zoneId: selectedZone,
      date: '',
      matchDate: '',
      matches: [{ homeTeamId: '', awayTeamId: '', played: false }]
    }
  });
  
  // Field array for matches
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'matches'
  });
  
  // Watch form values for dynamic dropdowns
  const watchLeagueId = watch('leagueId');
  const watchCategoryId = watch('categoryId');
  const watchZoneId = watch('zoneId');
  
  // Get categories for selected league
  const leagueCategories = getCategoriesByLeague(selectedLeague);
  
  // Get zones for selected category
  const categoryZones = getZonesByCategory(selectedCategory);
  
  // Get teams for selected zone
  const zoneTeams = getTeamsByZone(selectedZone);
  
  // Modificar el useEffect para cargar fixtures
  useEffect(() => {
    const loadFixtures = async () => {
      try {
        console.log('Loading fixtures from Supabase...');
        setIsLoading(true);
        await refreshFixtures();
        console.log('Fixtures loaded successfully.');
      } catch (error) {
        console.error('Error loading fixtures:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadFixtures();
  }, []); // Remover refreshFixtures de las dependencias

  // Inicializar filtros correctamente
  // 1. Inicialización de liga (sin dependencias circulares)
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeague) {
      const firstLeague = leagues[0];
      setSelectedLeague(firstLeague.id);
      setSelectedCategory('');
      setSelectedZone('');
    }
  }, [leagues]); // Solo depende de leagues
  
  // 2. Auto-selección de categoría cuando cambia la liga
  useEffect(() => {
    if (selectedLeague) {
      const categories = getCategoriesByLeague(selectedLeague);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0].id);
      }
    }
  }, [selectedLeague, getCategoriesByLeague]);
  
  // 3. Auto-selección de zona cuando cambia la categoría
  useEffect(() => {
    if (selectedCategory) {
      const zones = getZonesByCategory(selectedCategory);
      if (zones.length > 0 && !selectedZone) {
        setSelectedZone(zones[0].id);
      }
    }
  }, [selectedCategory, getZonesByCategory]);
  
  // Forzar valores vacíos al cargar la página
  useEffect(() => {
    setSelectedCategory('');
    setSelectedZone('');
  }, []); // Solo se ejecuta una vez al montar el componente
  
  // Effect para debugging - SIN llamadas a refreshFixtures
  useEffect(() => {
    console.log('=== FIXTURES UPDATED IN COMPONENT ===');
    console.log('Total fixtures:', fixtures.length);
    console.log('Selected filters:', {
      league: selectedLeague,
      category: selectedCategory, 
      zone: selectedZone
    });
    console.log('Current isLoading state:', isLoading);
    
    // Mostrar los IDs únicos de cada fixture
    if (fixtures.length > 0) {
      console.log('Fixture IDs breakdown:');
      fixtures.forEach((fixture, index) => {
        console.log(`Fixture ${index + 1}:`, {
          id: fixture.id,
          leagueId: fixture.leagueId,
          categoryId: fixture.categoryId,
          zoneId: fixture.zoneId,
          date: fixture.date
        });
      });
    } else {
      console.log('No fixtures found in state');
    }
  }, [fixtures, selectedLeague, selectedCategory, selectedZone, isLoading]);
  
  // Filtrado de fixtures solo por liga seleccionada
  const filteredFixtures = React.useMemo(() => {
    if (!selectedLeague) return [];
    return fixtures.filter(fixture => fixture.leagueId === selectedLeague);
  }, [fixtures, selectedLeague]);
  
  // --- ADVERTENCIA DE FIXTURES INVÁLIDOS ---
  const invalidFixtures = fixtures.filter(f => f.invalidLeagueId);

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      zoneId: selectedZone,
      date: '',
      matchDate: '',
      matches: [{ homeTeamId: '', awayTeamId: '', played: false }]
    });
  };
  
  const handleEditClick = (fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;
    
    setIsAdding(false);
    setEditingId(fixtureId);
    
    // Convert matches to form format
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
    
    // Update selections
    setSelectedLeague(fixture.leagueId);
    setSelectedCategory(fixture.categoryId);
    setSelectedZone(fixture.zoneId);
  };
  
  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
  };
  
  const handleDeleteFixture = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este fixture? Esta acción no se puede deshacer.')) {
      deleteFixture(id);
    }
  };
  
  // Función onSubmit corregida
  const onSubmit = async (data: FixtureFormData) => {
    try {
      setIsLoading(true);
      // Filtrar partidos válidos
      const validMatches = data.matches.filter(
        match => match.homeTeamId && match.awayTeamId && match.homeTeamId !== match.awayTeamId
      );
      if (validMatches.length === 0) {
        alert('Debes agregar al menos un partido válido con ambos equipos seleccionados y diferentes.');
        setIsLoading(false);
        return;
      }
      
      if (isAdding) {
        console.log('Creando fixture con datos:', {
          ligaId: data.leagueId,
          categoriaId: data.categoryId,
          zonaId: data.zoneId
        });
        
        const result = await SupabaseService.createFixture({
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
        });
  
        console.log('Resultado de createFixture:', result);
  
        if (result.success) {
          console.log('Fixture creado, refrescando lista...');
          
          // Refrescar fixtures
          await refreshFixtures();
          
          // Establecer los filtros para mostrar el nuevo fixture
          setSelectedLeague(data.leagueId);
          setSelectedCategory(data.categoryId);
          setSelectedZone(data.zoneId);
          
          setRefreshKey(prev => prev + 1);
          alert('Fixture creado exitosamente!');
        } else {
          console.error('Error creando fixture:', result.error);
          alert(`Error creando fixture: ${result.error}`);
          return;
        }
      } else if (editingId) {
        // Al editar, toma todos los partidos válidos del formulario
        await SupabaseService.updateFixtureWithMatches(editingId, {
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
        });
        // Refresca los fixtures para ver los cambios
        await refreshFixtures();
      }
      
      setIsAdding(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error('Error saving fixture:', error);
      alert('Error inesperado guardando fixture');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    setSelectedZone('');
    setSelectedCategory('');
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    // NO resetear zona en liga_masculina
  };
  
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
    // Ya no se resetea la categoría al cambiar zona
  };
  
  // Get team name by ID
  const getTeamName = (teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  };
  
  // Filtros para Liga Participando (liga_masculina): primero zona, luego categoría
  const isLigaMasculina = selectedLeague === 'liga_masculina';
  const availableZones = isLigaMasculina ? getZonesByLeague(selectedLeague) : getZonesByCategory(selectedCategory);
  const availableCategories = isLigaMasculina && selectedZone ? getCategoriesByZone(selectedZone) : getCategoriesByLeague(selectedLeague);
  
  const formZoneTeams = getTeamsByZone(watch('zoneId'));
  
  const leagueTeams = teams.filter(team => team.leagueId === watch('leagueId'));
  
  return (
    <div key={refreshKey}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fixtures</h1>
        
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={isAdding || !!editingId || !selectedLeague}
        >
          <Plus size={18} />
          <span>Agregar Fixture</span>
        </button>
      </div>
      
      {/* Mensaje de advertencia si hay fixtures inválidos */}
      {invalidFixtures.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          <strong>¡Atención!</strong> Hay {invalidFixtures.length} fixture(s) con <b>liga_id inválido o nulo</b> en la base de datos.<br/>
          Estos fixtures no se mostrarán correctamente en la web.<br/>
          <ul className="mt-2 list-disc list-inside">
            {invalidFixtures.map(f => (
              <li key={f.id}>ID: <b>{f.id}</b> - Nombre: <b>{f.date || '(sin nombre)'}</b></li>
            ))}
          </ul>
          <span className="block mt-2">Por favor, corrige el <b>liga_id</b> de estos fixtures en Supabase.</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users size={20} className="mr-2 text-indigo-600" />
          Filtros de Búsqueda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="leagueFilter" className="form-label">Liga</label>
            <select
              id="leagueFilter"
              className="form-input"
              value={selectedLeague}
              onChange={handleLeagueChange}
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
      {(isAdding || editingId) && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 border">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label" htmlFor="date">
                  Fecha (nombre)
                </label>
                <input
                  id="date"
                  type="text"
                  className={cn(
                    "form-input",
                    errors.date && "border-red-500"
                  )}
                  placeholder="Ej: 1° FECHA"
                  autoComplete="off"
                  {...register('date', { required: 'La fecha es requerida' })}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label" htmlFor="matchDate">
                  Fecha del partido
                </label>
                <input
                  id="matchDate"
                  type="date"
                  className={cn(
                    "form-input",
                    errors.matchDate && "border-red-500"
                  )}
                  autoComplete="off"
                  {...register('matchDate', { required: 'La fecha del partido es requerida' })}
                />
                {errors.matchDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.matchDate.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label" htmlFor="formLeagueId">
                  Liga
                </label>
                <select
                  id="formLeagueId"
                  className={cn(
                    "form-input",
                    errors.leagueId && "border-red-500"
                  )}
                  {...register('leagueId', { required: 'La liga es requerida' })}
                  onChange={(e) => {
                    setValue('leagueId', e.target.value);
                  }}
                  value={watch('leagueId')}
                >
                  <option value="">Seleccionar liga</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
                {errors.leagueId && <p className="mt-1 text-sm text-red-600">{errors.leagueId.message}</p>}
              </div>
              
              <div>
                <label className="form-label" htmlFor="leyenda">Leyenda (opcional)</label>
                <input
                  id="leyenda"
                  type="text"
                  className={cn("form-input", errors.leyenda && "border-red-500")}
                  placeholder="Ej: Fecha especial, Apertura 2024, Final, etc."
                  autoComplete="off"
                  {...register('leyenda')}
                />
              </div>
              
              <div>
                <label className="form-label" htmlFor="texto_central">Texto central (opcional)</label>
                <input
                  id="texto_central"
                  type="text"
                  className={cn("form-input", errors.texto_central && "border-red-500")}
                  placeholder="Ej: Zona 1, Zona 2, etc."
                  autoComplete="off"
                  {...register('texto_central')}
                />
              </div>
            </div>
            
            {/* Matches Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Partidos</h3>
                <button
                  type="button"
                  onClick={() => append({ homeTeamId: '', awayTeamId: '' })}
                  className="btn btn-secondary btn-sm flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span>Agregar Partido</span>
                </button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="bg-white p-4 rounded-md border mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Partido {index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        Equipo Local
                      </label>
                      <select
                        className={cn(
                          "form-input",
                          errors.matches?.[index]?.homeTeamId && "border-red-500"
                        )}
                        {...register(`matches.${index}.homeTeamId`, {
                          required: 'El equipo local es requerido'
                        })}
                      >
                        <option value="">Seleccionar equipo local</option>
                        {leagueTeams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {errors.matches?.[index]?.homeTeamId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.matches[index]?.homeTeamId?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">
                        Equipo Visitante
                      </label>
                      <select
                        className={cn(
                          "form-input",
                          errors.matches?.[index]?.awayTeamId && "border-red-500"
                        )}
                        {...register(`matches.${index}.awayTeamId`, {
                          required: 'El equipo visitante es requerido'
                        })}
                      >
                        <option value="">Seleccionar equipo visitante</option>
                        {leagueTeams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {errors.matches?.[index]?.awayTeamId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.matches[index]?.awayTeamId?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
                disabled={isLoading}
              >
                <Save size={18} />
                <span>{isAdding ? 'Crear Fixture' : 'Actualizar Fixture'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Fixtures List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar size={20} className="mr-2 text-indigo-600" />
            Lista de Fixtures
            {filteredFixtures.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">({filteredFixtures.length})</span>
            )}
          </h2>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Cargando fixtures...</p>
            </div>
          ) : filteredFixtures.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {!selectedLeague
                  ? 'Selecciona una liga para ver los fixtures'
                  : 'No hay fixtures para la liga seleccionada'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFixtures.map(fixture => (
                <div key={fixture.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 w-full">
                      <h3 className="font-semibold text-lg break-words">{fixture.date}</h3>
                      <span className="text-sm text-gray-600 break-words">
                        {new Date(fixture.matchDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleEditClick(fixture.id)}
                        className="btn btn-secondary btn-sm flex items-center justify-center space-x-1 w-full sm:w-auto"
                        disabled={isAdding || !!editingId}
                      >
                        <Edit size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFixture(fixture.id)}
                        className="btn btn-danger btn-sm flex items-center justify-center space-x-1 w-full sm:w-auto"
                        disabled={isAdding || !!editingId}
                      >
                        <Trash2 size={16} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {fixture.matches.filter(match => match.homeTeamId && match.awayTeamId && getTeamName(match.homeTeamId) !== 'Equipo desconocido' && getTeamName(match.awayTeamId) !== 'Equipo desconocido').map((match, index) => (
                      <div key={match.id || index} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-2 xs:space-y-0">
                          <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-4 space-y-1 xs:space-y-0">
                            <span className="font-medium break-words">{getTeamName(match.homeTeamId)}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium break-words">{getTeamName(match.awayTeamId)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixturesPage;