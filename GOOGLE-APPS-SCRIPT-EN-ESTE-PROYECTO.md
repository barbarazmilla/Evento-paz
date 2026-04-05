# Google Apps Script En Este Proyecto

## Que es aca

En este proyecto, Google Apps Script cumple el rol de backend minimo.

No renderiza la landing y no reemplaza a Mercado Pago.

Hace tres trabajos concretos:

1. recibe el lead desde la landing,
2. escribe la fila inicial en Google Sheets,
3. crea la preferencia de Mercado Pago y devuelve el `init_point`.

Despues recibe la actualizacion privada del webhook y actualiza la conciliacion.

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

## Que hace cuando llega `update_payment`

1. Recibe un JSON desde el webhook server-side.
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

## Regla simple para operar bien

Si una venta puede marcarse como aprobada sin pasar por el webhook y la API oficial de Mercado Pago, la integracion esta mal cerrada.
