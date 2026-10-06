import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './authClient';
import { cardUrl } from './qr';

export function patientCardUrl(token) {
  return `${window.location.origin}/#tarjeta=${token}`;
}
const btn = { padding: '12px 16px', borderRadius: 10, border: 0, background: '#00d4aa', color: '#0d1117', fontWeight: 700, cursor: 'pointer', margin: '6px 6px 6px 0' };

export function SharePatientCard({ patientId }) {
  const [url,setUrl]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>{setUrl('');setMessage('');},[patientId]);
  async function manage(action) {
    if (busy) return;
    if (action!=='obtener' && !window.confirm(action==='revocar' ? '¿Desactivar el enlace del paciente? Dejará de mostrar la tarjeta.' : '¿Crear un enlace nuevo? El anterior dejará de funcionar.')) return;
    setBusy(true);setMessage('');
    try {
      const {data,error}=await supabase.rpc('gestionar_tarjeta',{p_paciente:patientId,p_accion:action});
      if(error)throw error;
      setUrl(data?patientCardUrl(data):'');
      setMessage(data?'Enlace listo. Quien lo reciba podrá consultar los saldos.':'Enlace desactivado.');
    } catch(e) {setUrl('');setMessage('No se pudo preparar el enlace. '+e.message);}
    finally {setBusy(false);}
  }
  return <div style={{borderTop:'1px solid #506070',marginTop:20,paddingTop:12}}>
    <h3>Tarjeta para el paciente</h3>
    <p>Consulta de saldos sin contraseña. Comparte este enlace únicamente con el paciente.</p>
    <button style={btn} disabled={busy} onClick={()=>manage('obtener')}>Preparar enlace</button>
    <button style={btn} disabled={busy} onClick={()=>manage('reemplazar')}>Crear enlace nuevo</button>
    <button style={btn} disabled={busy} onClick={()=>manage('revocar')}>Desactivar enlace</button>
    {url && <div>
      <label>Enlace privado <input aria-label="Enlace privado" readOnly value={url} onFocus={e=>e.target.select()} style={{width:'100%',boxSizing:'border-box',padding:10}} /></label>
      <button style={btn} onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Enlace copiado. Ya puedes pegarlo en el mensaje al paciente.');}catch{setMessage('Selecciona el enlace y cópialo manualmente.');}}}>Copiar enlace</button>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{color:'#00d4aa'}}>Ver tarjeta del paciente</a>
    </div>}
    {message && <p role="status">{message}</p>}
  </div>;
}

export default function PatientCard({ token }) {
  const [card,setCard]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [updated,setUpdated]=useState('');
  const load=useCallback(async()=>{
    setBusy(true);setCard(null);setError('');setUpdated('');
    try {
      if(!/^[0-9a-f]{64}$/.test(token))throw new Error('invalid');
      const {data,error:e}=await supabase.rpc('consultar_tarjeta',{p_token:token});
      if(e)throw e;
      if(!data){setError('Esta tarjeta no está disponible. Solicita tu enlace vigente a Núcleo.');return;}
      setCard(data);setUpdated(new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}));
    }catch{setError('No pudimos consultar tu tarjeta. Revisa tu conexión o solicita el enlace a Núcleo.');}
    finally{setBusy(false);}
  },[token]);
  useEffect(()=>{
    load();
    const visible=()=>{if(document.visibilityState==='visible')load();};
    document.addEventListener('visibilitychange',visible);
    const timer=setInterval(()=>{if(document.visibilityState==='visible')load();},60000);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[load]);
  return <main style={{minHeight:'100vh',background:'#0d1117',color:'#e6edf3',fontFamily:'system-ui,sans-serif',padding:'24px 16px',boxSizing:'border-box'}}>
    <article style={{maxWidth:440,margin:'0 auto',background:'#1c2330',border:'1px solid #2a3441',borderRadius:24,padding:24}}>
      <p style={{color:'#00d4aa',letterSpacing:3,fontWeight:800}}>NÚCLEO</p><h1 style={{fontSize:28}}>Tu membresía Plus</h1>
      {busy && <p role="status">Consultando tus saldos…</p>}
      {error && <p role="alert">{error}</p>}
      {card && <>
        <p>Hola, {card.nombre}</p>
        <div style={{background:'#00d4aa15',borderRadius:16,padding:20}}><strong style={{fontSize:48,color:'#00d4aa'}}>{card.aplicaciones}<span style={{fontSize:20}}> / 4</span></strong><p>Aplicaciones disponibles</p></div>
        <p>Nutrición: <strong>{card.nutricion ?? 'por confirmar'}</strong></p>
        <p>Fisioterapia: <strong>{card.fisioterapia ?? 'por confirmar'}</strong></p>
        <div style={{background:'white',padding:14,borderRadius:12,width:'fit-content',margin:'24px auto'}}><QRCodeSVG value={cardUrl(card.qr)} size={200} title="Presenta este QR al personal de Núcleo" /></div>
        <p>Presenta este QR al personal de Núcleo. Escanearlo no descuenta servicios.</p>
        <p style={{fontSize:14,color:'#b6c2cf'}}>Tus aplicaciones no caducan. Al renovar, las sesiones de nutrición y fisioterapia que no utilizaste se pierden.</p>
        <p style={{fontSize:12}}>Consultado a las {updated}. Los saldos pueden cambiar cuando Núcleo registra un servicio.</p>
      </>}
      <button style={btn} disabled={busy} onClick={load}>Actualizar saldos</button>
      <p style={{fontSize:12,color:'#b6c2cf'}}>Este enlace es privado. Cualquier persona que lo tenga podrá consultar tu tarjeta.</p>
    </article>
  </main>;
}
