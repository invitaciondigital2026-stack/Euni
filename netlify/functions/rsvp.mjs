import { getDatabase } from '@netlify/database';
const db = getDatabase();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export default async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let b;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Solicitud inválida.' }, 400);
  }

  try {
    const codigo = String(b.codigo || '').trim().toUpperCase();
    const asistencia = String(b.asistencia || '');
    const cantidad = Number(b.cantidad || 0);
    const acompanantes = String(b.acompanantes || '').trim().slice(0, 1000);

    if (!codigo || !['conferencia', 'ambos', 'no'].includes(asistencia)) {
      return json({ error: 'Completá la confirmación.' }, 400);
    }

    const rows = await db.sql`
      SELECT id,lugares,invitado_fiesta
      FROM invitados
      WHERE codigo=${codigo}
      LIMIT 1
    `;

    if (!rows.length) return json({ error: 'No encontramos esta invitación.' }, 404);

    const g = rows[0];

    if (asistencia === 'ambos' && !g.invitado_fiesta) {
      return json({ error: 'Esta invitación no incluye la fiesta.' }, 400);
    }

    if (asistencia !== 'no' && (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > g.lugares)) {
      return json({ error: `La cantidad debe estar entre 1 y ${g.lugares}.` }, 400);
    }

    const confirmados_conferencia = asistencia === 'no' ? 0 : cantidad;
    const confirmados_fiesta = asistencia === 'ambos' ? cantidad : 0;
    const estado = asistencia === 'no' ? 'no_asiste' : 'confirmado';

    await db.sql`
      UPDATE invitados
      SET estado=${estado},
          confirmados=${confirmados_conferencia},
          asistencia_eventos=${asistencia},
          confirmados_conferencia=${confirmados_conferencia},
          confirmados_fiesta=${confirmados_fiesta},
          acompanantes=${acompanantes},
          fecha_confirmacion=NOW(),
          updated_at=NOW()
      WHERE id=${g.id}
    `;

    return json({
      ok: true,
      asistencia_eventos: asistencia,
      confirmados_conferencia,
      confirmados_fiesta
    });
  } catch (error) {
    console.error('rsvp:', error);
    return json({ error: 'No se pudo guardar la confirmación.' }, 500);
  }
};

export const config = { path: '/.netlify/functions/rsvp' };
