import { useEffect, useRef, useState } from 'react';
export default function QrScanner({ onRead, onClose }) {
  const video = useRef(null);
  const callback = useRef(onRead);
  callback.current = onRead;
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false, received = false, stream, controls;
    const stop = () => { controls?.stop(); stream?.getTracks().forEach(t => t.stop()); };
    async function start() {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled) { stop(); return; }
        controls = await new BrowserQRCodeReader().decodeFromStream(stream, video.current, (result, err, activeControls) => {
          if (result && !cancelled && !received) {
            received = true; activeControls.stop(); stop(); callback.current(result.getText());
          }
        });
        if (cancelled || received) stop(); else setReady(true);
      } catch (e) {
        stop();
        if (!cancelled) setError(e.name === 'NotAllowedError' ? 'Permite el acceso a la cámara en tu navegador o pega el código de la tarjeta.' : 'No se pudo abrir la cámara. Comprueba que esté disponible o pega el código de la tarjeta.');
      }
    }
    start();
    return () => { cancelled = true; stop(); };
  }, []);
  return <section aria-label="Escáner de membresías">
    <p>{ready ? 'Apunta la cámara al QR. No se descontará ningún servicio.' : 'Preparando cámara…'}</p>
    <video ref={video} muted playsInline autoPlay style={{ width: '100%', maxWidth: 480, background: '#000' }} />
    {error && <p role="alert">{error}</p>}
    <button type="button" onClick={onClose}>Cerrar cámara</button>
  </section>;
}
