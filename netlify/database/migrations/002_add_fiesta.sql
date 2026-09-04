ALTER TABLE invitados
    ADD COLUMN IF NOT EXISTS invitado_fiesta BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS asistencia_eventos VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    ADD COLUMN IF NOT EXISTS confirmados_conferencia INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS confirmados_fiesta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_asistencia_eventos_check;
ALTER TABLE invitados ADD CONSTRAINT invitados_asistencia_eventos_check CHECK (asistencia_eventos IN ('pendiente','conferencia','ambos','no'));
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_confirmados_conferencia_check;
ALTER TABLE invitados ADD CONSTRAINT invitados_confirmados_conferencia_check CHECK (confirmados_conferencia >= 0);
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_confirmados_fiesta_check;
ALTER TABLE invitados ADD CONSTRAINT invitados_confirmados_fiesta_check CHECK (confirmados_fiesta >= 0);
UPDATE invitados SET confirmados_conferencia=COALESCE(confirmados,0),confirmados_fiesta=0,asistencia_eventos=CASE WHEN estado='confirmado' THEN 'conferencia' WHEN estado='no_asiste' THEN 'no' ELSE 'pendiente' END WHERE asistencia_eventos='pendiente' AND confirmados_conferencia=0 AND confirmados_fiesta=0;
