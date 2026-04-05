# Changelog

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