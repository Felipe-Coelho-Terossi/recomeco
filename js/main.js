/* Ponto de entrada: roteamento por hash, menu, delegação de eventos. */
import * as hoje from './views/hoje.js';
import * as semana from './views/semana.js';
import * as compras from './views/compras.js';
import * as evol from './views/evolucao.js';
import * as treino from './views/treino.js';
import * as ajustes from './views/ajustes.js';
import { icon } from './icons.js';
import { todayStr } from './util.js';
import { ui, onWarn, store } from './store.js';
import { toast, runUndo, closeSheet, sheetOpen } from './ui.js';

const VIEWS = [hoje, semana, compras, evol, treino, ajustes];
const BY_ID = {}; VIEWS.forEach((v) => { BY_ID[v.id] = v; });
const NAV = [hoje, semana, compras, evol, treino];
const ACTIONS = { close: () => closeSheet(), undo: () => runUndo() };
VIEWS.forEach((v) => Object.assign(ACTIONS, v.actions || {}));

function current() { const m = location.hash.match(/^#\/([a-z]+)/); return BY_ID[m && m[1]] || hoje; }
export function go(id) { if (location.hash !== '#/' + id) location.hash = '#/' + id; else render(); }
const ctx = { render, go };

function render(focus) {
  const v = current();
  document.getElementById('app').innerHTML = v.render();
  document.getElementById('nav').innerHTML = NAV.map((n) =>
    '<a class="tab" href="#/' + n.id + '" data-t="' + n.id + '"' + (n === v ? ' aria-current="page"' : '') + '>' + icon(n.id, 24) + '<span>' + n.label + '</span></a>').join('');
  const bar = document.getElementById('bar-links');
  bar.innerHTML = '<a class="icon-btn" href="#/ajustes" aria-label="Ajustes"' + (v === ajustes ? ' aria-current="page"' : '') + '>' + icon('ajustes') + '</a>';
  document.title = v.title + ' · Recomeço';
  if (focus) { const h = document.querySelector('#app h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } window.scrollTo(0, 0); }
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const f = ACTIONS[el.dataset.act]; if (f) f(el, ctx);
});
document.addEventListener('change', (ev) => {
  const el = ev.target; if (!el || !el.dataset) return;
  if (el.dataset.act === 'have') return ACTIONS.have(el, ctx);
  if (el.dataset.act === 'import') ajustes.onChange(el, ctx);
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && sheetOpen()) closeSheet(); });
window.addEventListener('hashchange', () => { closeSheet(); render(true); });
onWarn((m) => toast(m));

let lastToday = todayStr();
setInterval(() => {
  const t = todayStr();
  if (t !== lastToday) { if (ui.date === lastToday) ui.date = t; lastToday = t; render(); }
}, 60000);

render();
if ('serviceWorker' in navigator) window.addEventListener('load', () => { try { navigator.serviceWorker.register('sw.js'); } catch (e) { /* sem offline */ } });
window.__rotina = { state: () => store.S };
