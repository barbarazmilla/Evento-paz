# Evento Paz

Repositorio de la landing publica del evento y de la documentacion operativa del flujo activo con Mercado Pago.

## Estado del repo

La raiz del repo ya apunta al stack objetivo sin Render:

1. `index.html` captura el lead y pide una preferencia dinamica.
2. `integrations/google-apps-script/Code.gs` es la fuente local del Apps Script activo.
3. El Apps Script crea la preferencia, recibe el webhook directo de Mercado Pago y reconcilia el pago contra Google Sheets.
4. Google Sheets guarda la fila inicial y la actualizacion final por `external_reference`.

No hay build pipeline ni tests automaticos.

## Empezar por aca

1. `docs/ARQUITECTURA-ACTUAL.md`
2. `docs/ESTADO-ACTUAL.md`
3. `docs/GITHUB-PAGES-DEPLOYMENT.md`
4. `docs/APPS-SCRIPT-WEB-APP-DEPLOY.md`
5. `docs/SCRIPT-PROPERTIES-SETUP.md`
6. `docs/GOOGLE-SHEETS-SCHEMA.md`
7. `docs/MERCADOPAGO-WEBHOOK-APPSSCRIPT.md`
8. `docs/GOOGLE-APPS-SCRIPT-EN-ESTE-PROYECTO.md`
9. `docs/OPERACION-Y-VERIFICACION.md`
10. `docs/SECURITY.md`
11. `docs/PAYMENT-HARDENING.md`

## Flujo activo resumido

1. La landing envia `create_lead` al Apps Script.
2. Apps Script valida, escribe en Sheets y crea la preferencia de Mercado Pago.
3. El frontend abre el `init_point` recibido.
4. Mercado Pago notifica directo al Web App de Apps Script.
5. Apps Script consulta la API oficial de Mercado Pago con `MP_ACCESS_TOKEN`.
6. Apps Script actualiza la fila correcta por `external_reference`.

La confirmacion real del pago no depende del navegador.

## Estructura util

- `index.html`: landing principal y unico frontend activo.
- `docs/`: documentacion operativa y de contexto del proyecto.
- `integrations/google-apps-script/`: fuente local del script activo.
- `docs/propuesta-comercial-evento.md`: contexto comercial.

## Verificacion manual

1. Abrir `index.html` con Live Server en el puerto `5501`.
2. Probar modal y formulario.
3. Confirmar que la respuesta del Apps Script devuelva `init_point`.
4. Confirmar que `GET /exec` del Apps Script responda `ok`.
5. Simular o probar el webhook directo contra el mismo Web App.
6. No tratar parametros de retorno del navegador como fuente de verdad.

## Fuente viva de Apps Script

La unica fuente viva del Apps Script en este repo es `integrations/google-apps-script/Code.gs`.

Si se actualiza el script en Google Apps Script, el cambio debe bajarse o replicarse manualmente en ese archivo para evitar drift entre lo desplegado y lo versionado.