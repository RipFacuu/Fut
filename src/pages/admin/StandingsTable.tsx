import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLeague, Team } from '../../contexts/LeagueContext';
import { Trash2, Save, Plus, X, Download, Upload, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { standingsLegendService, updateEditablePositionsOrder } from '../../services/standingsLegendService';
import { obtenerPosicionesPorZonaYCategoria } from '../../lib/supabase';

// 1. INTERFACES CORREGIDAS
interface Standing {
  id: string;
  teamId: string;
  leagueId: string;
  categoryId: string;
  zoneId: string;
  pj: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  puntos: number;
  orden?: number;
  equipo_nombre?: string;
}

interface NewTeamFormData {
  teamName: string;
  pj: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  puntos: number;
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

  // Sincronizar tempValue solo cuando no se está editando
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    // Procesar el valor antes de enviarlo
    let processedValue = tempValue;
    if (type === 'number') {
      // Si el input está vacío, forzar a 0
      if (tempValue === '' || tempValue === undefined || tempValue === null) {
        processedValue = 0;
      } else {
        const numValue = Number(tempValue);
        if (isNaN(numValue) || numValue < min) {
          processedValue = min;
        } else {
          processedValue = numValue;
        }
      }
    }
    // Solo actualizar si el valor cambió
    if (processedValue !== value) {
      onUpdate(String(standing.id), field, processedValue);
    }
    setTempValue(processedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (type === 'number') {
      // Permitir vacío durante la edición, pero nunca NaN
      if (val === '' || !isNaN(Number(val))) {
        setTempValue(val);
      }
    } else {
      setTempValue(val);
    }
  };

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      setTempValue(value);
    }
  };

  return (
    <td 
      className={cn(
        "px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center cursor-pointer",
        isEditing && "bg-violet-50/30"
      )}
      onClick={handleClick}
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
          data-row-id={String(standing.id)}
        />
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
};

interface EditableCellProps {
  value: number | string;
  standing: Standing;
  field: keyof Standing | 'teamName';
  onUpdate: (id: string, field: keyof Standing | 'teamName', value: any) => void;
  type?: 'number' | 'text';
  min?: number;
}

