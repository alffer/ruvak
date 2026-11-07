// Mensajes de Supabase Auth en castellano y comprensibles.
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'El correo o la contraseña no coinciden.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar: te enviamos un enlace al registrarte.';
  if (m.includes('user already registered')) return 'Ya hay una cuenta con ese correo. Prueba a entrar o recuperar el acceso.';
  if (m.includes('password should be at least')) return 'La contraseña es demasiado corta.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Ese correo no parece válido.';
  if (m.includes('network') || m.includes('fetch')) return 'No hay conexión con el servidor. Revisa tu conexión.';
  if (m.includes('same password') || m.includes('different from the old')) return 'La nueva contraseña debe ser distinta de la anterior.';
  return message;
}

export const MIN_PASSWORD = 8;

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
