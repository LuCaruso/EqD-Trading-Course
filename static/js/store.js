/* Store — estado do aluno, persistência (SQLite via servidor + espelho em localStorage) e gamificação */
(function (global) {
  'use strict';
  const LS_KEY = 'eqd-academy-state';
  const today = (d) => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

  const LEVELS = [
    [0, 'Estagiário'], [300, 'Analista Jr.'], [800, 'Analista'], [1600, 'Trader Jr.'], [2800, 'Trader'],
    [4500, 'Trader Pleno'], [6800, 'Trader Sênior'], [9800, 'Head de Vol'], [13500, 'Head da Mesa'], [18500, 'Lenda do Pit']
  ];

  const XP = { lesson: 40, exFirst: 15, exNum: 20, exRetry: 5, examPass: 150, examPerfect: 100, missionMax: 120, card: 2, simFirst: 10, goal: 25, read: 20 };

  function defaults() {
    return {
      v: 1, created: new Date().toISOString(), xp: 0,
      daily: {}, minutes: {}, goalHit: {},
      streak: { cur: 0, best: 0, last: null },
      lessons: {}, ex: {}, tags: {}, exams: {}, missions: {}, cards: {}, badges: {},
      sims: {}, hedgeGame: { best: null, plays: 0 },
      counters: { reviews: 0, exOk: 0, exTot: 0 },
      last: null, bestCombo: 0, crits: 0, chests: 0, quests: null, work: {}, reading: {}, desk: null,
      settings: { goal: 120, freeMode: false, sound: true, fx: true }
    };
  }

  let state = defaults(), saveTimer = null, online = false, listeners = [], dirty = false, attemptBuf = [];

  function setStatus(txt) { const el = document.getElementById('saveStatus'); if (el) el.textContent = txt; }

  async function load() {
    let fromServer = null, local = null;
    try { const r = await fetch('/api/state', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); fromServer = j.state; online = true; } } catch (e) { online = false; }
    try { local = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { local = null; }
    let s = fromServer || local;
    // se o local for mais novo que o servidor (ex.: servidor caiu antes de salvar), usa o local
    if (fromServer && local && (local._saved || '') > (fromServer._saved || '')) s = local;
    state = Object.assign(defaults(), s || {});
    state.settings = Object.assign(defaults().settings, state.settings || {});
    state.counters = Object.assign(defaults().counters, state.counters || {});
    setStatus(online ? '● salvo no servidor local' : '○ offline — salvando no navegador');
    if (!fromServer && s) save(true);
    return state;
  }

  function save(now) {
    dirty = true;
    state._saved = new Date().toISOString();
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, now ? 0 : 700);
  }
  async function flush(keepalive) {
    if (!dirty) return;
    dirty = false;
    try {
      const r = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state), keepalive: !!keepalive });
      online = r.ok; setStatus(online ? '● salvo ' + new Date().toLocaleTimeString('pt-BR') : '○ erro ao salvar');
    } catch (e) { online = false; dirty = true; setStatus('○ offline — salvando no navegador'); }
    if (attemptBuf.length) {
      const items = attemptBuf.splice(0);
      try { await fetch('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items), keepalive: !!keepalive }); } catch (e) { }
    }
  }
  window.addEventListener('beforeunload', () => flush(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(true); });

  function on(fn) { listeners.push(fn); }
  function emit(ev, data) { listeners.forEach(f => { try { f(ev, data); } catch (e) { console.error(e); } }); }

  /* ------------ nível / XP / streak ------------ */
  function levelInfo(xp) {
    xp = xp == null ? state.xp : xp;
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    const cur = LEVELS[i], nxt = LEVELS[i + 1];
    return { idx: i, name: cur[1], min: cur[0], next: nxt ? nxt[0] : null, nextName: nxt ? nxt[1] : null, frac: nxt ? (xp - cur[0]) / (nxt[0] - cur[0]) : 1 };
  }

  function touchStreak() {
    const t = today(), s = state.streak;
    if (s.last === t) return;
    if (s.last && dayDiff(s.last, t) === 1) s.cur += 1; else s.cur = 1;
    s.last = t; s.best = Math.max(s.best, s.cur);
    emit('streak', s.cur);
  }
  function streakAlive() { const s = state.streak; if (!s.last) return 0; const d = dayDiff(s.last, today()); return d <= 1 ? s.cur : 0; }

  function addXP(n, reason) {
    if (!n) return;
    const before = levelInfo();
    state.xp += n;
    const t = today();
    state.daily[t] = (state.daily[t] || 0) + n;
    session.xp += n;
    touchStreak();
    if (reason !== 'quest' && reason !== 'baú diário') { const qs = ensureQuests(); qs.list.forEach(q => { if (q.type === 'xp' && !q.done && state.daily[t] >= q.target) setTimeout(() => questProgress('xp', state.daily[t], true), 0); }); }
    emit('xp', { n, reason });
    const after = levelInfo();
    if (after.idx > before.idx) emit('levelup', after);
    if (!state.goalHit[t] && state.daily[t] >= state.settings.goal) { state.goalHit[t] = true; emit('goal', t); state.xp += XP.goal; state.daily[t] += XP.goal; }
    checkBadges();
    save();
  }

  /* ------------ registro de tentativas ------------ */
  function recordAttempt(kind, ref, tag, ok) {
    const tags = Array.isArray(tag) ? tag : [tag || 'geral'];
    tags.forEach(tg => { const r = state.tags[tg] = state.tags[tg] || { ok: 0, n: 0 }; r.n++; if (ok) r.ok++; });
    state.counters.exTot++; if (ok) state.counters.exOk++;
    attemptBuf.push({ ts: new Date().toISOString(), kind, ref, tag: tags.join(','), ok });
  }

  // resultado de exercício em modo prática → retorna XP ganho
  /* ------------ combo, crítico e sessão ------------ */
  const session = { xp: 0, ok: 0, n: 0, combo: 0, best: 0, start: Date.now() };
  function comboMult(c) { return c >= 15 ? 3 : c >= 10 ? 2.5 : c >= 6 ? 2 : c >= 3 ? 1.5 : 1; }
  // registra acerto/erro na sequência; retorna {combo, mult, crit}
  function comboHit(ok) {
    session.n++;
    if (!ok) { const lost = session.combo; session.combo = 0; emit('combo', { combo: 0, mult: 1, lost }); return { combo: 0, mult: 1, crit: false }; }
    session.ok++; session.combo++;
    session.best = Math.max(session.best, session.combo);
    if (session.combo > (state.bestCombo || 0)) state.bestCombo = session.combo;
    questProgress('combo', session.combo, true);
    questProgress('ex_ok', 1);
    const crit = Math.random() < 0.12;
    if (crit) state.crits = (state.crits || 0) + 1;
    const r = { combo: session.combo, mult: comboMult(session.combo), crit };
    emit('combo', r);
    return r;
  }

  function exerciseResult(key, ok, isNum, tag, first) {
    const rec = state.ex[key] = state.ex[key] || { ok: false, tries: 0, solves: 0 };
    rec.tries++;
    recordAttempt('ex', key, tag, ok);
    const cb = comboHit(ok);
    let base = 0;
    if (ok) {
      if (!rec.ok) base = rec.tries === 1 ? (isNum ? XP.exNum : XP.exFirst) : Math.round((isNum ? XP.exNum : XP.exFirst) / 2);
      else base = XP.exRetry;
      rec.ok = true; rec.solves++;
      if (first) rec.clean = true;
    }
    let gained = Math.round(base * cb.mult * (cb.crit && base ? 2 : 1));
    if (gained) addXP(gained, cb.crit ? 'CRÍTICO' : 'exercício'); else save();
    return { xp: gained, base, combo: cb.combo, mult: cb.mult, crit: cb.crit && base > 0 };
  }

  /* ------------ estrelas por lição (acertos de primeira) ------------ */
  function lessonStars(lid) {
    const L = Course.lessons[lid]; if (!L || !L.ex.length) return 0;
    const clean = L.ex.filter((_, i) => (state.ex[lid + '#' + i] || {}).clean).length;
    const f = clean / L.ex.length;
    if (!lessonDone(lid) && f === 0) return 0;
    return f >= 0.9 ? 3 : f >= 0.6 ? 2 : lessonDone(lid) || f > 0 ? 1 : 0;
  }
  function totalStars() { return Course.allLessons().reduce((a, l) => a + lessonStars(l.id), 0); }

  /* ------------ quests diárias ------------ */
  const QUEST_TYPES = {
    ex_ok: { t: n => `Acerte ${n} exercícios`, targets: [8, 10, 12, 15], r: [50, 60, 70, 80] },
    lesson: { t: n => n > 1 ? `Conclua ${n} lições` : 'Conclua 1 lição', targets: [1, 2], r: [60, 90] },
    cards: { t: n => `Revise ${n} flashcards`, targets: [8, 12, 20], r: [40, 50, 70] },
    combo: { t: n => `Faça um combo de ${n} acertos seguidos`, targets: [5, 7, 10], r: [50, 70, 90] },
    sim: { t: n => `Use ${n} simuladores diferentes`, targets: [2, 3], r: [40, 55] },
    mission: { t: () => 'Jogue uma missão "Dia na mesa"', targets: [1], r: [70] },
    xp: { t: n => `Ganhe ${n} XP hoje`, targets: [150, 250], r: [50, 80] },
    notes: { t: () => 'Faça uma anotação em alguma lição', targets: [1], r: [35] },
    sheet: { t: () => 'Faça uma conta na planilha de uma lição', targets: [1], r: [35] }
  };
  function ensureQuests() {
    const t = today();
    if (state.quests && state.quests.date === t) return state.quests;
    let seed = 0; for (const ch of t) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const R = Q.rng(seed || 1);
    const keys = Object.keys(QUEST_TYPES), pick = [];
    while (pick.length < 3) { const k = keys[Math.floor(R() * keys.length)]; if (!pick.includes(k)) pick.push(k); }
    state.quests = { date: t, chest: false, sims: [], list: pick.map(k => { const q = QUEST_TYPES[k], j = Math.floor(R() * q.targets.length); return { type: k, target: q.targets[j], reward: q.r[j], progress: 0, done: false, text: q.t(q.targets[j]) }; }) };
    return state.quests;
  }
  function questProgress(type, v, isMax) {
    const qs = ensureQuests();
    qs.list.forEach(q => {
      if (q.type !== type || q.done) return;
      q.progress = isMax ? Math.max(q.progress, v) : q.progress + v;
      if (q.progress >= q.target) {
        q.progress = q.target; q.done = true;
        emit('quest', q);
        addXP(q.reward, 'quest');
      }
    });
    if (!qs.chest && qs.list.every(q => q.done)) {
      qs.chest = true; state.chests = (state.chests || 0) + 1;
      const bonus = 100 + Math.floor(Math.random() * 3) * 25;
      emit('chest', { bonus }); addXP(bonus, 'baú diário');
    }
  }

  function completeLesson(id) {
    if (state.lessons[id] && state.lessons[id].done) return 0;
    state.lessons[id] = { done: true, at: new Date().toISOString() };
    // adiciona flashcards ao baralho
    const L = Course.lessons[id];
    (L.cards || []).forEach((c, i) => { const cid = id + '#' + i; if (!state.cards[cid]) state.cards[cid] = { ef: 2.5, int: 0, rep: 0, due: today() }; });
    addXP(XP.lesson, 'lição');
    emit('lesson', id);
    questProgress('lesson', 1);
    return XP.lesson;
  }

  function lessonDone(id) { return !!(state.lessons[id] && state.lessons[id].done); }
  function unitLessonsDone(uid) { const u = Course.units[uid]; return u.lessons.every(l => lessonDone(l.id)); }
  function unitProgress(uid) { const u = Course.units[uid]; const d = u.lessons.filter(l => lessonDone(l.id)).length; return { done: d, total: u.lessons.length, frac: d / u.lessons.length }; }
  function examPassed(uid) { return !!(state.exams[uid] && state.exams[uid].passed); }
  function trackUnlocked(tid) {
    const t = Course.track(tid);
    if (state.settings.freeMode || !t.requires) return true;
    return examPassed(t.requires.unit);
  }
  function unitUnlocked(uid) {
    const u = Course.units[uid];
    if (state.settings.freeMode) return true;
    if (!trackUnlocked(u.track)) return false;
    if (u.index === 0) return true;
    const prev = Course.track(u.track).units[u.index - 1];
    return examPassed(prev.id);
  }
  function examUnlocked(uid) { return state.settings.freeMode || unitLessonsDone(uid); }

  function examResult(uid, score, total, seconds) {
    const u = Course.units[uid];
    const frac = score / total, passed = frac >= u.exam.pass;
    const rec = state.exams[uid] = state.exams[uid] || { best: 0, passed: false, tries: 0 };
    rec.tries++;
    const firstPass = passed && !rec.passed;
    const firstPerfect = frac === 1 && rec.best < 1;
    rec.best = Math.max(rec.best, frac); rec.last = frac; rec.at = new Date().toISOString();
    if (passed) rec.passed = true;
    if (seconds != null) rec.bestTime = rec.bestTime ? Math.min(rec.bestTime, seconds) : seconds;
    let xp = 0;
    if (firstPass) xp += XP.examPass; else if (passed) xp += 20;
    if (firstPerfect) xp += XP.examPerfect;
    if (xp) addXP(xp, 'prova'); else save();
    if (firstPass) emit('unitpass', uid);
    checkBadges();
    return { passed, xp, frac };
  }

  function missionResult(mid, frac) {
    const rec = state.missions[mid] = state.missions[mid] || { best: 0, plays: 0 };
    rec.plays++;
    const prevBest = rec.best;
    rec.best = Math.max(rec.best, frac);
    rec.done = rec.done || frac >= 0.6;
    const xp = Math.round(XP.missionMax * Math.max(0, frac - prevBest)) + (frac >= 0.6 ? 10 : 0);
    if (xp) addXP(xp, 'missão'); else save();
    questProgress('mission', 1);
    checkBadges();
    return xp;
  }

  function useSim(id) {
    const first = !state.sims[id];
    state.sims[id] = (state.sims[id] || 0) + 1;
    const qs = ensureQuests(); qs.sims = qs.sims || [];
    if (!qs.sims.includes(id) && id.indexOf('-') < 0) { qs.sims.push(id); questProgress('sim', qs.sims.length, true); }
    if (first) addXP(XP.simFirst, 'simulador'); else save();
  }

  /* ------------ flashcards SM-2 ------------ */
  function dueCards() {
    const t = today();
    return Object.keys(state.cards).filter(k => state.cards[k].due <= t && cardDef(k));
  }
  function cardDef(k) {
    const [lid, i] = k.split('#'); const L = Course.lessons[lid];
    return L && L.cards[+i] ? { front: L.cards[+i][0], back: L.cards[+i][1], lesson: L } : null;
  }
  function reviewCard(k, grade) { // grade 0..5
    const c = state.cards[k]; if (!c) return;
    if (grade < 3) { c.rep = 0; c.int = 1; }
    else {
      c.rep += 1;
      c.int = c.rep === 1 ? 1 : c.rep === 2 ? 4 : Math.round(c.int * c.ef);
      if (grade === 5) c.int = Math.round(c.int * 1.3);
    }
    c.ef = Math.max(1.3, c.ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    const d = new Date(); d.setDate(d.getDate() + (grade < 3 ? 0 : c.int));
    c.due = today(d);
    state.counters.reviews++;
    recordAttempt('card', k, 'flashcards', grade >= 3);
    addXP(XP.card, 'revisão');
    questProgress('cards', 1);
  }

  /* ------------ badges ------------ */
  const BADGES = [
    { id: 'first-lesson', n: 'Primeiro dia na mesa', d: 'Conclua sua primeira lição', ic: '01', test: s => nLessons(s) >= 1 },
    { id: 'lessons-10', n: 'Café com o chefe', d: 'Conclua 10 lições', ic: '10', test: s => nLessons(s) >= 10 },
    { id: 'lessons-30', n: 'Book runner', d: 'Conclua 30 lições', ic: '30', test: s => nLessons(s) >= 30 },
    { id: 'lessons-all', n: 'Currículo completo', d: 'Conclua todas as lições do curso', ic: 'ALL', test: s => nLessons(s) >= Course.allLessons().length },
    { id: 'exam-1', n: 'Aprovado', d: 'Passe na primeira prova de unidade', ic: 'A+', test: s => Object.values(s.exams).some(e => e.passed) },
    { id: 'exam-perfect', n: 'Sem erro de hedge', d: 'Tire 100% em uma prova', ic: '100', test: s => Object.values(s.exams).some(e => e.best >= 1) },
    { id: 'greeks', n: 'Fluente em gregas', d: 'Passe na prova da Unidade de Gregas (BR4)', ic: 'Δ', test: s => s.exams.br4 && s.exams.br4.passed },
    { id: 'exotics', n: 'Barrier survivor', d: 'Passe na prova de Exóticas (BR7)', ic: 'KO', test: s => s.exams.br7 && s.exams.br7.passed },
    { id: 'br-done', n: 'Mesa Brasil', d: 'Passe em todas as provas do Módulo Brasil', ic: 'BR', test: s => Course.track('br').units.length > 0 && Course.track('br').units.every(u => s.exams[u.id] && s.exams[u.id].passed) },
    { id: 'us-done', n: 'Wall Street', d: 'Passe em todas as provas do Módulo US', ic: 'US', test: s => Course.track('us').units.length > 0 && Course.track('us').units.every(u => s.exams[u.id] && s.exams[u.id].passed) },
    { id: 'streak-3', n: 'Aquecendo', d: 'Streak de 3 dias', ic: '3d', test: s => s.streak.best >= 3 },
    { id: 'streak-7', n: 'Semana cheia', d: 'Streak de 7 dias', ic: '7d', test: s => s.streak.best >= 7 },
    { id: 'streak-30', n: 'Disciplina de trader', d: 'Streak de 30 dias', ic: '30d', test: s => s.streak.best >= 30 },
    { id: 'mission-1', n: 'Primeiro RFQ', d: 'Complete uma missão "Dia na mesa"', ic: 'RFQ', test: s => Object.values(s.missions).some(m => m.done) },
    { id: 'mission-5', n: 'Veterano de pregão', d: 'Complete 5 missões', ic: 'x5', test: s => Object.values(s.missions).filter(m => m.done).length >= 5 },
    { id: 'mission-perfect', n: 'Voz de trader', d: 'Gabarite uma missão', ic: '★', test: s => Object.values(s.missions).some(m => m.best >= 1) },
    { id: 'sims-all', n: 'Quant de bancada', d: 'Use todos os simuladores', ic: 'SIM', test: s => Object.keys(s.sims).length >= (global.Sims ? Sims.list.length : 7) },
    { id: 'hedger', n: 'Gamma scalper', d: 'No jogo de delta hedge, fique a menos de 25% do hedge automático', ic: 'Γ', test: s => s.hedgeGame.best != null && s.hedgeGame.best <= 0.25 },
    { id: 'cards-100', n: 'Memória de elefante', d: 'Faça 100 revisões de flashcards', ic: 'FC', test: s => s.counters.reviews >= 100 },
    { id: 'xp-1000', n: 'Mil pontos base', d: 'Acumule 1.000 XP', ic: '1k', test: s => s.xp >= 1000 },
    { id: 'xp-5000', n: 'Bônus garantido', d: 'Acumule 5.000 XP', ic: '5k', test: s => s.xp >= 5000 },
    { id: 'goal-5', n: 'Meta batida', d: 'Bata a meta diária 5 vezes', ic: 'GO', test: s => Object.keys(s.goalHit).length >= 5 },
    { id: 'ex-100', n: 'Calculadora humana', d: 'Acerte 100 exercícios', ic: '#', test: s => s.counters.exOk >= 100 },
    { id: 'combo-5', n: 'Em chamas', d: 'Faça um combo de 5 acertos seguidos', ic: 'x5', test: s => (s.bestCombo || 0) >= 5 },
    { id: 'combo-10', n: 'Imparável', d: 'Combo de 10 acertos seguidos', ic: 'x10', test: s => (s.bestCombo || 0) >= 10 },
    { id: 'combo-20', n: 'Modo flow', d: 'Combo de 20 acertos seguidos', ic: 'x20', test: s => (s.bestCombo || 0) >= 20 },
    { id: 'crit-1', n: 'Golpe de sorte', d: 'Tire seu primeiro acerto CRÍTICO (XP em dobro)', ic: 'CR', test: s => (s.crits || 0) >= 1 },
    { id: 'stars-3', n: 'Três estrelas', d: 'Gabarite de primeira uma lição (3 estrelas)', ic: '★★★', test: () => Course.allLessons().some(l => lessonStars(l.id) === 3) },
    { id: 'stars-50', n: 'Constelação', d: 'Junte 50 estrelas', ic: '50★', test: () => totalStars() >= 50 },
    { id: 'stars-all', n: 'Perfeccionista', d: '3 estrelas em todas as lições', ic: 'MAX', test: () => Course.allLessons().every(l => lessonStars(l.id) === 3) },
    { id: 'chest-1', n: 'Baú aberto', d: 'Complete as 3 quests de um dia', ic: 'Q3', test: s => (s.chests || 0) >= 1 },
    { id: 'chest-7', n: 'Rotina de mesa', d: 'Abra 7 baús diários', ic: 'Q7', test: s => (s.chests || 0) >= 7 },
    { id: 'notes-10', n: 'Caderno de trader', d: 'Faça anotações em 10 lições', ic: 'NB', test: s => Object.entries(s.work || {}).filter(([k, w]) => Course.lessons[k] && w.notes && w.notes.trim()).length >= 10 },
    { id: 'tela-10', n: 'Olho de tela', d: 'Acerte 10 perguntas no "Caça na tela" (simulador Tela de Opções)', ic: 'TL', test: s => (s.counters.tela || 0) >= 10 },
    { id: 'desk-1', n: 'Assumiu a mesa', d: 'Feche seu primeiro dia como Head Trader', ic: 'HT', test: s => !!(s.desk && s.desk.stats.days >= 1) },
    { id: 'desk-green5', n: 'Semana no verde', d: 'Feche 5 dias com PnL positivo na Mesa', ic: 'W5', test: s => !!(s.desk && s.desk.stats.green >= 5) },
    { id: 'desk-clean3', n: 'Risco aprova', d: 'Feche 3 dias no verde sem estourar nenhum limite', ic: 'OK', test: s => !!(s.desk && s.desk.stats.clean >= 3) },
    { id: 'desk-rfq10', n: 'Cliente preferido', d: 'Ganhe 10 RFQs de clientes na Mesa', ic: 'RFQ', test: s => !!(s.desk && s.desk.stats.rfqWon >= 10) },
    { id: 'read-1', n: 'Abriu o livro', d: 'Marque o primeiro capítulo lido na Biblioteca', ic: 'LIV', test: s => Object.keys(s.reading || {}).length >= 1 },
    { id: 'read-10', n: 'Rato de biblioteca', d: 'Leia 10 capítulos indicados pelo curso', ic: 'L10', test: s => Object.keys(s.reading || {}).length >= 10 },
    { id: 'read-30', n: 'Estante de quant', d: 'Leia 30 capítulos indicados pelo curso', ic: 'L30', test: s => Object.keys(s.reading || {}).length >= 30 },
    { id: 'read-books', n: 'Leitor dos clássicos', d: 'Leia ao menos um capítulo de cada livro da pasta (Hull, Wilmott ×2, Wilmott-Howison-Dewynne, Elliott & Kopp, Focardi & Fabozzi)', ic: '6/6', test: s => ['hull', 'wil', 'der', 'mfd', 'ek', 'ff'].every(b => Object.keys(s.reading || {}).some(k => k.startsWith(b + '|'))) },
    { id: 'sheet-5', n: 'Excel da mesa', d: 'Use a planilha em 5 lições', ic: 'XL', test: s => Object.entries(s.work || {}).filter(([k, w]) => Course.lessons[k] && w.usedSheet).length >= 5 }
  ];
  function nLessons(s) { return Object.values(s.lessons).filter(l => l.done).length; }
  function checkBadges() {
    BADGES.forEach(b => {
      if (state.badges[b.id]) return;
      let ok = false; try { ok = b.test(state); } catch (e) { }
      if (ok) { state.badges[b.id] = new Date().toISOString(); emit('badge', b); }
    });
  }

  /* ------------ tempo de estudo ------------ */
  let lastActivity = Date.now();
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(ev => window.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.hidden || Date.now() - lastActivity > 120000) return;
    const t = today(); state.minutes[t] = (state.minutes[t] || 0) + 1; save();
  }, 60000);

  function setLast(route, title) { state.last = { route, title, at: new Date().toISOString() }; save(); }

  /* ------------ bancada: notas e planilha por contexto ------------ */
  function work(ctx) { state.work = state.work || {}; return state.work[ctx] || (state.work[ctx] = { notes: '', sheet: {} }); }
  function saveNotes(ctx, txt) {
    const w = work(ctx), had = !!(w.notes && w.notes.trim());
    w.notes = txt; w.updated = new Date().toISOString();
    if (!had && txt.trim().length >= 3) questProgress('notes', 1);
    save(); checkBadges();
  }
  function saveSheet(ctx, cells, usedFormula) {
    const w = work(ctx); w.sheet = cells; w.updated = new Date().toISOString();
    if (usedFormula && !w.usedSheet) { w.usedSheet = true; questProgress('sheet', 1); }
    save(); checkBadges();
  }

  /* ------------ leitura dos livros ------------ */
  function isRead(key) { return !!(state.reading || {})[key]; }
  function markRead(key, on) {
    state.reading = state.reading || {};
    if (on && !state.reading[key]) { state.reading[key] = new Date().toISOString(); addXP(XP.read, 'leitura'); emit('read', { key, on: true }); }
    else if (!on && state.reading[key]) { delete state.reading[key]; emit('read', { key, on: false }); }
    save(); checkBadges();
  }

  function exportJSON() { return JSON.stringify(state, null, 1); }
  function importJSON(txt) { const s = JSON.parse(txt); if (!s || typeof s !== 'object' || s.xp == null) throw new Error('Arquivo inválido'); state = Object.assign(defaults(), s); save(true); }
  function reset() { state = defaults(); save(true); }

  global.Store = {
    load, save, flush, on, today, dayDiff, levelInfo, LEVELS, XP, BADGES,
    get s() { return state; },
    addXP, exerciseResult, completeLesson, comboHit, comboMult, session, lessonStars, totalStars, ensureQuests, questProgress, work, saveNotes, saveSheet, isRead, markRead, lessonDone, unitLessonsDone, unitProgress, examPassed, unitUnlocked, trackUnlocked, examUnlocked,
    examResult, missionResult, useSim, dueCards, cardDef, reviewCard, checkBadges, streakAlive, setLast, recordAttempt,
    exportJSON, importJSON, reset
  };
})(window);
