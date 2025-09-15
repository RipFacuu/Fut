# 🏆 Sistema de Prode - Pronósticos Deportivos

Este proyecto incluye un sistema completo de pronósticos deportivos (Prode) para la liga infantil, donde los usuarios pueden predecir resultados de partidos y competir por puntos.

## ✨ **Características Principales**

### ⚽ **Gestión de Partidos**
- **Partidos basados en fixtures existentes** de la base de datos
- **Filtros por fecha y categoría** para organizar los partidos
- **Información completa** de equipos, zonas y horarios
- **Estados visuales** (abierto, cerrado, predicho)

### 🎯 **Sistema de Predicciones**
- **Tres opciones**: Local gana, Empate, Visitante gana
- **Deadline de 15 minutos** antes del partido
- **Predicciones únicas** por usuario y partido
- **Edición permitida** hasta que se cierre el plazo

### 🏆 **Sistema de Puntos**
- **3 puntos** por predicción correcta
- **0 puntos** por predicción incorrecta
- **Cálculo automático** de puntuaciones
- **Tabla de posiciones** en tiempo real

### 📊 **Estadísticas y Ranking**
- **Estadísticas individuales** de cada usuario
- **Tabla de posiciones** con ranking
- **Porcentaje de precisión** por usuario
- **Historial de predicciones** y resultados

## 🚀 **Instalación**

### 1. **Ejecutar Scripts SQL**

Primero ejecuta el script para crear las tablas del Prode:

```sql
-- Crear tablas del sistema de Prode
\i scripts/create_prode_tables.sql
```

### 2. **Verificar Dependencias**

Asegúrate de que tienes las siguientes dependencias:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

### 3. **Configuración de Base de Datos**

El sistema creará automáticamente:
- Tabla `prode_predictions` para predicciones de usuarios
- Tabla `prode_user_scores` para puntuaciones acumuladas
- Tabla `prode_config` para configuración del sistema
- Funciones SQL para cálculos automáticos

## 📁 **Estructura de Archivos**

```
src/
├── components/
│   └── prode/
│       ├── ProdeMatchCard.tsx      # Tarjeta de partido individual
│       └── ProdeLeaderboard.tsx    # Tabla de posiciones
├── services/
│   └── prodeService.ts             # Servicios del Prode
├── pages/
│   └── ProdePage.tsx               # Página principal del Prode
└── types/
    └── database.ts                  # Tipos de base de datos
```

## 🔧 **Uso del Sistema**

### 1. **Acceso al Prode**

Los usuarios pueden acceder a través de:
- **URL directa**: `/prode`
- **Navegación**: Botón "🏆 Prode" en el header
- **Requerimiento**: Usuario autenticado (opcional para ver)

### 2. **Hacer Predicciones**

1. **Seleccionar partido** de la lista disponible
2. **Elegir predicción**: Local, Empate o Visitante
3. **Confirmar selección** (se guarda automáticamente)
4. **Cambiar predicción** hasta que se cierre el plazo

### 3. **Ver Resultados**

- **Puntos automáticos** al cargar resultados de partidos
- **Estadísticas actualizadas** en tiempo real
- **Ranking actualizado** con nuevas puntuaciones

## 🎯 **Endpoints de la API**

### Predicciones
- `POST /prode_predictions` - Crear predicción
- `PUT /prode_predictions` - Actualizar predicción
- `GET /prode_predictions` - Obtener predicciones del usuario

### Puntuaciones
- `GET /prode_user_scores` - Obtener puntuación del usuario
- `GET /prode_user_scores` - Obtener tabla de posiciones

### Configuración
- `GET /prode_config` - Obtener configuración del sistema

## 🔒 **Reglas del Juego**

### **Plazos de Predicción**
- ✅ **Abierto**: Hasta 15 minutos antes del partido
- 🔒 **Cerrado**: 15 minutos antes del partido
- ⚠️ **No editable**: Una vez cerrado el plazo

### **Sistema de Puntos**
- 🎯 **Acierto**: 3 puntos
- ❌ **Fallo**: 0 puntos
- 📊 **Total**: Suma de todos los aciertos

### **Restricciones**
- **Una predicción por partido** por usuario
- **No se pueden predecir partidos cerrados**
- **Las predicciones son finales** después del deadline

## 🎨 **Interfaz de Usuario**

### **Diseño Responsive**
- **Desktop**: Vista completa con todas las funcionalidades
- **Tablet**: Layout adaptado para pantallas medianas
- **Móvil**: Vista optimizada para dispositivos pequeños

