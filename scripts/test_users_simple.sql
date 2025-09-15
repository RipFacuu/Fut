-- Script simple para crear tabla de usuarios e insertar usuario de prueba
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de usuarios (si no existe)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  documento VARCHAR(20) UNIQUE NOT NULL,
  escuela VARCHAR(200) NOT NULL,
  equipo_id UUID,
  email VARCHAR(255),
  password VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar usuario de prueba
INSERT INTO usuarios (
  nombre, 
  apellido, 
  fecha_nacimiento, 
  documento, 
  escuela, 
  password
) VALUES (
  'Juan',
  'Pérez',
  '2010-05-15',
  '12345678',
  'Escuela Primaria San Martín',
  'password123'
) ON CONFLICT (documento) DO NOTHING;

-- 3. Verificar que se creó correctamente
SELECT 
  id,
  nombre,
  apellido,
  documento,
  escuela,
  created_at
FROM usuarios 
WHERE documento = '12345678';