const StandingsTable: React.FC<{ zoneId: string; leagueId: string; categoryId: string }> = ({ 
  zoneId, 
  leagueId, 
  categoryId 
}) => {
  const { 
    standings: contextStandings, 
    updateStanding, 
    teams, 
    addTeam, 
    deleteTeam,
    updateTeam,
    getStandingsByZone,
    importStandingsFromCSV,
    createStanding,
    zones,
    updateZone,
    refreshStandings // <-- Agregar refreshStandings del contexto
  } = useLeague();
  const { isAuthenticated, user } = useAuth();
  
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [modifiedRows, setModifiedRows] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editingLegend, setEditingLegend] = useState(false);
  const [legendValue, setLegendValue] = useState('');
  const [savingLegend, setSavingLegend] = useState(false);
  const [legend, setLegend] = useState('');
  const [legendLoading, setLegendLoading] = useState(false);
  const [legendDirty, setLegendDirty] = useState(false);
  const [draftTeams, setDraftTeams] = useState<any[]>([]);
  
  // 1. Estado unificado para standings y control de orden
  const [standings, setStandings] = useState<Standing[]>([]);
  const [hasManualOrder, setHasManualOrder] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [movingTeamId, setMovingTeamId] = useState<string | null>(null);

  // 2. Cargar standings desde la base y aplicar orden manual si existe
  useEffect(() => {
    const loadStandingsData = async () => {
      if (!zoneId || !categoryId) return;
      setIsLoading(true);
      try {
        // Trae standings solo de la zona y categoría seleccionada
        const posiciones = await obtenerPosicionesPorZonaYCategoria(zoneId, categoryId);
        const orderedStandings = (posiciones as any[])
          .map((pos: any) => ({
            id: String(pos.id),
            teamId: String(pos.equipo_id),
            leagueId: String(pos.liga_id),
            categoryId: String(pos.categoria_id),
            zoneId: String(pos.zona_id),
            puntos: Number(pos.puntos) || 0,
            pj: Number(pos.pj) || 0,
            orden: typeof pos.orden === 'number' ? pos.orden : 0,
            equipo_nombre: pos.equipo_nombre || '',
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0
          }))
          .sort((a, b) => (a.orden || 0) - (b.orden || 0));
        setStandings(orderedStandings.map(s => ({ ...s, id: String(s.id) })));
        setHasManualOrder(orderedStandings.some(s => s.orden && s.orden > 0));
        setOrderDirty(false);
      } catch (error) {
        console.error('Error loading standings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStandingsData();
  }, [zoneId, categoryId]);

  // 4. Guardar el orden manual en la base
  const handleSaveOrder = useCallback(async () => {
    setSavingOrder(true);
    try {
      const payload = standings.map((standing, idx) => ({
        equipo_id: Number(standing.teamId),
        zona_id: Number(standing.zoneId),
        categoria_id: Number(standing.categoryId),
        orden: idx + 1
      }));
      await updateEditablePositionsOrder(payload);
      setOrderDirty(false);
      setHasManualOrder(true);
      // Recargar standings desde la base
      // (opcional) await loadStandingsData();
    } catch (error) {
      console.error('Error al guardar el orden:', error);
      alert('Error al guardar el orden');
    } finally {
      setSavingOrder(false);
    }
  }, [standings]);

  // 1. Obtener todos los equipos de la zona y categoría seleccionada (aunque no tengan posición)
  const teamsForZoneAndCategory = useMemo(() => {
    return teams.filter(
      t => t.zoneId === zoneId && t.categoryId === categoryId && t.leagueId === leagueId
    );
  }, [teams, zoneId, categoryId, leagueId]);

  // 2. Unir standings existentes con equipos que no tengan posición, y ordenar correctamente
  const allRows = useMemo(() => {
    // Drafts (equipos nuevos no guardados)
    const draftRows = draftTeams.map(draft => ({
      ...draft,
      id: draft.tempId,
      teamId: draft.tempId,
      isDraft: true
    }));
    // Standings existentes, ordenados por puntos, diferencia de gol y nombre
    const standingsRows = contextStandings
      .map(s => ({ ...s, isDraft: false }))
      .sort((a, b) => {
        const bPuntos = Number(b.puntos) || 0;
        const aPuntos = Number(a.puntos) || 0;
        if (bPuntos !== aPuntos) return bPuntos - aPuntos;
        const bDiff = (Number(b.goalsFor) || 0) - (Number(b.goalsAgainst) || 0);
        const aDiff = (Number(a.goalsFor) || 0) - (Number(a.goalsAgainst) || 0);
        if (bDiff !== aDiff) return bDiff - aDiff;
        const teamA = teams.find(t => t.id === a.teamId)?.name || '';
        const teamB = teams.find(t => t.id === b.teamId)?.name || '';
        return teamA.localeCompare(teamB);
      });
    // Equipos sin posición, ordenados alfabéticamente
    const teamIdsWithStanding = new Set(standingsRows.map(s => s.teamId));
    const missingTeams = teamsForZoneAndCategory.filter(t => !teamIdsWithStanding.has(t.id));
    const missingRows = missingTeams
      .map(team => ({
        id: `missing_${team.id}`,
        teamId: team.id,
        leagueId: team.leagueId,
        categoryId: team.categoryId,
        zoneId: team.zoneId,
        pj: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, puntos: 0,
        isDraft: false
      }))
      .sort((a, b) => {
        const teamA = teams.find(t => t.id === a.teamId)?.name || '';
        const teamB = teams.find(t => t.id === b.teamId)?.name || '';
        return teamA.localeCompare(teamB);
      });
    // Unir y eliminar duplicados por teamId
    const all = [...draftRows, ...standingsRows, ...missingRows];
    const uniqueByTeamId = all.filter((row, idx, arr) =>
      arr.findIndex(r => r.teamId === row.teamId) === idx
    );
    return uniqueByTeamId;
  }, [draftTeams, contextStandings, teamsForZoneAndCategory, teams]);

  // useEffect para forzar rerender visual cuando draftTeams cambia
  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [draftTeams.length]);

  // 3. Log de depuración
  useEffect(() => {
    console.log('MUNDIALITO DEBUG:', {
      zoneId, leagueId, categoryId,
      teamsForZoneAndCategory,
      allRows,
      contextStandings,
      allTeams: teams
    });
  }, [zoneId, leagueId, categoryId, teamsForZoneAndCategory, allRows, contextStandings, teams]);
  
  // 2. DATOS DE PRUEBA SOLO EN DESARROLLO
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const createTestData = async () => {
      // Solo para testing - crear datos de prueba si no existen
      if (contextStandings.length === 0 && zoneId && leagueId && categoryId) {
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
            leagueId,  // Agregar leagueId
            categoryId, // Agregar categoryId
            zoneId,
            pj: 1,      // Cambiar 'played' por 'pj'
            won: 1,
            drawn: 0,
            lost: 0,
            goalsFor: 2,
            goalsAgainst: 1,
            puntos: 3   // Cambiar 'points' por 'puntos'
          },
          {
            id: `test_standing_2_${zoneId}`,
            teamId: `test_team_2_${zoneId}`,
            leagueId,  // Agregar leagueId
            categoryId, // Agregar categoryId
            zoneId,
            pj: 1,      // Cambiar 'played' por 'pj'
            won: 0,
            drawn: 0,
            lost: 1,
            goalsFor: 1,
            goalsAgainst: 2,
            puntos: 0   // Cambiar 'points' por 'puntos'
          }
        ];
        
        // Agregar a tu contexto (esto depende de cómo manejes el estado)
        testTeams.forEach(team => addTeam(team));
        if (createStanding) {
          for (const standing of testStandings) {
            await createStanding(standing);
          }
        }
      };
    };
    
    createTestData();
  }, [zoneId, leagueId, categoryId, contextStandings.length, addTeam, createStanding]);
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<NewTeamFormData>({
    defaultValues: {
      teamName: '',
      pj: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      puntos: 0
    }
  });

  // Observar valores para calcular diferencia de goles automáticamente
  const goalsFor = watch('goalsFor');
  const goalsAgainst = watch('goalsAgainst');
  const goalDifference = goalsFor - goalsAgainst;

  // 8. VALIDACIÓN DE DATOS EN onSubmitNewTeam
  const validateStats = (data: NewTeamFormData): boolean => {
    const total = data.won + data.drawn + data.lost;
    if (total !== data.pj) {
      alert(`Los partidos jugados (${data.pj}) deben ser igual a G+E+P (${total})`);
      return false;
    }
    return true;
  };

  const handleUpdate = async (id: string, field: keyof Standing | 'teamName', value: any) => {
    // Si es draft, actualizar en draftTeams
    if (id.startsWith('draft_')) {
      setDraftTeams(prev => prev.map(d => d.tempId === id ? { ...d, [field]: value } : d));
      return;
    }
    try {
      if (field === 'teamName') {
        const standing = contextStandings.find(s => s.id === id);
        if (standing) {
          await updateTeam(standing.teamId, { name: value });
        }
      } else {
        const numericFields = ['pj', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'puntos'];
        let processedValue = value;
        if (numericFields.includes(field)) {
          processedValue = Number(value);
          if (isNaN(processedValue) || processedValue < 0) {
            processedValue = 0;
          }
        }
        await updateStanding(id, { [field]: processedValue });
      }
      setModifiedRows(prev => new Set(prev).add(id));
      if (["puntos", "goalsFor", "goalsAgainst"].includes(field)) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error actualizando:', error);
    }
  };

  // Forzar blur de inputs de la fila antes de guardar
  const forceRowBlur = (rowId: string) => {
    const rowInputs = document.querySelectorAll<HTMLInputElement>(`input[data-row-id='${rowId}']`);
    rowInputs.forEach(input => input.blur());
  };

  // 7. MEJORAR MANEJO DE ASYNC/AWAIT Y LOADING EN handleSaveRow
  const handleSaveRow = async (id: string) => {
    setIsLoading(true);
    try {
      // Encontrar el standing actual
      const standing = contextStandings.find(s => s.id === id);
      if (!standing) return;
      // Forzar blur de inputs de la fila
      const rowInputs = document.querySelectorAll<HTMLInputElement>(`input[data-row-id='${id}']`);
      rowInputs.forEach(input => input.blur());
      // Esperar un tick para que el blur se procese
      await new Promise(resolve => setTimeout(resolve, 0));
      // Actualizar en la base de datos
      await updateStanding(id, {
        pj: Number(standing.pj),
        puntos: Number(standing.puntos),
        won: Number(standing.won),
        drawn: Number(standing.drawn),
        lost: Number(standing.lost),
        goalsFor: Number(standing.goalsFor),
        goalsAgainst: Number(standing.goalsAgainst)
      });
      await refreshStandings(); // <-- Refrescar standings después de guardar
      // Remover de filas modificadas
      setModifiedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forzar blur de todos los inputs editables antes de guardar todo
  const forceAllInputsBlur = () => {
    const allInputs = document.querySelectorAll<HTMLInputElement>('input[data-row-id]');
    allInputs.forEach(input => input.blur());
  };

  const handleSaveAll = async () => {
    // Forzar blur de todos los inputs editables antes de guardar
    forceAllInputsBlur();
    // Esperar un tick para que los blur se procesen y actualicen modifiedRows
    await new Promise(resolve => setTimeout(resolve, 0));
    if (modifiedRows.size === 0 && !legendDirty && draftTeams.length === 0) return;
    setIsLoading(true);
    try {
      // Guardar leyenda si fue modificada
      if (legendDirty) {
        await standingsLegendService.upsertLegend(zoneId, categoryId, legend);
        setLegendDirty(false);
      }
      // 5.1 Guardar equipos nuevos y standings
      for (const draft of draftTeams) {
        // Crear equipo en Supabase
        const createdTeam = await addTeam({
          name: draft.name,
          leagueId: draft.leagueId,
          categoryId: draft.categoryId,
          zoneId: draft.zoneId,
          logo: draft.logo
        }, {
          pj: draft.pj,
          won: draft.won,
          drawn: draft.drawn,
          lost: draft.lost,
          goalsFor: draft.goalsFor,
          goalsAgainst: draft.goalsAgainst,
          puntos: draft.puntos
        });
      }
      setDraftTeams([]);
      // 5.2 Guardar standings editados
      const updates = Array.from(modifiedRows).map(async (id) => {
        const standing = contextStandings.find(s => s.id === id);
        if (!standing) return;
        await updateStanding(id, {
          pj: standing.pj,
          puntos: standing.puntos,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst
        });
      });
      await Promise.all(updates);
      await refreshStandings(); // <-- Refrescar standings después de guardar todo
      setModifiedRows(new Set());
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error guardando standings:', error);
      alert('Error al guardar los datos. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. ACCESIBILIDAD EN INPUTS
  // Ejemplo para un input:
  // <div className="form-group">
  //   <label htmlFor="pj" className="sr-only">Partidos Jugados</label>
  //   <input id="pj" ... aria-label="Partidos Jugados" />
  // </div>
  // Aplica esto a todos los inputs del formulario y tabla.
  // 9. VALIDACIÓN DE PERMISOS EN handleDeleteTeam
  const handleDeleteTeam = async (standing: Standing) => {
    if (!isAuthenticated || user?.username !== 'admin') {
      alert('No tienes permisos para eliminar equipos');
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
      setIsLoading(true);
      try {
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

  // Handler para eliminar posición/standing (draft o real)
  const handleDeletePosition = async (standing: Standing & { isDraft?: boolean }) => {
    setIsLoading(true);
    try {
      if (standing.isDraft || (typeof standing.id === 'string' && standing.id.startsWith('draft_'))) {
        setDraftTeams(prev => {
          const updated = prev.filter(d => d.tempId !== standing.id);
          setRefreshKey(k => k + 1); // Forzar refresco
          return updated;
        });
      } else if (typeof standing.id === 'string' && standing.id.startsWith('missing_')) {
        // No hacer nada, es solo visual
      } else {
        await deleteTeam(standing.teamId);
        await refreshStandings();
      }
    } catch (error) {
      alert('Error al eliminar el equipo. Intenta de nuevo.');
      console.error('Error eliminando equipo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitNewTeam = async (data: NewTeamFormData) => {
    if (!validateStats(data)) return;
    setDraftTeams(prev => [
      ...prev,
      {
        tempId: `draft_${Date.now()}`,
        name: data.teamName,
        leagueId,
        categoryId,
        zoneId,
        logo: '',
        pj: data.pj,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        puntos: data.puntos
      }
    ]);
    setIsAddingTeam(false);
    reset();
  };

  const exportToCSV = (zoneId: string) => {
    if (typeof window === 'undefined') return; // Verificar entorno del navegador
    
    try {
      const zoneStandings = contextStandings.filter(s => s.zoneId === zoneId);
      
      let csvContent = "Posición,Equipo,PJ,PG,PE,PP,GF,GC,DG,Puntos\n";
      zoneStandings.forEach((standing, index) => {
        const teamName = teams.find(t => t.id === standing.teamId)?.name || 'Unknown Team';
        csvContent += `${index + 1},${teamName},${standing.pj},${standing.won},${standing.drawn},${standing.lost},${standing.goalsFor},${standing.goalsAgainst},${standing.goalsFor - standing.goalsAgainst},${standing.puntos}\n`;
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

  // Obtener la zona actual
  const currentZone = zones.find(z => z.id === zoneId);
  useEffect(() => {
    setLegendValue(currentZone?.legend || '');
  }, [currentZone?.legend]);

  // Cargar leyenda al cambiar zona/categoría
  useEffect(() => {
    if (!zoneId || !categoryId) return;
    setLegendLoading(true);
    standingsLegendService.getLegend(zoneId, categoryId)
      .then(data => setLegend(data?.leyenda || ''))
      .finally(() => setLegendLoading(false));
    setLegendDirty(false);
  }, [zoneId, categoryId]);

  // Guardar leyenda
  const handleSaveLegend = async () => {
    setLegendLoading(true);
    await standingsLegendService.upsertLegend(zoneId, categoryId, legend);
    setLegendDirty(false);
    setLegendLoading(false);
  };

  // ============ SECCIÓN 1: Estado para ordenamiento manual ============
  // const [manualOrder, setManualOrder] = useState<(Standing & { orden?: number })[]>([]);
  // const [hasManualOrder, setHasManualOrder] = useState(false);

  // ============ SECCIÓN 2: Sincronización mejorada ============
  // useEffect(() => {
  //   // Detectar si hay orden manual en los datos
  //   const realStandings = sortedStandings.filter(s => 
  //     !String(s.id).startsWith('missing_') && 
  //     !String(s.id).startsWith('draft_')
  //   );
  //   const hasOrderValues = realStandings.some(s => 
  //     typeof s.orden === 'number' && s.orden > 0
  //   );
  //   if (hasOrderValues) {
  //     // Hay orden manual en los datos
  //     const orderedStandings = [...realStandings].sort((a, b) => {
  //       if (typeof a.orden === 'number' && typeof b.orden === 'number') {
  //         return a.orden - b.orden;
  //       }
  //       return 0;
  //     });
  //     setManualOrder(orderedStandings.map(s => ({ ...s, id: String(s.id) })));
  //     setHasManualOrder(true);
  //   } else {
  //     // No hay orden manual, usar orden automático
  //     setManualOrder(realStandings.map(s => ({ ...s, id: String(s.id) })));
  //     setHasManualOrder(false);
  //   }
  // }, [sortedStandings]);

  // ============ SECCIÓN 3: Función moveStanding corregida ============
  // 6. DEBUGGING: función para logs
  const debugMoveStanding = (index: number, direction: 'up' | 'down') => {
    console.log('=== DEBUG MOVE STANDING ===');
    console.log('Index:', index);
    console.log('Direction:', direction);
    console.log('standings.length:', standings.length);
    console.log('hasManualOrder:', hasManualOrder);
    console.log('Current standings:', standings);
    console.log('=============================');
  };
  // 1. Estado para feedback visual
  // const [movingTeamId, setMovingTeamId] = useState<string | null>(null);

  // Mueve la declaración de displayStandings antes de moveStanding
  // const displayStandings = useMemo(() => {
  //   if (hasManualOrder) {
  //     return manualOrder.map(s => ({ ...s, id: String(s.id) }));
  //   }
  //   return sortedStandings
  //     .filter(standing => 
  //       !String(standing.id).startsWith('missing_') && 
  //       !String(standing.id).startsWith('draft_')
  //     )
  //     .map(s => ({ ...s, id: String(s.id) }));
  // }, [hasManualOrder, manualOrder, sortedStandings]);

  // Determina si hay orden manual
  // const hasManualOrderInData = displayStandings.some(s => typeof s.orden === 'number' && s.orden > 0);

  // Ordena por orden manual si existe, si no por puntos
  // const orderedStandings = useMemo(() => {
  //   if (hasManualOrderInData) {
  //     return [...displayStandings].sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999));
  //   }
  //   // Orden automático por puntos, diferencia de gol, etc.
  //   return [...displayStandings].sort((a, b) => {
  //     if (b.puntos !== a.puntos) return b.puntos - a.puntos;
  //     const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
  //     const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);
  //     if (bDiff !== aDiff) return bDiff - aDiff;
  //     if ((b.goalsFor || 0) !== (a.goalsFor || 0)) return (b.goalsFor || 0) - (a.goalsFor || 0);
  //     return (a.pj || 0) - (b.pj || 0);
  //   });
  // }, [displayStandings, hasManualOrderInData]);

  // 2. moveStanding robusto y con feedback visual
  // const moveStanding = useCallback(async (index: number, direction: 'up' | 'down') => {
  //   if (!isAuthenticated) {
  //     alert('Debes iniciar sesión para realizar esta acción');
  //     return;
  //   }
  //   if ((direction === 'up' && index === 0) || (direction === 'down' && index === displayStandings.length - 1)) {
  //     return;
  //   }
  //   setIsLoading(true);
  //   setMovingTeamId(displayStandings[index].teamId);
  //   try {
  //     const newOrder = [...displayStandings];
  //     const swapIndex = direction === 'up' ? index - 1 : index + 1;
  //     [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
  //     const orderedStandings = newOrder.map((standing, idx) => ({
  //       ...standing,
  //       orden: idx + 1
  //     }));
  //     setManualOrder(orderedStandings);
  //     setHasManualOrder(true);
  //     const updates = orderedStandings.map((standing, idx) => ({
  //       equipo_id: Number(standing.teamId),
  //       zona_id: Number(standing.zoneId),
  //       categoria_id: Number(standing.categoryId),
  //       orden: idx + 1
  //     }));
  //     await updateEditablePositionsOrder(updates);
  //     await refreshStandings();
  //   } catch (error: any) {
  //     console.error('Error al mover equipo:', error);
  //     setManualOrder([...displayStandings]);
  //     alert(`Error al actualizar el orden: ${error.message || error}`);
  //   } finally {
  //     setIsLoading(false);
  //     setMovingTeamId(null);
  //   }
  // }, [displayStandings, isAuthenticated, refreshStandings]);

  // ============ SECCIÓN 4: Función para resetear orden manual ============
  // 4. resetManualOrder robusto
  const resetManualOrder = async () => {
    try {
      setIsLoading(true);
      // Obtener standings reales para resetear
      const realStandings = contextStandings.filter(s => 
        !String(s.id).startsWith('missing_') && 
        !String(s.id).startsWith('draft_')
      );
      // Limpiar órdenes en la base de datos
      const updates = realStandings.map((standing) => ({
        equipo_id: Number(standing.teamId),
        zona_id: Number(standing.zoneId),
        categoria_id: Number(standing.categoryId),
        orden: 0 // Resetear a 0
      }));
      await updateEditablePositionsOrder(updates);
      await refreshStandings();
      // Actualizar estado local
      setStandings(realStandings.map(s => ({ ...s, id: String(s.id), orden: 0 })));
      setHasManualOrder(false);
      setOrderDirty(false);
    } catch (error) {
      console.error('Error al resetear orden:', error);
      alert('Error al resetear el orden. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ SECCIÓN 5: Detectar si hay orden manual en los datos ============
  // 5. Detectar si hay orden manual en los datos
  useEffect(() => {
    // Solo verificar en standings reales
    const realStandings = contextStandings.filter(s => 
      !String(s.id).startsWith('missing_') && 
      !String(s.id).startsWith('draft_')
    );
    const hasOrderValues = realStandings.some(s => 
      typeof s.orden === 'number' && s.orden > 0
    );
    if (hasOrderValues && !hasManualOrder) {
      setHasManualOrder(true);
      setStandings(realStandings.map(s => ({ ...s, id: String(s.id), orden: s.orden || 0 })));
      setOrderDirty(true);
    }
  }, [contextStandings, hasManualOrder]);

  // ============ SECCIÓN 6: Agregar botón de reseteo en la UI ============
  // En la sección de botones:
  // {hasManualOrder && (
  //   <button
  //     onClick={resetManualOrder}
  //     className="btn btn-sm btn-outline flex items-center space-x-1"
  //     disabled={isLoading}
  //     title="Resetear orden manual y volver al automático"
  //   >
  //     <RefreshCw size={16} />
  //     <span>Orden Auto</span>
  //   </button>
  // )}

  // ============ SECCIÓN 7: Usar los datos correctos en el render ============
  // 1. displayStandings con useMemo y solo standings reales
  // const displayStandings = useMemo(() => {
  //   if (hasManualOrder) {
  //     return manualOrder.map(s => ({ ...s, id: String(s.id) }));
  //   }
  //   // Usar solo standings reales ordenados automáticamente
  //   return sortedStandings
  //     .filter(standing => 
  //       !String(standing.id).startsWith('missing_') && 
  //       !String(standing.id).startsWith('draft_')
  //     )
  //     .map(s => ({ ...s, id: String(s.id) }));
  // }, [hasManualOrder, manualOrder, sortedStandings]);

  // Ordena standings por orden manual si existe, si no por puntos
  const sortedStandings = [...standings].sort((a, b) => {
    if (typeof a.orden === 'number' && typeof b.orden === 'number' && a.orden !== b.orden) {
      return a.orden - b.orden;
    }
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    if (bDiff !== aDiff) return bDiff - aDiff;
    return (a.pj || 0) - (b.pj || 0);
  });

  // Elimina la declaración duplicada de moveStanding, deja solo la versión con el swap sobre filteredStandings y setOrderDirty
  // 1. Solo una función moveStanding:
  const filteredStandings = standings.filter(s => !String(s.id).startsWith('draft_') && !String(s.id).startsWith('missing_'));
  const moveStanding = (index: number, direction: 'up' | 'down') => {
    setStandings(prev => {
      const arr = prev.filter(s => !String(s.id).startsWith('draft_') && !String(s.id).startsWith('missing_'));
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr.map((s, idx) => ({ ...s, orden: idx + 1 }));
    });
    setOrderDirty(true);
  };

  return (
    <div key={refreshKey} className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Campo de leyenda editable */}
      <div className="px-4 pt-4 pb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📝 Leyenda de la Tabla de Posiciones
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="form-input w-full max-w-lg text-sm"
            value={legend}
            onChange={e => { setLegend(e.target.value); setLegendDirty(true); }}
            disabled={!isAuthenticated || user?.username !== 'admin' || legendLoading}
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
        </div>
      </div>
      <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-center border-b space-y-2 md:space-y-0">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tabla de Posiciones</h3>
        </div>
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
            onClick={() => exportToCSV(zoneId)}
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
          {hasManualOrder && (
            <button
              onClick={resetManualOrder}
              className="btn btn-sm btn-outline flex items-center space-x-1"
              disabled={isLoading}
              title="Resetear orden manual y volver al automático"
            >
              <RefreshCw size={16} />
              <span>Orden Auto</span>
            </button>
          )}
          {orderDirty && (
            <button onClick={handleSaveOrder} disabled={savingOrder} className="btn btn-success flex items-center space-x-1">
              {savingOrder ? 'Guardando...' : 'Guardar Orden'}
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="p-4 text-center">
          <span className="text-gray-500">Cargando...</span>
        </div>
      )}
      
      {/* Tabla tradicional para desktop */}
      <div className="overflow-x-auto hidden md:block">
        <table key={refreshKey} className="min-w-full divide-y divide-gray-200">
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
                  {contextStandings.length + 1}
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
                    {...register('pj', { min: 0, valueAsNumber: true })}
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
                    {...register('puntos', { min: 0, valueAsNumber: true })}
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
            
            {contextStandings.length === 0 && !isAddingTeam ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  No hay equipos en esta zona y categoría. Agrega el primer equipo para comenzar.
                </td>
              </tr>
            ) : (
              filteredStandings
                .slice()
                .sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999))
                .map((standing, index) => {
                  const team = teams.find(t => t.id === standing.teamId);
                  const isModified = modifiedRows.has(String(standing.id));
                  
                  return (
                    <tr 
                      key={standing.id} 
                      className={cn(
                        "hover:bg-gray-50",
                        isModified && "bg-yellow-50/30",
                        movingTeamId === standing.teamId && "bg-blue-50"
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <EditableCell 
                        value={team?.name || 'Equipo desconocido'} 
                        standing={standing} 
                        field="teamName" 
                        onUpdate={handleUpdate}
                        type="text"
                      />
                      <EditableCell value={standing.pj} standing={standing} field="pj" onUpdate={handleUpdate} />
                      <EditableCell value={standing.won} standing={standing} field="won" onUpdate={handleUpdate} />
                      <EditableCell value={standing.drawn} standing={standing} field="drawn" onUpdate={handleUpdate} />
                      <EditableCell value={standing.lost} standing={standing} field="lost" onUpdate={handleUpdate} />
                      <EditableCell value={standing.goalsFor} standing={standing} field="goalsFor" onUpdate={handleUpdate} />
                      <EditableCell value={standing.goalsAgainst} standing={standing} field="goalsAgainst" onUpdate={handleUpdate} />
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {standing.goalsFor - standing.goalsAgainst}
                      </td>
                      <EditableCell value={standing.puntos} standing={standing} field="puntos" onUpdate={handleUpdate} />
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {isModified && (
                            <button
                              onClick={() => handleSaveRow(String(standing.id))}
                              className="text-green-600 hover:text-green-900"
                              title="Confirmar cambios"
                              disabled={isLoading}
                            >
                              <Save size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => moveStanding(index, 'up')}
                            className="btn btn-xs btn-outline"
                            disabled={isLoading || index === 0}
                            title="Subir equipo"
                            aria-label="Subir equipo"
                          >
                            <span style={{ display: 'inline-block', transform: 'rotate(-90deg)' }}>▲</span>
                          </button>
                          <button
                            onClick={() => moveStanding(index, 'down')}
                            className="btn btn-xs btn-outline"
                            disabled={isLoading || index === filteredStandings.length - 1}
                            title="Bajar equipo"
                            aria-label="Bajar equipo"
                          >
                            <span style={{ display: 'inline-block', transform: 'rotate(90deg)' }}>▲</span>
                          </button>
                          <button
                            onClick={() => handleDeletePosition(standing)}
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
                })
            )}
          </tbody>
        </table>
      </div>
      {/* Vista tipo lista para mobile: más ancha y cómoda */}
      <div className="md:hidden space-y-3 w-full p-0" key={refreshKey}>
        {filteredStandings.map((standing, idx) => {
          const team = teams.find(t => t.id === standing.teamId);
          const isModified = modifiedRows.has(String(standing.id));
          return (
            <div
              key={standing.id}
              className={
                'flex flex-col rounded-lg p-4 border w-full mx-0 ' +
                (isModified ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200')
              }
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">{idx + 1}</span>
                </div>
                <div className="flex flex-row space-x-2">
                  {isModified && (
                    <button
                      onClick={() => handleSaveRow(String(standing.id))}
                      className="text-green-600 hover:text-green-900"
                      title="Confirmar cambios"
                      disabled={isLoading}
                    >
                      <Save size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => moveStanding(idx, 'up')}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    title="Subir"
                    disabled={idx === 0 || isLoading}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveStanding(idx, 'down')}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    title="Bajar"
                    disabled={idx === filteredStandings.length - 1 || isLoading}
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleDeletePosition(standing)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar equipo"
                    disabled={isLoading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="text-base font-semibold text-gray-900">{team?.name || 'Equipo desconocido'}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">PJ: {standing.pj}</span>
                  <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded text-xs font-semibold">G: {standing.won}</span>
                  <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded text-xs font-semibold">E: {standing.drawn}</span>
                  <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded text-xs font-semibold">P: {standing.lost}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">GF: {standing.goalsFor}</span>
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">GC: {standing.goalsAgainst}</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold">DIF: {standing.goalsFor - standing.goalsAgainst}</span>
                  <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded text-xs font-semibold">PTS: {standing.puntos}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredStandings.length === 0 && !isAddingTeam && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
            No hay equipos en esta zona. Agrega el primer equipo para comenzar.
          </div>
        )}
      </div>
    </div>
  );
};

export default StandingsTable;