import { supabase } from '../lib/supabase';
import { StandingsLegend } from '../types/database';

export const standingsLegendService = {
  async getLegend(zona_id: string, categoria_id: string): Promise<StandingsLegend | null> {
    const { data } = await supabase
      .from('standings_legends')
      .select('*')
      .eq('zona_id', zona_id)
      .eq('categoria_id', categoria_id)
      .maybeSingle();
    return data || null;
  },
  async upsertLegend(zona_id: string, categoria_id: string, leyenda: string): Promise<StandingsLegend | null> {
    const { data } = await supabase
      .from('standings_legends')
      .upsert([{ zona_id, categoria_id, leyenda }], { onConflict: 'zona_id,categoria_id' })
      .select()
      .maybeSingle();
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

export async function updateEditablePositionsOrder(positionsOrder: { equipo_id: number, zona_id: number, categoria_id: number, orden: number }[]) {
  const updates = positionsOrder.map(async ({ equipo_id, zona_id, categoria_id, orden }) => {
    const { data, error } = await supabase
      .from('posiciones_editable')
      .update({ orden })
      .eq('equipo_id', equipo_id)
      .eq('zona_id', zona_id)
      .eq('categoria_id', categoria_id);
    console.log('Update result:', { equipo_id, zona_id, categoria_id, orden, data, error });
    return { data, error };
  });
  return Promise.all(updates);
} 