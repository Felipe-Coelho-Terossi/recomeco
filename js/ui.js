/* Componentes compartilhados: toast com desfazer, painel inferior (sheet), barras. */
import { esc, clamp, r0 } from './util.js';
import { icon } from './icons.js';

let toastTimer;
export function toast(msg, undo) {
  const el = document.getElementById('toast');
  el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button class="toast-btn" data-act="undo">Desfazer</button>' : '');
  el.hidden = false;
  toast.undo = undo || null;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; toast.undo = null; }, undo ? 6000 : 3500);
}
export function runUndo() { const f = toast.undo; toast.undo = null; document.getElementById('toast').hidden = true; if (f) f(); }

const sheetState = { opener: null };
export function openSheet(html, title) {
  const el = document.getElementById('sheet');
  sheetState.opener = document.activeElement;
  el.hidden = false;
  el.innerHTML = '<div class="backdrop" data-act="close"></div><div class="panel" role="dialog" aria-modal="true" aria-label="' + esc(title || 'Detalhes') + '"><div class="panel-h"><span class="grab" aria-hidden="true"></span><button class="x" data-act="close" aria-label="Fechar">' + icon('plus', 22).replace('<svg ', '<svg style="transform:rotate(45deg)" ') + '</button></div>' + html + '</div>';
  const b = el.querySelector('.x'); if (b) b.focus();
}
export function closeSheet() {
  const el = document.getElementById('sheet');
  if (el.hidden) return false;
  el.hidden = true; el.innerHTML = '';
  if (sheetState.opener && document.contains(sheetState.opener)) { try { sheetState.opener.focus(); } catch (e) { /* ignora */ } }
  return true;
}
export const sheetOpen = () => !document.getElementById('sheet').hidden;

export function bar(cls, val, max) {
  return '<div class="bar ' + cls + '" role="img" aria-label="' + r0(val) + ' de ' + r0(max) + '"><i style="width:' + clamp(max > 0 ? val / max * 100 : 0, 0, 100) + '%"></i></div>';
}
export function macroLine(m) { return '<b>' + r0(m.k) + ' kcal</b> · P ' + r0(m.p) + ' g · C ' + r0(m.c) + ' g · G ' + r0(m.f) + ' g'; }
export function setErr(id, msg) { const e = document.getElementById(id); if (e) e.textContent = msg; }
export function val(id) { const e = document.getElementById(id); return e ? e.value : ''; }
export function confirmSheet(title, text, act, label) {
  openSheet('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="actions"><button class="btn danger" data-act="' + act + '">' + esc(label) + '</button><button class="btn" data-act="close">Cancelar</button></div>', title);
}
export function emptyState(title, text) { return '<div class="empty"><b>' + esc(title) + '</b><p class="muted">' + esc(text) + '</p></div>'; }
