import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLeague, Team } from '../../contexts/LeagueContext';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Save, X, Eye, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TeamFormData {
  name: string;
  logo?: string;
  leagueId: string;
}

interface TeamWithDetails extends Team {
  leagueName: string;
  categoryName?: string;
  zoneName?: string;
  isLigaMasculina: boolean;
}

const TeamsPage: React.FC = () => {
  const { 
    leagues, 
    teams,
    addTeam, 
    updateTeam, 
    deleteTeam, 
    getCategoriesByLeague, 
    getZonesByCategory,
    getZonesByLeague,
    getTeamsByZone
  } = useLeague();
  
  // Estados locales
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inicializar la liga seleccionada
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeague) {
      setSelectedLeague(leagues[0].id);
    }
  }, [leagues, selectedLeague]);
  
  // Configuración del formulario
  const form = useForm<TeamFormData>({
    defaultValues: {
      leagueId: selectedLeague,
      name: '',
      logo: ''
    }
  });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = form;
  
  // Memoizar equipos con detalles para evitar recálculos innecesarios
  const teamsWithDetails = useMemo((): TeamWithDetails[] => {
    return teams.map(team => {
      const league = leagues.find(l => String(l.id) === String(team.leagueId));
      const isLigaMasculina = String(team.leagueId) === 'liga_masculina';
      
      return {
        ...team,
        leagueName: league?.name || `Liga no encontrada (ID: ${team.leagueId})`,
        categoryName: '', // TODO: Obtener de la categoría real
        zoneName: '', // TODO: Obtener de la zona real
        isLigaMasculina
      };
    });
  }, [teams, leagues]);
  
  // Filtrar equipos según la liga seleccionada
  const filteredTeams = useMemo(() => {
    if (showAllTeams) {
      return teamsWithDetails;
    }
    return teamsWithDetails.filter(team => team.leagueId === selectedLeague);
  }, [teamsWithDetails, selectedLeague, showAllTeams]);
  
  // Obtener categorías y zonas para la liga seleccionada
  const leagueCategories = useMemo(() => {
    return selectedLeague ? getCategoriesByLeague(selectedLeague) : [];
  }, [selectedLeague, getCategoriesByLeague]);
  
  const categoryZones = useMemo(() => {
    return selectedLeague ? getZonesByCategory(selectedLeague) : [];
  }, [selectedLeague, getZonesByCategory]);
  
  // Handlers memoizados para evitar re-renders innecesarios
  const handleAddClick = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    reset({
      leagueId: selectedLeague,
      name: '',
      logo: ''
    });
  }, [selectedLeague, reset]);
  
  const handleEditClick = useCallback((team: Team) => {
    setIsAdding(false);
    setEditingId(team.id);
    reset({
      name: team.name,
      logo: team.logo || '',
      leagueId: team.leagueId
    });
  }, [reset]);
  
  const handleCancelClick = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  }, [reset]);
  
  const handleLeagueChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    
    // Si está editando o agregando, actualizar el formulario
    if (isAdding || editingId) {
      setValue('leagueId', leagueId);
    }
  }, [isAdding, editingId, setValue]);
  
  const handleShowAllTeams = useCallback(() => {
    setShowAllTeams(true);
  }, []);
  
  const handleShowFilteredTeams = useCallback(() => {
    setShowAllTeams(false);
  }, []);
  
  const handleDeleteTeam = useCallback(async (id: string) => {
    // Validación mejorada para IDs temporales
    if (typeof id === 'string' && id.startsWith('team_')) {
      alert('Equipo eliminado localmente. No existe en la base de datos.');
      return;
    }
    
    if (window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
      try {
        await deleteTeam(id);
      } catch (error) {
        console.error('Error al eliminar equipo:', error);
        alert('Error al eliminar el equipo. Intenta nuevamente.');
      }
    }
  }, [deleteTeam]);
  
  const onSubmit = useCallback(async (data: TeamFormData) => {
    // Validación de campos requeridos
    if (!data.name.trim() || !data.leagueId) {
      console.error('Faltan campos requeridos:', data);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const teamData = {
        name: data.name.trim(),
        leagueId: data.leagueId,
        logo: data.logo?.trim() || undefined
      };
      
      if (isAdding) {
        await addTeam(teamData);
      } else if (editingId) {
        await updateTeam(editingId, teamData);
      }
      
      // Limpiar estado del formulario
      setIsAdding(false);
      setEditingId(null);
      reset();
    } catch (error) {
      console.error('Error al guardar equipo:', error);
      alert('Error al guardar el equipo. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isAdding, editingId, addTeam, updateTeam, reset]);
  
  // Validar si se puede agregar un equipo
  const canAddTeam = useMemo(() => {
    return !isAdding && !editingId && (selectedLeague || showAllTeams);
  }, [isAdding, editingId, selectedLeague, showAllTeams]);
  
  // Componente para mostrar detalles del equipo
  const TeamDetails = React.memo(({ team }: { team: TeamWithDetails }) => (
    <div className="text-sm text-gray-600 space-y-1">
      <div><strong>Liga:</strong> {team.leagueName}</div>
      {team.isLigaMasculina ? (
        <>
          <div><strong>Zona:</strong> {team.zoneName || 'No asignada'}</div>
          <div><strong>Categoría:</strong> {team.categoryName || 'No asignada'}</div>
        </>
      ) : (
        <>
          <div><strong>Categoría:</strong> {team.categoryName || 'No asignada'}</div>
          <div><strong>Zona:</strong> {team.zoneName || 'No asignada'}</div>
        </>
      )}
    </div>
  ));
  
  // Componente para el avatar del equipo
  const TeamAvatar = React.memo(({ team }: { team: TeamWithDetails }) => (
    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto xs:mx-0">
      {team.logo ? (
        <>
          <img 
            src={team.logo} 
            alt={`${team.name} logo`} 
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              fallback?.classList.remove('hidden');
            }}
          />
          <span className="text-primary-600 font-bold text-lg hidden">
            {team.name.substring(0, 2).toUpperCase()}
          </span>
        </>
      ) : (
        <span className="text-primary-600 font-bold text-lg">
          {team.name.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  ));
  
  // Componente para los botones de acción
  const TeamActions = React.memo(({ team }: { team: TeamWithDetails }) => (
    <div className="flex flex-row justify-center sm:justify-end space-x-2">
      <button
        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-w-[40px] disabled:opacity-50"
        onClick={() => handleEditClick(team)}
        disabled={isAdding || !!editingId}
        title="Editar equipo"
      >
        <Edit size={18} />
      </button>
      <button
        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors min-w-[40px] disabled:opacity-50"
        onClick={() => handleDeleteTeam(team.id)}
        disabled={isAdding || !!editingId}
        title="Eliminar equipo"
      >
        <Trash2 size={18} />
      </button>
    </div>
  ));
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0">Equipos</h1>
          
          {/* Toggle buttons for view mode */}
          <div className="flex border rounded-lg overflow-hidden w-full sm:w-auto mb-2 sm:mb-0">
            <button
              className={cn(
                "px-3 py-2 flex-1 sm:flex-none flex items-center space-x-2 text-sm transition-colors",
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
                "px-3 py-2 flex-1 sm:flex-none flex items-center space-x-2 text-sm transition-colors",
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
          className="btn btn-primary flex items-center space-x-2 w-full sm:w-auto disabled:opacity-50"
          onClick={handleAddClick}
          disabled={!canAddTeam}
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
              <option value="">Selecciona una liga</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
          {/*
          {leagueCategories.length > 0 && (
            <div>
              <label htmlFor="categoryFilter" className="form-label">
                Categoría
              </label>
              <select
                id="categoryFilter"
                className="form-input"
                disabled
              >
                <option value="">Seleccionar categoría</option>
                {leagueCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          */}
          {categoryZones.length > 0 && (
            <div>
              <label htmlFor="zoneFilter" className="form-label">
                Zona
              </label>
              <select
                id="zoneFilter"
                className="form-input"
                disabled
              >
                <option value="">Seleccionar zona</option>
                {categoryZones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      
      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-gray-50 p-4 rounded-md mb-6 border">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label" htmlFor="name">
                  Nombre del Equipo <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={cn(
                    "form-input",
                    errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                  autoComplete="organization"
                  {...register('name', { 
                    required: 'El nombre es requerido',
                    minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                    maxLength: { value: 50, message: 'El nombre no puede tener más de 50 caracteres' }
                  })}
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
                  type="url"
                  className={cn(
                    "form-input",
                    errors.logo && "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="https://ejemplo.com/logo.png"
                  autoComplete="url"
                  {...register('logo', {
                    pattern: {
                      value: /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i,
                      message: 'Debe ser una URL válida de imagen'
                    }
                  })}
                />
                {errors.logo && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label">Liga</label>
                <div className="form-input bg-gray-100 cursor-not-allowed">
                  {leagues.find(l => l.id === selectedLeague)?.name || 'Liga no encontrada'}
                </div>
                <input 
                  type="hidden" 
                  {...register('leagueId', { required: 'La liga es requerida' })}
                  value={selectedLeague} 
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                className="btn btn-outline flex items-center space-x-2"
                onClick={handleCancelClick}
                disabled={isSubmitting}
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                <Save size={18} />
                <span>
                  {isSubmitting 
                    ? 'Guardando...' 
                    : (isAdding ? 'Crear Equipo' : 'Guardar Cambios')
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Teams List */}
      {(showAllTeams || selectedLeague) ? (
        filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map(team => (
              <div 
                key={team.id} 
                className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-3 sm:space-y-0">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-4 space-y-2 xs:space-y-0">
                      <TeamAvatar team={team} />
                      <div className="text-center xs:text-left">
                        <h3 className="font-medium text-lg break-words">{team.name}</h3>
                      </div>
                    </div>
                    <TeamActions team={team} />
                  </div>
                  
                  {/* Show team details when viewing all teams */}
                  {showAllTeams && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Liga:</strong> {team.leagueName}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showAllTeams ? 'No hay equipos' : 'No hay equipos en esta liga'}
            </h3>
            <p className="text-gray-500 mb-4">
              {showAllTeams 
                ? 'No hay equipos guardados. Haz clic en "Agregar Equipo" para crear uno.'
                : 'No hay equipos en esta liga. Haz clic en "Agregar Equipo" para crear uno.'
              }
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una liga</h3>
          <p className="text-gray-500">
            Selecciona una liga para ver y gestionar los equipos, o usa "Ver Todos" para ver todos los equipos.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;