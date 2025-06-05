import React, { useState, useEffect } from 'react';
import { useLeague, Standing, Team } from '../../contexts/LeagueContext';
import { Edit, Trash2, Save, Plus, X, Download, Upload, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForm, Controller } from 'react-hook-form';

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

const StandingsTable: React.FC<{ zoneId: string }> = ({ zoneId }) => {
  const { 
    standings, 
    updateStanding, 
    teams, 
    addTeam, 
    deleteTeam,
    updateTeam,
    getStandingsByZone,
    importStandingsFromCSV
  } = useLeague();
  
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  
  const zoneStandings = getStandingsByZone(zoneId);
  
  // Ordenar standings por puntos (descendente)
  const sortedStandings = [...zoneStandings].sort((a, b) => {
    // Primero por puntos
    if (b.points !== a.points) return b.points - a.points;
    // Luego por diferencia de goles
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    // Luego por goles a favor
    return b.goalsFor - a.goalsFor;
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<NewTeamFormData>({
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

  const handleSaveRow = (id: string) => {
    // Aquí podrías implementar lógica adicional si es necesario
    setModifiedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSaveAll = () => {
    // Aquí podrías implementar lógica adicional si es necesario
    setModifiedRows(new Set());
  };

  const handleDeleteTeam = (standing: Standing) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
      deleteTeam(standing.teamId);
      setRefreshKey(prev => prev + 1);
    }
  };

  const onSubmitNewTeam = (data: NewTeamFormData) => {
    // Crear nuevo equipo
    const newTeamId = `team_${Date.now()}`;
    addTeam({
      id: newTeamId,
      name: data.teamName,
      leagueId: '', // Debes obtener estos valores del contexto
      categoryId: '', // Debes obtener estos valores del contexto
      zoneId: zoneId,
      logo: ''
    });
    
    // Crear standing para el nuevo equipo
    // Esta lógica dependerá de cómo manejas los standings en tu aplicación
    
    setIsAddingTeam(false);
    reset();
    setRefreshKey(prev => prev + 1);
  };

  const handleExportCSV = () => {
    // Crear contenido CSV
    let csvContent = "POS,EQUIPO,PJ,G,E,P,GF,GC,DIF,PTS\n";
    
    sortedStandings.forEach((standing, index) => {
      const team = teams.find(t => t.id === standing.teamId);
      if (team) {
        csvContent += `${index + 1},${team.name},${standing.played},${standing.won},${standing.drawn},${standing.lost},${standing.goalsFor},${standing.goalsAgainst},${standing.goalsFor - standing.goalsAgainst},${standing.points}\n`;
      }
    });
    
    // Crear enlace de descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `standings_${zoneId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csvData = event.target?.result as string;
          if (csvData) {
            importStandingsFromCSV(csvData, zoneId);
            setRefreshKey(prev => prev + 1);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div key={refreshKey} className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-medium text-gray-900">Tabla de Posiciones</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddingTeam(true)}
            className="btn btn-sm btn-primary flex items-center space-x-1"
            disabled={isAddingTeam}
          >
            <Plus size={16} />
            <span>Agregar Equipo</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="btn btn-sm btn-success flex items-center space-x-1"
            disabled={modifiedRows.size === 0}
          >
            <Save size={16} />
            <span>Guardar Todo</span>
          </button>
          <button
            onClick={handleImportCSV}
            className="btn btn-sm btn-outline flex items-center space-x-1"
          >
            <Upload size={16} />
            <span>Importar CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-sm btn-outline flex items-center space-x-1"
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="btn btn-sm btn-outline flex items-center"
            title="Refrescar"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
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
                    {...register('teamName', { required: true })}
                  />
                  {errors.teamName && (
                    <p className="mt-1 text-xs text-red-500">Nombre requerido</p>
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
                  0
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
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setIsAddingTeam(false)}
                      className="text-red-600 hover:text-red-900"
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
                  <EditableCell value={standing.played} standing={standing} field="played" onUpdate={handleUpdate} />
                  <EditableCell value={standing.won} standing={standing} field="won" onUpdate={handleUpdate} />
                  <EditableCell value={standing.drawn} standing={standing} field="drawn" onUpdate={handleUpdate} />
                  <EditableCell value={standing.lost} standing={standing} field="lost" onUpdate={handleUpdate} />
                  <EditableCell value={standing.goalsFor} standing={standing} field="goalsFor" onUpdate={handleUpdate} />
                  <EditableCell value={standing.goalsAgainst} standing={standing} field="goalsAgainst" onUpdate={handleUpdate} />
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {standing.goalsFor - standing.goalsAgainst}
                  </td>
                  <EditableCell value={standing.points} standing={standing} field="points" onUpdate={handleUpdate} />
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {isModified && (
                        <button
                          onClick={() => handleSaveRow(standing.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Guardar cambios"
                        >
                          <Save size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTeam(standing)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar equipo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;