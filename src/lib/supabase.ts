// Cliente de Supabase. La URL y la clave «anon» vienen de .env (ver .env.example).
// La clave anon es pública: la seguridad está en las políticas RLS de supabase/migrations.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** false si falta configurar .env: la app enseña cómo hacerlo en vez de fallar. */
export const isSupabaseConfigured = /^https?:\/\//.test(url) && anonKey.length > 20 && !url.includes('TU-PROYECTO');

// Durante el render estático de la web no hay window: sin almacenamiento persistente.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? url : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder',
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      // En web, los enlaces de recuperar contraseña vuelven con el token en la URL.
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
