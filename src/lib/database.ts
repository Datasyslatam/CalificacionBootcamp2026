import { supabase, isSupabaseConfigured } from './supabase';
import { CalificacionJurado, Jurado } from '../types';

// ============================================
// SERVICIO DE BASE DE DATOS - SUPABASE
// ============================================

// Verificar si Supabase está disponible
const checkSupabase = () => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase no está configurado. Por favor configura las variables de entorno.');
  }
};

// ============================================
// EQUIPOS
// ============================================

export const getAllEquipos = async () => {
  checkSupabase();
  console.log('🔍 Consultando equipos desde Supabase...');
  const { data, error } = await supabase!
    .from('equipos')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('❌ Error consultando equipos:', error);
    throw error;
  }
  console.log('✅ Equipos obtenidos:', data?.length || 0);
  return data || [];
};

export const createEquipo = async (nombre: string) => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('equipos')
    .insert({ nombre })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEquipo = async (id: number, nombre: string) => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('equipos')
    .update({ nombre })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteEquipo = async (id: number) => {
  checkSupabase();
  const { error } = await supabase!
    .from('equipos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// JURADOS
// ============================================

export const getAllJurados = async () => {
  checkSupabase();
  console.log('🔍 Consultando jurados desde Supabase...');
  const { data, error } = await supabase!
    .from('jurados')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('❌ Error consultando jurados:', error);
    throw error;
  }
  console.log('✅ Jurados obtenidos:', data?.length || 0);
  return data || [];
};

export const updateJurado = async (id: number, updates: Partial<Jurado>) => {
  checkSupabase();
  console.log('💾 Actualizando jurado en Supabase:', { id, updates });
  const { data, error } = await supabase!
    .from('jurados')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error actualizando jurado:', error);
    throw error;
  }
  console.log('✅ Jurado actualizado exitosamente');
  return data;
};

// ============================================
// CALIFICACIONES
// ============================================

export const getAllCalificaciones = async () => {
  checkSupabase();
  console.log('🔍 Consultando calificaciones desde Supabase...');
  const { data, error } = await supabase!
    .from('calificaciones')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error consultando calificaciones:', error);
    throw error;
  }
  console.log('✅ Calificaciones obtenidas:', data?.length || 0);
  return data || [];
};

export const getCalificacionesByJurado = async (juradoId: number) => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('calificaciones')
    .select('*')
    .eq('jurado_id', juradoId);
  
  if (error) throw error;
  return data;
};

export const getCalificacionesByEquipo = async (equipoId: number) => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('calificaciones')
    .select('*')
    .eq('equipo_id', equipoId);
  
  if (error) throw error;
  return data;
};

export const getCalificacion = async (juradoId: number, equipoId: number) => {
  checkSupabase();
  const { data, error } = await supabase!
    .from('calificaciones')
    .select('*')
    .eq('jurado_id', juradoId)
    .eq('equipo_id', equipoId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
};

export const saveCalificacion = async (calificacion: Omit<CalificacionJurado, 'timestamp'>) => {
  checkSupabase();
  
  console.log('💾 Guardando calificación en Supabase:', {
    juradoId: calificacion.juradoId,
    equipoId: calificacion.equipoId,
    calificaciones: calificacion.calificaciones
  });
  
  // Verificar si ya existe
  const existing = await getCalificacion(calificacion.juradoId, calificacion.equipoId);
  
  if (existing) {
    console.log('🔄 Actualizando calificación existente ID:', existing.id);
    // Actualizar
    const { data, error } = await supabase!
      .from('calificaciones')
      .update({
        calificaciones: calificacion.calificaciones,
        comentarios: calificacion.comentarios,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error actualizando calificación:', error);
      throw error;
    }
    console.log('✅ Calificación actualizada exitosamente');
    return data;
  } else {
    console.log('➕ Insertando nueva calificación');
    // Insertar
    const { data, error } = await supabase!
      .from('calificaciones')
      .insert({
        jurado_id: calificacion.juradoId,
        equipo_id: calificacion.equipoId,
        calificaciones: calificacion.calificaciones,
        comentarios: calificacion.comentarios
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error insertando calificación:', error);
      throw error;
    }
    console.log('✅ Calificación insertada exitosamente');
    return data;
  }
};

export const deleteCalificacion = async (juradoId: number, equipoId: number) => {
  checkSupabase();
  const { error } = await supabase!
    .from('calificaciones')
    .delete()
    .eq('jurado_id', juradoId)
    .eq('equipo_id', equipoId);
  
  if (error) throw error;
};

export const deleteCalificacionesByJurado = async (juradoId: number) => {
  checkSupabase();
  const { error } = await supabase!
    .from('calificaciones')
    .delete()
    .eq('jurado_id', juradoId);
  
  if (error) throw error;
};

export const deleteAllCalificaciones = async () => {
  checkSupabase();
  const { error } = await supabase!
    .from('calificaciones')
    .delete()
    .neq('id', 0); // Eliminar todo
  
  if (error) throw error;
};

// ============================================
// UTILIDADES
// ============================================

// Convertir datos de Supabase al formato de la aplicación
export const mapSupabaseCalificacion = (dbCal: any): CalificacionJurado => {
  return {
    juradoId: dbCal.jurado_id,
    equipoId: dbCal.equipo_id,
    calificaciones: dbCal.calificaciones,
    comentarios: dbCal.comentarios,
    timestamp: new Date(dbCal.created_at)
  };
};

export const mapSupabaseEquipo = (dbEquipo: any) => {
  return {
    id: dbEquipo.id,
    nombre: dbEquipo.nombre
  };
};

export const mapSupabaseJurado = (dbJurado: any): Jurado => {
  return {
    id: dbJurado.id,
    nombre: dbJurado.nombre,
    cargo: dbJurado.cargo,
    avatar: dbJurado.avatar
  };
};
