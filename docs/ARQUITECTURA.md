# Auditoría, decisiones y límites

Documento de trabajo de Vermut Tour Madrid. Distingue lo **verificado** (con fuente o con prueba ejecutada) de lo **no verificado**.

## 1. Estado del proyecto

- Archivos: `index.html` (estructura), `styles.css` (diseño y colores), `hitos.js` (hitos), `app.js` (mapa, chinchetas, fichas, lista, Excel), `diagnostico.js` (panel de diagnóstico), `fotorrealista.html` (modo opcional con Google), `sw.js` (caché), `vermuterias.json` (copia de datos). Sin compilador: GitHub Pages sirve los archivos tal cual.
- Motor cartográfico: **MapLibre GL JS 4.7.1**. Teselas vectoriales de **OpenFreeMap** (datos de OpenStreetMap).
- Edificios: extrusión de los polígonos de OpenStreetMap con su altura. **Un polígono extruido es un prisma vertical**: no puede representar torres inclinadas, que se estrechan ni fachadas. Esto es un límite del dato, no un fallo que se pueda corregir con más código.

## 2. Cómo se dibujan los hitos

1. **Torres (14)**: el propio mapa selecciona sus edificios por **altura y cercanía** y los dibuja con su color. Se ve la silueta real de OpenStreetMap, pero como **prisma**: las torres Puerta de Europa (inclinadas 15°) y la Torre Moeve (se estrecha) **no** tienen su forma real. Se probó con los filtros reales del estilo y edificios simulados; **no** con teselas reales.
2. **Monumentos sueltos y Bernabéu**: modelos hechos a mano (Torrespaña, Faro de Moncloa, Obelisco, Puerta de Alcalá, estadio). Son **esquemáticos**: medidas estimadas, sin planos ni fotografías.
3. **Palacio Real, Cibeles, Almudena, Banco de España, Metrópolis, Telefónica**: se lee la silueta del mapa cuando está cargada y se dibuja encima una copia coloreada, con extras (cúpula, torre) colocados por cálculo. El panel «Diagnóstico de hitos» (Opciones) dice qué se ha leído de cada uno. Resultado **no verificado** con teselas reales.

## 3. Alternativas evaluadas

| Opción | Hechos comprobados | Decisión |
|---|---|---|
| **Google Photorealistic 3D Tiles** | Según la documentación de Google: **facturación activada** y **clave de API** en todas las peticiones; SKU «Enterprise»; máximo **10.000 consultas raíz al día**; normas de atribución; términos que **pueden diferir para cuentas del EEE**. En el código oficial de CesiumJS 1.124 la carga exige una clave de Google y solo se puede usar con el geocodificador de Google. | **Implementado como página opcional** (`fotorrealista.html`) que pide **tu** clave. **No probado** con una clave real. Es la única vía a edificios con su forma y colores reales. |
| **Datos 3D oficiales del Ayuntamiento de Madrid** | La búsqueda no encontró un conjunto 3D abierto con licencia clara. | **No usado.** Sin verificar en el portal oficial. |
| **MapLibre + edificios vectoriales** | Motor BSD. OpenFreeMap: sin registro, sin clave, sin límites declarados, **sin SLA**, atribución obligatoria. | **Base del mapa 2D/3D.** Gratis y rápido. |
| **Modelos hechos a mano** | Sin planos ni fotografías no se puede garantizar fidelidad. | Solo para monumentos simples; **no** se amplía. |
| **Modo esfera** | — | **No implementado.** |

## 4. Qué es real, qué es aproximado y qué es propio

- **Real (OpenStreetMap):** huellas y alturas de edificios (si falta altura, 8 m), calles, parques, agua.
- **Real (fuentes públicas):** posición y altura de los hitos.
- **Aproximado:** colores de los hitos y modelos a mano.
- **Propio:** los datos de las vermuterías (tu Excel).
- **Fotorrealista real:** solo en `fotorrealista.html`, con datos de Google y bajo sus términos.

## 5. Pruebas realizadas (resultados reales)

- Sintaxis de todos los archivos: correcta.
- Estilo del mapa con el **validador oficial de MapLibre**: 0 errores, 30 capas.
- Filtros de las 14 torres, evaluados con el motor de filtros de MapLibre y edificios simulados: cada torre va a su capa, los podios y edificios ajenos quedan en el mapa base.
- Lectura del Excel real (37 locales) y del JSON: correcta.
- Flujo de `fotorrealista.html` con un CesiumJS **simulado**: carga con la clave, coloca la cámara, añade chinchetas y enlaza el clic.

**No** se ha podido probar: render real en GPU, rendimiento en iPhone, teselas reales, ni `fotorrealista.html` con una clave real.

## 6. Costes y mantenimiento

- Mapa 2D/3D: **0 €**; dependencias sin garantía de servicio (OpenFreeMap, Nominatim, cdnjs).
- Modo fotorrealista: **de pago según el uso** (facturación de Google); revisa precios y términos antes de activarlo.

## 7. Pendiente

1. Probar en un navegador real y corregir lo que falle.
2. Probar `fotorrealista.html` con una clave real.
3. Chinchetas accesibles con teclado (hoy la alternativa es la **Lista**).
4. Modo esfera como módulo independiente.
