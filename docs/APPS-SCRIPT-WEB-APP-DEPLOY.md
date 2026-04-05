# Apps Script Web App Deploy

## Objetivo

Desplegar `integrations/google-apps-script/Code.gs` como Web App publico para recibir `create_lead` y el webhook directo de Mercado Pago.

## Archivos fuente

- `integrations/google-apps-script/Code.gs`
- `integrations/google-apps-script/appsscript.json`

## Paso a paso

1. Crear un proyecto standalone en Google Apps Script.
2. Copiar el contenido de `Code.gs` y `appsscript.json`.
3. Cargar las Script Properties requeridas.
4. Ejecutar `authorizeServices` una vez para aprobar permisos.
5. Ir a Deploy > New deployment.
6. Elegir tipo `Web app`.
7. Ejecutar la app como el usuario que despliega.
8. Dar acceso a `Anyone` porque la landing y Mercado Pago necesitan llegar al endpoint.
9. Guardar la URL `/exec` como endpoint operativo.

## `/dev` vs `/exec`

- `/dev` sirve para pruebas y solo funciona para editores del script.
- `/exec` es la URL desplegada para operacion real.

## Reglas de despliegue

1. Desplegar una nueva version cada vez que cambie `Code.gs` o el manifest.
2. No usar la URL `/dev` en `index.html` ni en `MP_NOTIFICATION_URL`.
3. Si cambia el propietario o dominio del proyecto, volver a desplegar el Web App.
4. Evitar usar query params reservados `c` y `sid` en la Web App.

## Versionado y rollback

1. Registrar cada despliegue nuevo con fecha y motivo.
2. Guardar el Deployment ID y la version asociada.
3. Si el cambio rompe el flujo, volver a desplegar la version anterior.

## Verificacion minima despues del deploy

1. `GET /exec` devuelve `{"ok":true,"service":"lead-capture","version":1}`.
2. `create_lead` devuelve `init_point`.
3. `MP_NOTIFICATION_URL` apunta a la base `/exec` desplegada.
4. La simulacion del webhook llega al mismo Web App.

## Referencias oficiales

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/dashboard