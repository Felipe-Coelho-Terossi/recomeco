/* Semana: visão dos 7 dias e dias em Campinas. */
import { esc, r0, addDays, dm, todayStr, mondayOf } from '../util.js';
import { store, ui, planFor, ctxFor, save } from '../store.js';

const C = window.Core;
export const id = 'semana';
export const label = 'Semana';
export const title = 'Semana';

export function render() {
  const S = store.S, mon = mondayOf(ui.date);
  let h = '<h1 class="page-title">Semana</h1><p class="muted">Toque em um dia para abrir o plano.</p>';
  h += '<section class="card"><h2>Dias em Campinas</h2><p class="muted">Vale para todas as semanas. Para mudar só um dia, use o botão na tela Hoje.</p><div class="row chips">';
  [[2, 'Terça'], [3, 'Quarta'], [5, 'Sexta']].forEach((x) => { h += '<button class="chip" aria-pressed="' + !!S.week[x[0]] + '" data-act="weekcamp" data-wd="' + x[0] + '">' + x[1] + '</button>'; });
  h += '</div></section>';
  let sk = 0, sp = 0;
  const rows = [];
  for (let i = 0; i < 7; i++) {
    const ds = addDays(mon, i), p = planFor(ds), t = C.dayTotals(p.key, p.out, ctxFor(ds)).total;
    sk += t.k; sp += t.p;
    rows.push('<li><button class="daybtn' + (ds === todayStr() ? ' today' : '') + '" data-act="goto" data-d="' + ds + '"><span class="dd"><b>' + C.DAYNAMES[p.wd].slice(0, 3) + '</b><span>' + dm(ds) + '</span></span><span class="dinfo"><span>' + esc(p.T.label.replace(/ \(.*\)/, '') + (p.camp ? ' · Campinas' : '') + (p.out ? ' · jantar fora' : '')) + '</span><span class="muted">' + r0(t.k).toLocaleString('pt-BR') + ' kcal · ' + r0(t.p) + ' g proteína</span></span></button></li>');
  }
  h += '<ul class="plain days">' + rows.join('') + '</ul>';
  h += '<p class="muted">Média da semana: ' + r0(sk / 7).toLocaleString('pt-BR') + ' kcal e ' + r0(sp / 7) + ' g de proteína por dia (meta ' + S.settings.target.toLocaleString('pt-BR') + ' kcal).</p>';
  return h;
}

export const actions = {
  weekcamp(el, ctx) { const w = el.dataset.wd; store.S.week[w] = !store.S.week[w]; save(); ctx.render(); },
  goto(el, ctx) { ui.date = el.dataset.d; ctx.go('hoje'); }
};
