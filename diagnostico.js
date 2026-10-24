/* Panel «Diagnóstico de hitos»: muestra qué datos reales de OpenStreetMap se han leído de cada torre y edificio,
   y qué ha leído el mapa base (para detectar por qué alguno no se ve bien). Se abre desde Opciones. */
(function () {
  'use strict';
  const VT = window.VT, host = document.getElementById('hudbody');
  if (!VT || !host) return;

  const row = document.createElement('div');
  row.className = 'row';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.textContent = 'Diagnóstico de hitos';
  row.appendChild(btn); host.appendChild(row);

  const box = document.createElement('pre');
  box.setAttribute('aria-live', 'polite');
  box.style.cssText = 'display:none;position:fixed;z-index:7;left:8px;right:8px;top:64px;max-height:60vh;overflow:auto;margin:0;padding:10px 12px;' +
    'background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:12px;font:11px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;';
  box.style.display = 'none';
  document.body.appendChild(box);

  function text() {
    const lines = ['Detalle de OpenStreetMap: ' + (VT.osm3dStatus || 'no cargado'), ''];
    const ks = VT.osm3d ? VT.osm3d.sitesList() : VT.SITES;
    ks.forEach(k => {
      const L = VT.ALL[k], d3 = VT.diag3d && VT.diag3d[k], d = VT.diag[k];
      let s = (d3 ? (d3.rich ? '✓ ' : '· ') : '? ') + L.name + ': ';
      if (d3) s += d3.rich ? 'detalle real (' + d3.elems + ' elem., ' + d3.parts + ' partes, ' + d3.shapes + ' tejados, ' + d3.colours + ' colores)' : 'sin detalle en OSM (' + d3.elems + ' elem.), se usa el método básico';
      else s += 'sin datos todavía';
      if (d3 && d3.insp) s += '\n    usado: ' + (d3.insp.used.join('/') || '—') + ' m · dibujado: ' + d3.feats + ' piezas, máx ' + Math.round(d3.maxH || 0) + ' m · sin usar cerca: ' + d3.insp.other + (d3.insp.tallOther.length ? ' (altos: ' + d3.insp.tallOther.join('/') + ')' : '');
      if (d && !d3) s += ' · mapa base: ' + (d.out > 0 ? 'OK ' + d.out + ' piezas' : 'sin silueta, leídos ' + d.feats);
      lines.push(s);
    });
    return lines.join('\n');
  }
  let timer = 0;
  function show() { box.textContent = text(); }
  btn.addEventListener('click', () => {
    const open = box.style.display === 'none';
    box.style.display = open ? 'block' : 'none';
    btn.textContent = open ? 'Cerrar diagnóstico' : 'Diagnóstico de hitos';
    clearInterval(timer);
    if (open) { show(); timer = setInterval(show, 1500); }
  });
})();
