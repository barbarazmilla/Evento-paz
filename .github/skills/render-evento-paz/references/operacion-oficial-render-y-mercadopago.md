# Operacion Oficial Render y Mercado Pago

Resumen corto para respaldar la skill con datos oficiales y traducirlos al flujo real de este repo.

## Render

### Health checks

- Los health checks aplican a web services.
- Render considera sana una respuesta `2xx` o `3xx`.
- El timeout de cada health check es de 5 segundos.
- Si una instancia activa falla health checks durante 15 segundos, Render deja de enrutar trafico hacia esa instancia.
- Si sigue fallando durante 60 segundos, Render reinicia el servicio.
- Durante deploys zero-downtime, si la nueva instancia no pasa health checks durante 15 minutos, Render cancela el deploy.

### Logs

- Render expone logs de runtime desde la pagina Logs del servicio.
- Tambien expone logs por deploy desde Events.
- Los HTTP request logs existen para web services y dependen del plan.
- Los filtros utiles del dashboard incluyen `method`, `status_code`, `path`, `instance` y rango temporal.

### Deploys y reinicios

- Render soporta deploy automatico y manual.
- El dashboard permite `Deploy latest commit`, `Deploy a specific commit`, `Clear build cache & deploy` y `Restart service`.
- `Deploy a specific commit` desactiva auto-deploy para ese servicio.
- `Restart service` levanta una nueva instancia con el mismo commit y la misma configuracion ya desplegada.
- Un restart no sirve para incorporar cambios de variables de entorno que aun no fueron desplegados.

### Variables de entorno

- Render agrega variables por defecto como `RENDER`, `RENDER_EXTERNAL_URL`, `RENDER_GIT_COMMIT` y `RENDER_SERVICE_NAME`.
- Para web services, `PORT` es configurable y el default es `10000`.
- Las variables sensibles de negocio siguen siendo responsabilidad del servicio, no del frontend.

## Mercado Pago

### Webhooks

- Las notificaciones por webhook se entregan por `HTTPS POST`.
- La URL puede configurarse desde `Your integrations` o durante la creacion del pago, preferencia u orden.
- Si se define una URL durante la creacion del pago o preferencia, esa URL tiene prioridad.
- Para flows tipo Checkout Pro y `payment`, la carga trae `type`, `action` y `data.id`.

### Confirmacion y reintentos

- El receptor debe devolver `HTTP 200` o `HTTP 201` para confirmar recepcion.
- Mercado Pago espera esa confirmacion durante 22 segundos.
- Si no llega, reintenta cada 15 minutos y luego extiende el intervalo, pero sigue intentando.

### Validacion de origen

- Mercado Pago emite `x-signature` para validar autenticidad del webhook.
- La verificacion usa `HMAC SHA256` con el secreto configurado para la aplicacion.
- El manifiesto base usa `data.id`, `x-request-id` y `ts`.
- Si `data.id` llega como identificador alfanumerico, debe normalizarse a lowercase para la validacion.

### Consulta del recurso real

- La notificacion no debe ser la unica fuente de verdad de negocio.
- Despues de confirmar recepcion, corresponde consultar el recurso real en la API oficial.
- Para el topic `payment`, la consulta oficial es `GET /v1/payments/[ID]`.

### Pruebas

- Mercado Pago provee simulacion de notificaciones desde el dashboard.
- La propia documentacion aclara que ciertos flujos de prueba no emiten notificaciones reales.
- Cuando eso aplique, la recepcion del webhook debe verificarse con la simulacion y no con una falsa expectativa sobre pagos de test.

## Lectura aplicada a Evento Paz

- Este repo usa Render como web service minimo para recibir el webhook y consultar `GET /v1/payments/{id}`.
- La landing publica no debe mover secretos ni confirmar pagos.
- El cierre correcto sigue siendo `Mercado Pago -> webhook en Render -> API oficial -> update_payment -> Apps Script -> Sheets`.
- La mejora pendiente consistente con documentacion oficial es implementar validacion de `x-signature` en el webhook desplegado.