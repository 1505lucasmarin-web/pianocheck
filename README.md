# PianoCheck

App web instalable (PWA) para practicar piano con un Roland FP-30X por MIDI (USB o Bluetooth) en Chrome para Android.

## Publicar en GitHub Pages
1. Crear un repositorio público (por ej. `pianocheck`) en github.com.
2. Subir TODO el contenido de esta carpeta a la rama `main` (Add file → Upload files, o `git push`).
3. Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)` → Save.
4. Abrir `https://USUARIO.github.io/pianocheck/` en Chrome del celular/tablet → menú ⋮ → "Instalar app".

## Uso
- Ajustes: elegir proveedor de IA (Anthropic o Gemini) y pegar la API key (queda sólo en el dispositivo).
- Buscar una canción (buscador de la Biblioteca o Nueva partitura): escribí un título o pegá un enlace y la app arma una pantalla de resultados con, en orden, tu biblioteca, las partituras incluidas, las ediciones encontradas en la web (con tu IA; «Abrir partitura», «Importar mi copia» o «Importar directo» si es de acceso abierto), enlaces a catálogos y, al final, «Generar de memoria». Si la IA no puede, volvés a los resultados sin perder título, artista ni enlace. La última búsqueda queda como «Seguir con…» en la Biblioteca.
- Arreglo: no hay nivel que elegir; la IA lo decide según la pieza. «Solo melodía» y «Agregar acompañamiento» (botón Arreglo en la tarjeta y en Revisión) se resuelven sin IA, crean una versión nueva y muestran la complejidad estimada. Foto, imágenes, PDF, MusicXML y MIDI siguen en Importar partitura. Revisar y corregir notas antes de guardar.
- Práctica: conectar el piano (USB con cable OTG, o Bluetooth), tocar. Fuera de un bucle, se detiene al 6.º error seguido.
- Micrófono (alternativa al MIDI): en Práctica tocá «Micrófono» y apoyá el celular/tablet sobre el piano (acústico o digital con parlantes); la sensibilidad se ajusta en Ajustes. Usá auriculares para el metrónomo. Si hay un piano MIDI conectado, el micrófono se ignora.
- Piano guía: en Práctica el teclado de abajo se ve mientras la «Guía» está activada (con la Guía apagada se pliega y queda una barra fina para desplegarlo, salvo que uses el teclado de pantalla). Con «Guía» activada ilumina las notas que siguen (MD latón y círculo, MI azul y cuadrado), marca lo que tocás (verde/rojo) y, si errás, dibuja una flecha y dice cuánto moverte («Movete 1 tono a la derecha → Sol4»). El ajuste «Tocar en el teclado de pantalla» sólo hace que esas teclas respondan al toque.
- Frases que se repiten: la app detecta frases repetidas en la melodía (A, A′, B…), las marca sobre la partitura y en la leyenda «Estructura» (tocá una letra para ir a esa frase) y avisa al llegar a una que ya tocaste. Se apaga con «Marcar frases repetidas» en Ajustes.
- Partitura continua (vista por defecto en Práctica): toda la pieza en una sola fila; la marca avanza desde la izquierda hasta el centro y desde ahí se desplaza la partitura (con transición suave; respeta «reducir movimiento»), y al final la marca vuelve a avanzar hacia la derecha. Un bloque fijo con claves, armadura y compás queda a la izquierda al desplazarse. Se dibuja una sola vez (por tramos de SVG contiguos); sólo se mueve y se colorea.
- Mirar adelante o atrás: arrastrá la partitura con el dedo, o tocá una letra de «Estructura»; al tocar la próxima nota vuelve suavemente a la marca.
- Ajustes → Vista de la partitura: «Continua (recomendada)» o «Por página» (la vista de sistemas apilados; Revisión siempre va por página). Clave de ajuste: `scoreView` (`continua` | `pagina`).
- Aspecto de la partitura: «Hoja» (blanco, por defecto), «Sepia» u «Oscuro». Sólo cambia el área de la partitura (Práctica y Revisión). Se elige en Ajustes o en el menú «Lectura» (Aa) de Práctica. Clave: `scoreTheme` (`hoja` | `sepia` | `oscuro`).
- Tamaño de la partitura (chico / mediano / grande), en el mismo lugar y para ambas vistas. Clave: `scoreSize` (`chico` | `mediano` | `grande`).
- Los pasos tocados se marcan además del color: ✓ (limpio) y ✕ (con error) debajo del pentagrama; los colores de acierto, error y cursor cumplen contraste AA sobre Hoja y Sepia.

