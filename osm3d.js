/* Detalle real de los edificios desde OpenStreetMap (API Overpass, gratuita).
   Pide una sola vez, para todos los hitos, las partes de cada edificio con sus alturas, tejados y colores, y las dibuja como volúmenes 3D.
   El resultado se guarda en el móvil. Si falla o no hay detalle, la aplicación sigue con el método anterior. Datos © OpenStreetMap (ODbL). */
(function () {
  'use strict';
  const VT = window.VT;
  if (!VT) return;
  const ALL = VT.ALL, KLON = VT.KLON, KLAT = VT.KLAT;

  const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  const STORE = 'vt-osm3d-v3', VERSION = 3, TTL = 30 * 24 * 3600 * 1000, LV = 3.3;

  /* ---------- colores ---------- */
  const NAMES = { white: '#ffffff', black: '#000000', grey: '#808080', gray: '#808080', lightgrey: '#d3d3d3', lightgray: '#d3d3d3', darkgrey: '#a9a9a9', darkgray: '#a9a9a9',
    silver: '#c0c0c0', dimgray: '#696969', dimgrey: '#696969', slategray: '#708090', slategrey: '#708090', gainsboro: '#dcdcdc', whitesmoke: '#f5f5f5', red: '#c0392b', darkred: '#8b0000',
    maroon: '#800000', brown: '#8b5a3c', saddlebrown: '#8b4513', sienna: '#a0522d', chocolate: '#d2691e', peru: '#cd853f', tan: '#d2b48c', beige: '#f0e6c8', bisque: '#ffe4c4',
    wheat: '#f5deb3', khaki: '#f0e68c', ivory: '#fffff0', linen: '#faf0e6', cream: '#fffdd0', yellow: '#e6c84a', gold: '#d4a72c', orange: '#e08a2b', salmon: '#fa8072',
    pink: '#e8a0b4', purple: '#7b5aa6', green: '#4f8a4f', darkgreen: '#2f5f3f', olive: '#808040', teal: '#2f8080', cyan: '#4fb8c8', aqua: '#4fb8c8', blue: '#3f6fc0',
    lightblue: '#a8cce4', navy: '#1f2f6f', steelblue: '#4682b4', lightsteelblue: '#b0c4de', sandybrown: '#f4a460', lightyellow: '#ffffe0' };
  function cssColor(v) {
    if (!v) return null;
    const s = String(v).trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(s)) return s;
    if (/^#[0-9a-f]{3}$/.test(s)) return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return NAMES[s.replace(/[\s_-]/g, '')] || null;
  }
  const MATERIAL = { glass: '#9bb4c4', brick: '#b0654a', stone: '#d8cdb4', concrete: '#c9c9c4', metal: '#b9c0c7', steel: '#b9c0c7', plaster: '#e9e2d0', wood: '#a67c52' };
  const num = v => { if (v == null) return null; const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
  const r6 = v => Math.round(v * 1e6) / 1e6, r2 = v => Math.round(v * 100) / 100;

  /* ---------- geometría (lon/lat) ---------- */
  const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
  function inRing(p, r) {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  const inEl = (p, e) => inRing(p, e.outer) && !e.holes.some(h => inRing(p, h));
  function centroid(r) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f; }
    if (Math.abs(a) < 1e-18) { let sx = 0, sy = 0; r.forEach(p => { sx += p[0]; sy += p[1]; }); return [sx / r.length, sy / r.length]; }
    return [cx / (3 * a), cy / (3 * a)];
  }
  const dist = (a, b) => Math.hypot((a[0] - b[0]) * KLON, (a[1] - b[1]) * KLAT);

  // ejes principales de la silueta: ángulo del eje largo y extensiones (m)
  function axes(r) {
    const c = centroid(r); let sxx = 0, syy = 0, sxy = 0;
    r.forEach(p => { const x = (p[0] - c[0]) * KLON, y = (p[1] - c[1]) * KLAT; sxx += x * x; syy += y * y; sxy += x * y; });
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ct = Math.cos(th), st = Math.sin(th);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    r.forEach(p => { const x = (p[0] - c[0]) * KLON, y = (p[1] - c[1]) * KLAT, u = x * ct + y * st, v = -x * st + y * ct; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); });
    return { c: c, th: th, major: u1 - u0, minor: v1 - v0 };
  }
  function scaleAxes(rings, ax, sMaj, sMin) {
    const ct = Math.cos(ax.th), st = Math.sin(ax.th);
    return rings.map(r => r.map(p => {
      const x = (p[0] - ax.c[0]) * KLON, y = (p[1] - ax.c[1]) * KLAT, u = (x * ct + y * st) * sMaj, v = (-x * st + y * ct) * sMin;
      return [r6(ax.c[0] + (u * ct - v * st) / KLON), r6(ax.c[1] + (u * st + v * ct) / KLAT)];
    }));
  }
  function inflate(rings, m) {
    const c = centroid(rings[0]), r = Math.max(8, Math.sqrt(Math.abs(ringArea(rings[0])) * KLON * KLAT / Math.PI)), k = 1 + m / r;
    return rings.map(ring => ring.map(p => [r6(c[0] + (p[0] - c[0]) * k), r6(c[1] + (p[1] - c[1]) * k)]));
  }

  /* ---------- Overpass → polígonos ---------- */
  function joinRings(segs) {
    const rings = [], eq = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
    segs = segs.filter(s => s.length > 1).map(s => s.slice());
    while (segs.length) {
      let cur = segs.shift(), guard = 0;
      while (!eq(cur[0], cur[cur.length - 1]) && guard++ < 500) {
        const end = cur[cur.length - 1];
        const i = segs.findIndex(s => eq(s[0], end) || eq(s[s.length - 1], end));
        if (i < 0) break;
        let s = segs.splice(i, 1)[0];
        if (!eq(s[0], end)) s = s.slice().reverse();
        cur = cur.concat(s.slice(1));
      }
      if (cur.length > 3 && eq(cur[0], cur[cur.length - 1])) rings.push(cur);
    }
    return rings;
  }
  const geom = g => (g || []).map(p => [p.lon, p.lat]);
  function elementsFromOverpass(json) {
    const out = [];
    (json.elements || []).forEach(el => {
      if (!(el.tags && (el.tags.building || el.tags['building:part']))) return;
      if (el.type === 'way' && el.geometry) {
        const r = geom(el.geometry);
        if (r.length > 3) { if (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1]) r.push(r[0]); out.push({ id: 'w' + el.id, tags: el.tags, outer: r, holes: [] }); }
      } else if (el.type === 'relation' && el.members) {
        const outers = joinRings(el.members.filter(m => m.role === 'outer' && m.geometry).map(m => geom(m.geometry)));
        const inners = joinRings(el.members.filter(m => m.role === 'inner' && m.geometry).map(m => geom(m.geometry)));
        outers.forEach((o, i) => out.push({ id: 'r' + el.id + '_' + i, tags: el.tags, outer: o, holes: inners.filter(h => inRing(h[0], o)) }));
      }
    });
    return out;
  }

  /* ---------- selección de lo que pertenece a cada hito ---------- */
  const isPart = e => !!e.tags['building:part'];
  const hOf = e => { const t = e.tags; let h = num(t.height); if (h == null) h = num(t['building:height']); const lv = num(t['building:levels']); if (h == null && lv != null) h = lv * LV; return h; };
  function probesOf(L) {
    const g60 = []; [-60, 0, 60].forEach(a => [-60, 0, 60].forEach(b => g60.push([a, b])));
    const pr = (L.osm && L.osm.probes) || L.probes || g60;
    return pr.map(o => [L.at[0] + o[0] / KLON, L.at[1] + o[1] / KLAT]);
  }
  function selectFor(k, elems) {
    const L = ALL[k], pts = probesOf(L), tower = !!L.osm, hint = tower ? L.osm.h : (L.h || 30);
    const outlines = elems.filter(e => !isPart(e)), parts = elems.filter(isPart);
    let selOut = outlines.filter(o => pts.some(p => inEl(p, o)));
    if (!selOut.length) {
      let best = null, bd = 70;
      outlines.forEach(o => { const d = dist(centroid(o.outer), L.at); if (d < bd) { bd = d; best = o; } });
      if (best) selOut = [best];
    }
    const sel = new Map();
    selOut.forEach(o => sel.set(o.id, o));
    parts.forEach(p => { if (pts.some(pt => inEl(pt, p)) || selOut.some(o => inRing(centroid(p.outer), o.outer))) sel.set(p.id, p); });
    if (tower) {           // otros cuerpos altos pegados a la torre (los dibujaba antes el filtro por altura)
      elems.forEach(e => { const h = hOf(e); if (h != null && h >= hint * 0.55 && dist(centroid(e.outer), L.at) < 70) sel.set(e.id, e); });
    }
    let list = Array.from(sel.values());
    const partsIn = list.filter(isPart);
    list = list.filter(e => isPart(e) || !partsIn.some(p => inRing(centroid(p.outer), e.outer)));   // un contorno con partes no se dibuja
    return list;
  }

  // para el diagnóstico: alturas de lo usado y de lo que hay cerca sin usar (posibles cuerpos que faltan o cajas que asoman)
  function inspect(k, elems, list) {
    const L = ALL[k], ids = new Set(list.map(e => e.id)), hint = L.osm ? L.osm.h : (L.h || 30);
    const near = elems.filter(e => !ids.has(e.id) && dist(centroid(e.outer), L.at) < 90);
    const tall = near.filter(e => { const h = hOf(e); return h != null && h >= hint * 0.4; });
    const show = e => Math.round(hOf(e) || 0) + (isPart(e) ? 'p' : '');
    return { used: list.map(show).slice(0, 8), other: near.length, tallOther: tall.slice(0, 5).map(show) };
  }

  /* ---------- volúmenes ---------- */
  function convert(k, list) {
    const L = ALL[k], S = L.osm || L, tower = !!L.osm;
    const defWall = (S.wall) || '#cfd3d7', defRoof = S.roof || '#7d848c';
    const out = [];
    const stats = { elems: list.length, parts: list.filter(isPart).length, shapes: 0, colours: 0 };
    list.forEach(e => {
      const t = e.tags, hh = hOf(e);
      let h = hh != null ? hh : (tower ? S.h : (L.h || 12)), m = num(t.min_height);
      if (m == null) m = num(t['building:min_height']);
      const ml = num(t['building:min_level']); if (m == null && ml != null) m = ml * LV;
      m = m || 0;
      if (!(h > m + 0.5)) return;
      const tagged = cssColor(t['building:colour']) || cssColor(t['building:facade:colour']) || cssColor(t.colour);
      const mat = MATERIAL[String(t['building:material'] || t['building:facade:material'] || '').toLowerCase()];
      const wall = tagged || mat || defWall;
      const roofTag = cssColor(t['roof:colour']) || cssColor(t['building:roof:colour']);
      const roof = roofTag || cssColor(t['roof:colour']) || defRoof;
      if (tagged) stats.colours++;
      const shape = String(t['roof:shape'] || t['building:roof:shape'] || '').toLowerCase();
      if (shape && shape !== 'flat') stats.shapes++;
      let rings = [e.outer.map(p => [r6(p[0]), r6(p[1])])].concat(e.holes.map(hr => hr.map(p => [r6(p[0]), r6(p[1])])));
      if (!tower) rings = inflate(rings, 0.9);          // las copias de edificios bajos envuelven al del mapa base
      const ax = axes(e.outer);
      let roofH = num(t['roof:height']) || num(t['building:roof:height']);
      const sloped = shape && shape !== 'flat' && /dome|onion|pyramid|cone|hipped|gabled|half|skillion|mansard|gambrel|saltbox|round/.test(shape);
      if (sloped && !roofH) roofH = Math.min(0.5 * (h - m), (/dome|onion|pyramid|cone/.test(shape) ? 0.35 : 0.22) * ax.minor);
      if (!sloped) roofH = 0;
      const top = h - Math.min(roofH, 0.8 * (h - m));
      const emit = (rs, b, hh2, c) => { if (hh2 > b + 0.05) out.push({ type: 'Feature', properties: { k: k, b: r2(b), h: r2(hh2), c: c }, geometry: { type: 'Polygon', coordinates: rs } }); };
      emit(rings, m, roofH ? top : h, wall);
      if (roofH > 0.4) {
        const n = 6, rh = h - top;
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
          let sMaj = 1, sMin = 1;
          if (/dome/.test(shape)) { sMaj = sMin = Math.sqrt(Math.max(0.03, 1 - tm * tm)); }
          else if (/onion/.test(shape)) { sMaj = sMin = Math.max(0.05, (1 - tm) * (1 + 0.5 * Math.sin(Math.PI * Math.min(1, tm * 1.4)))); }
          else if (/pyramid|cone/.test(shape)) { sMaj = sMin = 1 - 0.95 * tm; }
          else if (/hipped/.test(shape) && !/half/.test(shape)) { sMaj = 1 - 0.5 * tm; sMin = 1 - 0.96 * tm; }
          else if (/half/.test(shape)) { sMaj = 1 - 0.25 * tm; sMin = 1 - 0.95 * tm; }
          else if (/mansard|gambrel/.test(shape)) { sMaj = 1 - 0.1 * tm; sMin = 1 - 0.5 * tm; }
          else { sMaj = 1; sMin = 1 - 0.95 * tm; }          // a dos aguas / inclinado / redondeado
          emit(scaleAxes(rings, ax, sMaj, sMin), top + rh * t0, top + rh * t1 + (i < n - 1 ? 0.05 : 0), roof);
        }
      } else if (roofTag) emit(rings, h - 0.6, h + 0.05, roof);
    });
    stats.feats = out.length;
    stats.rich = stats.parts > 0 || stats.shapes > 0 || stats.colours > 0 || stats.elems >= 3;
    return { feats: out, stats: stats };
  }

  /* ---------- consulta ---------- */
  function sitesList() {
    const s = new Set(VT.TOWERS.concat(VT.SITES));
    ALL.forEach((L, k) => { if (/Bernab/.test(L.name)) s.add(k); });
    return Array.from(s);
  }
  function bboxOf(L, r) {
    const dLat = r / KLAT, dLon = r / KLON;
    return [L.at[1] - dLat, L.at[0] - dLon, L.at[1] + dLat, L.at[0] + dLon].map(v => v.toFixed(5)).join(',');
  }
  // cajas rectangulares en vez de círculos: Overpass las resuelve mucho más rápido
  function queryText(ks) {
    const parts = [];
    ks.forEach(k => {
      const L = ALL[k], r = L.osm ? 110 : Math.max(L.r || 150, /Bernab/.test(L.name) ? 220 : 0), b = bboxOf(L, r);
      ['way["building"]', 'way["building:part"]', 'relation["building"]', 'relation["building:part"]'].forEach(t => parts.push(t + '(' + b + ');'));
    });
    return '[out:json][timeout:40];(' + parts.join('') + ');out tags geom;';
  }
  // tandas de 7 hitos ordenados de sur a norte: peticiones pequeñas en lugar de una enorme
  function batches(ks) {
    const s = ks.slice().sort((a, b) => ALL[a].at[1] - ALL[b].at[1]), out = [];
    for (let i = 0; i < s.length; i += 7) out.push(s.slice(i, i + 7));
    return out;
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function fetchOverpass(q, fetchFn) {
    let last = null;
    for (const ep of ENDPOINTS) {
      for (let intento = 0; intento < 2; intento++) {
        let timer = 0;
        try {
          const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
          if (ctl) timer = setTimeout(() => ctl.abort(), 45000);
          const r = await fetchFn(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl ? ctl.signal : undefined });
          if (timer) clearTimeout(timer);
          if (!r.ok) throw new Error('servidor ocupado (HTTP ' + r.status + ')');
          const j = await r.json();
          if (j && Array.isArray(j.elements)) {
            if (!j.elements.length && j.remark) throw new Error('el servidor no terminó: ' + String(j.remark).slice(0, 80));
            return j;
          }
          throw new Error('respuesta vacía');
        } catch (e) {
          if (timer) clearTimeout(timer);
          last = (e && e.name === 'AbortError') ? new Error('tiempo de espera agotado') : e;
          await sleep(intento === 0 ? 1500 : 0);
        }
      }
    }
    throw last || new Error('sin respuesta');
  }
  async function buildBatch(ks, fetchFn) {
    const json = await fetchOverpass(queryText(ks), fetchFn), elems = elementsFromOverpass(json), res = {};
    ks.forEach(k => { const list = selectFor(k, elems), c = convert(k, list); c.stats.insp = inspect(k, elems, list); c.stats.maxH = c.feats.reduce((m, f) => Math.max(m, f.properties.h), 0); res[k] = { rich: c.stats.rich, stats: c.stats, feats: c.stats.rich ? c.feats : [] }; });
    return { n: (json.elements || []).length, sites: res };
  }
  async function build(fetchFn) {          // (para pruebas) todas las tandas seguidas
    const all = { v: VERSION, t: Date.now(), n: 0, sites: {} };
    for (const b of batches(sitesList())) { const r = await buildBatch(b, fetchFn); all.n += r.n; Object.assign(all.sites, r.sites); }
    return all;
  }

  VT.osm3d = { cssColor: cssColor, joinRings: joinRings, elementsFromOverpass: elementsFromOverpass, selectFor: selectFor, convert: convert, queryText: queryText, build: build, buildBatch: buildBatch, batches: batches, sitesList: sitesList };
  VT.diag3d = {}; VT.osm3dStatus = 'pendiente';

  /* ---------- integración con el mapa ---------- */
  if (typeof maplibregl === 'undefined' || typeof document === 'undefined') return;
  let map = null, data = null, enabled = true, scale = 1, started = false;
  const Orig = maplibregl.Map;
  try {
    maplibregl.Map = class extends Orig {
      constructor(o) { super(o); map = this; VT.map = this; this.on('style.load', onStyle); }
    };
  } catch (e) { VT.osm3dStatus = 'no se pudo enganchar el mapa'; return; }

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:6;padding:7px 14px;border-radius:12px;font-size:13px;background:var(--panel);color:var(--ink);border:1px solid var(--line);display:none;max-width:calc(100% - 24px);text-align:center';
  document.body.appendChild(toast);
  const say = (t, ms) => { toast.textContent = t; toast.style.display = t ? 'block' : 'none'; if (ms) setTimeout(() => { toast.style.display = 'none'; }, ms); };

  const hx = v => ['interpolate', ['linear'], ['zoom'], 15, 0, 16.5, ['*', v, scale]];
  function allFeatures() { const o = []; if (data) Object.keys(data.sites).forEach(k => { if (data.sites[k].rich) data.sites[k].feats.forEach(f => o.push(f)); }); return { type: 'FeatureCollection', features: o }; }
  function richKeys() { return data ? Object.keys(data.sites).filter(k => data.sites[k].rich).map(Number) : []; }

  function render() {
    if (!map || !map.getStyle || !map.getStyle()) return;
    if (!map.getSource('osm3d')) map.addSource('osm3d', { type: 'geojson', data: allFeatures() });
    else map.getSource('osm3d').setData(allFeatures());
    if (!map.getLayer('osm3d')) map.addLayer({ id: 'osm3d', type: 'fill-extrusion', source: 'osm3d', minzoom: 15,
      paint: { 'fill-extrusion-height': hx(['get', 'h']), 'fill-extrusion-base': hx(['get', 'b']), 'fill-extrusion-color': ['get', 'c'], 'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true } },
      map.getLayer('pin-clusters') ? 'pin-clusters' : undefined);
    reapply();
  }
  function reapply() {
    if (!map || !map.getLayer('osm3d')) return;
    map.setLayoutProperty('osm3d', 'visibility', enabled ? 'visible' : 'none');
    const rk = enabled ? richKeys() : [];
    VT.TOWERS.forEach(k => { if (map.getLayer('torre-' + k)) map.setLayoutProperty('torre-' + k, 'visibility', rk.indexOf(k) >= 0 ? 'none' : 'visible'); });
    const dyn = rk.filter(k => VT.SITES.indexOf(k) >= 0 && !ALL[k].osm);
    if (map.getLayer('hitos-dyn-3d')) map.setFilter('hitos-dyn-3d', dyn.length ? ['!', ['in', ['get', 'k'], ['literal', dyn]]] : null);
    const hand = rk.filter(k => ALL[k].parts && !ALL[k].osm && VT.SITES.indexOf(k) < 0);
    if (map.getLayer('hitos-3d')) {
      const base = ['in', ['get', 'k'], ['literal', Array.from(VT.HITOS.keys()).filter(i => !VT.HITOS[i].osm)]];
      map.setFilter('hitos-3d', hand.length ? ['all', base, ['!', ['in', ['get', 'k'], ['literal', hand]]]] : base);
    }
  }
  function onStyle() { render(); if (!started) { started = true; load(); } }

  function diagFill() {
    if (!data) return;
    Object.keys(data.sites).forEach(k => { const s = data.sites[k].stats; VT.diag3d[k] = { rich: data.sites[k].rich, elems: s.elems, parts: s.parts, shapes: s.shapes, colours: s.colours, feats: s.feats, maxH: s.maxH, insp: s.insp }; });
    VT.osm3dStatus = 'listo: ' + richKeys().length + ' de ' + Object.keys(data.sites).length + ' hitos con detalle real (' + data.n + ' elementos leídos)';
  }
  function saveCache() { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) { /* demasiado grande: se usa solo en esta sesión */ } }
  async function load() {
    data = { v: VERSION, t: Date.now(), n: 0, sites: {} };
    try { const c = JSON.parse(localStorage.getItem(STORE) || 'null'); if (c && c.v === VERSION && c.sites && Date.now() - c.t < TTL) data = c; } catch (e) { /* sin caché */ }
    const all = sitesList(), missing = all.filter(k => !data.sites[k]);
    if (Object.keys(data.sites).length) { diagFill(); render(); }
    if (!missing.length) { VT.osm3dStatus += ' · desde la memoria del móvil'; return; }
    const tandas = batches(missing); let ok = 0, lastErr = null;
    for (let i = 0; i < tandas.length; i++) {
      say('Cargando el detalle real de los edificios (OpenStreetMap), solo esta vez… ' + (i + 1) + '/' + tandas.length);
      VT.osm3dStatus = 'descargando ' + (i + 1) + '/' + tandas.length + '…';
      try {
        const r = await buildBatch(tandas[i], fetch.bind(window));
        data.n += r.n; Object.assign(data.sites, r.sites); ok++;
        saveCache(); diagFill(); render();
      } catch (e) { lastErr = e; }
    }
    if (ok === tandas.length) { say('Detalle real cargado.', 2500); }
    else {
      const why = lastErr && lastErr.message ? lastErr.message : String(lastErr);
      diagFill();
      VT.osm3dStatus += ' · ' + (tandas.length - ok) + ' de ' + tandas.length + ' tandas sin cargar (' + why + '); se reintentará en la próxima visita';
      say(ok ? 'Detalle de OpenStreetMap cargado a medias (' + why + ').' : 'No se pudo cargar el detalle de OpenStreetMap (' + why + '). Se usa el mapa básico.', 7000);
    }
  }

  // casilla en Opciones + escala de altura + clic
  const host = document.getElementById('hudbody');
  if (host) {
    const row = document.createElement('div'); row.className = 'row';
    const lab = document.createElement('label'), cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = true; lab.appendChild(cb); lab.appendChild(document.createTextNode(' Detalle real de edificios (OpenStreetMap)'));
    row.appendChild(lab); host.appendChild(row);
    cb.addEventListener('change', () => { enabled = cb.checked; reapply(); });
  }
  const hs = document.getElementById('hscale');
  if (hs) hs.addEventListener('change', () => {
    scale = +hs.value;
    if (map && map.getLayer('osm3d')) { map.setPaintProperty('osm3d', 'fill-extrusion-height', hx(['get', 'h'])); map.setPaintProperty('osm3d', 'fill-extrusion-base', hx(['get', 'b'])); }
  });
  const wait = setInterval(() => {
    if (!map) return; clearInterval(wait);
    map.on('click', e => {
      if (!map.getLayer('osm3d')) return;
      const f = map.queryRenderedFeatures(e.point, { layers: ['osm3d'] });
      if (!f.length) return;
      const item = document.querySelector('#hitoItems .item[data-k="' + f[0].properties.k + '"]');
      if (item) setTimeout(() => item.click(), 0);
    });
  }, 200);
})();
