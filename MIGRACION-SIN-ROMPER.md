# Migracion Sin Romper Lo Actual

## Idea central

No se reemplaza nada de lo que hoy funciona hasta que la version nueva este probada en paralelo.

La regla es esta:

1. mantener vivo el flujo actual,
2. montar el flujo nuevo aparte,
3. probarlo completo,
4. hacer un cambio minimo en la landing,
5. tener rollback inmediato.

## Que NO tocar al principio

Antes de probar todo en paralelo, no tocar:

1. la URL actual del Apps Script en produccion,
2. el flujo actual de Mercado Pago,
3. la configuracion actual del webhook si ya existe,
4. la landing publicada.

## Paso 1: sacar una foto del estado actual

Guardar por escrito estos valores actuales:

1. URL actual del Apps Script.
2. Links actuales de Mercado Pago.
3. Si existe webhook actual de Mercado Pago, su URL.
4. Nombre de la hoja actual de Google Sheets.
5. Que columnas usa hoy la planilla.

Esto sirve para rollback rapido.

## Paso 2: duplicar, no reemplazar

Crear una version nueva separada de Apps Script.

No editar primero la version que hoy esta funcionando.

La forma segura es:

1. crear un proyecto nuevo de Apps Script,
2. copiar ahi [integrations/google-apps-script/Code.gs](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/integrations/google-apps-script/Code.gs),
3. copiar ahi [integrations/google-apps-script/appsscript.json](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/integrations/google-apps-script/appsscript.json),
4. conectarlo a una hoja de prueba o a una pestaña nueva dentro de la misma planilla.

No mezclar al principio la hoja nueva con la hoja real si no queres riesgo.

## Paso 3: configurar Apps Script nuevo

En Script Properties cargar:

1. `SPREADSHEET_ID`
2. `LEADS_SHEET_NAME`
3. `WEBHOOK_SHARED_SECRET`
4. `PAY_URL_GENERAL`
5. `PAY_URL_VIP`

Usar primero links de pago reales solo si ya estas segura. Si no, hacer pruebas con una hoja de test y una preferencia controlada.

## Paso 4: desplegar Apps Script nuevo

Desplegar como Web App:

1. ejecutar como vos,
2. acceso `Anyone` solo para captura publica,
3. copiar la URL nueva.

Todavia no cambiar nada en la landing publicada.

## Paso 5: probar el alta de lead en paralelo

Probar manualmente contra la URL nueva, no contra la landing real.

Usar el ejemplo de [integrations/google-apps-script/README.md](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/integrations/google-apps-script/README.md).

Esperado:

1. responde `ok: true`,
2. devuelve `lead_id`,
3. devuelve `external_reference`,
4. aparece una fila nueva en la hoja de prueba,
5. si definiste `PAY_URL_*`, devuelve `init_point`.

Si esto falla, no tocar nada de produccion.

## Paso 6: montar el webhook nuevo aparte

Preparar el backend nuevo por separado usando:

1. [integrations/mercadopago-webhook/server.js](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/integrations/mercadopago-webhook/server.js)
2. [integrations/mercadopago-webhook/.env.example](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/integrations/mercadopago-webhook/.env.example)
3. [integrations/mercadopago-webhook/README.md](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/integrations/mercadopago-webhook/README.md)

No apuntar todavia Mercado Pago al webhook nuevo si no esta levantado y probado.

## Paso 7: configurar variables del webhook

Cargar:

1. `MP_ACCESS_TOKEN`
2. `APPS_SCRIPT_URL`
3. `APPS_SCRIPT_SHARED_SECRET`
4. `MP_WEBHOOK_PATH`
5. `PORT`

El `APPS_SCRIPT_SHARED_SECRET` tiene que ser exactamente el mismo que cargaste en Apps Script.

## Paso 8: probar el webhook sin tocar la landing

Hacer una prueba controlada al endpoint nuevo.

Primero:

1. verificar que `/health` responda bien,
2. verificar que el servidor reciba un POST,
3. verificar que pueda consultar a Mercado Pago,
4. verificar que pueda escribir en Apps Script usando `update_payment`.

Si el servidor no puede consultar Mercado Pago o no puede escribir en Apps Script, no pasar al corte.

## Paso 9: probar una compra completa de punta a punta

Recien aca conviene hacer una prueba real o semirreal:

1. generar un lead en la hoja nueva,
2. abrir checkout,
3. completar pago de prueba o controlado,
4. esperar webhook,
5. confirmar que la fila correcta se actualiza por `external_reference`.

Lo importante no es solo que haya pago. Lo importante es que quede conciliado en la fila correcta.

## Paso 10: definir el momento del corte

Solo hacer el cambio cuando estas cuatro cosas den bien:

1. alta de leads,
2. apertura de checkout,
3. webhook,
4. actualizacion de Sheets.

Si una de las cuatro falla, no cambiar produccion.

## Paso 11: cambio minimo en la landing

El cambio minimo esta en [index.html](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/index.html#L868).

La idea segura es tocar solo una cosa:

1. cambiar `LEAD_ENDPOINT_URL` a la URL nueva del Apps Script si hace falta.

No hacer cambios extra el mismo dia del corte.

## Paso 12: cambiar webhook de Mercado Pago

Cuando ya funciona el entorno nuevo, cambiar Mercado Pago para que notifique al webhook nuevo.

Hacer esto cerca de la ventana de prueba final, no dias antes sin monitoreo.

## Paso 13: monitorear el primer ciclo real

Despues del corte revisar en orden:

1. entra el lead,
2. abre el checkout,
3. llega el webhook,
4. se actualiza la fila,
5. no se duplican registros.

## Rollback rapido

Si algo falla, volver atras con estas dos acciones:

1. restaurar la URL anterior de la landing si se habia cambiado,
2. volver a la URL anterior del webhook en Mercado Pago si se habia cambiado.

Por eso el paso 1 era guardar todos los valores actuales.

## Orden mas seguro posible

Si queres el orden con menor riesgo real, es este:

1. Apps Script nuevo en hoja de prueba.
2. Webhook nuevo en entorno de prueba.
3. Compra de prueba completa.
4. Apps Script nuevo en hoja real o pestaña real.
5. Cambio de webhook.
6. Cambio minimo en landing.

## Recomendacion practica

No mezcles en el mismo momento:

1. rediseño de landing,
2. cambio de endpoint,
3. cambio de webhook,
4. cambio de planilla.

Separar esos movimientos baja mucho el riesgo de romper algo que hoy ya funciona.