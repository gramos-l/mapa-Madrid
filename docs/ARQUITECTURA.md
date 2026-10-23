# Auditoría, decisiones y límites

Documento de trabajo de Vermut Tour Madrid. Distingue lo **verificado** (con fuente o con prueba ejecutada) de lo **no verificado**.

## 1. Auditoría del proyecto (estado real del repositorio)

- Archivos: `index.html`, `sw.js`, `vermuterias.json`, `README.md`. Sin compilador, sin `package.json`, sin dependencias instaladas. GitHub Pages sirve los archivos tal cual.
- Motor cartográfico: **MapLibre GL JS 4.7.1** (desde cdnjs). Teselas vectoriales de **OpenFreeMap** (esquema OpenMapTiles, datos de OpenStreetMap).
- Estilo: definido en el propio `index.html` (función `makeStyle`): suelo, agua, parques, calles y edificios. Sin tipografías ni sprites, para cargar menos.
- Edificios: extrusión de los polígonos de OpenStreetMap con su `render_height`. **No son fotogramétricos**: no tienen texturas ni fachadas reales.
- Chinchetas: capa de símbolos del propio mapa (GPU) con agrupación; imágenes generadas con canvas.
- Excel: SheetJS se descarga solo si existe `Vermut_Tour_Madrid.xlsx` o se usa «Cargar mi Excel»; si no, se lee `vermuterias.json`.
- Localización: si el Excel no trae `Latitud`/`Longitud`, se consulta Nominatim (OpenStreetMap) y se guarda en `localStorage`.

Problemas detectados y estado:

| Problema | Estado |
|---|---|
| Todo el código en un solo archivo de ~65 KB (difícil de mantener) | **Pendiente.** Lo razonable es separar en `styles.css`, `hitos.js`, `app.js`. No se ha hecho para no romper una app que funciona sin poder probarla en un navegador real. |
| Caché del navegador servía versiones antiguas de la página | **Corregido** en `sw.js` (la página, el Excel y el JSON se piden siempre frescos). |
| Chinchetas HTML lentas en móvil | **Corregido** (capa GPU). |
| Sin agrupación de chinchetas cercanas | **Corregido** (agrupación hasta zoom 14). |
| Sin control de altura de edificios | **Añadido** (×0,5 a ×2). |
| Chinchetas no accesibles con teclado/lector de pantalla | **Pendiente.** Al ser una capa del mapa no son elementos enfocables; la **Lista** es la alternativa accesible. |

## 2. Alternativas evaluadas

| Opción | Hechos comprobados | Decisión |
|---|---|---|
| **Google Photorealistic 3D Tiles** (con CesiumJS u otro visor 3D Tiles) | Según la documentación de Google: hay que **activar facturación** y usar **clave de API** u OAuth en todas las peticiones; es un SKU «Enterprise»; máximo **10.000 consultas raíz al día**; hay normas de atribución/logotipo; y la disponibilidad y los términos **pueden diferir para cuentas con dirección de facturación en el EEE**. | **No implementado.** Requiere una credencial y una cuenta de facturación que no existen aquí, y no se puede probar sin ellas. La cobertura concreta de Madrid **no está verificada**. Una clave en una web pública queda expuesta, por lo que habría que restringirla por dominio. Es la única vía realista a fotorrealismo; si se quiere, hay que crear la clave y revisar términos y coste antes. |
| **Datos 3D oficiales del Ayuntamiento de Madrid** | La búsqueda hecha **no encontró** un conjunto 3D abierto oficial con licencia clara (sí lo hay para otras ciudades, como Berlín). | **No usado.** No se afirma que exista ni que no exista: está **sin verificar** en el portal oficial. |
| **MapLibre + edificios vectoriales** (actual) | Licencia BSD (motor). OpenFreeMap: sin registro, sin clave, sin límites de peticiones declarados, **sin SLA**, atribución obligatoria. | **Elegido.** Gratis, rápido, funciona en GitHub Pages y es lo que ya usaba el proyecto. |
| **Modelos propios de edificios emblemáticos** | Posición y altura de los hitos consultadas en fuentes públicas; formas y colores hechos a mano. | **Implementado** (25 hitos). Es aproximado, no fotogrametría. |
| **Three.js como complemento** | Permitiría formas curvas reales (cúpulas) en lugar de prismas apilados. | **No aprobado**: no aporta una ventaja que compense el peso y la complejidad ahora. |
| **Modo esfera** («Madrid dentro de una esfera») | — | **No implementado.** Exige una escena 3D propia y no se puede validar sin un navegador real. Queda como mejora modular. |

