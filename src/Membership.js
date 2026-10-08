import QrScanner from './QrScanner';
import { SharePatientCard } from './PatientCard';
import { cardUrl, resolveQr } from './qr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './authClient';

export async function currentPackage(patientId) {
  const { data, error } = await supabase.from('paquetes').select('*').eq('paciente_id', patientId).is('cerrado', null).maybeSingle();
  if (error) throw error;
  return data;
}
export async function membershipAction(patientId, action, packId, requestId, data = {}) {
  const { data: result, error } = await supabase.rpc('operar_membresia', {
    p_paciente: patientId, p_accion: action, p_paquete: packId, p_peticion: requestId, p_datos: data,
  });
  if (error) throw error;
  return result;
}
const panel = { background: '#E8F0ED', color: '#263536', border: '1px solid #BECECA', borderRadius: 18, padding: 24, marginBottom: 16 };
const button = { background:'#0F5E61', color:'#F7F4EF', border:0, borderRadius:10, minHeight:44, fontWeight:600, padding: '10px 16px', margin: '8px 8px 8px 0', cursor: 'pointer' };
const labels = { alta: 'Inicio de membresía', saldo_inicial: 'Saldo anterior importado', confirmar_incluidos: 'Servicios anteriores confirmados', aplicacion: 'Aplicación', nutricion: 'Nutrición', fisioterapia: 'Fisioterapia', cierre_por_renovacion: 'Cierre al renovar' };

