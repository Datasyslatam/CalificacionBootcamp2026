import { Jurado, Criterio } from './types';

export const jurados: Jurado[] = [
  { id: 1, nombre: 'Jurado 1', cargo: 'Evaluador', avatar: '👤' },
  { id: 2, nombre: 'Jurado 2', cargo: 'Evaluador', avatar: '👤' },
  { id: 3, nombre: 'Jurado 3', cargo: 'Evaluador', avatar: '👤' },
  { id: 4, nombre: 'Jurado 4', cargo: 'Evaluador', avatar: '👤' },
  { id: 5, nombre: 'Jurado 5', cargo: 'Evaluador', avatar: '👤' },
];

export const criterios: Criterio[] = [
  {
    id: 'facilidad',
    nombre: 'Facilidad y rapidez para el operario',
    descripcion: 'Qué tan sencillo, intuitivo y rápido es registrar una novedad sin interrumpir el ritmo de trabajo en el taller.',
    ponderacion: 25,
  },
  {
    id: 'ia',
    nombre: 'Uso de la Inteligencia Artificial',
    descripcion: 'Qué tan bien la IA comprende lo que el operario comunica y lo clasifica en una categoría útil para la planta.',
    ponderacion: 25,
  },
  {
    id: 'tablero',
    nombre: 'Tablero de analítica y toma de decisiones',
    descripcion: 'Claridad, interactividad y valor práctico del tablero en Google Workspace para que la jefatura detecte problemas y tome acciones inmediatas.',
    ponderacion: 25,
  },
  {
    id: 'integracion',
    nombre: 'Integración funcional con Google',
    descripcion: 'Que la solución funcione de manera fluida y conectada durante la demostración en vivo.',
    ponderacion: 15,
  },
  {
    id: 'presentacion',
    nombre: 'Claridad de la presentación y visión del proceso',
    descripcion: 'Capacidad del equipo para explicar el beneficio operativo, el cambio de método y el valor de su solución en los 5 minutos asignados.',
    ponderacion: 10,
  },
];

export const categoriasOperativas = [
  { nombre: 'Producción Activa', icono: '⚙️', descripcion: 'Trabajo directo de mecanizado, soldadura, corte, ensamble o pintura sobre la pieza.' },
  { nombre: 'Alistamiento y Preparación (Setup)', icono: '🔧', descripcion: 'Montaje de piezas, ajuste de mordazas, calibración de herramientas o cambio de matriz.' },
  { nombre: 'Espera de Materiales / Logística', icono: '📦', descripcion: 'Demoras por búsqueda de insumos, herramientas faltantes o espera de grúa/montacargas.' },
  { nombre: 'Falla Técnica / Mantenimiento', icono: '🔴', descripcion: 'Detención por ruidos extraños, problemas eléctricos, fugas o espera de técnico de mantenimiento.' },
  { nombre: 'Calidad y Aprobación', icono: '✅', descripcion: 'Espera de visto bueno de planos, metrología o inspección de primera pieza.' },
  { nombre: 'Instrucciones / Coordinación', icono: '📋', descripcion: 'Dudas sobre el plano, reunión de seguridad o consulta con el supervisor.' },
];
