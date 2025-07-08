import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLeague, Standing, Team } from '../../contexts/LeagueContext';
import { Download, Edit, Save, X, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { obtenerPosicionesPorZonaYCategoria, crearPosicion, actualizarPosicion, eliminarPosicion } from '../../lib/supabase';
import { standingsLegendService, updateEditablePositionsOrder } from '../../services/standingsLegendService';
import { useAuth } from '../../contexts/AuthContext';

type PosicionRow = {
  id: string;
  equipo_id: string;
  zona_id: string;
  liga_id: string;
  categoria_id: string;
  equipo_nombre: string;
  puntos: number;
  pj: number;
  created_at?: string;
  updated_at?: string;
};

interface EditableCellProps {
  value: number | string;
  standing: Standing;
  field: keyof Standing | 'teamName';
  onUpdate: (id: string, field: keyof Standing | 'teamName', value: any) => void;
  setEditingCell: (cell: string | null) => void;
  forceEditRowId?: string | null;
  setForceEditRowId?: (id: string | null) => void;
  type?: 'number' | 'text';
  min?: number;
}

const EditableCell: React.FC<EditableCellProps> = React.memo(({ 
  value, 
  standing, 
  field, 
  onUpdate, 
  setEditingCell,
  forceEditRowId,
  setForceEditRowId,
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

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setEditingCell(null);
    
    // Validación de datos
    let finalValue = tempValue;
    if (type === 'number') {
      if (tempValue === '' || tempValue === null || isNaN(Number(tempValue))) {
        finalValue = min;
      } else {
        const numVal = Number(tempValue);
        finalValue = numVal < min ? min : numVal;
      }
    }
    
    if (finalValue !== value) {
      onUpdate(String(standing.id), field, finalValue);
    }
  }, [tempValue, value, standing.id, field, onUpdate, type, min]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingCell(null);
      setTempValue(value);
    }
  }, [handleBlur, value, setEditingCell]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    if (type === 'number') {
      if (val === '') {
        setTempValue('');
      } else {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          setTempValue(numVal < min ? min : numVal);
        }
      }
    } else {
      setTempValue(val);
    }
  }, [type, min]);

  const handleTeamChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTeamId = e.target.value;
    onUpdate(String(standing.id), 'teamId', selectedTeamId);
    setIsEditing(false);
  }, [standing.id, onUpdate]);

  useEffect(() => {
    if (forceEditRowId === standing.id && field === 'puntos') {
      setIsEditing(true);
      setEditingCell(`${standing.id}-${field}`);
      setForceEditRowId && setForceEditRowId(null);
    }
  }, [forceEditRowId, standing.id, field, setEditingCell, setForceEditRowId]);

  return (
    <td 
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-center cursor-pointer align-middle",
        field === 'teamName' ? "text-black font-medium" : "text-gray-500",
        isEditing && "bg-violet-50/30"
      )}
      onClick={() => {
        setEditingCell(`${standing.id}-${field}`);
        !isEditing && setIsEditing(true);
      }}
    >
      {isEditing ? (
        field === 'teamName' ? (
          <select
            value={standing.teamId}
            onChange={handleTeamChange}
            className="w-full bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 py-1 px-2 text-sm text-gray-800 shadow-sm"
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
            className="w-full bg-white border border-violet-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-violet-300 py-1 px-2 text-sm text-gray-800 shadow-sm"
            autoFocus
            style={{ 
              fontSize: 'inherit',
              fontFamily: 'inherit',
              height: '2.25rem',
              minWidth: '3.5rem',
              maxWidth: '5rem',
              boxSizing: 'border-box'
            }}
          />
        )
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
});

// Extender el tipo Standing para permitir la propiedad 'orden'
type StandingWithOrder = Standing & { orden?: number };

