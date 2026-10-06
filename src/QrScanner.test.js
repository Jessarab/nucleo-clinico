import {render,screen,waitFor} from '@testing-library/react';
import QrScanner from './QrScanner';
import {BrowserQRCodeReader} from '@zxing/browser';
jest.mock('@zxing/browser',()=>({BrowserQRCodeReader:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});});
test('unmount releases camera tracks and decoder',async()=>{
 const stopTrack=jest.fn(),stop=jest.fn();
 Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:jest.fn().mockResolvedValue({getTracks:()=>[{stop:stopTrack}]})},configurable:true});
 BrowserQRCodeReader.mockImplementation(()=>({decodeFromStream:jest.fn().mockResolvedValue({stop})}));
 const {unmount}=render(<QrScanner onRead={jest.fn()} onClose={jest.fn()}/>);
 await screen.findByText(/Apunta la cámara/);unmount();
 expect(stopTrack).toHaveBeenCalled();expect(stop).toHaveBeenCalled();
});
test('permission denial offers manual alternative',async()=>{
 Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:jest.fn().mockRejectedValue({name:'NotAllowedError'})},configurable:true});
 render(<QrScanner onRead={jest.fn()} onClose={jest.fn()}/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Permite el acceso');
});
test('permission arriving after close releases stream without decoding',async()=>{
 let grant; const stop=jest.fn(),decode=jest.fn();
 Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:jest.fn(()=>new Promise(r=>{grant=r;}))},configurable:true});
 BrowserQRCodeReader.mockImplementation(()=>({decodeFromStream:decode}));
 const {unmount}=render(<QrScanner onRead={jest.fn()} onClose={jest.fn()}/>);
 await waitFor(()=>expect(grant).toBeDefined());unmount();
 grant({getTracks:()=>[{stop}]});await waitFor(()=>expect(stop).toHaveBeenCalled());
 expect(decode).not.toHaveBeenCalled();
});
