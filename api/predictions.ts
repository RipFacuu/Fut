import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

function parseBody(req: VercelRequest) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const { user_id, match_id, predicted_outcome, predicted_score_home, predicted_score_away, bet_amount, currency } = parseBody(req);

      if (!user_id || !match_id || !predicted_outcome) {
        return res.status(400).json({ error: 'missing_fields' });
      }
      const amount = Number(bet_amount || 0);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ error: 'invalid_bet_amount' });
      }

      // Load settings
      const { data: settings } = await supabase
        .from('prode_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const maxBet = Number(settings?.max_bet ?? 10000);
      if (amount > maxBet) return res.status(400).json({ error: 'bet_over_max' });

      // Check cutoff
      const { data: match } = await supabase
        .from('partidos')
        .select('id, fecha')
        .eq('id', match_id)
        .single();
      if (!match) return res.status(404).json({ error: 'match_not_found' });

      const cutoffSec = Number(settings?.cutoff_seconds_before_kickoff ?? 600);
      const matchDate = new Date(match.fecha);
      const deadline = new Date(matchDate.getTime() - cutoffSec * 1000);
      if (new Date() >= deadline) return res.status(403).json({ error: 'cutoff_passed' });

      // Upsert prediction
      const { data, error } = await supabase
        .from('predictions')
        .upsert({
          user_id,
          match_id: String(match_id),
          predicted_outcome,
          predicted_score_home: predicted_score_home ?? null,
          predicted_score_away: predicted_score_away ?? null,
          bet_amount: amount,
          currency: currency || settings?.currency || 'ARS',
        }, { onConflict: 'user_id,match_id' })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id || typeof user_id !== 'string') return res.status(400).json({ error: 'missing_user_id' });
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'internal_error' });
  }
}


