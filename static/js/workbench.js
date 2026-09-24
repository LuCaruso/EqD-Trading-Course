/* Workbench — gaveta lateral com mini planilha e bloco de notas por lição */
(function (global) {
  'use strict';
  const { h, esc, toast } = UI;
  const ROWS0 = 16;
  let ctx = 'geral', ctxTitle = 'Bancada geral', open = false, tab = 0, sel = 'A1', dom = null, noteTimer = null;

  const extra = {};
  function rowsFor(cells) { let m = ROWS0 + (extra[ctx] || 0); Object.keys(cells).forEach(k => { const p = Sheet.refParts(k); if (p && cells[k] !== '') m = Math.max(m, p.r + 2); }); return Math.min(m, 200); }
  function cells() { return Store.work(ctx).sheet || {}; }
  const NCOLS = 6;

  function build() {
    dom = h(`<aside id="wb" class="wb">
      <div class="wb-head">
        <div class="wb-ctx"><span class="mono muted" style="font-size:10.5px;letter-spacing:.1em">BANCADA</span><b class="wb-title"></b></div>
        <button class="btn sm ghost wb-x" title="Fechar (Esc)">✕</button>
      </div>
      <div class="tabs wb-tabs"><button data-t="0">Planilha</button><button data-t="1">Notas</button><button data-t="2">Funções</button></div>
      <div class="wb-body"></div>
    </aside>`);
    document.body.appendChild(dom);
    const fab = h(`<div class="wb-fab"><button data-t="0" title="Planilha (Alt+P)"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M3 14h18M9 4v16M15 4v16" stroke="currentColor" stroke-width="1.6"/></svg><span>Planilha</span></button><button data-t="1" title="Notas (Alt+N)"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11h8M8 15h8M8 7h5" stroke="currentColor" stroke-width="1.6"/></svg><span>Notas</span></button></div>`);
    document.body.appendChild(fab);
    fab.querySelectorAll('button').forEach(b => b.onclick = () => toggle(+b.dataset.t));
    dom.querySelector('.wb-x').onclick = () => close();
    dom.querySelectorAll('.wb-tabs button').forEach(b => b.onclick = () => { tab = +b.dataset.t; render(); });
    document.addEventListener('keydown', e => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); toggle(0); }
      if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); toggle(1); }
      if (e.key === 'Escape' && open && !document.querySelector('.finfo-pop')) close();
    });
  }
  function toggle(t) { if (open && tab === t) return close(); tab = t; openWb(); }
  function openWb() { open = true; document.body.classList.add('wb-open'); render(); Sound.play('whoosh'); }
  function close() { open = false; document.body.classList.remove('wb-open'); }

  function updFab() {
    const w = Store.s.work && Store.s.work[ctx];
    document.querySelectorAll('.wb-fab button').forEach((b, i) => b.classList.toggle('has', !!(w && (i === 0 ? Object.values(w.sheet || {}).some(v => v !== '') : (w.notes || '').trim()))));
  }
  function setContext(key, title) {
    const changed = ctx !== (key || 'geral');
    ctx = key || 'geral'; ctxTitle = title || 'Bancada geral';
    if (!dom) build();
    updFab();
    if (open && changed) render(); else if (dom) dom.querySelector('.wb-title').textContent = ctxTitle;
  }

  function render() {
    if (!dom) build();
    dom.querySelector('.wb-title').textContent = ctxTitle;
    dom.querySelectorAll('.wb-tabs button').forEach((b, i) => b.classList.toggle('on', i === tab));
    const body = dom.querySelector('.wb-body');
    if (tab === 0) renderSheet(body); else if (tab === 1) renderNotes(body); else renderHelp(body);
  }

  /* ---------------- planilha ---------------- */
  function renderSheet(body) {
    const cs = cells(), nr = rowsFor(cs);
    body.innerHTML = `<div class="sh-bar"><span class="sh-ref mono">${sel}</span><input class="sh-f" spellcheck="false" placeholder="valor ou =fórmula  (ex.: =BS_CALL(B1;B2;B3;B4;B5;0))"></div>
      <div class="sh-wrap"><table class="sh"><thead><tr><th></th>${Sheet.COLS.slice(0, NCOLS).split('').map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: nr }, (_, r) => `<tr><th>${r + 1}</th>${Sheet.COLS.slice(0, NCOLS).split('').map(c => `<td><input data-r="${c}${r + 1}" spellcheck="false"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:8px;gap:6px"><button class="btn sm sh-add">+ 10 linhas</button><button class="btn sm sh-clear">Limpar</button><span class="spacer"></span><span class="muted mono" style="font-size:11px">Enter ↓ · Tab → · separador ;</span></div>
      <p class="muted" style="font-size:12px;margin:8px 0 0">Dica: use o botão <b class="finfo-mini">i</b> das fórmulas da lição e clique em <b>"Montar na planilha"</b> para trazer a conta pronta.</p>`;
    const inputs = [...body.querySelectorAll('.sh input[data-r]')], fbar = body.querySelector('.sh-f');
    const byRef = {}; inputs.forEach(i => byRef[i.dataset.r] = i);
    function refresh() {
      const cs2 = cells(), vals = Sheet.evaluate(cs2);
      inputs.forEach(inp => {
        const r = inp.dataset.r; if (document.activeElement === inp) return;
        const raw = cs2[r];
        if (raw == null || raw === '') { inp.value = ''; inp.className = ''; return; }
        const d = Sheet.display(vals[r]);
        if (/%\s*$/.test(String(raw)) && typeof vals[r] === 'number') d.t = Q.fmt(vals[r] * 100, Math.abs(vals[r]) < 0.1 ? 2 : 1) + '%';
        inp.value = d.t; inp.className = (d.err ? 'err' : d.num ? 'num' : 'txt') + (String(raw).trim()[0] === '=' ? ' f' : '');
        inp.title = String(raw);
      });
    }
    function commit(ref, raw) {
      const cs2 = Object.assign({}, cells());
      if (raw === '' || raw == null) delete cs2[ref]; else cs2[ref] = raw;
      const usedFormula = /^=/.test(String(raw || '').trim());
      Store.saveSheet(ctx, cs2, usedFormula);
      refresh(); updFab();
    }
    function select(ref) { sel = ref; body.querySelector('.sh-ref').textContent = ref; fbar.value = cells()[ref] || ''; inputs.forEach(i => i.parentElement.classList.toggle('sel', i.dataset.r === ref)); }
    function move(ref, dc, dr) { const p = Sheet.refParts(ref); const c = Math.max(0, Math.min(NCOLS - 1, p.c + dc)), r = Math.max(1, Math.min(inputs.length / NCOLS, p.r + dr)); const t = byRef[Sheet.refName(c, r)]; if (t) t.focus(); }
    inputs.forEach(inp => {
      inp.addEventListener('focus', () => { select(inp.dataset.r); inp.value = cells()[inp.dataset.r] || ''; inp.className = 'editing'; });
      inp.addEventListener('input', () => { fbar.value = inp.value; });
      inp.addEventListener('blur', () => { const r = inp.dataset.r, v = inp.value; if ((cells()[r] || '') !== v) commit(r, v); else refresh(); });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); move(inp.dataset.r, 0, e.shiftKey ? -1 : 1); }
        else if (e.key === 'Tab') { e.preventDefault(); inp.blur(); move(inp.dataset.r, e.shiftKey ? -1 : 1, 0); }
        else if (e.key === 'ArrowDown' && inp.value[0] !== '=') { e.preventDefault(); inp.blur(); move(inp.dataset.r, 0, 1); }
        else if (e.key === 'ArrowUp' && inp.value[0] !== '=') { e.preventDefault(); inp.blur(); move(inp.dataset.r, 0, -1); }
        else if (e.key === 'Escape') { e.stopPropagation(); inp.value = cells()[inp.dataset.r] || ''; inp.blur(); }
      });
    });
    fbar.addEventListener('keydown', e => { if (e.key === 'Enter') { commit(sel, fbar.value); move(sel, 0, 1); } });
    body.querySelector('.sh-add').onclick = () => { extra[ctx] = (extra[ctx] || 0) + 10; render(); };
    let armed = false;
    body.querySelector('.sh-clear').onclick = e => { if (!armed) { armed = true; e.target.textContent = 'Confirmar limpeza'; return; } Store.saveSheet(ctx, {}); render(); };
    refresh(); select(sel);
  }

  // Insere um modelo [{k,label,v|f}] nas colunas A:B, abaixo do conteúdo existente
  function insertTemplate(title, rows) {
    const cs2 = Object.assign({}, cells());
    let start = 1; Object.keys(cs2).forEach(k => { const p = Sheet.refParts(k); if (p && cs2[k] !== '') start = Math.max(start, p.r + 2); });
    if (start > 1) start++;
    const map = {}; let r = start + 1;
    rows.forEach(x => { map[x.k] = 'B' + r; r++; });
    cs2['A' + start] = '▸ ' + title;
    r = start + 1;
    rows.forEach(x => {
      cs2['A' + r] = x.label;
      let v = x.f != null ? x.f : x.v;
      v = String(v).replace(/\{(\w+)\}/g, (_, k) => map[k] || '#REF');
      cs2['B' + r] = v;
      if (x.note) cs2['C' + r] = x.note;
      r++;
    });
    Store.saveSheet(ctx, cs2, true);
    tab = 0; openWb(); sel = 'B' + (start + 1); render();
    toast(`Modelo <b>${esc(title)}</b> montado na planilha. Troque os valores em azul e veja o resultado.`);
  }

  /* ---------------- notas ---------------- */
  function renderNotes(body) {
    const w = Store.work(ctx);
    body.innerHTML = `<textarea class="nt-area" placeholder="Suas anotações desta ${ctx === 'geral' ? 'bancada' : 'lição'}… (salvam sozinhas)\n\nIdeias: resumo com suas palavras, dúvidas, pegadinhas, fórmulas que quer decorar, exemplos de mesa."></textarea>
      <div class="row" style="margin-top:6px"><span class="muted mono nt-st" style="font-size:11px"></span><span class="spacer"></span><button class="btn sm nt-ts">Inserir data/hora</button><a class="btn sm" href="#/notebook">Abrir caderno →</a></div>`;
    const ta = body.querySelector('.nt-area'), st = body.querySelector('.nt-st');
    ta.value = w.notes || '';
    const upd = () => { st.textContent = (ta.value.length ? ta.value.length + ' caracteres · ' : '') + (w.updated ? 'salvo ' + new Date(w.updated).toLocaleString('pt-BR') : 'vazio'); };
    upd();
    ta.addEventListener('input', () => { clearTimeout(noteTimer); st.textContent = 'digitando…'; noteTimer = setTimeout(() => { Store.saveNotes(ctx, ta.value); upd(); updFab(); }, 600); });
    body.querySelector('.nt-ts').onclick = () => { const s = `\n— ${new Date().toLocaleString('pt-BR')} —\n`; const p = ta.selectionStart; ta.value = ta.value.slice(0, p) + s + ta.value.slice(p); ta.dispatchEvent(new Event('input')); ta.focus(); };
    setTimeout(() => ta.focus(), 50);
  }

  function renderHelp(body) {
    body.innerHTML = `<p class="muted" style="font-size:13px">Comece com <code>=</code>. Decimal com vírgula ou ponto; separe argumentos com <code>;</code>. Porcentagem: <code>25%</code> = 0,25. Intervalos: <code>A1:A5</code>.</p>
      <table class="tbl">${Sheet.FN_HELP.map(r => `<tr><td class="mono" style="font-size:12px;color:var(--c6)">${esc(r[0])}</td><td style="font-size:12.5px">${esc(r[1])}</td></tr>`).join('')}</table>
      <p class="muted" style="font-size:12.5px">Exemplo (convenção Brasil): em B4 <code>=CONTINUA(B3)</code> converte a taxa DI de B3 em contínua; em B7 <code>=BS_CALL(B1;B2;B5/252;B4;B6;0)</code>.</p>`;
  }

  /* ---------------- página Caderno ---------------- */
  function viewNotebook(V) {
    const all = Object.entries(Store.s.work || {}).filter(([k, w]) => (w.notes || '').trim());
    const byTrack = { br: [], us: [], geral: [] };
    all.forEach(([k, w]) => { const L = Course.lessons[k]; if (L) byTrack[Course.units[L.unit].track].push([k, w, L]); else byTrack.geral.push([k, w, null]); });
    V.innerHTML = `<h1>Caderno</h1><p class="sub">Todas as suas anotações, lição por lição. ${all.length} lição(ões) com notas.</p>
      <div class="row" style="margin-bottom:12px"><input type="text" id="nbq" placeholder="buscar nas notas…" style="max-width:360px"><button class="btn sm" id="nbx">Exportar tudo (.md)</button></div><div id="nbl"></div>`;
    const draw = q => {
      q = (q || '').toLowerCase();
      const sec = (title, arr) => { const f = arr.filter(([k, w, L]) => !q || (w.notes + (L ? L.title : '')).toLowerCase().includes(q)); if (!f.length) return ''; return `<h2>${title}</h2>` + f.sort((a, b) => (a[2] ? a[2].id : '').localeCompare(b[2] ? b[2].id : '', 'pt', { numeric: true })).map(([k, w, L]) => `<div class="card" style="margin-bottom:10px"><div class="row"><b>${L ? `<a href="#/lesson/${k}">${esc(L.title)}</a>` : 'Bancada geral'}</b><span class="spacer"></span><span class="muted mono" style="font-size:11px">${w.updated ? new Date(w.updated).toLocaleString('pt-BR') : ''}</span></div><div class="nb-txt">${esc(w.notes)}</div></div>`).join(''); };
      document.getElementById('nbl').innerHTML = (sec('Módulo Brasil', byTrack.br) + sec('Módulo US', byTrack.us) + sec('Geral', byTrack.geral)) || '<div class="card"><p class="muted">Nenhuma anotação ainda. Abra uma lição e clique em <b>Notas</b> no canto direito da tela.</p></div>';
    };
    document.getElementById('nbq').oninput = e => draw(e.target.value); draw('');
    document.getElementById('nbx').onclick = () => {
      const md = '# Caderno — EqD Trading Academy\n\n' + all.map(([k, w]) => { const L = Course.lessons[k]; return `## ${L ? L.title : 'Bancada geral'}\n\n${w.notes}\n`; }).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' })); a.download = 'caderno-eqd.md'; a.click();
    };
  }

  global.Workbench = { setContext, insertTemplate, open: t => { tab = t || 0; openWb(); }, close, viewNotebook, get ctx() { return ctx; } };
})(window);
