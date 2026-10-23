# Vermut Tour Madrid

Mapa interactivo de Madrid en 3D con las vermuterías de un Excel, fichas por local y 25 hitos de la ciudad.
Web publicada con GitHub Pages: https://gramos-l.github.io/mapa-Madrid/

## Qué hace

- Mapa plano que, al acercarte (zoom 15+), se inclina y levanta los edificios con su altura (datos de OpenStreetMap).
- Chinchetas de las vermuterías (rojas = pendientes, verdes = visitadas) con **agrupación** al alejar el zoom.
- Ficha al pinchar una chincheta: datos del Excel, enlaces, botones de Google Maps y Apple Maps, y **foto opcional**.
- Lista con buscador y filtros (Todas / Pendientes / Visitadas).
- **Hitos 3D**: 18 modelos propios (torres, Torrespaña, Puerta de Alcalá…) y 7 edificios (Palacio Real, Cibeles, Almudena…) coloreados sobre su silueta real.
- Control **Altura de edificios** (×0,5 a ×2), modo oscuro, inclinación automática, vista general.
- Funciona como app instalable en caché (service worker): las visitas siguientes cargan más rápido.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la aplicación (estilos, interfaz y lógica en un solo archivo). |
| `sw.js` | Service worker: guarda teselas y librerías; pide siempre frescos la página, el Excel y el JSON. |
| `vermuterias.json` | Copia de los datos del Excel. Se usa si no hay un `.xlsx` subido. |
| `Vermut_Tour_Madrid.xlsx` | (Opcional) Tu Excel. Si lo subes con **este nombre exacto**, el mapa lo lee en vez del JSON. |
| `docs/ARQUITECTURA.md` | Auditoría, comparativa de tecnologías, decisiones, licencias, costes y límites. |

## Cómo actualizar los datos

1. Edita tu Excel (hoja **Vermuterías**, cabeceras en la fila 1).
2. En GitHub: **Add file → Upload files** y sube el archivo llamado `Vermut_Tour_Madrid.xlsx` (sustituye al anterior).
3. Abre la web con `?v=2` al final (o recarga dos veces) para saltarte cualquier copia guardada.

Columnas que lee el mapa (las que falten se ignoran): `Visitado`, `Nombre`, `Zona / barrio`, `Calle y número`, `Tipo de local`,
`Qué pedir`, `Precio orientativo`, `Estado del precio`, `Prioridad`, `Notas`, `Enlace / fuente`, `Estimación 2 pers. (€)`,
`Fecha visita`, `Gasto real 2 pers. (€)`, `Nota vermut (1-5)`, `Nota tapa (1-5)`, `Nota ambiente (1-5)`, `Nota media`,
`¿Repetiríamos?`, `Post Instagram (enlace)`.

Columnas **opcionales** que puedes añadir al final:

- `Latitud` y `Longitud`: posición exacta (mantén pulsado el sitio en Google Maps para copiarla). Si faltan, el mapa busca la dirección en Nominatim (OpenStreetMap), una sola vez, y guarda el resultado en el móvil.
- `Foto (enlace)`: URL de una imagen que se muestra en la ficha. Usa solo imágenes que tengas derecho a mostrar.

## Cómo cambiar colores

Al principio de `index.html`, en el bloque `COLORES`: chincheta de pendientes y visitadas, colores de prioridad y tema.
Los modelos de los hitos se editan en la lista `HITOS` y `DYN` del script.

## Publicar

No hay compilación. GitHub Pages sirve los archivos tal cual: **Settings → Pages → Deploy from a branch → `main` / `(root)`**.

## Créditos y licencias

- Mapa base: [OpenFreeMap](https://openfreemap.org) © OpenMapTiles, datos de © [OpenStreetMap](https://www.openstreetmap.org/copyright) (la atribución es obligatoria y ya aparece en el mapa).
- Motor: [MapLibre GL JS](https://maplibre.org) 4.7.1. Lector de Excel: [SheetJS](https://sheetjs.com) 0.18.5 (solo se descarga si se usa un `.xlsx`).
- Altura y posición de los hitos: datos factuales consultados en Wikipedia y otras fuentes. Las formas y colores son una interpretación propia, no fotogrametría.

Más detalle en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).
