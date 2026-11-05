# Actas Guardaparques — PWA (v0.3)

v0.3: impresión en el lugar. Al cerrar el acta se abre la ventana de impresión:
- **Térmica portátil 58/80 mm por Bluetooth** (Chrome en Android, impresoras BLE con ESC/POS). Imprime original + copia separados por línea de corte.
- **Enviar a app de impresión**: comparte el ticket como imagen (para iPhone o impresoras Bluetooth clásicas, vía la app del fabricante o RawBT).
- **Hoja A4/carta** por el diálogo del sistema (Wi-Fi, USB o PDF), un ejemplar por hoja.
- Opción "las firmas se toman sobre el acta impresa".

v0.2: redacción textual de los modelos oficiales de Acta de Infracción (Dto. 300/2022) y Acta de Constatación, listado oficial de infracciones frecuentes con reglamento y artículo, numeración AAAA-NNN por tipo de acta, logos configurables.

App web instalable para labrar **Actas de Infracción** y **Actas de Constatación** del Cuerpo de Guardaparques Nacionales (APN), en reemplazo del talonario de papel.

## Cómo publicarla
Es un sitio estático: subí el contenido de esta carpeta a cualquier hosting con **HTTPS** (GitHub Pages, Netlify, Hostinger, servidor de la APN). Abrila una vez con señal desde el celular y elegí **"Agregar a pantalla de inicio" / "Instalar app"**. Desde ahí funciona sin conexión.

Para probar en la PC: `python3 -m http.server 8000` dentro de esta carpeta y abrir http://localhost:8000

## Archivos
- `index.html` — toda la app (HTML + CSS + JS, sin dependencias)
- `manifest.webmanifest` — nombre, ícono y modo app
- `sw.js` — service worker (funcionamiento offline)
- `icons/` — íconos de instalación

## Qué hace
- Asistente de 6 pasos: lugar y hora (con GPS), infractor, hechos, secuestro y fotos, testigos, firmas.
- Conductas frecuentes con texto base y normativa sugerida (fuego, acampe, mascotas, pesca, caza, flora, drones, residuos, vehículos, zona restringida, daños, actividad comercial, ganado).
- Cuadro de hacienda según Res. APN 467/2017 para ganado no autorizado.
- Firma táctil de guardaparque, infractor y testigos; constancia de negativa a firmar (art. 6°, Dto. 300/2022).
- Notificación automática del plazo de 5 días hábiles para descargo ante la Intendencia o TAD (art. 4°, Dto. 300/2022).
- Al cerrar: número correlativo (CÓDIGO-AÑO-000000) y código de integridad SHA-256. El acta queda bloqueada.
- Vista de documento imprimible / guardable como PDF, compartir resumen y exportar JSON.
- Datos guardados en el dispositivo (IndexedDB).

## Pendiente para una versión institucional
- Verificar los números de resolución dudosos de la planilla: Fauna (Res. HD 157/1991) e Investigación Científica (Res. HD ___/2016).
- Sincronización con un servidor de la Intendencia y numeración centralizada por talonario.
- Integración con GDE / expediente electrónico.
- Validación legal de la firma digitalizada en pantalla.
