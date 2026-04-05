# Evento Paz

Repositorio de la landing publica del evento y de la documentacion operativa del flujo activo con Mercado Pago.

## Estado del repo

La raiz del repo ya apunta al flujo nuevo:

1. `index.html` captura el lead y pide una preferencia dinamica.
2. `integrations/google-apps-script/Code.gs` es la fuente local del Apps Script activo.
3. `integrations/mercadopago-webhook/server.js` es el webhook server-side que reconcilia pagos.
4. Google Sheets guarda la fila inicial y la actualizacion final por `external_reference`.

No hay build pipeline ni tests automaticos.

## Empezar por aca

1. `docs/ARQUITECTURA-ACTUAL.md`
2. `docs/ESTADO-ACTUAL.md`
3. `docs/GOOGLE-APPS-SCRIPT-EN-ESTE-PROYECTO.md`
4. `docs/OPERACION-Y-VERIFICACION.md`
5. `docs/SECURITY.md`
6. `docs/PAYMENT-HARDENING.md`

## Flujo activo resumido

1. La landing envia `create_lead` al Apps Script.
2. Apps Script valida, escribe en Sheets y crea la preferencia de Mercado Pago.
3. El frontend abre el `init_point` recibido.
4. Mercado Pago notifica al webhook en Render.
5. El webhook consulta la API oficial y manda `update_payment` autenticado a Apps Script.
6. Apps Script actualiza la fila correcta por `external_reference`.

La confirmacion real del pago no depende del navegador.

## Estructura util

- `index.html`: landing principal y unico frontend activo.
- `docs/`: documentacion operativa y de contexto del proyecto.
- `integrations/google-apps-script/`: fuente local del script activo.
- `integrations/mercadopago-webhook/`: webhook server-side.
- `docs/propuesta-comercial-evento.md`: contexto comercial.

## Verificacion manual

1. Abrir `index.html` con Live Server en el puerto `5501`.
2. Probar modal y formulario.
3. Confirmar que la respuesta del Apps Script devuelva `init_point`.
4. Confirmar que el webhook responda en `/health`.
5. No tratar parametros de retorno del navegador como fuente de verdad.

## Fuente viva de Apps Script

La unica fuente viva del Apps Script en este repo es `integrations/google-apps-script/Code.gs`.

Si se actualiza el script en Google Apps Script, el cambio debe bajarse o replicarse manualmente en ese archivo para evitar drift entre lo desplegado y lo versionado.