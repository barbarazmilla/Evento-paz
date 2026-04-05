# Operacion Y Verificacion

## Verificacion local del frontend

1. Abrir `index.html` con Live Server.
2. Revisar desktop y mobile.
3. Abrir modal y formulario.
4. Confirmar que el formulario haga POST al Apps Script nuevo.
5. Confirmar que la respuesta traiga `init_point`.

## Verificacion del Apps Script

Chequeo de salud esperado:

- GET al `/exec`
- Respuesta esperada: `{"ok":true,"service":"lead-capture","version":1}`

Alta manual esperada:

- POST con `action=create_lead`
- Respuesta esperada:
  - `ok: true`
  - `lead_id`
  - `external_reference`
  - `preference_id`
  - `init_point`

## Verificacion del webhook

1. GET a `https://evento-paz.onrender.com/health`
2. Respuesta esperada: HTTP 200
3. Confirmar que Render tenga:
   - `MP_ACCESS_TOKEN`
   - `APPS_SCRIPT_URL`
   - `APPS_SCRIPT_SHARED_SECRET`
   - `MP_WEBHOOK_PATH`
   - `PORT`

## Prueba final que falta para certificar el flujo

1. Crear un lead real o sandbox funcional.
2. Abrir el checkout generado por `init_point`.
3. Completar el pago.
4. Confirmar que Mercado Pago golpea el webhook nuevo.
5. Confirmar que el webhook consulta la API oficial.
6. Confirmar que Apps Script actualiza la fila correcta por `external_reference`.

## Señales de rollback

Volver al estado anterior si ocurre cualquiera de estas:

1. el lead deja de guardarse,
2. el checkout deja de abrir,
3. el webhook no puede consultar Mercado Pago,
4. Apps Script devuelve `lead_not_found` o `forbidden`,
5. la fila de Sheets no coincide con el `external_reference` esperado.

## PowerShell 5.1

Para pruebas manuales en Windows PowerShell 5.1, evitar `-Form` y usar `application/x-www-form-urlencoded` o un body JSON explicito.
