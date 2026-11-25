CREATE OR REPLACE FUNCTION public.operar_membresia(p_paciente uuid, p_accion text, p_paquete uuid, p_peticion uuid, p_datos jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 pac public.pacientes%ROWTYPE;
 pack public.paquetes%ROWTYPE;
 ses public.sesiones%ROWTYPE;
 op public.operaciones_membresia%ROWTYPE;
 solicitud jsonb;
 resultado jsonb;
 servicio text;
 saldo integer;
BEGIN
 IF NOT public.es_admin_clinico() THEN RAISE EXCEPTION 'Acceso no autorizado'; END IF;
 IF p_peticion IS NULL OR p_datos IS NULL THEN RAISE EXCEPTION 'Peticion invalida'; END IF;
 SELECT * INTO pac FROM public.pacientes WHERE id=p_paciente FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Paciente no encontrado'; END IF;
 solicitud:=jsonb_build_object('accion',p_accion,'paquete',p_paquete,'datos',p_datos);
 SELECT * INTO op FROM public.operaciones_membresia WHERE id=p_peticion;
 IF FOUND THEN
   IF op.paciente_id<>p_paciente OR op.responsable<>auth.uid() OR op.solicitud<>solicitud THEN
     RAISE EXCEPTION 'Identificador de peticion reutilizado con otros datos';
   END IF;
   RETURN op.resultado;
 END IF;
 SELECT * INTO pack FROM public.paquetes WHERE paciente_id=p_paciente AND cerrado IS NULL FOR UPDATE;
 IF pack.id IS DISTINCT FROM p_paquete THEN RAISE EXCEPTION 'La membresia cambio. Actualiza antes de continuar.'; END IF;

 IF p_accion='renovar' THEN
   IF pack.id IS NOT NULL THEN
     IF pack.aplicaciones<>0 THEN RAISE EXCEPTION 'No se puede renovar con aplicaciones pendientes'; END IF;
     UPDATE public.paquetes SET cerrado=now() WHERE id=pack.id;
     INSERT INTO public.movimientos_membresia(paquete_id,responsable,tipo,detalle)
       VALUES(pack.id,auth.uid(),'cierre_por_renovacion',jsonb_build_object('nutricion_perdida',pack.nutricion,'fisioterapia_perdida',pack.fisioterapia));
   END IF;
   INSERT INTO public.paquetes(paciente_id,aplicaciones,nutricion,fisioterapia)
     VALUES(p_paciente,4,1,1) RETURNING * INTO pack;
   INSERT INTO public.movimientos_membresia(paquete_id,responsable,tipo) VALUES(pack.id,auth.uid(),'alta');
 ELSIF p_accion='sin_membresia' THEN
   IF pack.id IS NULL THEN RAISE EXCEPTION 'No hay membresia activa'; END IF;
   UPDATE public.paquetes SET cerrado=now() WHERE id=pack.id;
   INSERT INTO public.movimientos_membresia(paquete_id,responsable,tipo,detalle)
     VALUES(pack.id,auth.uid(),'cierre_sin_membresia',jsonb_build_object(
       'aplicaciones_perdidas',pack.aplicaciones,
       'nutricion_perdida',pack.nutricion,
       'fisioterapia_perdida',pack.fisioterapia));
   UPDATE public.pacientes SET plan='sin_plan',apps_total=0,apps_usadas=0,fecha_inicio_plan=NULL WHERE id=p_paciente RETURNING * INTO pac;
   pack:=NULL;
 ELSIF p_accion='confirmar_incluidos' THEN
   IF pack.id IS NULL OR NOT pack.importado OR pack.nutricion IS NOT NULL OR pack.fisioterapia IS NOT NULL THEN
     RAISE EXCEPTION 'Los servicios ya fueron confirmados o no requieren revision';
   END IF;
   IF NOT (p_datos ? 'nutricion' AND p_datos ? 'fisioterapia') OR
      (p_datos->>'nutricion') NOT IN ('0','1') OR (p_datos->>'fisioterapia') NOT IN ('0','1') OR
      p_datos->>'nutricion' IS NULL OR p_datos->>'fisioterapia' IS NULL THEN RAISE EXCEPTION 'Indica 0 o 1 por servicio'; END IF;
   UPDATE public.paquetes SET nutricion=(p_datos->>'nutricion')::integer,fisioterapia=(p_datos->>'fisioterapia')::integer
     WHERE id=pack.id RETURNING * INTO pack;
   INSERT INTO public.movimientos_membresia(paquete_id,responsable,tipo,detalle) VALUES(pack.id,auth.uid(),p_accion,p_datos);
 ELSIF p_accion IN ('nutricion','fisioterapia') THEN
   IF pack.id IS NULL THEN RAISE EXCEPTION 'No hay membresia activa'; END IF;
   saldo:=CASE WHEN p_accion='nutricion' THEN pack.nutricion ELSE pack.fisioterapia END;
   IF saldo IS NULL THEN RAISE EXCEPTION 'Confirma primero los servicios de esta membresia anterior'; END IF;
   IF saldo=0 THEN RAISE EXCEPTION 'Este servicio ya fue utilizado'; END IF;
   UPDATE public.paquetes SET nutricion=CASE WHEN p_accion='nutricion' THEN 0 ELSE nutricion END,
     fisioterapia=CASE WHEN p_accion='fisioterapia' THEN 0 ELSE fisioterapia END WHERE id=pack.id RETURNING * INTO pack;
   INSERT INTO public.movimientos_membresia(paquete_id,responsable,tipo) VALUES(pack.id,auth.uid(),p_accion);
 ELSIF p_accion='sesion' THEN
   IF pack.id IS NOT NULL AND pack.aplicaciones=0 THEN RAISE EXCEPTION 'Renueva la membresia antes de registrar otra aplicacion'; END IF;
   ses:=jsonb_populate_record(NULL::public.sesiones,p_datos);
   IF ses.num IS NULL OR ses.num<1 THEN RAISE EXCEPTION 'Numero de sesion invalido'; END IF;
   IF EXISTS(SELECT 1 FROM public.sesiones WHERE paciente_id=p_paciente AND num=ses.num) THEN
     RAISE EXCEPTION 'Esta sesion ya fue registrada. Actualiza el expediente.';
   END IF;
   INSERT INTO public.sesiones(paciente_id,fecha,num,peso_kg,cintura_cm,cadera_cm,inbody_realizado,inbody_grasa,inbody_musculo,
     inbody_agua,evento_adverso,tipo_ea,malestar_gi,tipo_gi,adherencia,ajuste_dosis,nota_ajuste,notas,dosis_mounjaro,inbody_grasa_visceral)
     VALUES(p_paciente,ses.fecha,ses.num,ses.peso_kg,ses.cintura_cm,ses.cadera_cm,ses.inbody_realizado,ses.inbody_grasa,ses.inbody_musculo,
     ses.inbody_agua,ses.evento_adverso,ses.tipo_ea,ses.malestar_gi,ses.tipo_gi,ses.adherencia,ses.ajuste_dosis,ses.nota_ajuste,ses.notas,ses.dosis_mounjaro,ses.inbody_grasa_visceral)
     RETURNING * INTO ses;
   IF pack.id IS NOT NULL THEN
     UPDATE public.paquetes SET aplicaciones=aplicaciones-1 WHERE id=pack.id RETURNING * INTO pack;
     INSERT INTO public.movimientos_membresia(paquete_id,responsable,tipo,sesion_id) VALUES(pack.id,auth.uid(),'aplicacion',ses.id);
   END IF;
 ELSE RAISE EXCEPTION 'Operacion desconocida';
 END IF;
 IF pack.id IS NOT NULL THEN
   UPDATE public.pacientes SET plan='plus',apps_total=4,apps_usadas=4-pack.aplicaciones,
     fecha_inicio_plan=coalesce(pack.fecha_original,pack.iniciado::date) WHERE id=p_paciente RETURNING * INTO pac;
 END IF;
 resultado:=jsonb_build_object('paciente',to_jsonb(pac),'paquete',CASE WHEN pack.id IS NULL THEN NULL ELSE to_jsonb(pack) END,
   'sesion',CASE WHEN ses.id IS NULL THEN NULL ELSE to_jsonb(ses) END);
 INSERT INTO public.operaciones_membresia VALUES(p_peticion,auth.uid(),p_paciente,solicitud,resultado);
 RETURN resultado;
END $function$;
