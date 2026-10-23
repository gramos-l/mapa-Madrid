/* Hitos de Madrid: modelos 3D hechos a mano, edificios que se recolorean sobre su silueta real y utilidades de geometría.
   Este archivo no depende del mapa: expone window.VT para que lo use app.js. */
(function () {
  'use strict';

  /* ====== HITOS DE MADRID: modelos 3D (editables) ======
     Cada hito: posición real (lon, lat) y una lista de piezas.
     Medidas en metros. z0/z1 = altura inferior/superior de cada pieza. */
  const KLON = 84860, KLAT = 111040;             // metros por grado en Madrid
  const grid5 = s => { const o = []; [-2, -1, 0, 1, 2].forEach(a => [-2, -1, 0, 1, 2].forEach(b => o.push([a * s, b * s]))); return o; };
  const HITOS = [
    { name: 'Torre de Cristal', at: [-3.687555, 40.47823], osm: { probes: grid5(12), r: 140, h: 249, wall: '#3a6f87', band: { h: 7.2, c: '#9cc3d2' }, low: '#9aa6ae', roof: '#c5dde6' }, info: '249 m · 2008 · César Pelli', parts: [
      { t: 'box', w: 46, d: 40, cham: 8, z0: 0, z1: 226, c: '#2d6e86', band: { h: 7.2, c: '#a9d6e2' } },
      { t: 'box', w: 38, d: 33, cham: 6, z0: 226, z1: 238, c: '#3f84a0', band: { h: 6, c: '#bfe3ec' } },
      { t: 'box', w: 28, d: 26, cham: 5, z0: 238, z1: 249, c: '#c8e8f0' } ] },
    { name: 'Torre Moeve (Cepsa)', at: [-3.687758, 40.475731], osm: { probes: grid5(12), r: 140, h: 248, wall: '#c9d0d6', band: { h: 8, c: '#8f9ba6' }, low: '#9aa3ab', roof: '#eef2f5' }, info: '248 m · 2008 · Norman Foster', parts: [
      { t: 'loft', w: 56, d: 38, cham: 8, z0: 0, z1: 242, k0: 1, k1: 0.68, n: 30, c: '#8d9fb0', c1: '#dbe4ec' },
      { t: 'loft', w: 38, d: 26, cham: 6, z0: 242, z1: 248.3, k0: 1, k1: 0.9, n: 2, c: '#f0f4f7' } ] },
    { name: 'Torre PwC', at: [-3.687919, 40.476669], osm: { probes: grid5(12), r: 140, h: 236, wall: '#6a9cc4', band: { h: 9, c: '#f4f7f9' }, low: '#9aa6b0', roof: '#e8f0f5' }, info: '236 m · 2008', parts: [
      { t: 'box', w: 50, d: 34, cham: 6, z0: 0, z1: 200, c: '#4f8db8', band: { h: 9, c: '#f6f9fb' } },
      { t: 'box', w: 40, d: 28, cham: 5, z0: 200, z1: 236, c: '#7cb0d4', band: { h: 9, c: '#ffffff' } } ] },
    { name: 'Torre Emperador', at: [-3.686787, 40.47908], osm: { probes: grid5(12), r: 140, h: 224, wall: '#dde5ea', band: { h: 6, c: '#6f93aa' }, low: '#a7b0b6', roof: '#f4f8fa' }, info: '224 m · 2008 · Pei Cobb Freed', parts: [
      { t: 'box', w: 46, d: 40, cham: 4, z0: 0, z1: 150, c: '#23778c', band: { h: 6, c: '#cfeaf0' } },
      { t: 'box', w: 38, d: 34, cham: 4, z0: 150, z1: 195, c: '#3a90a5', band: { h: 6, c: '#dff2f6' } },
      { t: 'box', w: 28, d: 28, cham: 3, z0: 195, z1: 224.2, c: '#9fd0dc' } ] },
    { name: 'Caleido', at: [-3.689158, 40.477798], osm: { probes: grid5(14), r: 160, h: 173, wall: '#d6d8d3', band: { h: 4.5, c: '#86a9b9' }, low: '#9ba19d', roof: '#e6e8e4' }, info: '173 m · 2021', parts: [
      { t: 'box', w: 70, d: 55, z0: 0, z1: 28, c: '#8c938e', band: { h: 7, c: '#c3c8c4' } },
      { t: 'box', w: 36, d: 46, dx: -6, z0: 28, z1: 173.2, c: '#dcddd6', band: { h: 4.5, c: '#86adc0' } } ] },
    { name: 'Torre Picasso', at: [-3.693016, 40.45031], osm: { probes: grid5(12), r: 140, h: 156, wall: '#dadde0', band: { h: 4, c: '#69737d' }, low: '#a9afb4', roof: '#8a949e' }, info: '156 m · 1989 · Minoru Yamasaki', parts: [
      { t: 'box', w: 45, d: 45, cham: 7, z0: 0, z1: 150, c: '#e4e7e9', band: { h: 4, c: '#77818b' } },
      { t: 'box', w: 45, d: 45, cham: 7, z0: 150, z1: 156.4, c: '#8b95a0' } ] },
    { name: 'Torre Europa', at: [-3.691605, 40.451485], osm: { probes: grid5(12), r: 140, h: 116, wall: '#d3d8dc', band: { h: 3.9, c: '#5d7a93' }, low: '#a9b0b5', roof: '#eef1f3' }, info: '116 m · 1985', parts: [
      { t: 'box', w: 52, d: 26, cham: 5, z0: 0, z1: 110, c: '#d9dde1', band: { h: 3.9, c: '#6c7884' } },
      { t: 'box', w: 44, d: 22, cham: 4, z0: 110, z1: 116.1, c: '#eef1f3' } ] },
    { name: 'Torre de Madrid', at: [-3.712199, 40.424397], osm: { probes: grid5(12), r: 140, h: 142, wall: '#d9c9a2', band: { h: 3.2, c: '#a8895c' }, low: '#b9a888', roof: '#7a573a' }, info: '142 m · 1957 · hermanos Otamendi', parts: [
      { t: 'box', w: 44, d: 40, z0: 0, z1: 60, c: '#e3d6b6', band: { h: 3.2, c: '#b49a72' } },
      { t: 'box', w: 38, d: 34, z0: 60, z1: 100, c: '#e6dab9', band: { h: 3.2, c: '#b49a72' } },
      { t: 'box', w: 30, d: 28, z0: 100, z1: 124, c: '#e9ddbe', band: { h: 3.2, c: '#b49a72' } },
      { t: 'box', w: 20, d: 18, z0: 124, z1: 142, c: '#7a573a' } ] },
    { name: 'Torres de Colón', at: [-3.691106, 40.425632], osm: { probes: [[0, 22], [0, -22], [10, 22], [-10, 22], [10, -22], [-10, -22], [0, 34], [0, -34]], r: 140, h: 115, wall: '#7a4a3a', band: { h: 3.8, c: '#b08a74' }, low: '#a08874', roof: '#f1ede4' }, info: '115 m · 1976 · Antonio Lamela', parts: [
      { t: 'box', w: 36, d: 24, dy: 22, z0: 0, z1: 100.6, c: '#6a483a', band: { h: 3.8, c: '#a67d66' } },
      { t: 'box', w: 38, d: 26, dy: 22, z0: 100.6, z1: 115.1, c: '#f3efe6' },
      { t: 'box', w: 36, d: 24, dy: -22, z0: 0, z1: 100.6, c: '#6a483a', band: { h: 3.8, c: '#a67d66' } },
      { t: 'box', w: 38, d: 26, dy: -22, z0: 100.6, z1: 115.1, c: '#f3efe6' } ] },
    { name: 'Puerta de Europa I (Torre KIO)', at: [-3.690103, 40.466995], osm: { probes: grid5(12), r: 130, h: 114, wall: '#3e4853', band: { h: 4, c: '#9ba6b1' }, low: '#8a939c', roof: '#c4ced8' }, lean: { deg: 15, to: [-3.688112, 40.46669] }, info: '114 m · 1996 · inclinada 15°', parts: [
      { t: 'loft', w: 34, d: 30, z0: 0, z1: 108, k0: 1, k1: 1, n: 40, c: '#3b4653', c1: '#8794a3' },
      { t: 'loft', w: 34, d: 30, z0: 108, z1: 113.8, k0: 1, k1: 1, n: 3, c: '#c4ced8' } ] },
    { name: 'Puerta de Europa II (Torre KIO)', at: [-3.688112, 40.46669], osm: { probes: grid5(12), r: 130, h: 114, wall: '#3e4853', band: { h: 4, c: '#9ba6b1' }, low: '#8a939c', roof: '#c4ced8' }, lean: { deg: 15, to: [-3.690103, 40.466995] }, info: '114 m · 1996 · inclinada 15°', parts: [
      { t: 'loft', w: 34, d: 30, z0: 0, z1: 108, k0: 1, k1: 1, n: 40, c: '#3b4653', c1: '#8794a3' },
      { t: 'loft', w: 34, d: 30, z0: 108, z1: 113.8, k0: 1, k1: 1, n: 3, c: '#c4ced8' } ] },
    { name: 'Edificio España', at: [-3.711002, 40.424061], osm: { probes: grid5(16), r: 150, h: 107, wall: '#d8bf9b', band: { h: 3.4, c: '#a88a62' }, low: '#bda583', roof: '#6f5444' }, info: '107 m · 1953 · hermanos Otamendi', parts: [
      { t: 'box', w: 64, d: 48, z0: 0, z1: 46, c: '#dcc39c', band: { h: 3.4, c: '#b5956a' } },
      { t: 'box', w: 44, d: 34, z0: 46, z1: 92, c: '#dfc7a2', band: { h: 3.4, c: '#b5956a' } },
      { t: 'box', w: 30, d: 24, z0: 92, z1: 107, c: '#7a5c46' },
      { t: 'loft', w: 14, d: 12, z0: 107, z1: 117, k0: 1, k1: 0.1, n: 6, c: '#4d4137' } ] },
    { name: 'Castellana 81', at: [-3.691986, 40.447609], osm: { probes: grid5(12), r: 140, h: 107, wall: '#a8742a', band: { h: 3.9, c: '#dcae5c' }, low: '#a9926a', roof: '#c99a45' }, info: '107 m · 1981 · Sáenz de Oiza', parts: [
      { t: 'box', w: 40, d: 34, cham: 7, z0: 0, z1: 98, c: '#9a6c20', band: { h: 3.9, c: '#d9ab58' } },
      { t: 'box', w: 30, d: 26, cham: 5, z0: 98, z1: 107, c: '#c99a45' } ] },
    { name: 'Torre Titania', at: [-3.6945, 40.446812], osm: { probes: grid5(12), r: 140, h: 104, wall: '#6f98b4', band: { h: 4.2, c: '#d6e6ef' }, low: '#9fb0ba', roof: '#cfe0ea' }, info: '104 m · 2011', parts: [
      { t: 'box', w: 38, d: 30, cham: 5, z0: 0, z1: 96, c: '#5f89a5', band: { h: 4.2, c: '#d3e4ee' } },
      { t: 'box', w: 28, d: 22, cham: 4, z0: 96, z1: 103.7, c: '#cfe0ea' } ] },
    { name: 'Torrespaña', at: [-3.664186, 40.420522], info: '232 m · 1982', parts: [
      { t: 'box', w: 24, d: 24, z0: 0, z1: 20, c: '#a39d92' },
      { t: 'box', w: 13, d: 13, z0: 20, z1: 118, c: '#b6b0a4' },
      { t: 'loft', w: 30, d: 30, z0: 118, z1: 134, k0: 0.45, k1: 1, n: 4, c: '#8f897e' },
      { t: 'box', w: 30, d: 30, z0: 134, z1: 150, c: '#9b958a', band: { h: 4, c: '#6f6a61' } },
      { t: 'loft', w: 30, d: 30, z0: 150, z1: 166, k0: 1, k1: 0.3, n: 4, c: '#8f897e' },
      { t: 'box', w: 4, d: 4, z0: 166, z1: 184, c: '#d0392e' }, { t: 'box', w: 3.4, d: 3.4, z0: 184, z1: 200, c: '#f4f4f4' },
      { t: 'box', w: 3, d: 3, z0: 200, z1: 216, c: '#d0392e' }, { t: 'box', w: 2.4, d: 2.4, z0: 216, z1: 232, c: '#f4f4f4' } ] },
    { name: 'Faro de Moncloa', at: [-3.721668, 40.437343], zoom: 16.8, info: '110 m · 1992', parts: [
      { t: 'cyl', r: 4.2, z0: 0, z1: 20, c: '#aab2bb' },
      { t: 'cyl', r: 3, z0: 20, z1: 70, c: '#c3cad2' },
      { t: 'cyl', r: 7.5, z0: 70, z1: 80, c: '#eef0f2' },
      { t: 'cyl', r: 8.5, z0: 80, z1: 88, c: '#cdd3da' },
      { t: 'cyl', r: 7, z0: 88, z1: 92, c: '#eef0f2' },
      { t: 'cyl', r: 1.2, z0: 92, z1: 110, c: '#d0392e', n: 10 } ] },
    { name: 'Obelisco de Calatrava', at: [-3.68934, 40.46602], zoom: 17, info: '93 m · 2009 · Santiago Calatrava', parts: [
      { t: 'box', w: 14, d: 14, z0: 0, z1: 1.2, c: '#8c8c88' },
      { t: 'loft', w: 9, d: 9, z0: 1.2, z1: 93, k0: 1, k1: 0.3, n: 16, c: '#a8743a', c1: '#c79a5a' } ] },
    { name: 'Puerta de Alcalá', at: [-3.688737, 40.419991], zoom: 17.8, info: '22 m · 1778 · Francesco Sabatini', parts: (function () {
        const P = []; let y = -22; const seq = [3.6, 'o3.6', 2.8, 'o5.6', 2.8, 'o7.2', 2.8, 'o5.6', 2.8, 'o3.6', 3.6];
        seq.forEach(s => { if (typeof s === 'number') { P.push({ t: 'box', w: 7.2, d: s, dy: y + s / 2, z0: 0, z1: 13.5, c: '#d9cfb8' }); y += s; } else y += parseFloat(s.slice(1)); });
        P.push({ t: 'box', w: 7.2, d: 44, z0: 13.5, z1: 16.5, c: '#e2d8c0' });
        P.push({ t: 'box', w: 6, d: 40, z0: 16.5, z1: 19.8, c: '#d9cfb8' });
        P.push({ t: 'box', w: 7.2, d: 44, z0: 19.8, z1: 20.8, c: '#e8e0cc' });
        P.push({ t: 'box', w: 3, d: 6, z0: 20.8, z1: 21.9, c: '#cfc5ac' });
        return P; })() },
    { name: 'Estadio Santiago Bernabéu', at: [-3.68835, 40.45306], zoom: 16.6, info: 'Estadio del Real Madrid · inaugurado en 1947', parts: [
      { t: 'ring', w: 262, d: 222, r: 50, hw: 196, hd: 156, hr: 38, z0: 0, z1: 42, c: '#d0d5da', band: { h: 6, c: '#8f99a3' } },
      { t: 'ring', w: 262, d: 222, r: 50, hw: 168, hd: 124, hr: 32, z0: 42, z1: 54, c: '#b9c0c7' },
      { t: 'box', w: 108, d: 70, z0: 0, z1: 0.4, c: '#4f8f3f' } ] }
  ];

  /* ---------- Generador de volúmenes ---------- */
  const rad = d => d * Math.PI / 180;
  function rectPoly(w, d, c) {
    const a = w / 2, b = d / 2;
    if (!c) return [[-a, -b], [a, -b], [a, b], [-a, b]];
    c = Math.min(c, a, b);
    return [[-a + c, -b], [a - c, -b], [a, -b + c], [a, b - c], [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c]];
  }
  function roundRect(w, d, r) {
    const a = w / 2, b = d / 2; r = Math.min(r || 0, a, b);
    if (!r) return [[-a, -b], [a, -b], [a, b], [-a, b]];
    const out = [], corners = [[a - r, b - r, 0], [-a + r, b - r, 90], [-a + r, -b + r, 180], [a - r, -b + r, 270]];
    corners.forEach(c => { for (let i = 0; i <= 6; i++) { const t = (c[2] + i * 15) * Math.PI / 180; out.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]); } });
    return out;
  }
  function circlePoly(r, n) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([r * Math.cos(a), r * Math.sin(a)]); } return o; }
  function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function mixHex(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

  function buildHitos() {
    const feats = [];
    HITOS.forEach((H, k) => {
      const rot = rad(H.rot || 0);
      let lean = null;
      if (H.lean) {
        const vx = (H.lean.to[0] - H.at[0]) * KLON, vy = (H.lean.to[1] - H.at[1]) * KLAT, L = Math.hypot(vx, vy) || 1;
        lean = { t: Math.tan(rad(H.lean.deg)), x: vx / L, y: vy / L };
      }
      const toLL = (poly, dx, dy) => {
        const ring = poly.map(p => {
          let x = p[0], y = p[1];
          x += dx; y += dy;                                      // desplazamiento local de la pieza
          const xr = x * Math.cos(rot) + y * Math.sin(rot), yr = -x * Math.sin(rot) + y * Math.cos(rot);   // giro (grados horarios)
          return [H.at[0] + xr / KLON, H.at[1] + yr / KLAT];
        });
        ring.push(ring[0]);
        return ring;
      };
      const add = (poly, dx, dy, z0, z1, c, hole) => {
        const rings = [toLL(poly, dx, dy)];
        if (hole) rings.push(toLL(hole, dx, dy));
        feats.push({ type: 'Feature', properties: { k: k, b: Math.round(z0 * 100) / 100, h: Math.round(z1 * 100) / 100, c: c }, geometry: { type: 'Polygon', coordinates: rings } });
      };
      H.parts.forEach(P => {
        const dx = P.dx || 0, dy = P.dy || 0;
        if (P.t === 'box') {
          const poly = rectPoly(P.w, P.d, P.cham);
          if (!P.band) add(poly, dx, dy, P.z0, P.z1, P.c);
          else for (let z = P.z0; z < P.z1 - 0.01; z += P.band.h) {      // franjas horizontales: simulan pisos y cristal
            const zm = Math.min(z + P.band.h * 0.78, P.z1), ze = Math.min(z + P.band.h, P.z1);
            add(poly, dx, dy, z, zm, P.c);
            if (ze > zm + 0.01) add(poly, dx, dy, zm, ze, P.band.c);
          }
        }
        else if (P.t === 'cyl') add(circlePoly(P.r, P.n || 22), dx, dy, P.z0, P.z1, P.c);
        else if (P.t === 'ring') {                                        // volumen con hueco (estadios, patios)
          const outer = roundRect(P.w, P.d, P.r), inner = roundRect(P.hw, P.hd, P.hr);
          if (!P.band) add(outer, dx, dy, P.z0, P.z1, P.c, inner);
          else for (let z = P.z0; z < P.z1 - 0.01; z += P.band.h) {
            const zm = Math.min(z + P.band.h * 0.78, P.z1), ze = Math.min(z + P.band.h, P.z1);
            add(outer, dx, dy, z, zm, P.c, inner);
            if (ze > zm + 0.01) add(outer, dx, dy, zm, ze, P.band.c, inner);
          }
        }
        else if (P.t === 'loft') {
          const n = P.n || 8, base = rectPoly(P.w, P.d, P.cham);
          for (let i = 0; i < n; i++) {
            const f0 = i / n, f1 = (i + 1) / n, fm = (f0 + f1) / 2;
            const s = (P.k0 == null ? 1 : P.k0) + ((P.k1 == null ? 1 : P.k1) - (P.k0 == null ? 1 : P.k0)) * fm;
            const z0 = P.z0 + (P.z1 - P.z0) * f0, z1 = P.z0 + (P.z1 - P.z0) * f1, zm = (z0 + z1) / 2;
            const ox = lean ? lean.t * zm * lean.x : 0, oy = lean ? lean.t * zm * lean.y : 0;
            const col = P.c1 ? mixHex(P.c, P.c1, fm) : P.c;
            add(base.map(p => [p[0] * s, p[1] * s]), dx + ox, dy + oy, z0, z1 + (i < n - 1 ? 0.05 : 0), col);
          }
        }
      });
    });
    return { type: 'FeatureCollection', features: feats };
  }

  const HITOS_GEO = buildHitos();

  /* ====== HITOS SOBRE LA SILUETA REAL ======
     Palacio Real, Cibeles, Almudena, Bernabéu…: el mapa base ya dibuja su volumen. Cuando las teselas están cargadas,
     leemos esa silueta y altura reales, y dibujamos encima una copia con los colores del edificio (muros y tejado)
     más sus elementos singulares (cúpula, torre…). Si el edificio todavía no se ha cargado, se reintenta solo. */
  const grid3 = s => { const o = []; [-1, 0, 1].forEach(a => [-1, 0, 1].forEach(b => o.push([a * s, b * s]))); return o; };
  const DYN = [
    { name: 'Palacio Real', at: [-3.71433, 40.41796], probes: grid3(55), r: 170, h: 33, wall: '#ebe3cf', roof: '#7f8993', roofT: 3.5, zoom: 17, info: 'Siglo XVIII · residencia oficial de la Corona' },
    { name: 'Catedral de la Almudena', at: [-3.71440, 40.41585], probes: grid3(45), r: 150, h: 34, base: 34, wall: '#ddd3b9', roof: '#7e868f', roofT: 4, extra: 'almudena', zoom: 17, info: 'Consagrada en 1993 · cúpula neoclásica' },
    { name: 'Palacio de Cibeles', at: [-3.69196, 40.41883], probes: grid3(45), r: 150, h: 42, base: 44, wall: '#f1ece2', roof: '#4f565e', roofT: 6, extra: 'cibeles', ref: [-3.69309, 40.41934], zoom: 17, info: '1919 · Antonio Palacios y Joaquín Otamendi' },
    { name: 'Banco de España', at: [-3.69492, 40.41791], probes: grid3(40), r: 150, h: 30, wall: '#e7dcc1', roof: '#6d747c', roofT: 4, zoom: 17, info: '1891 · Eduardo Adaro' },
    { name: 'Edificio Metrópolis', at: [-3.69805, 40.41905], probes: grid3(22), r: 100, h: 40, base: 38, wall: '#f0ebe0', roof: '#59626d', roofT: 5, extra: 'metropolis', ref: [-3.69762, 40.41932], zoom: 18, info: '1911 · Jules y Raymond Février' },
    { name: 'Edificio Telefónica', at: [-3.701907, 40.420338], probes: grid3(25), r: 120, h: 80, wall: '#cdbb9a', roof: '#5b5147', roofT: 6, zoom: 17.4, info: '88 m · 1929 · primer rascacielos de Madrid' }
  ];
  const ALL = HITOS.concat(DYN);
  const TOWERS = [];
  ALL.forEach((L, k) => { if (L.osm) TOWERS.push(k); });
  const diag = {};   // qué ha leído el mapa de cada sitio (para el panel «Diagnóstico»)
  /* geometría sobre lon/lat */
  const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };
  function inRing(p, r) {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function inPoly(p, poly) { if (!inRing(p, poly[0])) return false; for (let i = 1; i < poly.length; i++) if (inRing(p, poly[i])) return false; return true; }
  const polysOf = g => !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  const keyOf = poly => poly[0].length + ':' + poly[0][0][0].toFixed(6) + ':' + poly[0][0][1].toFixed(6) + ':' + Math.abs(ringArea(poly[0])).toExponential(3);
  function centroid(poly) {
    const r = poly[0]; let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f; }
    if (Math.abs(a) < 1e-18) { let sx = 0, sy = 0; r.forEach(p => { sx += p[0]; sy += p[1]; }); return [sx / r.length, sy / r.length]; }
    return [cx / (3 * a), cy / (3 * a)];
  }
  // agranda la silueta unos metros hacia fuera: así la copia coloreada envuelve al edificio del mapa base y no queda oculta dentro
  function inflate(poly, meters) {
    const c = centroid(poly), aM = Math.abs(ringArea(poly[0])) * KLON * KLAT, r = Math.max(8, Math.sqrt(aM / Math.PI));
    return scaleAbout(poly, c, 1 + meters / r);
  }
  function scaleAbout(poly, c, k) { return [poly[0].map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k])].concat(poly.slice(1)); }
  // punto del contorno más cercano a ref, con la dirección (rumbo en grados) de ese lado
  function nearestEdge(poly, ref) {
    const r = poly[0]; let best = null;
    for (let i = 0; i < r.length - 1; i++) {
      const ax = (r[i][0] - ref[0]) * KLON, ay = (r[i][1] - ref[1]) * KLAT, bx = (r[i + 1][0] - ref[0]) * KLON, by = (r[i + 1][1] - ref[1]) * KLAT;
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2));
      const px = ax + dx * t, py = ay + dy * t, d = Math.hypot(px, py);
      if (!best || d < best.d) best = { d: d, pt: [ref[0] + px / KLON, ref[1] + py / KLAT], bearing: Math.atan2(dx, dy) * 180 / Math.PI };
    }
    return best;
  }
  function nearestVertex(poly, ref) {
    let best = null;
    poly[0].forEach(p => { const d = Math.hypot((p[0] - ref[0]) * KLON, (p[1] - ref[1]) * KLAT); if (!best || d < best.d) best = { d: d, pt: p }; });
    return best;
  }
  const toward = (from, to, m) => { const dx = (to[0] - from[0]) * KLON, dy = (to[1] - from[1]) * KLAT, L = Math.hypot(dx, dy) || 1; return [from[0] + dx / L * m / KLON, from[1] + dy / L * m / KLAT]; };
  function ringAt(pts, lon, lat, rotDeg) {
    const a = rad(rotDeg || 0), ca = Math.cos(a), sa = Math.sin(a);
    const r = pts.map(p => [lon + (p[0] * ca + p[1] * sa) / KLON, lat + (-p[0] * sa + p[1] * ca) / KLAT]);
    r.push(r[0]); return r;
  }
  const dynFeat = (k, ring, z0, z1, c) => ({ type: 'Feature', properties: { k: k, b: Math.round(z0 * 100) / 100, h: Math.round(z1 * 100) / 100, c: c },
    geometry: { type: 'Polygon', coordinates: Array.isArray(ring[0][0]) ? ring : [ring] } });
  function domeAt(out, k, c, R, z0, hh, col, n) {
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2, r = Math.max(R * Math.sqrt(1 - tm * tm), R * 0.08);
      out.push(dynFeat(k, ringAt(circlePoly(r, 20), c[0], c[1], 0), z0 + hh * t0, z0 + hh * t1 + (i < n - 1 ? 0.05 : 0), col));
    }
  }
  const EXTRAS = {
    almudena(L, k, big, h, out) {
      const c = centroid(big.poly), base = Math.min(h, L.base || h);
      out.push(dynFeat(k, ringAt(circlePoly(9.5, 24), c[0], c[1], 0), base, base + 12, L.wall));
      domeAt(out, k, c, 9.5, base + 12, 14, '#8a929b', 9);
      out.push(dynFeat(k, ringAt(circlePoly(1.8, 12), c[0], c[1], 0), base + 26, base + 33, '#dcd3b8'));
    },
    cibeles(L, k, big, h, out) {
      const e = nearestEdge(big.poly, L.ref), base = Math.min(h, L.base || h);
      const ctr = toward(e.pt, centroid(big.poly), 15);
      out.push(dynFeat(k, ringAt(rectPoly(12, 12), ctr[0], ctr[1], e.bearing), base, base + 22, L.wall));
      for (let i = 0; i < 5; i++) {
        const f0 = i / 5, f1 = (i + 1) / 5, s = 1.1 - 0.95 * (f0 + f1) / 2;
        out.push(dynFeat(k, ringAt(rectPoly(12 * s, 12 * s), ctr[0], ctr[1], e.bearing), base + 22 + 12 * f0, base + 22 + 12 * f1, '#4f565e'));
      }
      out.push(dynFeat(k, ringAt(circlePoly(0.7, 8), ctr[0], ctr[1], 0), base + 34, base + 44, '#4f565e'));
    },
    metropolis(L, k, big, h, out) {
      const v = nearestVertex(big.poly, L.ref), c = toward(v.pt, centroid(big.poly), 5), base = Math.min(h, L.base || h);
      out.push(dynFeat(k, ringAt(circlePoly(5.2, 20), c[0], c[1], 0), base, base + 4, '#f0ebe0'));
      domeAt(out, k, c, 5.2, base + 4, 6.5, '#47505b', 6);
      out.push(dynFeat(k, ringAt(circlePoly(0.9, 8), c[0], c[1], 0), base + 10.5, base + 15.5, '#d4a72c'));   // el Ave Fénix
    }
  };

  // franjas horizontales (pisos / cristal) sobre una silueta real
  function bandSlices(out, k, poly, z0, z1, main, band) {
    const total = z1 - z0; if (total <= 0) return;
    let step = band.h; if (total / step > 90) step = total / 90;
    for (let z = z0; z < z1 - 0.01; z += step) {
      const zm = Math.min(z + step * 0.78, z1), ze = Math.min(z + step, z1);
      out.push(dynFeat(k, poly, z, zm, main));
      if (ze > zm + 0.01) out.push(dynFeat(k, poly, zm, ze, band.c));
    }
  }
  const siteOf = L => L.osm ? Object.assign({ name: L.name, at: L.at }, L.osm) : L;

  function captureOne(map, L0, k) {
    const L = siteOf(L0);
    const q = f => { try { return map.querySourceFeatures('ofm', { sourceLayer: 'building', filter: f }); } catch (e) { return []; } };
    let feats = q(['<', ['distance', { type: 'Point', coordinates: L.at }], (L.r || 150) + 60]);
    let viaDistance = feats.length > 0;
    if (!feats.length) feats = q(['>', ['coalesce', ['get', 'render_height'], 0], 10]);
    const cand = new Map();
    // 1) partes que contienen alguno de los puntos de prueba (cuerpos apilados, contorno, podio…)
    L.probes.forEach(o => {
      const pt = [L.at[0] + o[0] / KLON, L.at[1] + o[1] / KLAT];
      feats.forEach(f => {
        if (f.properties && f.properties.hide_3d) return;
        polysOf(f.geometry).forEach(poly => {
          if (!inPoly(pt, poly)) return;
          const key = keyOf(poly);
          if (!cand.has(key)) cand.set(key, { poly: poly, a: Math.abs(ringArea(poly[0])), h: +f.properties.render_height || 0, m: +f.properties.render_min_height || 0 });
        });
      });
    });
    // 2) torres: cuerpos altos cuyo centro está más cerca de esta torre que de cualquier otra (aunque la posición no sea exacta)
    let tall = 0;
    if (L.band) {
      feats.forEach(f => {
        if (f.properties && f.properties.hide_3d) return;
        const h = +f.properties.render_height || 0;
        if (h < L.h * 0.55) return;
        polysOf(f.geometry).forEach(poly => {
          const c = centroid(poly);
          let bestK = -1, bestD = 1e9;
          TOWERS.forEach(tk => {
            const T = ALL[tk], d = Math.hypot((c[0] - T.at[0]) * KLON, (c[1] - T.at[1]) * KLAT);
            if (d < bestD) { bestD = d; bestK = tk; }
          });
          if (bestK !== k || bestD > 130) return;
          const key = keyOf(poly);
          if (!cand.has(key)) { cand.set(key, { poly: poly, a: Math.abs(ringArea(poly[0])), h: h, m: +f.properties.render_min_height || 0 }); tall++; }
        });
      });
    }
    const hs = []; cand.forEach(c => { const v = Math.round(c.h); if (hs.indexOf(v) < 0 && hs.length < 8) hs.push(v); });
    diag[k] = { feats: feats.length, via: viaDistance ? 'distance' : 'altura', cand: cand.size, tall: tall, hs: hs, out: 0 };
    if (!cand.size) return [];
    const out = [];
    let big = null, hBig = L.h, hMax = 0;
    cand.forEach(c => { hMax = Math.max(hMax, c.h > 2 ? c.h : L.h); });
    cand.forEach(c => {
      const h = c.h > 2 ? c.h : L.h, p = inflate(c.poly, 1.4);
      if (!big || c.a > big.a) { big = c; hBig = h; }
      const isLow = L.band && h < hMax * 0.3;             // podio o cuerpos bajos de una torre
      if (isLow) out.push(dynFeat(k, p, c.m, h + 0.3, L.low || L.wall));
      else if (L.band) {
        const top = L.roof ? Math.min(3, (h - c.m) * 0.05) : 0;
        bandSlices(out, k, p, c.m, h + 0.3 - top, L.wall, L.band);
        if (top > 0) out.push(dynFeat(k, p, h + 0.3 - top, h + 0.3, L.roof));
      } else if (L.roofT && h - c.m > L.roofT * 2) {
        out.push(dynFeat(k, p, c.m, h - L.roofT, L.wall));
        out.push(dynFeat(k, p, h - L.roofT, h + 0.3, L.roof));
      } else out.push(dynFeat(k, p, c.m, h + 0.3, L.wall));
    });
    if (L.extra && EXTRAS[L.extra] && big) EXTRAS[L.extra](L, k, big, hBig, out);
    diag[k].out = out.length;
    return out;
  }

  // Sitios que se recolorean sobre la silueta real: las torres (con 'osm') y los edificios de DYN
  const SITES = [];
  ALL.forEach((L, k) => { if (L.probes) SITES.push(k); });

  window.VT = { KLON: KLON, KLAT: KLAT, HITOS: HITOS, DYN: DYN, ALL: ALL, HITOS_GEO: HITOS_GEO, SITES: SITES, TOWERS: TOWERS, captureOne: captureOne, diag: diag };
})();
