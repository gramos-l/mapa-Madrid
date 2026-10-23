/* Panel «Diagnóstico de hitos»: muestra qué ha leído el mapa de cada torre y edificio (para detectar por qué alguno no se colorea).
   Se abre desde Opciones. No afecta al resto de la aplicación. */
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
  box.style.cssText = 'display:none;position:fixed;z-index:7;left:8px;right:8px;top:64px;max-height:58vh;overflow:auto;margin:0;padding:10px 12px;' +
    'background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:12px;font:11px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;';
  box.style.display = 'none';
  document.body.appendChild(box);

  function text() {
    const lines = ['Hito · estado (leídos / candidatos / alturas en m)', ''];
    VT.SITES.forEach(k => {
      const L = VT.ALL[k], d = VT.diag[k];
      if (!d) lines.push('· ' + L.name + ': sin intentar (acércate: zoom 15 o más)');
      else if (d.out > 0) lines.push('✓ ' + L.name + ': OK, ' + d.out + ' piezas · alturas ' + d.hs.join('/'));
      else lines.push('✗ ' + L.name + ': SIN SILUETA · leídos ' + d.feats + ' (' + d.via + ') · candidatos ' + d.cand + ' · alturas ' + (d.hs.join('/') || '—'));
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
