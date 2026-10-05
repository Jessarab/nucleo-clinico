import { supabase } from './authClient';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseQr(input) {
  let value = input.trim();
  if (/^https?:/i.test(value)) {
    const url = new URL(value);
    if (url.origin !== window.location.origin || url.pathname !== '/') throw new Error('Este enlace pertenece a otra versión de Núcleo. Abre la tarjeta en esta versión o pega su código.');
    value = new URLSearchParams(url.hash.slice(1)).get('membresia') || '';
  } else value = value.replace(/^nucleo:/i, '');
  if (!uuid.test(value)) throw new Error('El QR no contiene un código de membresía válido.');
  return value.toLowerCase();
}
export function cardUrl(token) {
  return `${window.location.origin}/#membresia=${parseQr(token)}`;
}
export async function resolveQr(input) {
  const token = parseQr(input);
  const r = await supabase.from('paquetes').select('paciente_id,cerrado').eq('qr', token).maybeSingle();
  if (r.error) throw r.error;
  if (!r.data || r.data.cerrado) throw new Error('Tarjeta no disponible o de un paquete anterior.');
  const p = await supabase.from('pacientes').select('*').eq('id', r.data.paciente_id).single();
  if (p.error) throw p.error;
  return p.data;
}
