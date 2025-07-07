-- Script para configurar el bucket de storage para flyers
-- Este script debe ejecutarse en la consola SQL de Supabase

-- 1. Crear el bucket 'public' si no existe
-- Nota: Los buckets se crean desde la interfaz de Supabase Storage, no desde SQL
-- Ve a Storage > New bucket > Nombre: "public" > Public bucket: true

-- 2. Configurar políticas de acceso para el bucket 'public'
-- Política para permitir subir archivos (solo usuarios autenticados)
CREATE POLICY "Allow authenticated users to upload flyers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'public' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'flyers'
);

-- Política para permitir leer archivos (público)
CREATE POLICY "Allow public to view flyers" ON storage.objects
FOR SELECT USING (
  bucket_id = 'public' AND
  (storage.foldername(name))[1] = 'flyers'
);

-- Política para permitir actualizar archivos (solo usuarios autenticados)
CREATE POLICY "Allow authenticated users to update flyers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'public' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'flyers'
);

-- Política para permitir eliminar archivos (solo usuarios autenticados)
CREATE POLICY "Allow authenticated users to delete flyers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'public' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'flyers'
);

-- 3. Configurar el bucket como público
-- Esto se hace desde la interfaz de Supabase Storage
-- Ve a Storage > public bucket > Settings > Public bucket: true 