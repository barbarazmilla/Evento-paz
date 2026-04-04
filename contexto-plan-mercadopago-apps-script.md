# Contexto del Plan: Mercado Pago + Google Apps Script + Google Sheets

## Objetivo

Este documento deja por escrito el contexto y las consideraciones del plan para que este proyecto pueda registrar pagos aprobados de Mercado Pago en Google Sheets de forma confiable.

La idea central es que la confirmacion del pago no dependa del navegador del usuario, sino de una validacion server-side hecha por Google Apps Script a partir de un webhook de Mercado Pago.

## Objetivo de negocio

El objetivo no es solo guardar leads.

El objetivo real es poder:

- captar interesados desde la landing;
- enviarlos al checkout de Mercado Pago;
- saber que lead termino pagando;
- actualizar Google Sheets con el estado real del pago;
- medir ventas cerradas, no solo formularios completados.

## Estado actual del repo

Este repositorio es un sitio estatico. No hay backend propio ni package.json.

Ademas, el repo ahora incluye `apps_scripts.js` como copia versionada de referencia del Apps Script actual. Esa copia sirve para trazabilidad tecnica, pero la ejecucion real sigue ocurriendo fuera del repo.

Hoy el flujo principal vive en [index.html](index.html#L878) y funciona asi:

1. El usuario elige un ticket.
2. Se abre un modal.
3. Completa un formulario con nombre, email y telefono.
4. El frontend envia esos datos a un Google Apps Script.
5. El frontend espera recibir un `init_point` de Mercado Pago y abre el checkout.
6. Cuando Mercado Pago redirige de vuelta, la landing intenta informar el estado a Apps Script.

## Lo que ya existe y sirve

### 1. Captura de lead

La landing ya envia informacion al Google Apps Script desde [index.html](index.html#L914).

Actualmente manda:

- `nombre`
- `email`
- `telefono`
- `tipo_entrada`
- `fecha`
- `estado_pago = Pendiente`

### 2. Soporte para checkout dinamico

El frontend ya contempla que Apps Script devuelva un `init_point` dinamico en [index.html](index.html#L926).

Esto es importante porque significa que el sistema ya esta encaminado a crear preferencias dinamicas de Mercado Pago, en lugar de depender solamente de links fijos.

### 3. Retorno con parametros de Mercado Pago

La landing ya intenta leer estos parametros al volver desde Mercado Pago en [index.html](index.html#L950):

- `status` o `collection_status`
- `external_reference`
- `payment_id` o `collection_id`

Eso sirve como apoyo de UX y trazabilidad.

## Limitacion actual

La limitacion clave es esta:

el estado del pago todavia depende demasiado de que el usuario vuelva correctamente al sitio.

Eso no es una fuente de verdad confiable.

Puede fallar si:

- el usuario paga y no vuelve a la landing;
- cierra la pestana;
- el redirect falla;
- llega un estado incompleto o desfasado;
- el browser nunca ejecuta el `fetch` final hacia Apps Script.

Conclusión: volver a la landing no alcanza para marcar una venta como cobrada.

## Decisión de arquitectura

La arquitectura elegida para este proyecto es:

**Mercado Pago -> Webhook -> Google Apps Script -> Google Sheets**

Esto significa:

- la landing sigue captando leads y disparando el checkout;
- Google Apps Script se convierte en el backend minimo del flujo de pagos;
- Mercado Pago notifica los cambios de pago a Apps Script;
- Apps Script valida el evento y actualiza la hoja correspondiente.

## Fuente de verdad

La fuente de verdad del estado del pago debe ser:

1. el webhook validado de Mercado Pago;
2. la consulta server-side a la API de pagos de Mercado Pago;
3. la actualizacion de Google Sheets hecha por Apps Script.

El retorno del navegador queda solo como complemento para:

- mostrar mensajes al usuario;
- dejar rastros de navegacion;
- mejorar la experiencia de post-pago.

No debe usarse como unica confirmacion de cobro.

## Pieza tecnica clave: `external_reference`

Cada lead debe tener un identificador unico.

Ese identificador debe generarse en Apps Script antes de crear la preferencia de pago, guardarse en Google Sheets y enviarse a Mercado Pago como `external_reference`.

Ese valor es el que permite unir estas tres cosas:

- el lead en la landing;
- la preferencia creada en Mercado Pago;
- la fila correcta dentro de Google Sheets.

Sin `external_reference`, la conciliacion queda fragil y termina dependiendo de email, telefono, monto o timestamp, lo cual no es serio para automatizar pagos.

## Qué debe hacer Google Apps Script

Apps Script es la pieza principal del plan.

Debe asumir al menos estas responsabilidades:

### 1. Crear el lead y la preferencia

Cuando la landing mande el formulario, Apps Script debe:

1. generar un `external_reference` unico;
2. guardar una fila nueva en Google Sheets con estado `Pendiente`;
3. crear la preferencia de Mercado Pago;
4. incluir en la preferencia:
   - `external_reference`;
   - `notification_url`;
   - `back_urls`;
   - datos correctos del item o ticket;
5. devolver al frontend al menos:
   - `init_point`;
   - `external_reference`;
   - `preference_id`.

### 2. Recibir el webhook de Mercado Pago

Cuando Mercado Pago informe un evento `payment`, Apps Script debe:

1. responder rapido con HTTP `200` o `201`;
2. validar la autenticidad del webhook usando la firma `x-signature` y la clave secreta configurada en Mercado Pago;
3. leer el `data.id` del pago notificado;
4. consultar a la API de Mercado Pago para obtener el estado real del pago;
5. buscar la fila correcta en Google Sheets usando `external_reference` y/o `payment_id`;
6. actualizar el estado final del pago.

### 3. Registrar el retorno del navegador

El retorno del navegador puede seguir existiendo, pero como accion secundaria.

Sirve para guardar:

- `status`;
- `payment_id`;
- `external_reference`;
- informacion de regreso del usuario.

Si hay conflicto entre lo que trae el redirect del navegador y lo que confirma el webhook, debe ganar el webhook.

## Qué debe hacer la landing

La landing necesita pocos cambios conceptuales.

Su rol deberia quedar asi:

1. capturar nombre, email, telefono y tipo de ticket;
2. enviar el lead a Apps Script;
3. abrir el `init_point` devuelto por Apps Script;
4. leer los parametros del retorno;
5. mostrar mensajes de estado al usuario.

En otras palabras: la landing sigue siendo frontend y captacion. No deberia transformarse en el lugar donde se decide si un pago esta realmente aprobado.

## Consideraciones sobre `notification_url`

La `notification_url` debe apuntar a un endpoint HTTPS del Google Apps Script publicado como Web App.

Ese endpoint sera el receptor del webhook de Mercado Pago.

Si la `notification_url` se manda dentro de cada preferencia, esa configuracion tiene prioridad sobre la configuracion global del panel de Mercado Pago.

## Consideraciones sobre Google Sheets

La hoja deberia normalizarse para soportar trazabilidad real.

Columnas sugeridas:

- `external_reference`
- `preference_id`
- `payment_id`
- `payment_status`
- `payment_status_detail`
- `ticket_type`
- `nombre`
- `email`
- `telefono`
- `lead_created_at`
- `paid_at`
- `updated_at`
- `source`

No conviene depender de posiciones de columnas fragiles. Idealmente Apps Script deberia mapear por encabezado.

## Consideraciones de seguridad

- El Access Token de Mercado Pago no debe vivir en el frontend.
- La validacion del webhook debe hacerse server-side.
- La firma `x-signature` debe verificarse con la clave secreta generada en el panel de Mercado Pago.
- El endpoint publico de Apps Script no deberia aceptar actualizaciones de pago sin validacion.
- No hay que marcar pagos como aprobados solamente por el redirect del usuario.

### Limite practico de Google Apps Script puro

Si el webhook entra directamente a un Web App de Google Apps Script, hay que validar con cuidado hasta donde llega la seguridad real de esa opcion.

En Apps Script puro, el objeto `doPost(e)` expone query params y body, pero no esta pensado como un gateway HTTP completo. Eso vuelve dudosa o directamente inviable la verificacion robusta de headers como `x-signature` en todos los escenarios.

Conclusión operativa:

- si se sigue con Apps Script puro, hay que asumir esa limitacion y compensarla consultando siempre el pago real en Mercado Pago antes de actualizar la hoja;
- si se necesita validacion criptografica fuerte del webhook, conviene poner un servicio intermedio como Cloud Run delante del Apps Script o directamente delante de Google Sheets.

## Consideraciones operativas

- Mercado Pago puede reenviar notificaciones, por lo que el procesamiento debe ser idempotente.
- Apps Script debe poder recibir el mismo evento mas de una vez sin duplicar filas ni degradar estados.
- Conviene registrar logs minimos con `external_reference`, `payment_id`, accion y resultado.
- El codigo del Apps Script hoy no vive en este repo, asi que hay riesgo de operar logica critica fuera de versionado.

## Riesgo actual del proyecto

El mayor riesgo no esta en el HTML.

El mayor riesgo es que el Apps Script hoy todavia no esta tratado como backend de conciliacion de pagos.

Mientras eso no exista, el proyecto puede captar leads y mandar gente a pagar, pero no tendra una forma robusta de saber que venta se cerro realmente.

## Fases del plan

### Fase 1: contrato y trazabilidad

- definir el contrato entre frontend y Apps Script;
- generar `external_reference` unico;
- guardar la fila inicial en Google Sheets;
- devolver `init_point`, `external_reference` y `preference_id`.

### Fase 2: confirmacion real del pago

- crear la preferencia con `notification_url` y `back_urls`;
- recibir webhook `payment`;
- validar firma;
- consultar el pago real en Mercado Pago;
- actualizar Google Sheets.

### Fase 3: soporte UX y retorno

- mantener el retorno del navegador;
- mostrar mensajes segun `status`;
- registrar ese retorno sin usarlo como unica fuente de verdad.

### Fase 4: pruebas y endurecimiento

- simular webhooks desde Mercado Pago;
- validar actualizacion de la fila correcta;
- probar reintentos;
- revisar logs y casos de error.

## Caminos de implementación

El plan admite tres caminos concretos de ejecucion. No son equivalentes: cambian el nivel de seguridad, complejidad y velocidad de salida.

### Camino 1: Apps Script endurecido, sin salir de Google Apps Script

Este camino sirve para avanzar rapido sin agregar infraestructura nueva.

Implica:

- endurecer el Apps Script actual;
- mantener `Mercado Pago -> Apps Script -> Sheets`;
- aceptar la limitacion de headers del Web App;
- no confiar en el redirect del navegador para estados finales;
- consultar siempre `payments/{id}` antes de escribir el estado en Sheets;
- mapear columnas por encabezado y no por posicion fija.

Ventajas:

- menor costo operativo;
- menor tiempo de implementacion;
- no agrega servicios nuevos.

Tradeoff:

- la validacion fuerte de `x-signature` queda limitada o incompleta si todo entra directo a Apps Script.

### Camino 2: Cloud Run delante del webhook

Este camino es el recomendado si el objetivo es una conciliacion mas seria y segura.

Implica:

- mover la recepcion del webhook a Cloud Run;
- validar ahi `x-signature` y `x-request-id`;
- consultar el pago real en Mercado Pago desde ese servicio;
- recien despues actualizar Sheets o invocar Apps Script con una llamada interna controlada.

Arquitectura:

**Mercado Pago -> Cloud Run -> Apps Script o Sheets**

Ventajas:

- permite validacion criptografica real del webhook;
- separa mejor seguridad, integracion y persistencia;
- deja a Apps Script como capa de automatizacion y no como borde publico principal.

Tradeoff:

- agrega infraestructura, despliegue y observabilidad.

### Camino 3: contrato final frontend + Apps Script + hoja

Este camino sirve para cerrar el contrato funcional y evitar romper el flujo actual de `index.html` mientras se endurece la arquitectura.

Implica definir con precision:

- que campos envia el frontend;
- que campos devuelve Apps Script;
- que columnas debe tener la hoja;
- que hace el redirect del navegador y que no debe hacer;
- que hace el webhook y cual es la fuente de verdad final.

Este camino no reemplaza a los otros dos: los ordena y reduce errores de integracion.

## Siguiente paso recomendado

El siguiente paso util depende de la exigencia real del proyecto:

1. Si la prioridad es salir rapido sin sumar infraestructura, conviene devolver una version endurecida del Apps Script y seguir temporalmente con Apps Script puro.
2. Si la prioridad es seguridad y trazabilidad robusta, conviene pasar el webhook por Cloud Run y validar firma antes de tocar Sheets.
3. Si la prioridad inmediata es no romper el flujo actual del sitio, conviene cerrar primero el contrato final entre hoja, Apps Script y frontend.

## Criterio de exito

Este plan esta bien implementado cuando se cumple todo esto:

1. cada lead genera un `external_reference` unico;
2. cada checkout se crea con una preferencia dinamica;
3. Mercado Pago notifica el pago a Apps Script;
4. Apps Script valida el evento y consulta el pago real;
5. Google Sheets se actualiza con el estado final correcto;
6. la venta puede trazarse de punta a punta sin depender del navegador del usuario.

## Conclusión

El flujo actual del frontend ya tiene una base util.

Lo que falta no es rehacer la landing, sino cerrar correctamente la arquitectura del lado de Google Apps Script y Mercado Pago.

En este proyecto, la implementacion robusta consiste en mover la confirmacion del pago desde el navegador del usuario hacia un flujo validado server-side con webhook, consulta a la API de Mercado Pago y actualizacion confiable de Google Sheets.