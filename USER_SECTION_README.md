# 🏆 Sección de Usuarios - Liga Infantil

Este proyecto incluye una sección completa de usuarios para la página web de liga infantil, con funcionalidades de registro, inicio de sesión y gestión de perfiles.

## ✨ Características Principales

### 🔐 Autenticación de Usuarios
- **Registro de nuevos usuarios** con validaciones completas
- **Inicio de sesión** por documento (con o sin contraseña)
- **Gestión de perfiles** con edición de información personal
- **Sesiones persistentes** usando localStorage

### 📝 Formulario de Registro
- Nombre y apellido
- Fecha de nacimiento (con validación de edad mínima)
- Documento (solo números, único en la base de datos)
- Escuela
- Equipo (select con equipos precargados)
- Email (opcional)
- Contraseña (opcional)

### ✅ Validaciones Implementadas
- Todos los campos obligatorios
- Fecha de nacimiento válida (mínimo 5 años)
- Documento solo números
- Verificación de documento único
- Validación de email (si se proporciona)

### 🎨 Interfaz de Usuario
- **Diseño responsive** para móviles y tablets
- **Interfaz amigable** para niños y padres
- **Colores atractivos** con gradientes y emojis
- **Navegación intuitiva** con dropdown y modales

## 🚀 Instalación

### 1. Crear la Tabla de Usuarios

Ejecuta el script SQL para crear la tabla de usuarios:

```sql
-- Ejecutar en tu base de datos Supabase
\i scripts/create_users_table.sql
```

### 2. Verificar Dependencias

Asegúrate de que tienes las siguientes dependencias en tu `package.json`:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

### 3. Configuración de Supabase

Verifica que tu archivo `src/lib/supabase.ts` tenga la configuración correcta:

```typescript
const supabaseUrl = 'TU_URL_DE_SUPABASE'
const supabaseKey = 'TU_ANON_KEY_DE_SUPABASE'
```

## 📁 Estructura de Archivos

```
src/
├── components/
│   └── user/
│       ├── UserAuthForm.tsx      # Formulario de login/registro
│       ├── UserProfile.tsx       # Perfil del usuario
│       └── UserNav.tsx          # Navegación de usuario
├── contexts/
│   └── UserAuthContext.tsx      # Contexto de autenticación
├── services/
│   └── userService.ts           # Servicios de usuario
├── pages/
│   └── UserAuthPage.tsx         # Página de autenticación
└── types/
    └── database.ts              # Tipos de base de datos
```

## 🔧 Uso

### 1. Acceso a la Sección de Usuarios

Los usuarios pueden acceder a través de:
- **URL directa**: `/user/auth`
- **Botón en el header**: "🏆 Iniciar Sesión"

### 2. Flujo de Registro

1. El usuario hace clic en "Crear Cuenta"
2. Completa el formulario con sus datos
3. Selecciona su equipo de la lista precargada
4. El sistema valida todos los campos
5. Se crea la cuenta y se inicia sesión automáticamente

### 3. Flujo de Login

1. El usuario ingresa su documento
2. Opcionalmente ingresa contraseña (si la tiene)
3. El sistema verifica la autenticación
4. Se inicia la sesión y se redirige al inicio

### 4. Gestión del Perfil

Una vez autenticado, el usuario puede:
- Ver su información personal
- Editar datos del perfil
- Cambiar de equipo
- Cerrar sesión

## 🎯 Endpoints de la API

### Usuarios
- `POST /usuarios` - Crear nuevo usuario
- `GET /usuarios/:id` - Obtener usuario por ID
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario

### Equipos
- `GET /equipos` - Obtener todos los equipos
- `GET /equipos?liga_id=:id` - Equipos por liga
- `GET /equipos?zona_id=:id` - Equipos por zona

## 🔒 Seguridad

### Validaciones del Cliente
- Validación de campos obligatorios
- Validación de formato de documento
- Validación de fecha de nacimiento
- Verificación de documento único

### Validaciones del Servidor
- Verificación de documento único en base de datos
- Sanitización de datos de entrada
- Control de acceso a endpoints

## 📱 Responsive Design

La interfaz está optimizada para:
- **Móviles**: Layout vertical, botones grandes
- **Tablets**: Layout híbrido, navegación mejorada
- **Desktop**: Layout horizontal completo, todas las funcionalidades

## 🎨 Personalización

### Colores y Estilos
Los colores principales se pueden personalizar en:
- `src/index.css` - Variables CSS globales
- `tailwind.config.js` - Configuración de Tailwind

### Emojis y Iconos
Los emojis se pueden cambiar en:
- `UserAuthForm.tsx` - Formularios
- `UserProfile.tsx` - Perfil
- `UserNav.tsx` - Navegación

## 🐛 Solución de Problemas

### Error: "Ya existe un usuario con ese documento"
- Verifica que el documento sea único en la base de datos
- Revisa la configuración de índices en Supabase

### Error: "Usuario no encontrado"
- Verifica que el documento esté correctamente ingresado
- Confirma que el usuario exista en la base de datos

### Problemas de Rendimiento
- Verifica la configuración de índices en Supabase
- Revisa las consultas en `userService.ts`

## 🔮 Próximas Funcionalidades

- [ ] **Notificaciones push** para partidos y resultados
- [ ] **Chat entre jugadores** del mismo equipo
- [ ] **Calendario personal** de partidos
- [ ] **Estadísticas individuales** del jugador
- [ ] **Sistema de logros** y badges
- [ ] **Integración con redes sociales**

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa este README
2. Verifica la consola del navegador
3. Revisa los logs de Supabase
4. Contacta al equipo de desarrollo

## 📄 Licencia

Este proyecto está bajo la misma licencia que el proyecto principal de la Liga Infantil.

---

**¡Disfruta usando la nueva sección de usuarios! ⚽🏆**
