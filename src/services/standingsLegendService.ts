import { supabase } from '../lib/supabase';
import { StandingsLegend } from '../types/database';

export const standingsLegendService = {
  async getLegend(zona_id: string | number, categoria_id: string | number): Promise<StandingsLegend | null> {
    console.log('📡 standingsLegendService: getLegend called with zona_id:', zona_id, 'categoria_id:', categoria_id);
    
    const { data, error } = await supabase
      .from('standings_legends')
      .select('*')
      .eq('zona_id', String(zona_id)) // Convertir a string
      .eq('categoria_id', String(categoria_id)) // Convertir a string
      .maybeSingle();
    
    if (error) {
      console.error('❌ standingsLegendService: Error en getLegend:', error);
    }
    
    return data || null;
  },
  async upsertLegend(zona_id: string | number, categoria_id: string | number, leyenda: string): Promise<StandingsLegend | null> {
    console.log('📡 standingsLegendService: upsertLegend called with zona_id:', zona_id, 'categoria_id:', categoria_id, 'leyenda:', leyenda);
    
    const { data, error } = await supabase
      .from('standings_legends')
      .upsert([{ 
        zona_id: String(zona_id), // Convertir a string
        categoria_id: String(categoria_id), // Convertir a string
        leyenda 
      }], { 
        onConflict: 'zona_id,categoria_id' 
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('❌ standingsLegendService: Error en upsertLegend:', error);
    }
    
    return data || null;
  }
};

export async function updateStandingsOrder(standingsOrder: { id: string | number, orden: number }[]) {
  const updates = standingsOrder.map(async ({ id, orden }) => {
    return supabase
      .from('standings')
      .update({ orden })
      .eq('id', id);
  });
  return Promise.all(updates);
}