## Etapa 1: practicar pasajes
- Pantalla de Práctica (celular y tablet): arriba título, «Mano derecha · Compás 5 de 8» (tocalo para cambiar de mano, reiniciar o terminar) y el estado de entrada («MIDI listo», «Micrófono», «Teclado», «Conectar piano»), que abre la hoja de conexión (USB, Bluetooth, micrófono, teclado de pantalla). Debajo: Tempo (−/+, metrónomo, cuenta de entrada), Bucle, Guía y «Aa» (menú Lectura: aspecto, tamaño, vista y Estructura).
- Bucle: elegí desde/hasta compás (o «Compás actual y el siguiente»; también «Practicar esta frase» al tocar una letra de Estructura). La práctica recorre sólo ese rango, cuenta vueltas y marca cuáles salieron limpias; lo de afuera se atenúa. Si te trabás (6 errores seguidos) aparece una ayuda: escuchar el pasaje, probar con una mano, volver al inicio del compás o seguir.
- Escuchar el pasaje: sintetizador Web Audio (sin archivos), al tempo actual o lento (60%), por mano; el cursor y el piano guía acompañan. Pausa el micrófono mientras suena.
- Resultado: siempre muestra Precisión (limpios / recorridos) y Avance (compases completos y pasos) por separado, una acción principal («Practicar compases 5–6», «Seguir desde el compás 4», subir el tempo o sumar la otra mano), tira de compases tocable y comparación sólo con intentos equivalentes (mismo rango, mano y modo).
- Biblioteca: «Continuar práctica» reabre la última pieza con su bucle, mano y tempo; la demo tiene «Probar con el teclado de pantalla».
- Claves nuevas en ajustes: `countIn` (cuenta de entrada), `lastPractice` (por partitura: `{from,to,loop,hands,bpm,measure,at}`), `onscreenKeyboard` (también desde la hoja de conexión). Cada intento del historial guarda además `range`, `loop`, `bpm`, `laps`, `measuresDone`, `measuresTotal` (los viejos se leen como pieza entera).

## Etapa 2: teoría y enlaces
- Teoría (tarjeta en la Biblioteca): lección 1 «La escala mayor» (fórmula T T S T T T S, las 12 tonalidades con su ortografía —Mi♯ en Fa♯ mayor—, «Escuchar», «Tocala» con corrección «Movete…», opción ida y vuelta, y «Armala vos» sin anticipar teclas) y lección 2 «Los grados y sus acordes» (tabla I–VII por tonalidad, tocar una fila la ilumina y la hace sonar; «Tocá el grado» acepta cualquier octava/inversión, juntas o de a una; quiz «Mayor, menor o disminuido»). Usa la misma entrada y el mismo estado de conexión que Práctica. El progreso (mejor puntaje y tonalidades con 80 % o más) se guarda en IndexedDB (clave `theory` del store de ajustes). Código: `js/theory.js` y `js/lessons.js` (puros, con tests), `js/teoria.js` (pantalla).
- Pedir una canción por enlace (YouTube, YouTube Music, Spotify, Apple Music, Deezer, SoundCloud): el enlace sólo sirve para saber qué canción es (oEmbed / iTunes Lookup / Deezer, sin audio); siempre se confirma título y artista, editables, y la partitura la arma la IA de memoria. Se guarda `sourceUrl` y la tarjeta muestra «Abrir original». Desde otras apps de Android: Compartir → PianoCheck (`share_target` GET con `title`, `text`, `url`; requiere la app instalada). Si un servicio bloquea oEmbed por CORS se usa el texto del enlace; si no hay nada, se pide el nombre.
- «Nueva partitura» separa «Buscar una canción» (título o enlace) de «Importar partitura» (foto, imágenes, PDF, MusicXML, MIDI).

