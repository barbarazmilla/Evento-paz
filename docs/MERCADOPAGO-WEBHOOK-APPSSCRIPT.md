# Mercado Pago Webhook Con Apps Script

## Objetivo

Recibir el webhook de Mercado Pago directo en el Web App de Apps Script, sin Render.

## Base oficial

- Mercado Pago permite configurar Webhooks desde el panel o mediante `notification_url` por preferencia.
- La `notification_url` configurada al crear la preferencia tiene prioridad sobre la configurada en el panel.
- Mercado Pago espera `HTTP 200` o `201` para considerar la recepcion correcta.
- Luego de recibir la notificacion, corresponde consultar el recurso oficial por API.
- El panel de Webhooks permite simular entregas.
- Los pagos de prueba creados con credenciales de prueba no disparan notificaciones reales; para probar recepcion, usar la simulacion del panel.

## Configuracion objetivo en este repo

1. `MP_NOTIFICATION_URL` guarda la URL base `/exec` del Apps Script desplegado.
2. `Code.gs` agrega `source_news=webhooks` y `webhook_secret` al crear la preferencia.
3. Mercado Pago envia la notificacion directa al Apps Script.
4. El Apps Script consulta la API oficial y actualiza Sheets por `external_reference`.

## Configuracion en Mercado Pago

1. Ir a Tus Integraciones.
2. Abrir la app correcta.
3. Entrar en Webhooks > Configurar notificaciones.
4. Configurar URL de pruebas y produccion.
5. Activar al menos el topico `payments`.
6. Guardar para que Mercado Pago genere la clave secreta del panel.
7. Usar `Simular` para probar la URL desplegada.

Aunque la `notification_url` enviada por preferencia tiene prioridad, conviene dejar el panel consistente con la misma base operativa.

## Seguridad actual del repo

La documentacion oficial de Mercado Pago describe validacion HMAC por `x-signature` y `x-request-id`.

La documentacion oficial de Apps Script Web Apps describe body y query params de `doPost`, pero no documenta de forma equivalente acceso fiable a headers entrantes personalizados.

Por eso, la version actual del repo usa esta combinacion:

1. `webhook_secret` en la URL de notificacion,
2. consulta oficial a `GET /v1/payments/{id}` antes de actualizar Sheets.

La validacion HMAC por header queda como hardening pendiente y debe investigarse sobre el script desplegado real antes de darla por resuelta.

## Prueba minima

1. Desplegar el Apps Script como Web App.
2. Confirmar que `MP_NOTIFICATION_URL` apunte a la base `/exec` correcta.
3. Crear un lead para generar una preferencia.
4. Simular un evento `payment` desde el panel de Mercado Pago.
5. Revisar el panel de entregas de Webhooks.
6. Revisar My Executions en Apps Script.
7. Confirmar actualizacion de la fila correcta en Sheets.

## Troubleshooting rapido

1. Si no llega `payment_id`, la notificacion no es procesable.
2. Si falta `external_reference`, la conciliacion no puede unir el pago con la fila correcta.
3. Si el secreto de la URL no coincide, el script debe rechazar la actualizacion.
4. Si el script excede cuotas o runtime, revisar My Executions y los limites de Apps Script.
5. Si el navegador muestra `approved` pero Sheets no cambia, la venta no esta conciliada.

## Referencias oficiales

- https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/additional-info
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/services/quotas