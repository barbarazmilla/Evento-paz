# Webhook Base De Mercado Pago

Servidor Node minimo para recibir notificaciones de Mercado Pago, validar el pago contra la API oficial y actualizar Google Apps Script del lado servidor.

## Requisitos

- Node 20 o superior
- `MP_ACCESS_TOKEN`
- URL del Apps Script desplegado
- `APPS_SCRIPT_SHARED_SECRET` igual al configurado en Apps Script

## Variables de entorno

Copiar `.env.example` como referencia.

- `PORT`
- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_PATH`
- `APPS_SCRIPT_URL`
- `APPS_SCRIPT_SHARED_SECRET`

## Como correrlo

1. Exportar las variables de entorno.
2. Iniciar con `npm start`.
3. Exponer el endpoint publico del webhook.
4. Configurar Mercado Pago para notificar a `https://tu-dominio.com/webhooks/mercadopago`.

## Prueba manual local

Payload minimo de prueba:

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

Ese request no alcanza por si solo para una prueba real: el servidor va a consultar la API oficial de Mercado Pago con `MP_ACCESS_TOKEN` y luego va a actualizar Apps Script con el secreto compartido.

## Flujo

1. Mercado Pago envia el webhook.
2. El servidor extrae `payment_id`.
3. El servidor consulta `GET /v1/payments/{id}` en Mercado Pago con el access token privado.
4. El servidor toma `external_reference`, estado y monto real.
5. El servidor actualiza Apps Script usando `update_payment` y un secreto compartido.

## Notas importantes

- Este servidor no confia en query params del navegador para confirmar pagos.
- Si queres subir el nivel de seguridad, agrega validacion de firma del webhook provista por Mercado Pago.
- Para produccion conviene persistir logs e idempotencia en una base real. Esta base ya evita falsos positivos porque siempre revalida el pago con la API oficial.