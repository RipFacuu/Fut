# 🧪 Usuarios Locales para Pruebas

## 🎯 **Objetivo**
Este archivo contiene las instrucciones para probar el sistema de usuarios y Prode **SIN necesidad de base de datos**. Los usuarios están hardcodeados en el código para pruebas locales.

## 🔑 **Usuarios Disponibles para Pruebas**

### **Usuario 1: Juan Pérez**
- **Documento**: `12345678`
- **Contraseña**: `password123`
- **Email**: juan.perez@test.com
- **Escuela**: Escuela Primaria San Martín

### **Usuario 2: María González**
- **Documento**: `87654321`
- **Contraseña**: `(sin contraseña)`
- **Email**: maria.gonzalez@test.com
- **Escuela**: Escuela Primaria San Martín

### **Usuario 3: Carlos Rodríguez**
- **Documento**: `11223344`
- **Contraseña**: `carlos123`
- **Email**: carlos.rodriguez@test.com
- **Escuela**: Escuela Primaria Belgrano

## 🚀 **Cómo Probar**

### **1. Iniciar Sesión**
1. Ve a `/user/auth` en tu aplicación
2. Usa cualquiera de los usuarios de arriba
3. **Importante**: Si el usuario no tiene contraseña, deja el campo vacío

### **2. Probar el Prode**
1. Una vez logueado, ve a `/prode`
2. Verás las estadísticas del usuario en el header
3. Puedes hacer predicciones en los partidos disponibles

### **3. Ver Perfil**
1. Haz clic en tu nombre en el header (derecha)
2. Selecciona "Ver Perfil"
3. Edita tu información si quieres

## 🔍 **Debug y Consola**

### **Mensajes en Consola**
El sistema mostrará en la consola del navegador:
- 🔐 Intentando login con documento: [número]
- 👤 Usuario local encontrado: [datos del usuario]
- 🔒 Verificando contraseña...
- ✅ Contraseña correcta
- 🎉 Login exitoso para: [nombre]

### **Si Algo No Funciona**
1. Abre la consola del navegador (F12)
2. Busca mensajes de error
3. Verifica que estés usando el documento correcto

## ⚠️ **Limitaciones de Usuarios Locales**

### **Lo que SÍ funciona:**
- ✅ Login y logout
- ✅ Navegación por la aplicación
- ✅ Acceso al Prode
- ✅ Ver perfil del usuario
- ✅ Estadísticas básicas

### **Lo que NO funciona (hasta tener BD):**
- ❌ Crear nuevos usuarios
- ❌ Guardar predicciones reales
- ❌ Tabla de posiciones del Prode
- ❌ Persistencia de datos entre sesiones

## 🔄 **Transición a Base de Datos Real**

### **Cuando quieras usar la BD real:**
1. Ejecuta `scripts/create_prode_tables.sql`
2. Ejecuta `scripts/create_users_table.sql`
3. Inserta usuarios reales en la BD
4. Los usuarios locales seguirán funcionando como fallback

## 🎮 **Flujo de Prueba Recomendado**

### **Paso 1: Login**
```
URL: /user/auth
Usuario: 12345678
Contraseña: password123
```

### **Paso 2: Explorar Aplicación**
- Navegar por el header
- Ver tu perfil
- Explorar diferentes secciones

### **Paso 3: Probar Prode**
```
URL: /prode
- Ver estadísticas del usuario
- Explorar filtros
- Ver tabla de posiciones
```

### **Paso 4: Logout y Login con Otro Usuario**
```
Usuario: 87654321
Contraseña: (dejar vacío)
```

## 🐛 **Solución de Problemas Comunes**

### **Error: "Usuario no encontrado"**
- Verifica que estés usando uno de los 3 documentos válidos
- Asegúrate de que no haya espacios extra
- Revisa la consola para mensajes de debug

### **Error: "Contraseña incorrecta"**
- Para Juan: usa `password123`
- Para Carlos: usa `carlos123`
- Para María: deja el campo vacío

### **No se muestra el perfil**
- Verifica que hayas hecho login correctamente
- Revisa que aparezca tu nombre en el header
- Haz clic en el avatar/nombre para abrir el menú

## 📱 **Pruebas en Diferentes Dispositivos**

### **Desktop**
- Todas las funcionalidades disponibles
- Navegación completa
- Filtros del Prode

### **Tablet/Móvil**
- Layout responsive
- Navegación adaptada
- Funcionalidades principales

## 🎯 **Próximos Pasos**

1. **Prueba el login** con los usuarios locales
2. **Explora la aplicación** y el Prode
3. **Reporta cualquier problema** que encuentres
4. **Cuando esté listo**, configura la base de datos real

---

## 🎉 **¡Listo para Probar!**

**Usuarios disponibles:**
- `12345678` + `password123` (Juan)
- `87654321` + sin contraseña (María)  
- `11223344` + `carlos123` (Carlos)

**URLs principales:**
- Login: `/user/auth`
- Prode: `/prode`
- Inicio: `/`

**¡Disfruta probando el sistema! 🚀⚽**
