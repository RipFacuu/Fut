import React, { useState, useEffect, useMemo } from 'react';
import { useLeague, Standing, Team } from '../../contexts/LeagueContext';
import { Download, Edit, Save, X, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EditableCellProps {
  value: number | string;
  standing: Standing;
  field: keyof Standing | 'teamName';
  onUpdate: (id: string, field: keyof Standing | 'teamName', value: any) => void;
  type?: 'number' | 'text';
  min?: number;
}

const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  standing, 
  field, 
  onUpdate, 
  type = 'number',
  min = 0
}) => {
  const { getTeamsByZone } = useLeague();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<number | string>(value);
  
  // Usar useMemo para evitar recálculos innecesarios
  const zoneTeams = useMemo(() => {
    return standing ? getTeamsByZone(standing.zoneId) : [];
  }, [standing?.zoneId, getTeamsByZone]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    
    // Si el campo está vacío, establecer el valor como 0 o el mínimo especificado
    let finalValue = tempValue;
    if (type === 'number' && (tempValue === '' || tempValue === null)) {
      finalValue = min;
    }
    
    if (finalValue !== value) {
      onUpdate(standing.id, field, finalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    if (type === 'number') {
      // Permitir valores vacíos durante la edición
      if (val === '') {
        setTempValue('');
      } else {
        const numVal = Number(val);
        // Solo aplicar el mínimo si es un número válido
        if (!isNaN(numVal)) {
          setTempValue(numVal < min ? min : numVal);
        }
      }
    } else {
      setTempValue(val);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTeamId = e.target.value;
    // Actualizar directamente el equipo asociado al standing
    onUpdate(standing.id, 'teamId', selectedTeamId);
    // Cerrar el editor
    setIsEditing(false);
  };

  return (
    <td 
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-center cursor-pointer",
        field === 'teamName' ? "text-black font-medium" : "text-gray-500",
        isEditing && "bg-violet-50/30"
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        field === 'teamName' ? (
          <select
            value={standing.teamId}
            onChange={handleTeamChange}
            className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-200 py-0.5"
            autoFocus
          >
            {zoneTeams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            min={type === 'number' ? min : undefined}
            value={tempValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-violet-200 py-0.5"
            autoFocus
            style={{ 
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          />
        )
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
};

const StandingsPage: React.FC = () => {
  const { 
    leagues, 
    teams,
    standings,
    getCategoriesByLeague, 
    getZonesByCategory,
    getStandingsByZone,
    updateStanding,
    updateTeam,
    getTeamsByZone,
    addTeam,
    addStanding,
    deleteTeam,
    calculateStandingsFromMatches
  } = useLeague();
  
  const [selectedLeague, setSelectedLeague] = useState<string>(leagues[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  // Get categories for selected league
  const leagueCategories = getCategoriesByLeague(selectedLeague);
  
  // Get zones for selected category
  const categoryZones = getZonesByCategory(selectedCategory);
  
  // Get standings for the selected zone
  const zoneStandings = selectedZone ? getStandingsByZone(selectedZone) : [];
  
  // Sort standings by points (descending) and then by goal difference
  const sortedStandings = [...zoneStandings].sort((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points; // Sort by points (descending)
    }
    // If points are equal, sort by goal difference
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (aDiff !== bDiff) {
      return bDiff - aDiff;
    }
    // If goal difference is equal, sort by goals scored
    return b.goalsFor - a.goalsFor;
  });
  
  // Initialize select values
  useEffect(() => {
    if (leagueCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(leagueCategories[0].id);
    }
  }, [leagueCategories, selectedCategory]);
  
  useEffect(() => {
    if (categoryZones.length > 0 && !selectedZone) {
      setSelectedZone(categoryZones[0].id);
    }
  }, [categoryZones, selectedZone]);
  
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    setSelectedCategory('');
    setSelectedZone('');
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedZone('');
  };
  
  // Get team name by ID
  const getTeamName = (teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  };
  
  // Handle update of standing or team name
  const handleUpdate = (id: string, field: keyof Standing | 'teamName', value: any) => {
    if (field === 'teamName') {
      // Actualizar nombre del equipo
      const standing = zoneStandings.find(s => s.id === id);
      if (standing) {
        updateTeam(standing.teamId, { name: value });
      }
    } else {
      // Actualizar standing
      updateStanding(id, { [field]: value });
    }
    
    // Marcar fila como modificada
    setModifiedRows(prev => new Set(prev).add(id));
  };
  
  // Handle save of a row
  const handleSaveRow = (id: string) => {
    setModifiedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  // Handle save of all modified rows
  const handleSaveAll = () => {
    setModifiedRows(new Set());
  };

  // Recalculate standings from matches
  const handleRecalculateStandings = () => {
    if (selectedZone) {
      calculateStandingsFromMatches(selectedZone);
      alert('Posiciones recalculadas automáticamente basándose en los resultados de los partidos.');
    }
  };
  
  // Export standings to CSV
  const exportToCSV = () => {
    if (sortedStandings.length === 0) return;
    
    const headers = [
      'Posición', 'Equipo', 'PJ', 'PTS'
    ];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    sortedStandings.forEach((standing, index) => {
      const teamName = getTeamName(standing.teamId);
      
      const row = [
        index + 1,
        `"${teamName}"`, // Quote team name to handle commas
        standing.played,
        standing.points
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create a download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `posiciones_${selectedLeague}_${selectedCategory}_${selectedZone}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Get teams that are not already in standings
  useEffect(() => {
    if (selectedZone) {
      const zoneTeams = getTeamsByZone(selectedZone);
      const teamsInStandings = new Set(zoneStandings.map(s => s.teamId));
      const availableZoneTeams = zoneTeams.filter(team => !teamsInStandings.has(team.id));
      
      // Solo actualizar si realmente cambió
      setAvailableTeams(prev => {
        if (JSON.stringify(prev.map(t => t.id)) !== JSON.stringify(availableZoneTeams.map(t => t.id))) {
          return availableZoneTeams;
        }
        return prev;
      });
      
      if (availableZoneTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(availableZoneTeams[0].id);
      } else if (availableZoneTeams.length === 0) {
        setSelectedTeamId('');
      }
    } else {
      setAvailableTeams([]);
      setSelectedTeamId('');
    }
  }, [selectedZone, zoneStandings, getTeamsByZone, selectedTeamId]);
  
  // Add existing team to standings
  const handleAddExistingTeam = () => {
    if (!selectedTeamId || !selectedZone) return;
    
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return;
    
    // Create new standing for the selected team
    const newStanding: Omit<Standing, 'id'> = {
      teamId: team.id,
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      zoneId: selectedZone,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };
    
    // Add standing to context
    addStanding(newStanding);
    
    // Refresh the component
    setIsAddingTeam(false);
    setSelectedTeamId('');
  };

  // Handle adding a new team
  const handleAddTeam = () => {
    setIsAddingTeam(true);
  };

  // Handle submitting a new team
  const onSubmitNewTeam = (data: any) => {
    // Crear un nuevo ID para el equipo
    const newTeamId = `team_${Date.now()}`;
    
    // Agregar el equipo
    addTeam({
      id: newTeamId,
      name: data.teamName,
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      zoneId: selectedZone,
      logo: ''
    });
    
    // Agregar el standing para el equipo
    addStanding({
      teamId: newTeamId,
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      zoneId: selectedZone,
      points: data.points || 0,
      played: data.played || 0,
      won: data.won || 0,
      drawn: data.drawn || 0,
      lost: data.lost || 0,
      goalsFor: data.goalsFor || 0,
      goalsAgainst: data.goalsAgainst || 0
    });
    
    // Cerrar el formulario
    setIsAddingTeam(false);
  };

  // Handle deleting a team
  const handleDeleteTeam = (standing: Standing) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
      deleteTeam(standing.teamId);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tabla de Posiciones</h1>
          <p className="text-gray-600 mt-1">Gestiona las posiciones de los equipos en cada zona</p>
        </div>
      </div>
      
      {/* Filtros con diseño mejorado */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="leagueFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Liga
            </label>
            <select
              id="leagueFilter"
              className="form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
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
          
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              id="categoryFilter"
              className="form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
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
            <label htmlFor="zoneFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Zona
            </label>
            <select
              id="zoneFilter"
              className="form-input w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
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
        </div>
      </div>
      
      {/* Contenido principal */}
      {selectedZone ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          {zoneStandings.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Equipos en la zona
                </h2>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveAll}
                    className="btn btn-success flex items-center space-x-2 px-4 py-2 rounded-lg"
                    disabled={modifiedRows.size === 0}
                  >
                    <Save size={16} />
                    <span>Guardar Cambios</span>
                  </button>
                  <button
                    onClick={handleRecalculateStandings}
                    className="btn btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!selectedZone}
                  >
                    <span>🔄</span>
                    <span>Recalcular Automáticamente</span>
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="btn btn-outline flex items-center space-x-2 px-4 py-2 rounded-lg"
                  >
                    <Download size={16} />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </div>
              
              {/* Tabla de posiciones */}
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pos
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PJ
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PTS
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStandings.map((standing: Standing, index) => {
                      const isModified = modifiedRows.has(standing.id);
                      
                      return (
                        <tr key={standing.id} className={cn(
                          "hover:bg-gray-50",
                          isModified && "bg-yellow-50/30"
                        )}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <EditableCell 
                            value={getTeamName(standing.teamId)} 
                            standing={standing} 
                            field="teamName" 
                            onUpdate={handleUpdate}
                            type="text"
                          />
                          <EditableCell 
                            value={standing.played} 
                            standing={standing} 
                            field="played" 
                            onUpdate={handleUpdate}
                          />
                          <EditableCell 
                            value={standing.points} 
                            standing={standing} 
                            field="points" 
                            onUpdate={handleUpdate}
                          />
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            {isModified && (
                              <button
                                onClick={() => handleSaveRow(standing.id)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Guardar cambios"
                              >
                                <Save size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-medium text-gray-900 mb-3">No hay equipos en esta zona</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Aún no hay equipos registrados en esta zona. Puedes agregar equipos haciendo clic en el botón "Agregar Equipo".
              </p>
              <button
                onClick={handleAddTeam}
                className="btn btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg mx-auto"
              >
                <Plus size={18} />
                <span>Agregar Equipo</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <h3 className="text-xl font-medium text-gray-900 mb-3">Selecciona una zona</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Para ver y gestionar la tabla de posiciones, primero selecciona una liga, categoría y zona en los filtros superiores.
          </p>
        </div>
      )}
      
      {/* Add Team Modal */}
      {isAddingTeam && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Agregar Equipo a la Tabla</h3>
            
            {availableTeams.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="form-label" htmlFor="teamSelect">
                    Seleccionar Equipo
                  </label>
                  <select
                    id="teamSelect"
                    className="form-input w-full"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                  >
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsAddingTeam(false)}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddExistingTeam}
                  >
                    Agregar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  No hay equipos disponibles para agregar a esta zona. Primero debes crear equipos en la sección de Equipos.
                </p>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsAddingTeam(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandingsPage;