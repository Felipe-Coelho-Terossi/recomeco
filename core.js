/* Rotina do Felipe - núcleo: dados do plano e cálculos (sem DOM, testável no Node). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Valores por 100 g (k=kcal, p=proteína, c=carboidrato, f=gordura). Estimativas de tabelas
  // brasileiras/USDA; marcas variam. u = medida caseira (g por unidade).
  const FOODS = {
    aveia: { n: 'Aveia em flocos', k: 394, p: 13.9, c: 66.6, f: 8.5, cat: 'Mercearia', carb: true, home: true, u: { g: 13, nm: 'colher de sopa', pl: 'colheres de sopa' }, d: 'Carboidrato de digestão lenta, com fibra (beta-glucana). Base do overnight oats.' },
    chia: { n: 'Chia', k: 486, p: 16.5, c: 42.1, f: 30.7, cat: 'Mercearia', home: true, u: { g: 12, nm: 'colher de sopa', pl: 'colheres de sopa' }, d: 'Fibra e gordura boa. Absorve líquido e engrossa o overnight oats.' },
    castanhas: { n: 'Castanhas (mix sem sal)', k: 610, p: 14, c: 18, f: 54, cat: 'Mercearia', d: 'Gordura boa e um pouco de proteína. Aprox. 15 g = um punhado pequeno.' },
    pasta_amendoim: { n: 'Pasta de amendoim (só amendoim)', k: 588, p: 25, c: 20, f: 50, cat: 'Mercearia', u: { g: 15, nm: 'colher de sopa', pl: 'colheres de sopa' }, d: 'Confira o rótulo: o ingrediente deve ser só amendoim (sem açúcar nem óleo vegetal).' },
    iogurte: { n: 'Iogurte grego natural (sem açúcar)', k: 95, p: 8.5, c: 4, f: 5, cat: 'Laticínios', d: 'Rótulo: leite e fermento lácteo. Nada de açúcar, xarope ou "preparado de fruta". A proteína varia por marca.' },
    queijo_minas: { n: 'Queijo minas (frescal ou padrão)', k: 264, p: 17.4, c: 3.2, f: 20.2, cat: 'Laticínios', d: 'Branco, fresco e macio, sabor suave. Para pão, o padrão (mais firme) fatia melhor.' },
    ovo_cozido: { n: 'Ovo cozido', k: 155, p: 13, c: 1.1, f: 10.6, cat: 'Proteínas', home: true, u: { g: 50, nm: 'ovo', pl: 'ovos' }, d: 'Proteína completa e barata. Cozinhe vários de uma vez e guarde na geladeira.' },
    ovo_mexido: { n: 'Ovo mexido/frito', k: 190, p: 12.5, c: 1.5, f: 14.5, cat: 'Proteínas', home: true, u: { g: 50, nm: 'ovo', pl: 'ovos' }, d: 'Considera um pouco de óleo ou manteiga na frigideira.' },
    carne: { n: 'Carne bovina magra (sem gordura visível)', k: 205, p: 28, c: 0, f: 10, cat: 'Proteínas', raw: 1.3, d: 'Peso já pronto, sem a gordura que dá para retirar. Alcatra, maminha, patinho, ou a carne do churrasco aparada.' },
    frango: { n: 'Peito de frango cozido/grelhado', k: 165, p: 31, c: 0, f: 3.6, cat: 'Proteínas', raw: 1.35, d: 'Peso já cozido. Cozinhe no domingo e guarde em potes: dura 3 a 4 dias na geladeira.' },
    patinho: { n: 'Patinho moído refogado', k: 190, p: 28, c: 0, f: 8, cat: 'Proteínas', raw: 1.3, d: 'Refogue com alho e cebola, pouco óleo.' },
    arroz_integral: { n: 'Arroz integral cozido', k: 124, p: 2.6, c: 25.8, f: 1, cat: 'Mercearia', carb: true, raw: 0.35, d: 'Mais fibra que o branco. Pese já cozido.' },
    arroz_branco: { n: 'Arroz branco cozido', k: 128, p: 2.5, c: 28.1, f: 0.2, cat: 'Mercearia', carb: true, home: true, raw: 0.35, d: 'O que sua mãe já faz. Pese já cozido.' },
    feijao: { n: 'Feijão cozido', k: 76, p: 4.8, c: 13.6, f: 0.5, cat: 'Mercearia', home: true, raw: 0.35, d: 'Pese só os grãos com um pouco de caldo.' },
    batata_doce: { n: 'Batata-doce cozida', k: 77, p: 0.6, c: 18.4, f: 0.1, cat: 'Hortifruti', carb: true, raw: 1.1, d: 'Carboidrato de energia estável. Pode assar ou cozinhar com casca.' },
    brocolis_cenoura: { n: 'Brócolis e cenoura refogados', k: 40, p: 2.2, c: 7.6, f: 0.3, cat: 'Hortifruti', raw: 1.1, d: 'Refogue rápido com alho, sem encharcar de óleo (o azeite é contado à parte).' },
    azeite: { n: 'Azeite de oliva', k: 884, p: 0, c: 0, f: 100, cat: 'Mercearia', home: true, u: { g: 10, nm: 'colher de sopa (rasa)', pl: 'colheres de sopa (rasas)' }, d: 'Gordura boa, mas muito calórica: meça com a colher, não "a olho".' },
    pao_integral: { n: 'Pão de forma integral', k: 250, p: 9, c: 45, f: 3.5, cat: 'Mercearia', carb: true, u: { g: 25, nm: 'fatia', pl: 'fatias' }, d: 'Vire a embalagem: o 1º ingrediente tem que ser "farinha de trigo integral".' },
    whey: { n: 'Whey protein', k: 400, p: 80, c: 8, f: 6, cat: 'Mercearia', home: true, u: { g: 30, nm: 'dose', pl: 'doses' }, d: 'Suplemento de proteína. Água primeiro na garrafa, pó depois.' },
    banana: { n: 'Banana', k: 89, p: 1.1, c: 22.8, f: 0.3, cat: 'Hortifruti', u: { g: 90, nm: 'banana', pl: 'bananas' }, d: 'Carboidrato rápido e potássio. Cabe inteira na mochila.' },
    maca: { n: 'Maçã', k: 56, p: 0.3, c: 15, f: 0.2, cat: 'Hortifruti', u: { g: 130, nm: 'maçã', pl: 'maçãs' }, d: 'Fruta que aguenta bem na mochila.' },
    laranja: { n: 'Laranja', k: 47, p: 0.9, c: 11.8, f: 0.1, cat: 'Hortifruti', u: { g: 150, nm: 'laranja', pl: 'laranjas' }, d: 'Vitamina C. Se for comer fora de casa, leve já descascada e em gomos.' },
    tomate: { n: 'Tomate', k: 18, p: 0.9, c: 3.9, f: 0.2, cat: 'Hortifruti', u: { g: 100, nm: 'tomate', pl: 'tomates' }, d: 'Salada básica.' },
    cenoura: { n: 'Cenoura ralada', k: 34, p: 1.3, c: 7.7, f: 0.2, cat: 'Hortifruti', u: { g: 60, nm: 'cenoura', pl: 'cenouras' }, d: 'Rale na hora ou na véspera.' },
    alface: { n: 'Alface', k: 15, p: 1.4, c: 2.9, f: 0.2, cat: 'Hortifruti', d: 'Folhas para salada e sanduíche.' },
    lanche: { n: 'Hambúrguer gourmet (pão, carne, queijo, bacon, alface)', k: 320, p: 12.5, c: 22, f: 19, cat: 'Fora', d: 'Estimativa para um lanche gourmet de ~300 g. Peça a carne ao ponto para bem passada.' },
    batata_frita: { n: 'Batata frita (1 copo)', k: 312, p: 3.4, c: 41, f: 15, cat: 'Fora', d: 'Porção individual de ~130 g.' },
    maionese_alho: { n: 'Maionese de alho (1 potinho)', k: 700, p: 1, c: 3, f: 75, cat: 'Fora', d: 'Quase só gordura: 1 potinho (~35 g) já são ~250 kcal.' }
  };

  const RECIPES = {
    oats: { t: 'Overnight oats (mingau frio, sem fogo)', s: [
      'Num pote com tampa, coloque a aveia, o iogurte grego e a chia.',
      'Misture bem, tampe e leve à geladeira de um dia para o outro (mínimo 4 h).',
      'De manhã, corte a banana por cima e coloque as castanhas. Coma direto do pote, com colher.',
      'Textura de mingau grosso. Se ficar seco, junte um fio de leite; se achar sem graça, canela ajuda.',
      'Plano B: se não gostar, use a variante "3 ovos mexidos + pão + banana".'] },
    ovos_mexidos: { t: 'Ovos mexidos (10 minutos)', s: [
      'Bata os ovos com uma pitada de sal.',
      'Frigideira antiaderente em fogo médio, com pouquíssimo óleo ou manteiga.',
      'Mexa até firmar (1 a 2 min). Sirva com o pão integral e a banana.'] },
    shaker: { t: 'Whey na garrafa', s: [
      'Leve a dose (30 g) de whey em pó num potinho ou saquinho separado.',
      'Na hora, encha a garrafa com 300 a 350 ml de água e adicione o pó.',
      'Tampe e chacoalhe forte por uns 20 segundos. Água primeiro, pó depois: evita empelotar.',
      'Sem garrafa com bolinha misturadora vai empelotar um pouco; um shaker simples resolve de vez.'] },
    frango: { t: 'Frango desfiado/grelhado (preparo de domingo, ~20 min)', s: [
      'Compre cerca de 600 g de peito de frango (rende ~450 g pronto).',
      'Tempere com sal, alho e limão. Cozinhe na água ou grelhe até ficar bem cozido por dentro.',
      'Divida em potes com tampa: porções de 120 g (lanche) e 150 g (jantar).',
      'Guarde na geladeira por no máximo 3 a 4 dias.'] },
    ovo_cozido: { t: 'Ovos cozidos em lote', s: [
      'Coloque os ovos em água fria e leve ao fogo.',
      'Quando ferver, conte 9 a 10 minutos.',
      'Passe por água fria, descasque e guarde em pote na geladeira (até 5 dias).'] },
    marmita: { t: 'Marmita do almoço', s: [
      'Pese o arroz, o feijão e a carne já prontos.',
      'Salada (alface, tomate, cenoura) em um potinho separado, com o azeite medido numa colher.',
      'Nos dias de Campinas, esquente no micro-ondas do escritório.'] },
    sanduiche: { t: 'Sanduíche do trajeto', s: [
      'Monte: 2 fatias de pão integral, 120 g de frango desfiado e 40 g de queijo minas.',
      'Embrulhe bem e leve com 1 banana. Não precisa de gelo para o trajeto.'] },
    combo: { t: 'Regra do jantar fora', s: [
      'O jantar do plano sai e entra o combo: 1 lanche, 1 porção de batata e 1 maionese de alho.',
      'Bebida: água ou água com gás.',
      'O resto do dia segue normal, sem pular refeição para "compensar".',
      'Peça o hambúrguer ao ponto para bem passado. Coma o lanche primeiro e a batata devagar.',
      'Se ainda bater fome: um segundo lanche, nunca uma segunda batata.'] },
    churrasco: { t: 'Churrasco', s: [
      'Prato: carne primeiro, depois arroz e salada.',
      'Pão de alho e farofa só em pouca quantidade.',
      'É uma refeição na semana: coma bem e sem culpa.'] }
  };

  // Refeições: v = variantes (A = principal, B = alternativa). items = [alimento, gramas].
  const MEALS = {
    cafe: { name: 'Café da manhã', v: {
      A: { label: 'Overnight oats + 2 ovos', items: [['aveia', 40], ['iogurte', 200], ['chia', 12], ['banana', 90], ['castanhas', 15], ['ovo_cozido', 100]], recipe: 'oats', prep: 'Montar o overnight oats e cozinhar 2 ovos' },
      B: { label: '3 ovos mexidos + pão + banana', items: [['ovo_mexido', 150], ['pao_integral', 50], ['banana', 90]], recipe: 'ovos_mexidos' } } },
    almoco: { name: 'Almoço', v: {
      A: { label: 'Marmita com arroz integral', items: [['arroz_integral', 150], ['feijao', 100], ['carne', 160], ['alface', 40], ['tomate', 100], ['cenoura', 60], ['azeite', 10]], recipe: 'marmita', prep: 'Montar a marmita do almoço (arroz, feijão, carne magra e salada)' },
      B: { label: 'Marmita com arroz branco', items: [['arroz_branco', 150], ['feijao', 100], ['carne', 160], ['alface', 40], ['tomate', 100], ['cenoura', 60], ['azeite', 10]], recipe: 'marmita' } } },
    pre_aula: { name: 'Pré-aula / lanche', v: {
      A: { label: 'Iogurte grego + maçã + pasta de amendoim', items: [['iogurte', 170], ['maca', 130], ['pasta_amendoim', 15]] },
      B: { label: 'Pão com queijo minas + laranja', items: [['pao_integral', 50], ['queijo_minas', 40], ['laranja', 150]] } } },
    shaker: { name: 'Whey no intervalo (~16h)', v: {
      A: { label: '1 dose de whey na garrafa', items: [['whey', 30]], recipe: 'shaker', prep: 'Colocar 1 dose de whey (30 g) num potinho e separar a garrafa' } } },
    pos_aula: { name: 'Pós-aula', v: {
      A: { label: 'Pão + frango + queijo minas + laranja', items: [['pao_integral', 50], ['frango', 120], ['queijo_minas', 40], ['alface', 30], ['tomate', 50], ['laranja', 150]], recipe: 'frango', prep: 'Ter frango pronto na geladeira (120 g para o lanche e 150 g para o jantar)' },
      B: { label: 'Pão + patinho moído + laranja', items: [['pao_integral', 50], ['patinho', 120], ['tomate', 50], ['alface', 30], ['laranja', 150]] } } },
    pos_aula_leve: { name: 'Pós-aula leve (dia de jantar fora)', v: {
      A: { label: 'Frango + laranja', items: [['frango', 120], ['laranja', 150]] } } },
    jantar: { name: 'Jantar', v: {
      A: { label: 'Frango + batata-doce + brócolis e cenoura', items: [['frango', 150], ['batata_doce', 150], ['brocolis_cenoura', 150], ['azeite', 10]], recipe: 'frango' },
      B: { label: 'Carne magra + arroz + feijão + salada', items: [['carne', 130], ['arroz_branco', 150], ['feijao', 100], ['alface', 40], ['tomate', 100], ['azeite', 10]] } } },
    combo: { name: 'Jantar fora (combo)', v: {
      A: { label: '1 lanche + 1 batata + 1 maionese de alho', items: [['lanche', 300], ['batata_frita', 130], ['maionese_alho', 35]], recipe: 'combo' },
      B: { label: 'Versão mais leve: meia batata + maionese pequena', items: [['lanche', 300], ['batata_frita', 65], ['maionese_alho', 15]], recipe: 'combo' } } },
    lanche_manha: { name: 'Lanche da manhã (escritório)', v: {
      A: { label: 'Iogurte grego + maçã', items: [['iogurte', 170], ['maca', 130]], prep: 'Levar iogurte e maçã para a geladeira do escritório' } } },
    onibus: { name: 'Lanche do trajeto (~13h15)', v: {
      A: { label: 'Sanduíche de frango + banana', items: [['pao_integral', 50], ['frango', 120], ['queijo_minas', 40], ['banana', 90]], recipe: 'sanduiche', prep: 'Montar o sanduíche (pão, frango e queijo) e embrulhar' } } },
    pos_aula_ovos: { name: 'Pós-aula (Campinas)', v: {
      A: { label: '2 ovos mexidos + laranja', items: [['ovo_mexido', 100], ['laranja', 150]], recipe: 'ovos_mexidos' } } },
    pre_treino: { name: 'Pré-treino (jantar adiantado)', v: {
      A: { label: 'Arroz integral + frango + batata-doce + salada', items: [['arroz_integral', 150], ['frango', 150], ['batata_doce', 150], ['alface', 40], ['tomate', 100], ['azeite', 10]], recipe: 'frango' } } },
    pos_treino: { name: 'Pós-treino (~22h45)', v: {
      A: { label: 'Whey + pão com queijo minas + laranja', items: [['whey', 30], ['pao_integral', 50], ['queijo_minas', 40], ['laranja', 150]], recipe: 'shaker', prep: 'Deixar o whey e o pão separados para depois do basquete' } } },
    lanche_qui: { name: 'Lanche na faculdade (~10h)', v: {
      A: { label: 'Whey + pão com queijo minas + banana', items: [['whey', 30], ['pao_integral', 50], ['queijo_minas', 40], ['banana', 90]], recipe: 'shaker', prep: 'Separar whey, pão, queijo e banana para o lanche da faculdade' } } },
    churrasco: { name: 'Churrasco em Leme', v: {
      A: { label: 'Carne + arroz + salada', items: [['carne', 280], ['arroz_branco', 120], ['alface', 40], ['tomate', 100]], recipe: 'churrasco' } } },
    lanche_dom: { name: 'Lanche leve (só se bater fome)', optional: true, v: {
      A: { label: 'Iogurte grego + laranja', items: [['iogurte', 170], ['laranja', 150]] } } },
    jantar_leve: { name: 'Jantar leve', v: {
      A: { label: 'Frango + batata-doce + brócolis', items: [['frango', 150], ['batata_doce', 150], ['brocolis_cenoura', 150]], recipe: 'frango' } } }
  };

  const CASA = [['07:30', 'cafe'], ['11:45', 'almoco'], ['13:30', 'pre_aula'], ['16:00', 'shaker'], ['18:00', 'pos_aula'], ['20:30', 'jantar']];
  const CAMP = [['06:15', 'cafe'], ['10:00', 'lanche_manha'], ['12:00', 'almoco'], ['13:15', 'onibus'], ['16:00', 'shaker'], ['18:30', 'pos_aula_ovos'], ['20:30', 'jantar']];

  const DAYTYPES = {
    seg: { label: 'Segunda (em casa)', sched: CASA, wake: '07:00', bed: '23:00', note: 'Aula 10h-12h e 14h-18h. Almoço mais cedo (11h45) porque o pré-aula entra às 13h30.' },
    ter_casa: { label: 'Terça (em casa)', sched: CASA, wake: '07:00', bed: '23:00', note: 'Aula 14h-18h.' },
    ter_campinas: { label: 'Terça (Campinas, de carro)', sched: CAMP, wake: '06:00', bed: '22:00', note: 'Saída ~6h30, volta no Intercamp (13h15). Aula 14h30-18h.' },
    qua_casa: { label: 'Quarta (em casa)', sched: [['07:30', 'cafe'], ['11:45', 'almoco'], ['13:30', 'pre_aula'], ['18:30', 'pre_treino'], ['22:45', 'pos_treino']], wake: '07:00', bed: '23:30', note: 'Basquete 20h-22h30: beba água durante o treino (meta maior hoje).' },
    qua_campinas: { label: 'Quarta (Campinas, de ônibus)', sched: [['05:50', 'cafe'], ['10:00', 'lanche_manha'], ['12:00', 'almoco'], ['13:15', 'onibus'], ['18:30', 'pre_treino'], ['22:45', 'pos_treino']], wake: '05:40', bed: '22:00 (se der; o basquete termina 22h30)', note: 'Dia mais puxado da semana: ônibus 6h30, aula à tarde e basquete 20h-22h30. Durma mais cedo na terça.' },
    qui: { label: 'Quinta', sched: [['07:15', 'cafe'], ['10:00', 'lanche_qui'], ['12:30', 'almoco'], ['15:30', 'pre_aula'], ['20:30', 'jantar']], wake: '07:00', bed: '23:00', note: 'Aula 8h-12h. Tarde livre: não deixe o almoço passar das 13h.' },
    sex_casa: { label: 'Sexta (em casa)', sched: CASA, wake: '07:00', bed: '23:00', note: 'Aula 14h-18h.' },
    sex_campinas: { label: 'Sexta (Campinas, de carro)', sched: CAMP, wake: '06:00', bed: '22:00', note: 'Saída ~6h30, volta no Intercamp (13h15). Aula 14h30-18h.' },
    sab: { label: 'Sábado', sched: [['08:00', 'cafe'], ['12:30', 'almoco'], ['16:00', 'pre_aula'], ['18:30', 'pos_aula'], ['20:30', 'jantar']], wake: '07:30', bed: '23:00', note: 'Dia sem aula: mantenha a rotina ideal.' },
    dom: { label: 'Domingo', sched: [['08:00', 'cafe'], ['13:00', 'churrasco'], ['17:00', 'lanche_dom'], ['20:00', 'jantar_leve']], wake: '07:30', bed: '23:00', note: 'Pesagem em jejum ao acordar (descalço, antes de comer) e registre em Evolução. À noite, preparo da semana.' }
  };

  const DAYNAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const CAMP_DAYS = [2, 3, 5];
  const OUT_SWAP = { jantar: 'combo', pos_aula: 'pos_aula_leve', pos_aula_ovos: 'pos_aula_leve' };

  function dayTypeKey(wd, campinas) {
    if (wd === 1) return 'seg';
    if (wd === 2) return campinas ? 'ter_campinas' : 'ter_casa';
    if (wd === 3) return campinas ? 'qua_campinas' : 'qua_casa';
    if (wd === 4) return 'qui';
    if (wd === 5) return campinas ? 'sex_campinas' : 'sex_casa';
    if (wd === 6) return 'sab';
    return 'dom';
  }

  function dayPlan(key, out) {
    return DAYTYPES[key].sched.map(function (s) {
      const id = out && OUT_SWAP[s[1]] ? OUT_SWAP[s[1]] : s[1];
      return { time: s[0], meal: id };
    });
  }

  function itemQty(f, base, scale, override) {
    if (override != null && isFinite(override)) return +override;
    const F = FOODS[f];
    if (!F.carb || !scale || scale === 1) return base;
    let g = base * scale;
    if (F.u) { const step = F.u.g / 2; g = Math.round(g / step) * step; } else g = Math.round(g / 5) * 5;
    return g;
  }

  function resolve(mealId, variant, ctx) {
    ctx = ctx || {};
    const M = MEALS[mealId];
    const vv = M.v[variant] ? variant : 'A';
    return M.v[vv].items.map(function (it, i) {
      const key = mealId + '|' + vv + '|' + i;
      return { f: it[0], g: itemQty(it[0], it[1], ctx.scale, ctx.qty ? ctx.qty[key] : null), key: key, base: it[1] };
    });
  }

  function foodMacros(f, g) {
    const F = FOODS[f];
    return { k: F.k * g / 100, p: F.p * g / 100, c: F.c * g / 100, f: F.f * g / 100 };
  }

  function sumMacros(list) {
    const t = { k: 0, p: 0, c: 0, f: 0 };
    list.forEach(function (m) { t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; });
    return t;
  }

  function mealMacros(mealId, variant, ctx) {
    return sumMacros(resolve(mealId, variant, ctx).map(function (it) { return foodMacros(it.f, it.g); }));
  }

  function dayTotals(key, out, ctx) {
    ctx = ctx || {};
    const meals = dayPlan(key, out).map(function (s) {
      const variant = (ctx.pick && ctx.pick[s.meal]) || 'A';
      return { time: s.time, meal: s.meal, variant: variant, m: mealMacros(s.meal, variant, ctx) };
    });
    return { total: sumMacros(meals.map(function (x) { return x.m; })), meals: meals };
  }

  // Escala de carboidratos para atingir uma meta de calorias (referência: segunda, plano principal).
  function carbScaleFor(target) {
    const base = { scale: 1 };
    const total0 = dayTotals('seg', false, base).total.k;
    let carbK = 0;
    dayPlan('seg', false).forEach(function (s) {
      resolve(s.meal, 'A', base).forEach(function (it) { if (FOODS[it.f].carb) carbK += foodMacros(it.f, it.g).k; });
    });
    if (target == null || !isFinite(target)) return 1;
    const sc = 1 + (target - total0) / carbK;
    return Math.round(Math.min(1.6, Math.max(0.6, sc)) * 100) / 100;
  }
  function defaultTarget() { return Math.round(dayTotals('seg', false, { scale: 1 }).total.k / 50) * 50; }

  // ---- Termostato: sugere ajuste de calorias a partir da tendência do peso ----
  function dayNum(d) { return Date.parse(d + 'T12:00:00Z') / 864e5; }

  function trendKgPerWeek(weights, today) {
    const pts = (weights || []).filter(function (w) { return w.ref !== false && isFinite(w.peso) && w.d; })
      .map(function (w) { return { t: dayNum(w.d), y: +w.peso }; }).sort(function (a, b) { return a.t - b.t; });
    if (!pts.length) return null;
    const end = today ? dayNum(today) : pts[pts.length - 1].t;
    const win = pts.filter(function (p) { return p.t >= end - 28 && p.t <= end; });
    if (win.length < 3 || win[win.length - 1].t - win[0].t < 10) return null;
    const n = win.length;
    const mt = win.reduce(function (a, p) { return a + p.t; }, 0) / n;
    const my = win.reduce(function (a, p) { return a + p.y; }, 0) / n;
    let num = 0, den = 0;
    win.forEach(function (p) { num += (p.t - mt) * (p.y - my); den += (p.t - mt) * (p.t - mt); });
    return den === 0 ? null : (num / den) * 7;
  }

  const GOALS = {
    perder: { lo: -0.6, hi: -0.2, nome: 'perder gordura (-0,2 a -0,6 kg/semana)' },
    manter: { lo: -0.2, hi: 0.2, nome: 'manter o peso (±0,2 kg/semana)' },
    ganhar: { lo: 0.2, hi: 0.5, nome: 'ganhar massa (+0,2 a +0,5 kg/semana)' }
  };

  function suggest(settings, weights, today) {
    const g = GOALS[settings.goal] || GOALS.manter;
    const step = settings.step || 100, floor = settings.floor || 2400, ceiling = settings.ceiling || 3400;
    const target = settings.target;
    const slope = trendKgPerWeek(weights, today);
    if (slope == null) return { status: 'sem_dados', delta: 0, newTarget: target, slope: null, reason: 'Preciso de pelo menos 3 pesagens em jejum, espalhadas por 10 dias ou mais, para enxergar uma tendência.' };
    let delta = 0, reason = 'Tendência dentro do esperado: não mexa nas calorias.';
    if (slope < -1.0) { delta = step; reason = 'Você está perdendo mais de 1 kg por semana. Isso é rápido demais e pode custar força e energia.'; }
    else if (slope < g.lo) { delta = step; reason = 'Perda mais rápida que o planejado para o objetivo.'; }
    else if (slope > g.hi) { delta = -step; reason = 'Peso subindo/parado mais do que o objetivo pede.'; }
    const recent = (weights || []).filter(function (w) { return w.energia != null && isFinite(w.energia); }).sort(function (a, b) { return a.d < b.d ? -1 : 1; }).slice(-3);
    if (recent.length >= 2) {
      const avg = recent.reduce(function (a, w) { return a + +w.energia; }, 0) / recent.length;
      if (avg <= 2.3 && delta <= 0) { delta = step; reason = 'Energia baixa nas últimas pesagens: aumente um pouco antes de cortar mais.'; }
    }
    let nt = target + delta;
    nt = Math.min(ceiling, Math.max(floor, nt));
    const real = nt - target;
    if (real === 0 && delta !== 0) reason += ' (já está no limite ' + (delta < 0 ? 'mínimo' : 'máximo') + ' de segurança, então não há mudança).';
    return { status: real === 0 ? 'manter' : 'ajustar', delta: real, newTarget: nt, slope: slope, reason: reason };
  }

  // ---- Lista de compras (uma semana) ----
  function shopping(weekCamp, ctx) {
    const keys = [1, 2, 3, 4, 5, 6, 0].map(function (wd) { return dayTypeKey(wd, !!(weekCamp && weekCamp[wd])); });
    const tot = {};
    keys.forEach(function (k) {
      DAYTYPES[k].sched.forEach(function (s) {
        resolve(s[1], 'A', ctx).forEach(function (it) { tot[it.f] = (tot[it.f] || 0) + it.g; });
      });
    });
    const rows = [];
    const eggs = (tot.ovo_cozido || 0) + (tot.ovo_mexido || 0);
    if (eggs) rows.push({ id: 'ovos', name: 'Ovos', text: Math.ceil(eggs / 50) + ' ovos (≈ ' + Math.ceil(eggs / 50 / 12) + ' dúzia' + (Math.ceil(eggs / 50 / 12) > 1 ? 's' : '') + ')', cat: 'Proteínas', home: true });
    Object.keys(tot).forEach(function (f) {
      const F = FOODS[f];
      if (F.cat === 'Fora' || f === 'ovo_cozido' || f === 'ovo_mexido') return;
      let g = tot[f] * (F.raw || 1), text;
      if (F.u && F.u.g >= 60) { text = Math.ceil(g / F.u.g) + ' ' + (Math.ceil(g / F.u.g) === 1 ? F.u.nm : F.u.pl); }
      else if (f === 'pao_integral') { const sl = Math.ceil(g / 25); text = sl + ' fatias (≈ ' + Math.ceil(sl / 20) + ' pacote' + (sl > 20 ? 's' : '') + ')'; }
      else if (f === 'whey') { text = Math.ceil(g / 30) + ' doses'; }
      else if (F.u && f !== 'azeite') { text = Math.round(g) + ' g (≈ ' + Math.ceil(g / F.u.g) + ' ' + F.u.pl + ')'; }
      else { text = g >= 1000 ? (Math.round(g / 100) / 10).toString().replace('.', ',') + ' kg' : Math.round(g / 10) * 10 + ' g'; }
      rows.push({ id: f, name: F.n.replace(/ \(.*\)$/, '').replace(' cozido/grelhado', '').replace(' cozida', '').replace(' cozido', '').replace(' refogado', '').replace(' ralada', ''), text: text, cat: F.cat, home: !!F.home, rawG: g });
    });
    return rows;
  }

  function fmtQty(f, g) {
    const F = FOODS[f];
    const gs = (Math.round(g * 10) / 10).toString().replace('.', ',') + ' g';
    if (F.u) { const n = Math.round(g / F.u.g * 2) / 2; return n.toString().replace('.', ',') + ' ' + (n === 1 ? F.u.nm : F.u.pl) + ' (' + gs + ')'; }
    return gs;
  }

  function prepFor(key, out) {
    const tasks = [];
    dayPlan(key, out).forEach(function (s) {
      const p = MEALS[s.meal].v.A.prep;
      if (p && tasks.indexOf(p) < 0) tasks.push(p);
    });
    return tasks;
  }

  return { FOODS: FOODS, MEALS: MEALS, RECIPES: RECIPES, DAYTYPES: DAYTYPES, DAYNAMES: DAYNAMES, CAMP_DAYS: CAMP_DAYS, GOALS: GOALS,
    dayTypeKey: dayTypeKey, dayPlan: dayPlan, resolve: resolve, itemQty: itemQty, foodMacros: foodMacros, mealMacros: mealMacros,
    dayTotals: dayTotals, carbScaleFor: carbScaleFor, defaultTarget: defaultTarget, trendKgPerWeek: trendKgPerWeek, suggest: suggest,
    shopping: shopping, fmtQty: fmtQty, prepFor: prepFor };
});
