---
name: render-evento-paz
description: 'Operar, verificar, diagnosticar y cambiar la integracion de Render en Evento Paz. Use when working with Render, onrender, deploys, webhook, healthcheck, environment variables, logs, Mercado Pago webhook delivery, rollback, or production incidents tied to integrations/mercadopago-webhook.'
argument-hint: 'Describe si necesitas verificar, desplegar, diagnosticar o cambiar el webhook en Render.'
user-invocable: true
---

# Render Evento Paz

## Objetivo

Usar esta skill cuando haya que interactuar con Render en este proyecto sin perder el encuadre real de la arquitectura.

En este repo, Render no hospeda la landing ni reemplaza Apps Script. Render existe para correr el webhook server-side que recibe notificaciones de Mercado Pago, consulta la API oficial y reenvia `update_payment` al Apps Script.

La fuente de verdad del pago sigue siendo:

`Mercado Pago -> webhook en Render -> consulta API oficial -> update_payment -> Google Sheets`

Si una propuesta rompe esa regla o intenta cerrar una venta desde el navegador, esta skill debe rechazar ese enfoque.

## Cuando usarla

- Verificar si el servicio en Render esta sano o mal configurado.
- Preparar o revisar un cambio en `integrations/mercadopago-webhook/server.js`.
- Confirmar variables de entorno, rutas y healthcheck del servicio desplegado.
- Operar el panel de Render para revisar logs, redeploys o cambios de entorno.
- Diagnosticar por que un pago no se reconcilio en Sheets.
- Revisar si corresponde rollback del webhook productivo.
- Alinear cambios entre frontend, Apps Script y webhook sin inventar arquitectura nueva.

## Referencias

- Cargar [respaldo operativo oficial](./references/operacion-oficial-render-y-mercadopago.md) cuando haga falta contrastar la skill contra documentacion publica de Render y Mercado Pago.

## Checklist rapido

Usar este bloque cuando haga falta una respuesta operativa corta:

1. Confirmar que el servicio correcto en Render sea el webhook de Mercado Pago y no la landing.
2. Confirmar `GET https://evento-paz.onrender.com/health` con respuesta saludable; para Render, el health check cuenta como sano con `2xx` o `3xx`, aunque en este proyecto la expectativa operativa siga siendo `200`.
3. Confirmar presencia de `MP_ACCESS_TOKEN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SHARED_SECRET`, `MP_WEBHOOK_PATH` y `PORT`.
4. Confirmar que Mercado Pago notifique a `https://evento-paz.onrender.com/webhooks/mercadopago` o a la ruta vigente.
5. Si hubo cambio reciente, revisar logs del deploy y logs de runtime.
6. Si hubo pago afectado, seguir el rastro `payment_id -> consulta oficial -> update_payment -> external_reference -> Sheets`.
7. Si falla cualquiera de los puntos criticos, evaluar rollback.

## Hechos fijos del proyecto

- La landing publica vive en `index.html` y no debe contener secretos.
- El Apps Script activo vive en `integrations/google-apps-script/Code.gs`.
- El servicio desplegable en Render vive en `integrations/mercadopago-webhook/server.js`.
- El endpoint esperado del webhook es `https://evento-paz.onrender.com/webhooks/mercadopago`.
- El healthcheck esperado es `https://evento-paz.onrender.com/health`.
- El webhook necesita `MP_ACCESS_TOKEN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SHARED_SECRET`, `MP_WEBHOOK_PATH` y `PORT`.
- El contrato privado con Apps Script requiere `webhook_secret`.
- La mejora pendiente conocida es validar la firma del webhook de Mercado Pago en Render.

## Procedimiento

### 1. Determinar el tipo de trabajo

Clasificar el pedido en una de estas categorias:

1. Verificacion operativa.
2. Cambio de codigo del webhook.
3. Incidente de produccion.
4. Cambio de arquitectura o flujo.

### 2. Hacer el encuadre correcto antes de tocar nada

Confirmar siempre:

1. El problema pertenece al webhook en Render y no al frontend por separado.
2. El frontend solo debe abrir el `init_point`; no confirma pagos.
3. El Apps Script sigue siendo el sistema que crea leads y actualiza Sheets.
4. Si el problema es de conciliacion, el tramo critico es Render + API oficial + `update_payment`.

### 3. Si el trabajo es verificacion operativa

Ejecutar este checklist:

1. Confirmar que `GET /health` responda HTTP 200.
2. Confirmar que la ruta publica del webhook siga siendo `/webhooks/mercadopago` o la definida en `MP_WEBHOOK_PATH`.
3. Confirmar que las variables de entorno requeridas existan en Render.
4. Confirmar que Mercado Pago este notificando a la URL publica correcta.
5. Confirmar que el endpoint configurado en Mercado Pago sea `HTTPS` y reciba `POST` del topic esperado.
6. Si la URL viene configurada durante la creacion del pago o la preferencia, asumir que esa URL tiene prioridad sobre la configurada en el panel de Mercado Pago.
7. No esperar webhooks reales desde pagos hechos con credenciales de prueba cuando la documentacion del producto indique que no se emiten; usar simulacion de notificaciones para probar recepcion.
8. Si hay pago de prueba o prueba controlada valida, confirmar el flujo completo hasta la actualizacion por `external_reference` en Sheets.

### 3.b. Si hace falta operar el panel de Render

Seguir este orden:

1. Abrir el servicio correcto y no asumir que cualquier deploy del repo afecta produccion.
2. Revisar el ultimo deploy: estado, commit desplegado y motivo del fallo si existio.
3. Revisar logs de aplicacion para identificar si el webhook recibio la notificacion, si hubo error consultando Mercado Pago o si fallo `update_payment`.
4. Revisar variables de entorno por presencia y consistencia, sin exponer secretos en la conversacion ni moverlos al frontend.
5. Si se modificaron variables o codigo, lanzar redeploy y volver a verificar `/health`.
6. No confiar en `Restart service` para aplicar cambios de variables si no hubo redeploy; Render reinicia con el mismo commit y la misma configuracion desplegada.
7. Si el redeploy deja el flujo peor que antes, volver al criterio de rollback.

### 4. Si el trabajo es cambio de codigo del webhook

Seguir este orden:

1. Leer `integrations/mercadopago-webhook/server.js` y la documentacion operativa relevante.
2. Mantener el servicio minimo y enfocado en reconciliar pagos, no en renderizar UI.
3. Preservar el contrato con Apps Script, en especial `update_payment` y `webhook_secret`.
4. No mover secretos ni logica sensible al frontend.
5. Si cambia una URL o ruta, buscar y actualizar ocurrencias relacionadas en la documentacion.
6. Validar manualmente `/health` y el flujo de pago o una prueba controlada equivalente.

### 5. Si el trabajo es incidente de produccion

Razonar por capas, en este orden:

1. Confirmar si el lead se creo correctamente desde el frontend y Apps Script.
2. Confirmar si el checkout se abrio con un `init_point` valido.
3. Confirmar si Mercado Pago golpeo el webhook desplegado.
4. Confirmar si Render pudo consultar `GET /v1/payments/{id}` con `MP_ACCESS_TOKEN`.
5. Confirmar si Render envio `update_payment` al Apps Script con el secreto correcto.
6. Confirmar si el webhook respondio `200` o `201` dentro de la ventana esperada para evitar reintentos del proveedor.
7. Confirmar si Sheets se actualizo por el `external_reference` correcto.

No saltar directo al frontend si el sintoma real es que la venta no quedo conciliada.

### 6. Si el trabajo implica decidir rollback

Proponer rollback si ocurre cualquiera de estas senales:

1. El lead deja de guardarse.
2. El checkout deja de abrir.
3. El webhook no puede consultar Mercado Pago.
4. Apps Script devuelve `lead_not_found` o `forbidden`.
5. Sheets no coincide con el `external_reference` esperado.

### 7. Cerrar el trabajo con evidencia minima

No considerar terminado el trabajo sin dejar claro:

1. Que parte del flujo se toco.
2. Que endpoint o variable se verifico.
3. Que riesgo queda abierto.
4. Si falta la prueba final real o sandbox funcional.

## Criterios de calidad

- No confundir UX del navegador con confirmacion real del pago.
- No proponer secretos en `index.html`.
- No tratar Render como backend general del proyecto si el alcance sigue siendo solo webhook.
- No asumir que un redeploy exitoso significa reconciliacion exitosa.
- No declarar exito solo porque `/health` responde; hace falta validar el tramo de reconciliacion cuando el cambio lo amerita.
- No asumir que una simple recepcion del webhook alcanza; Mercado Pago exige validacion de autenticidad y luego consulta del recurso para cerrar bien el flujo.
- Mantener coherencia entre codigo, variables, URL publica y documentacion.

## Preguntas que esta skill debe responder bien

- Que corre en Render y que no corre en Render.
- Que variables deben existir para que el webhook funcione.
- Como verificar si el deploy esta sano.
- Donde mirar si un pago no impacta en Sheets.
- Cuando conviene rollback.
- Como cambiar el webhook sin romper el contrato con Apps Script.

