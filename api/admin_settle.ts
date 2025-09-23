import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

function outcomeFor(scoreHome: number, scoreAway: number): 'home'|'draw'|'away' {
  if (scoreHome > scoreAway) return 'home';
  if (scoreHome < scoreAway) return 'away';
  return 'draw';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const { match_id, actor_user_id } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!match_id) return res.status(400).json({ error: 'missing_match_id' });

    // Fetch settings
    const { data: settings } = await supabase
      .from('prode_settings')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    const payoutMode = (settings?.payout_mode || 'pool') as 'pool'|'points';
    const pointsForResult = Number(settings?.points_for_result ?? 3);
    const pointsForExact = Number(settings?.points_for_exact_score ?? 5);
    const feePercent = Number(settings?.fee_percent ?? 10);

    // Get match official result
    const { data: match, error: matchErr } = await supabase
      .from('partidos')
      .select('id, resultado_local, resultado_visitante')
      .eq('id', match_id)
      .single();
    if (matchErr || match?.resultado_local === null || match?.resultado_visitante === null) {
      return res.status(400).json({ error: 'match_without_result' });
    }

    const realOutcome = outcomeFor(match.resultado_local, match.resultado_visitante);

    // Fetch predictions for match
    const { data: preds, error: predsErr } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', String(match_id))
      .eq('settled', false);
    if (predsErr) return res.status(500).json({ error: predsErr.message });

    // Compute pools for payout
    let poolTotal = 0;
    let winnersTotal = 0;
    for (const p of preds || []) {
      poolTotal += Number(p.bet_amount || 0);
      if (p.predicted_outcome === realOutcome) {
        winnersTotal += Number(p.bet_amount || 0);
      }
    }
    const fee = (poolTotal * feePercent) / 100;
    const distributable = Math.max(0, poolTotal - fee);

    // Settle each prediction
    for (const p of preds || []) {
      const correctOutcome = p.predicted_outcome === realOutcome;
      const exact = (p.predicted_score_home ?? -999) === match.resultado_local && (p.predicted_score_away ?? -999) === match.resultado_visitante;
      let points_awarded = 0;
      let payout_amount = 0;

      if (payoutMode === 'points') {
        if (correctOutcome) points_awarded += pointsForResult;
        if (exact) points_awarded += pointsForExact;
      } else {
        // pool mode
        if (correctOutcome && winnersTotal > 0) {
          const share = Number(p.bet_amount || 0) / winnersTotal;
          payout_amount = Number((distributable * share).toFixed(2));
        }
      }

      // Update prediction as settled
      await supabase
        .from('predictions')
        .update({ settled: true, points_awarded, payout_amount })
        .eq('id', p.id);

      // Wallet credit if real-money mode
      if (payoutMode === 'pool' && payout_amount > 0) {
        // upsert wallet
        await supabase.rpc('increment_wallet_balance', { user_uuid: p.user_id, delta_amount: payout_amount });
        // log tx
        await supabase
          .from('wallet_transactions')
          .insert({ user_id: p.user_id, amount: payout_amount, currency: p.currency || 'ARS', reason: 'payout', meta: { match_id } });
      }
    }

    // Audit log
    await supabase
      .from('audit_logs')
      .insert({ actor_user_id, action: 'settle_match', payload: { match_id, payout_mode: payoutMode, fee_percent: feePercent } });

    return res.status(200).json({ ok: true, settled: (preds || []).length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'internal_error' });
  }
}


