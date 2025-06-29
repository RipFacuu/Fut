import { supabase } from '../lib/supabase';
import { Category } from '../contexts/LeagueContext';

export const categoriesService = {
  // Obtener categorías por zona
  async getCategoriesByZone(zoneId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('zona_id', zoneId)
      .limit(100);

    if (error) {
      console.error('Error fetching categories by zone:', error);
      throw new Error('Error al obtener las categorías de la zona');
    }

    // Mapear los datos a la estructura Category del frontend
    return (data || []).map((cat: any) => ({
      id: String(cat.id),
      name: cat.nombre,
      leagueId: String(cat.liga_id),
      isEditable: true, // O ajustar según lógica de tu app
      zoneId: cat.zona_id ? String(cat.zona_id) : undefined,
    }));
  },
}; 