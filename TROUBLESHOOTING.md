# Guía de Troubleshooting - Sincronización Supabase

## Problema: Los datos no se sincronizan entre navegadores

Si la información de calificaciones y jurados no se carga igual desde diferentes navegadores, sigue estos pasos:

### 1. Verificar Configuración de Supabase

#### A. Verificar Variables de Entorno
```bash
# Verificar que el archivo .env existe y contiene:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### B. Verificar en el Navegador
1. Abrir la aplicación en el navegador
2. Abrir la consola del navegador (F12)
3. Buscar el mensaje: `✅ Supabase configurado - usando base de datos en la nube`
4. Si ves `⚠️ Supabase no configurado`, las variables de entorno no están correctas

### 2. Verificar Logs de Consola

Al cargar la aplicación, deberías ver estos mensajes en la consola:

```
🔄 Cargando datos desde Supabase...
🔍 Consultando equipos desde Supabase...
✅ Equipos obtenidos: 10
🔍 Consultando jurados desde Supabase...
✅ Jurados obtenidos: 5
🔍 Consultando calificaciones desde Supabase...
✅ Calificaciones obtenidas: X
✅ Todos los datos cargados desde Supabase exitosamente
```

### 3. Verificar Datos en Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard/)
2. Seleccionar tu proyecto
3. Ir a **Table Editor**
4. Verificar que las tablas existen y tienen datos:
   - `equipos` - debería tener 10 registros
   - `jurados` - debería tener 5 registros
   - `calificaciones` - debería tener las calificaciones guardadas

### 4. Verificar Políticas RLS

Las políticas de Row Level Security deben permitir acceso público:

```sql
-- Verificar en Supabase → Authentication → Policies

-- Para equipos:
SELECT * FROM pg_policies WHERE tablename = 'equipos';

-- Para jurados:
SELECT * FROM pg_policies WHERE tablename = 'jurados';

-- Para calificaciones:
SELECT * FROM pg_policies WHERE tablename = 'calificaciones';
```

Deberías ver políticas para SELECT, INSERT, UPDATE y DELETE.

### 5. Probar Guardado de Calificación

1. Abrir la consola del navegador (F12)
2. Realizar una calificación
3. Buscar en la consola:

```
💾 Guardando calificación en Supabase: { juradoId: X, equipoId: Y, ... }
➕ Insertando nueva calificación (o 🔄 Actualizando calificación existente)
✅ Calificación insertada/actualizada exitosamente
```

4. Verificar en Supabase → Table Editor → calificaciones que el registro existe

### 6. Probar Sincronización entre Navegadores

1. Abrir la aplicación en **Navegador A** (ej: Chrome)
2. Abrir la aplicación en **Navegador B** (ej: Firefox)
3. En el **Navegador A**, realizar una calificación
4. En el **Navegador B**, recargar la página (F5)
5. Verificar que la calificación aparece en ambos navegadores

### 7. Problemas Comunes y Soluciones

#### Problema: "relation does not exist"
**Causa**: Las tablas no se crearon en Supabase
**Solución**: Ejecutar el script `SUPABASE_SCHEMA.sql` en Supabase → SQL Editor

#### Problema: "permission denied" o "policy violation"
**Causa**: Las políticas RLS no están configuradas correctamente
**Solución**: Ejecutar las políticas RLS del script SQL

#### Problema: Los datos se guardan pero no se cargan
**Causa**: Problema con el mapeo de datos
**Solución**: Verificar en la consola que los datos se están obteniendo correctamente

#### Problema: Indicador muestra "Local" en lugar de "Supabase"
**Causa**: Las variables de entorno no están configuradas
**Solución**: 
1. Verificar el archivo `.env`
2. Reiniciar el servidor de desarrollo: `npm run dev`
3. Limpiar caché del navegador (Ctrl+Shift+R)

#### Problema: Los nombres de jurados no se actualizan
**Causa**: Error en la función updateJurado
**Solución**: 
1. Verificar en la consola si hay errores al actualizar
2. Verificar en Supabase → Table Editor → jurados que los cambios se guardaron
3. Recargar la página para obtener los datos actualizados

### 8. Comandos Útiles de Diagnóstico

#### Verificar conexión a Supabase
```javascript
// En la consola del navegador:
import { supabase } from './src/lib/supabase';
const { data, error } = await supabase.from('equipos').select('count');
console.log('Conexión:', error ? '❌ Error' : '✅ OK', data);
```

#### Ver todos los datos en Supabase
```javascript
// En la consola del navegador:
const equipos = await supabase.from('equipos').select('*');
const jurados = await supabase.from('jurados').select('*');
const calificaciones = await supabase.from('calificaciones').select('*');
console.log('Equipos:', equipos.data);
console.log('Jurados:', jurados.data);
console.log('Calificaciones:', calificaciones.data);
```

### 9. Resetear Datos (Solo si es necesario)

Si necesitas resetear todos los datos:

```sql
-- Ejecutar en Supabase → SQL Editor
DELETE FROM calificaciones;
DELETE FROM jurados;
DELETE FROM equipos;

-- Volver a insertar datos iniciales
INSERT INTO equipos (nombre) VALUES 
  ('Equipo 1'), ('Equipo 2'), ('Equipo 3'), ('Equipo 4'), ('Equipo 5'),
  ('Equipo 6'), ('Equipo 7'), ('Equipo 8'), ('Equipo 9'), ('Equipo 10');

INSERT INTO jurados (nombre, cargo, avatar) VALUES 
  ('Jurado 1', 'Evaluador', '👤'),
  ('Jurado 2', 'Evaluador', '👤'),
  ('Jurado 3', 'Evaluador', '👤'),
  ('Jurado 4', 'Evaluador', '👤'),
  ('Jurado 5', 'Evaluador', '👤');
```

### 10. Soporte Adicional

Si después de seguir estos pasos el problema persiste:

1. Verificar que el proyecto de Supabase esté activo
2. Verificar que no hayas excedido los límites del plan gratuito
3. Revisar los logs de Supabase en el dashboard
4. Verificar que la URL y la clave anon sean correctas

## Checklist de Verificación

- [ ] Archivo `.env` existe con las variables correctas
- [ ] Servidor de desarrollo reiniciado después de configurar `.env`
- [ ] Consola muestra "✅ Supabase configurado"
- [ ] Tablas existen en Supabase (equipos, jurados, calificaciones)
- [ ] Políticas RLS están configuradas
- [ ] Datos iniciales insertados (10 equipos, 5 jurados)
- [ ] Logs de consola muestran carga exitosa de datos
- [ ] Calificaciones se guardan en Supabase
- [ ] Datos se sincronizan entre navegadores después de recargar
