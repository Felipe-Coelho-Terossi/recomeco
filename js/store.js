/* Estado do app (localStorage) e funções que combinam estado + plano. */
import { obj, clamp, todayStr, parseD } from './util.js';

const C = window.Core;
export const KEY = 'rotina_felipe_v1';
export const WORKOUT_TYPES = ['Basquete', 'Musculação', 'Corrida', 'Outro'];

export const status = { memOnly: false, warned: false };
export const ui = { date: todayStr(), open: {} };
const listeners = [];
export const onWarn = (fn) => listeners.push(fn);

function validW(w) { return w && typeof w === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(w.d) && isFinite(w.peso) && w.peso >= 40 && w.peso <= 250; }
function validT(t) { return t && typeof t === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(t.d) && WORKOUT_TYPES.indexOf(t.tipo) >= 0 && isFinite(t.min) && t.min >= 1 && t.min <= 600; }

export function norm(s) {
  s = obj(s);
  const st = Object.assign({ goal: 'perder', target: C.defaultTarget(), protein: 200, water: 3000, floor: 2400, ceiling: 3400, step: 100 }, obj(s.settings));
  if (!C.GOALS[st.goal]) st.goal = 'perder';
  st.target = clamp(+st.target || C.defaultTarget(), 1800, 5000);
  st.protein = clamp(+st.protein || 200, 80, 400);
  st.water = clamp(+st.water || 3000, 1500, 6000);
  st.floor = clamp(+st.floor || 2400, 1500, 5000);
  st.ceiling = clamp(+st.ceiling || 3400, 1500, 6000);
  st.step = clamp(+st.step || 100, 50, 300);
  const weights = (Array.isArray(s.weights) ? s.weights : []).filter(validW).map((w) => {
    const o = { d: w.d, peso: +w.peso, ref: w.ref !== false };
    if (w.gordura != null && isFinite(w.gordura)) o.gordura = +w.gordura;
    if (w.musculo != null && isFinite(w.musculo)) o.musculo = +w.musculo;
    if (w.energia != null && isFinite(w.energia)) o.energia = clamp(+w.energia, 1, 5);
    return o;
  });
  const workouts = (Array.isArray(s.workouts) ? s.workouts : []).filter(validT).map((t, i) => ({
    id: String(t.id || t.d + '-' + i), d: t.d, tipo: t.tipo, min: Math.round(+t.min),
    esf: t.esf != null && isFinite(t.esf) ? clamp(+t.esf, 1, 5) : null, obs: String(t.obs || '').slice(0, 140)
  }));
  return { v: 1, settings: st, days: obj(s.days), qty: obj(s.qty), week: Object.assign({ 2: false, 3: false, 5: false }, obj(s.week)), have: obj(s.have), weights, workouts };
}

function load() {
  try { const r = localStorage.getItem(KEY); if (r) return norm(JSON.parse(r)); } catch (e) { status.memOnly = true; }
  return norm({});
}

export const store = { S: load() };
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(store.S)); }
  catch (e) { status.memOnly = true; if (!status.warned) { status.warned = true; listeners.forEach((f) => f('Não consegui salvar neste navegador. Exporte um backup em Ajustes.')); } }
}
export function replace(next) { store.S = next; save(); }

// leitura sem criar entradas; escrita cria só quando o usuário age
export function dayRead(ds) { const d = store.S.days[ds] || {}; return { done: obj(d.done), pick: obj(d.pick), camp: d.camp, out: !!d.out, water: d.water || 0 }; }
export function dayWrite(ds) { if (!store.S.days[ds]) store.S.days[ds] = {}; const d = store.S.days[ds]; d.done = obj(d.done); d.pick = obj(d.pick); return d; }

export function campFor(ds, wd) { const d = store.S.days[ds]; if (d && d.camp != null) return !!d.camp; return !!store.S.week[wd]; }
export function ctxFor(ds) { const d = store.S.days[ds] || {}; return { scale: C.carbScaleFor(store.S.settings.target), qty: store.S.qty, pick: obj(d.pick) }; }
export function planFor(ds) {
  const wd = parseD(ds).getDay(), camp = campFor(ds, wd), d = store.S.days[ds] || {};
  const key = C.dayTypeKey(wd, camp);
  const canOut = JSON.stringify(C.dayPlan(key, true)) !== JSON.stringify(C.dayPlan(key, false));
  return { wd, camp, out: canOut && !!d.out, key, canOut, T: C.DAYTYPES[key] };
}
export function waterGoal(wd) { return store.S.settings.water + (wd === 3 ? 500 : 0); }
