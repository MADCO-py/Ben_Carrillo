# Tienda y firmas: estado y conexión futura

## Lo que funciona ahora

- Seis prendas de muestra en `content/merch.json`, en USD. Imágenes SVG conceptuales propias: reemplazar con fotografías autorizadas antes de vender. Precios, tallas y disponibilidad siguen siendo provisionales.
- Producto a pantalla completa, selección obligatoria de talla y bolsa con cantidades de 1 a 10 por combinación. La bolsa se conserva en `localStorage`; solo contiene identificadores, tallas y cantidades.
- Checkout de muestra: correo, suscripción opcional, nombre, dirección, apartamento opcional, ciudad, estado, ZIP, teléfono opcional, facturación alternativa y revisión. Envío fijo a Estados Unidos: 50 estados y Washington DC. No territorios. No se interpreta la ubicación IP como país del comprador.
- PayPal y Google Pay se muestran como opciones de vista previa. No cargan SDK, no tokenizan tarjetas, no hacen cobros y no crean pedidos. No hay campos para capturar tarjetas. Envío e impuestos permanecen pendientes, sin presentar el subtotal como un total definitivo.
- Los datos personales del checkout solo viven en memoria mientras está abierto. Al cerrarlo se descartan. No se envían ni se guardan en el navegador.
- Estudio de dibujo que se abre con el botón de maximizar y ocupa toda la pantalla, con ratón, dedo o lápiz, trazo fino, deshacer, borrar, guardar y eliminar dibujos propios. Intenta también el modo de pantalla completa del navegador; si no está disponible, el diálogo ocupa toda la ventana. Guardar devuelve al mural; «Listo» cierra conservando el borrador en memoria. Las coordenadas normalizadas permiten adaptar el dibujo al ancho de pantalla.
- El color se asigna aleatoriamente una vez por navegador y se conserva localmente, sin selector. Borrar el almacenamiento o usar otro navegador puede asignar otro color. Esto no identifica de forma permanente un dispositivo físico ni garantiza colores globalmente únicos.
- Los dibujos se guardan en IndexedDB, sin un límite artificial de 10 o 20 firmas. La capacidad depende del espacio y las políticas del navegador. Aún no son visibles entre usuarios. Si falla el almacenamiento, se informa y se conserva el dibujo en pantalla.

Implementación: `js/shop.js`, `js/guestbook.js`, `css/shop-guestbook.css`. Sigue funcionando como sitio estático en GitHub Pages.

## Cómo habilitar PayPal y Google Pay

1. Usar una cuenta PayPal Business del titular de la tienda, completar su verificación y comprobar que la cuenta es elegible para los métodos deseados. Crear una aplicación y credenciales Sandbox para empezar. No compartir contraseñas ni secretos por el sitio.
2. Agregar una API separada del sitio estático. GitHub Pages sirve el frontend; esta API crea y captura las órdenes con PayPal. Guardar el secreto de la aplicación únicamente como variable del servidor. El cliente solo transmite SKU, talla y cantidad; el servidor consulta su catálogo y calcula importes.
3. Conectar PayPal Checkout al frontend usando el SDK oficial. Crear la orden en el servidor, recibir la aprobación del comprador y capturar el pago en el servidor. Guía: [integración oficial de PayPal](https://developer.paypal.com/checkout/integrate).
4. Activar Google Pay en la cuenta y seguir la [integración de Google Pay con PayPal](https://developer.paypal.com/google-pay/integrate/). El SDK comprueba disponibilidad antes de mostrar el botón de producción. La combinación depende de la elegibilidad de la cuenta y del entorno del comprador.
5. Solicitar el acceso a producción de Google Pay: perfil de negocio, dominio de la integración y revisión del flujo en Google Pay & Wallet Console. Consultar los [requisitos oficiales de Google](https://developers.google.com/pay/api/faq). Usar HTTPS y credenciales Live únicamente al completar las pruebas.
6. Completar catálogo real, existencias, tarifas de envío, impuestos aplicables, devoluciones y atención al cliente. Validar también en el servidor que la dirección de envío pertenezca a US y a un estado admitido. El país de envío no determina por sí solo la elegibilidad de la cuenta comercial.
7. Probar aprobaciones, cancelaciones, pagos rechazados y reintentos. Guardar pedidos e inventario en una base de datos; confirmar el pago con el servidor y notificaciones verificadas de PayPal, de forma idempotente. Enviar confirmación y preparar envío solo tras confirmar la captura completada.

No basta con cambiar `paymentsEnabled` en el JSON: es un indicador del estado de la colección, no un mecanismo de cobro. La interfaz actual debe conectarse a los SDK y a los endpoints verificados, reemplazando las acciones de demostración.

## Contrato propuesto de la API

Estos endpoints son una propuesta para la siguiente fase; aún no están implementados.

| Ruta | Responsabilidad del servidor |
| --- | --- |
| `GET /api/catalog` | Catálogo vigente, tallas, precios e inventario |
| `POST /api/checkout/quote` | Validar dirección US, cantidades y stock; calcular envío, impuestos y total; emitir una cotización con vencimiento |
| `POST /api/orders` | Crear orden de PayPal en USD a partir de la cotización vigente |
| `POST /api/orders/:id/capture` | Verificar titularidad/estado y capturar una vez; registrar pedido |
| `POST /api/webhooks/paypal` | Verificar firma, conciliar estado y evitar duplicados |
| `POST /api/guestbook/identity` | Asignar un ID anónimo y color persistente del lado del servidor |
| `GET /api/guestbook?cursor=…` | Cargar firmas públicas aprobadas por páginas |
| `POST /api/guestbook` | Validar coordenadas y límites, guardar firma con el color asignado por el servidor |

Para el mural de cientos de firmas: base de datos compartida, carga paginada, límites de frecuencia y tamaño, moderación y eliminación administrativa. No aceptar HTML ni SVG arbitrario de los usuarios; almacenar puntos y trazos validados, asignando el color en servidor. Evitar fingerprinting. El ID anónimo depende del navegador: para reconocer a una persona entre dispositivos se necesitaría una cuenta, no solo una cookie.

Los dibujos locales no se suben automáticamente al futuro mural. Su publicación deberá hacerse por una acción explícita del visitante.
