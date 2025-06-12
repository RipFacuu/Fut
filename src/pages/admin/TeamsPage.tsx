import React, { useState } from 'react';
import { useLeague, Team } from '../../contexts/LeagueContext';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Save, X, Eye, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TeamFormData {
  name: string;
  logo?: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
}

const TeamsPage: React.FC = () => {
  // Importar la nueva función
  const { 
  leagues, 
  teams,
  zones,
  addTeam, 
  updateTeam, 
  deleteTeam, 
  getCategoriesByLeague, 
  getZonesByCategory,
  getZonesByLeague, // Agregar esta línea
  getTeamsByZone
  } = useLeague();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>(leagues[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [showAllTeams, setShowAllTeams] = useState(false);
  
  // Get form handling
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TeamFormData>({
    defaultValues: {
      leagueId: selectedLeague,
      categoryId: '',
      zoneId: '',
      name: '',
      logo: ''
    }
  });
  
  // Watch form values for dynamic dropdowns
  const watchLeagueId = watch('leagueId');
  const watchCategoryId = watch('categoryId');
  
  // Get categories for selected league (filtros)
  const leagueCategories = getCategoriesByLeague(selectedLeague);
  
  // Get categories for form league (formulario)
  const formLeagueCategories = getCategoriesByLeague(watchLeagueId);
  
  // Modificar la lógica de zonas de filtros
  const filterZones = selectedLeague === 'liga_masculina' 
  ? getZonesByLeague(selectedLeague)
  : getZonesByCategory(selectedCategory);
  
  // Modificar la lógica de zonas del formulario - solo para liga masculina
  const formZones = watchLeagueId === 'liga_masculina' 
  ? getZonesByLeague(watchLeagueId) 
  : getZonesByCategory(watchCategoryId);
  
  // Get zones for selected category (filtros)
  const categoryZones = getZonesByCategory(selectedCategory);
  
  // Get zones for form category (formulario)
  const formCategoryZones = getZonesByCategory(watchCategoryId);
  
  // Filter teams by selections or show all
  const filteredTeams = React.useMemo(() => {
    console.log('=== FILTERING TEAMS IN COMPONENT ===');
    console.log('showAllTeams:', showAllTeams);
    console.log('selectedZone:', selectedZone);
    console.log('Total teams in context:', teams.length);
    
    if (showAllTeams) {
      console.log('Mostrando todos los equipos');
      return teams;
    }
    
    if (selectedZone) {
      console.log('Filtrando por zona:', selectedZone);
      const result = getTeamsByZone(selectedZone);
      console.log('Resultado del filtro:', result.length, 'equipos');
      return result;
    }
    
    console.log('No hay zona seleccionada, devolviendo array vacío');
    return [];
  }, [showAllTeams, selectedZone, teams, getTeamsByZone]);
  
  // Helper function to get team details (league, category, zone names)
  const getTeamDetails = (team: Team) => {
    console.log('Buscando detalles para equipo:', team);
    console.log('Todas las ligas disponibles:', leagues);
    console.log('Todas las zonas disponibles:', zones);
    
    // Convertir IDs a string para comparación consistente
    const teamLeagueId = String(team.leagueId);
    const teamCategoryId = String(team.categoryId);
    const teamZoneId = String(team.zoneId);
    
    const league = leagues.find(l => String(l.id) === teamLeagueId);
    console.log('Liga encontrada:', league, 'Buscando ID:', teamLeagueId);
    
    if (!league) {
      return {
        leagueName: `Liga no encontrada (ID: ${team.leagueId})`,
        categoryName: `Categoría no encontrada (ID: ${team.categoryId})`,
        zoneName: `Zona no encontrada (ID: ${team.zoneId})`
      };
    }
    
    const categories = getCategoriesByLeague(league.id);
    console.log('Categorías disponibles:', categories);
    const category = categories.find(c => String(c.id) === teamCategoryId);
    console.log('Categoría encontrada:', category, 'Buscando ID:', teamCategoryId);
    
    if (!category) {
      return {
        leagueName: league.name,
        categoryName: `Categoría no encontrada (ID: ${team.categoryId})`,
        zoneName: `Zona no encontrada (ID: ${team.zoneId})`
      };
    }
    
    // CAMBIO PRINCIPAL: Buscar directamente en todas las zonas
    const zone = zones.find(z => String(z.id) === teamZoneId);
    console.log('Zona encontrada:', zone, 'Buscando ID:', teamZoneId);
    
    return {
      leagueName: league.name,
      categoryName: category.name,
      zoneName: zone?.name || `Zona no encontrada (ID: ${team.zoneId})`
    };
  };
  
  // EFECTOS CORREGIDOS - Comentar para evitar auto-selección automática
  /*
  React.useEffect(() => {
    if (leagueCategories.length > 0 && !selectedCategory && !showAllTeams) {
      setSelectedCategory(leagueCategories[0].id);
    }
  }, [selectedLeague, showAllTeams]); 
  
  React.useEffect(() => {
    if (categoryZones.length > 0 && !selectedZone && !showAllTeams) {
      setSelectedZone(categoryZones[0].id);
    }
  }, [selectedCategory, showAllTeams]); 
  */
  
  // Reset category when league changes in form
  // React.useEffect(() => {
  //   if (formLeagueCategories.length > 0 && (isAdding || editingId)) {
  //     setValue('categoryId', formLeagueCategories[0].id);
  //     setValue('zoneId', ''); // Reset zone when league changes
  //   }
  // }, [watchLeagueId, isAdding, editingId]);
  
  // Reset zone when category changes in form
  React.useEffect(() => {
    if (formCategoryZones.length > 0 && (isAdding || editingId)) {
      setValue('zoneId', formCategoryZones[0].id);
    }
  }, [watchCategoryId, isAdding, editingId]);
  
  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    
    // Inicializar formulario con valores vacíos para que el usuario seleccione
    const targetLeague = showAllTeams ? leagues[0]?.id || '' : selectedLeague;
    
    console.log('Inicializando formulario con:', {
      leagueId: targetLeague,
      categoryId: '',
      zoneId: ''
    });
    
    reset({
      leagueId: targetLeague,
      categoryId: '', // Iniciar vacío
      zoneId: '',     // Iniciar vacío
      name: '',
      logo: ''
    });
  };
  
  const handleEditClick = (team: Team) => {
    setIsAdding(false);
    setEditingId(team.id);
    
    console.log('Editando equipo:', team);
    
    reset({
      name: team.name,
      logo: team.logo || '',
      leagueId: team.leagueId,
      categoryId: team.categoryId,
      zoneId: team.zoneId
    });
  };
  
  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
  };
  
  const onSubmit = async (data: TeamFormData) => {
    try {
      // Validar que todos los campos requeridos estén presentes
      if (!data.name || !data.leagueId || !data.categoryId || !data.zoneId) {
        console.error('Faltan campos requeridos:', data);
        return;
      }

      console.log('Datos del equipo a guardar:', data);
      
      // En la función onSubmit (línea 218), cambiar:
      if (isAdding) {
        await addTeam(data);
      } else if (editingId) {
        await updateTeam(editingId, data);
      } else if (editingId) {
        await updateTeam(editingId, data); // Ya está correcto
      }
      
      setIsAdding(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error('Error al guardar equipo:', error);
    }
  };
  
  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
      await deleteTeam(id);
    }
  };
  
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    setSelectedCategory(''); // Reset category
    setSelectedZone(''); // Reset zone
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedZone(''); // Reset zone
  };
  
  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
  };
  
  const handleShowAllTeams = () => {
    setShowAllTeams(true);
  };
  
  const handleShowFilteredTeams = () => {
    setShowAllTeams(false);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Equipos</h1>
          
          {/* Toggle buttons for view mode */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              className={cn(
                "px-3 py-2 flex items-center space-x-2 text-sm transition-colors",
                showAllTeams 
                  ? "bg-primary-600 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
              onClick={handleShowAllTeams}
            >
              <Eye size={16} />
              <span>Ver Todos</span>
            </button>
            <button
              className={cn(
                "px-3 py-2 flex items-center space-x-2 text-sm transition-colors",
                !showAllTeams 
                  ? "bg-primary-600 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
              onClick={handleShowFilteredTeams}
            >
              <Filter size={16} />
              <span>Filtrar</span>
            </button>
          </div>
        </div>
        
        <button
          className="btn btn-primary flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={isAdding || !!editingId || (!selectedZone && !showAllTeams)}
        >
          <Plus size={18} />
          <span>Agregar Equipo</span>
        </button>
      </div>
      
      {/* Filters - Solo se muestran cuando no se ven todos los equipos */}
      {!showAllTeams && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="leagueFilter" className="form-label">
              Liga
            </label>
            <select
              id="leagueFilter"
              className="form-input"
              value={selectedLeague}
              onChange={handleLeagueChange}
            >
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Orden condicional para filtros */}
          {selectedLeague === 'liga_masculina' ? (
            <>
              {/* Solo Zona para Liga Masculina - sin categoría */}
              <div>
                <label htmlFor="zoneFilter" className="form-label">
                  Zona
                </label>
                <select
                  id="zoneFilter"
                  className="form-input"
                  value={selectedZone}
                  onChange={handleZoneChange}
                  disabled={filterZones.length === 0}
                >
                  <option value="">Seleccionar zona</option>
                  {filterZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Orden normal para otras ligas */}
              <div>
                <label htmlFor="categoryFilter" className="form-label">
                  Categoría
                </label>
                <select
                  id="categoryFilter"
                  className="form-input"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  disabled={leagueCategories.length === 0}
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
                <label htmlFor="zoneFilter" className="form-label">
                  Zona
                </label>
                <select
                  id="zoneFilter"
                  className="form-input"
                  value={selectedZone}
                  onChange={handleZoneChange}
                  disabled={categoryZones.length === 0}
                >
                  <option value="">Seleccionar zona</option>
                  {categoryZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 border">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label" htmlFor="name">
                  Nombre del Equipo
                </label>
                <input
                  id="name"
                  type="text"
                  className={cn(
                    "form-input",
                    errors.name && "border-red-500"
                  )}
                  autoComplete="organization"
                  {...register('name', { required: 'El nombre es requerido' })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label" htmlFor="logo">
                  URL del Logo (opcional)
                </label>
                <input
                  id="logo"
                  type="text"
                  className="form-input"
                  placeholder="https://ejemplo.com/logo.png"
                  autoComplete="url"
                  {...register('logo')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label" htmlFor="leagueId">
                  Liga
                </label>
                <select
                  id="leagueId"
                  className={cn(
                    "form-input",
                    errors.leagueId && "border-red-500"
                  )}
                  {...register('leagueId', { required: 'La liga es requerida' })}
                >
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
                {errors.leagueId && (
                  <p className="mt-1 text-sm text-red-600">{errors.leagueId.message}</p>
                )}
              </div>
              
              {/* ORDEN CONDICIONAL: Si es Liga Masculina, solo mostrar Zona */}
              {watchLeagueId === 'liga_masculina' ? (
                <>
                  {/* Solo Zona para Liga Masculina */}
                  <div>
                    <label className="form-label" htmlFor="zoneId">
                      Zona
                    </label>
                    <select
                      id="zoneId"
                      className={cn(
                        "form-input",
                        errors.zoneId && "border-red-500"
                      )}
                      {...register('zoneId', { required: 'La zona es requerida' })}
                    >
                      <option value="">Seleccionar zona</option>
                      {formZones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" {...register('categoryId')} value="" />
                    {errors.zoneId && (
                      <p className="mt-1 text-sm text-red-600">{errors.zoneId.message}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Orden normal para otras ligas: Categoría primero */}
                  <div>
                    <label className="form-label" htmlFor="categoryId">
                      Categoría
                    </label>
                    <select
                      id="categoryId"
                      className={cn(
                        "form-input",
                        errors.categoryId && "border-red-500"
                      )}
                      {...register('categoryId', { required: 'La categoría es requerida' })}
                    >
                      <option value="">Seleccionar categoría</option>
                      {formLeagueCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                    )}
                  </div>
                  
                  {/* Zona después para otras ligas */}
                  <div>
                    <label className="form-label" htmlFor="zoneId">
                      Zona
                    </label>
                    <select
                      id="zoneId"
                      className={cn(
                        "form-input",
                        errors.zoneId && "border-red-500"
                      )}
                      {...register('zoneId', { required: 'La zona es requerida' })}
                    >
                      <option value="">Seleccionar zona</option>
                      {formCategoryZones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    {errors.zoneId && (
                      <p className="mt-1 text-sm text-red-600">{errors.zoneId.message}</p>
                    )}
                  </div>
                </>
              )}
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
                <span>{isAdding ? 'Crear Equipo' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Teams List */}
      {(showAllTeams || selectedZone) ? (
        filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeams.map(team => {
              const teamDetails = getTeamDetails(team);
              return (
                <div 
                  key={team.id} 
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          {team.logo ? (
                            <img 
                              src={team.logo} 
                              alt={`${team.name} logo`} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-600 font-bold text-lg">
                              {team.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-lg">{team.name}</h3>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          onClick={() => handleEditClick(team)}
                          disabled={isAdding || !!editingId}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          onClick={() => handleDeleteTeam(team.id)}
                          disabled={isAdding || !!editingId}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Show team details when viewing all teams */}
                    {showAllTeams && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Liga:</strong> {teamDetails.leagueName}</div>
                        <div><strong>Categoría:</strong> {teamDetails.categoryName}</div>
                        <div><strong>Zona:</strong> {teamDetails.zoneName}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showAllTeams ? 'No hay equipos' : 'No hay equipos en esta zona'}
            </h3>
            <p className="text-gray-500 mb-4">
              {showAllTeams 
                ? 'No hay equipos guardados. Haz clic en "Agregar Equipo" para crear uno.'
                : 'No hay equipos en esta zona. Haz clic en "Agregar Equipo" para crear uno.'
              }
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una zona</h3>
          <p className="text-gray-500">
            Selecciona una liga, categoría y zona para ver y gestionar los equipos, o usa "Ver Todos" para ver todos los equipos.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
// Agregar este botón temporal en el componente TeamsPage para debugging
