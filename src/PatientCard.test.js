import {render,screen,waitFor,fireEvent} from '@testing-library/react';
import PatientCard from './PatientCard';
import {supabase} from './authClient';
jest.mock('./authClient',()=>({supabase:{rpc:jest.fn()}}));
jest.mock('qrcode.react',()=>({QRCodeSVG:()=> <div>QR del personal</div>}));
beforeEach(()=>jest.clearAllMocks());
test('public card only uses the limited RPC and displays balances without login',async()=>{
 supabase.rpc.mockResolvedValue({data:{nombre:'Ana',aplicaciones:2,nutricion:null,fisioterapia:1,qr:'11111111-1111-4111-8111-111111111111'}});
 render(<PatientCard token={'a'.repeat(64)}/>);
 expect(await screen.findByText('Hola, Ana')).toBeInTheDocument();
 expect(screen.getByText('por confirmar')).toBeInTheDocument();
 expect(supabase.rpc).toHaveBeenCalledWith('consultar_tarjeta',{p_token:'a'.repeat(64)});
 expect(screen.queryByText('Registrar nutrición')).not.toBeInTheDocument();
 supabase.rpc.mockResolvedValue({data:null});
 fireEvent.click(screen.getByText('Actualizar saldos'));
 await waitFor(()=>expect(screen.queryByText('Hola, Ana')).not.toBeInTheDocument());
 expect(await screen.findByRole('alert')).toHaveTextContent('no está disponible');
});
test('invalid link makes no request',async()=>{
 render(<PatientCard token="invalid"/>);
 expect(await screen.findByRole('alert')).toBeInTheDocument();
 expect(supabase.rpc).not.toHaveBeenCalled();
});
