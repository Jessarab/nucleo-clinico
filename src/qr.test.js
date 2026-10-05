import { parseQr, cardUrl, resolveQr } from './qr';
import { supabase } from './authClient';
jest.mock('./authClient',()=>({supabase:{from:jest.fn()}}));
const token='12345678-1234-4234-8234-123456789abc';
test('new links and legacy codes resolve to the same identifier',()=>{
 expect(parseQr(cardUrl(token))).toBe(token);
 expect(parseQr('nucleo:'+token)).toBe(token);
 expect(parseQr(token)).toBe(token);
 expect(parseQr(window.location.origin+'/#membresia='+token)).toBe(token);
 expect(cardUrl(token)).toBe(window.location.origin+'/?membresia='+token);
});
test('foreign links and invalid payloads cannot navigate or query records',async()=>{
 expect(()=>parseQr('https://example.org/#membresia='+token)).toThrow();
 expect(()=>parseQr('javascript:alert(1)')).toThrow();
 await expect(resolveQr('invalid')).rejects.toThrow();
 expect(supabase.from).not.toHaveBeenCalled();
});
test('closed package stops before patient query',async()=>{
 const query={select:jest.fn(),eq:jest.fn(),maybeSingle:jest.fn().mockResolvedValue({data:{cerrado:'2026-01-01',paciente_id:'x'}})};
 query.select.mockReturnValue(query);query.eq.mockReturnValue(query);supabase.from.mockReturnValue(query);
 await expect(resolveQr(token)).rejects.toThrow('paquete anterior');
 expect(supabase.from).toHaveBeenCalledTimes(1);
 expect(supabase.from).toHaveBeenCalledWith('paquetes');
});
