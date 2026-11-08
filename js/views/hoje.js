/* Hoje: placar do dia + linha do tempo de refeições. */
import { esc, r0, br, thousands, clamp, addDays, parseD, todayStr, diaMes, minutes } from '../util.js';
import { icon } from '../icons.js';
import { store, ui, status, dayRead, dayWrite, planFor, ctxFor, save, waterGoal } from '../store.js';
import { bar, openSheet, closeSheet, macroLine, toast, setErr, val } from '../ui.js';
import { num } from '../util.js';

const C = window.Core;
export const id = 'hoje';
export const label = 'Hoje';
export const title = 'Hoje';

function counter(label, now, goal, unit, cls, fmt) {
  const f = fmt || thousands;
  return '<div class="cell"><span class="n">' + f(now) + '</span><span class="of">de ' + f(goal) + ' ' + unit + '</span>' + bar(cls, now, goal) + '<span class="lbl">' + label + '</span></div>';
}

export function render() {
  const S = store.S, ds = ui.date, p = planFor(ds), d = dayRead(ds), ctx = ctxFor(ds);
  const isToday = ds === todayStr();
  const plan = C.dayPlan(p.key, p.out);
  const tot = C.dayTotals(p.key, p.out, ctx);
  const done = { k: 0, p: 0, c: 0, f: 0 };
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();

  const rows = plan.map((s) => {
    const M = C.MEALS[s.meal];
    const variant = d.pick[s.meal] && M.v[d.pick[s.meal]] ? d.pick[s.meal] : 'A';
    const mm = C.mealMacros(s.meal, variant, ctx);
    const isDone = !!d.done[s.time];
    if (isDone) { done.k += mm.k; done.p += mm.p; done.c += mm.c; done.f += mm.f; }
    return { s, M, variant, V: M.v[variant], mm, isDone, min: minutes(s.time) };
  });
  const nextIdx = rows.findIndex((r) => !r.isDone);

  let h = '';
  h += '<div class="datebar"><button class="icon-btn" data-act="day" data-n="-1" aria-label="Dia anterior">' + icon('prev') + '</button>' +
    '<div class="datebar-t"><h1>' + (isToday ? 'Hoje' : C.DAYNAMES[p.wd]) + '</h1><span>' + C.DAYNAMES[p.wd] + ', ' + diaMes(ds) + (/\(/.test(p.T.label) ? ' · ' + esc(p.T.label.replace(/^.*\((.*)\)$/, '$1')) : '') + '</span></div>' +
    '<button class="icon-btn" data-act="day" data-n="1" aria-label="Próximo dia">' + icon('next') + '</button></div>';
  if (!isToday) h += '<button class="btn small ghost" data-act="today">Voltar para hoje</button>';

  const toggles = [];
  if ([2, 3, 5].indexOf(p.wd) >= 0) toggles.push('<button class="chip" aria-pressed="' + p.camp + '" data-act="camp">' + icon('car', 18) + 'Dia em Campinas</button>');
  if (p.canOut) toggles.push('<button class="chip" aria-pressed="' + p.out + '" data-act="out">' + icon('out', 18) + 'Jantar fora</button>');
  if (toggles.length) h += '<div class="row chips">' + toggles.join('') + '</div>';
  if (status.memOnly) h += '<div class="warnbox">Este navegador não está salvando seus dados. Exporte um backup em Ajustes.</div>';

  // placar
  const wml = d.water, wgoal = waterGoal(p.wd);
  h += '<section class="board" aria-label="Placar do dia">' +
    counter('Calorias', done.k, tot.total.k, 'kcal', '') +
    counter('Proteína', done.p, S.settings.protein, 'g', 'protein') +
    counter('Água', wml / 1000, wgoal / 1000, 'L', 'water', (v) => br(v, 1)) +
    '<div class="board-foot"><span>Meta ' + thousands(S.settings.target) + ' kcal</span><span class="water-btns"><button class="chip dark" data-act="water" data-n="250">+250 ml</button><button class="chip dark" data-act="water" data-n="500">+500 ml</button><button class="chip dark" data-act="water" data-n="-250" aria-label="Tirar 250 ml">−</button></span></div></section>';

  // linha do tempo
  h += '<h2 class="sec">Refeições</h2><ol class="rail">';
  let markerDone = !isToday;
  const marker = '<li class="rail-now" aria-label="Agora"><span class="rail-dot now"></span><span class="rail-time">' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + '</span><span class="rail-line"></span></li>';
  rows.forEach((r, i) => {
    if (!markerDone && r.min > nowMin) { h += marker; markerDone = true; }
    const late = isToday && !r.isDone && nowMin > r.min + 60;
    const isNext = i === nextIdx;
    const k = ds + '|' + r.s.time;
    const open = ui.open[k] != null ? ui.open[k] : (isNext && isToday) || (isNext && !isToday && nextIdx === 0);
    const items = C.resolve(r.s.meal, r.variant, ctx);
    h += '<li class="meal' + (r.isDone ? ' done' : '') + (late ? ' late' : '') + (isNext ? ' next' : '') + '">' +
      '<span class="rail-dot' + (r.isDone ? ' ok' : '') + '">' + (r.isDone ? icon('check', 12) : '') + '</span>' +
      '<span class="rail-time">' + r.s.time + '</span>' +
      '<div class="meal-body"><button class="meal-head" data-act="toggle" data-k="' + esc(k) + '" aria-expanded="' + open + '">' +
      '<span class="meal-name">' + esc(r.M.name) + (r.M.optional ? ' <em>opcional</em>' : '') + '</span>' +
      '<span class="meal-sum">' + (late ? 'Atrasada · ' : '') + r0(r.mm.k) + ' kcal · ' + r0(r.mm.p) + ' g proteína</span>' + icon('chevron', 20) + '</button>';
    if (open) {
      h += '<p class="muted opt">' + esc(r.V.label) + '</p><ul class="items">';
      items.forEach((it) => {
        h += '<li><button class="item" data-act="item" data-key="' + esc(it.key) + '"><span>' + esc(C.FOODS[it.f].n.replace(/ \(.*\)$/, '')) + '</span><span class="q">' + esc(C.fmtQty(it.f, it.g)) + '</span></button></li>';
      });
      h += '</ul><div class="actions"><button class="btn ' + (r.isDone ? '' : 'primary') + '" data-act="done" data-time="' + r.s.time + '" aria-pressed="' + r.isDone + '">' + (r.isDone ? 'Desmarcar' : 'Marcar como feito') + '</button>';
      if (Object.keys(r.M.v).length > 1) h += '<button class="btn" data-act="swap" data-meal="' + r.s.meal + '">' + icon('swap', 18) + 'Trocar opção</button>';
      if (r.V.recipe) h += '<button class="btn" data-act="recipe" data-r="' + r.V.recipe + '">' + icon('book', 18) + 'Como fazer</button>';
      h += '</div>';
    }
    h += '</div></li>';
  });
  if (!markerDone) h += marker;
  h += '</ol>';

  h += '<section class="card"><h2>Rotina do dia</h2><p class="muted">Acorde ' + esc(p.T.wake) + ' · durma ' + esc(p.T.bed) + '</p><p>' + esc(p.T.note) + '</p>' +
    '<p class="muted">Carboidratos ' + r0(done.c) + ' g · gorduras ' + r0(done.f) + ' g já consumidos. Valores estimados por tabelas; marca e preparo variam.</p></section>';

  const pt = planFor(addDays(ds, 1)), tasks = C.prepFor(pt.key, pt.out);
  if (tasks.length) {
    h += '<section class="card"><h2>Para preparar hoje</h2><p class="muted">Amanhã: ' + esc(C.DAYNAMES[pt.wd]) + ', ' + esc(pt.T.label.replace(/ \(.*\)/, '')) + '</p><ul class="plain">';
    tasks.forEach((t) => { h += '<li>' + esc(t) + '</li>'; });
    h += '</ul></section>';
  }
  return h;
}

function itemSheet(key) {
  const pr = key.split('|'), M = C.MEALS[pr[0]]; if (!M || !M.v[pr[1]]) return;
  const it = M.v[pr[1]].items[+pr[2]]; if (!it) return;
  const F = C.FOODS[it[0]], ctx = ctxFor(ui.date);
  const g = C.resolve(pr[0], pr[1], ctx)[+pr[2]].g, edited = store.S.qty[key] != null;
  openSheet('<h2>' + esc(F.n) + '</h2><p>' + esc(F.d) + '</p>' +
    '<p class="muted">Por 100 g: ' + F.k + ' kcal · P ' + F.p + ' g · C ' + F.c + ' g · G ' + F.f + ' g</p>' +
    '<p>Agora: <b>' + esc(C.fmtQty(it[0], g)) + '</b></p><p>' + macroLine(C.foodMacros(it[0], g)) + '</p>' +
    '<p class="muted">Padrão do plano: ' + esc(C.fmtQty(it[0], it[1])) + (edited ? ' · você editou esta quantidade' : (F.carb && ctx.scale !== 1 ? ' · ajustado pela meta de calorias' : '')) + '</p>' +
    '<label class="f" for="q-g">Quantidade em gramas</label><input id="q-g" type="text" inputmode="decimal" value="' + g + '">' +
    '<p id="q-err" class="err" role="alert"></p><div class="actions"><button class="btn primary" data-act="saveqty" data-key="' + esc(key) + '">Salvar quantidade</button>' + (edited ? '<button class="btn" data-act="clearqty" data-key="' + esc(key) + '">Voltar ao padrão</button>' : '') + '</div>', F.n);
}
function recipeSheet(rid) {
  const R = C.RECIPES[rid]; if (!R) return;
  openSheet('<h2>' + esc(R.t) + '</h2><ol class="steps">' + R.s.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>', R.t);
}

export const actions = {
  day(el, ctx) { ui.date = addDays(ui.date, +el.dataset.n); ctx.render(); },
  today(el, ctx) { ui.date = todayStr(); ctx.render(); },
  camp(el, ctx) { const p = planFor(ui.date); dayWrite(ui.date).camp = !p.camp; save(); ctx.render(); },
  out(el, ctx) { const d = dayWrite(ui.date); d.out = !d.out; save(); ctx.render(); },
  toggle(el, ctx) { const k = el.dataset.k; ui.open[k] = el.getAttribute('aria-expanded') !== 'true'; ctx.render(); },
  done(el, ctx) {
    const d = dayWrite(ui.date), t = el.dataset.time, was = !!d.done[t];
    const ds = ui.date;
    if (was) delete d.done[t]; else d.done[t] = true;
    delete ui.open[ds + '|' + t];
    save(); ctx.render();
    if (!was) toast('Refeição das ' + t + ' marcada.', () => { delete dayWrite(ds).done[t]; save(); ctx.render(); });
  },
  swap(el, ctx) {
    const d = dayWrite(ui.date), m = el.dataset.meal, ks = Object.keys(C.MEALS[m].v), cur = d.pick[m] && C.MEALS[m].v[d.pick[m]] ? d.pick[m] : 'A';
    d.pick[m] = ks[(ks.indexOf(cur) + 1) % ks.length]; save(); ctx.render();
  },
  recipe(el) { recipeSheet(el.dataset.r); },
  item(el) { itemSheet(el.dataset.key); },
  saveqty(el, ctx) {
    const g = num(val('q-g'));
    if (g == null || g < 1 || g > 2000) { setErr('q-err', 'Digite uma quantidade entre 1 e 2000 g.'); return; }
    store.S.qty[el.dataset.key] = g; save(); closeSheet(); ctx.render();
  },
  clearqty(el, ctx) { delete store.S.qty[el.dataset.key]; save(); closeSheet(); ctx.render(); },
  water(el, ctx) { const d = dayWrite(ui.date); d.water = clamp((d.water || 0) + (+el.dataset.n), 0, 10000); save(); ctx.render(); }
};
