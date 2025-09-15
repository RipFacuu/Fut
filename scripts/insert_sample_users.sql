-- Insertar usuarios de ejemplo para probar la funcionalidad
-- Ejecutar después de crear la tabla de usuarios

-- Usuario 1: Juan Pérez
INSERT INTO usuarios (
  nombre, 
  apellido, 
  fecha_nacimiento, 
  documento, 
  escuela, 
  equipo_id,
  email,
  password
) VALUES (
  'Juan',
  'Pérez',
  '2010-05-15',
  '12345678',
  'Escuela Primaria San Martín',
  NULL, -- Sin equipo asignado por ahora
  'juan.perez@email.com',
  'password123'
);

-- Usuario 2: María González
INSERT INTO usuarios (
  nombre, 
  apellido, 
  fecha_nacimiento, 
  documento, 
  escuela, 
  equipo_id,
  email
) VALUES (
  'María',
  'González',
  '2009-08-22',
  '87654321',
  'Escuela Primaria San Martín',
  NULL, -- Sin equipo asignado por ahora
  'maria.gonzalez@email.com'
);

-- Usuario 3: Carlos Rodríguez
INSERT INTO usuarios (
  nombre, 
  apellido, 
  fecha_nacimiento, 
  documento, 
  escuela, 
  equipo_id
) VALUES (
  'Carlos',
  'Rodríguez',
  '2011-03-10',
  '11223344',
  'Escuela Primaria Belgrano',
  NULL -- Sin equipo asignado por ahora
);

-- Usuario 4: Ana López
INSERT INTO usuarios (
  nombre, 
  apellido, 
  fecha_nacimiento, 
  documento, 
  escuela, 
  equipo_id,
  email,
  password
) VALUES (
  'Ana',
  'López',
  '2010-12-05',
  '55667788',
  'Escuela Primaria San Martín',
  NULL, -- Sin equipo asignado por ahora
  'ana.lopez@email.com',
  'ana123'
);

-- Usuario 5: Diego Martínez
INSERT INTO usuarios (
  nombre, 
  apellido, 
  fecha_nacimiento, 
  documento, 
  escuela, 
  equipo_id
) VALUES (
  'Diego',
  'Martínez',
  '2009-07-18',
  '99887766',
  'Escuela Primaria Belgrano',
  NULL -- Sin equipo asignado por ahora
);

-- Verificar que se insertaron correctamente
SELECT 
  id,
  nombre,
  apellido,
  documento,
  escuela,
  created_at
FROM usuarios 
ORDER BY created_at DESC;
