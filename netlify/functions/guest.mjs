import { getDatabase } from '@netlify/database';

const db = getDatabase();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

export default async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: CORS_HEADERS }
    );
  }

  try {
    const code = new URL(req.url).searchParams.get('i')?.trim().toUpperCase();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Falta el código de invitación.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const rows = await db.sql`
      SELECT codigo,nombre,lugares,invitado_fiesta,estado,confirmados,
             asistencia_eventos,confirmados_conferencia,confirmados_fiesta
      FROM invitados
      WHERE codigo=${code}
      LIMIT 1
    `;

    if (!rows.length) {
      return new Response(
        JSON.stringify({ error: 'No encontramos esta invitación.' }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (error) {
    console.error('guest error:', error);
    return new Response(
      JSON.stringify({ error: 'No pudimos consultar la invitación.' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

export const config = { path: '/.netlify/functions/guest' };
