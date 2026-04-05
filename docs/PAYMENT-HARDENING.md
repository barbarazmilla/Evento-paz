# Payment Hardening Checklist

## Objetivo

Mantener el flujo en un estado donde el frontend publico no pueda alterar conciliacion financiera ni inventar pagos aprobados.

## Regla base

El navegador solo puede:

1. enviar el lead,
2. recibir el `init_point`,
3. abrir el checkout,
4. mostrar mensajes al usuario.

El navegador no puede:

1. confirmar pagos,
2. llamar acciones privadas,
3. decidir si una venta quedo cerrada,
4. escribir estado financiero final.

## Apps Script actual

1. `create_lead` es la unica accion publica.
2. El webhook directo usa `webhook_secret` dentro del `notification_url` generado por el script.
3. Existe honeypot anti-spam basico.
4. Existe ventana anti-duplicados por cache.
5. La hoja se valida por encabezados antes de escribir.
6. La fila se actualiza por `external_reference`.
7. `update_payment` queda disponible solo para operacion controlada o pruebas privadas.

## Webhook actual

1. Recibe la notificacion de Mercado Pago en el mismo Web App de Apps Script.
2. Extrae `payment_id`.
3. Consulta la API oficial de Mercado Pago con `MP_ACCESS_TOKEN`.
4. Actualiza la fila correcta en Google Sheets por `external_reference`.

## Campos activos en Sheets

- `created_at`
- `updated_at`
- `lead_id`
- `external_reference`
- `payment_status`
- `payment_status_detail`
- `payment_id`
- `nombre`
- `email`
- `telefono`
- `tipo_entrada`
- `monto_esperado`
- `transaction_amount`
- `currency_id`
- `source`
- `fecha_confirmacion`

## Validaciones criticas

1. No marcar `approved` por query params del navegador.
2. No confiar en `payment_id` enviado desde el cliente.
3. No exponer `MP_ACCESS_TOKEN` en frontend.
4. No aceptar `update_status`, `confirm_payment` o equivalentes desde el browser.
5. No aceptar un webhook directo sin `webhook_secret` y sin consulta posterior a la API oficial.
6. No escribir en Sheets sin sanitizacion minima.

## Trabajo pendiente

1. Certificar un pago real o sandbox funcional de punta a punta.
2. Validar si la firma `x-signature` de Mercado Pago puede verificarse de forma fiable dentro de Apps Script.
3. Evaluar rate limiting o CAPTCHA si sube el ruido de bots.
4. Mejorar monitoreo para errores tipo `lead_not_found`.

## Hallazgos operativos de la prueba sandbox

1. Que la landing guarde un lead y abra el checkout no demuestra que una tarjeta de prueba pueda aprobar.
2. Que Sheets reciba un `payment_id` o un `payment_status_detail` tampoco equivale a cierre financiero; solo prueba que hubo movimiento parcial del flujo.
3. El panel actual de `Credenciales de prueba` puede mostrar tokens sandbox con prefijo `APP_USR-`; no decidir el entorno solo por el prefijo.
4. En pruebas de Checkout Pro con tarjeta, usar un `payer.email` diferente de la identidad autenticada del comprador puede introducir ruido o rechazo.
5. La preferencia actual del repo envia `payer.name` y `payer.email`, pero aun no incluye campos que ayudan a aprobacion y trazabilidad como `payer.first_name`, `payer.last_name`, `statement_descriptor`, `items.category_id` y `binary_mode`.

## Señal de integracion sana

El frontend puede ser manipulado y aun asi no logra cambiar el estado real de una venta.