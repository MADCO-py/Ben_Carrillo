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
- Spotify y YouTube se conectan únicamente al activar un reproductor. Los enlaces externos permiten escuchar incluso si el embed falla.
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

## Pasar páginas con esfuerzo y final completo

La cubierta, el paso a la biografía y la salida del libro tienen umbrales de scroll. Un recorrido pequeño mantiene la página actual; al superar el umbral, una animación temporal termina el giro aunque se deje de mover la rueda o el dedo. La vuelta usa un umbral distinto para evitar cambios repetidos por pequeñas oscilaciones. Los botones del índice conservan el acceso directo.

`js/book.js` define las duraciones y umbrales. `scripts/check-book-snap.cjs` verifica el comportamiento en escritorio y móvil, incluida la pausa a mitad del recorrido de scroll, los gestos cortos y la vuelta. Ejecutarlo con Node y Playwright, con el servidor local activo.

Se reemplazaron los asteriscos naranjas del índice y del bloque DREAMER por garabatos originales en trazo grafito.