const StandingsPage: React.FC = () => {
  const { 
    leagues, 
    teams,
    getCategoriesByLeague, 
    getZonesByCategory,
    getZonesByLeague,
    updateTeam,
    getTeamsByZone,
    addTeam,
    addStanding,
    calculateStandingsFromMatches,
    getCategoriesByZone
  } = useLeague();
  
  const { isAuthenticated, user } = useAuth();
  const [selectedLeague, setSelectedLeague] = useState<string>(leagues[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [localStandings, setLocalStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [legend, setLegend] = useState('');
  const [legendLoading, setLegendLoading] = useState(false);
  const [legendDirty, setLegendDirty] = useState(false);
  
  // Detectar tipo de liga
  const isLigaMasculina = selectedLeague === 'liga_masculina';
  const isLifufe = selectedLeague === 'lifufe';
  const isMundialito = selectedLeague === 'mundialito';
  const isCategoriaPrimero = isLifufe || isMundialito;
  
  // Get categories for selected league and zone (como en CategoriesPage)
  const filteredZones = useMemo(() => {
    if (isLigaMasculina) return getZonesByLeague(selectedLeague);
    return getZonesByCategory(selectedCategory);
  }, [selectedLeague, selectedCategory, isLigaMasculina, getZonesByLeague, getZonesByCategory]);
  
  const filteredCategories = useMemo(() => {
    if (isLigaMasculina && selectedZone) {
      return getCategoriesByZone(selectedZone);
    }
    return getCategoriesByLeague(selectedLeague);
  }, [selectedLeague, selectedZone, isLigaMasculina, getCategoriesByZone, getCategoriesByLeague]);
  
  // Get zones for selected league
  const availableZones = useMemo(() => {
    return isLigaMasculina ? getZonesByLeague(selectedLeague) : getZonesByCategory(selectedCategory);
  }, [selectedLeague, selectedCategory, isLigaMasculina, getZonesByLeague, getZonesByCategory]);
  
  // Get teams for the selected zone
  const zoneTeams = useMemo(() => selectedZone ? getTeamsByZone(selectedZone) : [], [selectedZone, getTeamsByZone]);

  // Selector de equipo para agregar a la tabla de posiciones
  // Solo mostrar equipos de la zona seleccionada si es liga_masculina
  const availableTeamsForStanding = useMemo(() => {
    if (isLigaMasculina && selectedZone) {
      return getTeamsByZone(selectedZone);
    }
    // Para otras ligas, lógica anterior (puedes ajustar si es necesario)
    return teams;
  }, [isLigaMasculina, selectedZone, getTeamsByZone, teams]);
  
  // Función para validar datos - SIMPLIFICADA
  const validateStandingData = useCallback((standing: Standing): boolean => {
    console.log('🔍 Validando standing:', standing);
    
    if (!standing || !standing.id) {
      console.warn('❌ Standing sin ID');
      return false;
    }
    
    if (!standing.teamId || !standing.zoneId) {
      console.warn('❌ Standing sin teamId o zoneId');
      return false;
    }
    
    // ✅ Validación más permisiva - permitir 0 y valores válidos
    const puntos = Number(standing.puntos);
    const pj = Number(standing.pj);
    
    if (isNaN(puntos) || puntos < 0) {
      console.warn('❌ Puntos inválidos:', standing.puntos);
      return false;
    }
    
    if (isNaN(pj) || pj < 0) {
      console.warn('❌ PJ inválidos:', standing.pj);
      return false;
    }
    
    console.log('✅ Validación exitosa');
    return true;
  }, []);
  
  // Extrae loadStandings fuera del useEffect
  const loadStandings = useCallback(async () => {
    if (!selectedZone || !selectedCategory) {
      setLocalStandings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Trae standings solo de la zona y categoría seleccionada
      const posiciones = await obtenerPosicionesPorZonaYCategoria(selectedZone, selectedCategory);
      const standingsData = posiciones.map(pos => ({
        id: `${pos.equipo_id}-${pos.zona_id}-${pos.categoria_id}`,
        teamId: pos.equipo_id,
        leagueId: selectedLeague,
        categoryId: String(pos.categoria_id),
        zoneId: pos.zona_id,
        puntos: pos.puntos || 0,
        pj: pos.pj || 0,
        orden: typeof pos.orden === 'number' ? pos.orden : 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
      }));
      setLocalStandings(standingsData);
    } catch (error) {
      setError('Error al cargar las posiciones.');
      setLocalStandings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, selectedCategory, selectedLeague]);

  // useEffect para cargar standings al cambiar zona/categoría
  useEffect(() => {
    loadStandings();
  }, [selectedZone, selectedCategory, selectedLeague]);
  
  // Create standings for teams that don't have them yet - MEJORADA
  const completeStandings = useMemo(() => {
    if (!selectedZone || zoneTeams.length === 0) return [];
    const seenTeams = new Set();
    const standingsMap = new Map(localStandings.map(s => [s.teamId, s]));
    const result = zoneTeams
      .filter(team => team && team.id)
      .map(team => {
        if (seenTeams.has(team.id)) return null;
        seenTeams.add(team.id);
        const existingStanding = standingsMap.get(team.id);
        if (existingStanding) {
          return existingStanding;
        }
        return {
          id: `temp-${team.id}`,
          teamId: team.id,
          leagueId: team.leagueId || selectedLeague,
          categoryId: team.categoryId || selectedCategory,
          zoneId: team.zoneId || selectedZone,
          puntos: 0,
          pj: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0
        };
      })
      .filter((s): s is Standing => !!s); // Filtra nulls
    return result;
  }, [selectedZone, zoneTeams, localStandings, selectedLeague, selectedCategory]);
  
  // Ordenar standings solo por puntos de mayor a menor
  const sortedStandings = [...localStandings].sort((a, b) => {
    const aPuntos = typeof a.puntos === 'number' ? a.puntos : parseInt(a.puntos) || 0;
    const bPuntos = typeof b.puntos === 'number' ? b.puntos : parseInt(b.puntos) || 0;
    return bPuntos - aPuntos;
  });
  
  // Handlers de cambio de filtros
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLeague(e.target.value);
    setSelectedZone('');
    setSelectedCategory('');
    setModifiedRows(new Set());
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedZone(e.target.value);
    setModifiedRows(new Set());
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setModifiedRows(new Set());
  };
  
  // Get team name by ID
  const getTeamName = useCallback((teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  }, [teams]);
  
  // Estado para saber si hay cambios de orden no guardados
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);

  // getOrderedStandings debe ir antes de cualquier uso
  const getOrderedStandings = (): StandingWithOrder[] => {
    // Usar 0 si orden es undefined
    const allOrden = sortedStandings.map(s => s.orden ?? 0);
    // Solo usar el campo 'orden' si hay algún valor realmente distinto Y el usuario guardó el orden manual
    const hayOrdenManual = allOrden.some((v, _, arr) => v !== arr[0]) && orderDirty === false;
    if (hayOrdenManual) {
      // Ordenar por orden manual, luego puntos
      return [...(sortedStandings as StandingWithOrder[])]
        .sort((a, b) => {
          const ordenA = a.orden ?? 0;
          const ordenB = b.orden ?? 0;
          if (ordenA !== ordenB) {
            return ordenA - ordenB;
          }
          return Number(b.puntos) - Number(a.puntos);
        });
    }
    // Si no hay orden manual, ordenar solo por puntos (y criterios secundarios)
    return [...(sortedStandings as StandingWithOrder[])]
      .sort((a, b) => {
        if (Number(b.puntos) !== Number(a.puntos)) {
          return Number(b.puntos) - Number(a.puntos);
        }
        // Si puntos iguales, diferencia de gol
        const aDiff = Number(a.goalsFor) - Number(a.goalsAgainst);
        const bDiff = Number(b.goalsFor) - Number(b.goalsAgainst);
        if (bDiff !== aDiff) return bDiff - aDiff;
        // Si igual, goles a favor
        return Number(b.goalsFor) - Number(a.goalsFor);
      });
  };
  const [manualOrder, setManualOrder] = useState<StandingWithOrder[]>(getOrderedStandings());

  // 2. Funciones para mover arriba/abajo
  const moveStanding = (index: number, direction: 'up' | 'down') => {
    setManualOrder(prev => {
      const newOrder: StandingWithOrder[] = [...prev];
      if (direction === 'up' && index > 0) {
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      // Actualizar campo 'orden'
      return newOrder.map((s, idx) => ({ ...s, orden: idx }));
    });
  };

  // Guardar el orden en Supabase
  const handleSaveOrder = async () => {
    setSavingOrder(true);
    setOrderSaved(false);
    const payload = manualOrder
      .filter(s => !!s.teamId && !!s.zoneId && !!s.categoryId)
      .map((s, idx) => ({
        equipo_id: Number(s.teamId),
        zona_id: Number(s.zoneId),
        categoria_id: Number(s.categoryId),
        orden: typeof s.orden === 'number' ? s.orden : idx
      }));
    // Log detallado para depuración
    console.log('Payload a actualizar:', JSON.stringify(payload, null, 2));
    if (payload.length === 0) {
      alert('No hay datos válidos para guardar el orden.');
      setSavingOrder(false);
      return;
    }
    try {
      await updateEditablePositionsOrder(payload);
      setOrderDirty(false);
      setOrderSaved(true);
      await loadStandings(); // Recargar standings desde Supabase
      alert('¡Orden guardado en Supabase!');
    } catch (e) {
      alert('Error al guardar el orden');
      console.error('Error al guardar el orden en Supabase:', e);
    } finally {
      setSavingOrder(false);
    }
  };

  // Función para manejar actualizaciones - CORREGIDA
  const handleUpdate = useCallback((id: string, field: keyof Standing | 'teamName', value: any) => {
    console.log('🔄 Actualizando:', { id, field, value, type: typeof value });
    
    // Validar que el ID no sea inválido
    if (!id || id === 'undefined') {
      console.error('❌ ID inválido para actualización:', id);
      setError('Error: ID de equipo inválido');
      return;
    }
    
    if (field === 'teamName') {
      const standing = completeStandings.find(s => s.id === id);
      if (standing) {
        updateTeam(standing.teamId, { name: value });
      }
    } else {
      // Convertir valores numéricos correctamente
      let processedValue = value;
      if (field === 'puntos' || field === 'pj') {
        processedValue = Number(value) || 0;
        console.log('📊 Valor numérico procesado:', { field, original: value, processed: processedValue });
      }
      
      // Actualizar estado local
      setLocalStandings(prev => {
        return prev.map(standing => {
          if (standing.id === id) {
            const updated = { ...standing, [field]: processedValue };
            console.log('✅ Standing actualizado localmente:', updated);
            return updated;
          }
          return standing;
        });
      });
    }
    
    // Marcar fila como modificada
    setModifiedRows(prev => {
      const newSet = new Set(prev).add(id);
      console.log('📝 Filas modificadas:', Array.from(newSet));
      return newSet;
    });
    // Actualizar manualOrder para reflejar el nuevo orden
    setManualOrder(getOrderedStandings());
  }, [completeStandings, updateTeam, getOrderedStandings]);
  
  // Función para guardar una fila - ACTUALIZADA para el nuevo esquema
  const handleSaveRow = useCallback(async (standing: Standing) => {
    forceAllRowsBlur();
    if (editingCell !== null) {
      setTimeout(() => handleSaveRow(standing), 0);
      return;
    }
    const currentStanding = completeStandings.find(s => s.id === standing.id);
    if (!currentStanding) {
      setError('Error: No se encontraron los datos actualizados.');
      return;
    }
    const standingToSave = {
      ...currentStanding,
      leagueId: selectedLeague,
      categoryId: selectedCategory,
      zoneId: selectedZone
    };
    if (!validateStandingData(standingToSave)) {
      setError('Datos inválidos. Verifica puntos y partidos jugados.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const teamName = getTeamName(standingToSave.teamId);
      if (String(standingToSave.id).startsWith('temp-')) {
        // Crear nueva posición con categoria_id y valores editados
        const posicionData = {
          equipo_id: standingToSave.teamId,
          zona_id: standingToSave.zoneId,
          categoria_id: standingToSave.categoryId,
          equipo_nombre: teamName,
          puntos: Number(standingToSave.puntos) ?? 0,
          pj: Number(standingToSave.pj) ?? 0
        };
        const result = await crearPosicion(posicionData);
        if (!result || !result[0]) {
          throw new Error('No se recibió respuesta válida de la base de datos');
        }
        const newId = `${standingToSave.teamId}-${standingToSave.zoneId}-${standingToSave.categoryId}`;
        setLocalStandings(prev => {
          return prev.map(s =>
            s.id === standingToSave.id
              ? { ...standingToSave, id: newId }
              : s
          );
        });
        await loadStandings();
      } else {
        // Actualizar posición existente usando los tres IDs
        const updateData = {
          equipo_nombre: teamName,
          puntos: Number(standingToSave.puntos) ?? 0,
          pj: Number(standingToSave.pj) ?? 0
        };
        await actualizarPosicion(
          standingToSave.teamId,
          standingToSave.zoneId,
          standingToSave.categoryId,
          updateData
        );
        await loadStandings();
      }
      setModifiedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(String(standing.id));
        return newSet;
      });
      setError(null);
      // Actualizar manualOrder para reflejar el nuevo orden
      setManualOrder(getOrderedStandings());
    } catch (error) {
      setError(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [completeStandings, validateStandingData, getTeamName, selectedLeague, selectedCategory, selectedZone, loadStandings, getOrderedStandings]);
  
  // Forzar blur de todos los inputs editables antes de guardar todo
  const forceAllRowsBlur = () => {
    const allInputs = document.querySelectorAll<HTMLInputElement>('input[data-row-id]');
    allInputs.forEach(input => input.blur());
  };

  // Cargar leyenda al cambiar zona/categoría
  useEffect(() => {
    if (!selectedZone || !selectedCategory) return;
    setLegendLoading(true);
    standingsLegendService.getLegend(selectedZone, selectedCategory)
      .then(data => setLegend(data?.leyenda || ''))
      .finally(() => setLegendLoading(false));
    setLegendDirty(false);
  }, [selectedZone, selectedCategory]);

  // Guardar leyenda
  const handleSaveLegend = async () => {
    setLegendLoading(true);
    await standingsLegendService.upsertLegend(selectedZone, selectedCategory, legend);
    setLegendDirty(false);
    setLegendLoading(false);
  };

  // Modificar handleSaveAll para guardar la leyenda si está dirty
  const handleSaveAllWithLegend = useCallback(async () => {
    forceAllRowsBlur();
    if (editingCell !== null) {
      setTimeout(() => handleSaveAllWithLegend(), 0);
      return;
    }
    if (legendDirty) {
      await handleSaveLegend();
    }
    await handleSaveAll(); // Llama a la función real de guardado, no a sí misma
  }, [legendDirty, handleSaveLegend, editingCell]);

  // Función real de guardado de standings
  const handleSaveAll = useCallback(async () => {
    setLoading(true);
    try {
      // Guardar todos los standings modificados
      for (const id of modifiedRows) {
        const standing = localStandings.find(s => s.id === id);
        if (!standing) continue;
        await actualizarPosicion(
          standing.teamId,
          standing.zoneId,
          standing.categoryId,
          {
            puntos: Number(standing.puntos) || 0,
            pj: Number(standing.pj) || 0,
            // Agrega aquí otros campos si tu función los soporta
          }
        );
      }
      setModifiedRows(new Set());
      await loadStandings();
    } catch (error) {
      setError('Error al guardar los cambios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [modifiedRows, localStandings, loadStandings]);

  // Recalculate standings from matches
  const handleRecalculateStandings = useCallback(() => {
    if (selectedZone) {
      try {
        calculateStandingsFromMatches(selectedZone);
        setError(null);
      } catch (error) {
        setError('Error al recalcular posiciones.');
      }
    }
  }, [selectedZone, calculateStandingsFromMatches]);
  
  // Export standings to CSV
  const exportToCSV = useCallback(() => {
    if (sortedStandings.length === 0) {
      setError('No hay datos para exportar.');
      return;
    }
    
    try {
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
          standing.pj,
          standing.puntos
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
      
      setError(null);
    } catch (error) {
      setError('Error al exportar datos.');
    }
  }, [sortedStandings, getTeamName, selectedLeague, selectedCategory, selectedZone]);
  
  // Get teams that are not already in standings - CORREGIDA dependencias
  useEffect(() => {
    if (selectedZone) {
      const teamsInStandings = new Set(localStandings.map(s => s.teamId));
      const availableZoneTeams = zoneTeams.filter(team => !teamsInStandings.has(team.id));
      
      setAvailableTeams(availableZoneTeams);
      
      if (availableZoneTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(availableZoneTeams[0].id);
      } else if (availableZoneTeams.length === 0) {
        setSelectedTeamId('');
      }
    } else {
      setAvailableTeams([]);
      setSelectedTeamId('');
    }
  }, [selectedZone, localStandings, zoneTeams, selectedTeamId]);
  
  // 5. DEPURACIÓN: Agregar useEffect para monitorear cambios 
  useEffect(() => { 
    console.log(' Estado actual:'); 
    console.log('- selectedZone:', selectedZone); 
    console.log('- localStandings:', localStandings); 
    console.log('- completeStandings:', completeStandings); 
    console.log('- modifiedRows:', Array.from(modifiedRows)); 
  }, [selectedZone, localStandings, completeStandings, modifiedRows]); 
  
  // 6. VERIFICAR que las funciones de Supabase estén bien importadas 
  // Agregar logging en las funciones de Supabase para depuración 
  const testSupabaseFunctions = useCallback(async () => { 
    try { 
      console.log('🧪 Probando funciones de Supabase...'); 
      console.log('- crearPosicion:', typeof crearPosicion); 
      console.log('- actualizarPosicion:', typeof actualizarPosicion); 
      
      // Solo para depuración - no ejecutar en producción 
      if (process.env.NODE_ENV === 'development') { 
        // Puedes descomentar esto para probar 
        // const testData = { 
        //   equipo_id: 'test', 
        //   zona_id: selectedZone, 
        //   liga_id: selectedLeague, 
        //   categoria_id: selectedCategory, 
        //   puntos: 0, 
        //   pj: 0 
        // }; 
        // console.log('Test data que se enviaría:', testData); 
      } 
    } catch (error) { 
      console.error('❌ Error probando Supabase:', error); 
    } 
  }, []);
  
  // Ejecutar test una vez al montar 
  useEffect(() => { 
    testSupabaseFunctions(); 
  }, []);
  
  // Al agregar un equipo, solo agregarlo al estado local con id temporal, sin forzar edición
  const handleAddExistingTeam = useCallback(async () => {
    if (!selectedTeamId || !selectedZone || !selectedCategory) return;
    const alreadyExists = localStandings.some(
      s => s.teamId === selectedTeamId &&
          String(s.zoneId) === String(selectedZone) &&
          String(s.categoryId) === String(selectedCategory)
    );
    if (alreadyExists) {
      setError('Ese equipo ya está en la zona y categoría seleccionada.');
      return;
    }
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return;
    setLoading(true);
    setError(null);
    try {
      const newStanding: any = {
        id: `temp-${Date.now()}`,
        teamId: team.id,
        leagueId: selectedLeague,
        categoryId: selectedCategory,
        zoneId: selectedZone,
        puntos: 0,
        pj: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        equipo_nombre: team.name
      };
      setLocalStandings(prev => [...prev, newStanding]);
      addStanding(newStanding);
      setIsAddingTeam(false);
      setSelectedTeamId('');
    } catch (error) {
      console.error('Error agregando equipo:', error);
      setError('Error al agregar el equipo.');
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, selectedZone, selectedCategory, localStandings, teams, selectedLeague, addStanding]);

  const onSubmitNewTeam = useCallback(async (data: any) => {
    if (!data.teamName || !selectedLeague || !selectedCategory || !selectedZone) {
      setError('Faltan datos requeridos para crear el equipo.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: data.teamName,
        leagueId: selectedLeague,
        categoryId: selectedCategory,
        zoneId: selectedZone
      };
      await addTeam(newTeam);
      const newStanding: any = {
        id: `temp-${Date.now()}`,
        teamId: newTeam.id,
        leagueId: selectedLeague,
        categoryId: selectedCategory,
        zoneId: selectedZone,
        puntos: 0,
        pj: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        equipo_nombre: newTeam.name
      };
      setLocalStandings(prev => [...prev, newStanding]);
      addStanding(newStanding);
      setIsAddingTeam(false);
    } catch (error) {
      console.error('Error creando equipo:', error);
      setError('Error al crear el equipo.');
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, selectedCategory, selectedZone, addTeam, addStanding]);

  // Handler para eliminar posición/standing
  const handleDeletePosition = async (standing: Standing) => {
    console.log('Intentando eliminar standing:', standing);
    // Si el ID es temporal, solo eliminar del estado local
    if (typeof standing.id === 'string' && standing.id.startsWith('temp-')) {
      setLocalStandings(prev => prev.filter(p => p.id !== standing.id));
      return;
    }
    // Si el ID es numérico o string convertible a número, intenta eliminar en Supabase
    try {
      const result = await eliminarPosicion(standing.id);
      if (result) {
        setLocalStandings(prev => prev.filter(s => s.id !== standing.id));
        setModifiedRows(prev => {
          const newSet = new Set(prev);
          if (String(standing.id)) newSet.delete(String(standing.id));
          return newSet;
        });
        setError(null);
        // Refresca standings si tienes función para ello
        if (typeof loadStandings === 'function') await loadStandings();
      } else {
        setError('No se pudo eliminar la posición en la base de datos.');
      }
    } catch (error) {
      setError(`Error al eliminar la posición: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  // Filtrado de equipos y standings
  const filteredEquipos = useMemo(() => {
    if (isMundialito) {
      // Mostrar todos los equipos de la categoría seleccionada, sin importar la zona
      const result = teams.filter(
        e => String(e.leagueId) === String(selectedLeague) &&
             String(e.categoryId) === String(selectedCategory)
      );
      if (selectedCategory) {
        console.log('🔎 filteredEquipos (mundialito):', {
          selectedLeague,
          selectedCategory,
          equiposFiltrados: result.map(e => ({
            id: e.id,
            name: e.name,
            leagueId: e.leagueId,
            categoryId: e.categoryId,
            zoneId: e.zoneId
          }))
        });
      }
      return result;
    } else {
      // Filtro normal por zona
      const result = teams.filter(
        e => String(e.zoneId) === String(selectedZone)
      );
      if (selectedZone) {
        console.log('🔎 filteredEquipos:', {
          selectedLeague,
          selectedZone,
          selectedCategory,
          equiposFiltrados: result.map(e => ({
            id: e.id,
            name: e.name,
            leagueId: e.leagueId,
            categoryId: e.categoryId,
            zoneId: e.zoneId
          }))
        });
      }
      return result;
    }
  }, [teams, selectedLeague, selectedCategory, selectedZone, isMundialito]);

  const filteredStandings = useMemo(() => {
    return localStandings.filter(
      s => String(s.leagueId) === String(selectedLeague) &&
          String(s.zoneId) === String(selectedZone) &&
          String(s.categoryId) === String(selectedCategory)
    );
  }, [localStandings, selectedLeague, selectedZone, selectedCategory]);
  
  // Optimistic update para standings
  const optimisticUpdateStanding = (id: string, data: Partial<Standing>) => {
    setLocalStandings(prev => prev.map(s =>
      s.id === id
        ? { ...s, ...data, zoneId: selectedZone, categoryId: selectedCategory, leagueId: selectedLeague }
        : s
    ));
    setModifiedRows(prev => new Set(prev).add(id));
  };

  // Al crear un nuevo standing, asegúrate de setear zona y categoría
  const handleAddStanding = (newStandingData: any) => {
    const newStanding = {
      ...newStandingData,
      zoneId: selectedZone,
      categoryId: selectedCategory,
      leagueId: selectedLeague
    };
    addStanding(newStanding);
  };
  
  // 2. Limpieza robusta al cambiar filtros
  useEffect(() => {
    setLocalStandings([]);
    setAvailableTeams([]);
    setSelectedTeamId('');
    setModifiedRows(new Set());
  }, [selectedZone, selectedLeague, selectedCategory]);

  // 5. Si no hay equipos, muestra mensaje apropiado
  // ... en el render, debajo de la tabla ...
  {filteredEquipos.length === 0 && selectedZone && (
    <div className="text-center text-gray-500 py-8">No hay equipos para esta combinación de liga, zona y categoría.</div>
  )}
  
  // 3. En el render, muestra solo standings únicos por teamId
  const uniqueStandings = useMemo(() => {
    const seen = new Set();
    const uniques = [];
    for (const s of sortedStandings.filter((s): s is Standing => !!s)) {
      if (!seen.has(s.teamId)) {
        uniques.push(s);
        seen.add(s.teamId);
      }
    }
    return uniques;
  }, [sortedStandings]);
  
  // Al cambiar zona o categoría, limpia la tabla si no hay datos
  useEffect(() => {
    if (!selectedZone || !selectedCategory) {
      setLocalStandings([]);
    }
  }, [selectedZone, selectedCategory]);
  
  // Cuando cambia la zona, actualizar la categoría seleccionada (solo para Liga Participando)
  useEffect(() => {
    if (isLigaMasculina && selectedZone) {
      const cats = getCategoriesByZone(selectedZone);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      } else {
        setSelectedCategory('');
      }
    }
  }, [selectedZone, isLigaMasculina, getCategoriesByZone]);

  // Cuando cambia la liga o la categoría (para otras ligas), actualizar la zona seleccionada
  useEffect(() => {
    if (!isLigaMasculina && selectedCategory) {
      const zs = getZonesByCategory(selectedCategory);
      if (zs.length > 0) {
        setSelectedZone(zs[0].id);
      } else {
        setSelectedZone('');
      }
    }
  }, [selectedCategory, isLigaMasculina, getZonesByCategory]);
  
  // Opciones para selects con placeholder
  const zoneOptions = useMemo(() => (
    availableZones.length > 0
      ? [{ id: '', name: 'Seleccionar zona' }, ...availableZones]
      : [{ id: '', name: 'No hay zonas' }]
  ), [availableZones]);

  const categoryOptions = useMemo(() => (
    filteredCategories.length > 0
      ? [{ id: '', name: 'Seleccionar categoría' }, ...filteredCategories]
      : [{ id: '', name: 'No hay categorías' }]
  ), [filteredCategories]);

  // Validación para habilitar guardado
  const canSave = !!selectedZone && !!selectedCategory && modifiedRows.size > 0 && !loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full mx-0 px-0 max-w-[1400px] mx-auto py-6 lg:py-8">
        {/* Header mejorado */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  Tabla de Posiciones
                </h1>
                <p className="text-violet-100 text-sm lg:text-base">
                  Gestiona las posiciones de los equipos en cada zona
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Sistema Activo
                </div>
              </div>
            </div>
          </div>

          <div className="px-0 py-0 md:px-6 md:py-8">
            {/* Filtros mejorados con diseño de tarjetas */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-violet-500 rounded-full mr-3"></div>
                Filtros de Búsqueda
              </h2>
              <div className="flex flex-wrap gap-4 mb-6 items-end">
                <div>
                  <label className="form-label">Liga</label>
                  <select
                    value={selectedLeague}
                    onChange={handleLeagueChange}
                    className="form-input"
                    disabled={loading}
                  >
                    {leagues.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                {isCategoriaPrimero ? (
                  <>
                    <div>
                      <label className="form-label">Categoría</label>
                      <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="form-input"
                        disabled={loading || categoryOptions.length <= 1}
                      >
                        {categoryOptions.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Zona</label>
                      <select
                        value={selectedZone}
                        onChange={handleZoneChange}
                        className="form-input"
                        disabled={loading || zoneOptions.length <= 1}
                      >
                        {zoneOptions.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="form-label">Zona</label>
                      <select
                        value={selectedZone}
                        onChange={handleZoneChange}
                        className="form-input"
                        disabled={loading || zoneOptions.length <= 1}
                      >
                        {zoneOptions.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Categoría</label>
                      <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="form-input"
                        disabled={loading || categoryOptions.length <= 1}
                      >
                        {categoryOptions.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleSaveAllWithLegend}
                    disabled={!canSave || editingCell !== null}
                    className={cn(
                      'btn btn-primary',
                      (!canSave || editingCell !== null) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Todo
                    {modifiedRows.size > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {modifiedRows.size}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Campo de leyenda editable */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-6 pb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0 sm:mr-2 whitespace-nowrap">
                📝 Leyenda de la Tabla de Posiciones
              </label>
              {isAuthenticated && user?.username === 'admin' ? (
                <div className="flex items-center gap-2 w-full max-w-lg">
                  <input
                    type="text"
                    className="form-input w-full max-w-xs text-sm rounded-lg shadow-sm border-gray-300 focus:border-violet-400 focus:ring-violet-300"
                    value={legend}
                    onChange={e => { setLegend(e.target.value); setLegendDirty(true); }}
                    disabled={legendLoading}
                    placeholder="Ej: Clausura 2024 - Zona 1 Sub 17/18"
                  />
                  {legendDirty && (
                    <button
                      className="btn btn-xs btn-success flex items-center"
                      onClick={handleSaveLegend}
                      disabled={legendLoading}
                      title="Guardar leyenda"
                    >
                      <Save size={14} />
                    </button>
                  )}
                  {legendDirty && (
                    <button
                      className="btn btn-xs btn-outline flex items-center"
                      onClick={() => { setLegendDirty(false); setLegend(legend); }}
                      disabled={legendLoading}
                      title="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2 sm:mt-0 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center space-x-2 w-full max-w-xs">
                  <span className="text-sm font-medium text-blue-800">{legend || <span className="text-gray-400">Agregar leyenda</span>}</span>
                </div>
              )}
            </div>

            {/* Mensajes de estado mejorados */}
            {loading && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-blue-800 font-medium">Cargando datos...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-red-500 mr-3">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* En el render, antes de mostrar la tabla de posiciones y el botón de agregar equipo: */}
            {isLigaMasculina && selectedZone && !selectedCategory && (
              <div className="text-center text-red-500 font-semibold my-4">
                Debes seleccionar una categoría para ver la tabla de posiciones.
              </div>
            )}

            {/* Deshabilita la tabla y el botón de agregar equipo si no hay categoría seleccionada en Liga Participando */}
            {(!isLigaMasculina || (isLigaMasculina && selectedCategory)) && selectedZone && (
              <div className="space-y-6">
                {/* Barra de acciones mejorada */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveAllWithLegend}
                      disabled={!canSave || editingCell !== null}
                      className={cn(
                        "inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105",
                        (!canSave || editingCell !== null) && "text-gray-400 bg-gray-200 cursor-not-allowed"
                      )}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </button>
                    
                    <button
                      onClick={handleRecalculateStandings}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2.5 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Recalcular
                    </button>
                    
                    <button
                      onClick={exportToCSV}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2.5 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsAddingTeam(true)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Equipo
                  </button>
                </div>

                {/* Tabla tradicional para desktop */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 text-xs font-bold mr-2">
                              #
                            </span>
                            Posición
                          </div>
                        </th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider align-middle">
                          EQUIPO
                        </th>
                        <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">PJ</th>
                        <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">PTS</th>
                        <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {completeStandings.map((standing: Standing, index: number) => (
                        <tr 
                          key={standing.id} 
                          className={cn(
                            "hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all duration-200",
                            modifiedRows.has(String(standing.id)) && "bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400",
                            index < 3 && "bg-gradient-to-r from-green-50 to-emerald-50"
                          )}
                        >
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3",
                                index === 0 && "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg",
                                index === 1 && "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg",
                                index === 2 && "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg",
                                index > 2 && "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700"
                              )}>
                                {index + 1}
                              </div>
                              {index < 3 && (
                                <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                  Top {index + 1}
                                </div>
                              )}
                            </div>
                          </td>
                          <EditableCell
                            value={getTeamName(standing.teamId)}
                            standing={standing}
                            field="teamName"
                            onUpdate={handleUpdate}
                            setEditingCell={setEditingCell}
                          />
                          <EditableCell
                            value={standing.pj}
                            standing={standing}
                            field="pj"
                            onUpdate={handleUpdate}
                            setEditingCell={setEditingCell}
                          />
                          <EditableCell
                            value={standing.puntos}
                            standing={standing}
                            field="puntos"
                            onUpdate={handleUpdate}
                            setEditingCell={setEditingCell}
                          />
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                              {/* Flechas de orden */}
                              <button onClick={() => moveStanding(index, 'up')} disabled={index === 0} title="Subir" className="text-gray-500 hover:text-violet-600 disabled:opacity-30"><span>▲</span></button>
                              <button onClick={() => moveStanding(index, 'down')} disabled={index === completeStandings.length - 1} title="Bajar" className="text-gray-500 hover:text-violet-600 disabled:opacity-30"><span>▼</span></button>
                              <button
                                onClick={() => handleSaveRow(standing)}
                                disabled={loading || !modifiedRows.has(String(standing.id))}
                                title={modifiedRows.has(String(standing.id)) ? "Guardar cambios" : "No hay cambios para guardar"}
                                className={cn(
                                  "inline-flex items-center p-2.5 border border-transparent rounded-lg text-xs transition-all duration-200 transform hover:scale-110",
                                  modifiedRows.has(String(standing.id)) && !loading
                                    ? "text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                                    : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                )}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePosition(standing)}
                                disabled={loading}
                                title="Eliminar de las posiciones"
                                className="inline-flex items-center p-2.5 border border-transparent rounded-lg text-xs text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Vista tipo lista para mobile */}
                <div className="md:hidden space-y-3 p-0">
                  {completeStandings.map((standing: Standing, idx: number) => (
                    <div
                      key={standing.id}
                      className={
                        'flex flex-col rounded-lg p-3 border w-full mx-0 ' +
                        (modifiedRows.has(String(standing.id))
                          ? 'bg-yellow-50 border-yellow-200'
                          : idx < 3
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200')
                      }
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg">{idx + 1}</span>
                          {idx < 3 && (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Top {idx + 1}</span>
                          )}
                        </div>
                        <div className="flex flex-row gap-3">
                          {/* Flechas de orden */}
                          <button onClick={() => moveStanding(idx, 'up')} disabled={idx === 0} title="Subir" className="text-gray-500 hover:text-violet-600 disabled:opacity-30"><span>▲</span></button>
                          <button onClick={() => moveStanding(idx, 'down')} disabled={idx === completeStandings.length - 1} title="Bajar" className="text-gray-500 hover:text-violet-600 disabled:opacity-30"><span>▼</span></button>
                          <button
                            onClick={() => handleSaveRow(standing)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                            disabled={loading}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePosition(standing)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                            disabled={loading}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <div className="text-base font-semibold text-gray-900">{getTeamName(standing.teamId)}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">PJ: {standing.pj}</span>
                          <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-xs font-semibold">PTS: {standing.puntos}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {completeStandings.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                      No hay equipos en esta zona. Agrega el primer equipo para comenzar.
                    </div>
                  )}
                </div>

                {/* Botón Guardar Orden */}
                {orderDirty && completeStandings.length > 1 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleSaveOrder}
                      className="px-4 py-2 bg-violet-600 text-white rounded shadow hover:bg-violet-700 disabled:opacity-50"
                      disabled={savingOrder}
                    >
                      {savingOrder ? 'Guardando...' : 'Guardar Orden'}
                    </button>
                    {orderSaved && <span className="ml-3 text-green-600 font-medium">¡Orden guardado!</span>}
                  </div>
                )}
              </div>
            )}

            {/* Mostrar mensaje si no hay zonas/categorías */}
            {(zoneOptions.length <= 1 || categoryOptions.length <= 1) && (
              <div className="text-center py-8 text-gray-500">
                Debes seleccionar una liga, zona y categoría para ver la tabla de posiciones.
              </div>
            )}

            {/* Selector de equipo para agregar a la tabla de posiciones */}
            {isAddingTeam && (
              <div className="mb-4 flex flex-col md:flex-row md:items-end md:space-x-4">
                <div className="flex-1">
                  <label className="form-label" htmlFor="teamSelect">Equipo</label>
                  <select
                    id="teamSelect"
                    className="form-input"
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                  >
                    <option value="">Seleccionar equipo</option>
                    {availableTeamsForStanding.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary mt-2 md:mt-0"
                  onClick={() => {
                    if (selectedTeamId) {
                      handleAddStanding({
                        teamId: selectedTeamId,
                        leagueId: selectedLeague,
                        categoryId: selectedCategory,
                        zoneId: selectedZone,
                        puntos: 0,
                        pj: 0,
                        won: 0,
                        drawn: 0,
                        lost: 0,
                        goalsFor: 0,
                        goalsAgainst: 0
                      });
                      setSelectedTeamId('');
                      setIsAddingTeam(false);
                    }
                  }}
                  disabled={!selectedTeamId}
                >
                  <Plus size={18} />
                  <span>Agregar a posiciones</span>
                </button>
                <button
                  className="btn btn-outline ml-2"
                  onClick={() => {
                    setIsAddingTeam(false);
                    setSelectedTeamId('');
                  }}
                >
                  <X size={18} />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandingsPage;
