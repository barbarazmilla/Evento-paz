# Contexto Del Plan Mercado Pago + Apps Script

Este archivo se conserva por compatibilidad operativa porque historicamente fue el punto de entrada del flujo de pagos.

La fuente de verdad actual ya no esta aca.

## Leer primero

1. `ARQUITECTURA-ACTUAL.md`
2. `ESTADO-ACTUAL.md`
3. `GOOGLE-APPS-SCRIPT-EN-ESTE-PROYECTO.md`
4. `OPERACION-Y-VERIFICACION.md`

## Regla que sigue vigente

La confirmacion real del pago no debe depender del navegador.

La fuente de verdad es:

`Mercado Pago -> webhook server-side -> consulta API oficial -> update_payment -> Google Sheets`

## Papel de Apps Script

Apps Script sigue siendo el backend minimo del proyecto para:

1. recibir `create_lead`,
2. escribir la fila inicial,
3. crear la preferencia dinamica,
4. recibir `update_payment` autenticado,
5. actualizar la fila correcta por `external_reference`.

## Historial

La documentacion transitoria de migracion y cutover ya no forma parte del recorrido activo del repo.

Si hace falta reconstruir decisiones viejas, conviene usar `CHANGELOG.md` y el historial de git, no documentos legacy dentro de la raiz operativa.
