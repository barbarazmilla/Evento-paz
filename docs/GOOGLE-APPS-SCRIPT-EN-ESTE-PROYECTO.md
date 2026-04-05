# Google Apps Script En Este Proyecto

## Que es aca

En este proyecto, Google Apps Script cumple el rol de backend minimo.

La unica app activa para este rol es `Paz Cornu Migracion Segura`.

No renderiza la landing y no reemplaza a Mercado Pago.

Hace cuatro trabajos concretos:

1. recibe el lead desde la landing,
2. escribe la fila inicial en Google Sheets,
3. crea la preferencia de Mercado Pago y devuelve el `init_point`,
4. recibe el webhook directo de Mercado Pago, consulta la API oficial y actualiza la conciliacion.

## Como pensarlo en una clase

Si explicaras este sistema en un pizarron, la idea seria esta:

- La landing vende.
- Mercado Pago cobra.
- El webhook confirma.
- Apps Script ordena y escribe.
- Sheets guarda el estado.

Apps Script no es la caja ni el mostrador. Es el administrativo que anota cada operacion y conecta las piezas.

## Que hace cuando llega `create_lead`

1. Lee el payload enviado desde `index.html`.
2. Valida `nombre`, `email` y `tipo_entrada`.
3. Rechaza spam basico usando un honeypot.
4. Evita duplicados inmediatos con una ventana de cache.
5. Genera `lead_id` y `external_reference`.
6. Calcula el monto esperado segun el ticket.
7. Escribe una fila nueva en la hoja.
8. Crea una preferencia en Mercado Pago usando credenciales privadas guardadas en Script Properties.
9. Devuelve `init_point` al frontend.

## Que hace cuando llega el webhook directo de Mercado Pago

1. Recibe la notificacion `payment` en el mismo Web App.
2. Exige `webhook_secret` por query string en la URL de notificacion.
3. Extrae `payment_id` del body o del query param recibido.
4. Consulta la API oficial de Mercado Pago usando `MP_ACCESS_TOKEN`.
5. Busca la fila correcta por `external_reference`.
6. Actualiza `payment_status`, `payment_status_detail`, `payment_id`, monto, moneda y fecha.

## Para que queda `update_payment`

1. Recibe un JSON solo para operacion controlada o pruebas privadas.
2. Exige `webhook_secret`.
3. Busca la fila por `external_reference`.
4. Actualiza `payment_status`, `payment_status_detail`, `payment_id`, monto, moneda y fecha.

Eso evita que el navegador cierre ventas por su cuenta.

## Por que `external_reference` importa tanto

Porque es el hilo comun entre:

1. el lead creado,
2. la preferencia generada,
3. el pago confirmado,
4. la fila correcta en Sheets.

Sin ese dato, la conciliacion depende de email, telefono o timestamps y eso es fragil.

## Por que no alcanza con el retorno del navegador

Porque cualquier visitante puede volver con una URL manipulada.

Parametros como `status`, `payment_id` o `external_reference` son utiles para UX, pero no son prueba de cobro.

La confirmacion real tiene que venir del servidor que consulta a Mercado Pago con credenciales privadas.

## Limites de esta solucion

Apps Script sirve para este volumen y para una operacion liviana, pero sigue siendo una solucion serverless minima.

No reemplaza a un backend dedicado si el proyecto necesita:

1. mas observabilidad,
2. colas o reintentos avanzados,
3. firmas y seguridad mas robusta,
4. alta concurrencia,
5. auditoria fuerte.

La documentacion oficial de Apps Script Web Apps describe query params y body en `doPost`, pero no documenta de la misma forma acceso a headers entrantes personalizados. Por eso, este repo usa `webhook_secret` dentro de la URL de notificacion mas la consulta oficial a Mercado Pago como compuerta actual del webhook.

## Regla simple para operar bien

Si una venta puede marcarse como aprobada sin pasar por el webhook y la API oficial de Mercado Pago, la integracion esta mal cerrada.

`Formulario Paz` queda fuera del flujo vigente y no debe reutilizarse para la operacion actual.
