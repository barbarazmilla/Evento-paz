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
2. `update_payment` requiere `webhook_secret`.
3. Existe honeypot anti-spam basico.
4. Existe ventana anti-duplicados por cache.
5. La hoja se valida por encabezados antes de escribir.
6. La fila se actualiza por `external_reference`.

## Webhook actual

1. Recibe la notificacion de Mercado Pago en Render.
2. Extrae `payment_id`.
3. Consulta la API oficial de Mercado Pago con `MP_ACCESS_TOKEN`.
4. Envia `update_payment` autenticado a Apps Script.

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
5. No escribir en Sheets sin sanitizacion minima.

## Trabajo pendiente

1. Certificar un pago real o sandbox funcional de punta a punta.
2. Agregar validacion de firma de webhook en Render.
3. Evaluar rate limiting o CAPTCHA si sube el ruido de bots.
4. Mejorar monitoreo para errores tipo `lead_not_found`.

## Señal de integracion sana

El frontend puede ser manipulado y aun asi no logra cambiar el estado real de una venta.