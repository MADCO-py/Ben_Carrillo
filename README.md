# BEN CARRILLO

Sitio estático para GitHub Pages. HTML, CSS y JavaScript sin compilación ni dependencias de producción.

## Vista local

Desde esta carpeta:

```bash
python3 -m http.server 4173
```

Abrir http://localhost:4173. Usar un servidor local: abrir `index.html` directamente como `file://` impide leer los archivos JSON en varios navegadores.

## Orden de los archivos

- `index.html`: estructura de las secciones, enlaces y texto español inicial.
- `css/style.css`: composición, colores, tamaños, móvil y movimiento reducido.
- `css/fonts.css` y `assets/fonts/`: tipografías locales.
- `js/app.js`: transición de paisajes, selector de idioma, menú y reproductores.
- `content/i18n/es.json`: texto español de referencia.
- `content/i18n/en.json`: versión inglesa.
- `content/i18n/quc.json`: **borrador k’iche’ pendiente de revisión humana completa**.
- `content/album.json`: metadatos verificados del álbum y canciones.
- `content/videos.json`: identificadores y títulos oficiales de los videos.
- `assets/images/artista/`: retrato autorizado para esta propuesta y original.
- `assets/images/paisajes/`: Atitlán, desierto y playa; originales y versiones web.
- `assets/images/albumes/`: portadas.
- `assets/images/videos/`: miniaturas locales.
- `docs/FUENTES.md`: fuentes, créditos y pendientes editoriales.

## Cambiar contenido

1. Editar los textos en los tres JSON de `content/i18n/`, conservando sus claves. `\n` indica salto de línea. Al cambiar español, actualizar también el texto inicial correspondiente en `index.html` para mantener la versión sin JavaScript y los buscadores.
2. Cambiar una foto conservando el nombre y proporción previstos, o actualizar su ruta y dimensiones en HTML. Conservar los originales. No usar las tres fotos del vestuario: fueron referencias, sin autorización para publicarlas.
3. Para videos, editar `content/videos.json` y guardar una miniatura con el ID como nombre en `assets/images/videos/`. El reproductor no carga hasta pulsar reproducir.
4. La selección musical está en `selected` dentro de `js/app.js`. Los IDs de canciones están en `content/album.json`.
5. Actualizar créditos al cambiar imágenes.

## Publicar en GitHub Pages

Repositorio: https://github.com/MADCO-py/Ben_Carrillo

En GitHub: **Settings → Pages → Deploy from a branch → rama deseada → /(root)**. Guardar. No requiere un workflow de compilación ni dominio propio. Todas las rutas internas son relativas y funcionan bajo `/Ben_Carrillo/`.

Esta entrega prepara los archivos; no cambia la configuración de GitHub ni hace push automáticamente.

## Verificación de desarrollo

Opcional, requiere Node y Playwright (`npm install` y `npx playwright install chromium`). Con el servidor local activo, ejecutar `npm test`. Las capturas se guardan en `artifacts/`, excluido de Git. `npm run check` revisa la sintaxis de JavaScript.

La comprobación verifica anchos de 360, 390, 768, 1024 y 1440 píxeles, idiomas, ausencia de desbordamiento, retorno del blanco al subir, menú, créditos y creación diferida de reproductores. Los reproductores externos se interceptan en esta prueba: su reproducción real depende del proveedor.

## Comportamiento

- Recorrido continuo y reversible: blanco → Atitlán → desierto → playa.
- Sin secuestro del scroll ni audio automático al entrar.
- Las tres capas se mantienen montadas; un solo `requestAnimationFrame` actualiza su opacidad.
- Imágenes con dimensiones reservadas, fuentes locales y miniaturas locales.
- Los reproductores de Spotify (álbum, artista y tres canciones) aparecen directamente y usan carga nativa diferida, sin reproducción automática. YouTube carga al activar sus videos. Los enlaces directos de las plataformas permiten escuchar incluso si un embed falla.
- `prefers-reduced-motion` desactiva desplazamiento suave, animaciones y transformaciones decorativas.
- ES / K’ICHE’ / EN conserva la selección en el navegador.
- El título “¿QUIÉN PUTAS ES BEN CARRILLO?” se conserva en español.

