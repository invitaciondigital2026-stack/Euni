import { getDatabase } from '@netlify/database';
const db = getDatabase();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const code = new URL(req.url).searchParams.get('i')?.trim().toUpperCase();

    if (!code) return json({ error: 'Falta el código de invitación.' }, 400);

    const rows = await db.sql`
      SELECT codigo,nombre,lugares,invitado_fiesta,estado,confirmados,
             asistencia_eventos,confirmados_conferencia,confirmados_fiesta
      FROM invitados
      WHERE codigo=${code}
      LIMIT 1
    `;

    if (!rows.length) return json({ error: 'No encontramos esta invitación.' }, 404);

    return json(rows[0]);
  } catch (error) {
    console.error('guest:', error);
    return json({ error: 'No se pudo consultar la invitación.' }, 500);
  }
};

export const config = { path: '/.netlify/functions/guest' };
