import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLeague, Team } from '../../contexts/LeagueContext';
import { Download, Edit, Save, X, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  obtenerPosicionesPorZonaYCategoria,
  crearPosicion,
  actualizarPosicion,
  eliminarPosicion,
  updateEditablePositionsOrder,
} from '../../lib/supabase';
import { standingsLegendService } from '../../services/standingsLegendService';
import { useAuth } from '../../contexts/AuthContext';
import StandingsTable from './StandingsTable';

interface Standing {
  id: string;
  teamId: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  puntos: number;
  pj: number;
  orden?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  equipo_nombre?: string;
}

// ─────────────────────────────────────────────
// FIX #1: Lógica de sorting extraída una sola vez
// ─────────────────────────────────────────────
const sortStandingsArray = (standings: Standing[], teams: Team[]): Standing[] => {
  const hasManualOrder = standings.some(s => s.orden && s.orden > 0);

  return [...standings].sort((a, b) => {
    if (hasManualOrder) {
      const oA = Number(a.orden) || 0;
      const oB = Number(b.orden) || 0;
      if (oA > 0 && oB > 0) return oA - oB;
      if (oA > 0 && oB === 0) return -1;
      if (oA === 0 && oB > 0) return 1;
    }

    const bPuntos = Number(b.puntos) || 0;
    const aPuntos = Number(a.puntos) || 0;
    if (bPuntos !== aPuntos) return bPuntos - aPuntos;

    const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    if (bDiff !== aDiff) return bDiff - aDiff;

    if ((b.goalsFor || 0) !== (a.goalsFor || 0)) return (b.goalsFor || 0) - (a.goalsFor || 0);

    if ((a.pj || 0) !== (b.pj || 0)) return (a.pj || 0) - (b.pj || 0);

    const teamA = teams.find(t => t.id === a.teamId)?.name || '';
    const teamB = teams.find(t => t.id === b.teamId)?.name || '';
    return teamA.localeCompare(teamB);
  });
};