## Pendientes antes de una publicación definitiva

- Revisión lingüística integral de k’iche’, incluida la variante. Es una traducción de trabajo; los diccionarios sustentan vocabulario, no validan la traducción completa.
- Confirmar autoría/créditos del retrato y la foto de playa facilitados por el usuario.
- Sustituir o ampliar fotografías cuando exista una selección autorizada. La sección fotográfica usa el único retrato aprobado; no inventa una galería.
- Añadir contacto profesional cuando se facilite; no se muestra un correo ficticio.

## Nueva entrada: el cuaderno

`css/book.css` y `js/book.js` controlan el cuaderno café. El libro ocupa toda la pantalla inicial. El scroll gira una cubierta con anverso y reverso, mantiene el índice, gira una hoja de dos caras para mostrar la biografía y retira el libro abierto hacia arriba para revelar el viaje y continuar con scroll normal. Los botones del índice llevan a los capítulos. Con movimiento reducido o ventanas de poca altura, se muestran páginas legibles en flujo normal, sin giros 3D ni bloqueo del contenido.

- `assets/images/stickers/`: los cinco stickers proporcionados por el usuario, conservados tal cual. Tamaño, superposición, recorte visual y rotación se ajustan con `.sticker-*` en `css/book.css`.
- `css/schoolbell.css`: **Schoolbell**, solicitada por el usuario, guardada localmente con licencia Apache 2.0. `css/art-direction.css` aplica papel rayado, marcas, manchas y el cambio a la estética azul y blanca de Los Ángeles. Caveat se conserva como recurso anterior, sin ser la fuente activa del libro.
- `content/tour.json`: fechas **ficticias de demostración**, señaladas en la interfaz. No hay venta de entradas.
- `content/merch.json`: productos y precios **conceptuales**, editables. Ilustraciones SVG originales en `assets/images/merch/`. No hay carrito ni cobros conectados.
- Mailing list: formulario demostrativo con validación y consentimiento. **No envía ni guarda correos**, ni afirma una suscripción exitosa. Requiere conectar un proveedor antes de usarlo públicamente.
- Coming soon: espacio editorial sin anuncio inventado.
- Final: llegar al fondo no reinicia. Se necesita insistir bajando con rueda, varios gestos táctiles o teclado; también existe un botón directo. Al reiniciar, se vuelve a la cubierta.

La biografía aprobada se trasladó completa al cuaderno. Prensa, fotos y redes siguen disponibles en el viaje. Las cifras y fechas demo deben sustituirse antes de anunciar productos o conciertos reales.

La hoja usa dieciséis segmentos con anverso y reverso: la curvatura crece durante el giro y desaparece al asentarse, donde se dibuja una cara completa para evitar costuras. Las texturas vectoriales están en `assets/textures/`. La colección de merch contiene doce productos conceptuales y mantiene fondo blanco, prendas negras y etiquetas pequeñas.

## Transiciones y flechas del cuaderno

El giro sigue directamente el scroll: detenerse permite mirar la hoja a medio pasar, según la preferencia final del usuario. Las flechas dibujadas en ambos lados permiten volver a la cubierta, abrir el índice, pasar a la biografía y salir al viaje. Su recorrido mantiene fotogramas intermedios aunque Chrome se ralentice; rueda, gesto táctil o teclado cancelan ese recorrido para devolver el control manual.

La salida del libro enlaza con scroll normal. En movimiento reducido o ventanas muy bajas se conserva la lectura en flujo normal. Schoolbell se precarga; los archivos CSS/JS llevan una versión explícita en sus URLs para evitar mezclar recursos viejos en caché después de publicar en GitHub Pages.

