import BalanceStatus from './BalanceStatus';
import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './authClient';
import { cardUrl } from './qr';

export function patientCardUrl(token) {
  return `${window.location.origin}/#tarjeta=${token}`;
}
const btn = { padding: '12px 16px', borderRadius: 10, border: 0, background: '#0F5E61', color: '#F7F4EF', fontWeight: 700, cursor: 'pointer', margin: '6px 6px 6px 0' };

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
  return <div style={{borderTop:'1px solid #D6DFDB',marginTop:20,paddingTop:12}}>
    <h3>Tarjeta para el paciente</h3>
    <p>Consulta de saldos sin contraseña. Comparte este enlace únicamente con el paciente.</p>
    <button style={btn} disabled={busy} onClick={()=>manage('obtener')}>Preparar enlace</button>
    <button style={btn} disabled={busy} onClick={()=>manage('reemplazar')}>Crear enlace nuevo</button>
    <button style={btn} disabled={busy} onClick={()=>manage('revocar')}>Desactivar enlace</button>
    {url && <div>
      <label>Enlace privado <input aria-label="Enlace privado" readOnly value={url} onFocus={e=>e.target.select()} style={{width:'100%',boxSizing:'border-box',padding:10}} /></label>
      <button style={btn} onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Enlace copiado. Ya puedes pegarlo en el mensaje al paciente.');}catch{setMessage('Selecciona el enlace y cópialo manualmente.');}}}>Copiar enlace</button>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{color:'#0F5E61'}}>Ver tarjeta del paciente</a>
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
  return <main style={{minHeight:'100vh',background:'#F7F4EF',color:'#263536',fontFamily:'system-ui,sans-serif',padding:'24px 12px',boxSizing:'border-box',lineHeight:1.55}}>
    <article style={{maxWidth:440,margin:'0 auto',background:'#F7F4EF',border:'1px solid #0F5E6126',borderRadius:24,overflow:'hidden',boxShadow:'0 16px 48px #0F5E6110'}}>
      <header style={{padding:'28px 24px 24px',borderBottom:'1px solid #0F5E6126',position:'relative'}}>
        <div aria-hidden="true" style={{display:'flex',gap:6,position:'absolute',right:24,top:32}}>{['#19A7A0','#84DAD4','#B7A4C9'].map(c=><span key={c} style={{width:10,height:10,borderRadius:'50%',background:c}} />)}</div>
        <p style={{color:'#0F5E61',letterSpacing:4,fontWeight:800,fontSize:24,margin:0}}>NÚCLEO</p>
        <p style={{color:'#0F5E61',fontSize:13,margin:'2px 0 20px'}}>Centrados en ti.</p>
        <p style={{fontSize:10,letterSpacing:1.5,margin:0}}>SALUD METABÓLICA INTEGRAL</p>
        <h1 style={{fontSize:26,color:'#0F5E61',margin:'6px 0 0',fontWeight:650}}>Tu membresía Plus</h1>
      </header>
      <div style={{padding:'20px 24px 24px'}}>
      {busy && <p role="status">Consultando tus saldos…</p>}
      {error && <p role="alert">{error}</p>}
      {card && <>
        <p style={{fontWeight:800,fontSize:19}}>Hola, {card.nombre}</p><BalanceStatus remaining={card.aplicaciones} />
        <div style={{background:'#0F5E61',color:'#F7F4EF',borderRadius:18,padding:'20px 24px',position:'relative',overflow:'hidden'}}>
          <span aria-hidden="true" style={{position:'absolute',width:100,height:100,border:'18px solid #84DAD4',borderRadius:'50%',right:-42,top:-38,opacity:0.35}} />
          <strong style={{fontSize:56,lineHeight:1.15}}>{card.aplicaciones}<span style={{fontSize:22,fontWeight:400}}> / 4</span></strong><p style={{margin:'8px 0 0',fontSize:14}}>Aplicaciones disponibles</p>
        </div>
        <div style={{marginTop:16,borderTop:'1px solid #0F5E6126',borderBottom:'1px solid #0F5E6126'}}>
          <p style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><span>Nutrición:</span> <strong style={{fontSize:14}}>{card.nutricion ?? 'por confirmar'}</strong></p>
          <p style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><span>Fisioterapia:</span> <strong style={{fontSize:14}}>{card.fisioterapia ?? 'por confirmar'}</strong></p>
        </div>
        <div style={{background:'white',padding:16,borderRadius:16,width:'fit-content',margin:'24px auto 16px',border:'1px solid #CBBFDA'}}><QRCodeSVG value={cardUrl(card.qr)} size={184} title="Presenta este QR al personal de Núcleo" /></div>
        <p style={{textAlign:'center',fontSize:13}}>Presenta este QR al personal de Núcleo.<br />Escanearlo no descuenta servicios.</p>
        <p style={{fontSize:13,borderLeft:'3px solid #B7A4C9',paddingLeft:12,marginTop:24}}>Tus aplicaciones no caducan. Al renovar, las sesiones de nutrición y fisioterapia que no utilizaste se pierden.</p>
        <p style={{fontSize:11}}>Consultado a las {updated}. Los saldos pueden cambiar cuando Núcleo registra un servicio.</p>
      </>}
      <button style={{...btn,background:'#0F5E61',color:'#F7F4EF',width:'100%',margin:'8px 0',minHeight:46,opacity:busy?0.65:1}} disabled={busy} onClick={load}>Actualizar saldos</button>
      <p style={{fontSize:11,marginBottom:0}}>Este enlace es privado. Cualquier persona que lo tenga podrá consultar tu tarjeta.</p>
      </div>
    </article>
  </main>;
}
