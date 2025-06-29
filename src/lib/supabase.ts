import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = 'https://mdulwygjcqvcyjyxtpum.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdWx3eWdqY3F2Y3lqeXh0cHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTg3MTksImV4cCI6MjA2NDA3NDcxOX0.Dn6xzntOZKS0OBIbNjci0hnwv6Iu7ZPaFSzzyxqpBp0'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Función helper para mapear IDs de liga (movida fuera de la función)
export function getNumericLeagueId(leagueStringId: string): number {
  const leagueMap: { [key: string]: number } = {
    'liga_masculina': 1,
    'lifufe': 2,
    'mundialito': 3
  };
  
  // Si ya es un número, devolverlo como está
  if (!isNaN(Number(leagueStringId))) {
    return Number(leagueStringId);
  }
  
  // Si es un string, mapear al número correspondiente
  return leagueMap[leagueStringId] || 1; // Default a Liga Masculina si no se encuentra
}

// Funciones para Zonas
export async function obtenerZonasPorLigaYCategoria(ligaId: string, categoriaId: string) {
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('liga_id', ligaId)
    .eq('categoria_id', categoriaId);

  if (error) {
    console.error('Error obteniendo zonas:', error);
    return [];
  }

  return data;
}

// Funciones para Equipos
export async function agregarEquipo(nombre: string, zonaId: string, logo?: string) {
  const { data, error } = await supabase
    .from('equipos')
    .insert([{ 
      nombre, 
      zona_id: zonaId,
      logo: logo || null
    }])
    .select();

  if (error) {
    console.error('Error agregando equipo:', error);
    return null;
  }

  return data;
}

export async function obtenerEquiposPorZona(zonaId: string) {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('zona_id', zonaId);

  if (error) {
    console.error('Error obteniendo equipos:', error);
    return [];
  }

  return data;
}

// Función para obtener todos los equipos
export async function obtenerTodosLosEquipos() {
  const { data, error } = await supabase
    .from('equipos')
    .select('*');

  if (error) {
    console.error('Error obteniendo todos los equipos:', error);
    return [];
  }

  return data;
}

// Funciones para Partidos
export async function crearPartido(equipoLocalId: string, equipoVisitanteId: string, zonaId: string, fecha: string) {
  const { data, error } = await supabase
    .from('partidos')
    .insert([{ 
      equipo_local_id: equipoLocalId, 
      equipo_visitante_id: equipoVisitanteId, 
      zona_id: zonaId, 
      fecha 
    }])
    .select();

  if (error) {
    console.error('Error creando partido:', error);
    return null;
  }

  return data;
}

export async function obtenerPartidosConEquiposYResultados() {
  const { data, error } = await supabase
    .from('partidos')
    .select(`
      id,
      fecha,
      resultado_local,
      resultado_visitante,
      equipo_local: equipos!partidos_equipo_local_id_fkey (id, nombre),
      equipo_visitante: equipos!partidos_equipo_visitante_id_fkey (id, nombre),
      zona: zonas!partidos_zona_id_fkey (id, nombre)
    `);

  if (error) {
    console.error('Error obteniendo partidos:', error);
    return [];
  }

  return data;
}

export async function actualizarResultadoPartido(partidoId: string, resultadoLocal: number, resultadoVisitante: number) {
  const { data, error } = await supabase
    .from('partidos')
    .update({ 
      resultado_local: resultadoLocal, 
      resultado_visitante: resultadoVisitante 
    })
    .eq('id', partidoId)
    .select();

  if (error) {
    console.error('Error actualizando resultado:', error);
    return null;
  }

  return data;
}

// Funciones para Ligas
export async function obtenerLigas() {
  const { data, error } = await supabase
    .from('ligas')
    .select('*');

  if (error) {
    console.error('Error obteniendo ligas:', error);
    return [];
  }

  return data;
}

// Funciones para Categorías
export async function obtenerCategoriasPorLiga(ligaId: string) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('liga_id', ligaId);

  if (error) {
    console.error('Error obteniendo categorías:', error);
    return [];
  }

  return data;
}