`node scripts/check-book-transitions.cjs` comprueba giros intermedios, ambas flechas, vuelta, salida y carga de recursos bajo `/Ben_Carrillo/`. Se puede configurar `SITE_URL` para apuntar al servidor local o al sitio publicado. Los asteriscos naranjas del índice y DREAMER se reemplazaron por garabatos en grafito.

## Rendimiento del giro en Firefox

Los valores animados se registran como propiedades CSS que no se heredan, evitando recalcular todos los textos de las copias de la hoja en cada fotograma. Las sombras se componen mediante opacidad, y la hoja se prepara en grupos pequeños durante los tiempos libres del navegador.

Las texturas de `assets/textures/*.svg` se conservan como originales. Las versiones `.webp` se prerenderizaron al tamaño original y se codificaron sin pérdida: mantienen el acabado sin ejecutar filtros SVG durante el giro.

Las flechas dedican su recorrido a los tramos visibles de apertura, vuelta y salida. Su reloj usa tiempo real: los fotogramas lentos ya no multiplican la duración del movimiento. El scroll manual sigue controlando la hoja directamente.

Las comprobaciones aceptan `BROWSER=firefox` y `SITE_URL` para probar específicamente Firefox y la ruta de GitHub Pages.

### Caras preparadas para el giro

`js/vendor/html-to-image.js` (1.11.13, MIT) prepara dos imágenes temporales en memoria a partir del contenido real de la hoja, con Schoolbell y las imágenes locales incorporadas. Los segmentos comparten estas dos caras durante el giro; las páginas en reposo conservan el HTML accesible y sus enlaces. Se preparan otra vez al cambiar idioma o tamaño, a la densidad de pantalla hasta 2×. Si la captura no es compatible, se conserva el renderizado HTML.

No se usa un servidor ni se envían datos: la preparación sucede dentro del navegador. La biblioteca y su licencia están guardadas localmente.

El giro preparado se dibuja en una sola superficie WebGL mediante `js/page-renderer.js`, con una malla curva de 32 tramos. Las imágenes se comparten durante el movimiento, evitando transformar y pintar docenas de capas HTML. Se precalienta el primer dibujo durante la preparación; si WebGL no está disponible o se pierde el contexto, siguen disponibles las caras HTML/imagen. Los valores animados no se heredan a todo el documento.

En Firefox se priorizan las caras cacheadas con composición CSS nativa, evitando la copia adicional del canvas WebGL en ese motor. Los demás navegadores pueden usar la malla WebGL. La preparación pesada se difiere hasta que se abre el cuaderno: la portada inicial no construye las dieciséis copias de texto. Durante las flechas, la posición visual se anima sin desplazar todo el documento en cada fotograma; un gesto manual sincroniza inmediatamente el scroll real.

### El sueño no se suelta · recorrido horizontal

`js/story-rail.js` y `css/story-rail.css` fijan este capítulo mientras el scroll vertical recorre el texto y cuatro publicaciones de TikTok. Al llegar al extremo, el documento continúa hacia abajo; al subir, el recorrido se invierte. No se bloquean los eventos de rueda o de pantalla táctil. El fondo de desierto se desplaza lentamente mediante composición CSS.

Los enlaces e identificadores están en `#historia` dentro de `index.html`. El primer post es de fotos. Los reproductores oficiales se crean únicamente al pulsar “Ver TikTok” y se pausan al salir de pantalla; recorrer la sección no hace solicitudes a TikTok. Siempre hay un enlace externo y se muestra un aviso si TikTok informa un error. La disponibilidad de las publicaciones depende de TikTok; durante la prueba real el servicio respondió con errores de servidor. `js/tiktok-player.js` comprueba mensajes del reproductor (no solo el evento de carga), conserva un viewport nativo mínimo de 325 px escalado al espacio disponible y ofrece reintentar o abrir el post ante error o falta de respuesta. El contenido del iframe permanece oculto detrás del estado de carga hasta recibir `onPlayerReady`; el evento `load` no se interpreta como éxito, porque también se dispara cuando TikTok devuelve una página HTTP 429. No se hacen reintentos automáticos.

