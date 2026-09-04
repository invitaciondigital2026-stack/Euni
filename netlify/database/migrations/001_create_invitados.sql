CREATE TABLE IF NOT EXISTS invitados (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(32) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    telefono VARCHAR(32) NOT NULL DEFAULT '',
    lugares INTEGER NOT NULL DEFAULT 1 CHECK (lugares >= 1),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','no_asiste')),
    confirmados INTEGER NOT NULL DEFAULT 0 CHECK (confirmados >= 0),
    acompanantes TEXT NOT NULL DEFAULT '',
    fecha_confirmacion TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invitados_estado ON invitados (estado);
CREATE INDEX IF NOT EXISTS idx_invitados_nombre ON invitados (nombre);
