# Google Apps Script Seguro

Base para usar Google Sheets como almacenamiento de leads sin permitir que el frontend confirme pagos.

## Que hace

- acepta `create_lead` como accion publica,
- guarda el lead con `lead_id` y `external_reference`,
- devuelve `init_point` opcional segun el ticket,
- acepta `update_payment` solo si recibe un secreto compartido,
- actualiza el estado del pago en la misma fila del lead.

## Propiedades requeridas en Script Properties

- `SPREADSHEET_ID`
- `LEADS_SHEET_NAME` opcional, por defecto `Leads`
- `WEBHOOK_SHARED_SECRET`
- `PAY_URL_GENERAL` opcional
- `PAY_URL_VIP` opcional

## Despliegue

1. Crear un proyecto de Apps Script.
2. Copiar `Code.gs` y `appsscript.json`.
3. Configurar las Script Properties.
4. Desplegar como Web App.
5. Ejecutar como tu usuario.
6. Dar acceso a `Anyone` solo si el endpoint publico se usara para captura de leads.

## Accion publica esperada

El frontend puede seguir enviando `FormData` con estos campos:

- `nombre`
- `email`
- `telefono`
- `tipo_entrada`
- `source` opcional

Si `action` no viene informado, el script asume `create_lead`.

## Accion privada esperada

El webhook server-side debe enviar JSON con:

- `action: update_payment`
- `webhook_secret`
- `external_reference`
- `payment_id`
- `status`
- `status_detail`
- `transaction_amount`
- `currency_id`
- `approved_at`

## Prueba rapida con curl

Ejemplo de alta de lead:

```bash
curl -X POST 'https://script.google.com/macros/s/REEMPLAZAR/exec' \
	-F 'action=create_lead' \
	-F 'nombre=Barbara Test' \
	-F 'email=barbara@example.com' \
	-F 'telefono=5491100000000' \
	-F 'tipo_entrada=VIP' \
	-F 'source=prueba_manual'
```

Ejemplo de actualizacion privada:

```bash
curl -X POST 'https://script.google.com/macros/s/REEMPLAZAR/exec' \
	-H 'Content-Type: application/json' \
	-d '{
		"action": "update_payment",
		"webhook_secret": "REEMPLAZAR",
		"external_reference": "ext_123",
		"payment_id": "999999999",
		"status": "approved",
		"status_detail": "accredited",
		"transaction_amount": "100000",
		"currency_id": "ARS",
		"approved_at": "2026-04-04T20:00:00Z"
	}'
```

## Nota

Esto sigue siendo una base liviana. Si el volumen sube o necesitás controles mas finos, conviene migrar la conciliacion a un backend real y dejar Apps Script solo como adaptador de Sheets.