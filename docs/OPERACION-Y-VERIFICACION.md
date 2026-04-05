# Operacion Y Verificacion

## Verificacion de GitHub Pages

1. Confirmar que el sitio publica desde la rama y carpeta correctas en GitHub Pages.
2. Confirmar que `CNAME` sigue presente en la raiz del repo.
3. Confirmar que el dominio publico apunta al sitio esperado y sirve el `index.html` mas reciente.
4. Confirmar que HTTPS este activo en GitHub Pages.

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

## Verificacion del webhook directo en Apps Script

1. Confirmar que `MP_NOTIFICATION_URL` este configurada con la base `/exec` del Apps Script desplegado.
2. Confirmar que `WEBHOOK_SHARED_SECRET` este cargada en Script Properties.
3. Confirmar que el `notification_url` final que construye `Code.gs` agregue `source_news=webhooks` y `webhook_secret`.
4. Configurar o simular la URL de webhook desde el panel de Mercado Pago.
5. Verificar en My Executions de Apps Script que la notificacion fue ejecutada.
6. Confirmar que el script consulta la API oficial y actualiza la fila correcta en Sheets por `external_reference`.

## Prueba final que falta para certificar el flujo

1. Crear un lead real o sandbox funcional.
2. Abrir el checkout generado por `init_point`.
3. Completar el pago.
4. Confirmar que Mercado Pago golpea el Apps Script desplegado.
5. Confirmar que el Apps Script consulta la API oficial.
6. Confirmar que Apps Script actualiza la fila correcta por `external_reference`.

## Diagnostico actual de pagos de prueba

### Lo que ya esta probado

1. La landing crea el lead y deja una fila inicial en Sheets.
2. El Apps Script devuelve `preference_id` e `init_point` validos.
3. El checkout de Mercado Pago abre correctamente.
4. En ciertos intentos existen `payment_id` y actualizaciones parciales en Sheets.

### Lo que todavia NO esta probado

1. Una compra con tarjeta de prueba que termine en `approved`.
2. Un webhook estable con tasa de exito consistente desde Mercado Pago hacia Apps Script.
3. Una conciliacion limpia y repetible de punta a punta para tarjeta de prueba.

### Datos que conviene capturar en cada fallo

1. `preference_id` visible en la URL de error de Mercado Pago.
2. `external_reference` de la fila creada en Sheets.
3. `payment_id`, `payment_status` y `payment_status_detail` de la fila.
4. Medio de pago elegido y escenario usado en la tarjeta de prueba.
5. Usuario comprador de prueba usado en login y email escrito en el formulario.
6. Resultado del historial de notificaciones o del panel de actividad de Mercado Pago.
7. Ejecucion correspondiente en `My Executions` de Apps Script.

### Checklist de prueba controlada con tarjeta

1. Abrir la compra en ventana de incognito.
2. Iniciar sesion con el comprador de prueba de la misma app.
3. Completar el formulario de la landing con el email exacto de esa cuenta de prueba, no con un email arbitrario.
4. Usar una tarjeta de prueba oficial, por ejemplo Visa `4509 9535 6623 3704`, CVV `123`, vencimiento `11/30`.
5. Para forzar aprobacion en la prueba de tarjeta, usar nombre `APRO` y `DNI 12345678`.
6. Si falla, guardar los datos del bloque anterior antes de repetir la prueba.

### Interpretacion rapida de sintomas observados

1. `pending_waiting`: existe un pago o intento pendiente, pero no una aprobacion final.
2. `deferred_retry`: el medio o el flujo quedo a la espera de un reintento o resolucion posterior.
3. `by_payer`: el comprador cancelo o abandono el proceso.
4. `HTTP 502` en notificaciones: el endpoint del Apps Script fallo al procesar el webhook.
5. `Payment was not originated from app`: el pago consultado no fue originado por la app actual o se esta mezclando historial/contexto.
6. Pantalla naranja `Algo salio mal`: el checkout fallo despues de abrir correctamente; no implica por si sola que la preferencia este mal creada.

## Señales de rollback

Volver al estado anterior si ocurre cualquiera de estas:

1. el lead deja de guardarse,
2. el checkout deja de abrir,
3. el Apps Script no puede consultar Mercado Pago,
4. Apps Script devuelve `lead_not_found`, `forbidden` o errores de cuotas,
5. la fila de Sheets no coincide con el `external_reference` esperado.

## PowerShell 5.1

Para pruebas manuales en Windows PowerShell 5.1, evitar `-Form` y usar `application/x-www-form-urlencoded` o un body JSON explicito.
