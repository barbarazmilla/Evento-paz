# Deploy Cutover

## Objetivo

Cambiar la landing publica desde el flujo viejo al flujo nuevo sin perder captura de leads ni conciliacion de pagos.

## Orden recomendado

1. Desplegar Google Apps Script nuevo.
2. Configurar Script Properties reales.
3. Probar `create_lead` manualmente.
4. Desplegar webhook server-side.
5. Configurar variables de entorno reales del webhook.
6. Configurar webhook de Mercado Pago apuntando al backend nuevo.
7. Reemplazar en la landing la URL de `LEAD_ENDPOINT_URL` por la nueva si cambia.
8. Ejecutar una compra de prueba completa.

## Estado actual del cutover

Durante la sesion 2026-04-04 se valido en paralelo hasta el paso 7 conceptual, pero no se completo el paso 8.

Ya esta validado:

1. captura del lead,
2. guardado en hoja de prueba,
3. generacion de `external_reference`,
4. creacion de preferencia dinamica,
5. apertura correcta del checkout,
6. disponibilidad del webhook nuevo en Render.

Todavia no esta validado:

1. pago confirmado por Mercado Pago,
2. consulta del pago real desde el webhook,
3. actualizacion final de la fila correcta en Sheets.

Por eso el webhook global productivo fue devuelto a la URL anterior.

## Cambio minimo en la landing

La landing ya usa una constante unica:

- `LEAD_ENDPOINT_URL` en [index.html](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/index.html#L869)

Si el Apps Script se despliega en otra URL, solo hace falta cambiar ese valor.

## Prueba manual de lead

Esperado:

- la respuesta debe incluir `ok: true`
- debe devolver `lead_id`
- debe devolver `external_reference`
- puede devolver `init_point`

## Prueba manual de pago

Esperado:

- Mercado Pago llama al webhook nuevo
- el webhook consulta la API oficial
- Apps Script recibe `update_payment` con secreto compartido
- la fila correcta en Sheets se actualiza por `external_reference`

## Señales de rollback

Volver al estado anterior si pasa alguna de estas:

1. El lead deja de registrarse en Sheets.
2. El checkout deja de abrirse.
3. El webhook recibe eventos pero no puede consultar la API oficial.
4. Apps Script responde `forbidden` o `lead_not_found` en conciliacion.

## Observacion

El webhook nuevo elimina la dependencia del navegador para confirmar pagos. Esa es la mejora de seguridad principal del cutover.

Hasta que no se certifique la actualizacion final de la fila correcta con un pago real o una prueba sandbox funcional, no conviene volver a cambiar el webhook global productivo.