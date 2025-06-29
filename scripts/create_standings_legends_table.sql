-- Script para crear la tabla standings_legends en Supabase
-- Esta tabla permite manejar leyendas únicas para cada combinación de zona y categoría

-- Crear la tabla standings_legends
CREATE TABLE IF NOT EXISTS standings_legends (
  id SERIAL PRIMARY KEY,
  zona_id TEXT NOT NULL,
  categoria_id TEXT NOT NULL,
  leyenda TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (zona_id, categoria_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_standings_legends_zona_categoria 
ON standings_legends (zona_id, categoria_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_standings_legends_updated_at ON standings_legends;
CREATE TRIGGER update_standings_legends_updated_at
    BEFORE UPDATE ON standings_legends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios sobre la tabla
COMMENT ON TABLE standings_legends IS 'Tabla para almacenar leyendas únicas por zona y categoría (ej: Apertura, Clausura)';
COMMENT ON COLUMN standings_legends.zona_id IS 'ID de la zona';
COMMENT ON COLUMN standings_legends.categoria_id IS 'ID de la categoría';
COMMENT ON COLUMN standings_legends.leyenda IS 'Texto de la leyenda (ej: Apertura 2024, Clausura 2024)';

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla standings_legends creada exitosamente' as mensaje; 