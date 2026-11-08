/* Rotina do Felipe - interface. Estado em localStorage; núcleo de cálculo em core.js. */
(function () {
  'use strict';
  var C = window.Core;
  var KEY = 'rotina_felipe_v1';
  var memOnly = false;
  var warned = false;

  // ---------- utilidades ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtD(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseD(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(s, n) { var d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); }
  function todayStr() { return fmtD(new Date()); }
  function obj(o) { return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }
  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
  function r0(n) { return Math.round(n); }
  function br(n, d) { return (Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString().replace('.', ','); }
  function dm(s) { var p = s.split('-'); return p[2] + '/' + p[1]; }
  function dmy(s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  // ---------- estado ----------
  function validW(w) {
    return w && typeof w === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(w.d) && isFinite(w.peso) && w.peso >= 40 && w.peso <= 250;
  }
  function norm(s) {
    s = obj(s);
    var st = Object.assign({ goal: 'perder', target: C.defaultTarget(), protein: 200, water: 3000, floor: 2400, ceiling: 3400, step: 100 }, obj(s.settings));
    if (!C.GOALS[st.goal]) st.goal = 'perder';
    st.target = clamp(+st.target || C.defaultTarget(), 1800, 5000);
    st.protein = clamp(+st.protein || 200, 80, 400);
    st.water = clamp(+st.water || 3000, 1500, 6000);
    st.floor = clamp(+st.floor || 2400, 1500, 5000);
    st.ceiling = clamp(+st.ceiling || 3400, 1500, 6000);
    st.step = clamp(+st.step || 100, 50, 300);
    var weights = (Array.isArray(s.weights) ? s.weights : []).filter(validW).map(function (w) {
      var o = { d: w.d, peso: +w.peso, ref: w.ref !== false };
      if (isFinite(w.gordura) && w.gordura != null) o.gordura = +w.gordura;
      if (isFinite(w.musculo) && w.musculo != null) o.musculo = +w.musculo;
      if (isFinite(w.energia) && w.energia != null) o.energia = clamp(+w.energia, 1, 5);
      return o;
    });
    return { v: 1, settings: st, days: obj(s.days), qty: obj(s.qty), week: Object.assign({ 2: false, 3: false, 5: false }, obj(s.week)), have: obj(s.have), weights: weights };
  }
  function load() {
    try { var r = localStorage.getItem(KEY); if (r) return norm(JSON.parse(r)); } catch (e) { memOnly = true; }
    return norm({});
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { memOnly = true; if (!warned) { warned = true; toast('Não consegui salvar neste navegador. Exporte um backup em Mais.'); } }
  }
  var S = load();
  var ui = { tab: 'hoje', date: todayStr(), sheet: null, pending: null, msg: '' };

  function dayState(ds) { if (!S.days[ds]) S.days[ds] = {}; var d = S.days[ds]; d.done = obj(d.done); d.pick = obj(d.pick); return d; }
  function campFor(ds, wd) { var d = S.days[ds]; if (d && d.camp != null) return !!d.camp; return !!S.week[wd]; }
  function ctxFor(ds) { var d = S.days[ds] || {}; return { scale: C.carbScaleFor(S.settings.target), qty: S.qty, pick: obj(d.pick) }; }
  function planFor(ds) {
    var wd = parseD(ds).getDay(), camp = campFor(ds, wd), d = S.days[ds] || {}, out = !!d.out;
    var key = C.dayTypeKey(wd, camp);
    var canOut = JSON.stringify(C.dayPlan(key, true)) !== JSON.stringify(C.dayPlan(key, false));
    if (!canOut) out = false;
    return { wd: wd, camp: camp, out: out, key: key, canOut: canOut, T: C.DAYTYPES[key] };
  }

  // ---------- componentes ----------
  function bar(cls, val, max) { return '<div class="bar ' + cls + '" role="img" aria-label="' + r0(val) + ' de ' + r0(max) + '"><i style="width:' + clamp(val / max * 100, 0, 100) + '%"></i></div>'; }
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 4000);
  }
  function openSheet(html) { ui.sheet = html; renderSheet(); }
  function closeSheet() { ui.sheet = null; ui.pending = null; renderSheet(); }
  function renderSheet() {
    var el = document.getElementById('sheet');
    if (!ui.sheet) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<div class="backdrop" data-act="close"></div><div class="panel" role="dialog" aria-modal="true" aria-label="Detalhes">' +
      '<div class="panel-h"><span></span><button class="x" data-act="close" aria-label="Fechar">✕</button></div>' + ui.sheet + '</div>';
    var b = el.querySelector('.x'); if (b) b.focus();
  }
  function macroLine(m) { return '<span class="mac">' + r0(m.k) + ' kcal</span> · P ' + r0(m.p) + ' g · C ' + r0(m.c) + ' g · G ' + r0(m.f) + ' g'; }

  // ---------- Hoje ----------
  function viewHoje() {
    var ds = ui.date, p = planFor(ds), d = dayState(ds), ctx = ctxFor(ds);
    var isToday = ds === todayStr();
    var plan = C.dayPlan(p.key, p.out);
    var tot = C.dayTotals(p.key, p.out, ctx);
    var done = { k: 0, p: 0, c: 0, f: 0 };
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    var h = '';
    h += '<div class="head"><button class="icon-btn" data-act="day" data-n="-1" aria-label="Dia anterior">‹</button>' +
      '<div class="t"><h1>' + esc(C.DAYNAMES[p.wd]) + ', ' + dm(ds) + '</h1><small>' + esc(p.T.label) + (isToday ? ' · hoje' : '') + '</small></div>' +
      '<button class="icon-btn" data-act="day" data-n="1" aria-label="Próximo dia">›</button></div>';
    if (!isToday) h += '<p><button class="btn small" data-act="today">Voltar para hoje</button></p>';
    h += '<div class="row" style="margin:10px 0">';
    if ([2, 3, 5].indexOf(p.wd) >= 0) h += '<button class="chip" aria-pressed="' + p.camp + '" data-act="camp">Campinas</button>';
    if (p.canOut) h += '<button class="chip" aria-pressed="' + p.out + '" data-act="out">Jantar fora</button>';
    h += '</div>';
    h += '<p class="muted">Acorde ' + esc(p.T.wake) + ' · durma ' + esc(p.T.bed) + '. ' + esc(p.T.note) + '</p>';
    if (memOnly) h += '<div class="warnbox">Este navegador não está salvando seus dados. Exporte um backup em Mais.</div>';
    // meals
    plan.forEach(function (s) {
      var M = C.MEALS[s.meal], variant = d.pick[s.meal] && M.v[d.pick[s.meal]] ? d.pick[s.meal] : 'A';
      var V = M.v[variant], items = C.resolve(s.meal, variant, ctx), mm = C.mealMacros(s.meal, variant, ctx);
      var isDone = !!d.done[s.time];
      if (isDone) { done.k += mm.k; done.p += mm.p; done.c += mm.c; done.f += mm.f; }
      var hm = s.time.split(':'), late = isToday && !isDone && nowMin > (+hm[0]) * 60 + (+hm[1]) + 60;
      var variants = Object.keys(M.v);
      h += '<section class="card meal' + (isDone ? ' done' : '') + (late ? ' late' : '') + '">' +
        '<div class="meal-h"><span class="time">' + s.time + '</span><h3>' + esc(M.name) + '</h3>' +
        (M.optional ? '<span class="badge">opcional</span>' : '') + (late ? '<span class="badge warn">atrasada</span>' : '') +
        '<span class="kcal">' + r0(mm.k) + ' kcal · P ' + r0(mm.p) + '</span></div>' +
        '<p class="muted">' + esc(V.label) + '</p><ul class="items">';
      items.forEach(function (it) {
        h += '<li><button class="item" data-act="item" data-key="' + esc(it.key) + '"><span>' + esc(C.FOODS[it.f].n.replace(/ \(.*\)$/, '')) + '</span><span class="q">' + esc(C.fmtQty(it.f, it.g)) + '</span></button></li>';
      });
      h += '</ul><div class="actions"><button class="btn ' + (isDone ? '' : 'primary') + '" data-act="done" data-time="' + s.time + '" aria-pressed="' + isDone + '">' + (isDone ? '✓ Feito (desfazer)' : 'Marcar como feito') + '</button>';
      if (variants.length > 1) h += '<button class="btn" data-act="swap" data-meal="' + s.meal + '">Trocar opção</button>';
      if (V.recipe) h += '<button class="btn" data-act="recipe" data-r="' + V.recipe + '">Como fazer</button>';
      h += '</div></section>';
    });
    // resumo
    var tgt = S.settings.target;
    h += '<section class="card"><h2>Resumo do dia</h2>' +
      '<p>Calorias feitas: <b>' + r0(done.k) + '</b> de ' + r0(tot.total.k) + ' planejadas <span class="muted">(meta ' + tgt + ')</span></p>' + bar('', done.k, tot.total.k) +
      '<p>Proteína: <b>' + r0(done.p) + ' g</b> <span class="muted">(plano ' + r0(tot.total.p) + ' g · meta ' + S.settings.protein + ' g)</span></p>' + bar('protein', done.p, S.settings.protein) +
      '<p class="muted">C ' + r0(done.c) + ' g · G ' + r0(done.f) + ' g. Valores estimados por tabelas; marcas e preparo variam.</p></section>';
    // água
    var wml = d.water || 0, wgoal = S.settings.water + (p.wd === 3 ? 500 : 0);
    h += '<section class="card"><h2>Água</h2><p><b>' + (wml / 1000).toString().replace('.', ',') + ' L</b> de ' + (wgoal / 1000).toString().replace('.', ',') + ' L' + (p.wd === 3 ? ' <span class="muted">(+0,5 L no dia de basquete)</span>' : '') + '</p>' + bar('water', wml, wgoal) +
      '<div class="actions"><button class="btn" data-act="water" data-n="250">+250 ml</button><button class="btn" data-act="water" data-n="500">+500 ml</button><button class="btn small" data-act="water" data-n="-250">−250</button></div></section>';
    // preparo para amanhã
    var tm = addDays(ds, 1), pt = planFor(tm), tasks = C.prepFor(pt.key, pt.out);
    if (tasks.length) {
      h += '<section class="card"><h2>Preparar hoje para amanhã</h2><p class="muted">' + esc(C.DAYNAMES[pt.wd]) + ' · ' + esc(pt.T.label) + '</p><ul>';
      tasks.forEach(function (t) { h += '<li>' + esc(t) + '</li>'; });
      h += '</ul></section>';
    }
    return h;
  }

  // ---------- Semana ----------
  function viewSemana() {
    var dt = parseD(ui.date), wd = dt.getDay(), mon = addDays(ui.date, wd === 0 ? -6 : 1 - wd);
    var h = '<h1>Semana</h1><p class="muted">Toque em um dia para abrir o plano.</p>';
    h += '<section class="card"><h2>Dias em Campinas</h2><p class="muted">Define o padrão de cada semana (você ainda pode mudar um dia específico em Hoje).</p><div class="row">';
    [[2, 'Terça'], [3, 'Quarta'], [5, 'Sexta']].forEach(function (x) { h += '<button class="chip" aria-pressed="' + !!S.week[x[0]] + '" data-act="weekcamp" data-wd="' + x[0] + '">' + x[1] + '</button>'; });
    h += '</div></section>';
    var sum = { k: 0, p: 0 };
    for (var i = 0; i < 7; i++) {
      var ds = addDays(mon, i), p = planFor(ds), t = C.dayTotals(p.key, p.out, ctxFor(ds)).total;
      sum.k += t.k; sum.p += t.p;
      h += '<button class="daybtn' + (ds === todayStr() ? ' today' : '') + '" data-act="goto" data-d="' + ds + '"><div class="row spread"><b>' + C.DAYNAMES[p.wd] + ' ' + dm(ds) + '</b><span class="muted">' + r0(t.k) + ' kcal · P ' + r0(t.p) + ' g</span></div><div class="muted">' + esc(p.T.label) + (p.out ? ' · jantar fora' : '') + '</div></button>';
    }
    h += '<p class="muted">Média da semana: ' + r0(sum.k / 7) + ' kcal e ' + r0(sum.p / 7) + ' g de proteína por dia (meta ' + S.settings.target + ' kcal).</p>';
    return h;
  }

  // ---------- Compras ----------
  function viewCompras() {
    var rows = C.shopping(S.week, { scale: C.carbScaleFor(S.settings.target), qty: S.qty });
    var cats = ['Proteínas', 'Laticínios', 'Hortifruti', 'Mercearia'];
    var h = '<h1>Compras da semana</h1><p class="muted">Calculada pelo plano principal (inclui o desperdício do cru para o cozido). Marque o que você já tem.</p>';
    cats.forEach(function (c) {
      var list = rows.filter(function (r) { return r.cat === c; });
      if (!list.length) return;
      h += '<section class="card"><h2>' + c + '</h2>';
      list.forEach(function (r) {
        var have = S.have[r.id] != null ? !!S.have[r.id] : false;
        h += '<label class="check' + (have ? ' have' : '') + '"><input type="checkbox" data-act="have" data-id="' + esc(r.id) + '"' + (have ? ' checked' : '') + '><span class="grow"><b>' + esc(r.name) + '</b> · ' + esc(r.text) + '</span>' + (r.home && !have ? '<span class="badge">talvez em casa</span>' : '') + '</label>';
      });
      h += '</section>';
    });
    h += '<p><button class="btn" data-act="clearhave">Limpar marcações</button></p>';
    return h;
  }

  // ---------- Evolução ----------
  function chart() {
    var ws = S.weights.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    if (ws.length < 2) return '<p class="muted">Registre pelo menos 2 pesagens para ver o gráfico.</p>';
    var W = 320, H = 170, L = 34, R = 10, T = 12, B = 22;
    var t0 = Date.parse(ws[0].d + 'T12:00:00Z'), t1 = Date.parse(ws[ws.length - 1].d + 'T12:00:00Z');
    var lo = Math.min.apply(null, ws.map(function (w) { return w.peso; })), hi = Math.max.apply(null, ws.map(function (w) { return w.peso; }));
    lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
    function X(d) { return L + (t1 === t0 ? 0.5 : (Date.parse(d + 'T12:00:00Z') - t0) / (t1 - t0)) * (W - L - R); }
    function Y(v) { return T + (hi - v) / (hi - lo) * (H - T - B); }
    var refs = ws.filter(function (w) { return w.ref !== false; });
    var line = refs.map(function (w) { return X(w.d).toFixed(1) + ',' + Y(w.peso).toFixed(1); }).join(' ');
    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfico do peso de ' + dmy(ws[0].d) + ' a ' + dmy(ws[ws.length - 1].d) + '">';
    [lo, (lo + hi) / 2, hi].forEach(function (v) { svg += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="2" y="' + (Y(v) + 3).toFixed(1) + '">' + br(v, 1) + '</text>'; });
    if (refs.length > 1) svg += '<polyline class="ln" points="' + line + '"/>';
    ws.forEach(function (w) { svg += '<circle class="' + (w.ref === false ? 'noref' : '') + '" cx="' + X(w.d).toFixed(1) + '" cy="' + Y(w.peso).toFixed(1) + '" r="3.5"/>'; });
    svg += '<text x="' + L + '" y="' + (H - 6) + '">' + dm(ws[0].d) + '</text><text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + dm(ws[ws.length - 1].d) + '</text></svg>';
    return svg + '<p class="muted">Pontos cheios = em jejum (referência). Pontos vazios = outros horários, ignorados na tendência.</p>';
  }
  function viewEvolucao() {
    var ws = S.weights.slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    var sg = C.suggest(S.settings, S.weights, todayStr());
    var h = '<h1>Evolução</h1>';
    h += '<section class="card"><h2>Termostato de calorias</h2>';
    if (sg.slope == null) h += '<p>' + esc(sg.reason) + '</p>';
    else {
      h += '<p>Tendência: <b>' + (sg.slope > 0 ? '+' : '') + br(sg.slope, 2) + ' kg/semana</b> <span class="muted">(objetivo: ' + esc(C.GOALS[S.settings.goal].nome) + ')</span></p><p>' + esc(sg.reason) + '</p>';
      if (sg.delta !== 0) h += '<p>Sugestão: <b>' + (sg.delta > 0 ? '+' : '') + sg.delta + ' kcal</b> (de ' + S.settings.target + ' para ' + sg.newTarget + ').</p><button class="btn primary" data-act="apply">Aplicar sugestão</button>';
      else h += '<p class="ok"><b>Manter ' + S.settings.target + ' kcal.</b></p>';
    }
    h += '<p class="muted">Só sugere; quem decide é você. Use a pesagem de domingo em jejum como referência.</p></section>';
    h += '<section class="card"><h2>Nova pesagem</h2>' +
      '<label class="f" for="w-d">Data</label><input id="w-d" type="date" value="' + todayStr() + '" max="' + todayStr() + '">' +
      '<label class="f" for="w-p">Peso (kg)</label><input id="w-p" type="text" inputmode="decimal" placeholder="ex.: 111,4">' +
      '<label class="f" for="w-g">Gordura corporal % (opcional)</label><input id="w-g" type="text" inputmode="decimal">' +
      '<label class="f" for="w-m">Massa muscular % ou kg (opcional)</label><input id="w-m" type="text" inputmode="decimal">' +
      '<label class="f" for="w-e">Energia na semana (1 a 5)</label><select id="w-e"><option value="">—</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
      '<label class="check"><input id="w-r" type="checkbox" checked><span>Em jejum, de manhã (conta na tendência)</span></label>' +
      '<p id="w-err" class="err" role="alert"></p><button class="btn primary" data-act="addw">Salvar pesagem</button></section>';
    h += '<section class="card"><h2>Gráfico</h2>' + chart() + '</section>';
    if (ws.length) {
      h += '<section class="card"><h2>Histórico</h2><table><tr><th>Data</th><th>Peso</th><th>Gord.</th><th>Músc.</th><th></th></tr>';
      ws.slice(0, 12).forEach(function (w) {
        h += '<tr><td>' + dm(w.d) + (w.ref === false ? ' ○' : '') + '</td><td>' + br(w.peso, 1) + '</td><td>' + (w.gordura != null ? br(w.gordura, 1) : '—') + '</td><td>' + (w.musculo != null ? br(w.musculo, 1) : '—') + '</td><td><button class="btn small" data-act="delw" data-d="' + w.d + '" aria-label="Apagar pesagem de ' + dmy(w.d) + '">Apagar</button></td></tr>';
      });
      h += '</table></section>';
    }
    return h;
  }

  // ---------- Mais ----------
  function viewMais() {
    var s = S.settings;
    var h = '<h1>Mais</h1><section class="card"><h2>Metas</h2>' +
      '<label class="f" for="s-goal">Objetivo</label><select id="s-goal">' +
      Object.keys(C.GOALS).map(function (g) { return '<option value="' + g + '"' + (g === s.goal ? ' selected' : '') + '>' + esc(C.GOALS[g].nome) + '</option>'; }).join('') + '</select>' +
      '<label class="f" for="s-target">Meta de calorias por dia</label><input id="s-target" type="text" inputmode="numeric" value="' + s.target + '">' +
      '<label class="f" for="s-protein">Meta de proteína (g)</label><input id="s-protein" type="text" inputmode="numeric" value="' + s.protein + '">' +
      '<label class="f" for="s-water">Meta de água (ml)</label><input id="s-water" type="text" inputmode="numeric" value="' + s.water + '">' +
      '<label class="f" for="s-floor">Piso de calorias (o termostato não passa)</label><input id="s-floor" type="text" inputmode="numeric" value="' + s.floor + '">' +
      '<label class="f" for="s-ceiling">Teto de calorias</label><input id="s-ceiling" type="text" inputmode="numeric" value="' + s.ceiling + '">' +
      '<p id="s-err" class="err" role="alert"></p><button class="btn primary" data-act="savesettings">Salvar metas</button>' +
      '<p class="muted">A meta ajusta só os carboidratos (aveia, arroz, batata-doce, pão). Proteína e gorduras ficam fixas. Quantidades que você editar manualmente ficam como você deixou.</p></section>';
    h += '<section class="card"><h2>Quantidades editadas</h2><p class="muted">' + Object.keys(S.qty).length + ' item(ns) com quantidade própria.</p><button class="btn" data-act="resetqty">Voltar tudo ao padrão</button></section>';
    h += '<section class="card"><h2>Backup</h2><p class="muted">Seus dados ficam só neste aparelho. Exporte de vez em quando.</p>' +
      '<div class="actions"><button class="btn" data-act="export">Exportar backup</button><label class="btn" for="imp" style="display:inline-flex;align-items:center">Importar backup</label></div>' +
      '<input id="imp" type="file" accept="application/json,.json" data-act="import" style="position:absolute;left:-9999px">' +
      '<p id="imp-err" class="err" role="alert"></p></section>';
    h += '<section class="card"><h2>Sobre os números</h2><p class="muted">Calorias e macros são estimativas calculadas por tabelas de composição e variam com marca e preparo. Isto é um plano de rotina, não prescrição médica. Para decisões de saúde, fale com um nutricionista ou médico.</p>' +
      '<button class="btn danger" data-act="wipe">Apagar todos os dados</button></section>';
    return h;
  }

  // ---------- render ----------
  var TABS = [['hoje', '🍽️', 'Hoje'], ['semana', '📅', 'Semana'], ['compras', '🛒', 'Compras'], ['evol', '📈', 'Evolução'], ['mais', '⚙️', 'Mais']];
  function render() {
    var v = { hoje: viewHoje, semana: viewSemana, compras: viewCompras, evol: viewEvolucao, mais: viewMais }[ui.tab];
    document.getElementById('app').innerHTML = v();
    document.getElementById('nav').innerHTML = TABS.map(function (t) {
      return '<button class="tab" data-act="tab" data-t="' + t[0] + '"' + (ui.tab === t[0] ? ' aria-current="page"' : '') + '><span aria-hidden="true">' + t[1] + '</span>' + t[2] + '</button>';
    }).join('');
  }
  function setTab(t) { ui.tab = t; render(); window.scrollTo(0, 0); }

  // ---------- sheets ----------
  function itemSheet(key) {
    var pr = key.split('|'), M = C.MEALS[pr[0]]; if (!M || !M.v[pr[1]]) return;
    var it = M.v[pr[1]].items[+pr[2]]; if (!it) return;
    var F = C.FOODS[it[0]], ctx = ctxFor(ui.date);
    var g = C.resolve(pr[0], pr[1], ctx)[+pr[2]].g, edited = S.qty[key] != null;
    var h = '<h2>' + esc(F.n) + '</h2><p>' + esc(F.d) + '</p>' +
      '<p>Por 100 g: ' + F.k + ' kcal · P ' + F.p + ' g · C ' + F.c + ' g · G ' + F.f + ' g</p>' +
      '<p>Quantidade atual: <b>' + esc(C.fmtQty(it[0], g)) + '</b></p><p>' + macroLine(C.foodMacros(it[0], g)) + '</p>' +
      '<p class="muted">Padrão do plano: ' + esc(C.fmtQty(it[0], it[1])) + (edited ? ' · você editou esta quantidade' : (F.carb && ctx.scale !== 1 ? ' · ajustado pela meta de calorias' : '')) + '</p>' +
      '<label class="f" for="q-g">Quantidade em gramas</label><input id="q-g" type="text" inputmode="decimal" value="' + g + '">' +
      '<p id="q-err" class="err" role="alert"></p><div class="actions"><button class="btn primary" data-act="saveqty" data-key="' + esc(key) + '">Salvar quantidade</button>' + (edited ? '<button class="btn" data-act="clearqty" data-key="' + esc(key) + '">Voltar ao padrão</button>' : '') + '</div>';
    openSheet(h);
  }
  function recipeSheet(id) {
    var R = C.RECIPES[id]; if (!R) return;
    openSheet('<h2>' + esc(R.t) + '</h2><ol class="steps">' + R.s.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>');
  }
  function confirmSheet(title, text, act, label) {
    openSheet('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="actions"><button class="btn danger" data-act="' + act + '">' + esc(label) + '</button><button class="btn" data-act="close">Cancelar</button></div>');
  }

  // ---------- ações ----------
  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function setErr(id, msg) { var e = document.getElementById(id); if (e) e.textContent = msg; }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  var actions = {
    tab: function (el) { setTab(el.dataset.t); },
    day: function (el) { ui.date = addDays(ui.date, +el.dataset.n); render(); },
    today: function () { ui.date = todayStr(); render(); },
    goto: function (el) { ui.date = el.dataset.d; setTab('hoje'); },
    camp: function () { var d = dayState(ui.date), p = planFor(ui.date); d.camp = !p.camp; save(); render(); },
    out: function () { var d = dayState(ui.date); d.out = !d.out; save(); render(); },
    weekcamp: function (el) { var w = el.dataset.wd; S.week[w] = !S.week[w]; save(); render(); },
    done: function (el) { var d = dayState(ui.date), t = el.dataset.time; if (d.done[t]) delete d.done[t]; else d.done[t] = true; save(); render(); },
    swap: function (el) {
      var d = dayState(ui.date), m = el.dataset.meal, ks = Object.keys(C.MEALS[m].v), cur = d.pick[m] && C.MEALS[m].v[d.pick[m]] ? d.pick[m] : 'A';
      d.pick[m] = ks[(ks.indexOf(cur) + 1) % ks.length]; save(); render();
    },
    recipe: function (el) { recipeSheet(el.dataset.r); },
    item: function (el) { itemSheet(el.dataset.key); },
    saveqty: function (el) {
      var g = num(val('q-g'));
      if (g == null || g < 1 || g > 2000) { setErr('q-err', 'Digite uma quantidade entre 1 e 2000 g.'); return; }
      S.qty[el.dataset.key] = g; save(); closeSheet(); render();
    },
    clearqty: function (el) { delete S.qty[el.dataset.key]; save(); closeSheet(); render(); },
    resetqty: function () { S.qty = {}; save(); render(); toast('Quantidades voltaram ao padrão.'); },
    water: function (el) { var d = dayState(ui.date); d.water = clamp((d.water || 0) + (+el.dataset.n), 0, 10000); save(); render(); },
    have: function (el) { S.have[el.dataset.id] = el.checked; save(); render(); },
    clearhave: function () { S.have = {}; save(); render(); },
    addw: function () {
      var d = val('w-d'), p = num(val('w-p')), g = num(val('w-g')), m = num(val('w-m')), e = val('w-e');
      var ref = document.getElementById('w-r').checked;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { setErr('w-err', 'Escolha uma data.'); return; }
      if (d > todayStr()) { setErr('w-err', 'A data não pode ser no futuro.'); return; }
      if (p == null || p < 40 || p > 250) { setErr('w-err', 'Peso entre 40 e 250 kg (use vírgula ou ponto).'); return; }
      if (g != null && (g < 1 || g > 70)) { setErr('w-err', 'Gordura corporal entre 1 e 70%.'); return; }
      if (m != null && (m < 1 || m > 200)) { setErr('w-err', 'Massa muscular inválida.'); return; }
      var w = { d: d, peso: p, ref: ref };
      if (g != null) w.gordura = g;
      if (m != null) w.musculo = m;
      if (e) w.energia = +e;
      S.weights = S.weights.filter(function (x) { return x.d !== d; }); S.weights.push(w);
      save(); render(); toast('Pesagem salva.');
    },
    delw: function (el) { S.weights = S.weights.filter(function (x) { return x.d !== el.dataset.d; }); save(); render(); },
    apply: function () {
      var sg = C.suggest(S.settings, S.weights, todayStr());
      if (sg.status === 'ajustar') { S.settings.target = sg.newTarget; save(); render(); toast('Meta ajustada para ' + sg.newTarget + ' kcal.'); }
    },
    savesettings: function () {
      var t = num(val('s-target')), pr = num(val('s-protein')), w = num(val('s-water')), fl = num(val('s-floor')), ce = num(val('s-ceiling'));
      if (t == null || t < 1800 || t > 5000) { setErr('s-err', 'Calorias entre 1800 e 5000.'); return; }
      if (pr == null || pr < 80 || pr > 400) { setErr('s-err', 'Proteína entre 80 e 400 g.'); return; }
      if (w == null || w < 1500 || w > 6000) { setErr('s-err', 'Água entre 1500 e 6000 ml.'); return; }
      if (fl == null || ce == null || fl > ce) { setErr('s-err', 'Piso e teto precisam ser números, com piso menor que o teto.'); return; }
      if (t < fl || t > ce) { setErr('s-err', 'A meta precisa ficar entre o piso e o teto.'); return; }
      S.settings = Object.assign(S.settings, { goal: val('s-goal'), target: r0(t), protein: r0(pr), water: r0(w), floor: r0(fl), ceiling: r0(ce) });
      save(); render(); toast('Metas salvas.');
    },
    export: function () { download('rotina-backup-' + todayStr() + '.json', JSON.stringify(S, null, 2)); toast('Backup exportado.'); },
    confirmimport: function () { if (ui.pending) { S = ui.pending; save(); closeSheet(); render(); toast('Backup importado.'); } },
    wipe: function () { confirmSheet('Apagar tudo?', 'Pesagens, marcações e metas serão apagadas deste aparelho. Exporte um backup antes, se quiser guardar.', 'dowipe', 'Apagar tudo'); },
    dowipe: function () { S = norm({}); save(); closeSheet(); render(); },
    close: function () { closeSheet(); }
  };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT') return;
    var f = actions[el.dataset.act]; if (f) f(el);
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (!el || !el.dataset) return;
    if (el.dataset.act === 'have') return actions.have(el);
    if (el.dataset.act === 'import') {
      var file = el.files && el.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var j = JSON.parse(rd.result);
          if (!j || typeof j !== 'object' || (!Array.isArray(j.weights) && !obj(j.days))) throw new Error('formato');
          ui.pending = norm(j);
          openSheet('<h2>Importar este backup?</h2><p>Contém ' + ui.pending.weights.length + ' pesagem(ns) e ' + Object.keys(ui.pending.days).length + ' dia(s) registrados. Seus dados atuais serão substituídos.</p><div class="actions"><button class="btn primary" data-act="confirmimport">Substituir</button><button class="btn" data-act="close">Cancelar</button></div>');
        } catch (e) { setErr('imp-err', 'Arquivo inválido. Use um backup exportado por este app.'); }
        el.value = '';
      };
      rd.onerror = function () { setErr('imp-err', 'Não consegui ler o arquivo.'); };
      rd.readAsText(file);
    }
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && ui.sheet) closeSheet(); });

  // vira o dia à meia-noite se o app ficar aberto
  var lastToday = todayStr();
  setInterval(function () {
    var t = todayStr();
    if (t !== lastToday) { if (ui.date === lastToday) ui.date = t; lastToday = t; render(); }
  }, 60000);

  render();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { try { navigator.serviceWorker.register('sw.js'); } catch (e) {} });
  }
  window.__rotina = { state: function () { return S; } };
})();
