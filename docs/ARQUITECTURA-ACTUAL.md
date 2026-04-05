# Arquitectura Actual

## Objetivo

Este repo representa el frontend publico y la documentacion operativa del flujo activo de tickets con Mercado Pago.

La arquitectura activa ya no depende de links fijos de pago ni del navegador para confirmar ventas.

## Componentes activos

1. `index.html`
   Captura el lead, pide una preferencia dinamica y abre el checkout.
2. `integrations/google-apps-script/Code.gs`
   Es la fuente local del Apps Script activo. Recibe `create_lead`, escribe en Sheets, crea la preferencia de Mercado Pago y recibe el webhook directo de Mercado Pago.
3. Google Sheets
   Guarda leads y estado de conciliacion por `external_reference`.
4. GitHub Pages
   Hospeda la landing estatica y el dominio publico del evento.

## Flujo activo

1. El usuario elige ticket en `index.html`.
2. La landing abre el modal y muestra el formulario previo al checkout.
3. El frontend envia `create_lead` al Apps Script.
4. Apps Script valida, sanitiza, genera `lead_id` y `external_reference`, guarda la fila en Sheets y crea la preferencia de Mercado Pago.
5. Apps Script responde `init_point` y `preference_id`.
6. El frontend abre el checkout con el `init_point` devuelto.
7. Mercado Pago notifica directo al mismo Web App de Apps Script usando `notification_url` por preferencia.
8. Apps Script extrae `payment_id`, consulta el pago real con `MP_ACCESS_TOKEN` y valida `external_reference`.
9. Apps Script actualiza la fila correcta por `external_reference`.

## Fuente de verdad

La fuente de verdad del pago es el bloque server-side dentro del Apps Script:

`Mercado Pago -> Apps Script Web App -> consulta API oficial -> Google Sheets`

Los parametros de retorno del navegador sirven solo para UX o trazabilidad liviana. No deben cerrar una venta.

## Contrato actual del Apps Script

### Accion publica

- `create_lead`
- Campos esperados:
  - `nombre`
  - `email`
  - `telefono`
  - `tipo_entrada`
  - `source` opcional
  - `website` como honeypot anti-spam

### Webhook directo de Mercado Pago

- Payload esperado: notificacion `payment` con `data.id` o query param equivalente.
- El repo agrega `source_news=webhooks` y `webhook_secret` al `notification_url` cuando crea la preferencia.
- Despues de recibir la notificacion, el Apps Script consulta la API oficial de Mercado Pago antes de actualizar Sheets.

### Accion operativa controlada

- `update_payment`
- Protegida por `webhook_secret`
- Campos relevantes:
  - `external_reference`
  - `status`
  - `status_detail`
  - `payment_id`
  - `transaction_amount`
  - `currency_id`
  - `approved_at`

## Propiedades activas del Apps Script

- `SPREADSHEET_ID`
- `LEADS_SHEET_NAME`
- `WEBHOOK_SHARED_SECRET`
- `MP_ACCESS_TOKEN`
- `MP_NOTIFICATION_URL`
- `MP_RETURN_URL` opcional

## Regla operativa

El frontend puede romperse y aun asi no deberia poder cambiar el estado real de una venta.

Si eso deja de ser cierto, el flujo dejo de estar endurecido.

## Limitacion conocida

La documentacion oficial de Apps Script Web Apps documenta query params y body de `doPost`, pero no documenta de forma equivalente un acceso confiable a headers entrantes personalizados.

Por eso, en esta version del repo, la compuerta del webhook usa `webhook_secret` en la URL de notificacion mas la consulta oficial a la API de Mercado Pago. La validacion HMAC con `x-signature` sigue siendo trabajo pendiente de hardening.
