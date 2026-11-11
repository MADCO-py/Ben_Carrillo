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
