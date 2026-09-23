-- ============================================
-- ESQUEMA DE BASE DE DATOS - SUPABASE
-- Bootcamp Digital Factory - Sistema de Calificación
-- ============================================

-- ============================================
-- 1. TABLA: equipos
-- ============================================
CREATE TABLE IF NOT EXISTS equipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar equipos iniciales (10 equipos)
INSERT INTO equipos (nombre) VALUES 
  ('Equipo 1'),
  ('Equipo 2'),
  ('Equipo 3'),
  ('Equipo 4'),
  ('Equipo 5'),
  ('Equipo 6'),
  ('Equipo 7'),
  ('Equipo 8'),
  ('Equipo 9'),
  ('Equipo 10');

-- ============================================
-- 2. TABLA: jurados
-- ============================================
CREATE TABLE IF NOT EXISTS jurados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NOT NULL DEFAULT 'Evaluador',
  avatar VARCHAR(50) NOT NULL DEFAULT '👤',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar jurados iniciales (5 jurados)
INSERT INTO jurados (nombre, cargo, avatar) VALUES 
  ('Jurado 1', 'Evaluador', '👤'),
  ('Jurado 2', 'Evaluador', '👤'),
  ('Jurado 3', 'Evaluador', '👤'),
  ('Jurado 4', 'Evaluador', '👤'),
  ('Jurado 5', 'Evaluador', '👤');

-- ============================================
-- 3. TABLA: calificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS calificaciones (
  id SERIAL PRIMARY KEY,
  jurado_id INTEGER NOT NULL REFERENCES jurados(id) ON DELETE CASCADE,
  equipo_id INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  calificaciones JSONB NOT NULL DEFAULT '{}',
  comentarios TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Restricción única: un jurado solo puede calificar un equipo una vez
  CONSTRAINT unique_jurado_equipo UNIQUE (jurado_id, equipo_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_calificaciones_jurado ON calificaciones(jurado_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_equipo ON calificaciones(equipo_id);

-- ============================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurados ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- Política para equipos: permitir lectura pública
CREATE POLICY "Permitir lectura pública de equipos"
  ON equipos FOR SELECT
  USING (true);

-- Política para equipos: permitir inserción pública
CREATE POLICY "Permitir inserción pública de equipos"
  ON equipos FOR INSERT
  WITH CHECK (true);

-- Política para equipos: permitir actualización pública
CREATE POLICY "Permitir actualización pública de equipos"
  ON equipos FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para equipos: permitir eliminación pública
CREATE POLICY "Permitir eliminación pública de equipos"
  ON equipos FOR DELETE
  USING (true);

-- Política para jurados: permitir lectura pública
CREATE POLICY "Permitir lectura pública de jurados"
  ON jurados FOR SELECT
  USING (true);

-- Política para jurados: permitir actualización pública
CREATE POLICY "Permitir actualización pública de jurados"
  ON jurados FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para calificaciones: permitir lectura pública
CREATE POLICY "Permitir lectura pública de calificaciones"
  ON calificaciones FOR SELECT
  USING (true);

-- Política para calificaciones: permitir inserción pública
CREATE POLICY "Permitir inserción pública de calificaciones"
  ON calificaciones FOR INSERT
  WITH CHECK (true);

-- Política para calificaciones: permitir actualización pública
CREATE POLICY "Permitir actualización pública de calificaciones"
  ON calificaciones FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para calificaciones: permitir eliminación pública
CREATE POLICY "Permitir eliminación pública de calificaciones"
  ON calificaciones FOR DELETE
  USING (true);

-- ============================================
-- 5. FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para equipos
CREATE TRIGGER update_equipos_updated_at
  BEFORE UPDATE ON equipos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para jurados
CREATE TRIGGER update_jurados_updated_at
  BEFORE UPDATE ON jurados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calificaciones
CREATE TRIGGER update_calificaciones_updated_at
  BEFORE UPDATE ON calificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VISTA: Resumen de calificaciones por equipo
-- ============================================
CREATE OR REPLACE VIEW resumen_equipos AS
SELECT 
  e.id,
  e.nombre,
  COUNT(c.id) as total_jurados,
  COALESCE(
    ROUND(AVG(
      (c.calificaciones->>'facilidad')::numeric * 0.25 +
      (c.calificaciones->>'ia')::numeric * 0.25 +
      (c.calificaciones->>'tablero')::numeric * 0.25 +
      (c.calificaciones->>'integracion')::numeric * 0.15 +
      (c.calificaciones->>'presentacion')::numeric * 0.10
    ), 2),
    0
  ) as puntaje_promedio
FROM equipos e
LEFT JOIN calificaciones c ON e.id = c.equipo_id
GROUP BY e.id, e.nombre
ORDER BY puntaje_promedio DESC;

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================
