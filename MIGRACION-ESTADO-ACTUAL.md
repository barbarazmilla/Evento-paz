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

## Pendiente de confirmar fuera del repo

### Mercado Pago

- URL del webhook actual en produccion: pendiente de confirmar.
- Si hoy no existe webhook configurado: dejar asentado explicitamente.

### Google Sheets

- Nombre exacto de la hoja actual: pendiente de confirmar.
- Si se usara una pestaña nueva para pruebas, definir nombre sugerido: `Leads_Test_Migracion`.

## Regla operativa

Hasta que el flujo nuevo no pase las pruebas completas en paralelo, no cambiar:

1. la URL actual de la landing,
2. los links actuales de Mercado Pago,
3. el webhook actual si existe,
4. la hoja real actual.