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
    refreshFixtures
  } = useLeague();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verificar si la liga seleccionada es "Liga Participando"
  const isLigaParticipando = selectedLeague === 'liga_masculina';
  
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
  
  // 2. Auto-selección de categoría cuando cambia la liga - COMENTADO
  /*
  useEffect(() => {
    if (selectedLeague) {
      const categories = getCategoriesByLeague(selectedLeague);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0].id);
        setSelectedZone(''); // Reset zona
      }
    }
  }, [selectedLeague, getCategoriesByLeague]); // Incluir la función
  */
  
  // 3. Auto-selección de zona cuando cambia la categoría - COMENTADO
  /*
  useEffect(() => {
    if (selectedCategory) {
      const zones = getZonesByCategory(selectedCategory);
      if (zones.length > 0 && !selectedZone) {
        setSelectedZone(zones[0].id);
      }
    }
  }, [selectedCategory, getZonesByCategory]);
  */
  
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
  
  // Filtrado mejorado con logs más detallados
  const filteredFixtures = React.useMemo(() => {
    console.log('=== FILTERING FIXTURES ===');
    console.log('All fixtures:', fixtures.length);
    console.log('Filters:', { selectedLeague, selectedCategory, selectedZone });
    
    // Si no hay fixtures, devolver array vacío
    if (fixtures.length === 0) {
      console.log('No fixtures available');
      return [];
    }
    
    // NUEVA LÓGICA: Solo mostrar fixtures si liga, categoría Y zona están seleccionadas
    if (!selectedLeague || !selectedCategory || !selectedZone) {
      console.log('Liga, categoría o zona no seleccionadas. No se muestran fixtures.');
      return [];
    }
    
    const filtered = fixtures.filter(fixture => {
      // Convertir IDs a string para comparación segura
      const fixtureLeagueId = fixture.leagueId?.toString() || '';
      const fixtureCategoryId = fixture.categoryId?.toString() || '';
      const fixtureZoneId = fixture.zoneId?.toString() || '';
      
      const selectedLeagueStr = selectedLeague?.toString() || '';
      const selectedCategoryStr = selectedCategory?.toString() || '';
      const selectedZoneStr = selectedZone?.toString() || '';
      
      const leagueMatch = fixtureLeagueId === selectedLeagueStr;
      const categoryMatch = fixtureCategoryId === selectedCategoryStr;
      const zoneMatch = fixtureZoneId === selectedZoneStr;
      
      console.log(`Fixture ${fixture.id}:`, {
        leagueMatch: `${fixtureLeagueId} === ${selectedLeagueStr} = ${leagueMatch}`,
        categoryMatch: `${fixtureCategoryId} === ${selectedCategoryStr} = ${categoryMatch}`,
        zoneMatch: `${fixtureZoneId} === ${selectedZoneStr} = ${zoneMatch}`,
        finalMatch: leagueMatch && categoryMatch && zoneMatch
      });
      
      return leagueMatch && categoryMatch && zoneMatch;
    });
    
    console.log('Filtered result:', filtered.length, filtered);
    return filtered;
  }, [fixtures, selectedLeague, selectedCategory, selectedZone]);
  
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
          matches: data.matches.map(match => ({
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
        // Preserve match IDs for existing matches
        const existingFixture = fixtures.find(f => f.id === editingId);
        const updatedMatches = data.matches.map((match, index) => {
          const existingMatch = existingFixture?.matches[index];
          return {
            ...match,
            id: existingMatch?.id || `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fixtureId: editingId,
            played: !!match.played
          };
        });
        
        updateFixture(editingId, {
          ...data,
          matches: updatedMatches
        });
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
    
    // Actualizar estados
    setSelectedLeague(leagueId);
    setSelectedCategory('');
    setSelectedZone('');
    
    // Actualizar formulario si está activo
    if (isAdding || editingId) {
      setValue('leagueId', leagueId);
      setValue('categoryId', '');
      setValue('zoneId', '');
    }
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    
    // Actualizar estados
    setSelectedCategory(categoryId);
    setSelectedZone('');
    
    // Actualizar formulario si está abierto
    if (isAdding || editingId) {
      setValue('categoryId', categoryId);
      setValue('zoneId', '');
    }
  };
  
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = e.target.value;
    
    // Actualizar estado
    setSelectedZone(zoneId);
    
    // Actualizar formulario si está activo
    if (isAdding || editingId) {
      setValue('zoneId', zoneId);
    }
  };
  
  // Get team name by ID
  const getTeamName = (teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  };
  
  return (
    <div key={refreshKey}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fixtures</h1>
        
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={isAdding || !!editingId || !selectedZone}
        >
          <Plus size={18} />
          <span>Agregar Fixture</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users size={20} className="mr-2 text-indigo-600" />
          Filtros de Búsqueda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="leagueFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Liga
            </label>
            <select
              id="leagueFilter"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              value={selectedLeague}
              onChange={handleLeagueChange}
              disabled={isAdding || !!editingId}
            >
              <option value="">Seleccionar liga</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: isLigaParticipando ? 'none' : 'block' }}>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              id="categoryFilter"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={isAdding || !!editingId || leagueCategories.length === 0}
            >
              <option value="">Seleccionar categoría</option>
              {leagueCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="zoneFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Zona
            </label>
            <select
              id="zoneFilter"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              value={selectedZone}
              onChange={handleZoneChange}
              disabled={isAdding || !!editingId || categoryZones.length === 0}
            >
              <option value="">Seleccionar zona</option>
              {categoryZones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
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
              
              {/* Campos de selección visibles */}
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
                    setValue('categoryId', '');
                    setValue('zoneId', '');
                  }}
                >
                  <option value="">Seleccionar liga</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: watchLeagueId === 'liga_masculina' ? 'none' : 'block' }}>
                <label className="form-label" htmlFor="formCategoryId">
                  Categoría
                </label>
                <select
                  id="formCategoryId"
                  className={cn(
                    "form-input",
                    errors.categoryId && "border-red-500"
                  )}
                  {...register('categoryId', { required: watchLeagueId !== 'liga_masculina' ? 'La categoría es requerida' : false })}
                  onChange={(e) => {
                    setValue('categoryId', e.target.value);
                    setValue('zoneId', '');
                  }}
                >
                  <option value="">Seleccionar categoría</option>
                  {getCategoriesByLeague(watchLeagueId).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label" htmlFor="formZoneId">
                  Zona
                </label>
                <select
                  id="formZoneId"
                  className={cn(
                    "form-input",
                    errors.zoneId && "border-red-500"
                  )}
                  {...register('zoneId', { required: 'La zona es requerida' })}
                >
                  <option value="">Seleccionar zona</option>
                  {getZonesByCategory(watchCategoryId).map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Matches */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-3">Partidos</h3>
              
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-5 gap-2 items-center mb-3 pb-3 border-b last:border-0"
                >
                  <div className="col-span-2">
                    <label className="form-label text-sm">Equipo Local</label>
                    <select
                      className={cn(
                        "form-input",
                        errors.matches?.[index]?.homeTeamId && "border-red-500"
                      )}
                      {...register(`matches.${index}.homeTeamId` as const, {
                        required: 'Requerido'
                      })}
                    >
                      <option value="">Seleccionar equipo</option>
                      {zoneTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <span className="text-gray-400">VS</span>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="form-label text-sm">Equipo Visitante</label>
                    <select
                      className={cn(
                        "form-input",
                        errors.matches?.[index]?.awayTeamId && "border-red-500"
                      )}
                      {...register(`matches.${index}.awayTeamId` as const, {
                        required: 'Requerido'
                      })}
                    >
                      <option value="">Seleccionar equipo</option>
                      {zoneTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="btn btn-outline text-sm w-full mt-2"
                onClick={() => append({ homeTeamId: '', awayTeamId: '', played: false })}
              >
                <Plus size={14} className="mr-1" /> Agregar Partido
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline flex items-center space-x-2"
                onClick={handleCancelClick}
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
              
              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save size={18} />
                <span>{isAdding ? 'Crear Fixture' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Fixtures List */}
      {isLoading ? (
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando fixtures...</h3>
          <p className="text-gray-500">
            Obteniendo datos desde la base de datos...
          </p>
        </div>
      ) : selectedLeague ? (
        filteredFixtures.length > 0 ? (
          <div className="space-y-6">
            {filteredFixtures.map(fixture => (
              <div key={fixture.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Header del Fixture */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 p-3 rounded-lg">
                        <Calendar size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{fixture.date}</h3>
                        <p className="text-indigo-100 text-sm flex items-center mt-1">
                          <Calendar size={16} className="mr-2" />
                          {new Date(fixture.matchDate).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors duration-200"
                        onClick={() => handleEditClick(fixture.id)}
                        disabled={isAdding || !!editingId}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="bg-red-500/20 hover:bg-red-500/30 p-2 rounded-lg transition-colors duration-200"
                        onClick={() => handleDeleteFixture(fixture.id)}
                        disabled={isAdding || !!editingId}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de Partidos */}
                <div className="p-6">
                  {fixture.matches && fixture.matches.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                          <Users size={20} className="mr-2 text-indigo-600" />
                          Partidos ({fixture.matches.length})
                        </h4>
                      </div>
                      <div className="grid gap-4">
                        {fixture.matches.map((match, index) => (
                          <div key={match.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="text-center flex-1">
                                  <p className="font-medium text-gray-900">
                                    {getTeamName(match.homeTeamId)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Local</p>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                    VS
                                  </div>
                                </div>
                                
                                <div className="text-center flex-1">
                                  <p className="font-medium text-gray-900">
                                    {getTeamName(match.awayTeamId)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Visitante</p>
                                </div>
                              </div>
                              
                              {match.played && (
                                <div className="ml-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {match.homeScore} - {match.awayScore}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">
                        No hay partidos programados para este fixture
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
            <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
              <Calendar size={48} className="mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay fixtures disponibles</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No hay fixtures que coincidan con los filtros seleccionados. Crea el primer fixture para comenzar.
            </p>
            <button
              className="btn btn-primary px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleAddClick}
              disabled={!selectedZone}
            >
              <Plus size={20} className="mr-2" />
              Crear Primer Fixture
            </button>
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl border-2 border-dashed border-indigo-300">
          <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto mb-6 shadow-lg">
            <Calendar size={48} className="mx-auto text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Selecciona una liga</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Selecciona una liga, categoría y zona para ver y gestionar los fixtures correspondientes.
          </p>
        </div>
      )}
    </div>
  );
};

export default FixturesPage;