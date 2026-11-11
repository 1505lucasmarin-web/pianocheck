# PianoCheck

App web instalable (PWA) para practicar piano con un Roland FP-30X por MIDI (USB o Bluetooth) en Chrome para Android.

## Publicar en GitHub Pages
1. Crear un repositorio público (por ej. `pianocheck`) en github.com.
2. Subir TODO el contenido de esta carpeta a la rama `main` (Add file → Upload files, o `git push`).
3. Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)` → Save.
4. Abrir `https://USUARIO.github.io/pianocheck/` en Chrome del celular/tablet → menú ⋮ → "Instalar app".

## Uso
- Ajustes: elegir proveedor de IA (Anthropic o Gemini) y pegar la API key (queda sólo en el dispositivo).
- Nueva partitura: pedir una canción (la IA la arma de memoria; nivel principiante/intermedio/pro), foto, imágenes, PDF, MusicXML o MIDI. Revisar y corregir notas antes de guardar.
- Práctica: conectar el piano (USB con cable OTG, o Bluetooth), tocar. Se detiene al superar 5 errores seguidos.
- Micrófono (alternativa al MIDI): en Práctica tocá «Micrófono» y apoyá el celular/tablet sobre el piano (acústico o digital con parlantes); la sensibilidad se ajusta en Ajustes. Usá auriculares para el metrónomo. Si hay un piano MIDI conectado, el micrófono se ignora.
- Piano guía: en Práctica el teclado de abajo siempre se ve. Con «Guía» activada ilumina las notas que siguen (MD latón y círculo, MI azul y cuadrado), marca lo que tocás (verde/rojo) y, si errás, dibuja una flecha y dice cuánto moverte («Movete 1 tono a la derecha → Sol4»). El ajuste «Tocar en el teclado de pantalla» sólo hace que esas teclas respondan al toque.
- Frases que se repiten: la app detecta frases repetidas en la melodía (A, A′, B…), las marca sobre la partitura y en la leyenda «Estructura» (tocá una letra para ir a esa frase) y avisa al llegar a una que ya tocaste. Se apaga con «Marcar frases repetidas» en Ajustes.
- Partitura continua (vista por defecto en Práctica): toda la pieza en una sola fila; la marca avanza desde la izquierda hasta el centro y desde ahí se desplaza la partitura (con transición suave; respeta «reducir movimiento»), y al final la marca vuelve a avanzar hacia la derecha. Un bloque fijo con claves, armadura y compás queda a la izquierda al desplazarse. Se dibuja una sola vez (por tramos de SVG contiguos); sólo se mueve y se colorea.
- Mirar adelante o atrás: arrastrá la partitura con el dedo, o tocá una letra de «Estructura»; al tocar la próxima nota vuelve suavemente a la marca.
- Ajustes → Vista de la partitura: «Continua (recomendada)» o «Por página» (la vista de sistemas apilados; Revisión siempre va por página). Clave de ajuste: `scoreView` (`continua` | `pagina`).
- Aspecto de la partitura: «Hoja» (blanco, por defecto), «Sepia» u «Oscuro». Sólo cambia el área de la partitura (Práctica y Revisión). Se elige en Ajustes o con acceso rápido en Práctica (panel «Más» en el celular; siempre visible en la tablet). Clave: `scoreTheme` (`hoja` | `sepia` | `oscuro`).
- Tamaño de la partitura (chico / mediano / grande), en el mismo lugar y para ambas vistas. Clave: `scoreSize` (`chico` | `mediano` | `grande`).
- Los pasos tocados se marcan además del color: ✓ (limpio) y ✕ (con error) debajo del pentagrama; los colores de acierto, error y cursor cumplen contraste AA sobre Hoja y Sepia.

## Tests
`node --test test/*.test.mjs`
