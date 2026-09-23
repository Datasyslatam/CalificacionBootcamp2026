# Configuración de Supabase - Guía Rápida

## ⚠️ IMPORTANTE: La aplicación usa Supabase, NO localStorage

Esta aplicación está diseñada para almacenar TODOS los datos en Supabase (base de datos en la nube). Los datos NO se guardan en localStorage del navegador.

## 🚀 Pasos para Configurar Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta gratuita
3. Haz clic en "New Project"
4. Completa la información:
   - **Name**: `bootcamp-digital-factory`
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Selecciona la más cercana (ej: South America - São Paulo)
5. Espera a que el proyecto se inicialice (2-3 minutos)

### 2. Crear las Tablas en Supabase

1. En el panel de Supabase, ve a **SQL Editor** (icono de terminal en el menú lateral)
2. Haz clic en "New Query"
3. Copia TODO el contenido del archivo `SUPABASE_SCHEMA.sql`
4. Pégalo en el editor
5. Haz clic en "Run" (o presiona Ctrl+Enter)
6. Verifica que todas las tablas se crearon correctamente en **Table Editor**

### 3. Configurar Variables de Entorno

1. En Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public key** (clave pública)

3. En la raíz del proyecto, crea un archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE**: 
- Reemplaza los valores con tus credenciales reales de Supabase
- La variable debe empezar con `VITE_` para que Vite la reconozca
- NO subas el archivo `.env` a Git (ya está en .gitignore)

### 4. Reiniciar el Servidor de Desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Luego ejecutar:
npm run dev
```

### 5. Verificar la Configuración

1. Abre la aplicación en tu navegador
2. Abre la consola del navegador (F12)
3. Deberías ver estos mensajes:

```
✅ Supabase configurado - usando base de datos en la nube
🔄 Cargando datos desde Supabase...
🔍 Consultando equipos desde Supabase...
✅ Equipos obtenidos: 10
🔍 Consultando jurados desde Supabase...
✅ Jurados obtenidos: 5
🔍 Consultando calificaciones desde Supabase...
✅ Calificaciones obtenidas: 0
✅ Todos los datos cargados desde Supabase exitosamente
```

4. En el header de la aplicación, deberías ver un badge verde que dice **"☁️ Sincronizado"**

## 📊 Verificar que los Datos se Guardan en Supabase

### Prueba 1: Editar Nombre de Jurado

1. En la página de inicio, haz clic en "✏️ Editar"
2. Cambia el nombre de un jurado
3. Ve a Supabase → **Table Editor** → **jurados**
4. Verifica que el nombre se actualizó en la base de datos

### Prueba 2: Guardar Calificación

1. Selecciona un jurado
2. Selecciona un equipo
3. Asigna calificaciones
4. Guarda la calificación
5. Ve a Supabase → **Table Editor** → **calificaciones**
6. Verifica que la calificación se guardó en la base de datos

### Prueba 3: Sincronización entre Navegadores

1. Abre la aplicación en **Chrome** (`http://localhost:5173`)
2. Abre la aplicación en **Firefox** (`http://localhost:5173`)
3. En **Chrome**, edita el nombre de un jurado
4. En **Firefox**, recarga la página (F5)
5. ✅ Verifica que el nombre del jurado se actualizó en Firefox

## 🔍 Solución de Problemas

### Problema: "Supabase no configurado"

**Causa**: Las variables de entorno no están configuradas correctamente

**Solución**:
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que las variables empiecen con `VITE_`
3. Reinicia el servidor de desarrollo
4. Limpia la caché del navegador (Ctrl+Shift+R)

### Problema: "relation does not exist"

**Causa**: Las tablas no se crearon en Supabase

**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta el script `SUPABASE_SCHEMA.sql`
3. Verifica en Table Editor que las tablas existen

### Problema: "permission denied" o "policy violation"

**Causa**: Las políticas RLS no están configuradas correctamente

**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta las políticas RLS del script SQL
3. Verifica en Authentication → Policies que las políticas están activas

### Problema: Los datos no se sincronizan entre navegadores

**Causa**: Posible problema de caché o configuración

**Solución**:
1. Limpia la caché del navegador (Ctrl+Shift+R)
2. Verifica que el badge en el header diga "☁️ Sincronizado" (verde)
3. Verifica en la consola que no hay errores
4. Recarga la página en ambos navegadores

## 📝 Estructura de Datos en Supabase

### Tabla: equipos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int8 | Identificador único (auto-increment) |
| nombre | text | Nombre del equipo |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

### Tabla: jurados
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int8 | Identificador único (auto-increment) |
| nombre | text | Nombre del jurado |
| cargo | text | Cargo o rol del jurado |
| avatar | text | Emoji o identificador visual |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

### Tabla: calificaciones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int8 | Identificador único (auto-increment) |
| jurado_id | int8 | ID del jurado (FK) |
| equipo_id | int8 | ID del equipo (FK) |
| calificaciones | jsonb | Objeto JSON con puntuaciones |
| comentarios | text | Comentarios del jurado |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de última actualización |

## ✅ Checklist de Verificación

- [ ] Archivo `.env` creado con las credenciales de Supabase
- [ ] Servidor de desarrollo reiniciado después de configurar `.env`
- [ ] Script SQL ejecutado en Supabase (tablas creadas)
- [ ] Políticas RLS configuradas en Supabase
- [ ] Consola muestra "✅ Supabase configurado"
- [ ] Badge en header muestra "☁️ Sincronizado" (verde)
- [ ] Datos se cargan desde Supabase (ver logs en consola)
- [ ] Edición de jurados se guarda en Supabase
- [ ] Calificaciones se guardan en Supabase
- [ ] Datos se sincronizan entre navegadores

## 🎯 Comportamiento Esperado

### Cuando Supabase está configurado:
- ✅ Los datos se cargan desde Supabase al iniciar
- ✅ Los cambios se guardan en Supabase inmediatamente
- ✅ Los datos se sincronizan en tiempo real entre navegadores
- ✅ NO se usa localStorage
- ✅ Badge verde "☁️ Sincronizado" visible en el header

### Cuando Supabase NO está configurado:
- ⚠️ Los datos se cargan desde localStorage
- ⚠️ Los cambios se guardan en localStorage
- ⚠️ Los datos NO se sincronizan entre navegadores
- ⚠️ Badge amarillo "💾 Local" visible en el header

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa la consola del navegador (F12) para ver los logs
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de que el script SQL se ejecutó correctamente
4. Consulta el archivo `TROUBLESHOOTING.md` para más detalles

## 🔒 Seguridad

**IMPORTANTE**: 
- Nunca subas tu archivo `.env` a Git
- Usa la clave `anon` (pública) solo en el frontend
- Las políticas RLS están configuradas para permitir acceso público
- Para producción, considera implementar autenticación