interface EditableCellProps {
  value: number | string;
  standing: Standing;
  field: keyof Standing | 'teamName';
  onUpdate: (id: string, field: keyof Standing | 'teamName', value: any) => void;
  editingCell: string | null;
  setEditingCell: (cell: string | null) => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
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
  editingCell,
  setEditingCell,
  onNavigate,
  forceEditRowId,
  setForceEditRowId,
  type = 'number',
  min = 0,
}) => {
  const { getTeamsByZone } = useLeague();
  const cellId = `${standing.id}-${field}`;
  const isEditing = editingCell === cellId;
  const [tempValue, setTempValue] = useState<number | string>(value);
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);

  const zoneTeams = useMemo(() => {
    return standing ? getTeamsByZone(standing.zoneId) : [];
  }, [standing?.zoneId, getTeamsByZone]);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleCommit = useCallback(() => {
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

  const handleBlur = useCallback(() => {
    handleCommit();
    setEditingCell(null);
  }, [handleCommit, setEditingCell]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommit();
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setTempValue(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCommit();
      if (onNavigate) onNavigate(e.shiftKey ? 'prev' : 'next');
    }
  }, [handleCommit, value, setEditingCell, onNavigate]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    if (type === 'number') {
      if (val === '') {
        setTempValue('');
      } else {
        const numVal = Number(val);
        if (!isNaN(numVal)) setTempValue(numVal < min ? min : numVal);
      }
    } else {
      setTempValue(val);
    }
  }, [type, min]);

  const handleTeamChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(String(standing.id), 'teamId', e.target.value);
    setEditingCell(null);
  }, [standing.id, onUpdate, setEditingCell]);

  useEffect(() => {
    if (forceEditRowId === standing.id && field === 'puntos') {
      setEditingCell(`${standing.id}-${field}`);
      setForceEditRowId && setForceEditRowId(null);
    }
  }, [forceEditRowId, standing.id, field, setEditingCell, setForceEditRowId]);

  return (
    <td
      className={cn(
        'px-6 py-4 whitespace-nowrap text-sm text-center cursor-pointer align-middle relative',
        field === 'teamName' ? 'text-black font-medium text-left' : 'text-gray-500',
        isEditing && 'bg-violet-50/50 outline outline-2 outline-violet-400 z-10',
      )}
      onClick={(e) => { e.stopPropagation(); setEditingCell(cellId); }}
    >
      {isEditing ? (
        field === 'teamName' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={standing.teamId}
            onChange={handleTeamChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 py-1 px-2 text-sm text-gray-800 shadow-sm"
          >
            {zoneTeams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            min={type === 'number' ? min : undefined}
            value={tempValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-white border border-violet-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-violet-300 py-1 px-2 text-sm text-gray-800 shadow-sm"
            style={{ fontSize: 'inherit', fontFamily: 'inherit', height: '2.25rem', minWidth: '3.5rem', boxSizing: 'border-box' }}
          />
        )
      ) : (
        <span className="block w-full">{value}</span>
      )}
    </td>
  );
});

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
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
    createStanding,
    calculateStandingsFromMatches,
    getCategoriesByZone,
  } = useLeague();

  const { isAuthenticated, user } = useAuth();

  const [selectedLeague, setSelectedLeague] = useState<string>(leagues[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [newTeamPj, setNewTeamPj] = useState<number>(0);
  const [newTeamPts, setNewTeamPts] = useState<number>(0);
  const [localStandings, setLocalStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [legend, setLegend] = useState('');
  const [legendLoading, setLegendLoading] = useState(false);
  const [legendDirty, setLegendDirty] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);

  // Sincronizar selectedLeague cuando se cargan las ligas por primera vez
  useEffect(() => {
    if (!selectedLeague && leagues.length > 0) {
      setSelectedLeague(leagues[0].id);
    }
  }, [leagues, selectedLeague]);

  const isLigaMasculina = selectedLeague === '1';
  const isCategoriaPrimero = !selectedLeague || !isLigaMasculina;

  // ─── Zonas ordenadas ────────────────────────
  const sortZones = (zonesList: any[]) =>
    [...zonesList].sort((a, b) => {
      const getNumber = (name: string) => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : Infinity;
      };
      const diff = getNumber(a.name) - getNumber(b.name);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

  const filteredCategories = useMemo(() => {
    console.log('🔍 StandingsPage: Calculando filteredCategories:', {
      selectedLeague,
      selectedZone,
      isLigaMasculina,
    });

    let cats = isLigaMasculina && selectedZone
      ? getCategoriesByZone(selectedZone)
      : getCategoriesByLeague(selectedLeague);

    console.log('✅ StandingsPage: Categorías filtradas:', cats);

    return [...cats].sort((a, b) => {
      const getYear = (name: string) => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const diff = getYear(a.name) - getYear(b.name);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [selectedLeague, selectedZone, isLigaMasculina, getCategoriesByZone, getCategoriesByLeague]);

  const availableZones = useMemo(() => {
    console.log('🔍 StandingsPage: Calculando availableZones:', {
      selectedLeague,
      selectedCategory,
      isLigaMasculina,
    });

    const zones = isLigaMasculina
      ? getZonesByLeague(selectedLeague)
      : getZonesByCategory(selectedCategory);

    console.log('✅ StandingsPage: Zonas disponibles:', zones);
    return sortZones(zones);
  }, [selectedLeague, selectedCategory, isLigaMasculina, getZonesByLeague, getZonesByCategory]);

  const zoneTeams = useMemo(
    () => (selectedZone ? getTeamsByZone(selectedZone) : []),
    [selectedZone, getTeamsByZone],
  );

  const availableTeamsForStanding = useMemo(
    () =>
      teams
        .filter(t => String(t.leagueId) === String(selectedLeague))
        .map(t => ({ ...t, id: String(t.id) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teams, selectedLeague],
  );

  // ─── Carga de standings ─────────────────────
  const loadStandings = useCallback(async () => {
    if (!selectedZone || !selectedCategory) {
      setLocalStandings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const posiciones = await obtenerPosicionesPorZonaYCategoria(selectedZone, selectedCategory);
      const standingsData: Standing[] = posiciones.map(pos => ({
        id: String(pos.id),
        teamId: String(pos.equipo_id),
        leagueId: selectedLeague,
        categoryId: String(pos.categoria_id),
        zoneId: String(pos.zona_id),
        puntos: Number(pos.puntos) || 0,
        pj: Number(pos.pj) || 0,
        goalsFor: 0,
        goalsAgainst: 0,
        orden: typeof pos.orden === 'number' && pos.orden > 0 ? pos.orden : undefined,
        equipo_nombre: pos.equipo_nombre || '',
      }));
      setLocalStandings(standingsData);
    } catch (err) {
      console.error('Error loading standings:', err);
      setError(`Error al cargar las posiciones: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLocalStandings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, selectedCategory, selectedLeague]);

  // FIX #2: Eliminado localStandings.length de las dependencias → ya no hay re-fetch infinito
  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  // ─── Diagnóstico ────────────────────────────
  const diagnoseDataIssue = useCallback(async () => {
    if (!selectedZone || !selectedCategory) return;
    try {
      const posiciones = await obtenerPosicionesPorZonaYCategoria(selectedZone, selectedCategory);
      console.log('Raw data from database:', posiciones);
      const teamsInZone = teams.filter(
        t => String(t.zoneId) === String(selectedZone) && String(t.categoryId) === String(selectedCategory),
      );
      console.log('Teams in zone/category:', teamsInZone);
    } catch (err) {
      console.error('Error during diagnosis:', err);
    }
  }, [selectedZone, selectedCategory, teams]);

  // ─── Standings ordenados ────────────────────
  const sortedStandings = useMemo(() => {
    const validStandings = localStandings.filter(s =>
      teams.some(t => String(t.id) === String(s.teamId)),
    );
    return sortStandingsArray(validStandings, teams);
  }, [localStandings, teams]);

  // Sin duplicados (por teamId)
  const uniqueStandings = useMemo(() => {
    const seen = new Set<string>();
    return sortedStandings.filter(s => {
      if (seen.has(s.teamId)) return false;
      seen.add(s.teamId);
      return true;
    });
  }, [sortedStandings]);

  // ─── Handlers de filtros ────────────────────
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLeagueId = e.target.value;
    setSelectedLeague(newLeagueId);
    setSelectedZone('');
    setSelectedCategory('');
    setModifiedRows(new Set());
    setLocalStandings([]);
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZoneId = e.target.value;
    setSelectedZone(newZoneId);
    
    // Si es Liga Participando (1), reseteamos la categoría
    if (isLigaMasculina) {
      setSelectedCategory('');
    }
    
    setModifiedRows(new Set());
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategoryId = e.target.value;
    setSelectedCategory(newCategoryId);
    
    // Si NO es Liga Participando, reseteamos la zona
    if (!isLigaMasculina) {
      setSelectedZone('');
    }
    
    setModifiedRows(new Set());
  };

  // FIX #3: Auto-selección de categoría y zona
  useEffect(() => {
    if (!selectedLeague) return;

    console.log('🔧 Auto-selección:');
    console.log('   selectedLeague:', selectedLeague);
    console.log('   isLigaMasculina:', isLigaMasculina);
    console.log('   selectedZone:', selectedZone);
    console.log('   selectedCategory:', selectedCategory);

    // Caso 1: Liga Participando (1): Liga → Zona → Categoría
    if (isLigaMasculina) {
      // Si no hay zona seleccionada y hay zonas disponibles
      if (!selectedZone) {
        const zones = getZonesByLeague(selectedLeague);
        console.log('   Zonas disponibles (Liga Participando):', zones);
        if (zones.length > 0) {
          setSelectedZone(zones[0].id);
          console.log('   Seleccionando zona:', zones[0].id);
        }
      } 
      // Si hay zona seleccionada y no hay categoría, auto-seleccionar
      else if (!selectedCategory) {
        const cats = getCategoriesByZone(selectedZone);
        console.log('   Categorías disponibles (zona):', cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
          console.log('   Seleccionando categoría:', cats[0].id);
        }
      }
    } 
    // Caso 2: Otras ligas: Liga → Categoría → Zona
    else {
      // Si no hay categoría seleccionada y hay categorías disponibles
      if (!selectedCategory) {
        const cats = getCategoriesByLeague(selectedLeague);
        console.log('   Categorías disponibles (liga):', cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
          console.log('   Seleccionando categoría:', cats[0].id);
        }
      } 
      // Si hay categoría seleccionada y no hay zona, auto-seleccionar
      else if (!selectedZone) {
        const zones = getZonesByCategory(selectedCategory);
        console.log('   Zonas disponibles (categoría):', zones);
        if (zones.length > 0) {
          setSelectedZone(zones[0].id);
          console.log('   Seleccionando zona:', zones[0].id);
        }
      }
    }
  }, [selectedLeague, selectedZone, selectedCategory, isLigaMasculina, getZonesByLeague, getCategoriesByZone, getCategoriesByLeague, getZonesByCategory]);

  // Limpiar tabla cuando no hay zona o categoría
  useEffect(() => {
    if (!selectedZone || !selectedCategory) {
      setLocalStandings([]);
    }
  }, [selectedZone, selectedCategory]);

  // ─── Nombre del equipo ──────────────────────
  const getTeamName = useCallback((teamId: string | number): string => {
    const team = teams.find(t => String(t.id) === String(teamId));
    return team?.name || 'Equipo desconocido';
  }, [teams]);

  // ─── Mover standings (orden manual) ────────
  const moveStanding = useCallback((index: number, direction: 'up' | 'down') => {
    setLocalStandings(prev => {
      const validStandings = prev.filter(s => teams.some(t => String(t.id) === String(s.teamId)));
      const sortedArr = sortStandingsArray(validStandings, teams);

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sortedArr.length) return prev;

      [sortedArr[index], sortedArr[newIndex]] = [sortedArr[newIndex], sortedArr[index]];

      const updatedArr = sortedArr.map((s, idx) => ({ ...s, orden: idx + 1 }));

      return prev.map(standing => {
        const updated = updatedArr.find(s => s.id === standing.id);
        return updated ? { ...standing, orden: updated.orden } : standing;
      });
    });
    setOrderDirty(true);
    setOrderSaved(false);
  }, [teams]);

  // ─── Guardar orden ──────────────────────────
  const handleSaveOrder = useCallback(async () => {
    setSavingOrder(true);
    setOrderSaved(false);

    if (localStandings.length === 0) {
      alert('No hay datos válidos para guardar el orden.');
      setSavingOrder(false);
      return;
    }

    try {
      const validStandings = localStandings.filter(s =>
        teams.some(t => String(t.id) === String(s.teamId)),
      );
      const orderedStandings = sortStandingsArray(validStandings, teams);

      const payload = orderedStandings.map((s, idx) => {
        const teamId = String(s.teamId);
        const zoneId = String(s.zoneId);
        const categoryId = String(s.categoryId);

        if (!teamId || !zoneId || !categoryId) {
          throw new Error('Datos incompletos para actualizar el orden');
        }

        return {
          equipo_id: teamId,
          zona_id: zoneId,
          categoria_id: categoryId,
          orden: idx + 1,
          puntos: typeof s.puntos === 'number' ? s.puntos : Number(s.puntos) || 0,
          pj: typeof s.pj === 'number' ? s.pj : Number(s.pj) || 0,
          equipo_nombre: s.equipo_nombre?.trim() || '',
        };
      });

      await updateEditablePositionsOrder(payload);
      setOrderDirty(false);
      setOrderSaved(true);
      await loadStandings();
    } catch (e) {
      console.error('Error al guardar el orden:', e);
      alert('Error al guardar el orden. Por favor, intenta nuevamente.');
    } finally {
      setSavingOrder(false);
    }
  }, [localStandings, teams, loadStandings]);

  // ─── Actualización de celda ─────────────────
  const handleUpdate = useCallback((id: string, field: keyof Standing | 'teamName', value: any) => {
    if (!id || id === 'undefined') {
      setError('Error: ID de equipo inválido');
      return;
    }

    if (field === 'teamName') {
      const standing = localStandings.find(s => s.id === id);
      if (standing) updateTeam(standing.teamId, { name: value });
    } else {
      let processedValue = value;
      if (field === 'puntos' || field === 'pj') {
        processedValue = Number(value) || 0;
      }
      setLocalStandings(prev =>
        prev.map(s => (s.id === id ? { ...s, [field]: processedValue } : s)),
      );
    }

    setModifiedRows(prev => new Set(prev).add(id));
  }, [localStandings, updateTeam]);

  // ─── Navegación entre celdas ────────────────
  const handleNavigate = useCallback((currentIndex: number, currentField: string, direction: 'next' | 'prev') => {
    const fields = ['teamName', 'pj', 'puntos'];
    let nextIndex = currentIndex;
    let nextFieldIdx = fields.indexOf(currentField);

    if (direction === 'next') {
      nextFieldIdx++;
      if (nextFieldIdx >= fields.length) { nextFieldIdx = 0; nextIndex++; }
    } else {
      nextFieldIdx--;
      if (nextFieldIdx < 0) { nextFieldIdx = fields.length - 1; nextIndex--; }
    }

    if (nextIndex >= 0 && nextIndex < uniqueStandings.length) {
      const nextStanding = uniqueStandings[nextIndex];
      setEditingCell(`${nextStanding.id}-${fields[nextFieldIdx]}`);
    } else {
      setEditingCell(null);
    }
  }, [uniqueStandings]);

  // ─── Guardar fila individual ────────────────
  const handleSaveRow = useCallback(async (standing: Standing) => {
    try {
      setLoading(true);
      setError(null);

      const teamExists = teams.some(t => String(t.id) === String(standing.teamId));
      if (!teamExists) throw new Error(`El equipo con ID ${standing.teamId} no existe`);

      const dataToSave = {
        equipo_id: String(standing.teamId),
        zona_id: String(standing.zoneId),
        categoria_id: String(standing.categoryId),
        puntos: Number(standing.puntos),
        pj: Number(standing.pj),
        equipo_nombre: standing.equipo_nombre?.trim() || getTeamName(standing.teamId),
      };

      if (dataToSave.puntos < 0) throw new Error('Los puntos no pueden ser negativos');
      if (dataToSave.pj < 0) throw new Error('Los partidos jugados no pueden ser negativos');

      if (String(standing.id).startsWith('temp-')) {
        await crearPosicion(dataToSave);
      } else {
        await actualizarPosicion(dataToSave.equipo_id, dataToSave.zona_id, dataToSave.categoria_id, {
          puntos: dataToSave.puntos,
          pj: dataToSave.pj,
          equipo_nombre: dataToSave.equipo_nombre,
        });
      }

      await loadStandings();
      setModifiedRows(prev => { const s = new Set(prev); s.delete(standing.id); return s; });
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [teams, getTeamName, loadStandings]);

  // ─── Guardar todo ───────────────────────────
  const handleSaveAll = useCallback(async () => {
    setLoading(true);
    try {
      if (orderDirty || modifiedRows.size > 0) {
        await handleSaveOrder();
      }
      setModifiedRows(new Set());
      setOrderDirty(false);
      await loadStandings();
    } catch (err) {
      console.error('Error fatal al guardar cambios:', err);
      setError('Error al guardar los cambios en la base de datos.');
    } finally {
      setLoading(false);
    }
  }, [modifiedRows, orderDirty, handleSaveOrder, loadStandings]);

  // ─── Leyenda ────────────────────────────────
  useEffect(() => {
    if (!selectedZone || !selectedCategory) return;
    setLegendLoading(true);
    standingsLegendService
      .getLegend(selectedZone, selectedCategory)
      .then(data => setLegend(data?.leyenda || ''))
      .finally(() => setLegendLoading(false));
    setLegendDirty(false);
  }, [selectedZone, selectedCategory]);

  // FIX #4: handleSaveLegend memoizado con useCallback
  const handleSaveLegend = useCallback(async () => {
    setLegendLoading(true);
    await standingsLegendService.upsertLegend(selectedZone, selectedCategory, legend);
    setLegendDirty(false);
    setLegendLoading(false);
  }, [selectedZone, selectedCategory, legend]);

  // FIX #5: handleSaveAllWithLegend con deps correctas y sin recursión infinita
  const handleSaveAllWithLegend = useCallback(async () => {
    // Si hay celda editándose, cerrarla primero y esperar el commit
    if (editingCell !== null) {
      setEditingCell(null);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    if (legendDirty) {
      await handleSaveLegend();
    }
    await handleSaveAll();
  }, [legendDirty, handleSaveLegend, handleSaveAll, editingCell]);

  // ─── Recalcular desde partidos ──────────────
  const handleRecalculateStandings = useCallback(() => {
    if (!selectedZone) return;
    try {
      const calculated = calculateStandingsFromMatches(selectedZone);
      if (calculated && calculated.length > 0) {
        setLocalStandings(prev => {
          const updated = [...prev];
          const modifiedIds = new Set(modifiedRows);
          calculated.forEach(calc => {
            const idx = updated.findIndex(s => s.teamId === calc.teamId);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                puntos: calc.puntos,
                pj: calc.pj,
                won: calc.won,
                drawn: calc.drawn,
                lost: calc.lost,
                goalsFor: calc.goalsFor,
                goalsAgainst: calc.goalsAgainst,
                orden: calc.orden,
              };
              modifiedIds.add(updated[idx].id);
            }
          });
          setModifiedRows(modifiedIds);
          return updated;
        });
        setOrderDirty(true);
        setError(null);
      } else {
        setError('No se encontraron partidos jugados para esta zona.');
      }
    } catch (err) {
      setError('Error al recalcular posiciones.');
    }
  }, [selectedZone, calculateStandingsFromMatches, modifiedRows]);

  // ─── Exportar CSV ───────────────────────────
  const exportToCSV = useCallback(() => {
    if (uniqueStandings.length === 0) { setError('No hay datos para exportar.'); return; }
    try {
      let csvContent = 'Posición,Equipo,PJ,PTS\n';
      uniqueStandings.forEach((s, i) => {
        csvContent += `${i + 1},"${getTeamName(s.teamId)}",${s.pj},${s.puntos}\n`;
      });
      const link = document.createElement('a');
      link.href = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
      link.download = `posiciones_${selectedLeague}_${selectedCategory}_${selectedZone}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setError(null);
    } catch {
      setError('Error al exportar datos.');
    }
  }, [uniqueStandings, getTeamName, selectedLeague, selectedCategory, selectedZone]);

  // ─── Equipos disponibles para agregar ───────
  useEffect(() => {
    if (selectedLeague) {
      const inStandings = new Set(localStandings.map(s => String(s.teamId)));
      setAvailableTeams(
        teams
          .filter(t => String(t.leagueId) === String(selectedLeague) && !inStandings.has(String(t.id)))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
      );
    } else {
      setAvailableTeams([]);
    }
  }, [selectedLeague, localStandings, teams]);

  // ─── Agregar equipo a standings ─────────────
  const handleAddStanding = async (newStandingData: any) => {
    if (!selectedZone || !selectedCategory) {
      setError('Debes seleccionar una zona y una categoría válidas.');
      return;
    }
    const newPosicion = {
      equipo_id: String(newStandingData.teamId),
      zona_id: String(selectedZone),
      categoria_id: String(selectedCategory),
      equipo_nombre: getTeamName(newStandingData.teamId),
      puntos: Number(newStandingData.puntos) || 0,
      pj: Number(newStandingData.pj) || 0,
    };
    await crearPosicion(newPosicion);
    await loadStandings();
    setSelectedTeamId('');
    setNewTeamPj(0);
    setNewTeamPts(0);
    setIsAddingTeam(false);
  };

  // ─── Eliminar posición ──────────────────────
  const handleDeletePosition = async (standing: Standing) => {
    const teamName = getTeamName(standing.teamId);
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}" de la tabla de posiciones?`)) return;

    if (String(standing.id).startsWith('temp-')) {
      setLocalStandings(prev => prev.filter(p => p.id !== standing.id));
      return;
    }

    try {
      const result = await eliminarPosicion(standing.id);
      if (result) {
        setLocalStandings(prev => prev.filter(s => s.id !== standing.id));
        setModifiedRows(prev => { const s = new Set(prev); s.delete(String(standing.id)); return s; });
        setError(null);
        await loadStandings();
      } else {
        setError('No se pudo eliminar la posición en la base de datos.');
      }
    } catch (err) {
      const msg = `Error al eliminar: ${err instanceof Error ? err.message : 'Error desconocido'}`;
      setError(msg);
    }
  };

  // ─── Opciones de selects ────────────────────
  const zoneOptions = useMemo(() =>
    availableZones.length > 0
      ? [{ id: '', name: 'Seleccionar zona' }, ...availableZones]
      : [{ id: '', name: 'No hay zonas' }],
    [availableZones],
  );

  const categoryOptions = useMemo(() =>
    filteredCategories.length > 0
      ? [{ id: '', name: 'Seleccionar categoría' }, ...filteredCategories]
      : [{ id: '', name: 'No hay categorías' }],
    [filteredCategories],
  );

  const canSave = !!selectedZone && !!selectedCategory && (modifiedRows.size > 0 || orderDirty) && !loading;

  // ─── RENDER ──────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full mx-0 px-0 max-w-[1400px] mx-auto py-6 lg:py-8">
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
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
            {/* Filtros */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-violet-500 rounded-full mr-3"></div>
                Filtros de Búsqueda
              </h2>
              <div className="flex flex-wrap gap-4 mb-6 items-end">
                <div>
                  <label className="form-label">Liga</label>
                  <select value={selectedLeague} onChange={handleLeagueChange} className="form-input" disabled={loading}>
                    {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                {isCategoriaPrimero ? (
                  <>
                    <div>
                      <label className="form-label">Categoría</label>
                      <select value={selectedCategory} onChange={handleCategoryChange} className="form-input" disabled={loading}>
                        {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Zona</label>
                      <select value={selectedZone} onChange={handleZoneChange} className="form-input" disabled={loading}>
                        {zoneOptions.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="form-label">Zona</label>
                      <select value={selectedZone} onChange={handleZoneChange} className="form-input" disabled={loading}>
                        {zoneOptions.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Categoría</label>
                      <select value={selectedCategory} onChange={handleCategoryChange} className="form-input" disabled={loading}>
                        {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="ml-auto">
                  <button
                    onClick={handleSaveAllWithLegend}
                    disabled={!canSave}
                    className={cn('btn btn-primary', !canSave && 'opacity-50 cursor-not-allowed')}
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

            {/* Indicador de modo */}
            {localStandings.length > 0 && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${uniqueStandings.some(s => s.orden && s.orden > 0) ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {uniqueStandings.some(s => s.orden && s.orden > 0)
                      ? '🔧 Modo Orden Manual'
                      : '📊 Modo Orden Automático por Puntos'}
                  </span>
                </div>
              </div>
            )}

            {/* Leyenda */}
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
                    <button className="btn btn-xs btn-success flex items-center" onClick={handleSaveLegend} disabled={legendLoading} title="Guardar leyenda">
                      <Save size={14} />
                    </button>
                  )}
                  {legendDirty && (
                    <button className="btn btn-xs btn-outline flex items-center" onClick={() => setLegendDirty(false)} disabled={legendLoading} title="Cancelar">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2 sm:mt-0 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex items-center space-x-2 w-full max-w-xs">
                  <span className="text-sm font-medium text-blue-800">
                    {legend || <span className="text-gray-400">Agregar leyenda</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Mensajes de estado */}
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

            {/* Aviso sin categoría en Liga Masculina */}
            {isLigaMasculina && selectedZone && !selectedCategory && (
              <div className="text-center text-red-500 font-semibold my-4">
                Debes seleccionar una categoría para ver la tabla de posiciones.
              </div>
            )}

            {(!isLigaMasculina || (isLigaMasculina && selectedCategory)) && selectedZone && (
              <div className="space-y-6">
                {/* Barra de acciones */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveAllWithLegend}
                      disabled={!canSave}
                      className={cn(
                        'inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105',
                        !canSave && 'text-gray-400 bg-gray-200 cursor-not-allowed',
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
                    onClick={() => {
                      setIsAddingTeam(true);
                      if (!isAddingTeam && availableTeamsForStanding.length > 0) {
                        setSelectedTeamId(String(availableTeamsForStanding[0].id));
                      }
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Equipo
                  </button>
                </div>

                {/* Tabla desktop */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 text-xs font-bold mr-2">#</span>
                            Posición
                          </div>
                        </th>
                        <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">EQUIPO</th>
                        <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">PJ</th>
                        <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">PTS</th>
                        <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                              <p className="text-gray-500">Cargando posiciones...</p>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="text-red-500 text-4xl">⚠️</div>
                              <p className="text-red-600 font-medium">Error al cargar datos</p>
                              <div className="flex space-x-2">
                                <button onClick={loadStandings} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Reintentar</button>
                                <button onClick={diagnoseDataIssue} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">🔍 Diagnosticar</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : uniqueStandings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="text-gray-400 text-4xl">📊</div>
                              <p className="text-gray-600 font-medium">No hay equipos en esta zona/categoría</p>
                              <div className="bg-gray-100 p-3 rounded-md text-xs text-gray-600">
                                <p><strong>Debug info:</strong></p>
                                <p>Liga: {selectedLeague || 'No seleccionada'}</p>
                                <p>Zona: {selectedZone || 'No seleccionada'}</p>
                                <p>Categoría: {selectedCategory || 'No seleccionada'}</p>
                                <p>Equipos disponibles: {teams.length}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button onClick={() => setIsAddingTeam(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">+ Agregar Equipo</button>
                                <button onClick={diagnoseDataIssue} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">🔍 Diagnosticar</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        // FIX #6: Render usa uniqueStandings (sin duplicados)
                        uniqueStandings.map((standing, index) => (
                          <tr
                            key={standing.id}
                            className={cn(
                              'hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all duration-200',
                              modifiedRows.has(String(standing.id)) && 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400',
                              index < 3 && 'bg-gradient-to-r from-green-50 to-emerald-50',
                            )}
                          >
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3',
                                  index === 0 && 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg',
                                  index === 1 && 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg',
                                  index === 2 && 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg',
                                  index > 2 && 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700',
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
                            <EditableCell value={getTeamName(standing.teamId)} standing={standing} field="teamName" onUpdate={handleUpdate} editingCell={editingCell} setEditingCell={setEditingCell} onNavigate={dir => handleNavigate(index, 'teamName', dir)} />
                            <EditableCell value={standing.pj} standing={standing} field="pj" onUpdate={handleUpdate} editingCell={editingCell} setEditingCell={setEditingCell} onNavigate={dir => handleNavigate(index, 'pj', dir)} />
                            <EditableCell value={standing.puntos} standing={standing} field="puntos" onUpdate={handleUpdate} editingCell={editingCell} setEditingCell={setEditingCell} onNavigate={dir => handleNavigate(index, 'puntos', dir)} />
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center space-x-2">
                                <button onClick={() => moveStanding(index, 'up')} disabled={index === 0} title="Subir" className="text-gray-500 hover:text-violet-600 disabled:opacity-30">▲</button>
                                <button onClick={() => moveStanding(index, 'down')} disabled={index === uniqueStandings.length - 1} title="Bajar" className="text-gray-500 hover:text-violet-600 disabled:opacity-30">▼</button>
                                <button
                                  onClick={() => handleSaveRow(standing)}
                                  disabled={loading || !modifiedRows.has(String(standing.id))}
                                  title={modifiedRows.has(String(standing.id)) ? 'Guardar cambios' : 'No hay cambios'}
                                  className={cn(
                                    'inline-flex items-center p-2.5 border border-transparent rounded-lg text-xs transition-all duration-200 transform hover:scale-110',
                                    modifiedRows.has(String(standing.id)) && !loading
                                      ? 'text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                                      : 'text-gray-400 bg-gray-100 cursor-not-allowed',
                                  )}
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePosition(standing)}
                                  disabled={loading}
                                  title="Eliminar"
                                  className="inline-flex items-center p-2.5 border border-transparent rounded-lg text-xs text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 disabled:opacity-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Vista mobile */}
                <div className="md:hidden space-y-3 p-0">
                  {loading ? (
                    <div className="flex flex-col items-center space-y-4 py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                      <p className="text-gray-500">Cargando posiciones...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center space-y-4 py-12">
                      <div className="text-red-500 text-4xl">⚠️</div>
                      <p className="text-red-600 font-medium">Error al cargar datos</p>
                      <div className="flex space-x-2">
                        <button onClick={loadStandings} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">Reintentar</button>
                        <button onClick={diagnoseDataIssue} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">🔍 Diagnosticar</button>
                      </div>
                    </div>
                  ) : uniqueStandings.length === 0 ? (
                    <div className="flex flex-col items-center space-y-4 py-12">
                      <div className="text-gray-400 text-4xl">📊</div>
                      <p className="text-gray-600 font-medium">No hay equipos en esta zona/categoría</p>
                      <div className="flex space-x-2">
                        <button onClick={() => setIsAddingTeam(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">+ Agregar Equipo</button>
                        <button onClick={diagnoseDataIssue} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">🔍 Diagnosticar</button>
                      </div>
                    </div>
                  ) : (
                    uniqueStandings.map((standing, idx) => (
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
                            {idx < 3 && <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Top {idx + 1}</span>}
                          </div>
                          <div className="flex flex-row gap-3">
                            <button onClick={() => moveStanding(idx, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-violet-600 disabled:opacity-30">▲</button>
                            <button onClick={() => moveStanding(idx, 'down')} disabled={idx === uniqueStandings.length - 1} className="text-gray-500 hover:text-violet-600 disabled:opacity-30">▼</button>
                            <button onClick={() => handleSaveRow(standing)} className="text-indigo-600 hover:text-indigo-900" disabled={loading}><Edit size={18} /></button>
                            <button onClick={() => handleDeletePosition(standing)} className="text-red-600 hover:text-red-900" disabled={loading}><X size={18} /></button>
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
                    ))
                  )}
                </div>

                {/* Botones de Orden */}
                {localStandings.length > 1 && (
                  <div className="flex justify-end gap-3 mb-4 mt-2">
                    <button
                      onClick={async () => {
                        if (!confirm('¿Resetear el orden manual y volver al ordenamiento por puntos?')) return;
                        try {
                          const payload = localStandings.map(s => ({
                            equipo_id: String(s.teamId),
                            zona_id: String(s.zoneId),
                            categoria_id: String(s.categoryId),
                            orden: 0,
                            puntos: Number(s.puntos) || 0,
                            pj: Number(s.pj) || 0,
                            equipo_nombre: s.equipo_nombre?.trim() || '',
                          }));
                          await updateEditablePositionsOrder(payload);
                          setLocalStandings(prev => prev.map(s => ({ ...s, orden: undefined })));
                          setOrderDirty(false);
                          setOrderSaved(false);
                          await loadStandings();
                        } catch (err) {
                          console.error('Error al resetear orden:', err);
                          alert('Error al resetear el orden.');
                        }
                      }}
                      className="px-4 py-2 rounded shadow flex items-center bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Orden por Puntos
                    </button>

                    <button
                      onClick={handleSaveOrder}
                      disabled={savingOrder || !orderDirty}
                      className={`px-4 py-2 rounded shadow flex items-center ${orderDirty ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-200 text-gray-600'} disabled:opacity-50 transition-colors duration-200`}
                    >
                      {savingOrder ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Guardar Orden
                        </>
                      )}
                    </button>

                    {orderSaved && (
                      <div className="ml-3 flex items-center text-green-600 font-medium">
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ¡Orden guardado!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mensaje sin filtros completos */}
            {(zoneOptions.length <= 1 || categoryOptions.length <= 1) && (
              <div className="text-center py-8 text-gray-500">
                Debes seleccionar una liga, zona y categoría para ver la tabla de posiciones.
              </div>
            )}

            {/* Formulario agregar equipo */}
            {isAddingTeam && (
              <div className="mb-4 bg-violet-50/50 p-4 rounded-xl border border-violet-100 flex flex-col md:flex-row md:items-end md:space-x-4 space-y-3 md:space-y-0">
                <div className="flex-[2]">
                  <label className="form-label" htmlFor="teamSelect">Equipo</label>
                  <select
                    id="teamSelect"
                    className="form-input focus:ring-violet-400 focus:border-violet-400"
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                  >
                    <option value="">Seleccionar equipo</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={String(team.id)}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="form-label" htmlFor="newTeamPj">PJ</label>
                  <input id="newTeamPj" type="number" min="0" className="form-input text-center" value={newTeamPj} onChange={e => setNewTeamPj(Number(e.target.value) || 0)} />
                </div>
                <div className="flex-1">
                  <label className="form-label" htmlFor="newTeamPts">PTS</label>
                  <input id="newTeamPts" type="number" min="0" className="form-input text-center" value={newTeamPts} onChange={e => setNewTeamPts(Number(e.target.value) || 0)} />
                </div>
                <div className="flex space-x-2">
                  <button
                    className="btn btn-primary h-[42px]"
                    onClick={async () => {
                      if (selectedTeamId) {
                        await handleAddStanding({
                          teamId: selectedTeamId,
                          leagueId: selectedLeague,
                          categoryId: selectedCategory,
                          zoneId: selectedZone,
                          puntos: newTeamPts,
                          pj: newTeamPj,
                          won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0,
                        });
                      }
                    }}
                    disabled={!selectedTeamId}
                  >
                    <Plus size={18} className="mr-1" />
                    <span>Agregar</span>
                  </button>
                  <button
                    className="btn btn-outline h-[42px]"
                    onClick={() => { setIsAddingTeam(false); setSelectedTeamId(''); setNewTeamPj(0); setNewTeamPts(0); }}
                  >
                    <X size={18} className="mr-1" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandingsPage;