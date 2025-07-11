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
  const { teams } = useLeague();
  const [standings, setStandings] = useState<any[]>([]);
  useEffect(() => {
    if (!zoneId || !categoryId) {
      setStandings([]);
      return;
    }
    obtenerPosicionesPorZonaYCategoria(zoneId, categoryId).then(data => {
      // Eliminar duplicados por equipo_id-zona_id-categoria_id, priorizando equipo_nombre no vacío
      const uniqueDataMap = new Map();
      for (const pos of data || []) {
        const key = `${pos.equipo_id}-${pos.zona_id}-${pos.categoria_id}`;
        const prev = uniqueDataMap.get(key);
        if (!prev) {
          uniqueDataMap.set(key, pos);
        } else if ((!prev.equipo_nombre || prev.equipo_nombre.trim() === '') && (pos.equipo_nombre && pos.equipo_nombre.trim() !== '')) {
          uniqueDataMap.set(key, pos);
        }
      }
      setStandings(Array.from(uniqueDataMap.values()));
    });
  }, [zoneId, categoryId]);
  const { isAuthenticated, user } = useAuth();
  
  // Elimina todas las referencias y llamadas a addTeam, createStanding, updateTeam, updateStanding y refreshStandings.
  // Deja solo la lógica de visualización y orden, igual que la tabla pública.
  // 1. Estado unificado para standings y control de orden
  const [hasManualOrder, setHasManualOrder] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [movingTeamId, setMovingTeamId] = useState<string | null>(null);

  // 2. Cargar standings desde la base y aplicar orden manual si existe
  useEffect(() => {
    const loadStandingsData = async () => {
      if (!zoneId || !categoryId) return;
      // setIsLoading(true); // Eliminado
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
        // setIsLoading(false); // Eliminado
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
    // Standings existentes, ordenados por puntos, diferencia de gol y nombre
    const standingsRows = standings
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
    const all = [...standingsRows, ...missingRows];
    const uniqueByTeamId = all.filter((row, idx, arr) =>
      arr.findIndex(r => r.teamId === row.teamId) === idx
    );
    return uniqueByTeamId;
  }, [standings, teamsForZoneAndCategory, teams]);

  // useEffect para forzar rerender visual cuando draftTeams cambia
  useEffect(() => {
    // setRefreshKey(k => k + 1); // Eliminado
  }, [standings.length]); // Cambiado a standings.length

  // 3. Log de depuración
  useEffect(() => {
    console.log('MUNDIALITO DEBUG:', {
      zoneId, leagueId, categoryId,
      teamsForZoneAndCategory,
      allRows,
      standings,
      allTeams: teams
    });
  }, [zoneId, leagueId, categoryId, teamsForZoneAndCategory, allRows, standings, teams]);
  
  // 2. DATOS DE PRUEBA SOLO EN DESARROLLO
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const createTestData = async () => {
      // Solo para testing - crear datos de prueba si no existen
      if (standings.length === 0 && zoneId && leagueId && categoryId) {
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
        // testTeams.forEach(team => addTeam(team)); // Eliminado
        // if (createStanding) { // Eliminado
        //   for (const standing of testStandings) { // Eliminado
        //     await createStanding(standing); // Eliminado
        //   } // Eliminado
        // } // Eliminado
      };
    };
    
    createTestData();
  }, [zoneId, leagueId, categoryId, standings.length]); // Eliminado addTeam, createStanding
  
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
      // setDraftTeams(prev => prev.map(d => d.tempId === id ? { ...d, [field]: value } : d)); // Eliminado
      return;
    }
    try {
      if (field === 'teamName') {
        const standing = standings.find(s => s.id === id);
        if (standing) {
          // await updateTeam(standing.teamId, { name: value }); // Eliminado
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
        // await updateStanding(id, { [field]: processedValue }); // Eliminado
      }
      // setModifiedRows(prev => new Set(prev).add(id)); // Eliminado
      if (["puntos", "goalsFor", "goalsAgainst"].includes(field)) {
        // setRefreshKey(prev => prev + 1); // Eliminado
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
    // setIsLoading(true); // Eliminado
    try {
      // Encontrar el standing actual
      const standing = standings.find(s => s.id === id);
      if (!standing) return;
      // Forzar blur de inputs de la fila
      const rowInputs = document.querySelectorAll<HTMLInputElement>(`input[data-row-id='${id}']`);
      rowInputs.forEach(input => input.blur());
      // Esperar un tick para que el blur se procese
      await new Promise(resolve => setTimeout(resolve, 0));
      // Actualizar en la base de datos
      // await updateStanding(id, { // Eliminado
      //   pj: Number(standing.pj), // Eliminado
      //   puntos: Number(standing.puntos), // Eliminado
      //   won: Number(standing.won), // Eliminado
      //   drawn: Number(standing.drawn), // Eliminado
      //   lost: Number(standing.lost), // Eliminado
      //   goalsFor: Number(standing.goalsFor), // Eliminado
      //   goalsAgainst: Number(standing.goalsAgainst) // Eliminado
      // }); // Eliminado
      // await refreshStandings(); // <-- Refrescar standings después de guardar // Eliminado
      // Remover de filas modificadas
      // setModifiedRows(prev => { // Eliminado
      //   const newSet = new Set(prev); // Eliminado
      //   newSet.delete(id); // Eliminado
      //   return newSet; // Eliminado
      // }); // Eliminado
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      // setIsLoading(false); // Eliminado
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
    // if (modifiedRows.size === 0 && !legendDirty && draftTeams.length === 0) return; // Eliminado
    // setIsLoading(true); // Eliminado
    try {
      // Guardar leyenda si fue modificada
      // if (legendDirty) { // Eliminado
      //   await standingsLegendService.upsertLegend(zoneId, categoryId, legend); // Eliminado
      //   setLegendDirty(false); // Eliminado
      // } // Eliminado
      // 5.1 Guardar equipos nuevos y standings // Eliminado
      // for (const draft of draftTeams) { // Eliminado
      //   // Crear equipo en Supabase // Eliminado
      //   const createdTeam = await addTeam({ // Eliminado
      //     name: draft.name, // Eliminado
      //     leagueId: draft.leagueId, // Eliminado
      //     categoryId: draft.categoryId, // Eliminado
      //     zoneId: draft.zoneId, // Eliminado
      //     logo: draft.logo // Eliminado
      //   }, { // Eliminado
      //     pj: draft.pj, // Eliminado
      //     won: draft.won, // Eliminado
      //     drawn: draft.drawn, // Eliminado
      //     lost: draft.lost, // Eliminado
      //     goalsFor: draft.goalsFor, // Eliminado
      //     goalsAgainst: draft.goalsAgainst, // Eliminado
      //     puntos: draft.puntos // Eliminado
      //   }); // Eliminado
      // } // Eliminado
      // setDraftTeams([]); // Eliminado
      // 5.2 Guardar standings editados // Eliminado
      // const updates = Array.from(modifiedRows).map(async (id) => { // Eliminado
      //   const standing = standings.find(s => s.id === id); // Eliminado
      //   if (!standing) return; // Eliminado
      //   await updateStanding(id, { // Eliminado
      //     pj: standing.pj, // Eliminado
      //     puntos: standing.puntos, // Eliminado
      //     won: standing.won, // Eliminado
      //     drawn: standing.drawn, // Eliminado
      //     lost: standing.lost, // Eliminado
      //     goalsFor: standing.goalsFor, // Eliminado
      //     goalsAgainst: standing.goalsAgainst // Eliminado
      //   }); // Eliminado
      // }); // Eliminado
      // await Promise.all(updates); // Eliminado
      // await refreshStandings(); // <-- Refrescar standings después de guardar todo // Eliminado
      // setModifiedRows(new Set()); // Eliminado
      // setRefreshKey(prev => prev + 1); // Eliminado
    } catch (error) {
      console.error('Error guardando standings:', error);
      alert('Error al guardar los datos. Intenta de nuevo.');
    } finally {
      // setIsLoading(false); // Eliminado
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
      // setIsLoading(true); // Eliminado
      try {
        // await deleteTeam(standing.teamId); // Eliminado
        // setRefreshKey(prev => prev + 1); // Eliminado
      } catch (error) {
        console.error('Error eliminando equipo:', error);
        alert('Error al eliminar el equipo. Inténtalo de nuevo.');
      } finally {
        // setIsLoading(false); // Eliminado
      }
    }
  };

  // Handler para eliminar posición/standing (draft o real)
  const handleDeletePosition = async (standing: Standing & { isDraft?: boolean }) => {
    // setIsLoading(true); // Eliminado
    try {
      if (standing.isDraft || (typeof standing.id === 'string' && standing.id.startsWith('draft_'))) {
        // setDraftTeams(prev => { // Eliminado
        //   const updated = prev.filter(d => d.tempId !== standing.id); // Eliminado
        //   setRefreshKey(k => k + 1); // Forzar refresco // Eliminado
        //   return updated; // Eliminado
        // }); // Eliminado
      } else if (typeof standing.id === 'string' && standing.id.startsWith('missing_')) {
        // No hacer nada, es solo visual
      } else {
        // await deleteTeam(standing.teamId); // Eliminado
        // await refreshStandings(); // Eliminado
      }
    } catch (error) {
      alert('Error al eliminar el equipo. Intenta de nuevo.');
      console.error('Error eliminando equipo:', error);
    } finally {
      // setIsLoading(false); // Eliminado
    }
  };

  const onSubmitNewTeam = async (data: NewTeamFormData) => {
    if (!validateStats(data)) return;
    // setDraftTeams(prev => [ // Eliminado
    //   ...prev, // Eliminado
    //   { // Eliminado
    //     tempId: `draft_${Date.now()}`, // Eliminado
    //     name: data.teamName, // Eliminado
    //     leagueId, // Eliminado
    //     categoryId, // Eliminado
    //     zoneId, // Eliminado
    //     logo: '', // Eliminado
    //     pj: data.pj, // Eliminado
    //     won: data.won, // Eliminado
    //     drawn: data.drawn, // Eliminado
    //     lost: data.lost, // Eliminado
    //     goalsFor: data.goalsFor, // Eliminado
    //     goalsAgainst: data.goalsAgainst, // Eliminado
    //     puntos: data.puntos // Eliminado
    //   } // Eliminado
    // ]); // Eliminado
    // setIsAddingTeam(false); // Eliminado
    reset();
  };

  const exportToCSV = (zoneId: string) => {
    if (typeof window === 'undefined') return; // Verificar entorno del navegador
    
    try {
      const zoneStandings = standings.filter(s => s.zoneId === zoneId);
      
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
          // setIsLoading(true); // Eliminado
          const reader = new FileReader();
          reader.onload = async (event) => {
            const csvData = event.target?.result as string;
            if (csvData) {
              try {
                // await importStandingsFromCSV(csvData, zoneId); // Eliminado
                // setRefreshKey(prev => prev + 1); // Eliminado
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
          // setIsLoading(false); // Eliminado
        }
      }
    };
    input.click();
  };

  // Obtener la zona actual
  // Elimina la línea que usa currentZone y cualquier referencia a t.zone, ya que ya no se usa en el render limpio de la tabla por liga.
  useEffect(() => {
    // setLegendValue(currentZone?.legend || ''); // Eliminado
  }, []);

  // Cargar leyenda al cambiar zona/categoría
  useEffect(() => {
    if (!zoneId || !categoryId) return;
    // setLegendLoading(true); // Eliminado
    // standingsLegendService.getLegend(zoneId, categoryId) // Eliminado
    //   .then(data => setLegend(data?.leyenda || '')) // Eliminado
    //   .finally(() => setLegendLoading(false)); // Eliminado
    // setLegendDirty(false); // Eliminado
  }, [zoneId, categoryId]);

  // Guardar leyenda
  const handleSaveLegend = async () => {
    // setLegendLoading(true); // Eliminado
    // await standingsLegendService.upsertLegend(zoneId, categoryId, legend); // Eliminado
    // setLegendDirty(false); // Eliminado
    // setLegendLoading(false); // Eliminado
  };

  // ============ SECCIÓN 1: Estado para ordenamiento manual ============
  // const [manualOrder, setManualOrder] = useState<(Standing & { orden?: number })[]>([]); // Eliminado
  // const [hasManualOrder, setHasManualOrder] = useState(false); // Eliminado

  // ============ SECCIÓN 2: Sincronización mejorada ============
  // useEffect(() => { // Eliminado
  //   // Detectar si hay orden manual en los datos // Eliminado
  //   const realStandings = sortedStandings.filter(s =>  // Eliminado
  //     !String(s.id).startsWith('missing_') &&  // Eliminado
  //     !String(s.id).startsWith('draft_') // Eliminado
  //   ); // Eliminado
  //   const hasOrderValues = realStandings.some(s =>  // Eliminado
  //     typeof s.orden === 'number' && s.orden > 0 // Eliminado
  //   ); // Eliminado
  //   if (hasOrderValues) { // Eliminado
  //     // Hay orden manual en los datos // Eliminado
  //     const orderedStandings = [...realStandings].sort((a, b) => { // Eliminado
  //       if (typeof a.orden === 'number' && typeof b.orden === 'number') { // Eliminado
  //         return a.orden - b.orden; // Eliminado
  //       } // Eliminado
  //       return 0; // Eliminado
  //     }); // Eliminado
  //     setManualOrder(orderedStandings.map(s => ({ ...s, id: String(s.id) }))); // Eliminado
  //     setHasManualOrder(true); // Eliminado
  //   } else { // Eliminado
  //     // No hay orden manual, usar orden automático // Eliminado
  //     setManualOrder(realStandings.map(s => ({ ...s, id: String(s.id) }))); // Eliminado
  //     setHasManualOrder(false); // Eliminado
  //   } // Eliminado
  // }, [sortedStandings]); // Eliminado

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
  // const [movingTeamId, setMovingTeamId] = useState<string | null>(null); // Eliminado

  // Mueve la declaración de displayStandings antes de moveStanding
  // const displayStandings = useMemo(() => { // Eliminado
  //   if (hasManualOrder) { // Eliminado
  //     return manualOrder.map(s => ({ ...s, id: String(s.id) })); // Eliminado
  //   } // Eliminado
  //   return sortedStandings // Eliminado
  //     .filter(standing =>  // Eliminado
  //       !String(standing.id).startsWith('missing_') &&  // Eliminado
  //       !String(standing.id).startsWith('draft_') // Eliminado
  //     ) // Eliminado
  //     .map(s => ({ ...s, id: String(s.id) })); // Eliminado
  // }, [hasManualOrder, manualOrder, sortedStandings]); // Eliminado

  // Determina si hay orden manual
  // const hasManualOrderInData = displayStandings.some(s => typeof s.orden === 'number' && s.orden > 0); // Eliminado

  // Ordena por orden manual si existe, si no por puntos
  // const orderedStandings = useMemo(() => { // Eliminado
  //   if (hasManualOrderInData) { // Eliminado
  //     return [...displayStandings].sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999)); // Eliminado
  //   } // Eliminado
  //   // Orden automático por puntos, diferencia de gol, etc. // Eliminado
  //   return [...displayStandings].sort((a, b) => { // Eliminado
  //     if (b.puntos !== a.puntos) return b.puntos - a.puntos; // Eliminado
  //     const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0); // Eliminado
  //     const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0); // Eliminado
  //     if (bDiff !== aDiff) return bDiff - aDiff; // Eliminado
  //     if ((b.goalsFor || 0) !== (a.goalsFor || 0)) return (b.goalsFor || 0) - (a.goalsFor || 0); // Eliminado
  //     return (a.pj || 0) - (b.pj || 0); // Eliminado
  //   }); // Eliminado
  // }, [displayStandings, hasManualOrderInData]); // Eliminado

  // 2. moveStanding robusto y con feedback visual
  // const moveStanding = useCallback(async (index: number, direction: 'up' | 'down') => { // Eliminado
  //   if (!isAuthenticated) { // Eliminado
  //     alert('Debes iniciar sesión para realizar esta acción'); // Eliminado
  //     return; // Eliminado
  //   } // Eliminado
  //   if ((direction === 'up' && index === 0) || (direction === 'down' && index === displayStandings.length - 1)) { // Eliminado
  //     return; // Eliminado
  //   } // Eliminado
  //   setIsLoading(true); // Eliminado
  //   setMovingTeamId(displayStandings[index].teamId); // Eliminado
  //   try { // Eliminado
  //     const newOrder = [...displayStandings]; // Eliminado
  //     const swapIndex = direction === 'up' ? index - 1 : index + 1; // Eliminado
  //     [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]]; // Eliminado
  //     const orderedStandings = newOrder.map((standing, idx) => ({ // Eliminado
  //       ...standing, // Eliminado
  //       orden: idx + 1 // Eliminado
  //     })); // Eliminado
  //     setManualOrder(orderedStandings); // Eliminado
  //     setHasManualOrder(true); // Eliminado
  //     const updates = orderedStandings.map((standing, idx) => ({ // Eliminado
  //       equipo_id: Number(standing.teamId), // Eliminado
  //       zona_id: Number(standing.zoneId), // Eliminado
  //       categoria_id: Number(standing.categoryId), // Eliminado
  //       orden: idx + 1 // Eliminado
  //     })); // Eliminado
  //     await updateEditablePositionsOrder(updates); // Eliminado
  //     await refreshStandings(); // Eliminado
  //   } catch (error: any) { // Eliminado
  //     console.error('Error al mover equipo:', error); // Eliminado
  //     setManualOrder([...displayStandings]); // Eliminado
  //     alert(`Error al actualizar el orden: ${error.message || error}`); // Eliminado
  //   } finally { // Eliminado
  //     setIsLoading(false); // Eliminado
  //     setMovingTeamId(null); // Eliminado
  //   } // Eliminado
  // }, [displayStandings, isAuthenticated, refreshStandings]); // Eliminado

  // ============ SECCIÓN 4: Función para resetear orden manual ============
  // 4. resetManualOrder robusto
  const resetManualOrder = async () => {
    try {
      // setIsLoading(true); // Eliminado
      // Obtener standings reales para resetear // Eliminado
      const realStandings = standings.filter(s => 
        !String(s.id).startsWith('missing_') && 
        !String(s.id).startsWith('draft_')
      );
      // Limpiar órdenes en la base de datos // Eliminado
      const updates = realStandings.map((standing) => ({
        equipo_id: Number(standing.teamId),
        zona_id: Number(standing.zoneId),
        categoria_id: Number(standing.categoryId),
        orden: 0 // Resetear a 0
      }));
      await updateEditablePositionsOrder(updates);
      // await refreshStandings(); // Eliminado
      // Actualizar estado local // Eliminado
      setStandings(realStandings.map(s => ({ ...s, id: String(s.id), orden: 0 })));
      setHasManualOrder(false);
      setOrderDirty(false);
    } catch (error) {
      console.error('Error al resetear orden:', error);
      alert('Error al resetear el orden. Intenta de nuevo.');
    } finally {
      // setIsLoading(false); // Eliminado
    }
  };

  // ============ SECCIÓN 5: Detectar si hay orden manual en los datos ============
  // 5. Detectar si hay orden manual en los datos
  useEffect(() => {
    // Solo verificar en standings reales
    const realStandings = standings.filter(s => 
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
  }, [standings, hasManualOrder]);

  // ============ SECCIÓN 6: Agregar botón de reseteo en la UI ============
  // En la sección de botones:
  // {hasManualOrder && ( // Eliminado
  //   <button // Eliminado
  //     onClick={resetManualOrder} // Eliminado
  //     className="btn btn-sm btn-outline flex items-center space-x-1" // Eliminado
  //     disabled={isLoading} // Eliminado
  //     title="Resetear orden manual y volver al automático" // Eliminado
  //   > // Eliminado
  //     <RefreshCw size={16} /> // Eliminado
  //     <span>Orden Auto</span> // Eliminado
  //   </button> // Eliminado
  // )} // Eliminado

  // ============ SECCIÓN 7: Usar los datos correctos en el render ============
  // 1. displayStandings con useMemo y solo standings reales
  // const displayStandings = useMemo(() => { // Eliminado
  //   if (hasManualOrder) { // Eliminado
  //     return manualOrder.map(s => ({ ...s, id: String(s.id) })); // Eliminado
  //   } // Eliminado
  //   // Usar solo standings reales ordenados automáticamente // Eliminado
  //   return sortedStandings // Eliminado
  //     .filter(standing =>  // Eliminado
  //       !String(standing.id).startsWith('missing_') &&  // Eliminado
  //       !String(standing.id).startsWith('draft_') // Eliminado
  //     ) // Eliminado
  //     .map(s => ({ ...s, id: String(s.id) })); // Eliminado
  // }, [hasManualOrder, manualOrder, sortedStandings]); // Eliminado

  // Ordena standings por orden manual si existe, si no por puntos
  // Lógica igual a la tabla pública:
  // Cambia el filtrado de standings para que solo filtre por leagueId
  const filteredStandings = standings.filter(s => String(s.leagueId) === String(leagueId));
  // Ordenar standings igual que la vista pública
  const sortedStandings = useMemo(() => {
    return standings.slice().sort((a: any, b: any) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0);
      const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0);
      if (bDiff !== aDiff) return bDiff - aDiff;
      if ((b.goalsFor || 0) !== (a.goalsFor || 0)) return (b.goalsFor || 0) - (a.goalsFor || 0);
      if ((a.pj || 0) !== (b.pj || 0)) return (a.pj || 0) - (b.pj || 0);
      const teamA = teams.find(t => t.id === a.equipo_id || t.id === a.teamId)?.name || '';
      const teamB = teams.find(t => t.id === b.equipo_id || t.id === b.teamId)?.name || '';
      return teamA.localeCompare(teamB);
    });
  }, [standings, teams]);

  // Deduplicar por teamId priorizando equipo_nombre no vacío
  const uniqueStandingsMap = new Map();
  for (const s of sortedStandings) {
    if (!uniqueStandingsMap.has(s.teamId) || ((s as any).equipo_nombre && (s as any).equipo_nombre.trim() !== '')) {
      uniqueStandingsMap.set(s.teamId, s);
    }
  }
  const displayStandings = Array.from(uniqueStandingsMap.values());

  // Busca el nombre del equipo siempre desde el array global de equipos
  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  };

  // Si usás useMemo para standings ordenados, agrega teams como dependencia
  // const sortedStandings = useMemo(() => { // Eliminado
  //   return filteredStandings // Eliminado
  //     .slice() // Eliminado
  //     .sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999)); // Eliminado
  // }, [filteredStandings, teams]); // Eliminado

  // 2. Redefine moveStanding para usar displayStandings
  const moveStanding = (index: number, direction: 'up' | 'down') => {
    setStandings(prev => {
      const arr = displayStandings.slice();
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr.map((s, idx) => ({ ...s, orden: idx + 1 }));
    });
    setOrderDirty(true);
  };

  // Ordenar standings igual que la pública
  // const sortedStandings = useMemo(() => { // Eliminado
  //   return standings.slice().sort((a: any, b: any) => { // Eliminado
  //     if (b.puntos !== a.puntos) return b.puntos - a.puntos; // Eliminado
  //     const aDiff = (a.goalsFor || 0) - (a.goalsAgainst || 0); // Eliminado
  //     const bDiff = (b.goalsFor || 0) - (b.goalsAgainst || 0); // Eliminado
  //     if (bDiff !== aDiff) return bDiff - aDiff; // Eliminado
  //     if ((b.goalsFor || 0) !== (a.goalsFor || 0)) return (b.goalsFor || 0) - (a.goalsFor || 0); // Eliminado
  //     if ((a.pj || 0) !== (b.pj || 0)) return (a.pj || 0) - (b.pj || 0); // Eliminado
  //     const teamA = teams.find(t => t.id === a.equipo_id || t.id === a.teamId)?.name || ''; // Eliminado
  //     const teamB = teams.find(t => t.id === b.equipo_id || t.id === b.teamId)?.name || ''; // Eliminado
  //     return teamA.localeCompare(teamB); // Eliminado
  //   }); // Eliminado
  // }, [standings, teams]); // Eliminado

  if (!zoneId || !categoryId) {
    return <div className="text-center py-8 text-gray-500">Selecciona una zona y una categoría para ver la tabla de posiciones.</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tabla de Posiciones</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PJ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStandings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No hay equipos en esta zona/categoría.
                  </td>
                </tr>
              ) : (
                sortedStandings.map((standing: any, index: number) => {
                  const team = teams.find(t => t.id === standing.equipo_id || t.id === standing.teamId);
                  return (
                    <tr key={standing.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{team?.name || standing.equipo_nombre || 'Equipo desconocido'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{standing.pj}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{standing.puntos}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable;