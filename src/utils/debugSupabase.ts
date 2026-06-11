import { supabase } from '../lib/supabase';

export const testSupabaseQueries = async () => {
  console.log('🔍 TEST: Iniciando pruebas de consultas a Supabase...');

  try {
    // Test 1: Obtener todas las ligas
    console.log('1️⃣ Test: Obtener ligas...');
    const { data: ligas, error: errorLigas } = await supabase.from('ligas').select('*');
    console.log('✅ Ligas:', ligas);
    if (errorLigas) console.error('❌ Error ligas:', errorLigas);

    // Test 2: Obtener todas las categorías
    console.log('2️⃣ Test: Obtener categorías...');
    const { data: categorias, error: errorCategorias } = await supabase.from('categorias').select('*');
    console.log('✅ Categorías:', categorias);
    if (errorCategorias) console.error('❌ Error categorías:', errorCategorias);

    // Test 3: Obtener todas las zonas
    console.log('3️⃣ Test: Obtener zonas...');
    const { data: zonas, error: errorZonas } = await supabase.from('zonas').select('*');
    console.log('✅ Zonas:', zonas);
    if (errorZonas) console.error('❌ Error zonas:', errorZonas);

    // Test 4: Obtener categorías de la Liga Participando (id=1)
    if (ligas?.length > 0) {
      console.log('4️⃣ Test: Obtener categorías de la liga', ligas[0].id, '(', ligas[0].nombre, ')');
      const { data: catsLiga, error: errorCatsLiga } = await supabase
        .from('categorias')
        .select('*')
        .eq('liga_id', ligas[0].id);
      console.log('✅ Categorías de la liga:', catsLiga);
      if (errorCatsLiga) console.error('❌ Error categorías de liga:', errorCatsLiga);
    }

    console.log('🔍 TEST: Finalizado!');
  } catch (err) {
    console.error('❌ Error general en tests:', err);
  }
};
