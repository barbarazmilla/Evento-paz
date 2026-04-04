# Evento Paz

Repositorio de la landing estatica del evento y de la documentacion operativa asociada al flujo de checkout con Mercado Pago.

## Que hay en este repo

- `index.html`: landing principal del evento.
- `landing.html`: variante alternativa.
- `landing-tiendanube.html`: variante aislada para Tienda Nube.
- `apps_scripts.js`: copia versionada de referencia del Google Apps Script que hoy corre fuera del repo.
- `contexto-plan-mercadopago-apps-script.md`: plan arquitectonico y decisiones del flujo de pago.
- `propuesta-comercial-evento.md`: contexto comercial y de alcance.

## Modelo operativo

El sitio es frontend estatico.

La ejecucion real de pagos, webhooks, integracion con Mercado Pago y actualizacion de Google Sheets vive fuera del repo en Google Apps Script.

La copia de `apps_scripts.js` existe para:

- dejar trazabilidad tecnica del script actual;
- revisar cambios de contrato entre frontend y backend;
- reducir el riesgo de operar logica critica completamente fuera de versionado.

No existe pipeline de build ni tests automaticos.

## Flujo actual

1. El usuario elige ticket en `index.html`.
2. La landing abre el modal y captura lead.
3. El frontend envia los datos al Apps Script.
4. El Apps Script devuelve `init_point`.
5. El usuario va al checkout de Mercado Pago.
6. La landing puede recibir parametros de retorno para UX.
7. La confirmacion real del pago debe venir del webhook y de la consulta server-side a Mercado Pago.

## Estado validado en paralelo

Durante la sesion del 2026-04-04 se valido en paralelo este flujo nuevo:

1. Apps Script paralelo recibe `create_lead`.
2. Guarda el lead en `Leads_Test_Migracion` con `external_reference` unico.
3. Crea una preferencia dinamica de Mercado Pago con `preference_id` e `init_point`.
4. Render expone el webhook nuevo y responde correctamente en `/health`.
5. El checkout dinamico abre correctamente en Mercado Pago para la entrada VIP de `$100.000`.

Todavia no esta certificada de punta a punta la etapa final `Mercado Pago -> webhook -> actualizacion de Sheets` porque no se ejecuto un pago real ni una prueba con credenciales sandbox operativas.

## Estado de produccion

- La landing publica sigue apuntando al Apps Script anterior en `LEAD_ENDPOINT_URL`.
- El webhook global de Mercado Pago fue restaurado a la URL anterior para no romper conciliacion real.
- El flujo nuevo sigue desplegado en paralelo en `dev-barbara` y en Render, listo para una prueba final controlada.

## Documentos clave

- Para arquitectura de pagos: `contexto-plan-mercadopago-apps-script.md`
- Para reglas de trabajo del repo: `.github/copilot-instructions.md`
- Para contexto comercial: `propuesta-comercial-evento.md`

## Verificacion manual

- usar Live Server en el puerto `5501`;
- revisar layout desktop y mobile;
- probar modal y formulario;
- verificar que el frontend siga esperando `init_point`;
- revisar comportamiento del retorno post-pago sin tratarlo como fuente final de verdad.

## Nota importante

Si se cambia la logica del Apps Script en produccion y ese cambio no se refleja en `apps_scripts.js`, la documentacion del repo puede quedar desfasada. Cuando el flujo de pago sea parte de una decision importante, confirmar que la copia versionada sigue alineada con el despliegue real.