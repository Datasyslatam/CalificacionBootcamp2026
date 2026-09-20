import { useState, useCallback, useEffect } from 'react';
import { jurados as juradosDefault, criterios, categoriasOperativas } from './data';
import { CalificacionJurado, Jurado } from './types';

type Vista = 'inicio' | 'calificar' | 'resultados' | 'contexto';

const STORAGE_KEY = 'superbrix_calificaciones';
const STORAGE_EQUIPOS_KEY = 'superbrix_equipos';
const STORAGE_JURADOS_KEY = 'superbrix_jurados';

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
  const [listaJurados, setListaJurados] = useState<Jurado[]>(() =>
    loadFromStorage<Jurado[]>(STORAGE_JURADOS_KEY, juradosDefault)
  );
  const [editandoEquipos, setEditandoEquipos] = useState(false);
  const [editandoJurados, setEditandoJurados] = useState(false);
  const [comentario, setComentario] = useState('');
  const [puntuaciones, setPuntuaciones] = useState<Record<string, number>>({});
  const [mensajeExito, setMensajeExito] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);
  const [mostrarExportar, setMostrarExportar] = useState(false);

  useEffect(() => { saveToStorage(STORAGE_KEY, calificaciones); }, [calificaciones]);
  useEffect(() => { saveToStorage(STORAGE_EQUIPOS_KEY, equipos); }, [equipos]);
  useEffect(() => { saveToStorage(STORAGE_JURADOS_KEY, listaJurados); }, [listaJurados]);

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
    if (!todosCalificados) { alert('Por favor califique todos los criterios antes de guardar.'); return; }

    const nuevaCal: CalificacionJurado = {
      juradoId: juradoActivo, equipoId: equipoSeleccionado,
      calificaciones: { ...puntuaciones }, comentarios: comentario, timestamp: new Date(),
    };

    setCalificaciones(prev => {
      const filtradas = prev.filter(c => !(c.juradoId === juradoActivo && c.equipoId === equipoSeleccionado));
      return [...filtradas, nuevaCal];
    });

    setMensajeExito(`Calificación guardada para ${equipos.find(e => e.id === equipoSeleccionado)?.nombre}`);
    setTimeout(() => setMensajeExito(''), 3000);
    setEquipoSeleccionado(null);
    setPuntuaciones({});
    setComentario('');
  };

  const borrarCalificacion = (juradoId: number, equipoId: number) => {
    setCalificaciones(prev => prev.filter(c => !(c.juradoId === juradoId && c.equipoId === equipoId)));
    setConfirmarBorrado(null);
    setMensajeExito('Calificación eliminada');
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const borrarTodasCalificaciones = () => {
    setCalificaciones([]);
    setConfirmarBorrado(null);
    setMensajeExito('Todas las calificaciones eliminadas. Nueva ronda iniciada.');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const borrarCalificacionesJurado = (juradoId: number) => {
    setCalificaciones(prev => prev.filter(c => c.juradoId !== juradoId));
    setConfirmarBorrado(null);
    setMensajeExito(`Calificaciones de ${listaJurados.find(j => j.id === juradoId)?.nombre} eliminadas`);
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
    csv += '\n\nDetalle por Jurado\nJurado,Equipo,';
    csv += criterios.map(c => c.nombre).join(',');
    csv += ',Puntaje Ponderado,Comentarios\n';
    calificaciones.forEach(cal => {
      const jurado = listaJurados.find(j => j.id === cal.juradoId);
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
      criterios.forEach(c => { puntajeJurado += (cal.calificaciones[c.id] || 0) * (c.ponderacion / 100); });
      totalPonderado += puntajeJurado;
    });
    return { promedio: totalPonderado / calEquipo.length, totalJurados: calEquipo.length, detalle: calEquipo };
  };

  const obtenerRanking = () => {
    return equipos.map(eq => ({ ...eq, resultado: calcularPuntajeEquipo(eq.id) }))
      .filter(eq => eq.resultado !== null)
      .sort((a, b) => (b.resultado?.promedio || 0) - (a.resultado?.promedio || 0));
  };

  const yaCalifico = (juradoId: number, equipoId: number) => calificaciones.some(c => c.juradoId === juradoId && c.equipoId === equipoId);

  const getCalificacionPrev = (juradoId: number, equipoId: number) => calificaciones.find(c => c.juradoId === juradoId && c.equipoId === equipoId);

  const cargarCalificacionExistente = useCallback((juradoId: number, equipoId: number) => {
    const cal = getCalificacionPrev(juradoId, equipoId);
    if (cal) { setPuntuaciones({ ...cal.calificaciones }); setComentario(cal.comentarios); }
  }, [calificaciones]);

  const actualizarNombreEquipo = (id: number, nombre: string) => setEquipos(prev => prev.map(e => e.id === id ? { ...e, nombre } : e));
  const agregarEquipo = () => { const nuevoId = Math.max(...equipos.map(e => e.id), 0) + 1; setEquipos(prev => [...prev, { id: nuevoId, nombre: `Equipo ${nuevoId}` }]); };
  const eliminarEquipo = (id: number) => { if (equipos.length <= 1) return; setEquipos(prev => prev.filter(e => e.id !== id)); setCalificaciones(prev => prev.filter(c => c.equipoId !== id)); };
  const actualizarNombreJurado = (id: number, nombre: string) => setListaJurados(prev => prev.map(j => j.id === id ? { ...j, nombre } : j));
  const actualizarCargoJurado = (id: number, cargo: string) => setListaJurados(prev => prev.map(j => j.id === id ? { ...j, cargo } : j));
  const actualizarAvatarJurado = (id: number, avatar: string) => setListaJurados(prev => prev.map(j => j.id === id ? { ...j, avatar } : j));
  const resetearJurados = () => { setListaJurados(juradosDefault); setMensajeExito('Jurados restaurados'); setTimeout(() => setMensajeExito(''), 3000); };

  // ============ RENDER ============

  const renderHeader = () => (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#061224]/90 border-b border-[#00B4D8]/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D4F842] to-[#00B4D8] rounded-lg flex items-center justify-center text-lg font-black text-[#061224]">
            SB
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white tracking-tight">SuperBrix</h1>
            <p className="text-[10px] text-[#6b7c93] uppercase tracking-wider">Reto IA 2026</p>
          </div>
        </div>
        <nav className="flex gap-1">
          {[
            { id: 'inicio' as Vista, label: 'Inicio', icon: '⌂' },
            { id: 'contexto' as Vista, label: 'Contexto', icon: '◈' },
            { id: 'calificar' as Vista, label: 'Calificar', icon: '★' },
            { id: 'resultados' as Vista, label: 'Resultados', icon: '◉' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setVista(item.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                vista === item.id
                  ? 'bg-gradient-to-r from-[#D4F842] to-[#00B4D8] text-[#061224]'
                  : 'text-[#b8c5d6] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="hidden md:inline mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );

  const renderInicio = () => {
    const progreso = Math.round((calificaciones.length / (listaJurados.length * equipos.length)) * 100);
    return (
      <div className="relative">
        <div className="bg-network-nodes bg-data-sparkles" />
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          {/* Hero */}
          <div className="mb-12">
            <span className="badge-pill-neon mb-4 inline-block">
              <span>◆</span> Bootcamp Fábrica Digital & IA 2026
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Reto de Diseño<br />
              <span className="bg-gradient-to-r from-[#00B4D8] to-[#D4F842] bg-clip-text text-transparent">& Desarrollo</span>
            </h2>
            <p className="text-lg text-[#b8c5d6] max-w-2xl mb-8">
              Sistema móvil para reportar tiempos y novedades operativas con IA para SuperBrix.
              Transformación 4.0 para la industria metalmecánica.
            </p>
            <div className="flex flex-wrap gap-3">
              {['🤖 Inteligencia Artificial', '📱 App Móvil', '📊 Google Workspace', '⚙️ Industria 4.0'].map(tag => (
                <span key={tag} className="px-4 py-2 bg-[#00B4D8]/5 border border-[#00B4D8]/20 rounded-full text-sm text-[#b8c5d6] font-medium backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: listaJurados.length, label: 'Jurados', icon: '👥' },
              { value: equipos.length, label: 'Equipos', icon: '🏆' },
              { value: calificaciones.length, label: 'Calificaciones', icon: '✅' },
              { value: `${progreso}%`, label: 'Progreso', icon: '📈' },
            ].map((stat, i) => (
              <div key={i} className="card-dark p-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-xs text-[#6b7c93] uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Jurados */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Panel de Jurados</h3>
                <p className="text-sm text-[#6b7c93] mt-1">Seleccione su perfil para calificar</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditandoJurados(!editandoJurados)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    editandoJurados ? 'bg-gradient-to-r from-[#D4F842] to-[#00B4D8] text-[#061224]' : 'bg-white/5 text-[#b8c5d6] hover:bg-white/10 border border-[#00B4D8]/20'
                  }`}
                >
                  {editandoJurados ? '✓ Listo' : '✏️ Editar'}
                </button>
                {editandoJurados && (
                  <button onClick={resetearJurados} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-[#b8c5d6] hover:bg-white/10 border border-[#00B4D8]/20 cursor-pointer">
                    🔄 Reset
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {listaJurados.map(j => {
                const calsJurado = calificaciones.filter(c => c.juradoId === j.id).length;
                return (
                  <div key={j.id} className="relative">
                    <button
                      onClick={() => !editandoJurados && seleccionarJurado(j.id)}
                      className={`w-full card-dark p-5 text-left cursor-pointer ${editandoJurados ? 'border-[#00B4D8]/40' : ''}`}
                    >
                      {editandoJurados ? (
                        <div className="space-y-2">
                          <select
                            value={j.avatar}
                            onChange={(e) => actualizarAvatarJurado(j.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-2xl bg-transparent border-none p-0 cursor-pointer"
                          >
                            {['👤','👩','👨','👩‍💼','👨‍💼','👩‍🔬','👨‍🔬','🧑‍💻','👩‍🏫','👨‍🏫'].map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <input type="text" value={j.nombre} onChange={(e) => actualizarNombreJurado(j.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()} className="input-dark text-sm font-bold" placeholder="Nombre" />
                          <input type="text" value={j.cargo} onChange={(e) => actualizarCargoJurado(j.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()} className="input-dark text-xs" placeholder="Cargo" />
                        </div>
                      ) : (
                        <>
                          <div className="text-3xl mb-3">{j.avatar}</div>
                          <h4 className="font-bold text-white text-sm">{j.nombre}</h4>
                          <p className="text-xs text-[#6b7c93] mt-0.5">{j.cargo}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 progress-lime h-1.5">
                              <div className="progress-lime-fill" style={{ width: `${(calsJurado / equipos.length) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-[#6b7c93] font-mono">{calsJurado}/{equipos.length}</span>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info storage */}
          <div className="card-dark p-4 flex items-center gap-3 border-[#00B4D8]/30">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B4D8]/20 to-[#0052CC]/20 flex items-center justify-center text-[#00B4D8] text-sm">💾</div>
            <div>
              <p className="text-xs font-semibold text-white">Datos almacenados localmente</p>
              <p className="text-[10px] text-[#6b7c93]">Las calificaciones persisten en su navegador. Exporte resultados cuando lo necesite.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContexto = () => (
    <div className="relative">
      <div className="bg-network-nodes" />
      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <span className="badge-pill-neon mb-4 inline-block"><span>◈</span> Contexto del Reto</span>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
          El Desafío<br /><span className="bg-gradient-to-r from-[#00B4D8] to-[#D4F842] bg-clip-text text-transparent">Industrial</span>
        </h2>
        <p className="text-[#b8c5d6] mb-8 max-w-2xl">Transformación digital para la gestión del tiempo en órdenes de producción.</p>

        <div className="space-y-6">
          <div className="card-dark p-6">
            <div className="flex items-start gap-4">
              <div className="lime-line h-full min-h-[60px]" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">🏭 SuperBrix - Maquinaria Agroindustrial</h3>
                <p className="text-sm text-[#b8c5d6] leading-relaxed">
                  En SuperBrix, el diseño y la fabricación de maquinaria agroindustrial de alta calidad exigen precisión tanto en los productos como en el uso de los recursos de planta. Buscamos dar el siguiente paso en la gestión del tiempo de trabajo en las órdenes de producción.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-dark p-6">
              <h3 className="text-sm font-bold text-[#00B4D8] uppercase tracking-wider mb-3">⚠️ Problemas Actuales</h3>
              <ul className="space-y-3">
                {['Pérdida de detalle en tiempo real', 'Carga administrativa para supervisores', 'Visibilidad tardía de datos'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#b8c5d6]">
                    <span className="num-badge text-[10px] w-5 h-5 mt-0.5 flex-shrink-0">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark p-6 border-[#D4F842]/30">
              <h3 className="text-sm font-bold text-[#D4F842] uppercase tracking-wider mb-3">🎯 Objetivo</h3>
              <p className="text-sm text-[#b8c5d6] leading-relaxed">
                Diseñar un sistema móvil simple que permita reportar tiempos y novedades, clasifique causas con IA y transforme datos en analítica operativa en tiempo real dentro de Google Workspace.
              </p>
            </div>
          </div>

          <div className="card-dark p-6">
            <h3 className="text-sm font-bold text-[#00B4D8] uppercase tracking-wider mb-4">📐 Reglas de Diseño</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { n: '01', t: 'Facilidad de uso', d: 'Fricción mínima, reporte en segundos' },
                { n: '02', t: 'Clasificación con IA', d: 'IA interpreta lenguaje cotidiano' },
                { n: '03', t: 'Google Workspace', d: 'Almacenamiento y visualización' },
                { n: '04', t: 'Apoyo y autogestión', d: 'Visibilizar dificultades, no vigilar' },
              ].map(item => (
                <div key={item.n} className="flex items-start gap-3 p-3 bg-[#00B4D8]/5 rounded-lg border border-[#00B4D8]/10">
                  <span className="num-badge text-xs">{item.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.t}</p>
                    <p className="text-xs text-[#6b7c93]">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-dark p-6">
            <h3 className="text-sm font-bold text-[#00B4D8] uppercase tracking-wider mb-4">📂 Categorías Operativas IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoriasOperativas.map((cat, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#00B4D8]/5 rounded-lg border border-[#00B4D8]/10">
                  <span className="text-xl">{cat.icono}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{cat.nombre}</p>
                    <p className="text-xs text-[#6b7c93]">{cat.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-dark p-6">
            <h3 className="text-sm font-bold text-[#00B4D8] uppercase tracking-wider mb-4">📏 Rúbrica de Evaluación</h3>
            <div className="space-y-3">
              {criterios.map((c, i) => (
                <div key={c.id} className="flex items-center gap-4 p-3 bg-[#00B4D8]/5 rounded-lg border border-[#00B4D8]/10">
                  <span className="num-badge text-xs">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-[#6b7c93] truncate">{c.descripcion}</p>
                  </div>
                  <span className="score-badge score-high flex-shrink-0">{c.ponderacion}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCalificar = () => (
    <div className="relative">
      <div className="bg-network-nodes" />
      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {mensajeExito && (
          <div className="mb-6 card-dark p-4 flex items-center gap-3 border-[#00B4D8]/40 animate-glow">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4F842]/20 to-[#00B4D8]/20 flex items-center justify-center text-[#D4F842]">✓</div>
            <p className="text-sm font-medium text-[#D4F842]">{mensajeExito}</p>
          </div>
        )}

        {!juradoActivo && (
          <div>
            <span className="badge-pill-neon mb-4 inline-block"><span>★</span> Calificación</span>
            <h2 className="text-3xl font-black text-white mb-2">Seleccione su perfil</h2>
            <p className="text-[#6b7c93] mb-8">Cada jurado califica de forma independiente</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {listaJurados.map(j => {
                const calsJurado = calificaciones.filter(c => c.juradoId === j.id).length;
                return (
                  <button key={j.id} onClick={() => seleccionarJurado(j.id)} className="card-dark p-5 text-center cursor-pointer group">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{j.avatar}</div>
                    <h4 className="font-bold text-white text-sm">{j.nombre}</h4>
                    <div className="mt-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-mono ${calsJurado > 0 ? 'bg-[#D4F842]/10 text-[#D4F842] border border-[#D4F842]/30' : 'bg-white/5 text-[#6b7c93] border border-white/10'}`}>
                        {calsJurado}/{equipos.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {juradoActivo && !equipoSeleccionado && (
          <div>
            <button onClick={() => setJuradoActivo(null)} className="text-[#00B4D8] text-sm mb-4 flex items-center gap-1 hover:text-[#D4F842] transition-colors cursor-pointer">
              ← Cambiar jurado
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {listaJurados.find(j => j.id === juradoActivo)?.nombre}
                </h2>
                <p className="text-sm text-[#6b7c93]">Seleccionar equipo a calificar</p>
              </div>
              <button onClick={() => setEditandoEquipos(!editandoEquipos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  editandoEquipos ? 'bg-gradient-to-r from-[#D4F842] to-[#00B4D8] text-[#061224]' : 'bg-white/5 text-[#b8c5d6] hover:bg-white/10 border border-[#00B4D8]/20'
                }`}>
                {editandoEquipos ? '✓ Listo' : '✏️ Editar equipos'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {equipos.map(eq => {
                const yaCal = yaCalifico(juradoActivo!, eq.id);
                return (
                  <div key={eq.id} className="relative">
                    <button onClick={() => { seleccionarEquipo(eq.id); if (yaCalifico(juradoActivo!, eq.id)) cargarCalificacionExistente(juradoActivo!, eq.id); }}
                      className={`w-full card-dark p-4 text-left cursor-pointer ${yaCal ? 'border-[#D4F842]/40' : ''}`}>
                      <div className="flex items-center justify-between">
                        {editandoEquipos ? (
                          <input type="text" value={eq.nombre} onChange={(e) => actualizarNombreEquipo(eq.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()} className="input-dark text-sm font-bold" />
                        ) : (
                          <h4 className="font-bold text-white text-sm">{eq.nombre}</h4>
                        )}
                        {yaCal && <span className="text-[#D4F842] text-lg">✓</span>}
                      </div>
                      <p className="text-[10px] text-[#6b7c93] mt-1">{yaCal ? 'Calificado' : 'Pendiente'}</p>
                    </button>
                    {editandoEquipos && (
                      <button onClick={() => eliminarEquipo(eq.id)} className="absolute top-1 right-1 text-red-400 hover:text-red-300 text-xs w-5 h-5 flex items-center justify-center rounded bg-red-500/10 cursor-pointer">✕</button>
                    )}
                  </div>
                );
              })}
              {editandoEquipos && (
                <button onClick={agregarEquipo} className="card-dark p-4 border-dashed border-[#00B4D8]/30 hover:border-[#D4F842]/50 flex items-center justify-center cursor-pointer min-h-[80px]">
                  <span className="text-[#00B4D8] text-sm font-medium">+ Agregar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {juradoActivo && equipoSeleccionado && (
          <div>
            <button onClick={() => { setEquipoSeleccionado(null); setPuntuaciones({}); setComentario(''); }}
              className="text-[#00B4D8] text-sm mb-6 flex items-center gap-1 hover:text-[#D4F842] transition-colors cursor-pointer">
              ← Volver a equipos
            </button>

            <div className="card-dark p-5 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00B4D8]/20 to-[#0052CC]/20 flex items-center justify-center text-xl">
                  {listaJurados.find(j => j.id === juradoActivo)?.avatar}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{listaJurados.find(j => j.id === juradoActivo)?.nombre}</p>
                  <p className="text-xs text-[#6b7c93]">→ {equipos.find(e => e.id === equipoSeleccionado)?.nombre}</p>
                </div>
              </div>
              {calificaciones.some(c => c.juradoId === juradoActivo && c.equipoId === equipoSeleccionado) && (
                <button onClick={() => setConfirmarBorrado(`${juradoActivo}-${equipoSeleccionado}`)}
                  className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg cursor-pointer">
                  🗑️ Borrar
                </button>
              )}
            </div>

            <div className="space-y-3">
              {criterios.map((c, idx) => (
                <div key={c.id} className="card-dark p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="num-badge text-xs flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-white text-sm">{c.nombre}</h4>
                          <span className="score-badge score-high text-[10px]">{c.ponderacion}%</span>
                        </div>
                        <p className="text-xs text-[#6b7c93]">{c.descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button key={n} onClick={() => actualizarPuntuacion(c.id, n)}
                          className={`w-8 h-8 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            puntuaciones[c.id] === n
                              ? n <= 3 ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                              : n <= 6 ? 'bg-[#00B4D8]/20 text-[#00B4D8] ring-1 ring-[#00B4D8]/50'
                              : 'bg-[#D4F842]/20 text-[#D4F842] ring-1 ring-[#D4F842]/50'
                              : 'bg-white/5 text-[#6b7c93] hover:bg-white/10 hover:text-white'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {puntuaciones[c.id] && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 progress-lime">
                        <div className="progress-lime-fill" style={{ width: `${puntuaciones[c.id] * 10}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#D4F842] w-8 text-right">{puntuaciones[c.id]}/10</span>
                    </div>
                  )}
                </div>
              ))}

              <div className="card-dark p-5">
                <h4 className="text-sm font-bold text-white mb-2">💬 Comentarios</h4>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                  placeholder="Observaciones o retroalimentación..."
                  className="input-dark resize-none h-20" />
              </div>

              {criterios.every(c => puntuaciones[c.id] !== undefined) && (
                <div className="card-dark p-5 border-[#00B4D8]/30 animate-glow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#00B4D8] font-semibold uppercase tracking-wider">Puntaje Ponderado</p>
                      <p className="text-3xl font-black text-white mt-1">
                        {criterios.reduce((acc, c) => acc + (puntuaciones[c.id] || 0) * (c.ponderacion / 100), 0).toFixed(2)}
                        <span className="text-sm text-[#6b7c93] font-normal"> / 10</span>
                      </p>
                    </div>
                    <div className="text-4xl">
                      {(() => { const s = criterios.reduce((acc, c) => acc + (puntuaciones[c.id] || 0) * (c.ponderacion / 100), 0);
                        return s >= 8 ? '🏆' : s >= 6 ? '⭐' : s >= 4 ? '👍' : '📝'; })()}
                    </div>
                  </div>
                </div>
              )}

              <button onClick={guardarCalificacion} disabled={!criterios.every(c => puntuaciones[c.id] !== undefined)}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  criterios.every(c => puntuaciones[c.id] !== undefined)
                    ? 'btn-lime justify-center text-base'
                    : 'bg-white/5 text-[#6b7c93] cursor-not-allowed'
                }`}>
                {calificaciones.some(c => c.juradoId === juradoActivo && c.equipoId === equipoSeleccionado) ? '🔄 Actualizar' : '💾 Guardar Calificación'}
              </button>
            </div>
          </div>
        )}

        {/* Modales */}
        {confirmarBorrado && confirmarBorrado !== 'all' && !confirmarBorrado.startsWith('jurado-') && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-dark p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <span className="text-4xl">⚠️</span>
                <h3 className="text-lg font-bold text-white mt-2">¿Borrar calificación?</h3>
                <p className="text-sm text-[#6b7c93] mt-1">Esta acción no se puede deshacer.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmarBorrado(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 cursor-pointer">Cancelar</button>
                <button onClick={() => { const [jId, eId] = confirmarBorrado.split('-').map(Number); borrarCalificacion(jId, eId); }}
                  className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 cursor-pointer">Borrar</button>
              </div>
            </div>
          </div>
        )}
        {confirmarBorrado && confirmarBorrado.startsWith('jurado-') && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-dark p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <span className="text-4xl">⚠️</span>
                <h3 className="text-lg font-bold text-white mt-2">¿Borrar todo este jurado?</h3>
                <p className="text-sm text-[#6b7c93] mt-1">Se eliminarán todas sus calificaciones.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmarBorrado(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 cursor-pointer">Cancelar</button>
                <button onClick={() => { const jId = parseInt(confirmarBorrado.replace('jurado-', '')); borrarCalificacionesJurado(jId); }}
                  className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 cursor-pointer">Borrar todo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderResultados = () => {
    const ranking = obtenerRanking();
    const totalPosible = listaJurados.length * equipos.length;
    const progreso = Math.round((calificaciones.length / totalPosible) * 100);

    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <span className="badge-pill-neon mb-2 inline-block"><span>◉</span> Resultados</span>
            <h2 className="text-3xl font-black text-white">
              Ranking en <span className="text-[#D4F842]">Tiempo Real</span>
            </h2>
            <p className="text-sm text-[#6b6b7b] mt-1">{calificaciones.length} de {totalPosible} calificaciones ({progreso}%)</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setMostrarExportar(!mostrarExportar)} className="btn-lime text-xs">📥 Exportar CSV</button>
            {calificaciones.length > 0 && (
              <button onClick={() => setConfirmarBorrado('all')} className="btn-glass text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">🗑️ Nueva Ronda</button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="card-dark p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">Progreso de calificaciones</span>
            <span className="text-xs font-mono text-[#D4F842]">{progreso}%</span>
          </div>
          <div className="progress-lime">
            <div className="progress-lime-fill" style={{ width: `${progreso}%` }} />
          </div>
        </div>

        {mostrarExportar && (
          <div className="card-dark p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-[#00B4D8]/30">
            <div className="flex items-center gap-3">
              <span className="text-xl">📥</span>
              <div>
                <p className="text-sm font-semibold text-white">Exportar resultados</p>
                <p className="text-[10px] text-[#6b7c93]">Descargue un CSV con todos los detalles</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMostrarExportar(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white hover:bg-white/5 cursor-pointer">Cancelar</button>
              <button onClick={exportarResultados} className="btn-lime text-xs">Descargar</button>
            </div>
          </div>
        )}

        {ranking.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-white mb-2">Sin calificaciones aún</h3>
            <p className="text-sm text-[#6b7c93] mb-4">Los jurados deben comenzar a calificar.</p>
            <button onClick={() => setVista('calificar')} className="btn-lime text-sm">Ir a calificar →</button>
          </div>
        ) : (
          <>
            {/* Podio */}
            <div className="card-dark p-6 mb-8 border-[#00B4D8]/20">
              <h3 className="text-sm font-bold text-[#00B4D8] uppercase tracking-wider mb-6 text-center">🏆 Top 3</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ranking.slice(0, 3).map((eq, idx) => (
                  <div key={eq.id} className={`p-5 rounded-xl text-center ${
                    idx === 0 ? 'bg-gradient-to-br from-[#D4F842]/10 to-[#00B4D8]/10 border border-[#D4F842]/30' :
                    idx === 1 ? 'bg-white/5 border border-white/10' :
                    'bg-white/[0.02] border border-white/5'
                  }`}>
                    <div className="text-3xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                    <h4 className="font-bold text-white">{eq.nombre}</h4>
                    <p className="text-2xl font-black bg-gradient-to-r from-[#00B4D8] to-[#D4F842] bg-clip-text text-transparent mt-2">{eq.resultado?.promedio.toFixed(2)}</p>
                    <p className="text-[10px] text-[#6b7c93] mt-1">{eq.resultado?.totalJurados} jurado(s)</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla */}
            <div className="card-dark overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#00B4D8]/10">
                      <th className="text-left p-4 text-xs font-semibold text-[#6b7c93] uppercase">#</th>
                      <th className="text-left p-4 text-xs font-semibold text-[#6b7c93] uppercase">Equipo</th>
                      {criterios.map(c => (
                        <th key={c.id} className="text-center p-3 text-[10px] font-semibold text-[#6b7c93] uppercase">
                          {c.nombre.split(' ').slice(0, 2).join(' ')}<br />
                          <span className="text-[#D4F842]">{c.ponderacion}%</span>
                        </th>
                      ))}
                      <th className="text-center p-4 text-xs font-semibold text-[#6b7c93] uppercase">Total</th>
                      <th className="text-center p-4 text-xs font-semibold text-[#6b7c93] uppercase">Jurados</th>
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
                        <tr key={eq.id} className="border-b border-[#00B4D8]/5 hover:bg-[#00B4D8]/5">
                          <td className="p-4 text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="text-[#6b7c93] text-sm">{idx + 1}</span>}</td>
                          <td className="p-4 font-bold text-white">{eq.nombre}</td>
                          {criterios.map(c => (
                            <td key={c.id} className="p-3 text-center">
                              <span className={`score-badge ${promediosPorCriterio[c.id] >= 8 ? 'score-high' : promediosPorCriterio[c.id] >= 6 ? 'score-mid' : 'score-low'}`}>
                                {promediosPorCriterio[c.id].toFixed(1)}
                              </span>
                            </td>
                          ))}
                          <td className="p-4 text-center">
                            <span className="score-badge score-high">{eq.resultado?.promedio.toFixed(2)}</span>
                          </td>
                          <td className="p-4 text-center text-xs text-[#6b7c93] font-mono">{eq.resultado?.totalJurados}/{listaJurados.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detalle por jurado */}
            <h3 className="text-sm font-bold text-[#00B4D8] uppercase tracking-wider mb-4">Detalle por Jurado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listaJurados.map(j => {
                const calsJurado = calificaciones.filter(c => c.juradoId === j.id);
                return (
                  <div key={j.id} className="card-dark p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{j.avatar}</span>
                        <div>
                          <p className="font-bold text-white text-sm">{j.nombre}</p>
                          <p className="text-[10px] text-[#6b7c93]">{calsJurado.length} calificado(s)</p>
                        </div>
                      </div>
                      {calsJurado.length > 0 && (
                        <button onClick={() => setConfirmarBorrado(`jurado-${j.id}`)} className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded cursor-pointer">🗑️</button>
                      )}
                    </div>
                    {calsJurado.length > 0 ? (
                      <div className="space-y-1.5">
                        {calsJurado.map(cal => {
                          const equipo = equipos.find(e => e.id === cal.equipoId);
                          const puntaje = criterios.reduce((acc, c) => acc + (cal.calificaciones[c.id] || 0) * (c.ponderacion / 100), 0);
                          return (
                            <div key={cal.equipoId} className="flex items-center justify-between bg-[#00B4D8]/5 rounded-lg p-2">
                              <span className="text-xs text-[#b8c5d6]">{equipo?.nombre}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#D4F842]">{puntaje.toFixed(2)}</span>
                                <button onClick={() => setConfirmarBorrado(`${j.id}-${cal.equipoId}`)} className="text-red-400/50 hover:text-red-400 text-[10px] cursor-pointer">✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6b7c93] italic">Sin calificaciones</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Modal borrado total */}
        {confirmarBorrado === 'all' && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-dark p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <span className="text-4xl">🗑️</span>
                <h3 className="text-lg font-bold text-white mt-2">Iniciar Nueva Ronda</h3>
                <p className="text-sm text-[#6b7c93] mt-1">Se eliminarán <strong className="text-white">{calificaciones.length}</strong> calificaciones.</p>
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setConfirmarBorrado(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 cursor-pointer">Cancelar</button>
                <button onClick={() => { exportarResultados(); borrarTodasCalificaciones(); }} className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 cursor-pointer">Exportar y Borrar</button>
              </div>
              <button onClick={borrarTodasCalificaciones} className="w-full py-2.5 rounded-lg border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 cursor-pointer">Solo Borrar</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061224] via-[#0A192F] to-[#061224]">
      {renderHeader()}
      <main className="relative">
        {vista === 'inicio' && renderInicio()}
        {vista === 'contexto' && renderContexto()}
        {vista === 'calificar' && renderCalificar()}
        {vista === 'resultados' && renderResultados()}
      </main>
      <footer className="border-t border-[#00B4D8]/10 py-6 mt-12 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-[#6b7c93]">SuperBrix © 2026 — Bootcamp Fábrica Digital e Inteligencia Artificial</p>
          <p className="text-[10px] text-[#4a5a6a] mt-1">Transformación Digital & IA • SENA Regional Atlántico</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