export default function Membership({ patient, onUpdate }) {
  const [packages, setPackages] = useState([]);
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nutrition, setNutrition] = useState('');
  const [physio, setPhysio] = useState('');
  const [dose, setDose] = useState(patient.dosis_actual || '2.5');
  const [notes, setNotes] = useState(patient.notas_membresia || '');
  const operation = useRef(null);
  const lock = useRef(false);
  const pack = packages.find(p => !p.cerrado);
  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from('paquetes').select('*').eq('paciente_id', patient.id).order('iniciado', { ascending: false });
    if (e) throw e;
    let movements = [];
    if (data.length) {
      const r = await supabase.from('movimientos_membresia').select('*').in('paquete_id', data.map(p => p.id)).order('fecha', { ascending: false });
      if (r.error) throw r.error;
      movements = r.data;
    }
    setPackages(data); setMoves(movements);
  }, [patient.id]);
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, [load]);
  async function act(action, data = {}) {
    if (lock.current) return;
    const key = JSON.stringify([action, pack?.id, data]);
    if (operation.current && operation.current.key !== key) {
      setError('Reintenta la operación pendiente antes de cambiar de acción.'); return;
    }
    if (!operation.current && !window.confirm(action === 'renovar'
      ? '¿Iniciar un paquete de 4 aplicaciones, 1 nutrición y 1 fisioterapia? Los servicios pendientes del paquete anterior se perderán.'
      : '¿Confirmar este registro? Quedará en el historial de la membresía.')) return;
    operation.current ||= { key, id: crypto.randomUUID() };
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await membershipAction(patient.id, action, pack?.id || null, operation.current.id, data);
      operation.current = null;
      onUpdate(result.paciente);
      await load();
    } catch (e) { if (e.code) operation.current = null; setError(e.message + ' Puedes reintentar la misma operación sin duplicarla.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (loading) return <p>Cargando membresía…</p>;
  return <section className="nucleo-membership">
    {error && <p role="alert" style={{ color: '#B23838' }}>{error}</p>}
    <div style={panel}>
      <h2>NÚCLEO · Membresía Plus</h2><p>{patient.nombre}</p>
      {pack ? <>
        <p><strong>{pack.aplicaciones} de 4 aplicaciones disponibles</strong></p>
        <p>Nutrición: {pack.nutricion ?? 'por confirmar'} · Fisioterapia: {pack.fisioterapia ?? 'por confirmar'}</p>
        <p>Sin caducidad por fecha. Los servicios pendientes se pierden al renovar.</p>
        <div style={{ background: 'white', padding: 12, display: 'inline-block' }}><QRCodeSVG value={cardUrl(pack.qr)} size={160} /></div>
        <p><a href={cardUrl(pack.qr)} style={{ color: "#0F5E61" }}>Abrir enlace de membresía</a></p><p style={{ fontSize: 12 }}>QR de identificación para el personal autorizado. No descuenta servicios al escanearlo.</p>
        <button style={button} disabled={busy || pack.nutricion !== 1} onClick={() => act('nutricion')}>Registrar nutrición</button>
        <button style={button} disabled={busy || pack.fisioterapia !== 1} onClick={() => act('fisioterapia')}>Registrar fisioterapia</button>
        <p>Las aplicaciones se registran desde la pestaña Sesiones.</p>
        <SharePatientCard patientId={patient.id} />
        {pack.nutricion === null && <div>
          <p>Confirma los servicios disponibles del paquete anterior:</p>
          <label>Nutrición <select value={nutrition} onChange={e => setNutrition(e.target.value)}><option value="">Elegir</option><option value="1">1 pendiente</option><option value="0">Ya utilizada</option></select></label>{' '}
          <label>Fisioterapia <select value={physio} onChange={e => setPhysio(e.target.value)}><option value="">Elegir</option><option value="1">1 pendiente</option><option value="0">Ya utilizada</option></select></label>
          <button style={button} disabled={busy || nutrition === '' || physio === ''} onClick={() => act('confirmar_incluidos', { nutricion: Number(nutrition), fisioterapia: Number(physio) })}>Confirmar saldos anteriores</button>
        </div>}
      </> : <p>Sin membresía activa.</p>}
      <button style={button} disabled={busy || (!!error && !operation.current) || (pack && pack.aplicaciones > 0)} onClick={() => act('renovar')}>{pack ? 'Renovar membresía' : 'Crear membresía'}</button>
      <button style={button} disabled={busy || !!operation.current} onClick={() => { setError(''); load().catch(e => setError(e.message)); }}>Actualizar saldos</button>
      {pack?.aplicaciones > 0 && <p>Podrás renovar cuando queden 0 aplicaciones.</p>}
    </div>
    <div style={panel}>
      <h3>Datos del plan</h3>
      <label>Dosis actual (mg) <select value={dose} onChange={e => setDose(e.target.value)}>{['2.5','5','7.5','10'].map(d => <option key={d}>{d}</option>)}</select></label>
      <p><label>Notas <textarea value={notes} onChange={e => setNotes(e.target.value)} /></label></p>
      <button style={button} disabled={busy} onClick={async () => {
        setBusy(true); setError('');
        try {
          const r = await supabase.from('pacientes').update({ dosis_actual: dose, notas_membresia: notes }).eq('id', patient.id).select().single();
          if (r.error) throw r.error;
          onUpdate(r.data);
        } catch (e) { setError(e.message); } finally { setBusy(false); }
      }}>Guardar datos del plan</button>
    </div>
    <div style={panel}><h3>Historial de paquetes</h3>{packages.map(p => <div key={p.id} style={{ borderTop: '1px solid #BECECA', paddingTop: 12 }}>
      <strong>{p.cerrado ? 'Paquete cerrado' : 'Paquete actual'} · {new Date(p.iniciado).toLocaleDateString('es-MX')}</strong>
      {p.importado && <p>Saldo inicial importado. Fecha original: {p.fecha_original || 'sin registro'}.</p>}
      {moves.filter(m => m.paquete_id === p.id).map(m => <p key={m.id}>{new Date(m.fecha).toLocaleString('es-MX')} · {labels[m.tipo] || m.tipo}{m.tipo === 'cierre_por_renovacion' ? ` · Servicios no utilizados: nutrición ${m.detalle.nutricion_perdida ?? 'sin confirmar'}, fisioterapia ${m.detalle.fisioterapia_perdida ?? 'sin confirmar'}` : ''}</p>)}
    </div>)}</div>
  </section>;
}

export function MembershipLookup({ onSelect }) {
  const [code, setCode] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const lock = useRef(false);
  async function find(value) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setCamera(false);
    try { onSelect(await resolveQr(value)); }
    catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div style={panel}>
    <button type="button" style={button} disabled={busy || camera} onClick={() => { setError(''); setCamera(true); }}>Escanear QR</button>
    {camera && <QrScanner onClose={() => setCamera(false)} onRead={value => { setCode(value); find(value); }} />}
    <form onSubmit={e => { e.preventDefault(); find(code); }}><label>Código o enlace de tarjeta <input value={code} onChange={e => setCode(e.target.value)} placeholder="Pega el enlace o código del QR" /></label><button disabled={busy} style={button}>Buscar membresía</button></form>
    {error && <p role="alert">{error}</p>}
  </div>;
}

