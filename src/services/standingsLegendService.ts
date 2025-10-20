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
