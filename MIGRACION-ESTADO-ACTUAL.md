# Estado Actual De Integracion

Este archivo es la foto del estado actual antes de tocar produccion.

## Detectado desde el repo

### Landing publica

- Lead endpoint actual en [index.html](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/index.html#L870)
- Valor actual: `https://script.google.com/macros/s/AKfycbysr6cZPeJ93ZaTLwzlK1HNExBTVfs1bVgHM9YrF8PAEJUmXBPk_chOxnqtR8_1uhFo/exec`

### Links de pago actuales

- General en [index.html](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/index.html#L798)
- Valor actual: `https://mpago.li/1kxBrx5`
- VIP en [index.html](/Users/barbarazuniga/Desktop/IMPULZIA%20/Paz%20Cornú/index.html#L811)
- Valor actual: `https://mpago.li/1hRHsui`

### Estrategia elegida para migracion

- Probar primero en una pestaña nueva dentro de la misma planilla.
- Pensar el webhook nuevo para desplegar en Render.

### Estado confirmado durante la sesion 2026-04-04

- Apps Script paralelo probado en: `https://script.google.com/macros/s/AKfycbwR3rQ6_iDrIwr15NrsjuMifOAJNFCgmCGBZ7k4JZcJLh2Krx5hhFfTmks3O3-Oi49wNA/exec`
- Webhook nuevo desplegado en Render: `https://evento-paz.onrender.com/webhooks/mercadopago`
- Healthcheck de Render verificado en: `https://evento-paz.onrender.com/health`
- `create_lead` paralelo validado con:
	- `lead_id`
	- `external_reference`
	- `preference_id`
	- `init_point` dinamico de Mercado Pago
- Apertura de checkout dinamico validada para VIP `$100.000`.
- Webhook global productivo de Mercado Pago restaurado a la URL anterior despues de detectar `lead_not_found` en el corte prematuro.

## Pendiente de confirmar fuera del repo

### Mercado Pago

- URL del webhook actual en produccion: restaurada a la URL anterior del Apps Script para no afectar conciliacion real.
- URL del webhook nuevo en paralelo: `https://evento-paz.onrender.com/webhooks/mercadopago`
- Pendiente: prueba final de pago real o sandbox funcional para certificar la actualizacion final de la fila correcta.

### Google Sheets

- Nombre exacto de la hoja actual: pendiente de confirmar.
- Si se usara una pestaña nueva para pruebas, definir nombre sugerido: `Leads_Test_Migracion`.

## Regla operativa

Hasta que el flujo nuevo no pase las pruebas completas en paralelo, no cambiar:

1. la URL actual de la landing,
2. los links actuales de Mercado Pago,
3. el webhook actual si existe,
4. la hoja real actual.

## Estado de cierre de esta fase

Quedo validado todo el flujo hasta checkout dinamico.

Queda pendiente una unica validacion operativa:

1. ejecutar un pago real controlado o una prueba sandbox funcional,
2. confirmar que el webhook nuevo actualiza la fila correcta por `external_reference`,
3. recien despues evaluar un corte minimo sobre produccion.