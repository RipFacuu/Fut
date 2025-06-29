-- Script para agregar el campo legend a la tabla zonas
-- Ejecutar este script en Supabase SQL Editor

-- Agregar el campo legend a la tabla zonas
ALTER TABLE zonas 
ADD COLUMN legend TEXT;

-- Agregar comentario al campo
COMMENT ON COLUMN zonas.legend IS 'Leyenda editable para mostrar en tablas de posiciones (ej: Apertura 2024, Clausura 2024)';

-- Crear un índice para mejorar el rendimiento de búsquedas por leyenda
CREATE INDEX IF NOT EXISTS idx_zonas_legend ON zonas(legend);

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'zonas' AND column_name = 'legend'; 