Con movimiento reducido o pantallas de menos de 541 px de altura se usa una tira horizontal nativa sin fijar el capítulo. Incluye flechas, navegación con teclado y enlaces accesibles. Los textos nuevos de K’iche’ quedan provisionalmente en español para revisión.

Prueba del recorrido: `node scripts/check-story-rail.cjs` (acepta `BROWSER=firefox`, `PLAYWRIGHT_MODULE` y `SITE_URL`). Se simula solamente la respuesta externa de TikTok para comprobar posición fija, paralaje, salida, retorno, flechas y tamaños sin depender del servicio.

El personaje de `js/story-walker.js` usa las tres hojas PNG originales del usuario, guardadas en `assets/images/personaje/`: cuatro cuadros por hoja, sin modificar las ilustraciones. `js/walker-atlas.js` aplica máscaras SVG individuales porque los dibujos no están alineados en columnas uniformes; las poses de descanso usan un borde escalonado que separa la bandera de los pies del cuadro vecino. Camina de un extremo al otro; los tres primeros clics aumentan la velocidad de desplazamiento: cruza el ancho disponible aproximadamente en 1,6 s, 0,85 s y 0,45 s (con mínimos de velocidad para móvil). El cuarto lo sienta a tomar agua y el quinto vuelve a caminar. Su desplazamiento es independiente del scroll, no tapa los reproductores y se pausa fuera de pantalla o con la pestaña oculta. Con movimiento reducido conserva poses estáticas. Las imágenes se cargan al acercarse a la sección.

### Música dentro del sitio

`css/music.css` mantiene 352 píxeles interiores reales para los reproductores de álbum y artista. Un contenedor con borde o con `flex-shrink` podía reducir ese alto y activar el diseño compacto de Spotify, dejando espacio vacío. Los tres temas de la selección tienen reproductores nativos compactos de 80 px, con su botón de reproducción y las muestras que Spotify habilite para el navegador. No se descargan ni se alojan audios.

“Todas las plataformas” abre un selector local, alimentado por `content/platforms.json`: Spotify, Apple Music, YouTube/YouTube Music, Deezer y TIDAL se seleccionan en el mismo reproductor del álbum. Amazon Music y Pandora conservan enlaces directos claramente señalados con ↗. Se reemplaza el reproductor anterior al cambiar de plataforma. El perfil del artista permanece visible debajo de DREAMER, ahora rojo.

### Cuaderno en celular

`css/book-mobile.css` mantiene una página completa dentro del alto visible y reserva el borde inferior para paginación y flechas. La foto de la biografía se revela durante el giro, sin esperar al último fotograma; se evita WebGL en móvil para que no se superponga una foto ampliada al diseño de una sola página. El CTA del pie solo aparece en la portada: índice y biografía conservan sus propios botones.

`js/book.js` separa el alto visible del recorrido de scroll: al plegarse las barras del navegador, el alto del cuaderno cambia y la distancia para pasar páginas se mantiene. La altura visual sigue `100dvh` desde CSS y se atiende `visualViewport.resize`; un fondo de papel extendido evita destellos del velo claro durante los estados intermedios del navegador y los giros en perspectiva. Al girar el teléfono o cambiar de ancho se recalcula esa referencia. La biografía usa texto adaptable y permite desplazamiento interior si hace falta para leerla completa en pantallas bajas. El scroll manual conserva el control del giro y puede detenerse a mitad de una hoja.

Prueba móvil: `node scripts/check-mobile-book.cjs`, con `BROWSER=firefox` opcional. Comprueba portada completa, foto durante el giro, un único CTA, contenido dentro del margen, cambios de barra del navegador y salida continua al viaje.
