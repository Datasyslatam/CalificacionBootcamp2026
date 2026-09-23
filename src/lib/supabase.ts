import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
// Reemplaza estos valores con tus credenciales reales de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
  return supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Crear cliente de Supabase
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Función para verificar la conexión
export const testConnection = async () => {
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    const { error } = await supabase.from('equipos').select('count').limit(1);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
};
