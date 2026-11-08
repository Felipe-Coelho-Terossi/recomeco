/* Ajustes: metas, quantidades editadas, backup e apagar tudo. */
import { esc, num, r0, todayStr } from '../util.js';
import { store, ui, norm, replace, save, status } from '../store.js';
import { toast, setErr, val, openSheet, closeSheet, confirmSheet } from '../ui.js';

const C = window.Core;
export const id = 'ajustes';
export const label = 'Ajustes';
export const title = 'Ajustes';

let pending = null;

export function render() {
  const s = store.S.settings;
  let h = '<h1 class="page-title">Ajustes</h1><section class="card"><h2>Metas</h2>' +
    '<label class="f" for="s-goal">Objetivo</label><select id="s-goal">' +
    Object.keys(C.GOALS).map((g) => '<option value="' + g + '"' + (g === s.goal ? ' selected' : '') + '>' + esc(C.GOALS[g].nome) + '</option>').join('') + '</select>' +
    '<label class="f" for="s-target">Meta de calorias por dia</label><input id="s-target" type="text" inputmode="numeric" value="' + s.target + '">' +
    '<label class="f" for="s-protein">Meta de proteína (g)</label><input id="s-protein" type="text" inputmode="numeric" value="' + s.protein + '">' +
    '<label class="f" for="s-water">Meta de água (ml)</label><input id="s-water" type="text" inputmode="numeric" value="' + s.water + '">' +
    '<label class="f" for="s-floor">Piso de calorias (o termostato não desce abaixo)</label><input id="s-floor" type="text" inputmode="numeric" value="' + s.floor + '">' +
    '<label class="f" for="s-ceiling">Teto de calorias</label><input id="s-ceiling" type="text" inputmode="numeric" value="' + s.ceiling + '">' +
    '<p id="s-err" class="err" role="alert"></p><button class="btn primary" data-act="savesettings">Salvar metas</button>' +
    '<p class="muted">A meta de calorias ajusta só os carboidratos (aveia, arroz, batata-doce, pão). Proteína e gorduras ficam fixas. Quantidades que você editar à mão não mudam.</p></section>';
  h += '<section class="card"><h2>Quantidades editadas</h2><p class="muted">' + Object.keys(store.S.qty).length + ' item(ns) com quantidade própria.</p><button class="btn" data-act="resetqty">Voltar tudo ao padrão</button></section>';
  h += '<section class="card"><h2>Backup</h2><p class="muted">Seus dados ficam só neste aparelho. Exporte de vez em quando e antes de trocar de celular.</p>' +
    '<div class="actions"><button class="btn" data-act="export">Exportar backup</button><label class="btn" for="imp">Importar backup</label></div>' +
    '<input id="imp" class="sr-input" type="file" accept="application/json,.json" data-act="import">' +
    '<p id="imp-err" class="err" role="alert"></p></section>';
  h += '<section class="card"><h2>Sobre os números</h2><p class="muted">Calorias e macros são estimativas calculadas por tabelas de composição e variam com marca e preparo. Este é um plano de rotina, não prescrição médica. Para decisões de saúde, fale com um nutricionista ou médico.</p>' +
    '<button class="btn danger" data-act="wipe">Apagar todos os dados</button></section>';
  return h;
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export const actions = {
  savesettings(el, ctx) {
    const t = num(val('s-target')), pr = num(val('s-protein')), w = num(val('s-water')), fl = num(val('s-floor')), ce = num(val('s-ceiling'));
    if (t == null || t < 1800 || t > 5000) { setErr('s-err', 'Digite calorias entre 1800 e 5000.'); return; }
    if (pr == null || pr < 80 || pr > 400) { setErr('s-err', 'Digite proteína entre 80 e 400 g.'); return; }
    if (w == null || w < 1500 || w > 6000) { setErr('s-err', 'Digite água entre 1500 e 6000 ml.'); return; }
    if (fl == null || ce == null || fl > ce) { setErr('s-err', 'Piso e teto precisam ser números, com o piso menor que o teto.'); return; }
    if (t < fl || t > ce) { setErr('s-err', 'A meta precisa ficar entre o piso e o teto.'); return; }
    Object.assign(store.S.settings, { goal: val('s-goal'), target: r0(t), protein: r0(pr), water: r0(w), floor: r0(fl), ceiling: r0(ce) });
    save(); ctx.render(); toast('Metas salvas.');
  },
  resetqty(el, ctx) { const old = store.S.qty; store.S.qty = {}; save(); ctx.render(); toast('Quantidades voltaram ao padrão.', () => { store.S.qty = old; save(); ctx.render(); }); },
  export() { download('rotina-backup-' + todayStr() + '.json', JSON.stringify(store.S, null, 2)); toast('Backup exportado.'); },
  confirmimport(el, ctx) { if (pending) { replace(pending); pending = null; closeSheet(); ctx.render(); toast('Backup importado.'); } },
  wipe() { confirmSheet('Apagar tudo?', 'Pesagens, treinos, marcações e metas serão apagados deste aparelho. Exporte um backup antes, se quiser guardar.', 'dowipe', 'Apagar tudo'); },
  dowipe(el, ctx) { replace(norm({})); closeSheet(); ctx.render(); }
};

export function onChange(el, ctx) {
  if (el.dataset.act !== 'import') return false;
  const file = el.files && el.files[0]; if (!file) return true;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const j = JSON.parse(rd.result);
      if (!j || typeof j !== 'object' || (!Array.isArray(j.weights) && (!j.days || typeof j.days !== 'object'))) throw new Error('formato');
      pending = norm(j);
      openSheet('<h2>Importar este backup?</h2><p>Contém ' + pending.weights.length + ' pesagem(ns), ' + pending.workouts.length + ' treino(s) e ' + Object.keys(pending.days).length + ' dia(s) registrados. Seus dados atuais serão substituídos.</p><div class="actions"><button class="btn primary" data-act="confirmimport">Substituir</button><button class="btn" data-act="close">Cancelar</button></div>', 'Importar backup');
    } catch (e) { setErr('imp-err', 'Arquivo inválido. Use um backup exportado por este app.'); }
    el.value = '';
  };
  rd.onerror = () => setErr('imp-err', 'Não consegui ler o arquivo.');
  rd.readAsText(file);
  return true;
}
