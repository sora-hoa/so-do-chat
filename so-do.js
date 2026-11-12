// Chat diagram widget: every <script type="text/plain" class="sd-src" data-tab="…"> holding mermaid
// source becomes a tab, rendered in a soft light / dark palette with zoom, drag and a taller "Phóng to"
// layout. Built for Claude chat widgets, which give a 680px frame with no fullscreen.
import mermaid from 'https://esm.sh/mermaid@11.17.2/dist/mermaid.esm.min.mjs';

const SD_CSS = `.sd{--sd-bg:#F7F6F2;--sd-fg:#3A3936;font-size:13px}
.sd.dark{--sd-bg:#2B2F36;--sd-fg:#D6DBE3}
.sd-row{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px}
.sd-row button{font-size:13px;padding:4px 10px}
.sd-row button[aria-selected="true"]{border-color:var(--border-stronger);background:var(--surface-1)}
.sd-view{position:relative;overflow:hidden;height:420px;border:0.5px solid var(--border);border-radius:12px;background:var(--sd-bg);color:var(--sd-fg);cursor:grab;touch-action:none}
.sd-stage{position:absolute;left:0;top:0;transform-origin:0 0}
.sd.sd-max{background:rgba(0,0,0,0.45);padding:12px;border-radius:12px}
.sd.sd-max .sd-row button{background:var(--surface-2)}
.sd.sd-max .sd-view{height:760px !important}
.sd-err{padding:12px;white-space:pre-wrap;font-family:var(--font-mono);color:var(--text-danger)}
`;
const SD_CONTROLS = `<div class="sd-row sd-tabs" role="tablist"></div>
<div class="sd-row"><button data-z="out" aria-label="Thu nhỏ">−</button><button data-z="in" aria-label="Phóng to">+</button><button data-z="w">Vừa ngang</button><button data-z="all">Toàn bộ</button><button data-z="1">100%</button><button data-z="max"><i class="ti ti-arrows-maximize" aria-hidden="true"></i> <span>Phóng to</span></button></div>
<div class="sd-view"><div class="sd-stage"></div></div>`;

const firstSrc = document.querySelector('.sd-src');
if (!firstSrc) throw new Error('so-do.js: no <script type="text/plain" class="sd-src"> on the page');
const sdStyle = document.createElement('style');
sdStyle.textContent = SD_CSS;
document.head.append(sdStyle);
const root = document.createElement('div');
root.className = 'sd';
root.innerHTML = SD_CONTROLS;
firstSrc.before(root);
const sdPal = (dark) => dark
  ? {bg:'#2B2F36',node:'#3A404A',text:'#D6DBE3',line:'#8C96A6',note:'#4A4234',noteText:'#E4D9C2',cl:'#334052',clText:'#C9D6E8'}
  : {bg:'#F7F6F2',node:'#FFFFFF',text:'#3A3936',line:'#7A7873',note:'#FFF6DD',noteText:'#4A3F25',cl:'#EEF2F8',clText:'#2F3B4C'};
