import React, { useState, useEffect } from 'react';
import { useLeague, Standing, Team } from '../../contexts/LeagueContext';
import { Trash2, Save, Plus, X, Download, Upload, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForm } from 'react-hook-form';

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
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<number | string>(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value) {
      onUpdate(standing.id, field, tempValue);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (type === 'number') {
      const numVal = val === '' ? min : Math.max(min, Number(val));
      setTempValue(numVal);
    } else {
      setTempValue(val);
    }
  };

  return (
    <td 
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center cursor-pointer",
        isEditing && "bg-violet-50/30"
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
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
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
};

interface NewTeamFormData {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const StandingsTable: React.FC<{ zoneId: string; leagueId: string; categoryId: string }> = ({ 
  zoneId, 
  leagueId, 
  categoryId 
}) => {
  const { 
    standings, 
    updateStanding, 
    teams, 
    addTeam, 
    deleteTeam,
    updateTeam,
    getStandingsByZone,
    importStandingsFromCSV,
    createStanding
  } = useLeague();
  
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const zoneStandings = getStandingsByZone(zoneId);
  
  // DEBUG: Agregar estas líneas para verificar los datos
  console.log('Debug StandingsTable:', {
    zoneId,
    leagueId,
    categoryId,
    zoneStandings,
    allStandings: standings,
    allTeams: teams,
    teamsForZone: teams.filter(t => t.zoneId === zoneId)
  });
  
  // useEffect para crear datos de prueba si no existen
  useEffect(() => {
    // Solo para testing - crear datos de prueba si no existen
    if (zoneStandings.length === 0 && zoneId && leagueId && categoryId) {
      console.log('Creando datos de prueba...');
      
      // Crear equipos de prueba
      const testTeams = [
        { id: `test_team_1_${zoneId}`, name: 'Equipo 1', leagueId, categoryId, zoneId, logo: '' },
        { id: `test_team_2_${zoneId}`, name: 'Equipo 2', leagueId, categoryId, zoneId, logo: '' }
      ];
      
      // Crear standings de prueba
      const testStandings = [
        {
          id: `test_standing_1_${zoneId}`,
          teamId: `test_team_1_${zoneId}`,
          zoneId,
          played: 1,
          won: 1,
          drawn: 0,
          lost: 0,
          goalsFor: 2,
          goalsAgainst: 1,
          points: 3
        },
        {
          id: `test_standing_2_${zoneId}`,
          teamId: `test_team_2_${zoneId}`,
          zoneId,
          played: 1,
          won: 0,
          drawn: 0,
          lost: 1,
          goalsFor: 1,
          goalsAgainst: 2,
          points: 0
        }
      ];
      
      // Agregar a tu contexto (esto depende de cómo manejes el estado)
      testTeams.forEach(team => addTeam(team));
      if (createStanding) {
        testStandings.forEach(standing => createStanding(standing));
      }
    }
  }, [zoneId, leagueId, categoryId, zoneStandings.length, addTeam, createStanding]);
  
  // Ordenar standings por puntos (descendente)
  const sortedStandings = [...zoneStandings].sort((a, b) => {
    // Primero por puntos
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    // Luego por diferencia de goles
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    // Luego por goles a favor
    return b.goalsFor - a.goalsFor;
  });

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<NewTeamFormData>({
    defaultValues: {
      teamName: '',
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    }
  });

  // Observar valores para calcular diferencia de goles automáticamente
  const goalsFor = watch('goalsFor');
  const goalsAgainst = watch('goalsAgainst');
  const goalDifference = goalsFor - goalsAgainst;

  const handleUpdate = (id: string, field: keyof Standing | 'teamName', value: any) => {
    try {
      if (field === 'teamName') {
        // Actualizar nombre del equipo
        const standing = zoneStandings.find(s => s.id === id);
        if (standing) {
          updateTeam(standing.teamId, { name: value });
        }
      } else {
        // Validar que los valores numéricos sean válidos
        if (typeof value === 'number' && isNaN(value)) {
          console.error('Valor inválido:', value);
          return;
        }
        // Actualizar standing
        updateStanding(id, { [field]: value });
      }
      
      // Marcar fila como modificada
      setModifiedRows(prev => new Set(prev).add(id));
    } catch (error) {
      console.error('Error actualizando:', error);
    }
  };

  const handleSaveRow = (id: string) => {
    // Remover de filas modificadas
    setModifiedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSaveAll = () => {
    // Limpiar todas las filas modificadas
    setModifiedRows(new Set());
  };

  const handleDeleteTeam = async (standing: Standing) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
      try {
        setIsLoading(true);
        await deleteTeam(standing.teamId);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Error eliminando equipo:', error);
        alert('Error al eliminar el equipo. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onSubmitNewTeam = async (data: NewTeamFormData) => {
    try {
      setIsLoading(true);
      
      // Validar que los números sean consistentes
      if (data.won + data.drawn + data.lost > data.played && data.played > 0) {
        alert('La suma de partidos ganados, empatados y perdidos no puede ser mayor a los partidos jugados.');
        return;
      }
      
      // Crear nuevo equipo
      const newTeamId = `team_${Date.now()}`;
      const newTeam: Team = {
        id: newTeamId,
        name: data.teamName,
        leagueId: leagueId,
        categoryId: categoryId,
        zoneId: zoneId,
        logo: ''
      };
      
      await addTeam(newTeam);
      
      // Crear standing para el nuevo equipo si existe la función
      if (createStanding) {
        const newStanding: Omit<Standing, 'id'> = {
          teamId: newTeamId,
          zoneId: zoneId,
          pj: data.played,
          won: data.won,
          drawn: data.drawn,
          lost: data.lost,
          goalsFor: data.goalsFor,
          goalsAgainst: data.goalsAgainst,
          puntos: data.points
        };
        
        await createStanding(newStanding);
      }
      
      setIsAddingTeam(false);
      reset();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creando equipo:', error);
      alert('Error al crear el equipo. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      // Crear contenido CSV
      let csvContent = "POS,EQUIPO,PJ,G,E,P,GF,GC,DIF,PTS\n";
      
      sortedStandings.forEach((standing, index) => {
        const team = teams.find(t => t.id === standing.teamId);
        if (team) {
          csvContent += `${index + 1},"${team.name}",${standing.played},${standing.won},${standing.drawn},${standing.lost},${standing.goalsFor},${standing.goalsAgainst},${standing.goalsFor - standing.goalsAgainst},${standing.points}\n`;
        }
      });
      
      // Crear enlace de descarga
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `standings_${zoneId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando CSV:', error);
      alert('Error al exportar CSV. Inténtalo de nuevo.');
    }
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setIsLoading(true);
          const reader = new FileReader();
          reader.onload = async (event) => {
            const csvData = event.target?.result as string;
            if (csvData) {
              try {
                await importStandingsFromCSV(csvData, zoneId);
                setRefreshKey(prev => prev + 1);
                alert('CSV importado exitosamente.');
              } catch (error) {
                console.error('Error importando CSV:', error);
                alert('Error al importar CSV. Verifica el formato del archivo.');
              }
            }
          };
          reader.readAsText(file);
        } catch (error) {
          console.error('Error leyendo archivo:', error);
          alert('Error al leer el archivo. Inténtalo de nuevo.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    input.click();
  };

  return (
    <div key={refreshKey} className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-medium text-gray-900">
          Tabla de Posiciones
          {/* DEBUG: Mostrar IDs actuales */}
          <span className="text-xs text-gray-500 ml-2">
            (Zone: {zoneId}, League: {leagueId}, Category: {categoryId})
          </span>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddingTeam(true)}
            className="btn btn-sm btn-primary flex items-center space-x-1"
            disabled={isAddingTeam || isLoading}
          >
            <Plus size={16} />
            <span>Agregar Equipo</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="btn btn-sm btn-success flex items-center space-x-1"
            disabled={modifiedRows.size === 0 || isLoading}
          >
            <Save size={16} />
            <span>Guardar Todo</span>
          </button>
          <button
            onClick={handleImportCSV}
            className="btn btn-sm btn-outline flex items-center space-x-1"
            disabled={isLoading}
          >
            <Upload size={16} />
            <span>Importar CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-sm btn-outline flex items-center space-x-1"
            disabled={isLoading}
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="btn btn-sm btn-outline flex items-center"
            title="Refrescar"
            disabled={isLoading}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="p-4 text-center">
          <span className="text-gray-500">Cargando...</span>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                PJ
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                G
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                E
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                P
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                GF
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                GC
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DIF
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
            {isAddingTeam && (
              <tr className="bg-green-50/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                  {sortedStandings.length + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className={cn(
                      "form-input w-full text-sm",
                      errors.teamName && "border-red-500"
                    )}
                    placeholder="Nombre del equipo"
                    {...register('teamName', { 
                      required: 'Nombre requerido',
                      minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                    })}
                  />
                  {errors.teamName && (
                    <p className="mt-1 text-xs text-red-500">{errors.teamName.message}</p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('played', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('won', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('drawn', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('lost', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('goalsFor', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('goalsAgainst', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {goalDifference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    className="form-input w-full text-sm text-center"
                    {...register('points', { min: 0, valueAsNumber: true })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleSubmit(onSubmitNewTeam)}
                      className="text-green-600 hover:text-green-900"
                      disabled={isLoading}
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTeam(false);
                        reset();
                      }}
                      className="text-red-600 hover:text-red-900"
                      disabled={isLoading}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            
            {sortedStandings.map((standing, index) => {
              const team = teams.find(t => t.id === standing.teamId);
              const isModified = modifiedRows.has(standing.id);
              
              return (
                <tr 
                  key={standing.id} 
                  className={cn(
                    "hover:bg-gray-50",
                    isModified && "bg-yellow-50/30"
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <EditableCell 
                    value={team?.name || 'Equipo desconocido'} 
                    standing={standing} 
                    field="teamName" 
                    onUpdate={handleUpdate}
                    type="text"
                  />
                  <EditableCell value={standing.pj} standing={standing} field="played" onUpdate={handleUpdate} />
                  <EditableCell value={standing.won} standing={standing} field="won" onUpdate={handleUpdate} />
                  <EditableCell value={standing.drawn} standing={standing} field="drawn" onUpdate={handleUpdate} />
                  <EditableCell value={standing.lost} standing={standing} field="lost" onUpdate={handleUpdate} />
                  <EditableCell value={standing.goalsFor} standing={standing} field="goalsFor" onUpdate={handleUpdate} />
                  <EditableCell value={standing.goalsAgainst} standing={standing} field="goalsAgainst" onUpdate={handleUpdate} />
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {standing.goalsFor - standing.goalsAgainst}
                  </td>
                  <EditableCell value={standing.puntos} standing={standing} field="points" onUpdate={handleUpdate} />
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {isModified && (
                        <button
                          onClick={() => handleSaveRow(standing.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Confirmar cambios"
                          disabled={isLoading}
                        >
                          <Save size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTeam(standing)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar equipo"
                        disabled={isLoading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {sortedStandings.length === 0 && !isAddingTeam && (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  No hay equipos en esta zona. Agrega el primer equipo para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;