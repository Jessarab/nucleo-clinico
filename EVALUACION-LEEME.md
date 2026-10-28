# Evaluación integral de Núcleo

Implementación basada en main db7f997 (23 de octubre de 2026). No aplicada todavía a Supabase ni a producción.

## Incluye
- Pestaña Evaluaciones, borradores y revisiones inmutables; no consume membresías.
- Historia, 5As, antropometría/InBody, laboratorios reutilizables, estudios con indicación, plan y seguimiento.
- STOP-Bang general: >35 kg/m², >50 años, >40 cm, reglas adicionales de alto riesgo; desconocido permanece incompleto.
- EOSS por tres dominios, máximo, confirmación y fundamento profesional. No diagnostica automáticamente.
- PDF descargable y vista previa de una versión guardada; las notas internas quedan excluidas.
- Demostración aislada con datos ficticios, activada solo mediante REACT_APP_EVAL_DEMO=true durante la compilación. Nunca configurar esa variable en producción.

## Límites explícitos
- Globorisk: captura del resultado verificado en la herramienta oficial, país/modalidad, versión, datos y fecha. No implementa todavía sus ecuaciones. No se envían datos al abrir el enlace.
- InBody: captura manual y referencia documental; no incluye conexión al equipo ni carga de archivos.
- Estudios: selección médica por áreas; no motor automático de recomendaciones ni FIB-4/TFGe automáticos.
- El PDF se descarga; no se envía automáticamente a pacientes.
- Historial previo se conserva como texto. No se interpreta automáticamente como diagnósticos ni se inventa fecha de nacimiento a partir de edad.
- Alcance adulto. Antes de uso asistencial, revisar criterios y operatividad con el responsable clínico.

## Instalación
1. Respaldar y verificar proyecto Supabase objetivo. Ejecutar migrations/20261023_evaluaciones.sql primero en entorno de pruebas. Requiere pacientes y es_admin_clinico() del sistema actual. Mantiene el acceso administrativo existente sin ampliar roles; no edita tablas existentes.
2. Ejecutar pnpm install --frozen-lockfile --ignore-scripts y pnpm build. Vercel ya utiliza pnpm.
3. Probar inicio de sesión con usuario autorizado, crear un paciente ficticio, guardar/reabrir versiones, finalizar y descargar PDF. Verificar denegación con usuario no autorizado.
4. Aplicar migración en producción y desplegar desde una rama revisada. Para volver a la versión anterior, revertir el despliegue; conservar la tabla nueva, sin borrar evaluaciones.

## Verificación local
- Pruebas: pnpm test --watchAll=false --runInBand --testMatch '**/src/**/*.test.js' --cacheDirectory .test-cache
- Datos/permisos: node scripts/test-evaluation-db.mjs (PostgreSQL local PGlite, datos ficticios).
- Ejemplo PDF: node scripts/sample-report.cjs; output/pdf/Nucleo-reporte-ejemplo.pdf.
- El borrador requiere guardado explícito; se avisa al salir con cambios. El PDF se deshabilita con cambios sin guardar.

## Fuentes de criterios
- https://www.stopbang.ca/publication/pdf/pubchest1.pdf
- https://www.ottawahospital.on.ca/en/documents/2017/05/edmonton-obesity-staging-system-staging-tool.pdf
- https://hsph.harvard.edu/research/globorisk-lab/

El esquema registra autor, hora, versión del protocolo y formato del reporte. Las versiones no admiten UPDATE ni DELETE por usuarios de aplicación. Un conflicto concurrente exige recargar y revisar antes de continuar.