### **Elementos Visuales**
- **Colores diferenciados** para cada tipo de predicción
- **Iconos intuitivos** (🏠 Local, 🤝 Empate, 🚌 Visitante)
- **Estados visuales** claros para cada partido
- **Animaciones suaves** para mejor experiencia

### **Navegación**
- **Tabs principales**: Partidos y Tabla de Posiciones
- **Filtros avanzados**: Por fecha y categoría
- **Búsqueda rápida** de partidos específicos

## 📱 **Funcionalidades por Dispositivo**

### **Desktop**
- ✅ Todas las funcionalidades
- ✅ Vista de tabla completa
- ✅ Filtros avanzados
- ✅ Estadísticas detalladas

### **Tablet**
- ✅ Funcionalidades principales
- ✅ Layout adaptado
- ✅ Navegación optimizada
- ✅ Filtros básicos

### **Móvil**
- ✅ Predicciones esenciales
- ✅ Vista de tarjetas
- ✅ Navegación táctil
- ✅ Información condensada

## 🔧 **Configuración del Sistema**

### **Parámetros Ajustables**
```sql
-- En la tabla prode_config
points_per_correct_prediction: 3        -- Puntos por acierto
points_per_incorrect_prediction: 0      -- Puntos por fallo
prediction_deadline_minutes: 15         -- Minutos antes del partido
is_active: true                         -- Sistema activo/inactivo
```

### **Personalización**
- **Puntos por predicción** ajustables
- **Deadline configurable** por administrador
- **Sistema activo/inactivo** según temporada

## 🐛 **Solución de Problemas**

### **Error: "Ya no se puede predecir este partido"**
- Verificar que el partido no esté cerrado
- Revisar configuración de deadline
- Confirmar hora del servidor

### **Error: "Ya has hecho una predicción para este partido"**
- Verificar predicciones existentes
- Usar función de actualización
- Revisar permisos de usuario

### **Problemas de Rendimiento**
- Verificar índices de base de datos
- Revisar consultas en `prodeService.ts`
- Optimizar carga de partidos

## 🔮 **Próximas Funcionalidades**

- [ ] **Notificaciones push** para partidos próximos
- [ ] **Chat entre jugadores** del Prode
- [ ] **Ligas privadas** para grupos específicos
- [ ] **Estadísticas avanzadas** por categoría
- [ ] **Sistema de logros** y badges
- [ ] **Exportar predicciones** a PDF/Excel
- [ ] **API pública** para integraciones externas

## 📊 **Métricas y Analytics**

### **Datos Recopilados**
- **Total de predicciones** por partido
- **Distribución de predicciones** (Local/Empate/Visitante)
- **Tasa de participación** por usuario
- **Tendencias de predicciones** por categoría

### **Reportes Disponibles**
- **Ranking semanal/mensual**
- **Estadísticas por categoría**
- **Participación por zona**
- **Evolución de puntuaciones**

## 🎯 **Casos de Uso**

### **Para Jugadores**
- **Competir** por el primer lugar
- **Mejorar** habilidades de predicción
- **Seguir** el progreso personal
- **Comparar** con otros jugadores

### **Para Administradores**
- **Monitorear** participación del sistema
- **Analizar** tendencias de predicciones
- **Configurar** parámetros del juego
- **Generar** reportes de actividad

### **Para Padres/Familias**
- **Acompañar** a los niños en el juego
- **Fomentar** participación deportiva
- **Celebrar** aciertos y logros
- **Crear** competencia familiar

## 📞 **Soporte Técnico**

### **Documentación**
- Este README
- Comentarios en el código
- Tipos TypeScript
- Interfaces de servicios

### **Contacto**
- Revisar logs de consola
- Verificar errores de Supabase
- Consultar documentación de la API
- Contactar al equipo de desarrollo

## 📄 **Licencia**

Este sistema de Prode está bajo la misma licencia que el proyecto principal de la Liga Infantil.

---

## 🚀 **¡El Prode está listo para usar!**

**Características implementadas:**
- ✅ Sistema completo de predicciones
- ✅ Gestión de partidos y fixtures
- ✅ Cálculo automático de puntos
- ✅ Tabla de posiciones en tiempo real
- ✅ Interfaz responsive y amigable
- ✅ Filtros por fecha y categoría
- ✅ Estadísticas individuales
- ✅ Validaciones de seguridad

**Para empezar:**
1. Ejecuta `scripts/create_prode_tables.sql`
2. Accede a `/prode` en tu aplicación
3. ¡Comienza a hacer predicciones!

**¡Que gane el mejor pronosticador! 🏆⚽**
