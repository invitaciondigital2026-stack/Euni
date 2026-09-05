import { getDatabase } from '@netlify/database';
const db = getDatabase();

export default async req => {
  const publicCode = new URL(req.url).searchParams.get('i')?.trim().toUpperCase();
  if (!publicCode) return Response.json({ error: 'Falta el código de invitación.' }, { status: 400 });

  if (!/^[A-F0-9]{8}[01]$/.test(publicCode)) {
    return Response.json({ error: 'Código de invitación inválido.' }, { status: 400 });
  }

  const partyFromCode = publicCode.endsWith('1');

  // El código completo (8 caracteres + 0/1) es el código oficial.
  const rows = await db.sql`
    SELECT codigo,nombre,lugares,invitado_fiesta,estado,confirmados,
           asistencia_eventos,confirmados_conferencia,confirmados_fiesta
    FROM invitados WHERE codigo=${publicCode} LIMIT 1`;

  if (!rows.length) {
    return Response.json({ error: 'No encontramos esta invitación.' }, { status: 404 });
  }

  const guest = rows[0];

  // El sufijo del enlace debe coincidir con el permiso guardado en DB.
  if (Boolean(guest.invitado_fiesta) !== partyFromCode) {
    return Response.json({ error: 'El enlace de esta invitación no coincide con sus permisos.' }, { status: 403 });
  }

  return Response.json(guest);
};

export const config = { path: '/.netlify/functions/guest' };