## 3. Qué es real, qué es aproximado y qué es propio

- **Real (de OpenStreetMap):** huellas de edificios, alturas (cuando están etiquetadas), calles, parques y agua. Donde no hay altura se usa 8 m por defecto.
- **Real (consultado en fuentes públicas):** posición y altura de los hitos.
- **Aproximado:** formas y colores de los hitos (hechos a mano, sin fotografías); cúpula, torre y Ave Fénix de Almudena, Cibeles y Metrópolis (colocados por cálculo sobre la silueta).
- **Propio:** los datos de las vermuterías (tu Excel). Sus coordenadas, si no las pones tú, son **aproximadas** (búsqueda de direcciones en Nominatim).
- **No existe:** texturas fotográficas, fachadas reales ni fotogrametría en ninguna parte del mapa.

## 4. Efecto de ocultar edificios >100 m

El mapa base oculta todo edificio de más de 100 m para que no se solape con los modelos propios. Si hubiera un rascacielos que no está en la lista de hitos, **desaparecería**.

## 5. Pruebas realizadas (resultados reales)

Ejecutadas fuera del navegador, con el código real y entornos simulados:

- Sintaxis del script: correcta.
- Estilo completo del mapa con el **validador oficial de MapLibre** (`@maplibre/maplibre-gl-style-spec`): **0 errores**, 16 capas, 4 fuentes.
- Filtro que oculta edificios altos, evaluado con el motor de filtros de MapLibre: oculta 249 m, mantiene 30 m y 100,5 m.
- Carga de los 37 locales desde `vermuterias.json` y desde el **Excel real** (`.xlsx`): 37 filas y fichas correctas.
- Localización simulada de las 37 direcciones, fichas, lista, hitos y recoloreado de siluetas con teselas simuladas: sin errores.
- Vistas previas 3D de varios hitos (Torrespaña, Torre de Madrid, Puertas de Europa, Puerta de Alcalá): formas correctas.

**No** se ha podido probar: render real en GPU, rendimiento en iPhone, lectura de teselas reales (`querySourceFeatures`), ni el comportamiento exacto de las 7 siluetas reales. Los resultados en un navegador real pueden diferir.

## 6. Costes y mantenimiento

- Coste en efectivo actual: **0 €** (GitHub Pages, cdnjs, OpenFreeMap y Nominatim gratuitos).
- Dependencias externas **sin garantía de servicio**: OpenFreeMap (financiado con donaciones), Nominatim (uso moderado: la app hace una petición por segundo como máximo y guarda el resultado), cdnjs.
- Si OpenFreeMap fallara, el mapa base no cargaría; la alternativa sería alojar teselas propias (PMTiles), que requiere generarlas fuera de este entorno.
- Mantenimiento: actualizar el Excel y subirlo. Revisar la versión de MapLibre una vez al año.

## 7. Próximos pasos recomendados (por orden)

1. Separar `index.html` en `styles.css`, `hitos.js` y `app.js`.
2. Revisar el rendimiento real en iPhone y ajustar `PIXEL_RATIO_MAX`.
3. Si se quiere fotorrealismo: crear clave de Google Maps Platform, revisar términos y coste para EEE, y prototipar con CesiumJS en una página aparte.
4. Panel lateral fijo en pantallas grandes (lista y ficha sincronizadas).
5. Modo esfera como módulo independiente.
