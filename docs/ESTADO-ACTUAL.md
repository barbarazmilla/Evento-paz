# Estado Actual

Fecha de referencia: 2026-04-05.

## Flujo activo del repo

- Frontend activo: `index.html`
- Apps Script activo en uso: `Paz Cornu Migracion Segura`
- Aplicacion de Mercado Pago de referencia: `Wine Experience by Paz Cornu` (`1666276256354487`)
- Lead endpoint activo esperado: `https://script.google.com/macros/s/AKfycby7eoXE2YO7sBcpAdhPy4b1BAC7JGbFQYEMJ0B55OlHnhHbgh9S8vfmpb5kU_ltciD52A/exec`
- Webhook directo esperado: la misma Web App configurada en `MP_NOTIFICATION_URL`, con `source_news=webhooks` y `webhook_secret` agregados por `Code.gs`
- Healthcheck operativo: `GET /exec` del mismo Apps Script

## Estado validado

Ya fue validado:

1. `doGet` del Apps Script responde salud del servicio.
2. `create_lead` responde `ok`, `lead_id`, `external_reference`, `preference_id` e `init_point`.
3. El checkout dinamico abre correctamente desde la respuesta del Apps Script.
4. El repo ya contiene la logica para recibir el webhook directo en Apps Script y consultar la API oficial.
5. La escritura inicial del lead en Google Sheets funciona.

## Hallazgos actuales de la prueba sandbox

1. El flujo `create_lead -> preferencia dinamica -> apertura de checkout` esta funcionando.
2. El comprador de prueba puede iniciar sesion en Mercado Pago y avanzar hasta la instancia de pago.
3. El sintoma reproducido en la prueba con tarjeta es la pantalla naranja de Mercado Pago con `Algo salio mal. No pudimos procesar tu pago`.
4. Ya existen filas con `payment_id` y estados como `pending_waiting`, `deferred_retry` y `by_payer`, lo que demuestra movimiento parcial del tramo `Mercado Pago -> webhook -> Sheets`, pero no certifica una aprobacion.
5. El diagnostico de notificaciones de Mercado Pago reporto al menos una entrega fallida con `HTTP 502` contra el Apps Script.
6. Una evaluacion MCP sobre el pago `152601255925` devolvio `Payment was not originated from app`, lo que obliga a revisar mezcla de contexto, historial de credenciales o pagos viejos fuera de la app actual.
7. El panel actual de `Credenciales de prueba` de Mercado Pago puede mostrar Access Token sandbox con prefijo `APP_USR-`; el prefijo ya no debe usarse como unica senal para decidir si se esta en sandbox o produccion.

## Hipotesis operativas abiertas

1. `createMercadoPagoPreference_` hoy envia `payer.email` con el email escrito en el formulario; si no coincide con la identidad del comprador de prueba autenticado, el pago con tarjeta puede fallar en checkout.
2. `doPost()` rutea webhooks fuera del `try/catch`, por lo que un error dentro de `handleMercadoPagoWebhook_` puede terminar como `502`.
3. La preferencia actual no envia `payer.first_name`, `payer.last_name`, `statement_descriptor`, `items.category_id` ni `binary_mode`, campos que ayudan a trazabilidad y aprobacion.

## Estado aun no certificado de punta a punta

Todavia falta certificar con una compra real o sandbox funcional controlada:

1. recepcion del webhook real o simulado de Mercado Pago contra el Apps Script desplegado,
2. consulta del pago oficial desde el Apps Script desplegado,
3. actualizacion final de la fila correcta por `external_reference`.

## Decisiones ya aplicadas en el repo

1. La raiz del repo apunta al stack GitHub Pages + Apps Script + Google Sheets.
2. El material legacy que ya no participa del flujo actual fue retirado del recorrido principal.
3. La unica fuente viva del Apps Script en repo es `integrations/google-apps-script/Code.gs`.
4. La sincronizacion con Google Apps Script sigue siendo manual.

## Aplicacion que no se usa

`Formulario Paz` no forma parte del flujo activo y no debe usarse como endpoint de la landing ni como destino del webhook.

## Riesgos vigentes

1. El flujo depende de que las Script Properties del Apps Script real coincidan con lo documentado.
2. Apps Script tiene cuotas y limites de ejecucion que deben vigilarse durante la conciliacion.
3. La documentacion oficial de Apps Script Web Apps no documenta acceso equivalente a headers entrantes personalizados; por eso la compuerta actual del webhook usa `webhook_secret` en la URL mas consulta oficial a la API.
4. No existe pipeline automatizado ni suite de tests.
5. La verificacion sigue siendo manual.
6. El hecho de que el checkout abra y aparezca una fila `pending` no prueba que la tarjeta de prueba pueda aprobar correctamente.

## Lectura recomendada

1. `ARQUITECTURA-ACTUAL.md`
2. `GITHUB-PAGES-DEPLOYMENT.md`
3. `APPS-SCRIPT-WEB-APP-DEPLOY.md`
4. `SCRIPT-PROPERTIES-SETUP.md`
5. `GOOGLE-SHEETS-SCHEMA.md`
6. `MERCADOPAGO-WEBHOOK-APPSSCRIPT.md`
7. `GOOGLE-APPS-SCRIPT-EN-ESTE-PROYECTO.md`
8. `OPERACION-Y-VERIFICACION.md`
9. `SECURITY.md`
10. `PAYMENT-HARDENING.md`
