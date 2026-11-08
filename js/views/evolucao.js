/* Evolução: pesagens, gráfico e termostato de calorias. */
import { esc, br, dm, dmy, num, todayStr } from '../util.js';
import { store, save } from '../store.js';
import { toast, setErr, val } from '../ui.js';

const C = window.Core;
export const id = 'evol';
export const label = 'Evolução';
export const title = 'Evolução';

function chart() {
  const ws = store.S.weights.slice().sort((a, b) => (a.d < b.d ? -1 : 1));
  if (ws.length < 2) return '<div class="empty"><b>Ainda sem gráfico</b><p class="muted">Registre pelo menos 2 pesagens para ver a linha do peso.</p></div>';
  const W = 320, H = 170, L = 34, R = 10, T = 12, B = 22;
  const t0 = Date.parse(ws[0].d + 'T12:00:00Z'), t1 = Date.parse(ws[ws.length - 1].d + 'T12:00:00Z');
  let lo = Math.floor(Math.min.apply(null, ws.map((w) => w.peso)) - 1), hi = Math.ceil(Math.max.apply(null, ws.map((w) => w.peso)) + 1);
  const X = (d) => L + (t1 === t0 ? 0.5 : (Date.parse(d + 'T12:00:00Z') - t0) / (t1 - t0)) * (W - L - R);
  const Y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const refs = ws.filter((w) => w.ref !== false);
  let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfico do peso de ' + dmy(ws[0].d) + ' a ' + dmy(ws[ws.length - 1].d) + '">';
  [lo, (lo + hi) / 2, hi].forEach((v) => { svg += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="2" y="' + (Y(v) + 3).toFixed(1) + '">' + br(v, 1) + '</text>'; });
  if (refs.length > 1) svg += '<polyline class="ln" points="' + refs.map((w) => X(w.d).toFixed(1) + ',' + Y(w.peso).toFixed(1)).join(' ') + '"/>';
  ws.forEach((w) => { svg += '<circle class="' + (w.ref === false ? 'noref' : '') + '" cx="' + X(w.d).toFixed(1) + '" cy="' + Y(w.peso).toFixed(1) + '" r="3.5"/>'; });
  svg += '<text x="' + L + '" y="' + (H - 6) + '">' + dm(ws[0].d) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + dm(ws[ws.length - 1].d) + '</text></svg>';
  return svg + '<p class="muted">Ponto cheio: pesagem em jejum, que conta na tendência. Ponto vazio: outro horário, ignorado.</p>';
}

export function render() {
  const S = store.S, ws = S.weights.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  const sg = C.suggest(S.settings, S.weights, todayStr());
  let h = '<h1 class="page-title">Evolução</h1>';
  const last = ws[0], first = ws[ws.length - 1];
  h += '<section class="stats">' +
    '<div><span class="n">' + (last ? br(last.peso, 1) : '—') + '</span><span class="lbl">Último peso (kg)</span></div>' +
    '<div><span class="n">' + (sg.slope != null ? (sg.slope > 0 ? '+' : '') + br(sg.slope, 2) : '—') + '</span><span class="lbl">Tendência (kg/semana)</span></div>' +
    '<div><span class="n">' + (ws.length > 1 ? (last.peso - first.peso > 0 ? '+' : '') + br(last.peso - first.peso, 1) : '—') + '</span><span class="lbl">Desde o início (kg)</span></div></section>';

  h += '<section class="card"><h2>Termostato de calorias</h2>';
  if (sg.slope == null) h += '<p>' + esc(sg.reason) + '</p>';
  else {
    h += '<p>Objetivo: ' + esc(C.GOALS[S.settings.goal].nome) + '.</p><p>' + esc(sg.reason) + '</p>';
    if (sg.delta !== 0) h += '<p>Sugestão: <b>' + (sg.delta > 0 ? '+' : '') + sg.delta + ' kcal</b>, de ' + S.settings.target + ' para ' + sg.newTarget + '.</p><button class="btn primary" data-act="apply">Aplicar sugestão</button>';
    else h += '<p class="ok"><b>Manter ' + S.settings.target + ' kcal.</b></p>';
  }
  h += '<p class="muted">O app só sugere; quem decide é você. Use a pesagem de domingo, em jejum, como referência.</p></section>';

  h += '<section class="card"><h2>Gráfico</h2>' + chart() + '</section>';

  h += '<section class="card"><h2>Nova pesagem</h2>' +
    '<label class="f" for="w-d">Data</label><input id="w-d" type="date" value="' + todayStr() + '" max="' + todayStr() + '">' +
    '<label class="f" for="w-p">Peso (kg)</label><input id="w-p" type="text" inputmode="decimal" placeholder="ex.: 111,4">' +
    '<label class="f" for="w-g">Gordura corporal % (opcional)</label><input id="w-g" type="text" inputmode="decimal">' +
    '<label class="f" for="w-m">Massa muscular % ou kg (opcional)</label><input id="w-m" type="text" inputmode="decimal">' +
    '<label class="f" for="w-e">Energia na semana, de 1 a 5 (opcional)</label><select id="w-e"><option value="">—</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
    '<label class="check"><input id="w-r" type="checkbox" checked><span>Em jejum, de manhã (conta na tendência)</span></label>' +
    '<p id="w-err" class="err" role="alert"></p><button class="btn primary" data-act="addw">Salvar pesagem</button></section>';

  if (ws.length) {
    h += '<section class="card"><h2>Histórico</h2><table><tr><th>Data</th><th>Peso</th><th>Gord.</th><th>Músc.</th><th><span class="sr">Ações</span></th></tr>';
    ws.slice(0, 12).forEach((w) => {
      h += '<tr><td>' + dm(w.d) + (w.ref === false ? ' <span class="muted" title="Fora do jejum">○</span>' : '') + '</td><td>' + br(w.peso, 1) + '</td><td>' + (w.gordura != null ? br(w.gordura, 1) : '—') + '</td><td>' + (w.musculo != null ? br(w.musculo, 1) : '—') + '</td><td><button class="btn small" data-act="delw" data-d="' + w.d + '" aria-label="Apagar pesagem de ' + dmy(w.d) + '">Apagar</button></td></tr>';
    });
    h += '</table></section>';
  }
  return h;
}

export const actions = {
  addw(el, ctx) {
    const d = val('w-d'), p = num(val('w-p')), g = num(val('w-g')), m = num(val('w-m')), e = val('w-e');
    const ref = document.getElementById('w-r').checked;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { setErr('w-err', 'Escolha uma data.'); return; }
    if (d > todayStr()) { setErr('w-err', 'A data não pode ser no futuro.'); return; }
    if (p == null || p < 40 || p > 250) { setErr('w-err', 'Digite o peso entre 40 e 250 kg (use vírgula ou ponto).'); return; }
    if (g != null && (g < 1 || g > 70)) { setErr('w-err', 'Gordura corporal entre 1 e 70%.'); return; }
    if (m != null && (m < 1 || m > 200)) { setErr('w-err', 'Massa muscular inválida.'); return; }
    const w = { d, peso: p, ref };
    if (g != null) w.gordura = g;
    if (m != null) w.musculo = m;
    if (e) w.energia = +e;
    store.S.weights = store.S.weights.filter((x) => x.d !== d); store.S.weights.push(w);
    save(); ctx.render(); toast('Pesagem salva.');
  },
  delw(el, ctx) {
    const gone = store.S.weights.find((x) => x.d === el.dataset.d);
    store.S.weights = store.S.weights.filter((x) => x.d !== el.dataset.d); save(); ctx.render();
    toast('Pesagem apagada.', () => { if (gone) { store.S.weights.push(gone); save(); ctx.render(); } });
  },
  apply(el, ctx) {
    const sg = C.suggest(store.S.settings, store.S.weights, todayStr());
    if (sg.status === 'ajustar') { const old = store.S.settings.target; store.S.settings.target = sg.newTarget; save(); ctx.render(); toast('Meta ajustada para ' + sg.newTarget + ' kcal.', () => { store.S.settings.target = old; save(); ctx.render(); }); }
  }
};
