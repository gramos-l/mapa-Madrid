/* Vermut Tour Madrid: mapa, chinchetas, fichas, lista, Excel. Los hitos 3D viven en hitos.js. */
(function () {
  'use strict';

  const { KLON, KLAT, HITOS, DYN, ALL, HITOS_GEO, SITES, captureOne } = window.VT;

  /* ================== AJUSTES ================== */
  const DATA_XLSX = 'Vermut_Tour_Madrid.xlsx';   // si subes este archivo al repositorio, el mapa lo lee
  const DATA_JSON = 'vermuterias.json';          // copia de respaldo de los datos
  const SHEET = 'Vermuterías';
  const SHEETJS = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const GEO_KEY = 'vermut-geo-v1';
  const PIXEL_RATIO_MAX = 1.5;   // más bajo = más fluido; súbelo a 2 si prefieres más nitidez

  const MADRID = { center: [-3.7038, 40.4168], zoom: 12, pitch: 0, bearing: 0 };
  const BOUNDS = [[-3.95, 40.25], [-3.45, 40.62]];

  // Cabeceras del Excel (la primera fila de la hoja "Vermuterías")
  const COL = {
    visited: 'Visitado', name: 'Nombre', zone: 'Zona / barrio', addr: 'Calle y número', type: 'Tipo de local',
    order: 'Qué pedir', price: 'Precio orientativo', priceState: 'Estado del precio', prio: 'Prioridad',
    notes: 'Notas', src: 'Enlace / fuente', est: 'Estimación 2 pers. (€)', date: 'Fecha visita',
    spent: 'Gasto real 2 pers. (€)', rv: 'Nota vermut (1-5)', rt: 'Nota tapa (1-5)', ra: 'Nota ambiente (1-5)',
    avg: 'Nota media', again: '¿Repetiríamos?', insta: 'Post Instagram (enlace)', lat: 'Latitud', lon: 'Longitud',
    photo: 'Foto (enlace)'   // opcional: URL de una imagen para la ficha
  };

  /* ================== UTILIDADES ================== */
  const $ = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => String(s == null ? '' : s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '';
  const pad = n => String(n).padStart(2, '0');
  function fmtVal(v) {
    if (v instanceof Date) return pad(v.getDate()) + '/' + pad(v.getMonth() + 1) + '/' + v.getFullYear();
    if (v == null) return '';
    return typeof v === 'number' ? v : String(v).trim();
  }
  const toNum = v => { const n = parseFloat(String(v).replace(',', '.').replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : null; };
  const eur = n => (Math.round(n * 100) / 100).toString().replace('.', ',') + ' €';

  let dynFeats = [];
  const dynGeo = () => ({ type: 'FeatureCollection', features: [].concat.apply([], dynFeats.filter(Boolean)) });

  const capState = {};
  SITES.forEach(k => { capState[k] = { done: false, tries: 0, fallback: false }; });
  // modelos hechos a mano: los monumentos sueltos siempre; las torres solo si no se pudo leer su silueta real
  const handShow = new Set();
  HITOS.forEach((H, k) => { if (!H.osm) handShow.add(k); });
  const handFilter = () => ['in', ['get', 'k'], ['literal', Array.from(handShow)]];
  function refreshHand() { if (map.getLayer('hitos-3d')) map.setFilter('hitos-3d', handFilter()); }
  let dynBusy = false;
  function runCapture() {
    if (dynBusy || map.getZoom() < 14.9) return;
    dynBusy = true;
    try {
      const c = map.getCenter(), bnd = map.getBounds();
      let changed = false, handChanged = false;
      SITES.forEach(k => {
        const L = ALL[k], st = capState[k];
        if (st.done || st.fallback) return;
        const near = Math.hypot((c.lng - L.at[0]) * KLON, (c.lat - L.at[1]) * KLAT) < 1100;
        if (!near && !bnd.contains(L.at)) return;
        st.tries++;
        const f = captureOne(map, L, k);
        if (f.length) { st.done = true; dynFeats[k] = f; changed = true; }
        else if (st.tries >= 8 && HITOS[k] && HITOS[k].parts) { st.fallback = true; handShow.add(k); handChanged = true; }
      });
      if (changed) { const src = map.getSource('hitosdyn'); if (src) src.setData(dynGeo()); }
      if (handChanged) refreshHand();
    } catch (e) { /* se reintenta en la siguiente pausa del mapa */ }
    dynBusy = false;
  }

  const H_EXPR = ['coalesce', ['get', 'render_height'], 8];
  const MINH_EXPR = ['coalesce', ['get', 'render_min_height'], 0];

  /* ================== ESTILO DEL MAPA (mínimo, rápido) ================== */
  const EXTRUDE_FROM = 15, EXTRUDE_FULL = 16.5, MAX_PITCH_AUTO = 50, FLAT_UNTIL = 14.8, FULL_3D_AT = 16.8;

  function makeStyle(t) {
    const dk = t === 'dark';
    const C = dk
      ? { bg: '#171c25', green: '#1d2a25', water: '#0e2236', casing: '#10141a', minor: '#2a3240', major: '#3b4658', motor: '#4c5a72', foot: '#232a36',
          cols: [0, '#3a4150', 40, '#4b5a86', 100, '#5f7bd0', 150, '#8fa8ff', 220, '#d6e0ff'] }
      : { bg: '#eeece6', green: '#d3e4c4', water: '#a9cbea', casing: '#d6d1c5', minor: '#ffffff', major: '#ffffff', motor: '#fbe9c9', foot: '#e0dcd2',
          cols: [0, '#dfe3ea', 40, '#b9c6e8', 100, '#7f9be0', 150, '#4a63c7', 220, '#2b2f7a'] };
    const wd = b => ['interpolate', ['exponential', 1.5], ['zoom'], 10, b * 0.15, 14, b, 18, b * 8];
    const h = H_EXPR, minH = MINH_EXPR;
    const S = 'ofm';
    return {
      version: 8, name: 'madrid-3d',
      sources: { ofm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' }, vermuterias: { type: 'geojson', data: geojson(), cluster: true, clusterRadius: 46, clusterMaxZoom: 14 }, hitos: { type: 'geojson', data: HITOS_GEO }, hitosdyn: { type: 'geojson', data: dynGeo() } },
      light: { anchor: 'viewport', position: [1.4, 215, 35], color: dk ? '#9fb0d8' : '#ffffff', intensity: dk ? 0.35 : 0.42 },
      layers: [
        { id: 'fondo', type: 'background', paint: { 'background-color': C.bg } },
        { id: 'cobertura', type: 'fill', source: S, 'source-layer': 'landcover', filter: ['in', 'class', 'grass', 'wood', 'scrub'], paint: { 'fill-color': C.green, 'fill-opacity': 0.7 } },
        { id: 'parques', type: 'fill', source: S, 'source-layer': 'park', paint: { 'fill-color': C.green } },
        { id: 'agua', type: 'fill', source: S, 'source-layer': 'water', paint: { 'fill-color': C.water } },
        { id: 'rios', type: 'line', source: S, 'source-layer': 'waterway', minzoom: 11, paint: { 'line-color': C.water, 'line-width': wd(1.5) } },
        { id: 'edificios-planos', type: 'fill', source: S, 'source-layer': 'building', minzoom: 13, maxzoom: EXTRUDE_FROM, paint: { 'fill-color': C.foot } },
        { id: 'calles-borde', type: 'line', source: S, 'source-layer': 'transportation', minzoom: 10, filter: ['in', 'class', 'primary', 'secondary', 'motorway', 'trunk'],
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.casing, 'line-width': wd(3.6) } },
        { id: 'calles-menores', type: 'line', source: S, 'source-layer': 'transportation', minzoom: 12.5, filter: ['in', 'class', 'minor', 'tertiary'],
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.minor, 'line-width': wd(1.1) } },
        { id: 'calles-principales', type: 'line', source: S, 'source-layer': 'transportation', minzoom: 10, filter: ['in', 'class', 'primary', 'secondary'],
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.major, 'line-width': wd(2.4) } },
        { id: 'autovias', type: 'line', source: S, 'source-layer': 'transportation', minzoom: 9, filter: ['in', 'class', 'motorway', 'trunk'],
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C.motor, 'line-width': wd(3) } },
        { id: 'edificios-3d', type: 'fill-extrusion', source: S, 'source-layer': 'building', minzoom: EXTRUDE_FROM,
          filter: ['!=', ['get', 'hide_3d'], true],
          paint: {
            'fill-extrusion-height': hx(h),
            'fill-extrusion-base': hx(minH),
            'fill-extrusion-color': ['interpolate', ['linear'], h].concat(C.cols),
            'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': false
          } },
        { id: 'hitos-3d', type: 'fill-extrusion', source: 'hitos', minzoom: EXTRUDE_FROM, filter: handFilter(),
          paint: {
            'fill-extrusion-height': hx(['get', 'h']),
            'fill-extrusion-base': hx(['get', 'b']),
            'fill-extrusion-color': ['get', 'c'],
            'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true
          } },
        { id: 'hitos-dyn-3d', type: 'fill-extrusion', source: 'hitosdyn', minzoom: EXTRUDE_FROM,
          paint: {
            'fill-extrusion-height': hx(['get', 'h']),
            'fill-extrusion-base': hx(['get', 'b']),
            'fill-extrusion-color': ['get', 'c'],
            'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true
          } },
        { id: 'pin-clusters', type: 'symbol', source: 'vermuterias', filter: ['has', 'point_count'],
          layout: { 'icon-image': ['concat', 'cl-', ['to-string', ['get', 'point_count']]], 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
        { id: 'pins', type: 'symbol', source: 'vermuterias', filter: UNCLUSTERED,
          layout: { 'icon-image': PIN_IMG, 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true } },
        { id: 'pin-sel', type: 'symbol', source: 'vermuterias', filter: selFilter(sel ? sel.idx : null),
          layout: { 'icon-image': PIN_IMG, 'icon-anchor': 'bottom', 'icon-size': 1.35, 'icon-allow-overlap': true, 'icon-ignore-placement': true } }
      ]
    };
  }

  let theme = 'light', auto = true, userMoved = false, hScale = 1;
  // altura de extrusión: crece con el zoom y se multiplica por el control «Altura de edificios»
  const hx = v => ['interpolate', ['linear'], ['zoom'], EXTRUDE_FROM, 0, EXTRUDE_FULL, ['*', v, hScale]];
  let places = [], filter = 'all', sel = null;

  /* ---- Chinchetas dibujadas por el propio mapa (GPU): mucho más fluido que elementos HTML ---- */
  function geojson() {
    return { type: 'FeatureCollection', features: places.filter(p => p.located && match(p)).map(p => ({
      type: 'Feature', properties: { idx: p.idx, done: p.visited, approx: p.approx },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] } })) };
  }
  const UNCLUSTERED = ['!', ['has', 'point_count']];
  const selFilter = i => ['all', UNCLUSTERED, ['==', ['get', 'idx'], i == null ? -1 : i]];
  const PIN_IMG = ['concat', ['case', ['get', 'done'], 'pin-done', 'pin-todo'], ['case', ['get', 'approx'], '-a', '']];
  const PIN_PATH = 'M14 1.8C7.2 1.8 2 7 2 13.4 2 21.8 14 34.2 14 34.2S26 21.8 26 13.4C26 7 20.8 1.8 14 1.8z';
  function pinImage(id) {
    const done = id.indexOf('done') > -1, dashed = /-a$/.test(id);
    const css = getComputedStyle(document.documentElement);
    const fill = (css.getPropertyValue(done ? '--pin-visitada' : '--pin-pendiente') || '#b3261e').trim();
    const S = 2, c = document.createElement('canvas');
    c.width = 28 * S; c.height = 36 * S;
    const x = c.getContext('2d'); x.scale(S, S);
    const path = new Path2D(PIN_PATH);
    x.fillStyle = fill; x.fill(path);
    x.lineWidth = 1.6; x.strokeStyle = '#fff'; if (dashed) x.setLineDash([3, 2]); x.stroke(path);
    x.setLineDash([]); x.beginPath(); x.arc(14, 13.6, 4.6, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
    return x.getImageData(0, 0, c.width, c.height);
  }
  function clusterImage(n) {
    const S = 2, sz = 38, c = document.createElement('canvas');
    c.width = c.height = sz * S;
    const x = c.getContext('2d'); x.scale(S, S);
    const accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#2f5bea').trim();
    x.beginPath(); x.arc(sz / 2, sz / 2, sz / 2 - 2, 0, Math.PI * 2);
    x.fillStyle = accent; x.fill(); x.lineWidth = 2.5; x.strokeStyle = '#fff'; x.stroke();
    x.fillStyle = '#fff'; x.font = '700 15px -apple-system, "Segoe UI", Roboto, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(n), sz / 2, sz / 2 + 1);
    return x.getImageData(0, 0, c.width, c.height);
  }
  function ensureImage(id) {
    if (map.hasImage(id)) return;
    if (id.indexOf('pin-') === 0) map.addImage(id, pinImage(id), { pixelRatio: 2 });
    else if (id.indexOf('cl-') === 0) map.addImage(id, clusterImage(id.slice(3)), { pixelRatio: 2 });
  }

  const map = new maplibregl.Map({
    container: 'map', style: makeStyle(theme),
    center: MADRID.center, zoom: MADRID.zoom, pitch: 0, maxPitch: 60,
    minZoom: 10.5, maxZoom: 19, maxBounds: BOUNDS, fadeDuration: 0,
    renderWorldCopies: false, refreshExpiredTiles: false,
    pixelRatio: Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAX),
    attributionControl: false
  });
  map.addControl(new maplibregl.AttributionControl({
    compact: true,
    customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Datos de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }));
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  function targetPitch(z) {
    const t = Math.min(1, Math.max(0, (z - FLAT_UNTIL) / (FULL_3D_AT - FLAT_UNTIL)));
    return t * t * (3 - 2 * t) * MAX_PITCH_AUTO;
  }
  // La inclinación se ajusta al terminar el zoom (no en cada fotograma): así el gesto va suave
  map.on('zoomend', () => {
    if (!auto) return;
    const t = targetPitch(map.getZoom());
    if (Math.abs(t - map.getPitch()) > 1.5) map.easeTo({ pitch: t, duration: 450 });
  });
  map.on('movestart', e => { if (e.originalEvent) userMoved = true; });
  const autoBox = $('auto');
  map.on('pitchstart', e => { if (e.originalEvent && auto) { auto = false; autoBox.checked = false; } });
  autoBox.addEventListener('change', () => {
    auto = autoBox.checked;
    if (auto) map.easeTo({ pitch: targetPitch(map.getZoom()), duration: 600 });
  });

  const hud = $('hud');
  const modeEl = $('mode'), statsEl = $('stats');
  let hudT = 0, lastMode = null;
  function updateHud(force) {
    const now = performance.now();
    if (!force && now - hudT < 150) return;
    hudT = now;
    const z = map.getZoom(), p = map.getPitch();
    const is3d = z >= EXTRUDE_FROM && p > 4;
    if (is3d !== lastMode) { lastMode = is3d; modeEl.textContent = is3d ? '3D' : '2D'; modeEl.classList.toggle('is3d', is3d); }
    if (!hud.classList.contains('collapsed')) statsEl.textContent = 'zoom ' + z.toFixed(1) + ' · inclinación ' + Math.round(p) + '°';
  }
  map.on('move', () => updateHud(false));
  map.on('moveend', () => updateHud(true));
  map.on('load', () => updateHud(true));

  const busy = $('busy');
  let busyOn = false;
  map.on('dataloading', e => { if (!busyOn && e.dataType === 'source' && map.getZoom() >= EXTRUDE_FROM - 0.5) { busyOn = true; busy.classList.add('on'); } });
  map.on('idle', () => { if (busyOn) { busyOn = false; busy.classList.remove('on'); } setTimeout(runCapture, 150); });

  /* ---- Control de altura de edificios ---- */
  const hs = $('hscale'), hsOut = $('hscaleOut');
  hs.addEventListener('input', () => { hsOut.textContent = '×' + (+hs.value).toFixed(1).replace('.', ','); });
  hs.addEventListener('change', () => {          // se aplica al soltar: recalcular las alturas es costoso
    hScale = +hs.value;
    [['edificios-3d', H_EXPR, MINH_EXPR], ['hitos-3d', ['get', 'h'], ['get', 'b']], ['hitos-dyn-3d', ['get', 'h'], ['get', 'b']]].forEach(a => {
      if (!map.getLayer(a[0])) return;
      map.setPaintProperty(a[0], 'fill-extrusion-height', hx(a[1]));
      map.setPaintProperty(a[0], 'fill-extrusion-base', hx(a[2]));
    });
  });

  /* ---- Panel de opciones ---- */
  if (window.innerWidth >= 700) hud.classList.remove('collapsed');
  $('toggleHud').addEventListener('click', () => {
    const c = hud.classList.toggle('collapsed');
    $('toggleHud').setAttribute('aria-expanded', String(!c));
  });
  $('reset').addEventListener('click', () => {
    closeSheets();
    map.flyTo({ center: MADRID.center, zoom: MADRID.zoom, pitch: 0, bearing: 0, speed: 1, curve: 1.3 });
  });
  $('theme').addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : '';
    $('theme').textContent = theme === 'dark' ? 'Modo claro' : 'Modo oscuro';
    map.setStyle(makeStyle(theme));
  });

  const msg = $('msg');
  let errors = 0;
  map.on('error', () => {
    errors++;
    if (errors >= 3 && !map.loaded()) { msg.style.display = 'block'; msg.textContent = 'No se pueden cargar los mapas. Comprueba tu conexión.'; }
  });
  map.on('idle', () => { msg.style.display = 'none'; });

  /* ================== DATOS ================== */

  function toPlace(raw, idx, estMap) {
    const nm = {};
    Object.keys(raw).forEach(k => { nm[norm(k)] = raw[k]; });
    const g = key => fmtVal(nm[norm(COL[key])]);
    const p = {
      idx: idx,
      name: String(g('name') || ''), zone: String(g('zone') || ''), addr: String(g('addr') || ''), type: String(g('type') || ''),
      order: String(g('order') || ''), price: String(g('price') || ''), priceState: String(g('priceState') || ''),
      prio: String(g('prio') || ''), notes: String(g('notes') || ''), src: String(g('src') || ''),
      est: g('est'), date: String(g('date') || ''), spent: g('spent'),
      rv: g('rv'), rt: g('rt'), ra: g('ra'), avg: g('avg'), again: String(g('again') || ''), insta: String(g('insta') || ''), photo: String(g('photo') || ''),
      visited: /^s[ií]$/i.test(String(g('visited'))),
      lat: toNum(g('lat')), lon: toNum(g('lon')), located: false, approx: false, failed: false
    };
    if (p.est === '' && estMap) p.est = estMap[p.price] || '';
    if (p.avg === '' || p.avg == null) {
      const v = [p.rv, p.rt, p.ra].map(toNum).filter(x => x != null);
      p.avg = v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : '';
    }
    if (p.lat != null && p.lon != null && p.lat > 39.5 && p.lat < 41.5 && p.lon > -4.5 && p.lon < -3) p.located = true;
    else { p.lat = null; p.lon = null; }
    return p;
  }

  function loadSheetJS() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = SHEETJS; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el lector de Excel'));
      document.head.appendChild(s);
    });
  }

  async function parseWorkbook(buf) {
    await loadSheetJS();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const ws = wb.Sheets[SHEET] || wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
    let estMap = null;
    if (wb.Sheets['Ajustes']) {
      estMap = {};
      const aj = XLSX.utils.sheet_to_json(wb.Sheets['Ajustes'], { header: 1, defval: '' });
      aj.forEach(r => { if (r[0] && typeof r[1] === 'number') estMap[String(r[0]).trim()] = r[1]; });
    }
    return rows.map((r, i) => toPlace(r, i, estMap)).filter(p => p.name);
  }

  async function loadData() {
    try {
      const r = await fetch(DATA_XLSX, { cache: 'no-cache' });
      if (r.ok) { const list = await parseWorkbook(await r.arrayBuffer()); if (list.length) return { list: list, from: 'Excel' }; }
    } catch (e) { /* si no hay Excel subido, se usa la copia JSON */ }
    const r = await fetch(DATA_JSON, { cache: 'no-cache' });
    if (!r.ok) throw new Error('No se encuentran los datos');
    const rows = await r.json();
    return { list: rows.map((x, i) => toPlace(x, i, null)).filter(p => p.name), from: 'copia' };
  }

  /* ================== LOCALIZACIÓN (si el Excel no trae coordenadas) ================== */
  let geoCache = {};
  try { geoCache = JSON.parse(localStorage.getItem(GEO_KEY) || '{}'); } catch (e) { geoCache = {}; }
  const saveGeo = () => { try { localStorage.setItem(GEO_KEY, JSON.stringify(geoCache)); } catch (e) { /* sin almacenamiento */ } };
  const geoKey = p => norm(p.name) + '|' + norm(p.addr);

  function cleanAddr(s) {
    return String(s || '').replace(/\(.*?\)/g, '').replace(/,?\s*acceso por.*$/i, '').replace(/confirmar.*$/i, '').replace(/\s+/g, ' ').replace(/[,\s]+$/, '').trim();
  }
  async function nominatim(q) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&bounded=1&viewbox=-3.95,40.62,-3.45,40.25&accept-language=es&q=' + encodeURIComponent(q);
    const r = await fetch(url);
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (!j.length) return null;
    const x = j[0], cat = x.category || x.class, t = x.type;
    const approx = cat === 'highway' || cat === 'boundary' || (cat === 'place' && t !== 'house' && t !== 'building');
    return { lat: parseFloat(x.lat), lon: parseFloat(x.lon), approx: approx };
  }
  async function geocodePlace(p) {
    const cleaned = cleanAddr(p.addr), hasNum = /\d/.test(cleaned);
    const nameClean = p.name.replace(/\(.*?\)/g, '').trim();
    const qs = [];
    if (cleaned && hasNum) qs.push(cleaned + ', Madrid, España');
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) qs.push(parts.slice(1).join(', ') + ', Madrid, España');
    qs.push(nameClean + ', Madrid, España');
    if (cleaned && !hasNum) qs.push(cleaned + ', Madrid, España');
    for (let i = 0; i < qs.length; i++) {
      const res = await nominatim(qs[i]);
      if (res) return res;
      await sleep(1100);
    }
    return null;
  }

  const geoBox = $('geo'), geoText = $('geoText'), geoRetry = $('geoRetry');
  let geoRunning = false;
  async function geocodeAll() {
    if (geoRunning) return;
    const todo = places.filter(p => !p.located);
    if (!todo.length) { geoBox.classList.remove('on'); return; }
    geoRunning = true; geoRetry.hidden = true;
    let done = 0, netErrors = 0;
    geoBox.classList.add('on'); geoText.textContent = 'Localizando vermuterías… 0/' + todo.length;
    for (const p of todo) {
      const k = geoKey(p);
      let hit = geoCache[k];
      if (!hit) {
        try { hit = await geocodePlace(p); netErrors = 0; if (hit) { geoCache[k] = hit; saveGeo(); } await sleep(1100); }
        catch (e) { netErrors++; hit = null; if (netErrors >= 3) break; await sleep(1500); }
      }
      if (hit) { p.lat = hit.lat; p.lon = hit.lon; p.approx = !!hit.approx; p.located = true; syncPins(); }
      else p.failed = true;
      done++;
      geoText.textContent = 'Localizando vermuterías… ' + done + '/' + todo.length;
      renderList();
    }
    geoRunning = false;
    const pending = places.filter(p => !p.located).length;
    if (pending) { geoText.textContent = pending + ' sin ubicar. Puedes añadir Latitud y Longitud en el Excel.'; geoRetry.hidden = false; }
    else geoBox.classList.remove('on');
    fitAll();
  }
  geoRetry.addEventListener('click', () => { places.forEach(p => { p.failed = false; }); geocodeAll(); });

  function fitAll() {
    if (userMoved) return;
    const pts = places.filter(p => p.located);
    if (!pts.length) return;
    const b = new maplibregl.LngLatBounds();
    pts.forEach(p => b.extend([p.lon, p.lat]));
    map.fitBounds(b, { padding: { top: 90, bottom: 90, left: 40, right: 40 }, maxZoom: 13.6, duration: 900 });
  }

  /* ================== CHINCHETAS (capa del mapa) ================== */
  function match(p) { return filter === 'all' || (filter === 'todo' && !p.visited) || (filter === 'done' && p.visited); }
  map.on('style.load', () => ['pin-todo', 'pin-done', 'pin-todo-a', 'pin-done-a'].forEach(ensureImage));
  map.on('styleimagemissing', e => ensureImage(e.id));
  let syncT = 0;
  function syncPins() {
    clearTimeout(syncT);
    syncT = setTimeout(() => { const src = map.getSource('vermuterias'); if (src) src.setData(geojson()); }, 80);
  }
  function setSel(p) { if (map.getLayer('pin-sel')) map.setFilter('pin-sel', selFilter(p ? p.idx : null)); }
  ['pins', 'pin-clusters'].forEach(id => {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  });

  /* ================== FICHA ================== */
  const card = $('card'), listEl = $('list'), hitosEl = $('hitos');
  function closeSheets() {
    card.classList.remove('open'); listEl.classList.remove('open'); hitosEl.classList.remove('open');
    document.body.classList.remove('sheet-open');
    if (sel) { sel = null; setSel(null); }
  }
  function openSheet(el) {
    card.classList.remove('open'); listEl.classList.remove('open'); hitosEl.classList.remove('open');
    el.classList.add('open'); document.body.classList.add('sheet-open'); el.scrollTop = 0;
    const cb = el.querySelector('.close'); if (cb) cb.focus({ preventScroll: true });   // el foco pasa a la hoja (teclado y lector de pantalla)
  }
  const row = (label, html) => html ? '<div class="r"><dt>' + label + '</dt><dd>' + html + '</dd></div>' : '';
  const ratingTxt = v => { const n = toNum(v); return n == null ? '' : n.toString().replace('.', ',') + ' / 5'; };

  function cardHtml(p) {
    const q = encodeURIComponent(p.name + ' ' + cleanAddr(p.addr) + ' Madrid');
    const g = 'https://www.google.com/maps/search/?api=1&query=' + q;
    const a = 'https://maps.apple.com/?q=' + encodeURIComponent(p.name + ' Madrid') + (p.located ? '&ll=' + p.lat + ',' + p.lon : '');
    const prio = p.prio ? '<span class="chip prio" data-p="' + esc(norm(p.prio)) + '">Prioridad ' + esc(p.prio.toLowerCase()) + '</span>' : '';
    const estN = toNum(p.est);
    const precio = [esc(p.price), esc(p.priceState)].filter(Boolean).join(' · ');

    const visitRows = [
      row('Fecha', esc(p.date)),
      row('Gasto real', toNum(p.spent) != null ? eur(toNum(p.spent)) + ' para 2' : ''),
      row('Vermut', ratingTxt(p.rv)), row('Tapa', ratingTxt(p.rt)), row('Ambiente', ratingTxt(p.ra)),
      row('Nota media', p.avg !== '' ? '<b>' + esc(ratingTxt(p.avg)) + '</b>' : ''),
      row('¿Repetiríamos?', esc(p.again)),
      row('Instagram', safeUrl(p.insta) ? '<a href="' + esc(safeUrl(p.insta)) + '" target="_blank" rel="noopener">Ver publicación</a>' : esc(p.insta))
    ].join('');

    const src = safeUrl(p.src);
    let host = '';
    try { host = src ? new URL(src).hostname.replace(/^www\./, '') : ''; } catch (e) { host = ''; }

    const photo = safeUrl(p.photo) ? '<img class="photo" loading="lazy" referrerpolicy="no-referrer" alt="' + esc(p.name) + '" src="' + esc(safeUrl(p.photo)) + '">' : '';
    return '<div class="grab"></div><button class="close" type="button" data-close aria-label="Cerrar">✕</button>' +
      '<h2>' + esc(p.name) + '</h2><p class="zone">' + esc(p.zone) + '</p>' + photo +
      '<div class="chips">' + prio + (p.visited ? '<span class="chip ok">Visitada ✓</span>' : '<span class="chip todo">Pendiente</span>') +
      (p.price ? '<span class="chip">' + esc(p.price) + '</span>' : '') + '</div>' +
      '<div class="actions"><a class="main" href="' + g + '" target="_blank" rel="noopener">Google Maps</a><a href="' + a + '" target="_blank" rel="noopener">Apple Maps</a></div>' +
      '<dl>' + row('Dirección', esc(p.addr)) + row('Tipo de local', esc(p.type)) + row('Qué pedir', esc(p.order)) +
      row('Precio', precio) + row('Para 2 personas', estN != null ? '≈ ' + eur(estN) : '') + row('Notas', esc(p.notes)) + '</dl>' +
      (visitRows ? '<h3>Vuestra visita</h3><dl>' + visitRows + '</dl>' : '') +
      (src ? '<p class="link-src"><a href="' + esc(src) + '" target="_blank" rel="noopener">Fuente: ' + esc(host || 'enlace') + '</a></p>' : '') +
      (p.approx ? '<p class="note">Ubicación aproximada en el mapa. Para afinarla, escribe Latitud y Longitud en el Excel.</p>' : '') +
      (!p.located ? '<p class="note">Todavía sin ubicar en el mapa. Añade Latitud y Longitud en el Excel.</p>' : '');
  }

  function select(p, fly) {
    sel = p; setSel(p);
    card.innerHTML = cardHtml(p);
    const im = card.querySelector('img.photo'); if (im) im.addEventListener('error', () => im.remove());
    openSheet(card);
    if (fly && p.located) {
      map.flyTo({
        center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 17), bearing: map.getBearing(),
        pitch: auto ? targetPitch(17.2) : map.getPitch(),
        offset: [0, -Math.round(window.innerHeight * 0.17)], speed: 0.9, curve: 1.4
      });
    }
  }

  /* ================== HITOS 3D ================== */
  function hitoHtml(H) {
    const q = encodeURIComponent(H.name + ' Madrid');
    return '<div class="grab"></div><button class="close" type="button" data-close aria-label="Cerrar">✕</button>' +
      '<h2>' + esc(H.name) + '</h2><p class="zone">' + esc(H.info) + '</p>' +
      '<div class="actions"><a class="main" href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener">Google Maps</a>' +
      '<a href="https://maps.apple.com/?q=' + q + '&ll=' + H.at[1] + ',' + H.at[0] + '" target="_blank" rel="noopener">Apple Maps</a></div>' +
      '<p class="note">' + (capState[ALL.indexOf(H)] && capState[ALL.indexOf(H)].done ? 'Silueta y altura reales del mapa; los colores y los detalles añadidos son aproximados.' : 'Modelo 3D aproximado: la posición y la altura son reales; las formas y los colores están simplificados.') + '</p>';
  }
  function selectHito(k, fly) {
    const H = ALL[k]; if (!H) return;
    if (sel) { sel = null; setSel(null); }
    card.innerHTML = hitoHtml(H);
    openSheet(card);
    if (fly) {
      map.flyTo({
        center: H.at, zoom: H.zoom || 16.3, bearing: map.getBearing(),
        pitch: auto ? targetPitch(17.2) : map.getPitch(),
        offset: [0, -Math.round(window.innerHeight * 0.14)], speed: 0.9, curve: 1.4
      });
    }
  }
  $('hitoItems').innerHTML = ALL.map((H, k) =>
    '<button type="button" class="item" data-k="' + k + '"><span class="dot" style="background:' + esc(H.wall || (H.osm && H.osm.wall) || H.parts[0].c) + '"></span>' +
    '<span class="t"><b>' + esc(H.name) + '</b><span>' + esc(H.info) + '</span></span></button>').join('');
  $('hitoItems').addEventListener('click', e => {
    const b = e.target.closest('.item'); if (b) selectHito(+b.dataset.k, true);
  });
  $('btnHitos').addEventListener('click', () => openSheet(hitosEl));
  ['hitos-3d', 'hitos-dyn-3d'].forEach(id => {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  });

  /* ================== LISTA Y FILTROS ================== */
  function renderList() {
    const t = norm($('search').value);
    const items = places.filter(p => match(p) && (!t || norm(p.name + ' ' + p.zone + ' ' + p.type).includes(t)));
    $('items').innerHTML = items.length ? items.map(p =>
      '<button type="button" class="item' + (p.visited ? ' done' : '') + '" data-i="' + p.idx + '"><span class="dot"></span>' +
      '<span class="t"><b>' + esc(p.name) + '</b><span>' + esc(p.zone) + (p.prio ? ' · ' + esc(p.prio) : '') + '</span></span>' +
      (p.located ? '' : '<span class="tag">sin ubicar</span>') + '</button>').join('') : '<p class="empty">No hay vermuterías con ese filtro.</p>';
    document.querySelectorAll('#bar [data-f]').forEach(b => {
      const f = b.dataset.f;
      const n = places.filter(p => f === 'all' || (f === 'todo' && !p.visited) || (f === 'done' && p.visited)).length;
      b.textContent = (f === 'all' ? 'Todas' : f === 'todo' ? 'Pendientes' : 'Visitadas') + ' (' + n + ')';
      b.classList.toggle('on', f === filter);
    });
    $('btnList').textContent = 'Lista (' + places.length + ')';
  }
  $('items').addEventListener('click', e => {
    const b = e.target.closest('.item'); if (!b) return;
    const p = places[+b.dataset.i]; if (p) select(p, true);
  });
  $('search').addEventListener('input', renderList);
  $('btnList').addEventListener('click', () => { renderList(); openSheet(listEl); });
  document.querySelectorAll('#bar [data-f]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f;
    syncPins();
    renderList();
  }));
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheets(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });
  map.on('click', e => {
    const r = 5;
    const cf = map.getLayer('pin-clusters') ? map.queryRenderedFeatures([[e.point.x - 12, e.point.y - 12], [e.point.x + 12, e.point.y + 12]], { layers: ['pin-clusters'] }) : [];
    if (cf.length) {
      const f0 = cf[0], src = map.getSource('vermuterias');
      Promise.resolve(src.getClusterExpansionZoom(f0.properties.cluster_id))
        .then(z => map.easeTo({ center: f0.geometry.coordinates, zoom: Math.min((+z || 14) + 0.4, 17.5), duration: 700 }))
        .catch(() => map.easeTo({ center: f0.geometry.coordinates, zoom: map.getZoom() + 2 }));
      return;
    }
    const f = map.getLayer('pins') ? map.queryRenderedFeatures([[e.point.x - r, e.point.y - r], [e.point.x + r, e.point.y + r]], { layers: ['pins'] }) : [];
    if (f.length) { const p = places[f[0].properties.idx]; if (p) select(p, true); return; }
    const hl = ['hitos-3d', 'hitos-dyn-3d'].filter(id => map.getLayer(id));
    const hf = hl.length ? map.queryRenderedFeatures(e.point, { layers: hl }) : [];
    if (hf.length) selectHito(hf[0].properties.k, false);
    else if (card.classList.contains('open') || hitosEl.classList.contains('open')) closeSheets();
  });

  /* ================== ARRANQUE ================== */
  function setPlaces(list) {
    closeSheets();
    places = list.map((p, i) => { p.idx = i; return p; });
    syncPins();
    renderList();
    fitAll();
    geocodeAll();
  }

  function start() {
    loadData().then(r => setPlaces(r.list)).catch(err => {
      msg.style.display = 'block';
      msg.textContent = 'No se han podido cargar las vermuterías. ' + (err && err.message ? err.message : '');
    });
  }
  if (map.loaded()) start(); else map.once('load', start);

  // Probar un Excel sin subirlo a GitHub (solo en este móvil)
  $('loadXlsx').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      userMoved = false;
      setPlaces(await parseWorkbook(await f.arrayBuffer()));
      geoBox.classList.add('on'); geoText.textContent = 'Datos leídos de ' + f.name + ' (solo en este móvil)';
      setTimeout(() => { if (!geoRunning && !places.some(p => !p.located)) geoBox.classList.remove('on'); }, 3500);
    } catch (err) {
      msg.style.display = 'block'; msg.textContent = 'No se pudo leer ese Excel.';
      setTimeout(() => { msg.style.display = 'none'; }, 3500);
    }
    e.target.value = '';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
