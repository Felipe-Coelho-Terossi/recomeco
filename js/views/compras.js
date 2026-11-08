/* Compras: lista da semana calculada pelo plano. */
import { esc } from '../util.js';
import { store, save } from '../store.js';

const C = window.Core;
export const id = 'compras';
export const label = 'Compras';
export const title = 'Compras';

export function render() {
  const S = store.S;
  const rows = C.shopping(S.week, { scale: C.carbScaleFor(S.settings.target), qty: S.qty });
  let total = 0, got = 0;
  rows.forEach((r) => { total++; if (S.have[r.id]) got++; });
  let h = '<h1 class="page-title">Compras</h1><p class="muted">Calculada pelo plano principal da semana, já convertendo cru em cozido. Marque o que você já tem em casa.</p>';
  h += '<p class="muted"><b>' + got + '</b> de ' + total + ' itens marcados</p>';
  ['Proteínas', 'Laticínios', 'Hortifruti', 'Mercearia'].forEach((c) => {
    const list = rows.filter((r) => r.cat === c);
    if (!list.length) return;
    h += '<section class="card"><h2>' + c + '</h2>';
    list.forEach((r) => {
      const have = !!S.have[r.id];
      h += '<label class="check' + (have ? ' have' : '') + '"><input type="checkbox" data-act="have" data-id="' + esc(r.id) + '"' + (have ? ' checked' : '') + '><span class="grow"><b>' + esc(r.name) + '</b><span class="q"> ' + esc(r.text) + '</span></span>' + (r.home && !have ? '<span class="badge">talvez em casa</span>' : '') + '</label>';
    });
    h += '</section>';
  });
  h += '<button class="btn" data-act="clearhave">Limpar marcações</button>';
  return h;
}

export const actions = {
  have(el, ctx) { store.S.have[el.dataset.id] = el.checked; save(); ctx.render(); },
  clearhave(el, ctx) { store.S.have = {}; save(); ctx.render(); }
};
