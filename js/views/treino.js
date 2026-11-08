/* Treino: semana de treinos e registro simples (basquete, musculação, corrida). */
import { esc, addDays, dm, dmy, num, todayStr, mondayOf, parseD, clamp } from '../util.js';
import { store, ui, save, WORKOUT_TYPES } from '../store.js';
import { toast, setErr, val, emptyState } from '../ui.js';

const C = window.Core;
export const id = 'treino';
export const label = 'Treino';
export const title = 'Treino';

// Planejado fixo hoje: só o basquete de quarta. Academia e corrida entram quando você escolher a academia.
const PLANNED = { 3: 'Basquete 3x3 · 20h às 22h30' };

export function render() {
  const S = store.S, mon = mondayOf(todayStr()), end = addDays(mon, 6);
  const week = S.workouts.filter((t) => t.d >= mon && t.d <= end);
  const mins = week.reduce((a, t) => a + t.min, 0);
  let h = '<h1 class="page-title">Treino</h1>';
  h += '<section class="stats"><div><span class="n">' + week.length + '</span><span class="lbl">Treinos na semana</span></div>' +
    '<div><span class="n">' + mins + '</span><span class="lbl">Minutos na semana</span></div>' +
    '<div><span class="n">' + S.workouts.length + '</span><span class="lbl">Treinos registrados</span></div></section>';

  h += '<section class="card"><h2>Semana</h2><ul class="plain days">';
  for (let i = 0; i < 7; i++) {
    const ds = addDays(mon, i), wd = parseD(ds).getDay();
    const logged = S.workouts.filter((t) => t.d === ds);
    const plan = PLANNED[wd];
    h += '<li class="dayrow' + (ds === todayStr() ? ' today' : '') + '"><span class="dd"><b>' + C.DAYNAMES[wd].slice(0, 3) + '</b><span>' + dm(ds) + '</span></span><span class="dinfo">' +
      '<span>' + (plan ? esc(plan) : '<span class="muted">Livre</span>') + '</span>' +
      (logged.length ? '<span class="ok">' + logged.map((t) => esc(t.tipo) + ' ' + t.min + ' min').join(' · ') + '</span>' : '') + '</span></li>';
  }
  h += '</ul><p class="muted">Academia e corrida entram no plano assim que você escolher a academia pelo Wellhub.</p></section>';

  h += '<section class="card"><h2>Registrar treino</h2>' +
    '<label class="f" for="t-d">Data</label><input id="t-d" type="date" value="' + todayStr() + '" max="' + todayStr() + '">' +
    '<label class="f" for="t-t">Tipo</label><select id="t-t">' + WORKOUT_TYPES.map((t) => '<option>' + t + '</option>').join('') + '</select>' +
    '<label class="f" for="t-m">Duração (minutos)</label><input id="t-m" type="text" inputmode="numeric" placeholder="ex.: 150">' +
    '<label class="f" for="t-e">Esforço de 1 a 5 (opcional)</label><select id="t-e"><option value="">—</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
    '<label class="f" for="t-o">Observação (opcional)</label><input id="t-o" type="text" maxlength="140" placeholder="ex.: joelho ok, 3 jogos">' +
    '<p id="t-err" class="err" role="alert"></p><button class="btn primary" data-act="addt">Salvar treino</button></section>';

  const list = S.workouts.slice().sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 10);
  h += '<section class="card"><h2>Últimos treinos</h2>';
  if (!list.length) h += emptyState('Nenhum treino ainda', 'Registre o primeiro acima. Ele aparece aqui e na semana.');
  else {
    h += '<ul class="plain">';
    list.forEach((t) => {
      h += '<li class="logrow"><span><b>' + esc(t.tipo) + '</b> · ' + t.min + ' min' + (t.esf ? ' · esforço ' + t.esf : '') + '<br><span class="muted">' + dmy(t.d) + (t.obs ? ' · ' + esc(t.obs) : '') + '</span></span><button class="btn small" data-act="delt" data-id="' + esc(t.id) + '" aria-label="Apagar treino de ' + dmy(t.d) + '">Apagar</button></li>';
    });
    h += '</ul>';
  }
  return h + '</section>';
}

export const actions = {
  addt(el, ctx) {
    const d = val('t-d'), tipo = val('t-t'), m = num(val('t-m')), e = val('t-e'), o = val('t-o').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { setErr('t-err', 'Escolha uma data.'); return; }
    if (d > todayStr()) { setErr('t-err', 'A data não pode ser no futuro.'); return; }
    if (m == null || m < 1 || m > 600) { setErr('t-err', 'Digite a duração entre 1 e 600 minutos.'); return; }
    store.S.workouts.push({ id: d + '-' + Date.now().toString(36), d, tipo, min: Math.round(m), esf: e ? +e : null, obs: o.slice(0, 140) });
    save(); ctx.render(); toast('Treino salvo.');
  },
  delt(el, ctx) {
    const gone = store.S.workouts.find((t) => t.id === el.dataset.id);
    store.S.workouts = store.S.workouts.filter((t) => t.id !== el.dataset.id); save(); ctx.render();
    toast('Treino apagado.', () => { if (gone) { store.S.workouts.push(gone); save(); ctx.render(); } });
  }
};
