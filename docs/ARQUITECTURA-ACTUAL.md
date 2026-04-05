# Arquitectura Actual

## Objetivo

Este repo representa el frontend publico y la documentacion operativa del flujo activo de tickets con Mercado Pago.

La arquitectura activa ya no depende de links fijos de pago ni del navegador para confirmar ventas.

## Componentes activos

1. `index.html`
   Captura el lead, pide una preferencia dinamica y abre el checkout.
2. `integrations/google-apps-script/Code.gs`
   Es la fuente local del Apps Script activo. Recibe `create_lead`, escribe en Sheets y crea la preferencia de Mercado Pago.
3. `integrations/mercadopago-webhook/server.js`
   Recibe el webhook de Mercado Pago en Render, consulta la API oficial y manda `update_payment` a Apps Script.
4. Google Sheets
   Guarda leads y estado de conciliacion por `external_reference`.

## Flujo activo

1. El usuario elige ticket en `index.html`.
2. La landing abre el modal y muestra el formulario previo al checkout.
3. El frontend envia `create_lead` al Apps Script.
4. Apps Script valida, sanitiza, genera `lead_id` y `external_reference`, guarda la fila en Sheets y crea la preferencia de Mercado Pago.
5. Apps Script responde `init_point` y `preference_id`.
6. El frontend abre el checkout con el `init_point` devuelto.
7. Mercado Pago notifica al webhook server-side.
8. El webhook consulta el pago real con `MP_ACCESS_TOKEN` y envia `update_payment` autenticado a Apps Script.
9. Apps Script actualiza la fila correcta por `external_reference`.

## Fuente de verdad

La fuente de verdad del pago es el bloque server-side:

`Mercado Pago -> webhook -> consulta API oficial -> update_payment -> Google Sheets`

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

### Accion privada

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
