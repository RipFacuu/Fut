import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const LIGA_ID = 1; // ID numérico de 'Liga Participando' en la base de datos

async function main() {
  // 1. Obtener todas las zonas de Liga Participando
  const { data: zonas, error: errorZonas } = await supabase
    .from('zonas')
    .select('id')
    .eq('liga_id', LIGA_ID);

  if (errorZonas) {
    console.error('Error obteniendo zonas:', errorZonas);
    process.exit(1);
  }
  if (!zonas || zonas.length === 0) {
    console.error('No hay zonas para Liga Participando');
    process.exit(1);
  }
  const zonaId = zonas[0].id;
  console.log('Zona seleccionada para asignar:', zonaId);

  // 2. Buscar categorías de Liga Participando sin zona
  const { data: categorias, error: errorCategorias } = await supabase
    .from('categorias')
    .select('id, nombre, zona_id')
    .eq('liga_id', LIGA_ID)
    .is('zona_id', null);

  if (errorCategorias) {
    console.error('Error obteniendo categorías:', errorCategorias);
    process.exit(1);
  }
  if (!categorias || categorias.length === 0) {
    console.log('No hay categorías sin zona para actualizar.');
    process.exit(0);
  }

  // 3. Actualizar cada categoría sin zona
  for (const cat of categorias) {
    const { error: updateError } = await supabase
      .from('categorias')
      .update({ zona_id: zonaId })
      .eq('id', cat.id);
    if (updateError) {
      console.error(`Error actualizando categoría ${cat.nombre}:`, updateError);
    } else {
      console.log(`✅ Categoría actualizada: ${cat.nombre} (ID: ${cat.id})`);
    }
  }

  console.log('Proceso finalizado.');
}

main(); 