import { fireEvent, render, screen } from '@testing-library/react';
import { randomUUID } from 'crypto';
import Membership from './Membership';
import { supabase } from './authClient';

jest.mock('./authClient', () => ({ supabase: { from: jest.fn(), rpc: jest.fn() } }));
jest.mock('./QrScanner', () => () => null);
jest.mock('./PatientCard', () => ({ SharePatientCard: () => null }));

const patient = { id: 'patient-1', nombre: 'Paciente ficticio' };
const pack = {
  id: 'pack-1', iniciado: '2026-11-01', qr: '12345678-1234-4234-8234-123456789abc', aplicaciones: 3,
  nutricion: 1, fisioterapia: null,
};

function mockHistory(packages, movements) {
  supabase.from.mockImplementation(table => ({
    select: () => table === 'paquetes'
      ? { eq: () => ({ order: packages }) }
      : { in: () => ({ order: movements }) },
  }));
}

beforeEach(() => {
  jest.resetAllMocks();
  global.crypto = { randomUUID };
});
afterEach(() => {
  delete global.crypto;
  jest.restoreAllMocks();
});

test('ofrece cancelar con saldo, muestra los beneficios y respeta que se rechace la confirmación', async () => {
  mockHistory(jest.fn().mockResolvedValue({ data: [pack] }), jest.fn().mockResolvedValue({ data: [] }));
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
  render(<Membership patient={patient} onUpdate={jest.fn()} />);

  const cancel = await screen.findByRole('button', { name: 'Pasar a sin membresía' });
  expect(cancel).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Renovar membresía' })).toBeDisabled();
  fireEvent.click(cancel);

  expect(confirm).toHaveBeenCalledWith(expect.stringContaining(
    'Aplicaciones pendientes: 3 de 4\nNutrición pendiente: 1\nFisioterapia pendiente: por confirmar',
  ));
  expect(supabase.rpc).not.toHaveBeenCalled();
});

test('envía la cancelación y muestra el saldo registrado por el servidor en el historial', async () => {
  const packages = jest.fn()
    .mockResolvedValueOnce({ data: [pack] })
    .mockResolvedValueOnce({ data: [{ ...pack, cerrado: '2026-11-02' }] });
  const movements = jest.fn()
    .mockResolvedValueOnce({ data: [] })
    .mockResolvedValueOnce({ data: [{
      id: 'move-1', paquete_id: pack.id, tipo: 'cierre_sin_membresia', fecha: '2026-11-02',
      detalle: { aplicaciones_perdidas: 3, nutricion_perdida: 1, fisioterapia_perdida: null },
    }] });
  mockHistory(packages, movements);
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  const updatedPatient = { ...patient, plan: 'individual' };
  supabase.rpc.mockResolvedValue({ data: { paciente: updatedPatient } });
  const onUpdate = jest.fn();
  render(<Membership patient={patient} onUpdate={onUpdate} />);

  fireEvent.click(await screen.findByRole('button', { name: 'Pasar a sin membresía' }));

  expect(await screen.findByText(/Servicios no utilizados: aplicaciones 3, nutrición 1, fisioterapia sin confirmar/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Crear membresía' })).toBeEnabled();
  expect(supabase.rpc).toHaveBeenCalledTimes(1);
  expect(supabase.rpc).toHaveBeenCalledWith('operar_membresia', {
    p_paciente: patient.id, p_accion: 'sin_membresia', p_paquete: pack.id,
    p_peticion: expect.any(String), p_datos: {},
  });
  expect(onUpdate).toHaveBeenCalledWith(updatedPatient);
});
