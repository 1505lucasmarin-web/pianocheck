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

## Tests
`node --test test/*.test.mjs`