export async function crearCategoria(nombre: string, ligaId: string) {
  const { data, error } = await supabase
    .from('categorias')
    .insert([{ 
      nombre, 
      liga_id: ligaId
    }])
    .select();

  if (error) {
    console.error('Error creando categoría:', error);
    return null;
  }

  return data;
}

// Funciones para Zonas
export async function crearZona(nombre: string, ligaId: string, categoriaId: string) {
  const { data, error } = await supabase
    .from('zonas')
    .insert([{ 
      nombre, 
      liga_id: ligaId, 
      categoria_id: categoriaId 
    }])
    .select();

  if (error) {
    console.error('Error creando zona:', error);
    return null;
  }

  return data;
}

// Función helper para obtener IDs numéricos
export async function getNumericIds(equipoUuid: string | null, zonaUuid: string, ligaUuid?: string, categoriaUuid?: string) {
  try {
    const promises = [];
    let promiseIndex = 0;
    const indexMap: { [key: string]: number } = {};

    // Zona (siempre requerida)
    promises.push(supabase.from('zonas').select('id').eq('id', zonaUuid).single());
    indexMap.zona = promiseIndex++;

    // Equipo (opcional)
    if (equipoUuid) {
      promises.push(supabase.from('equipos').select('id').eq('id', equipoUuid).single());
      indexMap.equipo = promiseIndex++;
    }

    // Liga (opcional)
    if (ligaUuid) {
      promises.push(supabase.from('ligas').select('id').eq('id', ligaUuid).single());
      indexMap.liga = promiseIndex++;
    }

    // Categoría (opcional)
    if (categoriaUuid) {
      promises.push(supabase.from('categorias').select('id').eq('id', categoriaUuid).single());
      indexMap.categoria = promiseIndex++;
    }

    const results = await Promise.all(promises);
    
    // Verificar errores
    for (const result of results) {
      if (result.error) {
        console.error('Error obteniendo ID numérico:', result.error);
        throw new Error(`No se pudo obtener ID numérico: ${result.error.message}`);
      }
    }

    return {
      equipo_id: equipoUuid ? results[indexMap.equipo]?.data?.id || null : null,
      zona_id: results[indexMap.zona]?.data?.id || null,
      liga_id: ligaUuid ? results[indexMap.liga]?.data?.id || null : null,
      categoria_id: categoriaUuid ? results[indexMap.categoria]?.data?.id || null : null
    };
  } catch (error) {
    console.error('Error en getNumericIds:', error);
    throw error;
  }
}

// Nueva función para agregar equipo con todos los campos
export async function agregarEquipoCompleto(nombre: string, zonaId: string, ligaId: string, categoriaId: string, logo?: string) {
  try {
    // Convertir UUIDs a IDs numéricos
    const numericIds = await getNumericIds(null, zonaId, ligaId, categoriaId);
    
    // Asegurar que liga_id sea numérico
    const numericLeagueId = getNumericLeagueId(ligaId);
    
    const { data, error } = await supabase
      .from('equipos')
      .insert([{ 
        nombre, 
        zona_id: numericIds.zona_id,
        liga_id: numericLeagueId, // Usar el ID numérico mapeado
        categoria_id: numericIds.categoria_id,
        logo: logo || null
      }])
      .select();

    if (error) {
      console.error('Error agregando equipo completo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en agregarEquipoCompleto:', error);
    return null;
  }
}

// Agregar esta función después de obtenerZonasPorLigaYCategoria
export async function obtenerTodasLasZonas() {
  const { data, error } = await supabase
    .from('zonas')
    .select('*');

  if (error) {
    console.error('Error obteniendo todas las zonas:', error);
    return [];
  }

  return data;
}

// Add these functions after obtenerTodasLasZonas
export async function obtenerZonas() {
  const { data, error } = await supabase
    .from('zonas')
    .select('*');

  if (error) {
    console.error('Error obteniendo zonas:', error);
    return [];
  }

  return data;
}

export async function obtenerZonasPorCategoria(categoriaId: string) {
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('categoria_id', categoriaId);

  if (error) {
    console.error('Error obteniendo zonas por categoría:', error);
    return [];
  }

  return data;
}

// Función para eliminar equipo
export async function eliminarEquipo(id: string) {
  const { error } = await supabase
    .from('equipos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando equipo:', error);
    return false;
  }

  return true;
}

