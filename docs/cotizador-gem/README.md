# Cotizador Ingenio Webs — Paquete para Gemini Gem

Subí estos archivos / textos al Gem para que genere el plan de trabajo en el JSON que consume el Cotizador de la plataforma.

## Orden recomendado al armar el Gem

1. Pegá el contenido de `system-prompt.md` como instrucciones del Gem.
2. Adjuntá o pegá `schema.json` como referencia de salida obligatoria.
3. Pegá `few-shot-examples.md` como ejemplos.
4. Usá `user-prompt-template.md` cada vez que pidas una cotización.

## Flujo

1. Le pedís al Gem una cotización con el prompt de usuario.
2. El Gem responde **solo** con JSON válido (sin markdown, sin texto extra).
3. Copiás el JSON y lo pegás en `/plataforma/cotizador`.
4. En el cotizador (puente) definís lo comercial: **horas**, **costo/hora**, **descuento opcional**, **esquema de pago** y **medio de pago**. El Gem no decide montos ni condiciones de cobro.
5. Generás el PDF con ID `IQ-YYYY-NNNN` (incluye inversión + condiciones comerciales) y abrís Gmail para adjuntarlo.
