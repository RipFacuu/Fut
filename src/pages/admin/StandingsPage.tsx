import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLeague, Standing, Team } from '../../contexts/LeagueContext';
import { Download, Edit, Save, X, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  obtenerPosicionesPorZona, 
  crearPosicion, 
  actualizarPosicion, 
  eliminarPosicion 
} from '../../lib/supabase';
import type { Database } from '../../types/database';

type PosicionRow = Database['public']['Tables']['posiciones']['Row'];

interface EditableCellProps {
  value: number | string;
  standing: Standing;
  field: keyof Standing | 'teamName';
  onUpdate: (id: string, field: keyof Standing | 'teamName', value: any) => void;
  type?: 'number' | 'text';
  min?: number;
}

const EditableCell: React.FC<EditableCellProps> = React.memo(({ 
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

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    
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
      onUpdate(standing.id, field, finalValue);
    }
  }, [tempValue, value, standing.id, field, onUpdate, type, min]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  }, [handleBlur, value]);

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
    onUpdate(standing.id, 'teamId', selectedTeamId);
    setIsEditing(false);
  }, [standing.id, onUpdate]);

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
});

const StandingsPage: React.FC = () => {
  const { 
    leagues, 
    teams,
    getCategoriesByLeague, 
    getZonesByCategory,
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
  const [localStandings, setLocalStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get categories for selected league
  const leagueCategories = useMemo(() => getCategoriesByLeague(selectedLeague), [selectedLeague, getCategoriesByLeague]);
  
  // Get zones for selected category
  const categoryZones = useMemo(() => getZonesByCategory(selectedCategory), [selectedCategory, getZonesByCategory]);
  
  // Get teams for the selected zone
  const zoneTeams = useMemo(() => selectedZone ? getTeamsByZone(selectedZone) : [], [selectedZone, getTeamsByZone]);
  
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
  
  // Cargar standings desde la base de datos
  useEffect(() => {
    const loadStandings = async () => {
      if (!selectedZone) {
        setLocalStandings([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const posiciones = await obtenerPosicionesPorZona(selectedZone);
        
        // Convertir los datos de la tabla 'posiciones_editable' al formato Standing
        const standingsData = posiciones.map((pos, index) => ({
          id: `${pos.equipo_id}-${pos.zona_id}`, // ID compuesto
          teamId: pos.equipo_id,
          leagueId: selectedLeague, // Usar el seleccionado
          categoryId: selectedCategory, // Usar el seleccionado
          zoneId: pos.zona_id,
          puntos: pos.puntos || 0,
          pj: pos.pj || 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0
        }));
        
        setLocalStandings(standingsData);
      } catch (error) {
        console.error('Error cargando posiciones:', error);
        setError('Error al cargar las posiciones. Por favor, inténtalo de nuevo.');
        setLocalStandings([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadStandings();
  }, [selectedZone, selectedLeague, selectedCategory]);
  
  // Create standings for teams that don't have them yet - MEJORADA
  const completeStandings = useMemo(() => {
    if (!selectedZone || zoneTeams.length === 0) return [];
    
    console.log('🔄 Recalculando completeStandings...');
    console.log('📊 localStandings:', localStandings);
    console.log('👥 zoneTeams:', zoneTeams);
    
    const standingsMap = new Map(localStandings.map(s => [s.teamId, s]));
    
    const result = zoneTeams
      .filter(team => team && team.id)
      .map(team => {
        const existingStanding = standingsMap.get(team.id);
        
        if (existingStanding) {
          return existingStanding;
        }
        
        // ✅ ID temporal más simple y consistente
        const tempId = `temp-${team.id}`;
        
        return {
          id: tempId,
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
      });
    
    console.log('✅ completeStandings calculado:', result);
    return result;
  }, [selectedZone, zoneTeams, localStandings, selectedLeague, selectedCategory]);
  
  // Sort standings by points (descending) and then by goal difference
  const sortedStandings = useMemo(() => {
    return [...completeStandings].sort((a, b) => {
      if (a.puntos !== b.puntos) {
        return b.puntos - a.puntos; // Sort by points (descending)
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
  }, [completeStandings]);
  
  // Initialize select values
  useEffect(() => {
    if (categoryZones.length > 0 && !selectedZone) {
      setSelectedZone(categoryZones[0].id);
    }
  }, [categoryZones, selectedZone]);
  
  const handleLeagueChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const leagueId = e.target.value;
    setSelectedLeague(leagueId);
    setSelectedCategory('');
    setSelectedZone('');
    setModifiedRows(new Set()); // Limpiar modificaciones
  }, []);
  
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedZone('');
    setModifiedRows(new Set()); // Limpiar modificaciones
  }, []);
  
  // Get team name by ID
  const getTeamName = useCallback((teamId: string): string => {
    const team = teams.find(team => team.id === teamId);
    return team ? team.name : 'Equipo desconocido';
  }, [teams]);
  
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
  }, [completeStandings, updateTeam]);
  
  // Función para guardar una fila - ACTUALIZADA para el nuevo esquema
  const handleSaveRow = useCallback(async (standing: Standing) => {
    console.log('💾 Intentando guardar fila:', standing);
    
    if (!standing || !standing.teamId) {
      console.error('❌ Standing inválido:', standing);
      setError('Error: Datos de equipo inválidos.');
      return;
    }
    
    // Buscar en completeStandings
    const currentStanding = completeStandings.find(s => s.id === standing.id);
    if (!currentStanding) {
      console.error('❌ Standing no encontrado en completeStandings:', standing.id);
      setError('Error: No se encontraron los datos actualizados.');
      return;
    }
    
    console.log('📊 Standing a guardar:', currentStanding);
    
    if (!validateStandingData(currentStanding)) {
      console.error('❌ Validación fallida para:', currentStanding);
      setError('Datos inválidos. Verifica puntos y partidos jugados.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const teamName = getTeamName(currentStanding.teamId);
      
      if (currentStanding.id.startsWith('temp-')) {
        console.log('🆕 Creando nueva posición...');
        
        const posicionData = {
          equipo_id: currentStanding.teamId,
          zona_id: currentStanding.zoneId,
          equipo_nombre: teamName,
          puntos: Number(currentStanding.puntos) || 0,
          pj: Number(currentStanding.pj) || 0
        };
        
        console.log('📤 Datos a crear:', posicionData);
        const result = await crearPosicion(posicionData);
        
        if (!result || !result[0]) {
          throw new Error('No se recibió respuesta válida de la base de datos');
        }
        
        console.log('✅ Nueva posición creada:', result[0]);
        
        // Actualizar estado local con el nuevo ID
        const newId = `${currentStanding.teamId}-${currentStanding.zoneId}`;
        setLocalStandings(prev => {
          return prev.map(s =>
            s.id === currentStanding.id
              ? { ...currentStanding, id: newId }
              : s
          );
        });
        
      } else {
        console.log('📝 Actualizando posición existente...');
        
        const updateData = {
          puntos: Number(currentStanding.puntos) || 0,
          pj: Number(currentStanding.pj) || 0,
          equipo_nombre: teamName
        };
        
        console.log('📤 Datos de actualización:', updateData);
        
        const result = await actualizarPosicion(currentStanding.teamId, updateData);
        console.log('✅ Resultado actualización:', result);
        
        // Actualizar estado local
        setLocalStandings(prev => {
          return prev.map(s =>
            s.teamId === currentStanding.teamId
              ? { ...s, puntos: updateData.puntos, pj: updateData.pj }
              : s
          );
        });
      }
      
      // Remover de filas modificadas
      setModifiedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(standing.id);
        return newSet;
      });
      
      console.log('✅ Guardado exitoso');
      setError(null);
      
    } catch (error) {
      console.error('❌ Error guardando:', error);
      setError(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [completeStandings, validateStandingData, getTeamName]);
  
  // Función para guardar todos los cambios - CORREGIDA sin recarga
  const handleSaveAll = useCallback(async () => {
    if (modifiedRows.size === 0) {
      setError('No hay cambios para guardar.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Guardando todos los cambios...');
      
      const updatedStandings: Standing[] = [];
      
      for (const standingId of Array.from(modifiedRows)) {
        const standing = completeStandings.find(s => s.id === standingId);
        if (!standing || !validateStandingData(standing)) {
          throw new Error(`Datos inválidos para standing ${standingId}`);
        }
        
        try {
          if (standing?.id?.startsWith('temp-')) {
            const result: PosicionRow[] = await crearPosicion({
              equipo_id: standing.teamId,
              zona_id: standing.zoneId,
              liga_id: standing.leagueId,
              categoria_id: standing.categoryId,
              puntos: standing.puntos || 0,
              pj: standing.pj || 0
            });
            
            // Guardar el standing actualizado con el nuevo ID
            updatedStandings.push({
              ...standing,
              id: result[0].id
            });
          } else {
            await actualizarPosicion(standing.id, {
              puntos: standing.puntos,
              pj: standing.pj
            });
            
            // Guardar el standing actualizado
            updatedStandings.push(standing);
          }
        } catch (error) {
          console.error(`Error guardando standing ${standingId}:`, error);
          throw error;
        }
      }
      
      // ACTUALIZAR ESTADO LOCAL EN UNA SOLA OPERACIÓN - SIN RECARGA
      setLocalStandings(prev => {
        const updatedMap = new Map(updatedStandings.map(s => [s.teamId, s]));
        
        return prev.map(standing => {
          const updated = updatedStandings.find(u => 
            u.teamId === standing.teamId || u.id === standing.id
          );
          return updated || standing;
        });
      });
      
      // Limpiar filas modificadas
      setModifiedRows(new Set());
      
      console.log('✅ Todos los cambios guardados exitosamente');
      setError(null);
      
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
      setError(`Error al guardar algunos datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [modifiedRows, completeStandings, validateStandingData]);

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
    console.log('🔍 Estado actual:'); 
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
  }, [selectedZone, selectedLeague, selectedCategory]); 
  
  // Ejecutar test una vez al montar 
  useEffect(() => { 
    testSupabaseFunctions(); 
  }, [testSupabaseFunctions]);
  
  // Add existing team to standings
  const handleAddExistingTeam = useCallback(async () => {
    if (!selectedTeamId || !selectedZone) return;
    
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Crear directamente en la base de datos
      const result: PosicionRow[] = await crearPosicion({
        equipo_id: team.id,
        zona_id: selectedZone,
        liga_id: selectedLeague,
        categoria_id: selectedCategory,
        puntos: 0,
        pj: 0
      });
      
      // Actualizar estado local
      const newStanding: Standing = {
        id: result[0].id,
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
        goalsAgainst: 0
      };
      
      setLocalStandings(prev => [...prev, newStanding]);
      
      // También agregar al contexto
      addStanding(newStanding);
      
      setIsAddingTeam(false);
      setSelectedTeamId('');
    } catch (error) {
      console.error('Error agregando equipo:', error);
      setError('Error al agregar el equipo.');
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId, selectedZone, teams, selectedLeague, selectedCategory, addStanding]);

  // Handle adding a new team
  const handleAddTeam = useCallback(() => {
    setIsAddingTeam(true);
  }, []);

  // Handle submitting a new team - CORREGIDA validación
  const onSubmitNewTeam = useCallback(async (data: any) => {
    if (!data.teamName || !selectedLeague || !selectedCategory || !selectedZone) {
      setError('Faltan datos requeridos para crear el equipo.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Crear el equipo
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: data.teamName,
        leagueId: selectedLeague,
        categoryId: selectedCategory,
        zoneId: selectedZone
      };
      
      addTeam(newTeam);
      
      // Crear la posición en la base de datos
      const result: PosicionRow[] = await crearPosicion({
        equipo_id: newTeam.id,
        zona_id: selectedZone,
        liga_id: selectedLeague,
        categoria_id: selectedCategory,
        puntos: 0,
        pj: 0
      });
      
      // Crear el standing
      const newStanding: Standing = {
        id: result[0].id,
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
        goalsAgainst: 0
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

  // Handle deleting a team
  const handleDeleteTeam = useCallback(async (standing: Standing) => {
    if (!standing || !standing.id) {
      setError('Standing inválido para eliminar.');
      return;
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${getTeamName(standing.teamId)} de la tabla?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Solo eliminar de la base de datos si no es temporal
      if (!standing.id.startsWith('temp-')) {
        await eliminarPosicion(standing.id);
        console.log('✅ Posición eliminada de la base de datos');
      }
      
      // ACTUALIZAR SOLO EL ESTADO LOCAL - SIN RECARGA
      setLocalStandings(prev => prev.filter(s => s.id !== standing.id));
      
      // Remover de filas modificadas
      setModifiedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(standing.id);
        return newSet;
      });
      
      console.log('✅ Equipo eliminado exitosamente');
      setError(null);
      
    } catch (error) {
      console.error('❌ Error eliminando posición:', error);
      setError(`Error al eliminar la posición: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [getTeamName]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
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

          <div className="px-6 py-8">
            {/* Filtros mejorados con diseño de tarjetas */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-violet-500 rounded-full mr-3"></div>
                Filtros de Búsqueda
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="group">
                  <label htmlFor="league" className="block text-sm font-semibold text-gray-700 mb-2">
                    Liga
                  </label>
                  <div className="relative">
                    <select
                      id="league"
                      value={selectedLeague}
                      onChange={handleLeagueChange}
                      className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-300"
                    >
                      <option value="">Seleccionar liga</option>
                      {leagues.map(league => (
                        <option key={league.id} value={league.id}>
                          {league.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoría
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      disabled={!selectedLeague}
                      className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400 group-hover:border-gray-300"
                    >
                      <option value="">Seleccionar categoría</option>
                      {leagueCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="zone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Zona
                  </label>
                  <div className="relative">
                    <select
                      id="zone"
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      disabled={!selectedCategory}
                      className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400 group-hover:border-gray-300"
                    >
                      <option value="">Seleccionar zona</option>
                      {categoryZones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
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

            {/* Tabla de posiciones mejorada */}
            {selectedZone && (
              <div className="space-y-6">
                {/* Barra de acciones mejorada */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveAll}
                      disabled={modifiedRows.size === 0 || loading}
                      className={cn(
                        "inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105",
                        modifiedRows.size > 0 && !loading
                          ? "text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                          : "text-gray-400 bg-gray-200 cursor-not-allowed"
                      )}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                      {modifiedRows.size > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {modifiedRows.size}
                        </span>
                      )}
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
                    onClick={handleAddTeam}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Equipo
                  </button>
                </div>

                {/* Tabla responsive mejorada */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
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
                          <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Equipo
                          </th>
                          <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              <span className="hidden sm:inline">Partidos</span>
                              <span className="sm:hidden">PJ</span>
                            </div>
                          </th>
                          <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              <span className="hidden sm:inline">Puntos</span>
                              <span className="sm:hidden">PTS</span>
                            </div>
                          </th>
                          <th className="px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {sortedStandings.map((standing, index) => (
                          <tr 
                            key={standing.id} 
                            className={cn(
                              "hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all duration-200",
                              modifiedRows.has(standing.id) && "bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400",
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
                              type="text"
                            />
                            <EditableCell
                              value={standing.pj}
                              standing={standing}
                              field="pj"
                              onUpdate={handleUpdate}
                              type="number"
                              min={0}
                            />
                            <EditableCell
                              value={standing.puntos}
                              standing={standing}
                              field="puntos"
                              onUpdate={handleUpdate}
                              type="number"
                              min={0}
                            />
                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleSaveRow(standing)}
                                  disabled={loading || !modifiedRows.has(standing.id)}
                                  title={modifiedRows.has(standing.id) ? "Guardar cambios" : "No hay cambios para guardar"}
                                  className={cn(
                                    "inline-flex items-center p-2.5 border border-transparent rounded-lg text-xs transition-all duration-200 transform hover:scale-110",
                                    modifiedRows.has(standing.id) && !loading
                                      ? "text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                                      : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                  )}
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(standing)}
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
                  
                  {/* Footer de la tabla */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-600">
                      <div className="mb-2 sm:mb-0">
                        Total de equipos: <span className="font-semibold text-gray-900">{sortedStandings.length}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {modifiedRows.size > 0 && (
                          <div className="flex items-center text-amber-600">
                            <div className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></div>
                            {modifiedRows.size} cambio{modifiedRows.size !== 1 ? 's' : ''} pendiente{modifiedRows.size !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal mejorado para agregar equipo */}
            {isAddingTeam && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                <div className="relative bg-white shadow-2xl rounded-2xl border border-gray-200 w-full max-w-md transform transition-all duration-300 scale-100">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-white">
                      Agregar Equipo Existente
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    {availableTeams.length > 0 ? (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Seleccionar equipo:
                          </label>
                          <div className="relative">
                            <select
                              value={selectedTeamId}
                              onChange={(e) => setSelectedTeamId(e.target.value)}
                              className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            >
                              {availableTeams.map(team => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setIsAddingTeam(false)}
                            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleAddExistingTeam}
                            disabled={!selectedTeamId || loading}
                            className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-gray-500 mb-6 font-medium">
                          No hay equipos disponibles para agregar a esta zona.
                        </p>
                        <button
                          onClick={() => setIsAddingTeam(false)}
                          className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105"
                        >
                          Cerrar
                        </button>
                      </div>
                    )}
                  </div>
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
