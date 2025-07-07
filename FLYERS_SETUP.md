# 🎯 Configuración del Sistema de Flyers

## 📋 Pasos para configurar el carrusel de flyers

### 1. Crear la tabla en la base de datos

Ejecuta el siguiente SQL en la consola de Supabase:

```sql
-- Crear tabla para flyers
CREATE TABLE IF NOT EXISTS flyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para ordenar flyers
CREATE INDEX IF NOT EXISTS idx_flyers_order ON flyers(order_index, is_active);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flyers_updated_at 
    BEFORE UPDATE ON flyers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configurar Storage en Supabase

#### Opción A: Crear bucket "public" (Recomendado)

1. Ve a **Storage** en tu dashboard de Supabase
2. Haz clic en **"New bucket"**
3. Configura:
   - **Name**: `public`
   - **Public bucket**: ✅ Marcar como público
   - **File size limit**: 50MB (o el límite que prefieras)
4. Haz clic en **"Create bucket"**

#### Opción B: Usar bucket existente

Si ya tienes un bucket (como "avatars"), el sistema lo detectará automáticamente.

### 3. Configurar políticas de acceso

Ejecuta este SQL en la consola de Supabase:

```sql
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
```

### 4. Verificar configuración

1. **Reinicia la aplicación** si está corriendo
2. Ve al panel de administración (`/admin`)
3. Haz clic en **"Flyers"** en el menú lateral
4. Intenta crear un nuevo flyer con una imagen

## 🔧 Solución de problemas

### Error: "Bucket not found"

Si ves este error, significa que el bucket no está configurado correctamente:

1. **Verifica que el bucket existe** en Storage
2. **Asegúrate de que el nombre sea exactamente "public"**
3. **Verifica las políticas de acceso**

### Fallback automático

El sistema incluye un fallback automático:
- Si Supabase Storage falla, las imágenes se convierten a base64
- Esto permite que el sistema funcione incluso sin storage configurado
- Las imágenes base64 se almacenan directamente en la base de datos

### Tamaño de archivos

- **Límite recomendado**: 2-5MB por imagen
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Resolución recomendada**: 1200x600px para mejor rendimiento

## 🎨 Características del carrusel

- **Navegación automática** cada 5 segundos
- **Controles manuales** (flechas izquierda/derecha)
- **Indicadores de posición** (puntos)
- **Diseño responsive** para móviles y desktop
- **Efectos de transición** suaves
- **Overlay con gradiente** para mejor legibilidad
- **Enlaces opcionales** en cada flyer

## 📱 Uso

### Para administradores:
1. Ve a `/admin/flyers`
2. Haz clic en "Nuevo Flyer"
3. Sube una imagen, agrega título y descripción
4. Configura orden y estado activo
5. Guarda el flyer

### Para usuarios:
- Los flyers activos se muestran automáticamente en la página principal
- Navegación automática y manual disponible
- Enlaces funcionales si están configurados

## 🚀 Próximos pasos

Una vez configurado, puedes:
- Agregar más flyers
- Configurar diferentes órdenes
- Activar/desactivar flyers según necesites
- Personalizar los estilos del carrusel 