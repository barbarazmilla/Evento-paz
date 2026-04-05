# Webhook Server-Side Activo

Servidor Node minimo para reconciliar pagos de Mercado Pago fuera del navegador.

## Que hace

1. recibe la notificacion en `POST /webhooks/mercadopago`,
2. extrae `payment_id`,
3. consulta `GET /v1/payments/{id}` en Mercado Pago,
4. toma `external_reference`, estado y monto real,
5. envia `update_payment` autenticado al Apps Script.

## Requisitos

- Node 20 o superior
- `MP_ACCESS_TOKEN`
- `APPS_SCRIPT_URL`
- `APPS_SCRIPT_SHARED_SECRET`
- `MP_WEBHOOK_PATH`

## Variables de entorno

Copiar `.env.example` como referencia.

- `PORT`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_PATH`
- `APPS_SCRIPT_URL`
- `APPS_SCRIPT_SHARED_SECRET`

## Endpoints

- `GET /health`
- `POST /webhooks/mercadopago`

## Como correrlo

1. Configurar variables de entorno.
2. Ejecutar `npm start`.
3. Exponer el endpoint publico.
4. Configurar Mercado Pago para notificar a la URL publica del webhook.

## Prueba manual minima

```bash
curl -X POST 'http://localhost:8080/webhooks/mercadopago' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }'
```

Eso solo sirve si el `payment_id` existe y el servicio puede consultar Mercado Pago con credenciales reales.

## Regla de seguridad

Este servicio existe para que la venta no dependa del retorno del navegador.

Si el navegador puede cerrar una venta sin pasar por aca, la integracion esta mal cerrada.

## Mejora pendiente

Agregar validacion de firma de webhook de Mercado Pago para endurecer el borde publico.