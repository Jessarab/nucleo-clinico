export const PROTOCOL = 'nucleo-adultos-v1';
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
export const domains = [['medical','Médico / metabólico'],['mental','Salud mental'],['functional','Función / síntomas físicos']];
export const stages = ['Sin afectación aparente','Factores subclínicos o afectación leve','Enfermedad establecida o afectación moderada','Daño orgánico o afectación significativa','Afectación grave o incapacitante'];
export const domainCriteria = {
 medical: ['Sin factores de riesgo aparentes relacionados con obesidad','Factores subclínicos, sin enfermedad establecida','Comorbilidad establecida que requiere intervención','Daño a órgano blanco establecido','Enfermedad relacionada grave, potencialmente terminal'],
 mental: ['Sin síntomas psicológicos relacionados','Síntomas leves','Síntomas o afectación moderados','Síntomas o afectación significativos','Síntomas graves e incapacitantes'],
 functional: ['Sin síntomas físicos ni limitaciones','Síntomas o limitaciones leves','Limitaciones moderadas en actividades cotidianas','Limitaciones significativas de función o bienestar','Limitaciones funcionales graves'],
};
export const sections = [
 ['history','Historia y objetivos', [['reason','Motivo de consulta'],['illness','Padecimiento actual'],['permission','Permiso y preferencias para abordar el peso'],['goals','Prioridades del paciente'],['trajectory','Trayectoria del peso y edad de inicio'],['previous','Tratamientos previos y respuesta'],['family','Antecedentes familiares'],['personal','Antecedentes personales y cirugías'],['allergies','Alergias y reacciones'],['medications','Medicamentos, dosis y frecuencia'],['causes','Posibles causas secundarias y datos de inicio temprano']]],
 ['habits','Hábitos y bienestar', [['food','Alimentación y conducta alimentaria'],['exercise','Actividad física y sedentarismo'],['sleep','Sueño y descanso'],['alcohol','Alcohol: frecuencia y cantidad'],['tobacco','Tabaco: situación, cantidad y duración'],['emotional','Bienestar emocional'],['function','Movilidad y actividades cotidianas'],['barriers','Barreras, apoyos y contexto social']]],
 ['exam','Exploración e InBody', [['exam','Exploración física y síntomas'],['inbodyConditions','Equipo y condiciones de medición'],['inbodyReference','Referencia del reporte InBody en expediente']]],
 ['complications','Complicaciones', [['metabolic','Metabólicas: diagnósticos, sospechas y evidencia'],['mechanical','Mecánicas: dolor, reflujo, sueño y respiración'],['psychological','Mentales: hallazgos, gravedad y evidencia'],['reproductive','Salud reproductiva cuando corresponda']]],
 ['screening','Sueño y riesgo cardiovascular', []],
 ['studies','Laboratorios y estudios', [['labInterpretation','Interpretación clínica de los resultados'],['studiesReason','Indicación individual de estudios / referencias']]],
 ['eoss','Estadificación EOSS', []],
 ['plan','Conclusiones y acuerdos', [['diagnosis','Diagnósticos confirmados'],['suspicions','Problemas en estudio'],['advice','Orientación y opciones explicadas'],['plan','Plan e indicaciones para el paciente'],['agreed','Objetivos acordados'],['followup','Seguimiento y fecha / plazo'],['pending','Pendientes para el paciente']]],
];
export const measures = [['weight','Peso (kg)',1,500],['height','Talla (cm)',50,250],['waist','Cintura (cm)',20,300],['neck','Cuello (cm)',10,100],['sbp','Presión sistólica (mmHg)',40,300],['dbp','Presión diastólica (mmHg)',20,200],['fat','Masa grasa (kg)',0,400],['muscle','Masa muscular esquelética (kg)',0,200],['fatPercent','Grasa corporal (%)',0,100],['visceral','Grasa visceral (valor del equipo)',0,500]];
export const labFields = [['glucosa','Glucosa (mg/dL)'],['hba1c','HbA1c (%)'],['col_total','Colesterol total (mg/dL)'],['hdl','HDL (mg/dL)'],['ldl','LDL (mg/dL)'],['trigliceridos','Triglicéridos (mg/dL)'],['creatinina','Creatinina (mg/dL)'],['tgo','AST / TGO (U/L)'],['tgp','ALT / TGP (U/L)'],['plaquetas','Plaquetas (/µL)'],['albuminuria','Relación albúmina/creatinina (mg/g)']];
export const studyNames = ['Glucosa / HbA1c','Perfil de lípidos','Función renal / albuminuria','Evaluación hepática','Estudio de sueño','Evaluación cardiovascular','Evaluación psicológica','Nutrición','Otro estudio o referencia'];
export const stopQuestions = [['snoring','S','Ronquido fuerte'],['tired','T','Cansancio o somnolencia diurna'],['observed','O','Pausas respiratorias observadas'],['pressure','P','Hipertensión conocida o en tratamiento']];
export function number(v) { return v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v); }
export function ageAt(birth,date) { if(!/^\d{4}-\d{2}-\d{2}$/.test(birth||'') || !date || birth>date) return null; const b=new Date(birth+'T12:00:00Z'); if(Number.isNaN(b.getTime()) || b.toISOString().slice(0,10)!==birth) return null; let age=Number(date.slice(0,4))-Number(birth.slice(0,4)); if(date.slice(5)<birth.slice(5)) age--; return age; }
export function bmi(d) { const w=number(d.weight),h=number(d.height); return w>0&&h>0?w/((h/100)**2):null; }
export function stopBang(d) {
 const b=bmi(d),age=ageAt(d.birth,d.date),n=number(d.neck);
 const first=stopQuestions.map(([k])=>d[k]==='yes'?1:d[k]==='no'?0:null);
 const values=[...first,b===null?null:+(b>35),age===null?null:+(age>50),n===null?null:+(n>40),['M','F'].includes(d.sex)?+(d.sex==='M'):null];
 if(values.includes(null)) return {values,score:null,risk:'Incompleto'};
 const score=values.reduce((a,b)=>a+b,0),stop=first.reduce((a,b)=>a+b,0);
 return {values,score,risk:score>=5||(stop>=2&&(values[4]||values[6]||values[7]))?'Alto':score>=3?'Intermedio':'Bajo'};
}
export function suggestedEoss(d) { const vals=domains.map(([k])=>number(d['eoss_'+k])); return vals.some(v=>v===null||v<0||v>4)?null:Math.max(...vals); }
export function blankEvaluation(patient) { return {protocol:PROTOCOL,type:'Inicial',date:today(),sex:patient.sexo||'',birth:'',reason:patient.motivo_consulta||'',family:patient.ant_heredofam||'',personal:patient.ant_patologicos||'',allergies:patient.alergias||'',medications:patient.medicamentos||'',sleep:patient.hab_sueno||'',exercise:patient.hab_ejercicio||'',alcohol:patient.hab_alcohol||'',tobacco:patient.hab_tabaco||'',reviewed:{},studies:{},labs:{},cvMode:'pending',eossStatus:'pending'}; }
export function followupEvaluation(patient,record) {
 const next=blankEvaluation(patient);
 for(const key of ['birth','sex','clinician','license','family','personal','allergies','medications','trajectory','previous']) next[key]=record.datos[key]||'';
 return {...next,type:'Seguimiento',previousEvaluation:record.id};
}
export function validate(d,final=false) {
 const errors=[]; if(!d.date||d.date>today()) errors.push('Verifica la fecha de evaluación.');
 if(d.birth&&ageAt(d.birth,d.date)===null) errors.push('Fecha de nacimiento inválida.');
 for(const [k,label,min,max] of measures) if(d[k]!==undefined&&d[k]!==''&&(number(d[k])===null||number(d[k])<min||number(d[k])>max)) errors.push(label+': revisa el valor.');
 if(number(d.sbp)!==null&&number(d.dbp)!==null&&Number(d.dbp)>=Number(d.sbp)) errors.push('La presión diastólica debe ser menor que la sistólica.');
 for(const [k,label] of labFields) if(d.labs?.[k]!==undefined&&d.labs[k]!==''&&(number(d.labs[k])===null||number(d.labs[k])<0)) errors.push(label+': revisa el valor.');
 if(d.cvMode==='recorded'&&(number(d.cvRisk)===null||Number(d.cvRisk)<0||Number(d.cvRisk)>100||!d.cvSource?.trim()||!d.cvVersion?.trim()||!d.cvInputs?.trim()||!d.cvDate)) errors.push('Completa porcentaje, fecha, versión, fuente y datos utilizados en Globorisk.');
 if(d.cvMode==='notApplicable'&&!d.cvReason?.trim()) errors.push('Documenta por qué no aplica el riesgo cardiovascular.');
 for(const [name,study] of Object.entries(d.studies||{})) if(study.status&&study.status!=='No indicado'&&!study.reason?.trim()) errors.push(`Documenta la indicación de ${name}.`);
 if(d.eossStatus==='confirmed'&&(suggestedEoss(d)===null||number(d.eossConfirmed)!==suggestedEoss(d)||!d.eossEvidence?.trim())) errors.push('Completa los tres dominios EOSS, confirma el estadio mayor y documenta su fundamento.');
 if(final) {
 if(ageAt(d.birth,d.date)===null||ageAt(d.birth,d.date)<18) errors.push('Esta evaluación está diseñada para adultos; verifica fecha de nacimiento.');
 if(!d.clinician?.trim()||!d.diagnosis?.trim()||!d.plan?.trim()||!d.followup?.trim()) errors.push('Completa responsable, diagnósticos, plan y seguimiento.');
 if(sections.some(([k])=>!d.reviewed?.[k])) errors.push('Revisa todos los bloques antes de finalizar; documenta lo que quede pendiente.');
 if(d.eossStatus!=='confirmed'&&!d.eossReason?.trim()) errors.push('Indica por qué EOSS está pendiente o no aplica.');
 if((stopBang(d).score===null||d.cvMode==='pending')&&!d.pending?.trim()) errors.push('Documenta las evaluaciones pendientes en el plan del paciente.');
 }
 return errors;
}
export function reportSections(d) {
 const b=bmi(d),s=stopBang(d);
 return [
 ['Resultados y conclusiones', [['Diagnósticos confirmados',d.diagnosis],['Problemas en estudio',d.suspicions]]],
 ['Mediciones', [...measures.map(([k,l])=>[l,d[k]]),['IMC (kg/m²)',b===null?'No disponible':b.toFixed(1)],['Relación cintura / talla',Number(d.waist)>0&&Number(d.height)>0?(d.waist/d.height).toFixed(2):'No disponible']]],
 ['Evaluaciones', [['STOP-Bang',s.score===null?'Incompleto':`${s.score}/8 - Riesgo ${s.risk.toLowerCase()}. Tamizaje; no confirma apnea.`],['Riesgo cardiovascular',d.cvMode==='recorded'?`${d.cvRisk}% a 10 años. ${d.cvVersion}. Resultado registrado por el profesional.`:d.cvMode==='notApplicable'?`No aplica: ${d.cvReason}`:'Pendiente'],['Datos y fecha del cálculo',d.cvMode==='recorded'?`${d.cvDate}; ${d.cvInputs}; fuente: ${d.cvSource}`:''],['EOSS',d.eossStatus==='confirmed'?`Estadio ${d.eossConfirmed}: ${stages[Number(d.eossConfirmed)]}`:`${d.eossStatus==='notApplicable'?'No aplica':'Pendiente'}: ${d.eossReason||'Requiere valoración'}`],['Explicación EOSS para el paciente',d.eossPatient]]],
 ['Laboratorios', [['Fecha de muestra',d.labDate],...labFields.map(([k,l])=>[l,d.labs?.[k]]),['Interpretación',d.labInterpretation]]],
 ['Acuerdos y seguimiento', [['Orientación',d.advice],['Plan',d.plan],['Objetivos acordados',d.agreed],['Seguimiento',d.followup],['Pendientes',d.pending],...Object.entries(d.studies||{}).filter(([,v])=>v.status).map(([k,v])=>[k,`${v.status}. ${v.reason||''}`])]],
 ].map(([title,rows])=>[title,rows.filter(([,v])=>v!==undefined&&v!==null&&v!=='')]);
}
