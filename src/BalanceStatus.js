export default function BalanceStatus({ remaining }) {
  const status = remaining === 0
    ? {text:'Sin aplicaciones · Puedes renovar',bg:'#F3E2E0',fg:'#873D38',icon:'!',bar:'#B98282'}
    : remaining === 1
    ? {text:'Última aplicación disponible',bg:'#F0E7D4',fg:'#765015',icon:'!',bar:'#B19B77'}
    : {text:`${remaining} aplicaciones disponibles`,bg:'#D3EAE5',fg:'#0F5E61',icon:'✓',bar:'#19A7A0'};
  return <div aria-label={`Saldo: ${status.text}`} style={{margin:'12px 0'}}>
    <div aria-hidden="true" style={{display:'flex',gap:5,marginBottom:8}}>{[0,1,2,3].map(i=><span key={i} style={{flex:1,height:8,borderRadius:4,background:i<remaining?status.bar:'#C4D2CE'}} />)}</div>
    <div style={{background:status.bg,color:status.fg,borderRadius:10,padding:'9px 11px',fontSize:13,fontWeight:700,lineHeight:1.4}}><span aria-hidden="true">{status.icon} </span>{status.text}</div>
  </div>;
}
