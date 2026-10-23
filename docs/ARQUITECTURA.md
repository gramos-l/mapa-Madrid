# Auditoría, decisiones y límites

Documento de trabajo de Vermut Tour Madrid. Distingue lo **verificado** (con fuente o con prueba ejecutada) de lo **no verificado**.

## 1. Estado del proyecto

- Archivos: `index.html` (estructura), `styles.css` (diseño y colores), `hitos.js` (modelos y siluetas de hitos), `app.js` (mapa, chinchetas, fichas, lista, Excel), `sw.js` (caché), `vermuterias.json` (copia de datos). Sin compilador ni dependencias instaladas: GitHub Pages sirve los archivos tal cual.
- Motor cartográfico: **MapLibre GL JS 4.7.1** (cdnjs). Teselas vectoriales de **OpenFreeMap** (esquema OpenMapTiles, datos de OpenStreetMap).
- Edificios: extrusión de los polígonos de OpenStreetMap con su altura. **No son fotogramétricos**: no hay texturas ni fachadas reales.
- Chinchetas: capa del propio mapa (GPU) con agrupación; imágenes generadas con canvas.
- Excel: SheetJS se descarga solo si existe `Vermut_Tour_Madrid.xlsx` o se usa «Cargar mi Excel»; si no, se lee `vermuterias.json`.

## 2. Cómo se dibujan los hitos (importante)

1. **Torres y edificios singulares** (Cuatro Torres, Torre Picasso, Palacio Real, Cibeles…): el mapa base ya trae su **silueta y altura reales**. Cuando están cargadas, `app.js` las lee del propio mapa y dibuja encima una copia con los **colores** del edificio, **franjas** de pisos y su tejado. La forma de los muros es la de OpenStreetMap; los colores y detalles son **aproximados, puestos a mano**.
2. **Modelo de respaldo**: si la silueta de una torre no llega a leerse tras varios intentos, se muestra el modelo hecho a mano de `hitos.js` (prismas apilados).
3. **Monumentos sueltos** (Torrespaña, Faro de Moncloa, Obelisco, Puerta de Alcalá): modelos hechos a mano, siempre.
4. **Extras** (cúpula de la Almudena, torre de Cibeles, cúpula y Ave Fénix de Metrópolis): se colocan por cálculo sobre la silueta y pueden quedar algo desplazados.

El mapa base **ya no oculta** los edificios altos. Antes se ocultaban los de más de 100 m y se sustituían por modelos propios; se cambió porque los modelos inventados eran peores que la silueta real.

## 3. Alternativas evaluadas

| Opción | Hechos comprobados | Decisión |
|---|---|---|
| **Google Photorealistic 3D Tiles** (con CesiumJS u otro visor 3D Tiles) | Según la documentación de Google: hay que **activar facturación** y usar **clave de API** u OAuth en todas las peticiones; SKU «Enterprise»; máximo **10.000 consultas raíz al día**; hay normas de atribución/logotipo; y la disponibilidad y los términos **pueden diferir para cuentas con dirección de facturación en el EEE**. | **No implementado.** Requiere una clave y una cuenta de facturación que no existen aquí, y no se puede probar sin ellas. La cobertura de Madrid **no está verificada**. Es la única vía realista a fotorrealismo. |
| **Datos 3D oficiales del Ayuntamiento de Madrid** | La búsqueda hecha **no encontró** un conjunto 3D abierto oficial con licencia clara. | **No usado.** Sin verificar en el portal oficial. |
| **MapLibre + edificios vectoriales** (actual) | Motor con licencia BSD. OpenFreeMap: sin registro, sin clave, sin límites de peticiones declarados, **sin SLA**, atribución obligatoria. | **Elegido.** Gratis, rápido, funciona en GitHub Pages. |
| **Three.js como complemento** | Permitiría curvas reales (cúpulas). | **No aprobado**: no compensa el peso y la complejidad ahora. |
| **Modo esfera** | — | **No implementado.** Exige una escena 3D propia que no se puede validar sin un navegador real. Queda como módulo futuro. |

## 4. Qué es real, qué es aproximado y qué es propio

- **Real (OpenStreetMap):** huellas de edificios, alturas (cuando están etiquetadas; si no, 8 m), calles, parques y agua.
- **Real (fuentes públicas):** posición y altura de los hitos.
- **Aproximado:** colores, franjas, tejados y extras de los hitos (hechos a mano, sin fotografías); modelos de respaldo de las torres.
- **Propio:** los datos de las vermuterías (tu Excel). Sus coordenadas, si no las pones tú, son **aproximadas** (búsqueda en Nominatim).
- **No existe:** texturas fotográficas, fachadas reales ni fotogrametría en ninguna parte del mapa.

## 5. Pruebas realizadas (resultados reales)

Ejecutadas fuera del navegador, con el código real y un entorno simulado:

- Sintaxis de `hitos.js` y `app.js`: correcta.
- Estilo completo del mapa con el **validador oficial de MapLibre**: **0 errores**, 16 capas.
- Carga de los 37 locales desde `vermuterias.json` y desde el **Excel real**: correcta.
- Lectura de siluetas con teselas **simuladas**: torres con podio y franjas, edificios con extras, y paso al modelo de respaldo cuando no hay silueta.
- Vistas previas 3D de varios modelos hechos a mano.

**No** se ha podido probar: render real en GPU, rendimiento en iPhone ni la lectura de teselas reales (`querySourceFeatures`). Los resultados en un navegador real pueden diferir.

## 6. Costes y mantenimiento

- Coste en efectivo actual: **0 €**. Dependencias externas **sin garantía de servicio**: OpenFreeMap, Nominatim (una petición por segundo como máximo, con caché), cdnjs.
- Si OpenFreeMap fallara, el mapa base no cargaría; la alternativa sería alojar teselas propias (PMTiles), que hay que generar fuera de este entorno.
- Mantenimiento: actualizar el Excel y subirlo. Revisar la versión de MapLibre una vez al año.

## 7. Pendiente

1. Probar en un navegador real y ajustar `PIXEL_RATIO_MAX` y la lectura de siluetas.
2. Fotorrealismo: crear clave de Google Maps Platform, revisar términos y coste para el EEE, y prototipar con CesiumJS en una página aparte.
3. Chinchetas accesibles con teclado (hoy la alternativa es la **Lista**).
4. Modo esfera como módulo independiente.
