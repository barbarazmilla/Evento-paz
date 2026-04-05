# Google Apps Script Activo

La unica app de Google Apps Script en uso para este proyecto es `Paz Cornu Migracion Segura`.

## Archivos en repo

- `integrations/google-apps-script/Code.gs`
- `integrations/google-apps-script/appsscript.json`

`Code.gs` representa el flujo activo alineado con la arquitectura documentada del repo.

Si alguien modifica el script directamente en Google Apps Script y no replica el cambio aca, el repo queda desalineado.

## Code.gs activo

1. `doGet` para healthcheck.
2. `create_lead` para capturar el lead y crear la preferencia.
3. recepcion directa del webhook de Mercado Pago.
4. ruta operativa `update_payment` para uso privado y controlado.
5. helper `authorizeServices`.
6. preferencia dinamica con `external_reference`.

## Stack objetivo

1. GitHub Pages hospeda la landing.
2. Apps Script recibe leads y webhooks.
3. Google Sheets guarda estado operativo.
4. Mercado Pago notifica directo al Apps Script usando la URL armada por `Code.gs`.

## Script Properties requeridas

- `SPREADSHEET_ID`
- `LEADS_SHEET_NAME` opcional, por defecto `Leads`
- `WEBHOOK_SHARED_SECRET`
- `MP_ACCESS_TOKEN`
- `MP_NOTIFICATION_URL`
- `MP_RETURN_URL` opcional

`MP_NOTIFICATION_URL` debe guardarse como la URL base `/exec` del Web App, sin query params. `Code.gs` agrega `source_news=webhooks` y `webhook_secret` automaticamente al crear la preferencia.

## Despliegue

1. Crear un proyecto de Apps Script.
2. Copiar `Code.gs` y `appsscript.json`.
3. Configurar Script Properties.
4. Ejecutar `authorizeServices` una vez para aprobar scopes.
5. Desplegar como Web App.
6. Ejecutar como tu usuario.
7. Dar acceso publico solo porque `create_lead` y el webhook directo necesitan ser alcanzables desde afuera.
8. Guardar la URL `/exec` desplegada como base operativa del script.

## Sync manual recomendado

1. Editar primero `Code.gs` en el repo.
2. Copiar el contenido al editor de Google Apps Script.
3. Verificar `appsscript.json` si hubo cambios de manifest.
4. Desplegar una nueva version como Web App.
5. Confirmar que la URL activa siga siendo la esperada en `index.html`.
6. Ejecutar `doGet`, una prueba de `create_lead` y una simulacion de webhook.

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

## Webhook directo de Mercado Pago

1. La preferencia sale con `notification_url` construida desde `MP_NOTIFICATION_URL`.
2. `Code.gs` agrega `source_news=webhooks` y `webhook_secret` a esa URL.
3. Cuando llega la notificacion, el script extrae `payment_id` del body o del query param equivalente.
4. Luego consulta `GET /v1/payments/{id}` con `MP_ACCESS_TOKEN`.
5. La fila correcta se actualiza por `external_reference`.

## Ruta operativa privada

`update_payment` sigue disponible para pruebas controladas o correcciones privadas.

Payload esperado:

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

`Formulario Paz` queda fuera del flujo activo y no debe volver a referenciarse desde la landing ni la documentacion operativa principal.

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

### Simulacion controlada del webhook

```bash
curl -X POST 'https://script.google.com/macros/s/REEMPLAZAR/exec?source_news=webhooks&webhook_secret=REEMPLAZAR&data.id=999999999' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "payment",
    "action": "payment.created",
    "data": {
      "id": "999999999"
    }
  }'
```

Para pruebas reales de recepcion, priorizar la simulacion desde Tus Integraciones de Mercado Pago.

## Observacion

Este script sigue siendo una solucion liviana. Si la operacion escala, conviene mover la conciliacion a un backend mas fuerte y dejar Apps Script como adaptador de Sheets.

La documentacion oficial de Apps Script Web Apps no documenta de forma equivalente acceso a headers entrantes personalizados, por lo que la validacion HMAC por `x-signature` queda como trabajo pendiente de hardening.