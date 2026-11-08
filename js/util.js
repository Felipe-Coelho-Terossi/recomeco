/* Utilidades puras (datas, números, texto). */
export function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export const pad = (n) => (n < 10 ? '0' : '') + n;
export const fmtD = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseD = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
export function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); }
export const todayStr = () => fmtD(new Date());
export const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
export function num(v) { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
export const r0 = Math.round;
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export function br(n, d) { const k = Math.pow(10, d || 0); return (Math.round(n * k) / k).toString().replace('.', ','); }
export const thousands = (n) => Math.round(n).toLocaleString('pt-BR');
export const dm = (s) => { const p = s.split('-'); return p[2] + '/' + p[1]; };
export const dmy = (s) => { const p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const diaMes = (s) => { const p = s.split('-'); return +p[2] + ' de ' + MESES[+p[1] - 1]; };
export const minutes = (hhmm) => { const p = hhmm.split(':'); return +p[0] * 60 + +p[1]; };
export function mondayOf(ds) { const wd = parseD(ds).getDay(); return addDays(ds, wd === 0 ? -6 : 1 - wd); }
