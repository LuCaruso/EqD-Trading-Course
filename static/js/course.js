/* Registro do curso. Os arquivos em /content chamam Course.unit(...) etc. */
(function (global) {
  'use strict';
  const Course = {
    tracks: [
      { id: 'br', title: 'Módulo Brasil', short: 'Brasil', desc: 'Do absoluto zero ao avançado com o mercado brasileiro: B3, DI, opções de ações e índice, gregas, estruturas, exóticas, juros e câmbio, COE, risco, margem e IR.', units: [] },
      { id: 'us', title: 'Módulo US', short: 'US', desc: 'Mercado americano e vol trading avançado: SPX/SPY, opções americanas, superfície de vol, variance swaps, VIX, dispersão, autocallables, market making e risco de livro.', units: [], requires: { unit: 'br4', text: 'Passe na prova da Unidade 4 do Módulo Brasil (Gregas) para liberar.' } }
    ],
    units: {}, lessons: {}, missions: {}, glossary: [],
    unit(trackId, u) {
      const t = this.tracks.find(x => x.id === trackId);
      u.track = trackId; u.index = t.units.length;
      u.lessons.forEach((l, i) => { l.unit = u.id; l.index = i; l.ex = l.ex || []; l.cards = l.cards || []; this.lessons[l.id] = l; });
      u.exam = Object.assign({ n: 10, minutes: 20, pass: 0.7 }, u.exam || {});
      t.units.push(u); this.units[u.id] = u;
    },
    // insere uma lição numa unidade já registrada (após a lição `after`, ou no fim)
    addLesson(uid, l, after) {
      const u = this.units[uid]; if (!u) throw new Error('unidade ' + uid);
      const i = after ? u.lessons.findIndex(x => x.id === after) + 1 : u.lessons.length;
      u.lessons.splice(i > 0 ? i : u.lessons.length, 0, l);
      l.unit = uid; l.ex = l.ex || []; l.cards = l.cards || []; this.lessons[l.id] = l;
      u.lessons.forEach((x, j) => { x.index = j; });
    },
    mission(m) { this.missions[m.id] = m; },
    glos(list) { this.glossary.push(...list); },
    track(id) { return this.tracks.find(t => t.id === id); },
    allLessons() { return this.tracks.flatMap(t => t.units.flatMap(u => u.lessons)); }
  };

  // Gerador de parâmetros aleatórios para exercícios (semente reprodutível)
  function makeR(seed) {
    const u = Q.rng(seed);
    const R = {
      u, n: () => u.normal(),
      f: (a, b, dec) => { const v = a + (b - a) * u(); const m = Math.pow(10, dec == null ? 2 : dec); return Math.round(v * m) / m; },
      int: (a, b) => a + Math.floor(u() * (b - a + 1)),
      step: (a, b, st) => a + st * Math.floor(u() * (Math.round((b - a) / st) + 1)),
      pick: arr => arr[Math.floor(u() * arr.length)],
      sign: () => (u() < 0.5 ? -1 : 1),
      shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    };
    return R;
  }
  // helpers de formatação para textos de exercícios
  const F = {
    n: (x, d) => Q.fmt(x, d == null ? 2 : d),
    p: (x, d) => Q.fmt(x * 100, d == null ? 1 : d) + '%',
    r: (x, d) => 'R$ ' + Q.fmt(x, d == null ? 2 : d),
    u: (x, d) => 'US$ ' + Q.fmt(x, d == null ? 2 : d)
  };
  global.Course = Course; global.makeR = makeR; global.F = F;
})(window);

/* Referências bibliográficas: cada referência vira um link que abre o PDF da pasta Books
   direto na página do capítulo/seção (mapa em books.js). c pode ser 18 (capítulo) ou '18.4' (seção). */
(function () {
  const mk = key => (c, t) => {
    const B = (window.BOOKS || {})[key] || { short: key, pages: {} };
    const cs = String(c), ch = String(parseInt(cs, 10)), ap = /ap$/.test(cs);
    const pg = B.pages[cs] || B.pages[ch] || '';
    const sec = ap ? ' (apêndice)' : cs.includes('.') ? ` §${cs}` : '';
    return `<a class="bref" data-book="${key}" data-ch="${ch}" data-sec="${ap ? '' : cs.includes('.') ? cs : ''}" data-page="${pg}" href="/books/${key}${pg ? '#page=' + pg : ''}" target="_blank" rel="noopener" title="${pg ? 'Abrir o PDF na página ' + pg : 'Abrir o PDF'}">${B.short.replace(/&(?!amp;)/g, '&amp;')}, cap. ${ch}${sec}${t ? ' — ' + t : ''}</a>`;
  };
  window.REF = {
    hull: mk('hull'), wil: mk('wil'), der: mk('der'), mfd: mk('mfd'), ek: mk('ek'), ff: mk('ff'),
    cqf: (m, t) => { const B = (window.BOOKS || {}).cqf || { modules: {} }; return `<a class="bref" data-book="cqf" data-ch="${m}" data-sec="" data-page="" href="/books/cqf" target="_blank" rel="noopener" title="Módulo do CQF — se você colocar o material do CQF (PDF com &quot;CQF&quot; no nome) na pasta Books, o link abre o arquivo">CQF, Módulo ${m} (${B.modules[m] || ''})${t ? ' — ' + t : ''}</a>`; },
    car: t => `<a class="bref" data-book="car" href="/books/car" target="_blank" rel="noopener" title="Livro não está na pasta Books — o link funciona se você adicioná-lo">Carreira &amp; Brostowicz, <i>Brazilian Derivatives and Securities</i> — ${t}</a>`
  };
})();
