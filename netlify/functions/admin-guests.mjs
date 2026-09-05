import { getDatabase } from '@netlify/database';
import crypto from 'node:crypto';
import { verify } from './_auth.mjs';

const db = getDatabase();
const json = (d, s = 200) => Response.json(d, { status: s });
const baseCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();
const publicCode = (party) => baseCode() + (party ? '1' : '0');

export default async req => {
  if (!verify(req)) return json({ error: 'No autorizado.' }, 401);

  try {
    if (req.method === 'GET') {
      const rows = await db.sql`
        SELECT id,codigo,nombre,telefono,lugares,invitado_fiesta,estado,confirmados,
               asistencia_eventos,confirmados_conferencia,confirmados_fiesta,acompanantes,fecha_confirmacion
        FROM invitados ORDER BY nombre ASC`;
      return json({ invitados: rows });
    }

    const b = await req.json();

    if (req.method === 'POST') {
      const nombre = String(b.nombre || '').trim().slice(0, 160);
      const telefono = String(b.telefono || '').trim().slice(0, 32);
      const lugares = Number(b.lugares || 1);
      const invitado_fiesta = Boolean(b.invitado_fiesta);

      if (!nombre || !Number.isInteger(lugares) || lugares < 1)
        return json({ error: 'Nombre y cantidad de lugares son obligatorios.' }, 400);

      let c = '';
      for (let i = 0; i < 20; i++) {
        const x = publicCode(invitado_fiesta);
        const e = await db.sql`SELECT 1 FROM invitados WHERE codigo=${x}`;
        if (!e.length) { c = x; break; }
      }
      if (!c) return json({ error: 'No se pudo generar un código único.' }, 500);

      const rows = await db.sql`
        INSERT INTO invitados(codigo,nombre,telefono,lugares,invitado_fiesta)
        VALUES(${c},${nombre},${telefono},${lugares},${invitado_fiesta})
        RETURNING id,codigo,nombre,telefono,lugares,invitado_fiesta,estado,confirmados,
                  asistencia_eventos,confirmados_conferencia,confirmados_fiesta,acompanantes,fecha_confirmacion`;
      return json(rows[0], 201);
    }

    if (req.method === 'PUT') {
      const id = Number(b.id);
      const nombre = String(b.nombre || '').trim().slice(0, 160);
      const telefono = String(b.telefono || '').trim().slice(0, 32);
      const lugares = Number(b.lugares || 1);
      const invitado_fiesta = Boolean(b.invitado_fiesta);

      if (!Number.isInteger(id) || !nombre || !Number.isInteger(lugares) || lugares < 1)
        return json({ error: 'Datos inválidos.' }, 400);

      const current = await db.sql`SELECT codigo FROM invitados WHERE id=${id} LIMIT 1`;
      if (!current.length) return json({ error: 'Invitado no encontrado.' }, 404);

      const oldCode = String(current[0].codigo || '').trim().toUpperCase();
      const base = /^[A-F0-9]{8}[01]$/.test(oldCode) ? oldCode.slice(0, 8) : oldCode.slice(0, 8);
      const newCode = base + (invitado_fiesta ? '1' : '0');

      const duplicate = await db.sql`SELECT 1 FROM invitados WHERE codigo=${newCode} AND id<>${id} LIMIT 1`;
      if (duplicate.length) return json({ error: 'El código resultante ya está en uso.' }, 409);

      const rows = await db.sql`
        UPDATE invitados
        SET codigo=${newCode}, nombre=${nombre}, telefono=${telefono}, lugares=${lugares},
            invitado_fiesta=${invitado_fiesta}, updated_at=NOW()
        WHERE id=${id}
        RETURNING id,codigo,nombre,telefono,lugares,invitado_fiesta,estado,confirmados,
                  asistencia_eventos,confirmados_conferencia,confirmados_fiesta,acompanantes,fecha_confirmacion`;
      return rows.length ? json(rows[0]) : json({ error: 'Invitado no encontrado.' }, 404);
    }

    if (req.method === 'DELETE') {
      const id = Number(b.id);
      if (!Number.isInteger(id)) return json({ error: 'ID inválido.' }, 400);
      await db.sql`DELETE FROM invitados WHERE id=${id}`;
      return json({ ok: true });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (e) {
    console.error(e);
    return json({ error: 'Error interno.' }, 500);
  }
};

export const config = { path: '/.netlify/functions/admin-guests' };
