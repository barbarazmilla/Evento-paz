# Google Apps Script

Este directorio ahora conserva dos copias distintas de Apps Script que no deben mezclarse.

## Archivos en repo

- `integrations/google-apps-script/Code.gs`
- `integrations/google-apps-script/Code-legacy-browser-flow.gs`
- `integrations/google-apps-script/appsscript.json`

`Code.gs` representa el flujo nuevo alineado con la arquitectura documentada del repo.

`Code-legacy-browser-flow.gs` conserva otro Apps Script distinto, basado en formulario directo, webhook dentro de Apps Script y Meta CAPI.

Si alguien modifica el script directamente en Google Apps Script y no replica el cambio aca, el repo queda desalineado.

## Code.gs activo

1. `doGet` para healthcheck,
2. bloque de `create_lead` y `update_payment`,
3. helper `authorizeServices`,
4. preferencia dinamica con `external_reference`,
5. actualizacion server-side por `update_payment`.

## Script Properties requeridas

- `SPREADSHEET_ID`
- `LEADS_SHEET_NAME` opcional, por defecto `Leads`
- `WEBHOOK_SHARED_SECRET`
- `MP_ACCESS_TOKEN`
- `MP_NOTIFICATION_URL`
- `MP_RETURN_URL` opcional

## Code-legacy-browser-flow.gs

Incluye un segundo `doPost` distinto y estas piezas heredadas:

- `action=update_status` desde redirect del navegador
- `manejarFormulario`
- `manejarWebhookMercadoPago`
- `enviarPurchaseAMeta`
- `probarPreferenciaVIP`
- `probarPurchaseMeta`

Propiedades extra de ese flujo legacy:

- `META_ACCESS_TOKEN`
- `META_TEST_EVENT_CODE` opcional

## Despliegue

1. Crear un proyecto de Apps Script.
2. Copiar `Code.gs` y `appsscript.json`.
3. Configurar Script Properties.
4. Desplegar como Web App.
5. Ejecutar como tu usuario.
6. Dar acceso publico solo porque `create_lead` necesita ser alcanzable desde la landing.

## Sync manual recomendado

1. Editar primero `Code.gs` en el repo.
2. Copiar el contenido al editor de Google Apps Script.
3. Verificar `appsscript.json` si hubo cambios de manifest.
4. Desplegar una nueva version como Web App.
5. Confirmar que la URL activa siga siendo la esperada en `index.html`.
6. Ejecutar `doGet` y una prueba de `create_lead`.

Si el cambio se hizo directamente en Google Apps Script, bajar ese cambio manualmente al repo el mismo dia.

## Accion publica del flujo nuevo

El frontend envia `FormData` con:

- `action=create_lead`
- `nombre`
- `email`
- `telefono`
- `tipo_entrada`
- `source` opcional
- `website` como honeypot opcional

Respuesta exitosa:

- `ok`
- `lead_id`
- `external_reference`
- `preference_id`
- `init_point`

## Accion privada del flujo nuevo

El webhook server-side envia JSON con:

- `action: update_payment`
- `webhook_secret`
- `external_reference`
- `payment_id`
- `status`
- `status_detail`
- `transaction_amount`
- `currency_id`
- `approved_at`

## Nota operativa

No volver a pegar ambos scripts en un mismo archivo. Si se hace eso, Apps Script deja activa solo la ultima definicion repetida y el comportamiento real queda ambiguo.

## Pruebas manuales

### Healthcheck

`GET /exec`

Respuesta esperada:

```json
{"ok":true,"service":"lead-capture","version":1}
```

### Alta de lead

```bash
curl -X POST 'https://script.google.com/macros/s/REEMPLAZAR/exec' \
  -F 'action=create_lead' \
  -F 'nombre=Barbara Test' \
  -F 'email=barbara@example.com' \
  -F 'telefono=5491100000000' \
  -F 'tipo_entrada=VIP' \
  -F 'source=prueba_manual'
```

### Actualizacion privada

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

## Observacion

Este script sigue siendo una solucion liviana. Si la operacion escala, conviene mover la conciliacion a un backend mas fuerte y dejar Apps Script como adaptador de Sheets.