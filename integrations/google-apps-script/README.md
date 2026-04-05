# Google Apps Script Activo

Fuente local del Apps Script que hoy define el contrato de captura y conciliacion.

## Fuente de verdad en repo

La unica copia viva del Apps Script en este proyecto es:

- `integrations/google-apps-script/Code.gs`
- `integrations/google-apps-script/appsscript.json`

No hay otra copia activa en la raiz.

Si alguien modifica el script directamente en Google Apps Script y no replica el cambio aca, el repo queda desalineado.

## Que hace

1. expone `doGet` para healthcheck,
2. recibe `create_lead`,
3. valida y sanitiza el payload,
4. escribe la fila inicial en Google Sheets,
5. crea una preferencia dinamica de Mercado Pago,
6. devuelve `lead_id`, `external_reference`, `preference_id` e `init_point`,
7. recibe `update_payment` solo con secreto compartido,
8. actualiza la fila correcta por `external_reference`.

## Script Properties requeridas

- `SPREADSHEET_ID`
- `LEADS_SHEET_NAME` opcional, por defecto `Leads`
- `WEBHOOK_SHARED_SECRET`
- `MP_ACCESS_TOKEN`
- `MP_NOTIFICATION_URL`
- `MP_RETURN_URL` opcional

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

## Accion publica

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

## Accion privada

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