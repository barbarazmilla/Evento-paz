# Changelog

## 2026-04-05

### Documentacion de diagnostico sandbox

- se actualizo la documentacion operativa para dejar por escrito el estado real de la investigacion del Checkout Pro de prueba antes de aplicar cambios de codigo;
- se registro que el checkout dinamico abre, el lead se guarda en Sheets y existen actualizaciones parciales via webhook, pero aun no se obtuvo un pago de tarjeta de prueba en estado `approved`;
- se documento como dato operativo que el panel de `Credenciales de prueba` hoy puede mostrar Access Token sandbox con prefijo `APP_USR-`, por lo que el prefijo ya no alcanza por si solo para distinguir sandbox de produccion;
- se dejaron anotadas las pistas principales del problema actual: uso de `payer.email` tomado del formulario, al menos una entrega de webhook con `502`, evaluacion MCP con `Payment was not originated from app` y pagos observados con estados `pending_waiting`, `deferred_retry` y `by_payer`;
- esta entrada consolida diagnostico y contexto; no implica todavia una correccion funcional del flujo.

### Ajustes del Apps Script para pruebas de Checkout Pro

- se movio la ruta de webhook dentro del `try/catch` de `doPost()` para evitar que un error interno termine en `502` sin respuesta JSON controlada;
- se reemplazo `payer.name` por `payer.first_name` y `payer.last_name` en la preferencia de Mercado Pago;
- se agregaron `statement_descriptor`, `items.category_id` y `binary_mode: true` a la preferencia para mejorar trazabilidad y hacer mas determinista el resultado del pago de prueba;
- queda pendiente desplegar la version nueva del Apps Script y volver a certificar el flujo sandbox con comprador y tarjeta de prueba.

## 2026-04-04

### Seguridad y flujo de pagos

- se endurecio la landing publica para quitar la actualizacion client-side del estado de pago basada en query params;
- se agregaron reglas de `.gitignore` para secretos, certificados, entornos y carpetas de editor;
- se agrego `gitleaks` en GitHub Actions para escaneo de secretos;
- se documento la postura de seguridad en `SECURITY.md` y `PAYMENT-HARDENING.md`.

### Integracion paralela

- se creo una base nueva de Google Apps Script en `integrations/google-apps-script/Code.gs`;
- se creo un webhook server-side en Render basado en `integrations/mercadopago-webhook/server.js`;
- se desplego el webhook paralelo en `https://evento-paz.onrender.com/webhooks/mercadopago`;
- se desplego el Apps Script paralelo en `https://script.google.com/macros/s/AKfycbwR3rQ6_iDrIwr15NrsjuMifOAJNFCgmCGBZ7k4JZcJLh2Krx5hhFfTmks3O3-Oi49wNA/exec`.

### Correccion de arquitectura

- se detecto que el primer intento de corte fallaba porque el Apps Script nuevo devolvia links fijos `mpago.li` y no una preferencia dinamica;
- se corrigio el Apps Script paralelo para crear preferencias dinamicas de Mercado Pago con `external_reference`, `preference_id` e `init_point`;
- se corrigio la landing para no caer al link fijo si el `init_point` no existe.

### Validaciones realizadas

- `create_lead` validado contra el Apps Script paralelo;
- fila nueva validada en `Leads_Test_Migracion`;
- `external_reference` validado en la hoja;
- `preference_id` e `init_point` dinamico validados en consola;
- checkout de Mercado Pago validado para `Entrada VIP` por `$100.000`.

### Produccion

- el webhook global productivo de Mercado Pago fue restaurado a la URL anterior luego de detectar `lead_not_found` durante un corte prematuro;
- la landing publica y los links productivos actuales no fueron reemplazados;
- queda pendiente una prueba final de pago real controlado o una prueba sandbox funcional para certificar el tramo `Mercado Pago -> webhook -> Apps Script -> Sheets`.