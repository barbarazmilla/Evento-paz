# Script Properties Setup

## Objetivo

Centralizar la configuracion privada del Apps Script sin mover secretos al frontend ni al repo.

## Donde se cargan

1. Abrir el proyecto de Apps Script.
2. Ir a Project Settings.
3. Buscar la seccion `Script properties`.
4. Cargar o actualizar cada clave manualmente.

## Propiedades requeridas

### `SPREADSHEET_ID`

ID del Google Sheet operativo. Se obtiene desde la URL del documento.

### `LEADS_SHEET_NAME`

Nombre de la hoja operativa. Si no se configura, el script usa `Leads`.

### `WEBHOOK_SHARED_SECRET`

Secreto largo y unico usado como compuerta del webhook directo y para la ruta privada `update_payment`.

Recomendacion:

1. Generar un valor largo y aleatorio.
2. No reutilizar secretos cortos o previsibles.
3. Rotarlo si hubo exposicion o sospecha de fuga.

### `MP_ACCESS_TOKEN`

Token privado productivo de Mercado Pago utilizado por Apps Script para:

1. crear la preferencia,
2. consultar el pago real durante la conciliacion.

### `MP_NOTIFICATION_URL`

URL base `/exec` del Web App desplegado, sin query params.

Importante: `Code.gs` agrega automaticamente `source_news=webhooks` y `webhook_secret` al crear la preferencia. No guardar esos query params manualmente aca.

### `MP_RETURN_URL`

Opcional. URL de retorno para UX del checkout.

## Checklist de configuracion

1. Todas las claves existen.
2. `MP_NOTIFICATION_URL` es la base `/exec` correcta.
3. `WEBHOOK_SHARED_SECRET` coincide con el valor esperado por el script.
4. `SPREADSHEET_ID` apunta al Sheet correcto.
5. `MP_ACCESS_TOKEN` es el token del ambiente correcto.

## Validacion minima

1. `doGet` responde salud.
2. `create_lead` devuelve `init_point`.
3. La preferencia creada apunta al webhook directo del Apps Script.

## Referencias oficiales

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app