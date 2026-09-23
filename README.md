# Bootcamp Digital Factory - Sistema de Calificación

Sistema de calificación digital para el Bootcamp de Fábrica Digital e Inteligencia Artificial 2026. Permite a 5 jurados evaluar 10 equipos participantes en tiempo real.

## 🚀 Características

- ✅ **Calificación en tiempo real** con 5 criterios ponderados
- ✅ **10 equipos participantes** configurables
- ✅ **5 jurados** con perfiles editables
- ✅ **Persistencia de datos** en Supabase (nube) o localStorage (local)
- ✅ **Dashboard de resultados** con ranking y estadísticas
- ✅ **Exportación a CSV** de todos los resultados
- ✅ **Diseño responsivo** y moderno con tema tecnológico
- ✅ **Fondo tecnológico premium** con efectos visuales Industria 4.0

## 📋 Criterios de Evaluación

| Criterio | Ponderación |
|----------|-------------|
| Facilidad y rapidez para el operario | 25% |
| Uso de la Inteligencia Artificial | 25% |
| Tablero de analítica y toma de decisiones | 25% |
| Integración funcional con Google | 15% |
| Claridad de la presentación | 10% |

## 🗄️ Configuración de Supabase (Recomendado)

Para persistencia de datos en la nube, configura Supabase siguiendo las instrucciones en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

### Instalación Rápida

1. **Crear proyecto en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto

2. **Ejecutar el esquema SQL**
   - Ve a SQL Editor en Supabase
   - Copia y ejecuta el contenido de `SUPABASE_SCHEMA.sql`

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita `.env` con tus credenciales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon
   ```

4. **Instalar dependencias**
   ```bash
   npm install
   ```

5. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```

### Modo Offline (localStorage)

Si no configuras Supabase, la aplicación funcionará automáticamente con localStorage. Los datos se guardarán en el navegador del usuario.

**Nota**: En modo offline, cada navegador mantiene sus propios datos. Para compartir datos entre dispositivos, configura Supabase.

## 🏗️ Estructura del Proyecto

```
├── src/
│   ├── App.tsx              # Componente principal
│   ├── data.ts              # Datos iniciales (jurados, criterios)
│   ├── types.ts             # Tipos TypeScript
│   ├── index.css            # Estilos globales
│   └── lib/
│       ├── supabase.ts      # Cliente de Supabase
│       └── database.ts      # Servicio de base de datos
├── SUPABASE_SCHEMA.sql      # Esquema de base de datos
├── SUPABASE_SETUP.md        # Guía de configuración
├── .env.example             # Ejemplo de variables de entorno
└── README.md                # Este archivo
```

## 📊 Base de Datos

### Tablas

- **equipos**: Información de los equipos participantes
- **jurados**: Información de los jurados evaluadores
- **calificaciones**: Calificaciones de cada jurado a cada equipo

### Vista

- **resumen_equipos**: Resumen con puntajes promedio por equipo

## 🎨 Diseño

La aplicación cuenta con un diseño tecnológico premium inspirado en Industria 4.0:

- Fondo azul marino oscuro con degradados
- Efectos de red de nodos y circuitos
- Hexágonos tecnológicos
- Partículas flotantes
- Iluminación volumétrica
- Colores de acento: Naranja brillante (#FF6B1A) y Cian (#00B4D8)

## 🔧 Tecnologías

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Supabase** - Base de datos en la nube
- **localStorage** - Fallback offline

## 📝 Uso

### Para Jurados

1. Selecciona tu perfil en la página de inicio
2. Elige el equipo a calificar
3. Asigna puntuaciones (1-10) a cada criterio
4. Agrega comentarios (opcional)
5. Guarda la calificación

### Para Administradores

1. Edita nombres de equipos y jurados
2. Agrega o elimina equipos
3. Monitorea el progreso de calificaciones
4. Exporta resultados a CSV
5. Reinicia rondas de calificación

## 🐛 Solución de Problemas

### La aplicación no guarda datos en Supabase

- Verifica que las variables de entorno estén configuradas
- Revisa la consola del navegador para errores
- Verifica que el esquema SQL se ejecutó correctamente
- Asegúrate de que RLS está habilitado con las políticas correctas

### Los datos no se sincronizan entre dispositivos

- Verifica que estás usando Supabase (no localStorage)
- El indicador en el header debe mostrar "Supabase" en verde
- Recarga la página para sincronizar

## 📄 Licencia

Este proyecto fue desarrollado para el Bootcamp Digital Factory 2026.

## 👥 Contacto

Para soporte o consultas:
- **Datasyslatam Group**
- Bootcamp Fábrica Digital e Inteligencia Artificial 2026
