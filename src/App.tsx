import { useState, useCallback, useEffect } from 'react';
import { jurados, criterios, categoriasOperativas } from './data';
import { CalificacionJurado } from './types';

type Vista = 'inicio' | 'calificar' | 'resultados' | 'contexto';

const STORAGE_KEY = 'superbrix_calificaciones';
const STORAGE_EQUIPOS_KEY = 'superbrix_equipos';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Error loading from storage:', e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
}

function App() {
  const [vista, setVista] = useState<Vista>('inicio');
  const [juradoActivo, setJuradoActivo] = useState<number | null>(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<number | null>(null);
  const [calificaciones, setCalificaciones] = useState<CalificacionJurado[]>(() =>
    loadFromStorage<CalificacionJurado[]>(STORAGE_KEY, [])
  );
  const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>(() =>
    loadFromStorage<{ id: number; nombre: string }[]>(STORAGE_EQUIPOS_KEY, [
      { id: 1, nombre: 'Equipo 1' },
      { id: 2, nombre: 'Equipo 2' },
      { id: 3, nombre: 'Equipo 3' },
      { id: 4, nombre: 'Equipo 4' },
      { id: 5, nombre: 'Equipo 5' },
      { id: 6, nombre: 'Equipo 6' },
      { id: 7, nombre: 'Equipo 7' },
      { id: 8, nombre: 'Equipo 8' },
      { id: 9, nombre: 'Equipo 9' },
      { id: 10, nombre: 'Equipo 10' },
    ])
  );
  const [editandoEquipos, setEditandoEquipos] = useState(false);
  const [comentario, setComentario] = useState('');
  const [puntuaciones, setPuntuaciones] = useState<Record<string, number>>({});
  const [mensajeExito, setMensajeExito] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null); // 'all' | `${juradoId}-${equipoId}`
  const [mostrarExportar, setMostrarExportar] = useState(false);

  // Persistir calificaciones
  useEffect(() => {
    saveToStorage(STORAGE_KEY, calificaciones);
  }, [calificaciones]);

  // Persistir equipos
  useEffect(() => {
    saveToStorage(STORAGE_EQUIPOS_KEY, equipos);
  }, [equipos]);

  const seleccionarJurado = (id: number) => {
    setJuradoActivo(id);
    setVista('calificar');
  };

  const seleccionarEquipo = (id: number) => {
    setEquipoSeleccionado(id);
    setPuntuaciones({});
    setComentario('');
  };

  const actualizarPuntuacion = (criterioId: string, valor: number) => {
    setPuntuaciones(prev => ({ ...prev, [criterioId]: valor }));
  };

  const guardarCalificacion = () => {
    if (!juradoActivo || !equipoSeleccionado) return;

    const todosCalificados = criterios.every(c => puntuaciones[c.id] !== undefined);
    if (!todosCalificados) {
      alert('Por favor califique todos los criterios antes de guardar.');
      return;
    }

    const nuevaCal: CalificacionJurado = {
      juradoId: juradoActivo,
      equipoId: equipoSeleccionado,
      calificaciones: { ...puntuaciones },
      comentarios: comentario,
      timestamp: new Date(),
    };

    setCalificaciones(prev => {
      const filtradas = prev.filter(
        c => !(c.juradoId === juradoActivo && c.equipoId === equipoSeleccionado)
      );
      return [...filtradas, nuevaCal];
    });

    setMensajeExito(`Calificación guardada exitosamente para el ${equipos.find(e => e.id === equipoSeleccionado)?.nombre}`);
    setTimeout(() => setMensajeExito(''), 3000);
    setEquipoSeleccionado(null);
    setPuntuaciones({});
    setComentario('');
  };

  const borrarCalificacion = (juradoId: number, equipoId: number) => {
    setCalificaciones(prev => prev.filter(
      c => !(c.juradoId === juradoId && c.equipoId === equipoId)
    ));
    setConfirmarBorrado(null);
    setMensajeExito('Calificación eliminada correctamente');
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const borrarTodasCalificaciones = () => {
    setCalificaciones([]);
    setConfirmarBorrado(null);
    setMensajeExito('Todas las calificaciones han sido eliminadas. Los jurados pueden comenzar una nueva ronda.');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const borrarCalificacionesJurado = (juradoId: number) => {
    setCalificaciones(prev => prev.filter(c => c.juradoId !== juradoId));
    setConfirmarBorrado(null);
    setMensajeExito(`Calificaciones del ${jurados.find(j => j.id === juradoId)?.nombre} eliminadas`);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const exportarResultados = () => {
    const ranking = obtenerRanking();
    let csv = 'Posicion,Equipo,Puntaje Total,Jurados,';
    csv += criterios.map(c => c.nombre).join(',');
    csv += '\n';

    ranking.forEach((eq, idx) => {
      const promediosPorCriterio = criterios.map(c => {
        const cals = eq.resultado!.detalle.map(d => d.calificaciones[c.id] || 0);
        return (cals.reduce((a, b) => a + b, 0) / cals.length).toFixed(2);
      });
      csv += `${idx + 1},${eq.nombre},${eq.resultado?.promedio.toFixed(2)},${eq.resultado?.totalJurados},${promediosPorCriterio.join(',')}\n`;
    });

    // Detalle por jurado
    csv += '\n\nDetalle por Jurado\n';
    csv += 'Jurado,Equipo,';
    csv += criterios.map(c => c.nombre).join(',');
    csv += ',Puntaje Ponderado,Comentarios\n';

    calificaciones.forEach(cal => {
      const jurado = jurados.find(j => j.id === cal.juradoId);
      const equipo = equipos.find(e => e.id === cal.equipoId);
      const puntaje = criterios.reduce((acc, c) => acc + (cal.calificaciones[c.id] || 0) * (c.ponderacion / 100), 0);
      const puntuacionesArr = criterios.map(c => cal.calificaciones[c.id] || 0);
      csv += `${jurado?.nombre},${equipo?.nombre},${puntuacionesArr.join(',')},${puntaje.toFixed(2)},"${cal.comentarios.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SuperBrix_Resultados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMostrarExportar(false);
  };

  const calcularPuntajeEquipo = (equipoId: number) => {
    const calEquipo = calificaciones.filter(c => c.equipoId === equipoId);
    if (calEquipo.length === 0) return null;

    let totalPonderado = 0;
    calEquipo.forEach(cal => {
      let puntajeJurado = 0;
      criterios.forEach(c => {
        puntajeJurado += (cal.calificaciones[c.id] || 0) * (c.ponderacion / 100);
      });
      totalPonderado += puntajeJurado;
    });

    return {
      promedio: totalPonderado / calEquipo.length,
      totalJurados: calEquipo.length,
      detalle: calEquipo,
    };
  };

  const obtenerRanking = () => {
    return equipos
      .map(eq => ({
        ...eq,
        resultado: calcularPuntajeEquipo(eq.id),
      }))
      .filter(eq => eq.resultado !== null)
      .sort((a, b) => (b.resultado?.promedio || 0) - (a.resultado?.promedio || 0));
  };

  const yaCalifico = (juradoId: number, equipoId: number) => {
    return calificaciones.some(c => c.juradoId === juradoId && c.equipoId === equipoId);
  };

  const getCalificacionPrev = (juradoId: number, equipoId: number) => {
    return calificaciones.find(c => c.juradoId === juradoId && c.equipoId === equipoId);
  };

  const cargarCalificacionExistente = useCallback((juradoId: number, equipoId: number) => {
    const cal = getCalificacionPrev(juradoId, equipoId);
    if (cal) {
      setPuntuaciones({ ...cal.calificaciones });
      setComentario(cal.comentarios);
    }
  }, [calificaciones]);

  const actualizarNombreEquipo = (id: number, nombre: string) => {
    setEquipos(prev => prev.map(e => e.id === id ? { ...e, nombre } : e));
  };

  const agregarEquipo = () => {
    const nuevoId = Math.max(...equipos.map(e => e.id), 0) + 1;
    setEquipos(prev => [...prev, { id: nuevoId, nombre: `Equipo ${nuevoId}` }]);
  };

  const eliminarEquipo = (id: number) => {
    if (equipos.length <= 1) return;
    setEquipos(prev => prev.filter(e => e.id !== id));
    setCalificaciones(prev => prev.filter(c => c.equipoId !== id));
  };

  // ============ RENDER ============

  const renderHeader = () => (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
            🧱
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">SuperBrix</h1>
            <p className="text-blue-200 text-xs md:text-sm">Sistema de Calificación Digital - Reto IA</p>
          </div>
        </div>
        <nav className="flex gap-1 md:gap-2">
          <button
            onClick={() => setVista('inicio')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'inicio' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}
          >
            <span className="hidden md:inline">🏠 </span>Inicio
          </button>
          <button
            onClick={() => setVista('contexto')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'contexto' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}
          >
            <span className="hidden md:inline">📋 </span>Contexto
          </button>
          <button
            onClick={() => setVista('calificar')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'calificar' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}
          >
            <span className="hidden md:inline">⭐ </span>Calificar
          </button>
          <button
            onClick={() => setVista('resultados')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${vista === 'resultados' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white hover:bg-white/10'}`}
          >
            <span className="hidden md:inline">📊 </span>Resultados
          </button>
        </nav>
      </div>
    </header>
  );

  const renderInicio = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 md:p-12 mb-8 border border-blue-200">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Reto de Diseño y Desarrollo
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Sistema móvil para reportar tiempos y novedades operativas con IA para SuperBrix
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                🤖 Inteligencia Artificial
              </span>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                📱 App Móvil
              </span>
              <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                📊 Google Workspace
              </span>
              <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                ⚙️ Industria 4.0
              </span>
            </div>
          </div>
          <div className="text-6xl md:text-8xl">
            🏭
          </div>
        </div>
      </div>

      {/* Jurados */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Panel de Jurados</h3>
        <p className="text-gray-600 mb-6">Seleccione su nombre para acceder al formulario de calificación</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {jurados.map(j => {
            const calsJurado = calificaciones.filter(c => c.juradoId === j.id).length;
            return (
              <button
                key={j.id}
                onClick={() => seleccionarJurado(j.id)}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {j.avatar}
                </div>
                <h4 className="font-bold text-gray-900">{j.nombre}</h4>
                <p className="text-sm text-gray-500">{j.cargo}</p>
                <div className="mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${calsJurado > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {calsJurado}/{equipos.length} equipos
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{jurados.length}</p>
              <p className="text-sm text-gray-500">Jurados activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">🏆</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{equipos.length}</p>
              <p className="text-sm text-gray-500">Equipos participantes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{calificaciones.length}</p>
              <p className="text-sm text-gray-500">Calificaciones registradas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">📈</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((calificaciones.length / (jurados.length * equipos.length)) * 100)}%
              </p>
              <p className="text-sm text-gray-500">Progreso total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de almacenamiento */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-xl">💾</span>
        <div>
          <p className="text-sm font-medium text-blue-800">Datos almacenados localmente</p>
          <p className="text-xs text-blue-600">Las calificaciones se guardan automáticamente en su navegador. Puede exportar los resultados en cualquier momento.</p>
        </div>
      </div>
    </div>
  );

  const renderContexto = () => (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Contexto del Reto</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
            🏭 SuperBrix - Maquinaria Agroindustrial
          </h3>
          <p className="text-gray-700 leading-relaxed">
            En SuperBrix, el diseño y la fabricación de maquinaria agroindustrial de alta calidad exigen precisión tanto en los productos como en el uso de los recursos de planta. Dentro de nuestra estrategia de Inteligencia Artificial y Transformación Digital, buscamos dar el siguiente paso en la forma en que gestionamos el tiempo de trabajo en las órdenes de producción (OP).
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">📌 Estado Actual</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">●</span>
              <span><strong>Registro físico:</strong> Los operarios registran en tarjetas físicas las horas que dedican a cada orden de trabajo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">●</span>
              <span><strong>Consolidación:</strong> Al finalizar la jornada, el supervisor revisa las tarjetas para validar los reportes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">●</span>
              <span><strong>Procesamiento:</strong> Los datos se digitan en el sistema para cálculo de costos y seguimiento.</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h3 className="text-xl font-bold text-amber-800 mb-3">⚠️ Oportunidades de Mejora</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span><strong>Pérdida de detalle en tiempo real:</strong> Esperas por materiales, alistamiento o ajustes no quedan registrados de inmediato.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span><strong>Carga administrativa:</strong> Supervisores dedican tiempo a revisar y transcribir papeles.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span><strong>Visibilidad tardía:</strong> La información llega al sistema horas o días después.</span>
            </li>
          </ol>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-xl font-bold text-green-800 mb-3">🎯 Objetivo</h3>
          <p className="text-gray-700 leading-relaxed">
            Diseñar un sistema móvil simple y de rápida interacción para los operarios de planta que permita reportar tiempos y novedades operativas, clasifique las causas de interrupción usando IA y transforme los datos en analítica operativa en tiempo real dentro de Google Workspace.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📐 Reglas y Criterios de Diseño</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-2">1. Facilidad de uso</h4>
              <p className="text-sm text-gray-700">Fricción mínima: el reporte debe tomar apenas segundos. Libertad técnica de captura.</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h4 className="font-bold text-purple-800 mb-2">2. Clasificación con IA</h4>
              <p className="text-sm text-gray-700">La IA interpreta el lenguaje cotidiano y lo clasifica en categorías operativas.</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h4 className="font-bold text-green-800 mb-2">3. Google Workspace</h4>
              <p className="text-sm text-gray-700">Almacenamiento, procesamiento y visualización en herramientas de Google.</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <h4 className="font-bold text-orange-800 mb-2">4. Apoyo y autogestión</h4>
              <p className="text-sm text-gray-700">Visibilizar dificultades para resolverlas rápidamente, no vigilar ni sancionar.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📂 Categorías Operativas para la IA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoriasOperativas.map((cat, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{cat.icono}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{cat.nombre}</p>
                  <p className="text-xs text-gray-600">{cat.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rúbrica */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📏 Rúbrica de Evaluación</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700">Criterio</th>
                  <th className="text-center p-3 font-semibold text-gray-700 w-24">Ponderación</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Qué evaluará el jurado</th>
                </tr>
              </thead>
              <tbody>
                {criterios.map(c => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="p-3 font-medium text-gray-900">{c.nombre}</td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">
                        {c.ponderacion}%
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{c.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalificar = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {mensajeExito && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <p className="text-green-800 font-medium">{mensajeExito}</p>
        </div>
      )}

      {/* Selección de jurado */}
      {!juradoActivo && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleccione su perfil de jurado</h2>
          <p className="text-gray-600 mb-6">Cada jurado califica de forma independiente</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {jurados.map(j => {
              const calsJurado = calificaciones.filter(c => c.juradoId === j.id).length;
              return (
                <button
                  key={j.id}
                  onClick={() => seleccionarJurado(j.id)}
                  className={`bg-white rounded-xl p-6 border-2 transition-all cursor-pointer ${
                    juradoActivo === j.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-3">{j.avatar}</div>
                  <h4 className="font-bold text-gray-900">{j.nombre}</h4>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${calsJurado > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {calsJurado}/{equipos.length} calificados
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selección de equipo */}
      {juradoActivo && !equipoSeleccionado && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <button onClick={() => setJuradoActivo(null)} className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center gap-1">
                ← Cambiar jurado
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {jurados.find(j => j.id === juradoActivo)?.nombre} - Seleccionar equipo
              </h2>
              <p className="text-gray-600">Seleccione el equipo que desea calificar</p>
            </div>
            <button
              onClick={() => setEditandoEquipos(!editandoEquipos)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {editandoEquipos ? '✓ Listo' : '✏️ Editar equipos'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipos.map(eq => {
              const yaCal = yaCalifico(juradoActivo!, eq.id);
              return (
                <div key={eq.id} className="relative">
                  <button
                    onClick={() => {
                      seleccionarEquipo(eq.id);
                      if (yaCalifico(juradoActivo!, eq.id)) {
                        cargarCalificacionExistente(juradoActivo!, eq.id);
                      }
                    }}
                    className={`w-full bg-white rounded-xl p-6 border-2 transition-all text-left cursor-pointer ${
                      yaCal ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {editandoEquipos ? (
                        <input
                          type="text"
                          value={eq.nombre}
                          onChange={(e) => actualizarNombreEquipo(eq.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                        />
                      ) : (
                        <h4 className="font-bold text-gray-900 text-lg">{eq.nombre}</h4>
                      )}
                      {yaCal && <span className="text-green-600 text-xl ml-2">✓</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {yaCal ? 'Ya calificado - Click para editar' : 'Sin calificar'}
                    </p>
                  </button>
                  {editandoEquipos && (
                    <button
                      onClick={() => eliminarEquipo(eq.id)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm bg-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {editandoEquipos && (
              <button
                onClick={agregarEquipo}
                className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all flex items-center justify-center cursor-pointer min-h-[120px]"
              >
                <span className="text-gray-500 font-medium">+ Agregar equipo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Formulario de calificación */}
      {juradoActivo && equipoSeleccionado && (
        <div>
          <button
            onClick={() => { setEquipoSeleccionado(null); setPuntuaciones({}); setComentario(''); }}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1"
          >
            ← Volver a selección de equipos
          </button>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {jurados.find(j => j.id === juradoActivo)?.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{jurados.find(j => j.id === juradoActivo)?.nombre}</p>
                  <p className="text-sm text-gray-500">Calificando: <strong>{equipos.find(e => e.id === equipoSeleccionado)?.nombre}</strong></p>
                </div>
              </div>
              {calificaciones.some(c => c.juradoId === juradoActivo && c.equipoId === equipoSeleccionado) && (
                <button
                  onClick={() => setConfirmarBorrado(`${juradoActivo}-${equipoSeleccionado}`)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                >
                  🗑️ Borrar
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {criterios.map(c => (
              <div key={c.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">{c.nombre}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                        {c.ponderacion}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{c.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => actualizarPuntuacion(c.id, n)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                          puntuaciones[c.id] === n
                            ? n <= 3 ? 'bg-red-500 text-white shadow-md scale-110'
                            : n <= 6 ? 'bg-yellow-500 text-white shadow-md scale-110'
                            : 'bg-green-500 text-white shadow-md scale-110'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {puntuaciones[c.id] && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          puntuaciones[c.id] <= 3 ? 'bg-red-500' : puntuaciones[c.id] <= 6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${puntuaciones[c.id] * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-12 text-right">
                      {puntuaciones[c.id]}/10
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Comentario */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">💬 Comentarios (opcional)</h4>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escriba observaciones o retroalimentación para el equipo..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24"
              />
            </div>

            {/* Puntaje calculado */}
            {criterios.every(c => puntuaciones[c.id] !== undefined) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Puntaje ponderado total</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {(criterios.reduce((acc, c) => acc + (puntuaciones[c.id] || 0) * (c.ponderacion / 100), 0)).toFixed(2)}
                      <span className="text-lg text-blue-600"> / 10</span>
                    </p>
                  </div>
                  <div className="text-5xl">
                    {(() => {
                      const score = criterios.reduce((acc, c) => acc + (puntuaciones[c.id] || 0) * (c.ponderacion / 100), 0);
                      if (score >= 8) return '🏆';
                      if (score >= 6) return '⭐';
                      if (score >= 4) return '👍';
                      return '📝';
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Botón guardar */}
            <button
              onClick={guardarCalificacion}
              disabled={!criterios.every(c => puntuaciones[c.id] !== undefined)}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all cursor-pointer ${
                criterios.every(c => puntuaciones[c.id] !== undefined)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {calificaciones.some(c => c.juradoId === juradoActivo && c.equipoId === equipoSeleccionado)
                ? '🔄 Actualizar Calificación'
                : '💾 Guardar Calificación'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de borrado individual */}
      {confirmarBorrado && confirmarBorrado !== 'all' && !confirmarBorrado.startsWith('jurado-') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">¿Borrar esta calificación?</h3>
              <p className="text-gray-600 mt-2">Esta acción no se puede deshacer. El jurado deberá volver a calificar este equipo.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarBorrado(null)}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const [jId, eId] = confirmarBorrado.split('-').map(Number);
                  borrarCalificacion(jId, eId);
                }}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors cursor-pointer"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación borrado por jurado */}
      {confirmarBorrado && confirmarBorrado.startsWith('jurado-') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">¿Borrar todas las calificaciones de este jurado?</h3>
              <p className="text-gray-600 mt-2">Se eliminarán todas las calificaciones realizadas por este jurado. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarBorrado(null)}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const jId = parseInt(confirmarBorrado.replace('jurado-', ''));
                  borrarCalificacionesJurado(jId);
                }}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors cursor-pointer"
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderResultados = () => {
    const ranking = obtenerRanking();
    const totalPosible = jurados.length * equipos.length;
    const progreso = Math.round((calificaciones.length / totalPosible) * 100);

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">📊 Resultados en Tiempo Real</h2>
            <p className="text-gray-600">
              {calificaciones.length} de {totalPosible} calificaciones registradas ({progreso}% completado)
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setMostrarExportar(!mostrarExportar)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              📥 Exportar CSV
            </button>
            {calificaciones.length > 0 && (
              <button
                onClick={() => setConfirmarBorrado('all')}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                🗑️ Nueva Ronda
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-8 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de calificaciones</span>
            <span className="text-sm font-bold text-blue-700">{progreso}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0 calificaciones</span>
            <span>{totalPosible} calificaciones (5 jurados × {equipos.length} equipos)</span>
          </div>
        </div>

        {/* Exportar panel */}
        {mostrarExportar && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📥</span>
              <div>
                <p className="text-sm font-medium text-green-800">Exportar resultados</p>
                <p className="text-xs text-green-600">Descargue un archivo CSV con todos los resultados y detalles</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarExportar(false)}
                className="px-4 py-2 rounded-lg border border-green-300 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={exportarResultados}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
              >
                Descargar CSV
              </button>
            </div>
          </div>
        )}

        {ranking.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Sin calificaciones aún</h3>
            <p className="text-gray-500 mb-4">Los jurados deben comenzar a calificar los equipos para ver resultados aquí.</p>
            <button
              onClick={() => setVista('calificar')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Ir a calificar →
            </button>
          </div>
        ) : (
          <>
            {/* Podio */}
            {ranking.length >= 1 && (
              <div className="bg-gradient-to-br from-yellow-50 via-blue-50 to-purple-50 rounded-2xl p-8 mb-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🏆 Ranking Actual</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ranking.slice(0, 3).map((eq, idx) => (
                    <div
                      key={eq.id}
                      className={`rounded-xl p-6 text-center ${
                        idx === 0 ? 'bg-yellow-100 border-2 border-yellow-400 order-2 md:order-2' :
                        idx === 1 ? 'bg-gray-100 border-2 border-gray-300 order-1 md:order-1' :
                        'bg-orange-50 border-2 border-orange-300 order-3 md:order-3'
                      }`}
                    >
                      <div className="text-4xl mb-2">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">{eq.nombre}</h4>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {eq.resultado?.promedio.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {eq.resultado?.totalJurados} jurado{eq.resultado!.totalJurados !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
                {ranking.length > 3 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">Y {ranking.length - 3} equipo(s) más en la tabla completa ↓</p>
                  </div>
                )}
              </div>
            )}

            {/* Tabla completa */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">#</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Equipo</th>
                      {criterios.map(c => (
                        <th key={c.id} className="text-center p-4 font-semibold text-gray-700">
                          <div className="text-xs">{c.nombre.split(' ').slice(0, 2).join(' ')}</div>
                          <div className="text-xs text-gray-400">({c.ponderacion}%)</div>
                        </th>
                      ))}
                      <th className="text-center p-4 font-semibold text-gray-700">Promedio</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Jurados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((eq, idx) => {
                      const promediosPorCriterio: Record<string, number> = {};
                      criterios.forEach(c => {
                        const cals = eq.resultado!.detalle.map(d => d.calificaciones[c.id] || 0);
                        promediosPorCriterio[c.id] = cals.reduce((a, b) => a + b, 0) / cals.length;
                      });

                      return (
                        <tr key={eq.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <span className="text-lg">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-gray-900">{eq.nombre}</td>
                          {criterios.map(c => (
                            <td key={c.id} className="p-4 text-center">
                              <span className={`inline-block px-2 py-1 rounded font-bold text-sm ${
                                promediosPorCriterio[c.id] >= 8 ? 'bg-green-100 text-green-800' :
                                promediosPorCriterio[c.id] >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {promediosPorCriterio[c.id].toFixed(1)}
                              </span>
                            </td>
                          ))}
                          <td className="p-4 text-center">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                              {eq.resultado?.promedio.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4 text-center text-gray-600">
                            {eq.resultado?.totalJurados}/{jurados.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detalle por jurado con opción de borrar */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detalle por Jurado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jurados.map(j => {
                  const calsJurado = calificaciones.filter(c => c.juradoId === j.id);
                  return (
                    <div key={j.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{j.avatar}</span>
                          <div>
                            <p className="font-bold text-gray-900">{j.nombre}</p>
                            <p className="text-xs text-gray-500">{calsJurado.length} equipo(s) calificado(s)</p>
                          </div>
                        </div>
                        {calsJurado.length > 0 && (
                          <button
                            onClick={() => setConfirmarBorrado(`jurado-${j.id}`)}
                            className="text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Borrar todas las calificaciones de este jurado"
                          >
                            🗑️ Reset
                          </button>
                        )}
                      </div>
                      {calsJurado.length > 0 ? (
                        <div className="space-y-2">
                          {calsJurado.map(cal => {
                            const equipo = equipos.find(e => e.id === cal.equipoId);
                            const puntaje = criterios.reduce((acc, c) => acc + (cal.calificaciones[c.id] || 0) * (c.ponderacion / 100), 0);
                            return (
                              <div key={cal.equipoId} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                <span className="text-sm font-medium text-gray-700">{equipo?.nombre}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-blue-700">{puntaje.toFixed(2)}</span>
                                  <button
                                    onClick={() => setConfirmarBorrado(`${j.id}-${cal.equipoId}`)}
                                    className="text-red-400 hover:text-red-600 text-xs cursor-pointer"
                                    title="Borrar esta calificación"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin calificaciones</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Modal de confirmación borrado total */}
        {confirmarBorrado === 'all' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="text-center mb-4">
                <span className="text-5xl">🗑️</span>
                <h3 className="text-xl font-bold text-gray-900 mt-3">Iniciar Nueva Ronda</h3>
                <p className="text-gray-600 mt-2">
                  Se eliminarán <strong>todas las {calificaciones.length} calificaciones</strong> registradas. Los jurados podrán comenzar una nueva ronda de evaluación desde cero.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-amber-700">💡 <strong>Tip:</strong> Considere exportar los resultados actuales antes de borrarlos.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmarBorrado(null)}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    exportarResultados();
                    borrarTodasCalificaciones();
                  }}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Exportar y Borrar
                </button>
              </div>
              <button
                onClick={() => {
                  borrarTodasCalificaciones();
                }}
                className="w-full mt-2 py-3 rounded-lg border-2 border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors cursor-pointer"
              >
                Solo Borrar (sin exportar)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {vista === 'inicio' && renderInicio()}
      {vista === 'contexto' && renderContexto()}
      {vista === 'calificar' && renderCalificar()}
      {vista === 'resultados' && renderResultados()}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">SuperBrix © 2025 - Sistema de Calificación Digital para Reto de Innovación</p>
          <p className="text-xs mt-1">Transformación Digital & Inteligencia Artificial</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
