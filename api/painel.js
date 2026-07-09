// API do Painel de Pagamento (NextlevelDJ) — serverless na Vercel.
// Guarda/lê o estado (enviada/pago) e os dados dos ganhadores no Neon (Postgres).
// Protegido por PIN (guardado no banco). Tudo via POST pra o PIN nunca ir na URL.
//
// Env var necessária: DATABASE_URL  (string de conexão do Neon, com pooler)
//
// Ações (body JSON):
//   { action:'load', pin }        -> { data, state }
//   { action:'poll', pin }        -> { state }
//   { action:'set',  pin, pk, field('e'|'p'), value }  -> { state }
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const pin = String(body.pin || '');

    const rows = await sql`SELECT k, v FROM pix_painel WHERE k IN ('pin','data','state')`;
    const map = {};
    rows.forEach(r => { map[r.k] = r.v; });

    const realPin = map['pin'] == null ? null : String(map['pin']);
    if (!realPin || pin !== realPin) {
      return res.status(401).json({ error: 'pin' });
    }

    const action = body.action;

    if (action === 'load') {
      return res.status(200).json({ data: map['data'] || null, state: map['state'] || {} });
    }
    if (action === 'poll') {
      return res.status(200).json({ state: map['state'] || {} });
    }
    if (action === 'set') {
      const pk = String(body.pk || '');
      const field = body.field;
      const value = !!body.value;
      if (!pk || (field !== 'e' && field !== 'p')) {
        return res.status(400).json({ error: 'params' });
      }
      const state = map['state'] || {};
      const entry = state[pk] || {};
      entry[field] = value;
      if (field === 'p' && value) entry.e = true;      // pago implica enviada
      if (field === 'e' && !value) entry.p = false;    // desmarcar enviada tira pago
      if (!entry.e && !entry.p) delete state[pk]; else state[pk] = entry;
      await sql`UPDATE pix_painel SET v = ${JSON.stringify(state)}::jsonb, updated_at = now() WHERE k = 'state'`;
      return res.status(200).json({ state });
    }

    return res.status(400).json({ error: 'action' });
  } catch (e) {
    return res.status(500).json({ error: 'server', detail: String((e && e.message) || e) });
  }
}
