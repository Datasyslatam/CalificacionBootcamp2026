# Configuración de Supabase - Bootcamp Digital Factory

## 📋 Tabla de Contenidos
1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Configurar Base de Datos](#2-configurar-base-de-datos)
3. [Configurar Variables de Entorno](#3-configurar-variables-de-entorno)
4. [Verificar Conexión](#4-verificar-conexión)
5. [Estructura de Datos](#5-estructura-de-datos)

---

## 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta gratuita
3. Haz clic en "New Project"
4. Completa la información:
   - **Name**: `bootcamp-digital-factory`
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Selecciona la más cercana (ej: South America - São Paulo)
5. Espera a que el proyecto se inicialice (2-3 minutos)

## 2. Configurar Base de Datos

### Opción A: Usando el SQL Editor (Recomendado)

1. En el panel de Supabase, ve a **SQL Editor** (icono de terminal)
2. Haz clic en "New Query"
3. Copia todo el contenido del archivo `SUPABASE_SCHEMA.sql`
4. Pégalo en el editor
5. Haz clic en "Run" (o presiona Ctrl+Enter)
6. Verifica que todas las tablas se crearon correctamente

### Opción B: Usando la Interfaz Gráfica

Si prefieres crear las tablas manualmente:

#### Tabla: equipos
- Ve a **Table Editor** → **New Table**
- Nombre: `equipos`
- Columnas:
  - `id` (int8, primary key, auto-increment)
  - `nombre` (text, not null)
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())

#### Tabla: jurados
- Nombre: `jurados`
- Columnas:
  - `id` (int8, primary key, auto-increment)
  - `nombre` (text, not null)
  - `cargo` (text, default: 'Evaluador')
  - `avatar` (text, default: '👤')
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())

#### Tabla: calificaciones
- Nombre: `calificaciones`
- Columnas:
  - `id` (int8, primary key, auto-increment)
  - `jurado_id` (int8, foreign key → jurados.id)
  - `equipo_id` (int8, foreign key → equipos.id)
  - `calificaciones` (jsonb, default: '{}')
  - `comentarios` (text, default: '')
  - `created_at` (timestamptz, default: now())
  - `updated_at` (timestamptz, default: now())
- Constraints:
  - Unique constraint en (jurado_id, equipo_id)

### Habilitar RLS y Políticas

1. Ve a **Authentication** → **Policies**
2. Para cada tabla (equipos, jurados, calificaciones):
   - Activa **Row Level Security (RLS)**
   - Crea las siguientes políticas:

#### Para equipos:
```sql
-- SELECT
CREATE POLICY "equipos_select" ON equipos
FOR SELECT USING (true);

-- INSERT
CREATE POLICY "equipos_insert" ON equipos
FOR INSERT WITH CHECK (true);

-- UPDATE
CREATE POLICY "equipos_update" ON equipos
FOR UPDATE USING (true) WITH CHECK (true);

-- DELETE
CREATE POLICY "equipos_delete" ON equipos
FOR DELETE USING (true);
```

#### Para jurados:
```sql
-- SELECT
CREATE POLICY "jurados_select" ON jurados
FOR SELECT USING (true);

-- UPDATE
CREATE POLICY "jurados_update" ON jurados
FOR UPDATE USING (true) WITH CHECK (true);
```

#### Para calificaciones:
```sql
-- SELECT
CREATE POLICY "calificaciones_select" ON calificaciones
FOR SELECT USING (true);

-- INSERT
CREATE POLICY "calificaciones_insert" ON calificaciones
FOR INSERT WITH CHECK (true);

-- UPDATE
CREATE POLICY "calificaciones_update" ON calificaciones
FOR UPDATE USING (true) WITH CHECK (true);

-- DELETE
CREATE POLICY "calificaciones_delete" ON calificaciones
FOR DELETE USING (true);
```

## 3. Configurar Variables de Entorno

### Obtener las credenciales

1. En Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public key** (clave pública)

### Crear archivo .env

En la raíz del proyecto, crea un archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

**IMPORTANTE**: 
- Reemplaza los valores con tus credenciales reales
- NO subas el archivo `.env` a Git (ya está en .gitignore)
- La variable debe empezar con `VITE_` para que Vite la reconozca

### Ejemplo de archivo .env

```env
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Verificar Conexión

### Ejecutar la aplicación

```bash
npm run dev
```

### Verificar en el navegador

1. Abre la aplicación en tu navegador
2. Abre la consola del navegador (F12)
3. Deberías ver un mensaje indicando si la conexión fue exitosa
4. Intenta realizar una operación (crear equipo, calificar, etc.)
5. Verifica en Supabase → **Table Editor** que los datos se guardaron

### Solución de problemas

#### Error: "Supabase no está configurado"
- Verifica que el archivo `.env` existe
- Verifica que las variables están bien escritas
- Reinicia el servidor de desarrollo

#### Error: "relation does not exist"
- Verifica que ejecutaste el SQL en Supabase
- Verifica que las tablas existen en **Table Editor**

#### Error: "permission denied"
- Verifica que RLS está habilitado
- Verifica que las políticas están creadas
- Revisa la sección de políticas en este documento

## 5. Estructura de Datos

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

#### Estructura del campo calificaciones (JSONB)
```json
{
  "facilidad": 8,
  "ia": 9,
  "tablero": 7,
  "integracion": 8,
  "presentacion": 9
}
```

### Vista: resumen_equipos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int8 | ID del equipo |
| nombre | text | Nombre del equipo |
| total_jurados | bigint | Número de jurados que calificaron |
| puntaje_promedio | numeric | Promedio ponderado de calificaciones |

---

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa la documentación oficial de Supabase: https://supabase.com/docs
2. Verifica que todas las políticas RLS están configuradas
3. Asegúrate de que las variables de entorno están correctas
4. Revisa la consola del navegador para mensajes de error

## 🔒 Seguridad

**IMPORTANTE**: 
- Nunca subas tu archivo `.env` a Git
- Usa la clave `anon` (pública) solo en el frontend
- Para producción, considera implementar autenticación
- Revisa las políticas RLS para restringir acceso según sea necesario
