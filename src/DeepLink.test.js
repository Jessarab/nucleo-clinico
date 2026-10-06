import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import App from './App';
import {resolveQr} from './qr';
jest.mock('./qr',()=>({resolveQr:jest.fn()}));
jest.mock('./Membership',()=>({__esModule:true,default:({patient})=><div>Tarjeta de {patient.nombre}</div>,MembershipLookup:()=>null}));
jest.mock('./authClient',()=>({SUPABASE_URL:'https://example.test',SUPABASE_KEY:'test',supabase:{auth:{
 onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}}),
 signInWithPassword:async()=>({error:null}),
 getSession:async()=>({data:{session:{access_token:'test'}}})
},rpc:async()=>({data:true,error:null})}}));
test.each(['?', '#'])('QR target %s waits for login then opens membership tab and clears link',async(prefix)=>{
 jest.clearAllMocks();
 window.history.replaceState(null,'','/'+prefix+'membresia=12345678-1234-4234-8234-123456789abc');
 global.fetch=jest.fn().mockResolvedValue({ok:true,text:async()=>'[]'});
 resolveQr.mockResolvedValue({id:'fake-patient',nombre:'Paciente ficticio',plan:'plus',apps_usadas:0,apps_total:4});
 const {container}=render(<App/>);
 expect(resolveQr).not.toHaveBeenCalled();
 fireEvent.change(container.querySelector('input[type=email]'),{target:{value:'test@example.test'}});
 fireEvent.change(container.querySelector('input[type=password]'),{target:{value:'test-password'}});
 fireEvent.click(screen.getByRole('button',{name:'Entrar'}));
 expect(await screen.findByText('Tarjeta de Paciente ficticio')).toBeInTheDocument();
 await waitFor(()=>expect(window.location.hash + window.location.search).toBe(''));
 expect(resolveQr).toHaveBeenCalledTimes(1);
});
