import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { supabase } from './authClient';
jest.mock('./authClient', () => ({
 supabase: { auth: {
 signInWithPassword: jest.fn(), signOut: jest.fn().mockResolvedValue({}),
 onAuthStateChange: () => ({data:{subscription:{unsubscribe:()=>{}}}})
 }, rpc: jest.fn() }
}));
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn(); });
function enter(container) {
 fireEvent.change(container.querySelector('input[type=email]'), {target:{value:'admin@example.test'}});
 fireEvent.change(container.querySelector('input[type=password]'), {target:{value:'test-password'}});
 fireEvent.click(screen.getByRole('button', {name:'Entrar'}));
}
test('incorrect credentials never load patients', async () => {
 supabase.auth.signInWithPassword.mockResolvedValue({error:new Error('invalid')});
 const {container} = render(<App />); enter(container);
 await screen.findByRole('alert');
 expect(global.fetch).not.toHaveBeenCalled();
 expect(supabase.rpc).not.toHaveBeenCalled();
});
test('valid account without authorization cannot access patients', async () => {
 supabase.auth.signInWithPassword.mockResolvedValue({error:null});
 supabase.rpc.mockResolvedValue({data:false,error:null});
 const {container} = render(<App />); enter(container);
 await screen.findByRole('alert');
 expect(supabase.auth.signOut).toHaveBeenCalled();
 expect(global.fetch).not.toHaveBeenCalled();
});
