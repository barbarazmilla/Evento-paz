# Estado Actual

Fecha de referencia: 2026-04-05.

## Flujo activo del repo

- Frontend activo: `index.html`
- Lead endpoint activo esperado: `https://script.google.com/macros/s/AKfycby7eoXE2YO7sBcpAdhPy4b1BAC7JGbFQYEMJ0B55OlHnhHbgh9S8vfmpb5kU_ltciD52A/exec`
- Webhook activo esperado: `https://evento-paz.onrender.com/webhooks/mercadopago`
- Healthcheck del webhook: `https://evento-paz.onrender.com/health`

## Estado validado

Ya fue validado:

1. `doGet` del Apps Script responde salud del servicio.
2. `create_lead` responde `ok`, `lead_id`, `external_reference`, `preference_id` e `init_point`.
3. El checkout dinamico abre correctamente desde la respuesta del Apps Script.
4. El webhook nuevo responde en `/health`.
5. La escritura inicial del lead en Google Sheets funciona.

## Estado aun no certificado de punta a punta

Todavia falta certificar con una compra real o sandbox funcional controlada:

1. recepcion del webhook real de Mercado Pago,
2. consulta del pago oficial desde Render,
3. actualizacion final de la fila correcta por `external_reference`.

## Decisiones ya aplicadas en el repo

1. La raiz del repo apunta al flujo nuevo.
2. El material legacy que ya no participa del flujo actual fue retirado del recorrido principal.
3. La unica fuente viva del Apps Script en repo es `integrations/google-apps-script/Code.gs`.
4. La sincronizacion con Google Apps Script sigue siendo manual.

## Riesgos vigentes

1. El flujo depende de que las Script Properties del Apps Script real coincidan con lo documentado.
2. El webhook sigue siendo un servicio minimo: sin firma de Mercado Pago y sin persistencia propia.
3. No existe pipeline automatizado ni suite de tests.
4. La verificacion sigue siendo manual.

## Lectura recomendada

1. `ARQUITECTURA-ACTUAL.md`
2. `GOOGLE-APPS-SCRIPT-EN-ESTE-PROYECTO.md`
3. `OPERACION-Y-VERIFICACION.md`
4. `SECURITY.md`
5. `PAYMENT-HARDENING.md`
