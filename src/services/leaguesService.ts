import { supabase } from '../lib/supabase';

export interface League {
  id: string;
  name: string;
}

const TABLE = 'ligas';

function mapDbToLeague(row: any): League {
  return {
    id: row.id,
    name: row.nombre,
  };
}

function mapLeagueToDb(league: Omit<League, 'id'>): any {
  return {
    nombre: league.name,
  };
}

export const leaguesService = {
  async getAllLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*');
    if (error) throw error;
    return (data || []).map(mapDbToLeague);
  },

  async createLeague(league: Omit<League, 'id'>): Promise<League> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([mapLeagueToDb(league)])
      .select()
      .single();
    if (error) throw error;
    return mapDbToLeague(data);
  },

  async updateLeague(id: string, league: Partial<League>): Promise<League> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(mapLeagueToDb(league as Omit<League, 'id'>))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapDbToLeague(data);
  },

  async deleteLeague(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
}; 