## Etapa 7: a pulso, revisión y tareas
- **A pulso** (Tempo → Modo): un compás de entrada y el cursor avanza solo al tempo elegido; mide notas correctas, % a tiempo (±120 ms, más ancho a tempos lentos) y la tendencia. Sólo con MIDI o teclado en pantalla; con micrófono se queda en «Te espero». `js/timing.js`.
- **Revisión docente**: tocá una nota para cambiar altura, duración, mano, digitación, insertar o borrar (con deshacer/rehacer); comentarios por compás; avisos de importación (compás que no suma, vacío, saltos grandes) para revisar uno por uno. `js/review.js`, `js/issues.js`.
- **Tareas**: «Crear tarea» arma un archivo `.pianocheck` (partitura + compases, mano, tempo, modo, consigna) que se comparte o descarga; se abre con Nueva partitura → Importar. Validación estricta en `js/task.js`.
- **Resumen y toma**: «Compartir resumen» genera un texto para el profe; la toma de audio (hasta 60 s) es voluntaria, pide permiso cada vez y no se sube a ningún lado. Agregar `?debug` a la URL expone `window.__pc` para pruebas.

## Etapa 8: dónde estoy, dónde me equivoqué y anotaciones
- **Dónde estoy**: el compás que se evalúa lleva un fondo suave (distinto del cursor de la nota); en vista por página también se resalta el renglón actual (banda lateral + fondo) y se mantiene a la vista; en continua hay una etiqueta fija «Compás N» y, si te corriste, un botón de borde «Nota esperada» para volver.
- **Dónde me equivoqué**: la nota esperada queda marcada con ✕ (color + símbolo, contraste AA en los tres temas) y una nota «fantasma» a la altura que tocaste; el panel dice «Tocaste Re4 · Se esperaba Mi4» (se anuncia con aria-live). El cursor no avanza hasta corregir; al corregir la marca queda como historial discreto. En A pulso el pulso sigue y los errores quedan donde ocurrieron (✕ equivocada, ○ omitida); tocá la marca para ver el detalle. Resultado lista los errores de la toma.
- **Anotar** (botón del lápiz en Práctica y «Anotar» en Revisión): lápiz (3 colores), resaltador, texto de hasta 60 caracteres, goma, deshacer/rehacer. Los gestos dibujan; para moverte, dos dedos o los botones ‹ › (con lápiz activo se ignoran los dedos). La evaluación queda en pausa mientras anotás. Las marcas se anclan al compás (`js/annotations.js`, puro y con tests; UI en `js/annotate-ui.js`), se guardan en IndexedDB (clave `anno:<id>` del store de ajustes), viajan en las tareas `.pianocheck` y sobreviven a recargar, rotar, cambiar tamaño y pasar de continua a por página. El ojo las oculta/muestra con un toque (ajuste `hideMarks`).

## Reproductor (modo escucha)
- Play en Práctica, en cada tarjeta de la Biblioteca, en Revisión y en los resultados de búsqueda («Escuchar»). La partitura suena de principio a fin (o el bucle/rango activo) con cursor, compás resaltado y piano guía; la evaluación y el micrófono quedan en pausa y vuelven al detener.
- Transporte: Play/Pausa, Detener, barra por compás, tocar un compás para saltar, velocidad 50/75/100/125 % con BPM resultante, repetir, manos, silenciar la mano que practicás, metrónomo, cuenta de entrada, volumen y «Tocar encima» (se ve en el piano guía, no se puntúa). Atajos: espacio y flechas.
- Núcleo puro en `js/playback.js` (eventos, ligaduras, rango, mano, agenda con anticipación sobre `AudioContext.currentTime`), sintetizador en `js/synth.js` (timbres «Piano» y «Suave», en Ajustes), interfaz en `js/listen.js`. Android: Media Session y Wake Lock mientras suena.

## Tests
`node --test test/*.test.mjs`
