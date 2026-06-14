import { supabase } from '../lib/supabase';
import { StandingsLegend } from '../types/database';

type ZoneWithLegend = { id: string; legend?: string };

export async function resolveStandingsLegend(
  zoneId: string,
  categoryId: string,
  zones: ZoneWithLegend[] = []
): Promise<string> {
  try {
    const stored = await standingsLegendService.getLegend(zoneId, categoryId);
    if (stored?.leyenda?.trim()) {
      return stored.leyenda.trim();
    }
  } catch (error) {
    console.error('Error loading standings legend:', error);
  }

  return zones.find((zone) => zone.id === zoneId)?.legend?.trim() || '';
}

export const standingsLegendService = {
  async getLegend(zona_id: string | number, categoria_id: string | number): Promise<StandingsLegend | null> {
    const { data, error } = await supabase
      .from('standings_legends')
      .select('*')
      .eq('zona_id', String(zona_id))
      .eq('categoria_id', String(categoria_id))
      .maybeSingle();

    if (error) {
      console.error('Error en getLegend:', error);
      throw error;
    }

    return data || null;
  },
  async upsertLegend(zona_id: string | number, categoria_id: string | number, leyenda: string): Promise<StandingsLegend> {
    const { data, error } = await supabase
      .from('standings_legends')
      .upsert([{
        zona_id: String(zona_id),
        categoria_id: String(categoria_id),
        leyenda,
      }], {
        onConflict: 'zona_id,categoria_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error en upsertLegend:', error);
      throw error;
    }

    return data;
  },
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
