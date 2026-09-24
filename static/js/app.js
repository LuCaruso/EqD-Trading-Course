/* App — roteador e telas */
(function () {
  'use strict';
  const { h, esc, math, toast, modal, ring, renderExercise } = UI;
  const V = () => document.getElementById('view');
  const S = () => Store.s;

  /* ---------------- topo e navegação ---------------- */
  let lastXP = null;
  const FLAME = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" fill="currentColor"/></svg>';
  const STAR = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" fill="currentColor"/></svg>';
  function renderTop() {
    const L = Store.levelInfo(), s = S(), t = Store.today(), dx = s.daily[t] || 0, goal = s.settings.goal, due = Store.dueCards().length;
    const qs = Store.ensureQuests(), qd = qs.list.filter(x => x.done).length, stars = Store.totalStars(), ses = Store.session;
    const gf = Math.min(1, dx / goal), C = 2 * Math.PI * 7;
    document.getElementById('top').innerHTML = `
      <div class="lvl"><div class="lvl-badge">${L.idx + 1}</div><div><div class="lvl-name">${L.name}</div><div class="xpbar ${L.frac > 0.85 && L.next ? 'near' : ''}" title="${s.xp} XP${L.next ? ' · próximo nível em ' + L.next : ''}"><i style="width:${L.frac * 100}%"></i></div></div><span class="xpnum mono"><b id="topxp">${Q.fmt(lastXP == null ? s.xp : lastXP, 0)}</b> XP</span></div>
      <span class="chip ${Store.streakAlive() ? 'hot' : ''}" title="dias seguidos estudando">${FLAME} ${Store.streakAlive()}d</span>
      <span class="chip ${dx >= goal ? 'good' : ''}" title="meta diária de XP"><svg width="18" height="18" viewBox="0 0 18 18" style="transform:rotate(-90deg)"><circle cx="9" cy="9" r="7" stroke="var(--line)" stroke-width="3" fill="none"/><circle cx="9" cy="9" r="7" stroke="${gf >= 1 ? 'var(--up)' : 'var(--c1)'}" stroke-width="3" fill="none" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - gf)}" stroke-linecap="round"/></svg> ${Math.min(dx, goal)}/${goal}</span>
      <a class="chip opt-chip ${qd === 3 ? 'good' : ''}" href="#/" title="quests diárias">Quests ${qd}/3</a>
      <span class="chip gold" title="estrelas (acertos de primeira)">${STAR} ${stars}</span>
      <span class="chip combo-chip ${ses.combo >= 3 ? 'on' : ''}" id="topcombo" title="acertos seguidos nesta sessão">${FLAME} x${ses.combo}</span>
      ${due ? `<a class="chip opt-chip" href="#/review" title="flashcards para revisar hoje">${due} cards</a>` : ''}
      <span class="spacer"></span>
      <span class="chip opt-chip mono muted" title="XP ganho nesta sessão">sessão +${Q.fmt(ses.xp, 0)}</span>
      <button class="chip snd" title="som liga/desliga">${s.settings.sound === false ? '🔇' : '🔊'}</button>
      <a class="chip" href="#/settings">⚙</a>`;
    document.querySelector('#top .snd').onclick = () => { s.settings.sound = s.settings.sound === false; Store.save(); renderTop(); Sound.play('click'); };
    if (lastXP != null && lastXP !== s.xp) { FX.countUp(document.getElementById('topxp'), lastXP, s.xp, 700); FX.pulse(document.querySelector('#top .lvl'), 'fx-pop'); }
    lastXP = s.xp;
  }
  function renderNav(route) {
    const due = Store.dueCards().length;
    const items = [
      ['sec', 'Estudo'], ['#/', 'Painel', 'dash'], ['#/track/br', 'Módulo Brasil', 'br'], ['#/track/us', 'Módulo US', 'us'], ['#/missions', 'Missões "Dia na mesa"', 'missions'],
      ['sec', 'Prática'], ['#/desk', 'Mesa: Head Trader', 'desk'], ['#/sims', 'Simuladores', 'sims'], ['#/review', 'Revisão & treino', 'review', due], ['#/glossary', 'Glossário de mesa', 'glossary'], ['#/library', 'Biblioteca (livros)', 'library'], ['#/notebook', 'Caderno de notas', 'notebook'],
      ['sec', 'Você'], ['#/badges', 'Conquistas', 'badges'], ['#/settings', 'Configurações', 'settings']
    ];
    document.getElementById('nav').innerHTML = items.map(it => it[0] === 'sec' ? `<div class="sec">${it[1]}</div>` : `<a href="${it[0]}" class="${route === it[2] ? 'on' : ''}">${it[1]}${it[3] ? `<span class="badge">${it[3]}</span>` : ''}</a>`).join('');
  }

  /* ---------------- helpers de curso ---------------- */
  function nextLesson() {
    for (const t of Course.tracks) {
      if (!Store.trackUnlocked(t.id)) continue;
      for (const u of t.units) {
        if (!Store.unitUnlocked(u.id)) continue;
        const l = u.lessons.find(x => !Store.lessonDone(x.id));
        if (l) return { kind: 'lesson', l, u };
        if (!Store.examPassed(u.id)) return { kind: 'exam', u };
      }
    }
    return null;
  }
  function lessonsWithTag(tag) { return Course.allLessons().filter(l => l.ex.some(e => (e.tag || l.tag) === tag) || l.tag === tag); }

  /* ---------------- PAINEL ---------------- */
  function viewDash() {
    const s = S(), L = Store.levelInfo(), t = Store.today(), dx = s.daily[t] || 0, goal = s.settings.goal;
    const nx = nextLesson();
    const acc = s.counters.exTot ? s.counters.exOk / s.counters.exTot : 0;
    const totalL = Course.allLessons().length, doneL = Object.values(s.lessons).filter(x => x.done).length;
    const cont = s.last ? `<a class="btn" href="${s.last.route}">Voltar para: ${esc(s.last.title)}</a>` : '';
    const nxBtn = nx ? (nx.kind === 'lesson' ? `<a class="btn pri" href="#/lesson/${nx.l.id}">Próxima lição: ${esc(nx.l.title)} →</a>` : `<a class="btn pri" href="#/exam/${nx.u.id}">Prova da unidade: ${esc(nx.u.title)} →</a>`) : '<span class="up">Você concluiu todo o curso. Lenda.</span>';
    V().innerHTML = `
      <div class="hero card"><div class="hero-chart" id="heroChart"></div><div class="hero-in">
        <div class="mono amber" style="font-size:11px;letter-spacing:.14em">${greet()} · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 style="font-size:30px;margin:6px 0 4px">Mercado aberto. Bora operar conhecimento.</h1>
        <p class="sub" style="margin:0 0 14px">Meta de hoje: ${goal} XP. ${Store.streakAlive() ? 'Streak de <b class="amber">' + Store.streakAlive() + ' dia(s)</b> — não quebre a sequência.' : 'Comece uma sequência hoje.'} ${S().bestCombo ? 'Seu recorde de combo: <b class="amber">x' + S().bestCombo + '</b>.' : ''}</p>
        <div class="row">${nxBtn}${cont}</div></div></div>
      <div class="grid g2" style="margin-top:14px"><div class="card quests" id="dQuests"></div><div class="card" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
        ${ring(dx / goal, `${dx}<br><span class="muted" style="font-size:10px">/${goal} XP</span>`)}
        <div style="flex:1;min-width:260px"><div class="mono muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.1em">Nível ${L.idx + 1}</div><div style="font-size:22px;font-weight:650;margin:2px 0 8px">${L.name}</div>
          <div class="prog" style="height:8px"><i style="width:${L.frac * 100}%;background:linear-gradient(90deg,var(--c1),var(--c6))"></i></div>
          <div class="muted mono" style="font-size:12px;margin-top:6px">${L.next ? `${Q.fmt(s.xp, 0)} / ${Q.fmt(L.next, 0)} XP → ${L.nextName}` : 'nível máximo'}</div></div>
      </div></div>
      <div class="grid g4" style="margin-top:14px">
        <div class="card kpi"><div class="l">Lições</div><div class="v">${doneL}<span class="muted" style="font-size:15px">/${totalL}</span></div></div>
        <div class="card kpi"><div class="l">Acerto geral</div><div class="v ${acc >= 0.7 ? 'up' : 'amber'}">${s.counters.exTot ? Q.fmt(acc * 100, 0) + '%' : '—'}</div></div>
        <div class="card kpi"><div class="l">Estrelas</div><div class="v gold">${Store.totalStars()}<span class="muted" style="font-size:15px">/${totalL * 3}</span></div></div>
        <div class="card kpi"><div class="l">Streak (recorde)</div><div class="v">${Store.streakAlive()}d <span class="muted" style="font-size:15px">(${s.streak.best}d)</span></div></div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>XP nos últimos 30 dias</h3><div id="dXP"></div></div>
        <div class="card"><h3>Minutos de estudo (30 dias)</h3><div id="dMin"></div></div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>Progresso por módulo</h3><div id="dTracks"></div></div>
        <div class="card"><h3>Pontos fracos</h3><div id="dWeak"></div></div>
      </div>
      <div class="card" style="margin-top:14px"><h3>Acerto por tema</h3><div id="dTags"></div></div>
      <div class="card" style="margin-top:14px"><h3>Próximas conquistas</h3><div id="dNext" class="badges"></div></div>`;
    FX.liveChart(document.getElementById('heroChart'));
    V().querySelectorAll('.kpi .v').forEach(v => { const m = /^(\d+)/.exec(v.firstChild && v.firstChild.nodeType === 3 ? v.firstChild.textContent : ''); if (m && +m[1] > 0) { const tn = v.firstChild, target = +m[1], rest = tn.textContent.slice(m[1].length); const t0 = performance.now(); const st = t => { const k = Math.min(1, (t - t0) / 900); tn.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + rest; if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); } });
    drawQuests(document.getElementById('dQuests'));
    const days = [], xs = [], mins = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = Store.today(d); days.push(k.slice(8) + '/' + k.slice(5, 7)); xs.push(s.daily[k] || 0); mins.push(s.minutes[k] || 0); }
    Plot.bars(document.getElementById('dXP'), { labels: days, values: xs, colors: xs.map(x => x >= goal ? '#26d07c' : '#f5a623'), yFmt: v => Q.fmt(v, 0), height: 190 });
    Plot.bars(document.getElementById('dMin'), { labels: days, values: mins, colors: mins.map(() => '#4cc9f0'), yFmt: v => Q.fmt(v, v % 1 ? 1 : 0), height: 190 });
    document.getElementById('dTracks').innerHTML = Course.tracks.map(t => {
      const ls = t.units.flatMap(u => u.lessons), d = ls.filter(l => Store.lessonDone(l.id)).length, ex = t.units.filter(u => Store.examPassed(u.id)).length;
      return `<div style="margin-bottom:14px"><div class="row"><a href="#/track/${t.id}"><b>${t.title}</b></a><span class="spacer"></span><span class="mono muted" style="font-size:12px">${d}/${ls.length} lições · ${ex}/${t.units.length} provas</span></div><div class="prog" style="margin-top:6px"><i style="width:${d / Math.max(1, ls.length) * 100}%"></i></div>${Store.trackUnlocked(t.id) ? '' : `<div class="muted" style="font-size:12px;margin-top:4px">🔒 ${t.requires.text}</div>`}</div>`;
    }).join('');
    const tags = Object.entries(s.tags).filter(([k, v]) => v.n >= 3 && k !== 'flashcards').map(([k, v]) => [k, v.ok / v.n, v.n]).sort((a, b) => a[1] - b[1]);
    const weak = tags.filter(x => x[1] < 0.75).slice(0, 6);
    document.getElementById('dWeak').innerHTML = weak.length ? weak.map(([k, a, n]) => { const ls = lessonsWithTag(k).slice(0, 2); return `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b class="mono">${esc(k)}</b> <span class="down mono">${Q.fmt(a * 100, 0)}%</span> <span class="muted">(${n} tentativas)</span><div style="font-size:13px">Revisar: ${ls.map(l => `<a href="#/lesson/${l.id}">${esc(l.title)}</a>`).join(' · ') || '—'} · <a href="#/review?tab=1&tag=${encodeURIComponent(k)}">treino focado</a></div></div>`; }).join('') : '<p class="muted">Sem pontos fracos detectados ainda (precisa de ao menos 3 tentativas por tema com acerto abaixo de 75%).</p>';
    const top = tags.slice().sort((a, b) => b[2] - a[2]).slice(0, 14).sort((a, b) => a[1] - b[1]);
    if (top.length) Plot.bars(document.getElementById('dTags'), { labels: top.map(x => x[0]), values: top.map(x => x[1] * 100), colors: top.map(x => x[1] >= 0.75 ? '#26d07c' : x[1] >= 0.5 ? '#f5a623' : '#ff5c5c'), yFmt: v => Q.fmt(v, 0) + '%', height: 210 });
    else document.getElementById('dTags').innerHTML = '<p class="muted">Faça exercícios para ver suas estatísticas por tema.</p>';
    document.getElementById('dNext').innerHTML = Store.BADGES.filter(b => !s.badges[b.id]).slice(0, 4).map(b => `<div class="card bdg"><div class="ic">${b.ic}</div><div><div class="n">${b.n}</div><div class="d">${b.d}</div></div></div>`).join('');
  }

  function greet() { const hh = new Date().getHours(); return hh < 12 ? 'BOM DIA' : hh < 18 ? 'BOA TARDE' : 'BOA NOITE'; }
  function drawQuests(el) {
    if (!el) return;
    const qs = Store.ensureQuests(), done = qs.list.filter(q => q.done).length;
    el.innerHTML = `<div class="row"><h3 style="margin:0">Quests de hoje</h3><span class="spacer"></span><span class="mono muted" style="font-size:12px">renovam à meia-noite</span></div>
      ${qs.list.map(q => `<div class="quest ${q.done ? 'done' : ''}"><div class="qchk">${q.done ? '✓' : ''}</div><div style="flex:1"><div>${q.text}</div><div class="prog" style="margin-top:6px"><i style="width:${Math.min(1, q.progress / q.target) * 100}%"></i></div></div><div class="mono qrw">+${q.reward}</div></div>`).join('')}
      <div class="chest ${qs.chest ? 'open' : done === 3 ? 'ready' : ''}"><svg viewBox="0 0 48 40" width="44" height="36"><rect x="4" y="16" width="40" height="22" rx="3" fill="#7a4a12" stroke="#f5a623" stroke-width="2"/><path d="M4 18 Q24 ${qs.chest ? '-6' : '4'} 44 18" fill="#9a5c16" stroke="#f5a623" stroke-width="2"/><rect x="20" y="20" width="8" height="8" rx="1" fill="#ffd166"/></svg><div><b>${qs.chest ? 'Baú aberto hoje!' : 'Baú diário'}</b><div class="muted" style="font-size:12.5px">${qs.chest ? 'Volte amanhã para novas quests.' : `Complete as 3 quests para abrir (${done}/3): +100 a +150 XP`}</div></div></div>`;
  }

  /* ---------------- MÓDULO / UNIDADES ---------------- */
  function viewTrack(tid) {
    const t = Course.track(tid); if (!t) return notFound();
    const unlocked = Store.trackUnlocked(tid);
    V().innerHTML = `<h1>${t.title}</h1><p class="sub">${t.desc}</p>${unlocked ? '' : `<div class="box warn"><div class="bt">Bloqueado</div>${t.requires.text} (ou ative o modo livre nas <a href="#/settings">configurações</a>).</div>`}<div id="units"></div>`;
    const box = document.getElementById('units'); box.className = 'roadmap';
    let curSet = false;
    t.units.forEach((u, i) => {
      const ok = Store.unitUnlocked(u.id), pr = Store.unitProgress(u.id), ex = S().exams[u.id], passed = Store.examPassed(u.id);
      const cur = ok && !passed && !curSet; if (cur) curSet = true;
      const st = u.lessons.reduce((a, l) => a + Store.lessonStars(l.id), 0);
      const el = h(`<div class="card unit ${ok ? '' : 'locked'} ${passed ? 'done' : ''} ${cur ? 'current' : ''}"><div class="num">${passed ? '✓' : (tid === 'br' ? 'B' : 'U') + (i + 1)}</div><div style="flex:1"><div class="t">${esc(u.title)}</div><div class="d">${esc(u.desc)}</div><div class="row" style="margin-top:8px"><div class="prog" style="flex:1;max-width:260px"><i style="width:${pr.frac * 100}%"></i></div><span class="mono muted" style="font-size:12px">${pr.done}/${pr.total} lições</span><span class="mono gold" style="font-size:12px">★ ${st}/${u.lessons.length * 3}</span>${cur ? '<span class="pill up">você está aqui</span>' : ''}${ex ? `<span class="mono ${passed ? 'up' : 'amber'}" style="font-size:12px">prova: ${Q.fmt(ex.best * 100, 0)}%</span>` : ''}</div></div>${ok ? '' : '<span class="muted">🔒</span>'}</div>`);
      el.onclick = () => { if (ok) location.hash = '#/unit/' + u.id; else toast(i === 0 ? t.requires.text : 'Passe na prova da unidade anterior para liberar.'); };
      box.appendChild(el);
    });
  }

  function starsHtml(n, big) { return `<span class="stars ${big ? 'big' : ''}">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">${STAR}</i>`).join('')}</span>`; }
  function viewUnit(uid) {
    const u = Course.units[uid]; if (!u) return notFound();
    if (!Store.unitUnlocked(uid)) { location.hash = '#/track/' + u.track; return; }
    const t = Course.track(u.track), s = S(), ex = s.exams[uid], examOk = Store.examUnlocked(uid);
    const missions = Object.values(Course.missions).filter(m => m.unit === uid);
    V().innerHTML = `<div class="muted mono" style="font-size:12px"><a href="#/track/${t.id}">${t.title}</a> / Unidade ${u.index + 1}</div>
      <h1>${esc(u.title)}</h1><p class="sub">${esc(u.desc)}</p>
      <div class="grid g2"><div class="card"><h3>Lições</h3><div class="lessonlist">${u.lessons.map((l, i) => `<a href="#/lesson/${l.id}"><span class="dot ${Store.lessonDone(l.id) ? 'on' : ''}"></span><span class="mono muted" style="width:32px">${u.index + 1}.${i + 1}</span><span style="flex:1">${esc(l.title)}</span>${starsHtml(Store.lessonStars(l.id))}${(S().work || {})[l.id] && (S().work[l.id].notes || '').trim() ? '<span class="mono muted" title="tem anotações" style="font-size:11px">✎</span>' : ''}<span class="mono muted" style="font-size:11px">${l.ex.length} ex</span></a>`).join('')}</div></div>
      <div>
        <div class="card"><h3>Prova da unidade</h3><p class="muted" style="font-size:14px">${u.exam.n} questões sorteadas · ${u.exam.minutes} min · aprovação ${u.exam.pass * 100}%. ${u.index + 1 < t.units.length ? 'Passar libera a próxima unidade.' : ''}</p>
          ${ex ? `<p class="mono">Melhor nota: <b class="${ex.passed ? 'up' : 'amber'}">${Q.fmt(ex.best * 100, 0)}%</b> · tentativas: ${ex.tries}</p>` : ''}
          ${examOk ? `<a class="btn pri" href="#/exam/${uid}">${ex ? 'Refazer prova' : 'Fazer prova'}</a>` : '<span class="muted">🔒 Conclua todas as lições da unidade.</span>'}</div>
        ${missions.map(m => `<div class="card" style="margin-top:14px"><h3>Missão: ${esc(m.title)}</h3><p class="muted" style="font-size:14px">${esc(m.brief)}</p>${(s.missions[m.id]) ? `<p class="mono">Melhor: <b class="${(s.missions[m.id]).best >= 0.6 ? 'up' : 'amber'}">${Q.fmt((s.missions[m.id]).best * 100, 0)}%</b></p>` : ''}${examOk ? `<a class="btn" href="#/mission/${m.id}">${(s.missions[m.id]) ? 'Jogar de novo (novos números)' : 'Começar missão'}</a>` : '<span class="muted">🔒 Conclua as lições.</span>'}</div>`).join('')}
        ${u.sims ? `<div class="card" style="margin-top:14px"><h3>Simuladores recomendados</h3>${u.sims.map(id => `<a class="btn sm" style="margin:3px" href="#/sim/${id}">${Sims.byId[id].title}</a>`).join('')}</div>` : ''}
      </div></div>`;
  }

  /* ---------------- LIÇÃO ---------------- */
  function viewLesson(lid) {
    const l = Course.lessons[lid]; if (!l) return notFound();
    const u = Course.units[l.unit], t = Course.track(u.track);
    if (!Store.unitUnlocked(u.id)) { toast('Unidade bloqueada.'); location.hash = '#/track/' + t.id; return; }
    Store.setLast('#/lesson/' + lid, l.title);
    const prev = u.lessons[l.index - 1], next = u.lessons[l.index + 1];
    const done = Store.lessonDone(lid);
    V().innerHTML = `<div class="lesson">
      <div class="muted mono" style="font-size:12px"><a href="#/track/${t.id}">${t.title}</a> / <a href="#/unit/${u.id}">U${u.index + 1} ${esc(u.title)}</a> / Lição ${u.index + 1}.${l.index + 1}</div>
      <div class="row" style="align-items:flex-start"><h1 style="flex:1">${esc(l.title)}</h1><span id="lstars">${starsHtml(Store.lessonStars(lid), true)}</span></div>
      ${l.goal ? `<p class="sub">${l.goal}</p>` : ''}
      <div class="row lesson-tools"><button class="btn sm" data-wb="0">▦ Planilha da lição</button><button class="btn sm" data-wb="1">✎ Minhas notas</button><span class="muted" style="font-size:12.5px">Toque no <b class="finfo-mini">i</b> das fórmulas para ver a legenda de cada símbolo.</span></div>
      <div class="body">${l.body}</div>
      ${l.desk ? `<div class="box desk"><div class="bt">Na mesa</div>${l.desk}</div>` : ''}
      ${l.deep ? `<details class="deep"><summary>Aprofundar — matemática e rigor (opcional)</summary><div class="body">${l.deep}</div></details>` : ''}
      ${l.sims ? `<div class="row" style="margin:14px 0">${l.sims.map(sv => { const [id, q] = sv.split('?'); return `<a class="btn" href="#/sim/${sv}">▶ ${Sims.byId[id].title}${q ? ' (preset)' : ''}</a>`; }).join('')}</div>` : ''}
      ${l.refs ? readBox(l.refs) : ''}
      <h2>Exercícios <span class="muted mono" style="font-size:13px" id="exCount"></span></h2><div id="exs"></div>
      ${l.cards.length ? `<p class="muted" style="font-size:13.5px">${l.cards.length} flashcards desta lição entram na sua revisão espaçada quando você concluir.</p>` : ''}
      <div class="row" style="margin-top:22px;border-top:1px solid var(--line);padding-top:18px">
        ${prev ? `<a class="btn ghost" href="#/lesson/${prev.id}">← ${esc(prev.title)}</a>` : ''}
        <span class="spacer"></span>
        <button class="btn pri" id="complete" ${done ? 'disabled' : ''}>${done ? '✓ Lição concluída' : 'Concluir lição (+' + Store.XP.lesson + ' XP)'}</button>
        ${next ? `<a class="btn" href="#/lesson/${next.id}">${esc(next.title)} →</a>` : `<a class="btn" href="#/unit/${u.id}">Voltar à unidade →</a>`}
      </div></div>`;
    const body = V().querySelector('.lesson');
    math(body); Sims.mountWidgets(body); Formulas.mount(body, lid); bindRead(body);
    body.querySelectorAll('[data-wb]').forEach(b => b.onclick = () => Workbench.open(+b.dataset.wb));
    const rp = document.getElementById('readprog') || document.body.appendChild(h('<div id="readprog"><i></i></div>'));
    rp.classList.remove('hidden');
    window.onscroll = () => { if (!document.querySelector('.lesson')) { rp.classList.add('hidden'); window.onscroll = null; return; } const hh = document.documentElement.scrollHeight - innerHeight; rp.firstChild.style.width = (hh > 0 ? Math.min(1, scrollY / hh) * 100 : 0) + '%'; };
    const exs = document.getElementById('exs');
    const updateCount = () => {
      const n = l.ex.filter((_, i) => (S().ex[lid + '#' + i] || {}).tries).length, okN = l.ex.filter((_, i) => (S().ex[lid + '#' + i] || {}).ok).length;
      document.getElementById('exCount').textContent = `${okN}/${l.ex.length} resolvidos`;
      const btn = document.getElementById('complete');
      if (!Store.lessonDone(lid)) { const need = l.ex.length - n; btn.disabled = need > 0; btn.title = need > 0 ? `Responda os ${need} exercício(s) restantes` : ''; if (need > 0) btn.textContent = `Responda os exercícios (${n}/${l.ex.length})`; else { btn.textContent = 'Concluir lição (+' + Store.XP.lesson + ' XP)'; btn.classList.add('ready'); } }
    };
    l.ex.forEach((e, i) => renderExercise(exs, e, lid + '#' + i, { n: i + 1, tagDefault: l.tag, onResult: () => { updateCount(); document.getElementById('lstars').innerHTML = starsHtml(Store.lessonStars(lid), true); } }));
    updateCount();
    document.getElementById('complete').onclick = () => {
      Store.completeLesson(lid);
      const b = document.getElementById('complete'); b.disabled = true; b.textContent = '✓ Lição concluída';
      const st = Store.lessonStars(lid);
      const unitDone = Store.unitLessonsDone(u.id) && !Store.examPassed(u.id);
      FX.celebrate('Lição concluída!', `${esc(l.title)}<br><span class="muted">${st === 3 ? 'Gabarito de primeira. Três estrelas!' : 'Refaça exercícios com "Nova variação" acertando de primeira para ganhar mais estrelas.'}</span>`,
        `<div class="stars-reveal">${[1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.25}s">${STAR}</i>`).join('')}</div>`,
        { btn: unitDone ? 'Ir para a prova da unidade' : next ? 'Próxima lição →' : 'Continuar', n: 140 + st * 60, onClose: () => { if (unitDone) location.hash = '#/exam/' + u.id; else if (next) location.hash = '#/lesson/' + next.id; } });
    };
  }

  /* ---------------- BIBLIOTECA: livros da pasta Books ---------------- */
  let BOOKS_OK = null;
  fetch('/api/books').then(r => r.json()).then(j => { BOOKS_OK = j.books || {}; markMissing(document); }).catch(() => { BOOKS_OK = null; });
  function markMissing(root) { if (!BOOKS_OK) return; root.querySelectorAll('a.bref').forEach(a => a.classList.toggle('missing', !BOOKS_OK[a.dataset.book])); }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.bref');
    if (!a || !BOOKS_OK) return;
    if (!BOOKS_OK[a.dataset.book]) { e.preventDefault(); toast(`Esse livro não está na pasta <b>Books</b>. Coloque o PDF lá (ao lado do server.py) e o link abre direto no capítulo.`, '', 4200); }
  });
  const refKey = a => a.dataset.book + '|' + a.dataset.ch;
  function parseRefs(refs) {
    const d = document.createElement('div'); d.innerHTML = refs.join('');
    return [...d.querySelectorAll('a.bref')].map(a => ({ html: a.outerHTML, book: a.dataset.book, ch: a.dataset.ch, sec: a.dataset.sec, page: +a.dataset.page || 0, key: refKey(a), title: a.textContent.split(' — ').slice(1).join(' — ') }));
  }
  function readBtn(key) { const on = Store.isRead(key); return `<button class="readchk ${on ? 'on' : ''}" data-rk="${key}" title="${on ? 'Desmarcar' : 'Marcar o capítulo como lido (+' + Store.XP.read + ' XP)'}">${on ? (key.startsWith('cqf|') ? '✓ módulo estudado' : '✓ cap. lido') : (key.startsWith('cqf|') ? '○ estudei o módulo' : '○ li o capítulo')}</button>`; }
  function readBox(refs) {
    const rs = parseRefs(refs);
    return `<div class="readbox"><h4>📚 Leitura nos livros <span class="muted" style="text-transform:none;letter-spacing:0">— clique para abrir o PDF direto na página</span></h4>${rs.map(r => `<div class="readrow">${r.html}${r.ch && r.book !== 'car' ? readBtn(r.key) : ''}</div>`).join('')}</div>`;
  }
  function bindRead(root) {
    markMissing(root);
    root.querySelectorAll('.readchk').forEach(b => b.onclick = e => {
      const k = b.dataset.rk, on = !Store.isRead(k);
      Store.markRead(k, on);
      document.querySelectorAll(`.readchk[data-rk="${k}"]`).forEach(x => { x.classList.toggle('on', on); x.textContent = on ? (k.startsWith('cqf|') ? '✓ módulo estudado' : '✓ cap. lido') : (k.startsWith('cqf|') ? '○ estudei o módulo' : '○ li o capítulo'); });
      if (on) { FX.floatFromEl(b, '+' + Store.XP.read + ' XP'); FX.fromEl(b, 26); Sound.play('coin'); }
      if (location.hash.startsWith('#/library')) viewLibrary(true);
    });
  }
  const BOOK_ORDER = ['hull', 'wil', 'der', 'mfd', 'ek', 'ff', 'cqf', 'car'];
  const BOOK_COL = { hull: '#f5a623', wil: '#4cc9f0', der: '#26d07c', mfd: '#b388ff', ek: '#ff5c8a', ff: '#ffd166', cqf: '#e0e6ee', car: '#7d8b9b' };
  const BOOK_AB = { hull: 'OFOD', wil: 'PWQF', der: 'DER', mfd: 'MFD', ek: 'E&K', ff: 'F&F', cqf: 'CQF', car: 'BDS' };
  function libraryIndex() {
    const idx = {}, order = [];
    Course.allLessons().forEach(l => parseRefs(l.refs || []).forEach(r => {
      if (!r.ch && r.book !== 'car') return;
      const b = idx[r.book] || (idx[r.book] = {}), key = r.book === 'car' ? 'car|' + r.title : r.key;
      const c = b[key] || (b[key] = { key, book: r.book, ch: r.ch, page: 0, titles: new Set(), lessons: [] });
      if (!c.page) c.page = ((window.BOOKS || {})[r.book] || { pages: {} }).pages[r.ch] || r.page;
      if (r.title) c.titles.add(r.title.replace(/\s*\(.*?\)\s*$/, ''));
      if (!c.lessons.includes(l.id)) c.lessons.push(l.id);
      if (!order.includes(key)) order.push(key);
    }));
    return { idx, order };
  }
  function viewLibrary(keepScroll) {
    const y = scrollY;
    const { idx, order } = libraryIndex();
    const all = Object.values(idx).flatMap(b => Object.values(b)).filter(c => c.book !== 'car');
    const nRead = all.filter(c => Store.isRead(c.key)).length;
    const next = order.map(k => all.find(c => c.key === k)).filter(Boolean).find(c => !Store.isRead(c.key) && c.lessons.some(id => Store.lessonDone(id)))
      || order.map(k => all.find(c => c.key === k)).filter(Boolean).find(c => !Store.isRead(c.key));
    const B = window.BOOKS || {};
    const books = BOOK_ORDER.filter(k => idx[k]);
    const cqfNote = '<div class="muted" style="font-size:12.5px;margin:6px 0 2px">O CQF é um programa pago; o app não reproduz o material dele — mapeia cada módulo às lições que cobrem o mesmo tema. Os módulos 4 e 5 (machine learning) e boa parte do 6 (juros e crédito) ficam fora do foco de equity derivatives. Se você tiver o material, coloque o PDF na pasta <b>Books</b> com "CQF" no nome.</div>';
    V().innerHTML = `<h1>Biblioteca da mesa</h1>
      <p class="sub">Os capítulos dos seus livros que o curso usa, na ordem do livro. Cada link abre o PDF da pasta <b>Books</b> direto na página. Marque o que leu: <b class="up">+${Store.XP.read} XP</b> por capítulo e conquistas de leitura.</p>
      <div class="row" style="gap:12px;margin:10px 0 18px">
        <div class="card" style="flex:1;min-width:220px"><div class="mono muted" style="font-size:11px">CAPÍTULOS LIDOS</div><div style="font-size:28px;font-weight:800">${nRead}<span class="muted" style="font-size:16px"> / ${all.length}</span></div><div class="lib-prog"><i style="width:${all.length ? nRead / all.length * 100 : 0}%"></i></div></div>
        ${next ? `<div class="card" style="flex:2;min-width:280px"><div class="mono muted" style="font-size:11px">PRÓXIMA LEITURA SUGERIDA</div><div style="margin:6px 0">${(B[next.book] || {}).short || next.book}, ${next.book === 'cqf' ? 'módulo' : 'cap.'} ${next.ch} — ${[...next.titles].slice(0, 2).join(' · ')}</div><div class="row" style="gap:8px"><a class="btn sm pri bref-btn" data-book="${next.book}" href="/books/${next.book}${next.page ? '#page=' + next.page : ''}" target="_blank" rel="noopener">Abrir no PDF</a>${readBtn(next.key)}<span class="muted" style="font-size:12px">citado em ${next.lessons.map(id => `<a href="#/lesson/${id}">${id.toUpperCase()}</a>`).join(', ')}</span></div></div>` : ''}
      </div>
      ${books.map(k => {
        const info = B[k] || { short: k, full: k };
        if (k === 'cqf' && info.modules) Object.keys(info.modules).forEach(m => { const key = 'cqf|' + m; if (!idx.cqf[key]) idx.cqf[key] = { key, book: 'cqf', ch: m, page: 0, titles: new Set(), lessons: [] }; });
        const chs = Object.values(idx[k]).sort((a, b2) => (+a.ch || 0) - (+b2.ch || 0));
        const ok = BOOKS_OK ? !!BOOKS_OK[k] : null, nr = chs.filter(c => Store.isRead(c.key)).length;
        return `<div class="card lib-book"><div class="bk-h"><div class="bk-ic" style="background:${BOOK_COL[k]}">${BOOK_AB[k]}</div><div style="flex:1"><b>${info.full}</b>
          <div class="muted" style="font-size:12.5px;margin-top:3px">${ok === null ? '' : ok ? `<span class="up">● na pasta Books</span> · ${esc(BOOKS_OK[k])}` : '<span class="down">○ não está na pasta Books</span> — adicione o PDF para os links funcionarem'}${k !== 'car' ? ` · ${nr}/${chs.length} ${k === 'cqf' ? 'módulos estudados' : 'capítulos lidos'}` : ''}</div>
          ${k !== 'car' ? `<div class="lib-prog"><i style="width:${chs.length ? nr / chs.length * 100 : 0}%"></i></div>` : ''}</div>
          ${ok ? `<a class="btn sm" href="/books/${k}" target="_blank" rel="noopener">Abrir PDF</a>` : ''}</div>${k === 'cqf' ? cqfNote : ''}
          ${chs.map(c => `<div class="lib-ch"><span class="chn">${k === 'car' ? 'tema' : k === 'cqf' ? 'mód. ' + c.ch : 'cap. ' + c.ch}</span><div style="flex:1">${k === 'cqf' ? `<b>${(info.modules || {})[c.ch] || ''}</b>${c.titles.size ? ' <span class="muted">— ' + [...c.titles].slice(0, 4).join(' · ') + '</span>' : ''}${c.lessons.length ? '' : ' <span class="muted">(fora do escopo do app)</span>'}` : k === 'car' ? esc([...c.titles][0] || '') : `<a class="bref" data-book="${k}" data-ch="${c.ch}" href="/books/${k}${c.page ? '#page=' + c.page : ''}" target="_blank" rel="noopener">${[...c.titles].slice(0, 3).join(' · ') || 'capítulo ' + c.ch}</a>`}
            <div class="les">${c.lessons.map(id => `<a href="#/lesson/${id}" title="${esc(Course.lessons[id].title)}">${id.toUpperCase()}${Store.lessonDone(id) ? ' ✓' : ''}</a>`).join('')}</div></div>${k !== 'car' ? readBtn(c.key) : ''}</div>`).join('')}
        </div>`;
      }).join('')}`;
    bindRead(V());
    if (keepScroll) window.scrollTo(0, y);
  }

  /* ---------------- PROVA ---------------- */
  let examTimer = null;
  function viewExam(uid) {
    const u = Course.units[uid]; if (!u) return notFound();
    if (!Store.unitUnlocked(uid) || !Store.examUnlocked(uid)) { toast('Conclua as lições da unidade primeiro.'); location.hash = '#/unit/' + uid; return; }
    const ex = S().exams[uid];
    V().innerHTML = `<div class="muted mono" style="font-size:12px"><a href="#/unit/${uid}">U${u.index + 1} ${esc(u.title)}</a> / Prova</div><h1>Prova — ${esc(u.title)}</h1>
      <div class="card"><p>${u.exam.n} questões sorteadas de todas as lições da unidade (numéricas com números novos a cada prova). Tempo: <b>${u.exam.minutes} minutos</b>. Aprovação: <b>${u.exam.pass * 100}%</b>. Sem feedback até entregar.</p>
      <p class="muted">Primeira aprovação: +${Store.XP.examPass} XP · Nota 100%: +${Store.XP.examPerfect} XP bônus.</p>${ex ? `<p class="mono">Melhor nota: ${Q.fmt(ex.best * 100, 0)}%${ex.bestTime ? ' · melhor tempo ' + Math.floor(ex.bestTime / 60) + 'min' + String(ex.bestTime % 60).padStart(2, '0') : ''}</p>` : ''}
      <button class="btn pri" id="go">Começar</button></div>`;
    document.getElementById('go').onclick = () => startExam(u);
  }
  function startExam(u) {
    const pool = []; u.lessons.forEach(l => l.ex.forEach((e, i) => pool.push({ e, key: l.id + '#' + i, tag: l.tag })));
    const R = makeR(Math.floor(Math.random() * 1e9));
    const pick = R.shuffle(pool).slice(0, Math.min(u.exam.n, pool.length));
    let left = u.exam.minutes * 60; const t0 = Date.now();
    V().innerHTML = `<div class="row" style="position:sticky;top:79px;background:var(--bg);z-index:3;padding:8px 0;border-bottom:1px solid var(--line)"><h2 style="margin:0">Prova — ${esc(u.title)}</h2><span class="spacer"></span><span class="mono muted" id="ans"></span><span class="timer" id="tm"></span><button class="btn pri" id="submit">Entregar</button></div><div id="qs"></div>`;
    const qs = document.getElementById('qs');
    const upd = () => { document.getElementById('ans').textContent = apis.filter(a => a.isAnswered()).length + '/' + apis.length + ' respondidas'; };
    const apis = pick.map((p, i) => renderExercise(qs, p.e, p.key, { mode: 'exam', n: i + 1, tagDefault: p.tag, seed: R.int(1, 1e9), onChange: upd }));
    upd();
    const tick = () => { left--; const el = document.getElementById('tm'); if (!el) { clearInterval(examTimer); return; } el.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (left <= 60) el.style.color = 'var(--down)'; if (left <= 0) finish(true); };
    clearInterval(examTimer); examTimer = setInterval(tick, 1000); left++; tick();
    let finished = false;
    function finish(timeout) {
      if (finished) return; finished = true; clearInterval(examTimer);
      const score = apis.reduce((a, api) => a + (api.gradeExam() ? 1 : 0), 0);
      const secs = Math.round((Date.now() - t0) / 1000);
      const r = Store.examResult(u.id, score, apis.length, secs);
      const bar = document.getElementById('submit'); bar.disabled = true; bar.textContent = 'Entregue';
      const nextU = Course.track(u.track).units[u.index + 1];
      if (r.passed) { FX.confetti(260); Sound.play('level'); } else Sound.play('bad');
      modal(`<div class="bigicon ${r.passed ? 'up' : 'down'}">${score}/${apis.length}</div><h2>${r.passed ? 'Aprovado!' : 'Ainda não.'}</h2><p class="muted">${timeout ? 'Tempo esgotado. ' : ''}Nota ${Q.fmt(r.frac * 100, 0)}% (mínimo ${u.exam.pass * 100}%). ${r.xp ? '<span class="up">+' + r.xp + ' XP</span>' : ''}</p><p>${r.passed ? (nextU ? 'Próxima unidade liberada: <b>' + esc(nextU.title) + '</b>.' : 'Você fechou este módulo!') : 'Revise as explicações abaixo, refaça os exercícios das lições e tente de novo — as questões serão outras.'}</p>`,
        [{ label: 'Ver correção', pri: true }].concat(r.passed && nextU ? [{ label: 'Próxima unidade', go: '#/unit/' + nextU.id }] : [{ label: 'Voltar à unidade', go: '#/unit/' + u.id }]));
    }
    document.getElementById('submit').onclick = () => { const un = apis.filter(a => !a.isAnswered()).length; if (un && !confirmInline(un)) return; finish(false); };
    function confirmInline(n) { const b = document.getElementById('submit'); if (b.dataset.c) return true; b.dataset.c = '1'; b.textContent = `${n} em branco — clique de novo p/ entregar`; return false; }
  }

  /* ---------------- MISSÕES ---------------- */
  function viewMissions() {
    const s = S();
    V().innerHTML = `<h1>Missões "Dia na mesa"</h1><p class="sub">Cenários com números aleatórios: um vendedor pede preço, o mercado mexe, você hedgeia e explica o PnL. Cada missão abre quando você conclui as lições da unidade.</p><div id="ml"></div>`;
    const ml = document.getElementById('ml');
    Course.tracks.forEach(t => {
      ml.appendChild(h(`<h2>${t.title}</h2>`));
      const g = h('<div class="grid g2"></div>'); ml.appendChild(g);
      t.units.forEach(u => {
        Object.values(Course.missions).filter(m => m.unit === u.id).forEach(m => {
          const ok = Store.unitUnlocked(u.id) && Store.examUnlocked(u.id), rec = s.missions[m.id];
          const c = h(`<div class="card"><div class="mono muted" style="font-size:11px">U${u.index + 1} · ${esc(u.title)}</div><h3 style="margin-top:4px">${esc(m.title)}</h3><p class="muted" style="font-size:14px">${esc(m.brief)}</p>${rec ? `<p class="mono" style="font-size:13px">melhor ${Q.fmt(rec.best * 100, 0)}% · ${rec.plays} jogadas</p>` : ''}${ok ? `<a class="btn ${rec ? '' : 'pri'} sm" href="#/mission/${m.id}">${rec ? 'Jogar de novo' : 'Começar'}</a>` : '<span class="muted">🔒 conclua as lições da unidade</span>'}</div>`);
          g.appendChild(c);
        });
      });
    });
  }
  function viewMission(mid) {
    const m = Course.missions[mid]; if (!m) return notFound();
    const u = Course.units[m.unit];
    if (!(Store.unitUnlocked(u.id) && Store.examUnlocked(u.id))) { toast('Conclua as lições da unidade para liberar a missão.'); location.hash = '#/missions'; return; }
    const R = makeR(Math.floor(Math.random() * 1e9));
    const steps = m.gen(R);
    let i = 0, score = 0;
    V().innerHTML = `<div class="muted mono" style="font-size:12px"><a href="#/missions">Missões</a> / U${u.index + 1}</div><h1>${esc(m.title)}</h1><div class="narr"><div class="who">briefing</div>${m.brief}</div><div id="ms"></div>`;
    const ms = document.getElementById('ms');
    function step() {
      if (i >= steps.length) return end();
      const st = steps[i];
      const box = h(`<div style="margin-top:18px"><div class="mono muted" style="font-size:11px">Etapa ${i + 1}/${steps.length}</div><div class="narr"><div class="who">${esc(st.who || 'mesa')}</div>${st.narr}</div><div class="exw"></div><button class="btn pri resp">Responder</button></div>`);
      ms.appendChild(box); math(box);
      const api = renderExercise(box.querySelector('.exw'), st.ex, 'mission:' + mid + '#' + i, { mode: 'exam', n: i + 1, tagDefault: st.ex.tag || 'missão', seed: R.int(1, 1e9) });
      const b = box.querySelector('.resp');
      b.onclick = () => {
        if (!api.isAnswered()) { toast('Responda antes de seguir.'); return; }
        const ok = api.gradeExam(); if (ok) score++;
        const cb = Store.comboHit(ok); UI.answerFX(box.querySelector('.ex'), ok, { combo: cb.combo, crit: false });
        b.remove(); i++;
        const nb = h(`<button class="btn ${i >= steps.length ? 'pri' : ''}" style="margin-top:8px">${i >= steps.length ? 'Ver resultado' : 'Próxima etapa →'}</button>`);
        box.appendChild(nb); nb.onclick = () => { nb.remove(); step(); };
      };
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function end() {
      const frac = score / steps.length, xp = Store.missionResult(mid, frac);
      if (frac >= 0.6) { FX.confetti(frac >= 1 ? 300 : 160); Sound.play(frac >= 1 ? 'level' : 'coin'); }
      modal(`<div class="bigicon">${score}/${steps.length}</div><h2>${frac >= 1 ? 'Missão perfeita!' : frac >= 0.6 ? 'Missão cumprida' : 'O head da mesa não gostou…'}</h2><p class="muted">${xp ? '<span class="up">+' + xp + ' XP</span> · ' : ''}Os números mudam a cada jogada — repita até gabaritar.</p>`, [{ label: 'Jogar de novo', pri: true, fn: () => viewMission(mid) }, { label: 'Missões', go: '#/missions' }]);
    }
    step();
  }

  /* ---------------- SIMULADORES ---------------- */
  function viewSims() {
    V().innerHTML = `<h1>Simuladores</h1><p class="sub">Brinque com os parâmetros. A intuição de trader vem de ver as gregas se mexendo.</p><div class="grid g2" id="sl"></div>`;
    const sl = document.getElementById('sl');
    Sims.list.forEach(s => sl.appendChild(h(`<a class="card" href="#/sim/${s.id}" style="color:var(--text);display:flex;gap:14px;text-decoration:none"><div class="num unit" style="padding:0;border:none;margin:0"><div class="num">${s.ic}</div></div><div><h3 style="margin:0 0 4px">${s.title}</h3><div class="muted" style="font-size:13.5px">${s.desc}</div>${S().sims[s.id] ? `<div class="mono muted" style="font-size:11px;margin-top:6px">usado ${S().sims[s.id]}x</div>` : '<div class="mono amber" style="font-size:11px;margin-top:6px">novo · +' + Store.XP.simFirst + ' XP</div>'}</div></a>`)));
  }
  function viewSim(id, q) {
    const s = Sims.byId[id]; if (!s) return notFound();
    Store.useSim(id); Store.setLast('#/sim/' + id, s.title);
    V().innerHTML = `<div class="muted mono" style="font-size:12px"><a href="#/sims">Simuladores</a></div><h1>${s.title}</h1><p class="sub">${s.desc}</p><div id="simbox"></div>`;
    const box = document.getElementById('simbox');
    try { s.render(box, q || {}); } catch (e) { console.error(e); box.innerHTML = '<div class="box warn">Erro ao carregar simulador: ' + esc(e.message) + '</div>'; }
    math(box);
  }

  /* ---------------- REVISÃO / TREINO ---------------- */
  function viewReview(q) {
    const tab = +(q.tab || 0);
    V().innerHTML = `<h1>Revisão & treino</h1><p class="sub">Flashcards com repetição espaçada (SM-2) e treino rápido com exercícios das lições que você já concluiu — priorizando seus pontos fracos.</p><div id="rt"></div><div id="rb"></div>`;
    document.getElementById('rt').appendChild(Sims.tabs(['Flashcards', 'Treino rápido', 'Baralho'], i => { location.hash = '#/review?tab=' + i; }));
    document.querySelectorAll('#rt button').forEach((b, i) => b.classList.toggle('on', i === tab));
    const rb = document.getElementById('rb');
    if (tab === 0) {
      let queue = Store.dueCards(); const R = makeR(Date.now() % 1e9); queue = R.shuffle(queue);
      let n = 0;
      const show = () => {
        if (!queue.length) { rb.innerHTML = `<div class="card" style="text-align:center;padding:30px"><div class="bigicon">✓</div><h2>Nada para revisar agora</h2><p class="muted">${n ? `Você revisou ${n} cards. ` : ''}${Object.keys(S().cards).length ? 'Os próximos cards voltam nos dias programados.' : 'Conclua lições para ganhar flashcards.'}</p><a class="btn" href="#/review?tab=1">Fazer treino rápido</a></div>`; renderTop(); return; }
        const k = queue[0], c = Store.cardDef(k);
        rb.innerHTML = `<div class="muted mono" style="font-size:12px;margin-bottom:8px">${queue.length} restantes · da lição <a href="#/lesson/${c.lesson.id}">${esc(c.lesson.title)}</a></div><div class="card fc" id="fc"><div class="side">frente — clique ou espaço para virar</div><div>${c.front}</div><div class="back hidden">${c.back}</div></div>
          <div class="row hidden" id="grades" style="justify-content:center;margin-top:14px"><button class="btn" data-g="1">Errei <span class="kbd">1</span></button><button class="btn" data-g="3">Difícil <span class="kbd">2</span></button><button class="btn pri" data-g="4">Bom <span class="kbd">3</span></button><button class="btn" data-g="5">Fácil <span class="kbd">4</span></button></div>`;
        math(rb);
        const flip = () => { const fc = document.getElementById('fc'); if (!fc.classList.contains('flipped')) { fc.classList.add('flipped'); Sound.play('click'); } rb.querySelector('.back').classList.remove('hidden'); document.getElementById('grades').classList.remove('hidden'); };
        document.getElementById('fc').onclick = flip;
        rb.querySelectorAll('[data-g]').forEach(b => b.onclick = () => grade(+b.dataset.g));
        function grade(g) { Store.reviewCard(k, g); n++; queue.shift(); if (g < 3) queue.push(k); if (g >= 3) { FX.fromEl(document.getElementById('fc'), g === 5 ? 50 : 22); Sound.play('ok', n % 12); } else Sound.play('bad'); show(); }
        document.onkeydown = e => { if (!document.getElementById('fc')) { document.onkeydown = null; return; } if (e.key === ' ') { e.preventDefault(); flip(); } const m = { 1: 1, 2: 3, 3: 4, 4: 5 }[e.key]; if (m && !document.getElementById('grades').classList.contains('hidden')) grade(m); };
      };
      show();
    } else if (tab === 1) {
      const doneLessons = Course.allLessons().filter(l => Store.lessonDone(l.id) || (S().settings.freeMode && Store.unitUnlocked(l.unit)));
      const tagFilter = q.tag ? decodeURIComponent(q.tag) : null;
      let pool = []; doneLessons.forEach(l => l.ex.forEach((e, i) => pool.push({ e, key: l.id + '#' + i, tag: e.tag || l.tag, l })));
      if (tagFilter) pool = pool.filter(p => p.tag === tagFilter);
      if (!pool.length) { rb.innerHTML = '<div class="card"><p class="muted">Conclua algumas lições primeiro — o treino usa exercícios das lições concluídas.</p></div>'; return; }
      const acc = t => { const r = S().tags[t]; return r && r.n ? r.ok / r.n : 0.5; };
      const R = makeR(Math.floor(Math.random() * 1e9));
      const weighted = pool.map(p => ({ p, w: R.u() * (1.6 - acc(p.tag)) })).sort((a, b) => b.w - a.w).slice(0, 6).map(x => x.p);
      rb.innerHTML = `<p class="muted">${tagFilter ? `Treino focado em <b class="mono">${esc(tagFilter)}</b>. ` : ''}6 exercícios, priorizando temas com menor acerto. XP normal de exercícios.</p><div id="tq"></div><button class="btn pri" onclick="location.reload()">Novo treino ↻</button>`;
      const tq = document.getElementById('tq');
      weighted.forEach((p, i) => { const c = h(`<div><div class="mono muted" style="font-size:11px;margin-top:10px">de: <a href="#/lesson/${p.l.id}">${esc(p.l.title)}</a></div></div>`); tq.appendChild(c); renderExercise(c, p.e, p.key, { n: i + 1, tagDefault: p.tag }); });
    } else {
      const ks = Object.keys(S().cards).filter(k => Store.cardDef(k));
      const byDay = {}; ks.forEach(k => { const d = S().cards[k].due; byDay[d] = (byDay[d] || 0) + 1; });
      const days = Object.keys(byDay).sort().slice(0, 14);
      rb.innerHTML = `<div class="card"><h3>${ks.length} cards no baralho</h3><div id="cd"></div></div><div class="card" style="margin-top:14px"><table class="tbl"><tr><th>Frente</th><th>Próxima revisão</th><th class="n">Intervalo</th></tr>${ks.slice(0, 300).map(k => { const c = Store.cardDef(k), st = S().cards[k]; return `<tr><td>${c.front}</td><td class="mono">${st.due}</td><td class="n">${st.int}d</td></tr>`; }).join('')}</table></div>`;
      if (days.length) Plot.bars(document.getElementById('cd'), { labels: days.map(d => d.slice(8) + '/' + d.slice(5, 7)), values: days.map(d => byDay[d]), colors: days.map(() => '#b388ff'), yFmt: v => Q.fmt(v, 0), height: 180 });
      math(rb);
    }
  }

  /* ---------------- CONQUISTAS / GLOSSÁRIO / CONFIG ---------------- */
  function viewBadges() {
    const s = S(), L = Store.levelInfo();
    V().innerHTML = `<h1>Conquistas</h1><p class="sub">${Object.keys(s.badges).length} de ${Store.BADGES.length} desbloqueadas.</p><div class="badges">${Store.BADGES.map(b => `<div class="card bdg ${s.badges[b.id] ? 'got' : ''}"><div class="ic">${b.ic}</div><div><div class="n">${b.n}</div><div class="d">${b.d}</div>${s.badges[b.id] ? `<div class="mono muted" style="font-size:10.5px">${new Date(s.badges[b.id]).toLocaleDateString('pt-BR')}</div>` : ''}</div></div>`).join('')}</div>
      <h2>Carreira</h2><div class="card"><table class="tbl">${Store.LEVELS.map((lv, i) => `<tr style="${i === L.idx ? 'color:var(--c1);font-weight:700' : i < L.idx ? '' : 'opacity:.55'}"><td class="mono">Nv ${i + 1}</td><td>${lv[1]}</td><td class="n">${Q.fmt(lv[0], 0)} XP</td><td>${i < L.idx ? '✓' : i === L.idx ? '← você' : ''}</td></tr>`).join('')}</table>
      <p class="muted" style="font-size:13px">XP: lição +${Store.XP.lesson} · exercício +${Store.XP.exFirst}/${Store.XP.exNum} (numérico) na 1ª tentativa, +${Store.XP.exRetry} por nova variação · prova +${Store.XP.examPass} (+${Store.XP.examPerfect} se 100%) · missão até +${Store.XP.missionMax} · flashcard +${Store.XP.card} · meta diária +${Store.XP.goal}.</p></div>`;
  }
  function viewGlossary() {
    V().innerHTML = `<h1>Glossário de mesa</h1><p class="sub">${Course.glossary.length} termos do dia a dia de uma mesa de equity derivatives — como são falados.</p><input type="text" id="gq" placeholder="buscar (ex.: gamma, box, vol)…" style="max-width:420px;font-size:15px;padding:9px 12px"><dl class="glos" id="gl"></dl>`;
    const draw = qq => { qq = (qq || '').toLowerCase(); document.getElementById('gl').innerHTML = Course.glossary.filter(g => !qq || (g[0] + ' ' + g[1]).toLowerCase().includes(qq)).sort((a, b) => a[0].localeCompare(b[0], 'pt')).map(g => `<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join(''); math(document.getElementById('gl')); };
    document.getElementById('gq').oninput = e => draw(e.target.value); draw('');
  }
  function viewSettings() {
    const s = S();
    V().innerHTML = `<h1>Configurações</h1>
      <div class="card"><h3>Meta diária</h3><div class="row"><input type="number" id="goal" value="${s.settings.goal}" step="10" style="width:120px"><span class="muted">XP por dia (uma lição com exercícios dá ~120 XP)</span><button class="btn sm" id="sg">Salvar</button></div></div>
      <div class="card" style="margin-top:14px"><h3>Efeitos</h3><label class="row"><input type="checkbox" id="snd" ${s.settings.sound !== false ? 'checked' : ''}> <span>Sons (acerto, combo, level-up)</span></label><label class="row" style="margin-top:6px"><input type="checkbox" id="fxo" ${s.settings.fx !== false ? 'checked' : ''}> <span>Animações e confetti</span></label><label class="row" style="margin-top:6px"><input type="checkbox" id="tko" ${s.settings.ticker !== false ? 'checked' : ''}> <span>Ticker de mercado no topo</span></label></div>
      <div class="card" style="margin-top:14px"><h3>Modo livre</h3><label class="row"><input type="checkbox" id="free" ${s.settings.freeMode ? 'checked' : ''}> <span>Destravar todas as unidades, provas e missões (ignora a progressão por provas)</span></label></div>
      <div class="card" style="margin-top:14px"><h3>Backup do progresso</h3><p class="muted" style="font-size:14px">Seu progresso fica em <code>data/progress.db</code> (SQLite), ao lado do app, com cópia no navegador. O servidor guarda um backup automático por hora (últimos 30).</p>
        <div class="row"><button class="btn" id="exp">Exportar JSON</button><label class="btn">Importar JSON<input type="file" id="imp" accept=".json" style="display:none"></label><button class="btn" id="bk">Ver backups automáticos</button></div><div id="bks" style="margin-top:10px"></div></div>
      <div class="card" style="margin-top:14px;border-color:#5a2029"><h3 class="down">Zona de perigo</h3><button class="btn" id="rst">Zerar todo o progresso</button></div>`;
    document.getElementById('sg').onclick = () => { s.settings.goal = Math.max(10, +document.getElementById('goal').value || 120); Store.save(); renderTop(); toast('Meta salva.'); };
    document.getElementById('snd').onchange = e => { s.settings.sound = e.target.checked; Store.save(); renderTop(); Sound.play('ok'); };
    document.getElementById('fxo').onchange = e => { s.settings.fx = e.target.checked; Store.save(); if (e.target.checked) FX.confetti(80); };
    document.getElementById('tko').onchange = e => { s.settings.ticker = e.target.checked; Store.save(); document.getElementById('ticker').classList.toggle('hidden', !e.target.checked); };
    document.getElementById('free').onchange = e => { s.settings.freeMode = e.target.checked; Store.save(); toast(e.target.checked ? 'Modo livre ativado.' : 'Progressão por provas ativada.'); };
    document.getElementById('exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Store.exportJSON()], { type: 'application/json' })); a.download = 'eqd-progresso-' + Store.today() + '.json'; a.click(); };
    document.getElementById('imp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { Store.importJSON(t); toast('Progresso importado.'); route(); } catch (err) { toast('Erro: ' + err.message); } }); };
    document.getElementById('bk').onclick = async () => {
      const box = document.getElementById('bks');
      try { const r = await (await fetch('/api/backups')).json(); box.innerHTML = r.backups.length ? `<table class="tbl">${r.backups.map(b => `<tr><td class="mono">${b.created}</td><td><button class="btn sm" data-id="${b.id}">Restaurar</button></td></tr>`).join('')}</table>` : '<p class="muted">Nenhum backup ainda (é criado no máximo 1 por hora).</p>'; box.querySelectorAll('[data-id]').forEach(b => b.onclick = async () => { await fetch('/api/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: +b.dataset.id }) }); localStorage.removeItem('eqd-academy-state'); location.reload(); }); }
      catch (e) { box.innerHTML = '<p class="muted">Servidor indisponível.</p>'; }
    };
    let armed = false;
    document.getElementById('rst').onclick = e => { if (!armed) { armed = true; e.target.textContent = 'Tem certeza? Clique de novo para zerar'; return; } Store.reset(); toast('Progresso zerado.'); location.hash = '#/'; };
  }
  function notFound() { V().innerHTML = '<h1>Página não encontrada</h1><a href="#/">Voltar ao painel</a>'; }

  /* ---------------- roteador ---------------- */
  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    const q = {}; (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v || ''); });
    return { parts: path.split('/').filter(Boolean), q };
  }
  function route() {
    clearInterval(examTimer); document.onkeydown = null; document.getElementById('modal').classList.add('hidden'); Formulas.closeInfo(); document.querySelectorAll('.fx-celebrate').forEach(x => x.remove()); window.onscroll = null; const rpb = document.getElementById('readprog'); if (rpb) rpb.classList.add('hidden');
    const { parts, q } = parse(); const [a, b] = parts;
    let nav = 'dash';
    switch (a) {
      case undefined: viewDash(); break;
      case 'track': nav = b; viewTrack(b); break;
      case 'unit': nav = Course.units[b] ? Course.units[b].track : ''; viewUnit(b); break;
      case 'lesson': nav = Course.lessons[b] ? Course.units[Course.lessons[b].unit].track : ''; viewLesson(b); break;
      case 'exam': nav = Course.units[b] ? Course.units[b].track : ''; viewExam(b); break;
      case 'missions': nav = 'missions'; viewMissions(); break;
      case 'mission': nav = 'missions'; viewMission(b); break;
      case 'sims': nav = 'sims'; viewSims(); break;
      case 'sim': nav = 'sims'; viewSim(b, q); break;
      case 'review': nav = 'review'; viewReview(q); break;
      case 'badges': nav = 'badges'; viewBadges(); break;
      case 'glossary': nav = 'glossary'; viewGlossary(); break;
      case 'library': nav = 'library'; viewLibrary(); break;
      case 'desk': { nav = 'desk'; const box = h('<div></div>'); V().innerHTML = ''; V().appendChild(box); Desk.view(box); Store.setLast('#/desk', 'Mesa: Head Trader'); break; }
      case 'settings': nav = 'settings'; viewSettings(); break;
      case 'notebook': nav = 'notebook'; Workbench.viewNotebook(V()); break;
      default: notFound();
    }
    renderNav(nav); renderTop();
    if (a === 'lesson' && Course.lessons[b]) { const L = Course.lessons[b], U = Course.units[L.unit]; Workbench.setContext(b, `Lição ${U.index + 1}.${L.index + 1} — ${L.title}`); }
    else Workbench.setContext('geral', 'Bancada geral');
    const v = V(); v.classList.remove('view-in'); void v.offsetWidth; v.classList.add('view-in');
    window.scrollTo(0, 0);
  }

  /* ---------------- eventos de gamificação ---------------- */
  let comboEl = null, comboTimer = null;
  function showCombo(d) {
    if (!comboEl) { comboEl = h('<div id="combo" class="combo"></div>'); document.body.appendChild(comboEl); }
    const tc = document.getElementById('topcombo');
    if (tc) { tc.innerHTML = `${FLAME} x${d.combo}`; tc.classList.toggle('on', d.combo >= 3); }
    if (d.combo === 0) {
      if (d.lost >= 3) { comboEl.innerHTML = `<div class="c-lost">combo x${d.lost} perdido</div>`; comboEl.className = 'combo show lost'; clearTimeout(comboTimer); comboTimer = setTimeout(() => comboEl.className = 'combo', 1600); }
      return;
    }
    if (d.combo < 2) return;
    const tier = d.combo >= 15 ? 4 : d.combo >= 10 ? 3 : d.combo >= 6 ? 2 : d.combo >= 3 ? 1 : 0;
    const nextAt = [3, 6, 10, 15, 999][tier], prevAt = [0, 3, 6, 10, 15][tier];
    comboEl.className = `combo show t${tier}`;
    comboEl.innerHTML = `<div class="c-flame">${FLAME.replace('14', '30').replace('14', '30')}</div><div><div class="c-n">COMBO <b>x${d.combo}</b></div><div class="c-m">${d.mult > 1 ? 'XP ' + String(d.mult).replace('.', ',') + '×' : 'mais 1 para o bônus!'}${d.crit ? ' · <span class="gold">CRÍTICO!</span>' : ''}</div><div class="c-bar"><i style="width:${tier === 4 ? 100 : (d.combo - prevAt) / (nextAt - prevAt) * 100}%"></i></div></div>`;
    FX.pulse(comboEl, 'fx-pop');
    if ([3, 6, 10, 15, 20, 30].includes(d.combo)) { const r = comboEl.getBoundingClientRect(); FX.burst(r.left + 40, r.top + 20, 50 + d.combo * 3, { colors: ['#f5a623', '#ffd166', '#ff5c8a'] }); Sound.play('coin'); }
    clearTimeout(comboTimer); comboTimer = setTimeout(() => { if (comboEl) comboEl.classList.remove('show'); }, 6000);
  }
  Store.on((ev, d) => {
    if (ev === 'xp' && d.reason === 'lição') toast(`<b>+${d.n} XP</b> · lição`, 'xp', 1600);
    if (ev === 'xp' && ['missão', 'prova', 'simulador', 'jogo de hedge', 'leitura'].includes(d.reason)) toast(`<b>+${d.n} XP</b> · ${d.reason}`, 'xp', 1800);
    if (ev === 'levelup') setTimeout(() => FX.celebrate('Promoção!', `Você agora é <b class="amber">${d.name}</b>.<br><span class="muted">${d.nextName ? 'Próximo cargo: ' + d.nextName + ' (' + Q.fmt(d.next, 0) + ' XP)' : 'Topo da carreira.'}</span>`, `<div class="lvl-badge xl">${d.idx + 1}</div>`, { btn: 'Bora!' }), 400);
    if (ev === 'badge') { toast(`<div class="row" style="gap:10px;flex-wrap:nowrap"><div class="bdg-ic">${d.ic}</div><div>Conquista desbloqueada<br><b>${d.n}</b><br><span class="muted">${d.d}</span></div></div>`, 'badge', 5000); Sound.play('badge'); FX.burst(innerWidth - 180, innerHeight - 90, 60, { colors: ['#b388ff', '#ffd166', '#4cc9f0'] }); }
    if (ev === 'goal') { toast(`<b>Meta diária batida!</b> +${Store.XP.goal} XP bônus`, 'xp', 4000); FX.confetti(120); Sound.play('coin'); }
    if (ev === 'quest') { toast(`<b>Quest concluída:</b> ${d.text}<br><span class="up mono">+${d.reward} XP</span>`, 'quest', 4000); Sound.play('coin'); drawQuests(document.getElementById('dQuests')); }
    if (ev === 'chest') setTimeout(() => { FX.celebrate('Baú diário aberto!', `Você completou as 3 quests de hoje.<br><b class="up">+${d.bonus} XP</b>`, '<div class="chest-big"></div>', { sound: 'chest', n: 260 }); drawQuests(document.getElementById('dQuests')); }, 600);
    if (ev === 'combo') showCombo(d);
    renderTop();
  });

  if (S && document.getElementById('ticker')) FX.startTicker(document.getElementById('ticker'));
  window.addEventListener('hashchange', route);
  Store.load().then(() => { Store.ensureQuests(); Store.checkBadges(); if (S().settings.ticker === false) document.getElementById('ticker').classList.add('hidden'); route(); });
})();
