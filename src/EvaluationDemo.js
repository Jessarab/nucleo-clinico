import React from 'react';
import Evaluations from './Evaluations';
let rows=[];
const repository={list:async()=>rows,save:async row=>{const saved={...row,created_at:new Date().toISOString()};rows=[saved,...rows];return saved;}};
export default function EvaluationDemo(){return <main style={{padding:'24px',background:'#dce9e7',minHeight:'100vh',fontFamily:'system-ui'}}><p style={{maxWidth:1200,margin:'0 auto 24px'}}>DEMOSTRACIÓN · Datos ficticios · Guardado temporal en memoria · Sin conexión a expedientes</p><Evaluations patient={{id:'demo',nombre:'Paciente de demostración',sexo:'F'}} repository={repository}/></main>;}
