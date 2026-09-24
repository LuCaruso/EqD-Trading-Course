/* UI — helpers de DOM, toasts, modal, matemática e o componente de exercício */
(function (global) {
  'use strict';
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function math(el) {
    if (!el || !global.renderMathInElement) return;
    try {
      renderMathInElement(el, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false, ignoredClasses: ['nomath'] });
    } catch (e) { console.warn(e); }
  }

  function toast(html, cls, ms) {
    const el = h(`<div class="toast ${cls || ''}">${html}</div>`);
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(() => el.remove(), 400); }, ms || 3200);
  }

  function modal(html, buttons) {
    const m = document.getElementById('modal');
    m.innerHTML = '';
    const card = h(`<div class="card">${html}<div class="row" style="justify-content:center;margin-top:20px"></div></div>`);
    const row = card.querySelector('.row');
    (buttons || [{ label: 'Fechar', pri: true }]).forEach(b => {
      const bt = h(`<button class="btn ${b.pri ? 'pri' : ''}">${b.label}</button>`);
      bt.onclick = () => { m.classList.add('hidden'); if (b.go) location.hash = b.go; if (b.fn) b.fn(); };
      row.appendChild(bt);
    });
    m.appendChild(card); m.classList.remove('hidden'); math(card);
  }

  function ring(frac, label, size) {
    size = size || 92; const r = size / 2 - 7, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--line)" stroke-width="7" fill="none"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${f >= 1 ? 'var(--up)' : 'var(--c1)'}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}"/></svg><div class="c">${label}</div></div>`;
  }

  /* ---------------- Exercícios ---------------- */
  function instantiate(def, seed) {
    let inst;
    if (def.gen) {
      const R = makeR(seed);
      inst = Object.assign({ t: 'num' }, def, def.gen(R));
    } else inst = Object.assign({}, def);
    if (inst.t === 'tf') { inst.o = ['Verdadeiro', 'Falso']; inst.a = inst.a ? 0 : 1; inst.t = 'mcq'; inst.noShuffle = true; }
    if (inst.t === 'mcq' && !inst.noShuffle) {
      const R = makeR(seed * 7 + 3);
      const idx = R.shuffle(inst.o.map((_, i) => i));
      inst.o = idx.map(i => def.gen ? inst.o[i] : def.o[i]);
      inst.a = idx.indexOf(inst.a);
    }
    return inst;
  }

  function checkNum(inst, raw) {
    const cands = Q.parseNumCandidates(raw);
    if (!cands.length) return { valid: false };
    const a = inst.a, tol = inst.tol == null ? 0.01 : inst.tol, abs = inst.tolAbs == null ? 0 : inst.tolAbs;
    const lim = Math.max(abs, Math.abs(a) * tol, 1e-9);
    const v = cands.find(x => Math.abs(x - a) <= lim);
    return { valid: true, ok: v != null, v: v == null ? cands[0] : v };
  }

  function fmtAns(inst) {
    const d = inst.dec == null ? (Math.abs(inst.a) >= 100 ? 2 : Math.abs(inst.a) >= 1 ? 3 : 4) : inst.dec;
    return (inst.pre || '') + Q.fmt(inst.a, d) + (inst.unit ? ' ' + inst.unit : '');
  }

  /* renderExercise(container, def, key, {mode:'practice'|'exam', seed, n, tagDefault, onResult}) */
  function renderExercise(container, def, key, opts) {
    opts = opts || {};
    let seed = opts.seed || (Math.floor(Math.random() * 1e9) + 1);
    const wrap = h(`<div class="ex"></div>`);
    container.appendChild(wrap);
    let inst, answered = false, selected = null, api = {}, tries = 0;
    const tag = def.tag || opts.tagDefault || 'geral';
    const isNum = () => inst.t === 'num';

    function draw() {
      inst = instantiate(def, seed); answered = false; selected = null; tries = 0;
      const rec = Store.s.ex[key];
      wrap.className = 'ex' + (opts.mode !== 'exam' && rec && rec.ok ? ' solved' : '');
      wrap.innerHTML = `<div class="h"><span>${opts.n != null ? 'Q' + opts.n : 'Exercício'}</span><span class="tag">${esc(tag)}</span>${def.gen ? '<span class="tag" title="parâmetros aleatórios">aleatório</span>' : ''}${opts.mode !== 'exam' && rec && rec.ok ? '<span class="tag" style="color:var(--up)">resolvido</span>' : ''}</div>
        <div class="q">${inst.q}</div><div class="ans"></div><div class="fbw"></div>`;
      const ans = wrap.querySelector('.ans');
      if (inst.t === 'mcq') {
        const box = h(`<div class="opts"></div>`);
        inst.o.forEach((o, i) => {
          const b = h(`<button class="opt">${String.fromCharCode(65 + i)}) ${o}</button>`);
          b.onclick = () => {
            if (answered && opts.mode !== 'exam') return;
            selected = i; box.querySelectorAll('.opt').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
            if (opts.mode !== 'exam') grade();
            else if (opts.onChange) opts.onChange();
          };
          box.appendChild(b);
        });
        ans.appendChild(box);
      } else {
        const row = h(`<div class="row"><input class="num" type="text" inputmode="decimal" placeholder="${inst.ph || 'sua resposta'}">${inst.unit ? `<span class="muted mono">${inst.unit}</span>` : ''}${opts.mode !== 'exam' ? '<button class="btn pri sm chk">Corrigir</button>' : ''}</div>`);
        ans.appendChild(row);
        const inp = row.querySelector('input');
        inp.addEventListener('keydown', e => { if (e.key === 'Enter' && opts.mode !== 'exam') grade(); });
        inp.addEventListener('input', () => { if (opts.onChange) opts.onChange(); });
        const chk = row.querySelector('.chk'); if (chk) chk.onclick = grade;
        if (inst.hint) ans.appendChild(h(`<div class="muted" style="font-size:12.5px;margin-top:6px">${inst.hint}</div>`));
      }
      math(wrap);
    }

    function feedback(ok, extra) {
      const fb = wrap.querySelector('.fbw');
      const ansTxt = isNum() ? `Resposta: <b class="mono">${fmtAns(inst)}</b>. ` : '';
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Correto!' : 'Não foi dessa vez.'}</b> ${extra || ''}${(ok || !isNum()) ? '<br>' + ansTxt + (inst.e || '') : ''}
        <div class="row" style="margin-top:10px">${!ok && isNum() ? '<button class="btn sm again">Tentar de novo</button><button class="btn sm ghost show">Ver solução</button>' : ''}${def.gen ? '<button class="btn sm newv">Nova variação ↻</button>' : ''}</div></div>`;
      const again = fb.querySelector('.again'); if (again) again.onclick = () => { answered = false; fb.innerHTML = ''; wrap.querySelector('input').focus(); };
      const show = fb.querySelector('.show'); if (show) show.onclick = () => { fb.querySelector('.fb').insertAdjacentHTML('beforeend', `<div style="margin-top:8px">${ansTxt}${inst.e || ''}</div>`); show.remove(); math(fb); };
      const nv = fb.querySelector('.newv'); if (nv) nv.onclick = () => { seed = seed * 31 + 17; draw(); };
      math(fb);
    }

    function grade() {
      if (answered) return;
      let ok;
      if (inst.t === 'mcq') {
        if (selected == null) return;
        ok = selected === inst.a;
        wrap.querySelectorAll('.opt').forEach((b, i) => { if (i === inst.a) b.classList.add('ok'); else if (i === selected) b.classList.add('bad'); });
      } else {
        const r = checkNum(inst, wrap.querySelector('input').value);
        if (!r.valid) { toast('Digite um número (use vírgula ou ponto como decimal).'); return; }
        ok = r.ok;
      }
      answered = true; tries++;
      const res = Store.exerciseResult(key, ok, isNum(), tag, tries === 1);
      const extra = res.xp ? `<span class="up mono">+${res.xp} XP</span>${res.mult > 1 ? ` <span class="combo-tag">COMBO x${res.combo} · ${String(res.mult).replace('.', ',')}×</span>` : ''}${res.crit ? ' <span class="crit-tag">CRÍTICO 2×</span>' : ''}` : '';
      feedback(ok, extra);
      answerFX(wrap, ok, res);
      if (ok) wrap.classList.add('solved');
      if (opts.onResult) opts.onResult(ok);
    }

    // API para modo prova
    api.answer = () => {
      if (inst.t === 'mcq') return selected;
      const v = wrap.querySelector('input').value; return v.trim() === '' ? null : v;
    };
    api.isAnswered = () => api.answer() != null;
    api.gradeExam = () => {
      let ok = false;
      if (inst.t === 'mcq') { ok = selected === inst.a; wrap.querySelectorAll('.opt').forEach((b, i) => { b.disabled = true; if (i === inst.a) b.classList.add('ok'); else if (i === selected) b.classList.add('bad'); }); }
      else { const r = checkNum(inst, wrap.querySelector('input').value); ok = !!r.ok; wrap.querySelector('input').disabled = true; }
      answered = true;
      const fb = wrap.querySelector('.fbw');
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Correto' : 'Errado'}</b>${isNum() ? ` — resposta: <b class="mono">${fmtAns(inst)}</b>` : ''}<br>${inst.e || ''}</div>`;
      math(fb);
      Store.recordAttempt('exam', key, tag, ok);
      return ok;
    };
    draw();
    return api;
  }

  // efeitos de acerto/erro (usado por exercícios e missões)
  function answerFX(el, ok, res) {
    res = res || {};
    if (ok) {
      const btn = el.querySelector('.opt.ok') || el.querySelector('.chk') || el;
      FX.fromEl(btn, res.crit ? 90 : 28 + Math.min(res.combo || 0, 10) * 4, res.crit ? { colors: ['#ffd166', '#f5a623', '#fff3c4'], speed: 10 } : {});
      if (res.xp) FX.floatFromEl(btn, `+${res.xp} XP${res.crit ? ' <b>CRIT!</b>' : ''}`, res.crit ? 'crit' : '');
      FX.pulse(el, 'fx-glow');
      Sound.play(res.crit ? 'crit' : 'ok', res.combo);
      if (res.crit) FX.flash('rgba(255,209,102,.14)');
    } else {
      FX.shake(el); Sound.play('bad'); FX.flash('rgba(255,92,92,.08)');
    }
  }

  global.UI = { answerFX, h, esc, math, toast, modal, ring, renderExercise, instantiate, checkNum };
})(window);