// Función para eliminar categoría
export async function eliminarCategoria(id: string) {
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando categoría:', error);
    return false;
  }

  return true;
}

// Funciones para Fixtures
export async function crearFixture(nombre: string, fechaPartido: string, ligaId: string, categoriaId: string, zonaId: string) {
  // Agregar función de mapeo para convertir IDs de string a número
  const getNumericLeagueId = (leagueStringId: string): number => {
    const leagueMap: { [key: string]: number } = {
      'liga_masculina': 1,
      'lifufe': 2,
      'mundialito': 3
    };
    return leagueMap[leagueStringId] || parseInt(leagueStringId);
  };

  const numericLeagueId = getNumericLeagueId(ligaId);
  const numericCategoryId = parseInt(categoriaId);
  const numericZoneId = parseInt(zonaId);

  const { data, error } = await supabase
    .from('fixtures')
    .insert([{ 
      nombre, 
      fecha_partido: fechaPartido,
      liga_id: numericLeagueId,        // Ahora envía número
      categoria_id: numericCategoryId, // Ahora envía número
      zona_id: numericZoneId          // Ahora envía número
    }])
    .select();

  if (error) {
    console.error('Error creando fixture:', error);
    return null;
  }

  return data;
}

export async function crearPartidoConFixture(equipoLocalId: string, equipoVisitanteId: string, zonaId: string, fecha: string, fixtureId: string) {
  const numericZoneId = parseInt(zonaId);
  const numericEquipoLocalId = parseInt(equipoLocalId);
  const numericEquipoVisitanteId = parseInt(equipoVisitanteId);
  const numericFixtureId = parseInt(fixtureId);

  const { data, error } = await supabase
    .from('partidos')
    .insert([{ 
      equipo_local_id: numericEquipoLocalId,     // Ahora envía número
      equipo_visitante_id: numericEquipoVisitanteId, // Ahora envía número
      zona_id: numericZoneId,                    // Ahora envía número
      fecha,
      fixture_id: numericFixtureId               // Ahora envía número
    }])
    .select();

  if (error) {
    console.error('Error creando partido con fixture:', error);
    return null;
  }

  return data;
}

