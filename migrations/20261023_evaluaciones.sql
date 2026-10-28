-- Ejecutar primero en pruebas. No modifica pacientes, sesiones, laboratorios o membresías.
BEGIN;
DO $$ BEGIN
 IF to_regprocedure('public.es_admin_clinico()') IS NULL THEN
  RAISE EXCEPTION 'Verificar permisos actuales: falta es_admin_clinico(). No se amplía acceso automáticamente.';
 END IF;
END $$;
CREATE TABLE public.evaluaciones_clinicas (
 id uuid PRIMARY KEY,
 paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
 evaluation_id uuid NOT NULL,
 revision integer NOT NULL CHECK(revision>0),
 status text NOT NULL CHECK(status IN ('draft','final')),
 datos jsonb NOT NULL CHECK(jsonb_typeof(datos)='object' AND COALESCE(datos->>'protocol','')='nucleo-adultos-v1'),
 report_version integer NOT NULL DEFAULT 1 CHECK(report_version=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
 UNIQUE(evaluation_id,revision)
);
CREATE INDEX evaluaciones_paciente_fecha ON public.evaluaciones_clinicas(paciente_id,created_at DESC);
ALTER TABLE public.evaluaciones_clinicas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.evaluaciones_clinicas FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.evaluaciones_clinicas TO authenticated;
CREATE POLICY lectura_clinica ON public.evaluaciones_clinicas FOR SELECT TO authenticated
 USING ((SELECT public.es_admin_clinico()) AND EXISTS(SELECT 1 FROM public.pacientes p WHERE p.id=paciente_id));
CREATE POLICY escritura_clinica ON public.evaluaciones_clinicas FOR INSERT TO authenticated
 WITH CHECK ((SELECT public.es_admin_clinico()) AND created_by=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.pacientes p WHERE p.id=paciente_id));
CREATE FUNCTION public.validar_revision_evaluacion() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE previous public.evaluaciones_clinicas;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.evaluation_id::text,0));
 SELECT * INTO previous FROM public.evaluaciones_clinicas WHERE evaluation_id=NEW.evaluation_id ORDER BY revision DESC LIMIT 1;
 IF FOUND THEN
  IF previous.paciente_id<>NEW.paciente_id OR NEW.revision<>previous.revision+1 THEN
   RAISE EXCEPTION 'Conflicto de versión: recarga la evaluación' USING ERRCODE='23505';
  END IF;
 ELSIF NEW.revision<>1 THEN RAISE EXCEPTION 'La primera versión debe ser 1';
 END IF;
 NEW.created_at=now(); NEW.created_by=auth.uid();
 RETURN NEW;
END $$;
CREATE TRIGGER validar_revision BEFORE INSERT ON public.evaluaciones_clinicas FOR EACH ROW EXECUTE FUNCTION public.validar_revision_evaluacion();
COMMIT;
