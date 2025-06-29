# Funcionalidad de Leyendas Editables en Tablas de Posiciones

## Descripción
Se ha implementado una funcionalidad que permite agregar leyendas editables (como "Apertura 2024", "Clausura 2024") a las tablas de posiciones desde el panel de administración.

## Cambios Implementados

### 1. Base de Datos
- Se agregó el campo `legend` (TEXT) a la tabla `zonas`
- El campo es opcional y permite texto libre
- Se creó un índice para mejorar el rendimiento

### 2. Tipos y Interfaces
- **`src/types/database.ts`**: Agregado campo `legend` a la interfaz de zonas
- **`src/contexts/LeagueContext.tsx`**: Actualizada interfaz `Zone` con campo `legend`
- **`src/services/zonesService.ts`**: Actualizado servicio para manejar el campo `legend`

### 3. Interfaz de Administración
- **`src/pages/admin/ZonesPage.tsx`**: 
  - Agregado campo de entrada para leyenda en el formulario
  - Nueva columna en la tabla para mostrar leyendas
  - Validación y guardado del campo legend

### 4. Visualización en Tablas de Posiciones
- **`src/components/league/PublicStandingsTable.tsx`**: 
  - Muestra la leyenda en un banner destacado arriba de la tabla
- **`src/components/league/StandingsTable.tsx`**: 
  - Muestra la leyenda en el header de la tabla del admin

## Instrucciones de Implementación

### Paso 1: Actualizar la Base de Datos
1. Ir al SQL Editor de Supabase
2. Ejecutar el script `scripts/add_legend_to_zones.sql`
3. Verificar que el campo se agregó correctamente

### Paso 2: Verificar los Cambios
1. Los cambios en el código ya están implementados
2. Reiniciar la aplicación
3. Ir al panel de administración → Zonas
4. Verificar que aparece el campo "Leyenda de Tabla" en el formulario

### Paso 3: Probar la Funcionalidad
1. **Editar una zona existente**:
   - Ir a Admin → Zonas
   - Hacer clic en el ícono de editar
   - Agregar una leyenda como "Apertura 2024"
   - Guardar cambios

2. **Verificar en las tablas de posiciones**:
   - Ir a la página pública de la liga
   - Seleccionar la zona editada
   - Verificar que aparece la leyenda arriba de la tabla

3. **Verificar en el admin**:
   - Ir a Admin → Posiciones
   - Seleccionar la zona con leyenda
   - Verificar que aparece la leyenda en el header

## Características de la Funcionalidad

### ✅ Funcionalidades Implementadas
- **Campo editable**: Los administradores pueden agregar/editar leyendas
- **Visualización destacada**: Las leyendas se muestran en banners con diseño atractivo
- **Opcional**: Las zonas sin leyenda funcionan normalmente
- **Persistencia**: Las leyendas se guardan en la base de datos
- **Responsive**: Funciona en móvil y desktop

### 🎨 Diseño Visual
- **Tabla pública**: Banner azul con gradiente arriba de la tabla
- **Admin**: Badge azul en el header de la tabla
- **Formulario**: Campo de texto con placeholder descriptivo
- **Lista de zonas**: Badge azul para zonas con leyenda, texto gris para zonas sin leyenda

### 🔧 Configuración
- **Campo opcional**: No es obligatorio agregar leyenda
- **Texto libre**: Permite cualquier texto (ej: "Apertura 2024", "Clausura 2024", "Torneo Especial")
- **Validación**: No hay restricciones de longitud o formato

## Ejemplos de Uso

### Leyendas Comunes
- "Apertura 2024"
- "Clausura 2024"
- "Torneo de Verano"
- "Copa de Invierno"
- "Liga Regular"
- "Playoffs"

### Casos de Uso
1. **Torneos por temporada**: Diferenciar entre apertura y clausura
2. **Torneos especiales**: Marcar torneos de verano, invierno, etc.
3. **Fases de competencia**: Distinguir entre fase regular y playoffs
4. **Información temporal**: Agregar fechas o períodos específicos

## Notas Técnicas

### Base de Datos
- Campo: `legend` (TEXT, NULLABLE)
- Índice: `idx_zonas_legend` para optimizar búsquedas
- Compatibilidad: No afecta zonas existentes

### Rendimiento
- Campo indexado para búsquedas rápidas
- Carga lazy: Solo se carga cuando se necesita
- No impacta el rendimiento de las tablas existentes

### Compatibilidad
- **Retrocompatible**: Las zonas sin leyenda funcionan normalmente
- **Migración automática**: No requiere migración de datos existentes
- **Fallback**: Si no hay leyenda, no se muestra nada

## Troubleshooting

### Problema: No aparece el campo en el formulario
**Solución**: Verificar que se ejecutó correctamente el script SQL

### Problema: La leyenda no se guarda
**Solución**: Verificar la consola del navegador para errores de red

### Problema: No se muestra la leyenda en las tablas
**Solución**: Verificar que la zona tiene el campo legend poblado en la base de datos

## Próximas Mejoras Posibles

1. **Leyendas por categoría**: Permitir diferentes leyendas por categoría
2. **Leyendas temporales**: Configurar fechas de inicio/fin para leyendas
3. **Plantillas**: Sugerencias de leyendas comunes
4. **Formato rico**: Permitir HTML básico en las leyendas
5. **Historial**: Mantener historial de leyendas por zona 