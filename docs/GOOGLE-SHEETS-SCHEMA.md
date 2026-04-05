# Google Sheets Schema

## Objetivo

Dejar documentada la estructura exacta de Google Sheets que usa el Apps Script para leads y conciliacion.

## Estructura operativa

1. Un Spreadsheet principal.
2. Una hoja operativa, por defecto `Leads`.
3. Una primera fila con encabezados exactos.

## Encabezados exactos

```text
created_at
updated_at
lead_id
external_reference
payment_status
payment_status_detail
payment_id
nombre
email
telefono
tipo_entrada
monto_esperado
transaction_amount
currency_id
source
fecha_confirmacion
```

## Significado de cada campo

- `created_at`: fecha ISO del alta inicial.
- `updated_at`: fecha ISO de la ultima mutacion.
- `lead_id`: identificador interno del lead.
- `external_reference`: join key entre lead, preferencia y pago.
- `payment_status`: estado real del pago.
- `payment_status_detail`: detalle del estado.
- `payment_id`: ID oficial del pago en Mercado Pago.
- `nombre`, `email`, `telefono`: datos del asistente.
- `tipo_entrada`: ticket elegido.
- `monto_esperado`: monto esperado segun ticket.
- `transaction_amount`: monto cobrado real.
- `currency_id`: moneda del pago.
- `source`: origen del lead.
- `fecha_confirmacion`: fecha oficial de aprobacion si existe.

## Reglas operativas

1. No renombrar encabezados una vez puesto en marcha.
2. No usar email o telefono como clave de conciliacion.
3. Mantener `external_reference` como join key central.
4. Hacer backup del Sheet antes de cambios estructurales.

## Permisos recomendados

1. El propietario del Apps Script debe tener permisos de edicion.
2. El equipo operativo puede tener permisos de lectura o edicion segun necesidad.
3. Evitar compartir el documento con accesos innecesarios.

## Validacion minima

1. El script puede abrir el Spreadsheet por `SPREADSHEET_ID`.
2. La hoja existe o puede ser creada automaticamente.
3. Los headers coinciden exactamente con `SHEET_HEADERS` del script.

## Referencias internas

- `integrations/google-apps-script/Code.gs`