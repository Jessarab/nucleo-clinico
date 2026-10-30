import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import Evaluations from './Evaluations';
jest.mock('./authClient',()=>({supabase:{}}));
beforeEach(()=>{Object.defineProperty(global,'crypto',{value:{randomUUID:()=>String(Math.random())},configurable:true});});
test('new draft, save, and report are independent of memberships',async()=>{
 const repository={list:jest.fn().mockResolvedValue([]),save:jest.fn(async row=>({...row,created_at:'2026-10-23T12:00:00Z'}))};
 render(<Evaluations patient={{id:'p1',nombre:'Paciente ficticio'}} repository={repository}/>);
 await waitFor(()=>expect(screen.getByText('Nueva evaluación')).not.toBeDisabled());fireEvent.click(screen.getByText('Nueva evaluación'));
 expect(screen.getByText('Descargar PDF')).toBeDisabled();
 fireEvent.click(screen.getByText('Guardar borrador'));
 await screen.findByText('Versión guardada.');expect(repository.save).toHaveBeenCalledTimes(1);
 expect(repository.save.mock.calls[0][0]).toMatchObject({paciente_id:'p1',revision:1,status:'draft'});
 fireEvent.click(screen.getByText('Vista previa del reporte'));expect(screen.getByText('PRELIMINAR - Evaluación en proceso')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Profesional responsable'),{target:{value:'Dra. Prueba'}});expect(screen.getByText('Descargar PDF')).toBeDisabled();
});
test('missing migration is visible, no fallback writes',async()=>{const repository={list:jest.fn().mockRejectedValue({code:'42P01'}),save:jest.fn()};render(<Evaluations patient={{id:'p2'}} repository={repository}/>);expect(await screen.findByRole('alert')).toHaveTextContent('Falta activar');expect(repository.save).not.toHaveBeenCalled();});
test('uncertain network save retries the same immutable request',async()=>{
 const repository={list:jest.fn().mockResolvedValue([]),save:jest.fn().mockRejectedValueOnce(new Error('Conexión interrumpida')).mockImplementation(async row=>row)};
 render(<Evaluations patient={{id:'p3',nombre:'Prueba'}} repository={repository}/>);
 await waitFor(()=>expect(screen.getByText('Nueva evaluación')).not.toBeDisabled());fireEvent.click(screen.getByText('Nueva evaluación'));
 fireEvent.click(screen.getByText('Guardar borrador'));await screen.findByRole('alert');
 expect(screen.getByLabelText('Profesional responsable')).toBeDisabled();
 fireEvent.click(screen.getByText('Guardar borrador'));await screen.findByText('Versión guardada.');
 expect(repository.save.mock.calls[1][0]).toEqual(repository.save.mock.calls[0][0]);
});

test('brief form reveals only selected studies and preserves choices when saved',async()=>{
 const repository={list:jest.fn().mockResolvedValue([]),save:jest.fn(async row=>row)};
 render(<Evaluations patient={{id:'quick',nombre:'Prueba'}} repository={repository}/>);
 await waitFor(()=>expect(screen.getByText('Nueva evaluación')).not.toBeDisabled());fireEvent.click(screen.getByText('Nueva evaluación'));
 expect(screen.queryByLabelText('Indicación / resultado: Estudio de sueño')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Agregar estudio o referencia'),{target:{value:'Estudio de sueño'}});
 fireEvent.change(screen.getByLabelText('Indicación / resultado: Estudio de sueño'),{target:{value:'Indicación de prueba'}});
 fireEvent.click(screen.getByLabelText('Acepta abordarlo hoy'));
 fireEvent.click(screen.getByText('Guardar borrador'));await screen.findByText('Versión guardada.');
 expect(repository.save.mock.calls[0][0].datos).toMatchObject({captureVersion:2,permission:'Acepta abordarlo hoy',studies:{'Estudio de sueño':{status:'Indicado',reason:'Indicación de prueba'}}});
});
