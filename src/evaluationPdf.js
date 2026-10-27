import { jsPDF } from 'jspdf';
import { reportSections } from './evaluationModel';

export function buildReport(record) {
 const d=record.datos,doc=new jsPDF({unit:'mm',format:'a4'});let y=38;
 const header=()=>{doc.setFillColor(15,94,97);doc.rect(0,0,210,26,'F');doc.setTextColor(255);doc.setFontSize(19);doc.text('NÚCLEO',18,13);doc.setFontSize(9);doc.text('Centrados en ti · Evaluación integral',18,20);doc.setTextColor(38,53,54);};
 const page=()=>{doc.addPage();header();y=38;};
 const text=(value,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(String(value).replace(/[\u2010-\u2015]/g,'-'),174);for(const line of lines){if(y>274)page();doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(38,53,54);doc.text(line,18,y);y+=size*.48;}y+=3;};
 header();text(`Reporte de evaluación ${d.type.toLowerCase()}`,17,true);text(d.patientName||'Paciente',12,true);text(`Fecha: ${d.date} | Versión ${record.revision} | ${record.status==='final'?'FINALIZADA':'PRELIMINAR'}`);text(`Profesional: ${d.clinician||'Pendiente'} | Cédula: ${d.license||'No registrada'}`);
 if(record.status!=='final')text('Evaluación en proceso. Los resultados pendientes requieren revisión profesional.',10,true);
 for(const [title,rows] of reportSections(d)){if(y>245)page();y+=4;text(title,13,true);if(!rows.length)text('Sin resultados registrados.');for(const [label,value]of rows){if(y>255)page();if(String(value).length<65){text(`${label}: ${value}`);}else{text(label,10,true);text(value);}}}
 const count=doc.getNumberOfPages();for(let i=1;i<=count;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(85);doc.text(`Documento confidencial | ${d.date} | v${record.revision} | ${i} / ${count}`,18,289);}
 doc.setProperties({title:'Núcleo - Reporte de evaluación',author:d.clinician||'Núcleo',subject:`Evaluación ${record.id}`});return doc;
}
export function downloadReport(record){buildReport(record).save(`Nucleo-evaluacion-${record.datos.date}-v${record.revision}.pdf`);}
