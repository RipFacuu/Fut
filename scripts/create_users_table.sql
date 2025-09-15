-- Crear tabla de usuarios para la liga infantil
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  documento VARCHAR(20) UNIQUE NOT NULL,
  escuela VARCHAR(200) NOT NULL,
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por documento
CREATE INDEX IF NOT EXISTS idx_usuarios_documento ON usuarios(documento);

-- Crear índice para búsquedas por equipo
CREATE INDEX IF NOT EXISTS idx_usuarios_equipo_id ON usuarios(equipo_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos usuarios de ejemplo (opcional)
-- INSERT INTO usuarios (nombre, apellido, fecha_nacimiento, documento, escuela, equipo_id) VALUES
-- ('Juan', 'Pérez', '2010-05-15', '12345678', 'Escuela Primaria San Martín', NULL),
-- ('María', 'González', '2009-08-22', '87654321', 'Escuela Primaria San Martín', NULL);