// mermaid strokes the sequence-diagram stick figure with a fixed inline purple; repaint it in the line colour
const sdFix = (svg, dark) => svg.replace(/rgb\(147, ?112, ?219\)|#9370db/gi, sdPal(dark).line);
const sdCfg = (dark) => {
  const P = sdPal(dark);
  return {
    startOnLoad:false, theme:'base', securityLevel:'strict', fontFamily:'"anthropic-sans", sans-serif',
    themeVariables:{darkMode:dark, fontSize:'14px', fontFamily:'"anthropic-sans", sans-serif', background:P.bg,
      primaryColor:P.node, primaryTextColor:P.text, primaryBorderColor:P.line, lineColor:P.line, textColor:P.text,
      secondaryColor:P.cl, tertiaryColor:P.cl, clusterBkg:P.cl, clusterBorder:P.line, titleColor:P.clText,
      edgeLabelBackground:P.bg, noteBkgColor:P.note, noteTextColor:P.noteText, noteBorderColor:P.line,
      actorBkg:P.node, actorBorder:P.line, actorTextColor:P.text, signalColor:P.line, signalTextColor:P.text,
      labelBoxBkgColor:P.cl, labelBoxBorderColor:P.line, labelTextColor:P.clText, loopTextColor:P.clText,
      sectionBkgColor:P.cl, altSectionBkgColor:P.bg, taskBkgColor:P.node, taskBorderColor:P.line, taskTextColor:P.text,
      taskTextOutsideColor:P.text, gridColor:P.line, todayLineColor:'#D85A30'},
    htmlLabels:false,
    flowchart:{htmlLabels:false, useMaxWidth:false, wrappingWidth:260},
    sequence:{useMaxWidth:false, mirrorActors:true},
    gantt:{useMaxWidth:false}, state:{useMaxWidth:false}, er:{useMaxWidth:false}, pie:{useMaxWidth:false}
  };
};
const mode = document.documentElement.dataset.mode;
const dark = mode ? mode === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
root.classList.toggle('dark', dark);
mermaid.initialize(sdCfg(dark));
await document.fonts.ready;
const tabs = [...document.querySelectorAll('.sd-src')].map((s, i) => ({name: s.dataset.tab || ('Sơ đồ ' + (i + 1)), code: s.textContent.trim()}));
for (let i = 0; i < tabs.length; i++) {
  const t = tabs[i];
  try {
    await mermaid.parse(t.code);
    t.svg = sdFix((await mermaid.render('sd-svg-' + i, t.code)).svg, dark);
  } catch (e) {
    t.err = 'Lỗi sơ đồ "' + t.name + '": ' + (e && e.message ? e.message : String(e));
    ['dsd-svg-' + i, 'sd-svg-' + i].forEach(id => { const n = document.getElementById(id); if (n) n.remove(); });
  }
}
const view = root.querySelector('.sd-view'), stage = root.querySelector('.sd-stage');
const tabsEl = root.querySelector('.sd-tabs'), maxBtn = root.querySelector('[data-z="max"]');
tabs.forEach(t => Object.assign(t, {w:1, h:1, s:1, x:0, y:0, ready:false}));
let cur = 0;
const big = () => root.classList.contains('sd-max');
const apply = () => { const t = tabs[cur]; stage.style.transform = `translate(${t.x}px,${t.y}px) scale(${t.s})`; };
const fit = (both) => {
  const t = tabs[cur], W = view.clientWidth - 16, H = view.clientHeight - 16;
  t.s = Math.max(0.1, Math.min(both ? Math.min(W / t.w, H / t.h) : W / t.w, 2));
  t.x = Math.max(8, (view.clientWidth - t.w * t.s) / 2);
  t.y = both ? Math.max(8, (view.clientHeight - t.h * t.s) / 2) : 8;
  apply();
};
// "Phóng to" aims at readable text: fit the height, never past 100%, and let a wide diagram be dragged sideways.
const fitRead = () => {
  const t = tabs[cur];
  t.s = Math.max(0.1, Math.min(1, (view.clientHeight - 16) / t.h));
  t.x = Math.max(8, (view.clientWidth - t.w * t.s) / 2); t.y = Math.max(8, (view.clientHeight - t.h * t.s) / 2);
  apply();
};
const show = (i) => {
  cur = i; const t = tabs[i];
  [...tabsEl.children].forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
  if (t.err) {
    view.style.height = '160px';
    stage.innerHTML = ''; const d = document.createElement('div'); d.className = 'sd-err'; d.textContent = t.err; stage.appendChild(d);
    t.w = view.clientWidth; t.h = 120; t.s = 1; t.x = 0; t.y = 0; apply(); return;
  }
  stage.innerHTML = t.svg;
  const svg = stage.querySelector('svg');
  const vb = svg.viewBox && svg.viewBox.baseVal;
  t.w = (vb && vb.width) || svg.getBBox().width || 600; t.h = (vb && vb.height) || svg.getBBox().height || 300;
  svg.setAttribute('width', t.w); svg.setAttribute('height', t.h); svg.style.maxWidth = 'none';
  if (!t.ready) { const s0 = Math.min(1, (view.clientWidth - 16) / t.w); t.autoH = Math.round(Math.min(Math.max(t.h * s0 + 16, 160), 560)); }
  view.style.height = t.autoH + 'px';
  if (!t.ready) {
    t.ready = true;
    if (big()) fitRead();
    else { fit(false); if (t.s > 1) { t.s = 1; t.x = Math.max(8, (view.clientWidth - t.w) / 2); apply(); } }
  } else apply();
};
const relayout = () => { tabs.forEach(t => { t.ready = false; }); show(cur); };
if (tabs.length > 1) tabs.forEach((t, i) => { const b = document.createElement('button'); b.textContent = t.name; b.setAttribute('role', 'tab'); b.onclick = () => show(i); tabsEl.appendChild(b); });
else tabsEl.remove();
// The chat frame has no fullscreen: "Phóng to" is a synchronous class flip to a taller, modal-looking layout.
const setBig = (on) => {
  root.classList.toggle('sd-max', on);
  maxBtn.querySelector('span').textContent = on ? 'Thu lại' : 'Phóng to';
  maxBtn.querySelector('i').className = on ? 'ti ti-arrows-minimize' : 'ti ti-arrows-maximize';
  relayout();
};
document.addEventListener('keydown', e => { if (e.key === 'Escape' && big()) setBig(false); });
const zoomAt = (f, cx, cy) => { const t = tabs[cur], ns = Math.max(0.1, Math.min(t.s * f, 6)); t.x = cx - (cx - t.x) * ns / t.s; t.y = cy - (cy - t.y) * ns / t.s; t.s = ns; apply(); };
root.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {
  const z = b.dataset.z, cx = view.clientWidth / 2, cy = view.clientHeight / 2, t = tabs[cur];
  if (z === 'in') zoomAt(1.25, cx, cy); else if (z === 'out') zoomAt(0.8, cx, cy);
  else if (z === 'w') fit(false); else if (z === 'all') fit(true);
  else if (z === '1') { t.s = 1; t.x = 8; t.y = 8; apply(); }
  else if (z === 'max') setBig(!big());
});
let drag = null;
view.addEventListener('pointerdown', e => { drag = {px:e.clientX, py:e.clientY, x:tabs[cur].x, y:tabs[cur].y}; view.setPointerCapture(e.pointerId); view.style.cursor = 'grabbing'; });
view.addEventListener('pointermove', e => { if (!drag) return; const t = tabs[cur]; t.x = drag.x + e.clientX - drag.px; t.y = drag.y + e.clientY - drag.py; apply(); });
const end = () => { drag = null; view.style.cursor = 'grab'; };
view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
view.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const r = view.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); }, {passive:false});
view.addEventListener('dblclick', e => { const r = view.getBoundingClientRect(); zoomAt(1.5, e.clientX - r.left, e.clientY - r.top); });
show(0);
