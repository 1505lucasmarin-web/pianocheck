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

### Transcripción de audio a partitura (carga bajo demanda, sólo al transcribir)

| Archivo | Origen | Versión / licencia |
|---|---|---|
| basic-pitch/model.json + group1-shard1of1.bin | @spotify/basic-pitch/model (modelo TF.js "graph", 2 archivos) | @spotify/basic-pitch 1.0.1, Apache-2.0 |
| basic-pitch/LICENSE | licencia Apache-2.0 del paquete | |
| tfjs-lite.mjs | bundle ESM minificado (esbuild) de `@tensorflow/tfjs-core`, `-converter`, `-backend-cpu` y `-backend-webgl`, sin `tfjs-layers`/`tfjs-data`; exporta `loadGraphModel, setBackend, ready, getBackend, tensor, dispose, memory, env, engine` | TF.js 3.21.0, Apache-2.0 (mismo texto que basic-pitch/LICENSE) |

Tamaños: model.json 174 537 B, group1-shard1of1.bin 742 392 B, tfjs-lite.mjs 770 666 B (≈195 KB gzip). Total ≈ 1,7 MB, **precachear** estos 3 archivos (+ LICENSE) para el modo sin conexión.
js/transcribe.js los carga con `import()` / `fetch` sólo al transcribir (WebGL; CPU de respaldo). El audio nunca sale del dispositivo.
Reproducir el bundle: en un directorio temporal `npm i @spotify/basic-pitch@1.0.1 @tensorflow/tfjs-core@3.21.0 @tensorflow/tfjs-converter@3.21.0 @tensorflow/tfjs-backend-cpu@3.21.0 @tensorflow/tfjs-backend-webgl@3.21.0 esbuild` y `esbuild entry.js --bundle --minify --format=esm --target=es2020 --legal-comments=none`, con `entry.js` = los dos `import` de los backends + `export { loadGraphModel } from '@tensorflow/tfjs-converter'` + `export { setBackend, ready, getBackend, tensor, dispose, memory, env, engine } from '@tensorflow/tfjs-core'`.
