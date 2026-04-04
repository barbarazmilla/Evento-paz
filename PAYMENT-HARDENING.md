# Payment Hardening Checklist

## Objetivo

Dejar el flujo de leads y pagos en un estado donde el frontend publico no pueda falsificar estados de pago ni escribir datos sensibles sin control.

## Regla base

El navegador solo puede:

1. enviar leads,
2. abrir el checkout,
3. mostrar mensajes al usuario.

El navegador no debe:

1. confirmar pagos,
2. actualizar estados de pago,
3. decidir si una operacion fue aprobada,
4. escribir datos de conciliacion financiera por cuenta propia.

## Google Apps Script

1. Separar acciones publicas y privadas.
2. Permitir `create_lead` como unica accion publica.
3. Rechazar `update_status`, `confirm_payment` o cualquier accion similar si llega desde el frontend.
4. Validar longitud, formato y presencia de `nombre`, `email`, `telefono` y `tipo_entrada`.
5. Sanitizar texto antes de escribir en Sheets.
6. Limitar origenes permitidos si la implementacion lo soporta.
7. Agregar rate limit basico por IP o por ventana temporal.
8. Agregar CAPTCHA o una proteccion anti-spam equivalente si el endpoint queda abierto.
9. Guardar fecha de alta, fuente, ticket, y un `lead_id` interno unico.
10. No devolver informacion sensible al cliente.

## Mercado Pago

1. Crear la preferencia de pago del lado servidor o en Apps Script autenticado, no desde el cliente si implica credenciales.
2. Generar y guardar un `external_reference` unico por lead.
3. Registrar `lead_id`, `external_reference`, ticket y monto esperado antes de abrir el checkout.
4. Configurar webhook de Mercado Pago para recibir notificaciones de pago.
5. Verificar cada pago contra la API oficial usando credenciales privadas solo del lado servidor.
6. Actualizar Sheets solo despues de una verificacion server-side real.
7. Guardar `payment_id`, `status`, `status_detail`, monto, moneda y fecha de confirmacion.
8. Ignorar callbacks duplicados y hacer idempotencia por `payment_id` o `external_reference`.

## Flujo recomendado

1. Usuario completa formulario.
2. Frontend envia lead al endpoint publico.
3. Backend o Apps Script privado crea `lead_id` y `external_reference`.
4. Backend crea preferencia de Mercado Pago.
5. Frontend redirige al checkout con la URL recibida.
6. Mercado Pago notifica al webhook.
7. Backend valida el pago con la API de Mercado Pago.
8. Backend actualiza Google Sheets con estado confirmado.

## Campos minimos en Google Sheets

- `lead_id`
- `fecha_lead`
- `nombre`
- `email`
- `telefono`
- `tipo_entrada`
- `monto_esperado`
- `external_reference`
- `payment_id`
- `payment_status`
- `payment_status_detail`
- `fecha_confirmacion`
- `fuente`

## Validaciones criticas

1. No marcar como pago aprobado solo porque la URL trae `status=approved`.
2. No confiar en `payment_id` enviado por el navegador.
3. No confiar en `external_reference` enviado por query params para cerrar una venta.
4. No usar access tokens de Mercado Pago en frontend.
5. No dejar endpoints de escritura sin controles minimos de abuso.

## Señal de que el flujo ya esta bien

El frontend puede romperse o ser manipulado y aun asi no puede cambiar el estado de una venta real.