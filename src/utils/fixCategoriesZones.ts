import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

export const fixCategoriesZones = async () => {
  try {
    console.log('🔧 Iniciando reparación de categorías por zonas...');
    
    // 1. Obtener todas las categorías de Liga Participando
    const categories = await SupabaseService.getCategoriesByLeague('liga_masculina');
    console.log('📋 Categorías encontradas:', categories);
    
    // 2. Obtener todas las zonas de Liga Participando
    const zones = await SupabaseService.getZonesByLeague('liga_masculina');
    console.log('🏟️ Zonas encontradas:', zones);
    
    if (zones.length === 0) {
      console.error('❌ No se encontraron zonas para Liga Participando');
      return;
    }
    
    // 3. Filtrar categorías que NO tienen zoneId asignado
    const categoriesWithoutZone = categories.filter(cat => !(cat as any).zoneId);
    console.log('🔍 Categorías sin zona asignada:', categoriesWithoutZone);
    
    if (categoriesWithoutZone.length === 0) {
      console.log('✅ Todas las categorías ya tienen zona asignada');
      return;
    }
    
    // 4. Distribuir categorías entre zonas de manera equilibrada
    const categoriesPerZone = Math.ceil(categoriesWithoutZone.length / zones.length);
    
    for (let i = 0; i < categoriesWithoutZone.length; i++) {
      const category = categoriesWithoutZone[i];
      const zoneIndex = Math.floor(i / categoriesPerZone);
      const targetZone = zones[zoneIndex] || zones[zones.length - 1]; // Fallback a la última zona
      
      console.log(`📌 Asignando categoría "${category.name}" a zona "${targetZone.name}"`);
      
      // 5. Actualizar en Supabase
      const { error } = await supabase
        .from('categorias')
        .update({ zona_id: targetZone.id })
        .eq('id', category.id);
      
      if (error) {
        console.error(`❌ Error asignando categoría ${category.name}:`, error);
      } else {
        console.log(`✅ Categoría "${category.name}" asignada a zona "${targetZone.name}"`);
      }
    }
    
    console.log('🎉 Reparación completada. Recarga la página para ver los cambios.');
    
  } catch (error) {
    console.error('❌ Error en la reparación:', error);
  }
};