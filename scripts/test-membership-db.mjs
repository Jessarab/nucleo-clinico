import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const migration = await readFile(new URL('../migrations/20261124_cancelar_membresia.sql', import.meta.url), 'utf8');
const patient = randomUUID();
const actor = randomUUID();

try {
  // Minimal schema for the existing RPC, using synthetic records.
  await db.exec(`
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${actor}'::uuid $$;
    CREATE FUNCTION public.es_admin_clinico() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
    CREATE TABLE public.pacientes (
      id uuid PRIMARY KEY, plan text, apps_total int, apps_usadas int, fecha_inicio_plan date
    );
    CREATE TABLE public.paquetes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      paciente_id uuid REFERENCES public.pacientes, aplicaciones int, nutricion int, fisioterapia int,
      iniciado timestamptz DEFAULT now(), cerrado timestamptz, fecha_original date, importado boolean DEFAULT false
    );
    CREATE UNIQUE INDEX paquete_activo ON public.paquetes(paciente_id) WHERE cerrado IS NULL;
    CREATE TABLE public.sesiones (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), paciente_id uuid REFERENCES public.pacientes,
      fecha date, num int, peso_kg numeric, cintura_cm numeric, cadera_cm numeric, inbody_realizado boolean,
      inbody_grasa numeric, inbody_musculo numeric, inbody_agua numeric, evento_adverso boolean,
      tipo_ea text, malestar_gi boolean, tipo_gi text, adherencia text, ajuste_dosis text,
      nota_ajuste text, notas text, dosis_mounjaro numeric, inbody_grasa_visceral numeric
    );
    CREATE TABLE public.movimientos_membresia (
      paquete_id uuid REFERENCES public.paquetes, responsable uuid, tipo text,
      detalle jsonb DEFAULT '{}', sesion_id uuid REFERENCES public.sesiones
    );
    CREATE TABLE public.operaciones_membresia (
      id uuid PRIMARY KEY, responsable uuid, paciente_id uuid REFERENCES public.pacientes,
      solicitud jsonb, resultado jsonb
    );
  `);
  await db.exec(migration);
  await db.query('INSERT INTO public.pacientes(id) VALUES ($1)', [patient]);

  async function operate(action, pack = null, request = randomUUID(), data = {}) {
    const { rows } = await db.query('SELECT public.operar_membresia($1,$2,$3,$4,$5) AS result', [
      patient, action, pack, request, JSON.stringify(data),
    ]);
    return rows[0].result;
  }

  const initial = (await operate('renovar')).paquete;
  const before = await operate('sesion', initial.id, randomUUID(), { num: 1, notas: 'Historial ficticio' });
  await operate('fisioterapia', initial.id);
  await assert.rejects(operate('renovar', initial.id), /No se puede renovar con aplicaciones pendientes/);
  await assert.rejects(operate('sin_membresia', randomUUID()), /La membresia cambio/);

  const request = randomUUID();
  const cancelled = await operate('sin_membresia', initial.id, request);
  assert.equal(cancelled.paciente.plan, 'sin_plan');
  assert.equal(cancelled.paciente.apps_total, 0);
  assert.equal(cancelled.paciente.apps_usadas, 0);
  assert.equal(cancelled.paciente.fecha_inicio_plan, null);
  assert.equal(cancelled.paquete, null);
  assert.deepEqual(await operate('sin_membresia', initial.id, request), cancelled);
  await assert.rejects(operate('sin_membresia'), /No hay membresia activa/);

  const { rows: closed } = await db.query('SELECT aplicaciones, cerrado FROM public.paquetes WHERE id=$1', [initial.id]);
  assert.equal(closed[0].aplicaciones, 3);
  assert.ok(closed[0].cerrado);
  const { rows: history } = await db.query('SELECT tipo, responsable, detalle, sesion_id FROM public.movimientos_membresia WHERE paquete_id=$1', [initial.id]);
  assert.deepEqual(history.map(move => move.tipo).sort(), ['alta', 'aplicacion', 'cierre_sin_membresia', 'fisioterapia']);
  assert.equal(history.find(move => move.tipo === 'aplicacion').sesion_id, before.sesion.id);
  const close = history.find(move => move.tipo === 'cierre_sin_membresia');
  assert.equal(close.responsable, actor);
  assert.deepEqual(close.detalle, { aplicaciones_perdidas: 3, nutricion_perdida: 1, fisioterapia_perdida: 0 });

  const { rows: sessions } = await db.query('SELECT id, notas FROM public.sesiones WHERE paciente_id=$1', [patient]);
  assert.deepEqual(sessions, [{ id: before.sesion.id, notas: 'Historial ficticio' }]);
  assert.equal((await operate('sesion', null, randomUUID(), { num: 2 })).paquete, null);
  const next = (await operate('renovar')).paquete;
  assert.notEqual(next.id, initial.id);
  assert.equal(next.aplicaciones, 4);

  // Also cover older packages whose included services have yet to be confirmed.
  await db.query('UPDATE public.paquetes SET aplicaciones=0, nutricion=NULL, fisioterapia=NULL, importado=true WHERE id=$1', [next.id]);
  await operate('sin_membresia', next.id);
  const { rows: legacy } = await db.query("SELECT detalle FROM public.movimientos_membresia WHERE paquete_id=$1 AND tipo='cierre_sin_membresia'", [next.id]);
  assert.deepEqual(legacy[0].detalle, { aplicaciones_perdidas: 0, nutricion_perdida: null, fisioterapia_perdida: null });

  const current = (await operate('renovar')).paquete;
  await db.query('UPDATE public.paquetes SET aplicaciones=0 WHERE id=$1', [current.id]);
  assert.equal((await operate('renovar', current.id)).paquete.aplicaciones, 4);
  const { rows: renewal } = await db.query("SELECT detalle FROM public.movimientos_membresia WHERE paquete_id=$1 AND tipo='cierre_por_renovacion'", [current.id]);
  assert.deepEqual(renewal[0].detalle, { nutricion_perdida: 1, fisioterapia_perdida: 1 });

  await db.exec('CREATE OR REPLACE FUNCTION public.es_admin_clinico() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$');
  await assert.rejects(operate('sin_membresia'), /Acceso no autorizado/);
  console.log('PASS: cancelación, saldo perdido, historial, reintento, nueva membresía, renovación y permisos');
} finally {
  await db.close();
}
