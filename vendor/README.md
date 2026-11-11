# vendor/

Copiado desde npm (sin modificar salvo renombrar), sin CDN en runtime.

| Archivo | Origen | Versión |
|---|---|---|
| pdf.min.mjs | pdfjs-dist/build/pdf.min.mjs | pdfjs-dist 6.5.438 |
| pdf.worker.min.mjs | pdfjs-dist/build/pdf.worker.min.mjs | pdfjs-dist 6.5.438 |
| fflate.mjs | fflate/esm/browser.js | fflate 0.8.3 |
| pdfjs-LICENSE, fflate-LICENSE | licencias (Apache-2.0 / MIT) | |

js/importers.js importa `../vendor/fflate.mjs` (estático) y `../vendor/pdf.min.mjs` (dinámico); el worker se carga desde `../vendor/pdf.worker.min.mjs`.

| Archivo | Origen | Versión |
|---|---|---|
| qrcode-generator.mjs | qrcode-generator/dist/qrcode.mjs (Kazuhiko Arase) | qrcode-generator 2.0.4 (MIT) |
| qrcode-generator-LICENSE | encabezado de licencia MIT del mismo archivo | |

js/app.js lo importa bajo demanda (`../vendor/qrcode-generator.mjs`) sólo al mostrar el código de "Pasar ajustes a otro dispositivo".
