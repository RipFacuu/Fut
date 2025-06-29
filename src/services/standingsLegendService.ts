import { supabase } from '../lib/supabase';
import { StandingsLegend } from '../types/database';

export const standingsLegendService = {
  async getLegend(zona_id: string, categoria_id: string): Promise<StandingsLegend | null> {
    const { data } = await supabase
      .from('standings_legends')
      .select('*')
      .eq('zona_id', zona_id)
      .eq('categoria_id', categoria_id)
      .single();
    return data || null;
  },
  async upsertLegend(zona_id: string, categoria_id: string, leyenda: string): Promise<StandingsLegend | null> {
    const { data } = await supabase
      .from('standings_legends')
      .upsert([{ zona_id, categoria_id, leyenda }], { onConflict: 'zona_id,categoria_id' })
      .select()
      .single();
    return data || null;
  }
}; 