export async function obtenerFixtures() {
  console.log('Fetching fixtures from database...');
  
  const { data, error } = await supabase
    .from('fixtures')
    .select(`
      id,
      nombre,
      fecha_partido,
      liga_id,
      categoria_id,
      zona_id,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo fixtures:', error);
    return [];
  }

  console.log('Raw fixtures from database:', data);
  return data || [];
}

export async function obtenerPartidosPorFixture(fixtureId: string) {
  const { data, error } = await supabase
    .from('partidos')
    .select(`
      id,
      fecha,
      resultado_local,
      resultado_visitante,
      equipo_local: equipos!partidos_equipo_local_id_fkey (id, nombre),
      equipo_visitante: equipos!partidos_equipo_visitante_id_fkey (id, nombre)
    `)
    .eq('fixture_id', fixtureId);

  if (error) {
    console.error('Error obteniendo partidos por fixture:', error);
    return [];
  }

  return data;
}

// Función para eliminar fixture
export async function eliminarFixture(id: string) {
  // Primero eliminar todos los partidos asociados al fixture
  const { error: partidosError } = await supabase
    .from('partidos')
    .delete()
    .eq('fixture_id', id);

  if (partidosError) {
    console.error('Error eliminando partidos del fixture:', partidosError);
    return false;
  }

  // Luego eliminar el fixture
  const { error: fixtureError } = await supabase
    .from('fixtures')
    .delete()
    .eq('id', id);

  if (fixtureError) {
    console.error('Error eliminando fixture:', fixtureError);
    return false;
  }

  return true;
}

// Funciones para Standings (Tabla de Posiciones)
export async function obtenerStandingsPorZona(zonaId: string) {
  const { data, error } = await supabase
    .from('standings')
    .select('*')
    .eq('zona_id', zonaId)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false });

  if (error) {
    console.error('Error obteniendo standings:', error);
    return [];
  }

  return data;
}

export async function crearStanding(standing: {
  equipo_id: string;
  liga_id: string;
  categoria_id: string;
  zona_id: string;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goals_for?: number;
  goals_against?: number;
}) {
  try {
    // Convertir UUIDs a IDs numéricos
    const numericIds = await getNumericIds(
      standing.equipo_id,
      standing.zona_id,
      standing.liga_id,
      standing.categoria_id
    );

    console.log('🔄 Datos a insertar en standings:', {
      equipo_id: typeof numericIds.equipo_id,
      zona_id: typeof numericIds.zona_id,
      values: numericIds
    });

    const { data, error } = await supabase
      .from('standings')
      .insert([{
        equipo_id: numericIds.equipo_id,
        liga_id: numericIds.liga_id,
        categoria_id: numericIds.categoria_id,
        zona_id: numericIds.zona_id,
        points: standing.points || 0,
        played: standing.played || 0,
        won: standing.won || 0,
        drawn: standing.drawn || 0,
        lost: standing.lost || 0,
        goals_for: standing.goals_for || 0,
        goals_against: standing.goals_against || 0
      }])
      .select();

    if (error) {
      console.error('❌ Error creando standing:', error);
      throw error;
    }

    console.log('✅ Standing creado exitosamente:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en crearStanding:', error);
    throw error;
  }
}

export async function actualizarStanding(standingId: string, updates: {
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goals_for?: number;
  goals_against?: number;
}) {
  console.log('🔄 actualizarStanding en Supabase:', { standingId, updates });
  
  try {
    const { data, error } = await supabase
      .from('standings')
      .update(updates)
      .eq('id', standingId)
      .select();

    if (error) {
      console.error('❌ Error actualizando standing en Supabase:', error);
      throw error;
    }

    console.log('✅ Standing actualizado en Supabase:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en actualizarStanding:', error);
    throw error;
  }
}

export async function eliminarStanding(standingId: string) {
  const { error } = await supabase
    .from('standings')
    .delete()
    .eq('id', standingId);

  if (error) {
    console.error('Error eliminando standing:', error);
    return false;
  }

  return true;
}

// Funciones para Posiciones (Tabla simplificada)
export async function obtenerPosicionesPorZona(zonaId: string) {
  const { data, error } = await supabase
    .from('posiciones_editable')
    .select(`
      equipo_id,
      equipo_nombre,
      zona_id,
      pj,
      puntos
    `)
    .eq('zona_id', zonaId)
    .order('puntos', { ascending: false })
    .order('pj', { ascending: true }); // En caso de empate, menos partidos jugados primero

  if (error) {
    console.error('Error obteniendo posiciones:', error);
    throw error;
  }

  // Filtrar registros con datos faltantes
  const validData = (data || []).filter(row =>
    row.equipo_id &&
    row.zona_id
  );

  return validData;
}

// Nueva función: obtenerPosicionesPorZonaYCategoria
export async function obtenerPosicionesPorZonaYCategoria(zonaId: string, categoriaId: string) {
  const { data, error } = await supabase
    .from('posiciones_editable')
    .select('*')
    .eq('zona_id', zonaId)
    .eq('categoria_id', categoriaId)
    .order('puntos', { ascending: false })
    .order('pj', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Crear nueva posición
export async function crearPosicion(posicion: {
  equipo_id: string;
  zona_id: string;
  categoria_id: string;
  equipo_nombre?: string;
  puntos?: number;
  pj?: number;
}) {
  const { data, error } = await supabase
    .from('posiciones_editable')
    .insert([{
      equipo_id: posicion.equipo_id,
      zona_id: posicion.zona_id,
      categoria_id: posicion.categoria_id,
      equipo_nombre: posicion.equipo_nombre,
      puntos: posicion.puntos || 0,
      pj: posicion.pj || 0
    }])
    .select();

  if (error) throw error;
  return data;
}

// Actualizar posición existente
export async function actualizarPosicion(equipo_id: string, zona_id: string, categoria_id: string, updates: {
  puntos?: number;
  pj?: number;
  equipo_nombre?: string;
}) {
  const { data, error } = await supabase
    .from('posiciones_editable')
    .update(updates)
    .eq('equipo_id', equipo_id)
    .eq('zona_id', zona_id)
    .eq('categoria_id', categoria_id)
    .select();

  if (error) throw error;
  return data;
}

export async function eliminarPosicion(posicionId: string) {
  const { error } = await supabase
    .from('posiciones_editable')
    .delete()
    .eq('id', posicionId);

  if (error) {
    console.error('Error eliminando posición:', error);
    return false;
  }

  return true;
}

// Funciones para Cursos
export async function crearCurso(curso: {
  title: string;
  description: string;
  image_data: Uint8Array; // Cambiar de image_url a image_data
  date: string;
}) {
  const { data, error } = await supabase
    .from('courses')
    .insert([curso])
    .select();

  if (error) {
    console.error('Error creando curso:', error);
    throw error;
  }

  return data[0];
}

export async function actualizarCurso(cursoId: string, updates: {
  title?: string;
  description?: string;
  image_data?: Uint8Array; // Cambiar de image_url a image_data
  date?: string;
}) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', cursoId)
    .select();

  if (error) {
    console.error('Error actualizando curso:', error);
    throw error;
  }

  return data[0];
}

export async function eliminarCurso(cursoId: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', cursoId);

  if (error) {
    console.error('Error eliminando curso:', error);
    return false;
  }

  return true;
}

// Add these functions at the end of the file

// Función para obtener zonas por liga
export async function obtenerZonasPorLiga(leagueId: string) {
  const numericLeagueId = getNumericLeagueId(leagueId);
  
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('liga_id', numericLeagueId);
    
  if (error) {
    console.error('Error obteniendo zonas por liga:', error);
    return [];
  }
  
  return data || [];
}

// Función para obtener categorías por liga con estructura dinámica
export async function obtenerCategoriasPorLigaConEstructura(leagueId: string, zoneId?: string) {
  const numericLeagueId = getNumericLeagueId(leagueId);
  
  let query = supabase
    .from('categorias')
    .select('*')
    .eq('liga_id', numericLeagueId);
  
  if (zoneId) {
    query = query.eq('zona_id', parseInt(zoneId));
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error obteniendo categorías por liga con estructura:', error);
    return [];
  }
  
  return data || [];
}

// Función para obtener zonas por liga con estructura dinámica
export async function obtenerZonasPorLigaConEstructura(leagueId: string, categoryId?: string) {
  const numericLeagueId = getNumericLeagueId(leagueId);
  
  let query = supabase
    .from('zonas')
    .select('*')
    .eq('liga_id', numericLeagueId);
  
  if (categoryId) {
    query = query.eq('categoria_id', parseInt(categoryId));
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error obteniendo zonas por liga con estructura:', error);
    return [];
  }
  
  return data || [];
}

// Función para crear categoría con estructura
export async function crearCategoriaConEstructura(name: string, leagueId: string, zoneId?: string) {
  const numericLeagueId = getNumericLeagueId(leagueId);
  
  const insertData: any = {
    nombre: name,
    liga_id: numericLeagueId
  };
  
  if (zoneId) {
    insertData.zona_id = parseInt(zoneId);
  }
  
  const { data, error } = await supabase
    .from('categorias')
    .insert([insertData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creando categoría con estructura:', error);
    return null;
  }
  
  return data;
}

// Función para crear zona con estructura
export async function crearZonaConEstructura(name: string, leagueId: string, categoryId?: string, legend?: string) {
  const numericLeagueId = getNumericLeagueId(leagueId);
  
  const insertData: any = {
    nombre: name,
    liga_id: numericLeagueId
  };
  
  if (categoryId) {
    insertData.categoria_id = parseInt(categoryId);
  }
  
  if (legend) {
    insertData.legend = legend;
  }
  
  const { data, error } = await supabase
    .from('zonas')
    .insert([insertData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creando zona con estructura:', error);
    return null;
  }
  
  return data;
}