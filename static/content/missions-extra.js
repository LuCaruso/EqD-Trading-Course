/* Missões extras (v4): delta one/aluguel e o calendar "comprar vega, vender gamma" */
(function () {
const bs = (t, S, K, T, r, s, q) => Q.bs(t, S, K, T, r, q || 0, s);
const num = (q, a, e, o) => Object.assign({ t: 'num', q, a, e, tol: 0.01 }, o || {});
const mcq = (q, opts, a, e) => ({ t: 'mcq', q, o: opts, a, e });

Course.mission({ id: 'm-br1b', unit: 'br1', title: 'A mesa de delta one: termo, aluguel e recall',
  brief: 'Um family office quer "aplicar via termo" e a mesa precisa montar um reverse em outro papel. Calcule a taxa, o custo do aluguel e reaja ao recall.',
  gen: R => {
    const S = R.f(18, 45, 2), du = R.pick([21, 42, 63]), iT = R.f(0.1, 0.16, 4), Fw = Math.round(S * Math.pow(1 + iT, du / 252) * 100) / 100;
    const impl = Math.pow(Fw / S, 252 / du) - 1, di = R.f(0.1, 0.14, 4), cost = 0.003;
    const qt = R.int(20, 80) * 1000, C = R.f(10, 50, 2), b = R.f(1, 15, 1) / 100, d2 = R.int(10, 40);
    const fee = qt * C * b * d2 / 252;
    return [
      { who: 'sales', narr: `"O family office compra ${F.r(S)} à vista e vende o termo de ${du} d.u. a ${F.r(Fw)}. Que taxa ele trava?"`, ex: num('Taxa implícita (% a.a., base 252)?', impl * 100, `(F/S)^{252/du} − 1 = (${Q.fmt(Fw, 2)}/${Q.fmt(S, 2)})^{252/${du}} − 1 = ${Q.fmt(impl * 100, 2)}%.`, { tol: 0, tolAbs: 0.05, dec: 2 }) },
      { who: 'trader', narr: `"DI do prazo em ${F.p(di, 2)} e custos de ~0,3% a.a. O trade faz sentido para quem aplica?"`, ex: mcq('Decisão:', ['Sim: a taxa travada supera DI + custos', 'Não: a taxa travada fica abaixo de DI + custos', 'Indiferente sempre', 'Só se comprar calls'], impl > di + cost ? 0 : 1, `Implícita ${Q.fmt(impl * 100, 2)}% vs DI + custos ${Q.fmt((di + cost) * 100, 2)}%.`) },
      { who: 'BTC', narr: `"Para o reverse em outro papel, tomamos ${Q.fmt(qt, 0)} ações a R$ ${Q.fmt(C, 2)} no BTC, taxa ${Q.fmt(b * 100, 1)}% a.a., por ${d2} d.u."`, ex: num('Custo do aluguel (R$, sem tarifas)?', fee, `Q·C·i·du/252 = ${Q.fmt(qt, 0)}·${Q.fmt(C, 2)}·${Q.fmt(b, 3)}·${d2}/252 = ${Q.fmt(fee, 2)}.`, { tol: 0.003, dec: 2 }) },
      { who: 'operações', narr: '"O doador pediu as ações de volta (recall) e o papel está difícil de alugar."', ex: mcq('O que a mesa precisa fazer?', ['Nada, o contrato segue', 'Devolver as ações no prazo: tomar de outro doador (provavelmente mais caro) ou recomprar no mercado e desmontar o reverse', 'Vender mais ações', 'Exercer calls'], 1, 'O recall obriga a devolver; o risco é recomprar num mercado apertado (squeeze).') }
    ];
  } });

Course.mission({ id: 'm-br5b', unit: 'br5', title: 'O calendar do gestor: comprar vega, vender gamma',
  brief: 'Um gestor quer ficar comprado em vol implícita longa sem sangrar theta. Monte o calendar, meça as gregas líquidas e explique o PnL de um dia de estresse.',
  gen: R => {
    const S = 100, K = 100, r = 0.1, s1 = R.f(0.28, 0.4, 2), s2 = R.f(0.24, 0.32, 2), d1 = R.pick([21, 42]), d2 = R.pick([252, 378]), n1 = 1000, n2 = R.int(6, 12) * 100;
    const a = bs('call', S, K, d1 / 252, r, s1), b = bs('call', S, K, d2 / 252, r, s2);
    const vega = (-n1 * a.vega + n2 * b.vega) / 100, gam = -n1 * a.gamma + n2 * b.gamma, th = (-n1 * a.theta + n2 * b.theta) / 252;
    const dS = -R.f(3, 6, 1), dv1 = R.f(4, 8, 1), dv2 = R.f(1, 3, 1);
    const pnl = 0.5 * gam * dS * dS + (-n1 * a.vega / 100) * dv1 + (n2 * b.vega / 100) * dv2 + th;
    return [
      { who: 'gestor', narr: '"Quero ganhar se a vol implícita de 1 ano subir, mas não quero pagar theta todo dia. O que você me sugere?"', ex: mcq('Estrutura:', ['Comprar straddle de 1 mês', 'Long calendar: vender o curto e comprar o longo', 'Vender straddle de 1 ano', 'Comprar futuro'], 1, 'Long calendar = long vega (longo), short gamma (curto), theta positivo.') },
      { who: 'trader', narr: `Montagem: vende ${n1} calls ATM de ${d1} d.u. (vol ${F.p(s1, 0)}) e compra ${n2} calls ATM de ${d2} d.u. (vol ${F.p(s2, 0)}). S = K = 100, r = 10%.`, ex: num('Vega líquida (R$ por ponto de vol)?', vega, `−${n1}·${Q.fmt(a.vega / 100, 4)} + ${n2}·${Q.fmt(b.vega / 100, 4)} = ${Q.fmt(vega, 2)}.`, { tol: 0.02, tolAbs: 1, dec: 2 }) },
      { who: 'risco', narr: '"E o theta do conjunto, por dia útil?"', ex: num('Theta líquido (R$/dia)?', th, `(−${n1}·Θ₁ + ${n2}·Θ₂)/252 = ${Q.fmt(th, 2)}.`, { tol: 0.02, tolAbs: 0.5, dec: 2 }) },
      { who: 'head', narr: `Dia de estresse: o spot cai ${Q.fmt(-dS, 1)} (de 100), a vol de ${d1} d.u. sobe ${Q.fmt(dv1, 1)} pts e a de ${d2} d.u. sobe ${Q.fmt(dv2, 1)} pts. Suponha a posição delta-hedgeada. Γ líquido = ${Q.fmt(gam, 3)}.`, ex: num('PnL aproximado do dia (R$) = ½Γ(δS)² + vegas × δσ + theta?', pnl, `½·${Q.fmt(gam, 3)}·${Q.fmt(dS * dS, 2)} + (−${Q.fmt(n1 * a.vega / 100, 1)})·${Q.fmt(dv1, 1)} + ${Q.fmt(n2 * b.vega / 100, 1)}·${Q.fmt(dv2, 1)} + ${Q.fmt(th, 1)} = ${Q.fmt(pnl, 0)}. ${pnl < 0 ? 'A vol curta subiu mais que a longa e o short gamma pesou: o calendar perde no estresse mesmo sendo "long vega".' : 'Aqui a vega longa compensou o short gamma e a alta da vol curta — mas note como o resultado é sensível à diferença entre os dois movimentos de vol.'}`, { tol: 0.03, tolAbs: 5, dec: 0 }) }
    ];
  } });
})();

/* v7 — eventos corporativos */
(function () {
const num = (q, a, e, o) => Object.assign({ t: 'num', q, a, e, tol: 0.01 }, o || {});
const mcq = (q, opts, a, e) => ({ t: 'mcq', q, o: opts, a, e });
Course.mission({ id: 'm-br2b', unit: 'br2', title: 'Data ex no livro: dividendos, ajuste de strike e desdobramento',
  brief: 'Amanhã uma ação do livro fica ex-dividendos e outra desdobra. Calcule o que muda no preço, nos strikes, nas quantidades e no caixa — antes que o PnL do dia saia errado.',
  gen: R => {
    const S = R.f(25, 60, 2), D = R.f(0.4, 2.2, 2), K = Math.round(S * R.f(0.92, 1.05, 2)), qo = -R.int(2, 10) * 10000, qs = R.int(1, 5) * 10000;
    const K2 = R.int(30, 90), N = R.pick([2, 4, 5]), q2 = R.int(1, 10) * 1000;
    return [
      { who: 'operações', narr: `"PETX3 (fictícia) fecha hoje a ${F.r(S)} e fica ex-dividendos de ${F.r(D)} amanhã. Você está vendido em ${Q.fmt(-qo, 0)} calls de strike ${K} e comprado em ${Q.fmt(qs, 0)} ações de hedge."`, ex: num('Preço teórico de abertura na data ex (R$)?', S - D, `S_ex = ${Q.fmt(S, 2)} − ${Q.fmt(D, 2)} = ${Q.fmt(S - D, 2)}.`, { tol: 0, tolAbs: 0.006, dec: 2 }) },
      { who: 'risco', narr: '"E o strike das suas calls listadas, como fica?"', ex: num('Strike ajustado (R$)?', K - D, `K − D = ${K} − ${Q.fmt(D, 2)} = ${Q.fmt(K - D, 2)}.`, { tol: 0, tolAbs: 0.006, dec: 2 }) },
      { who: 'PnL', narr: '"Quanto de provento a carteira de ações do hedge tem a receber?"', ex: num('Provento a receber (R$)?', qs * D, `${Q.fmt(qs, 0)} × ${Q.fmt(D, 2)} = ${Q.fmt(qs * D, 2)}. Sem lançar esse valor, o PnL do dia mostra uma perda que não existe.`, { tol: 0.001, tolAbs: 1, dec: 0 }) },
      { who: 'operações', narr: `"Outra: SIDX3 (fictícia) desdobra de 1 para ${N}. Você tem ${Q.fmt(q2, 0)} puts de strike ${K2}."`, ex: num('Nova quantidade de puts?', q2 * N, `Quantidade × ${N} = ${Q.fmt(q2 * N, 0)}; o strike vira ${Q.fmt(K2 / N, 2)}.`, { tol: 0, tolAbs: 0.5, dec: 0 }) },
      { who: 'head', narr: '"Se essas opções fossem americanas nos EUA, sem ajuste por dividendo ordinário, o que você temeria no livro vendido em calls ITM na véspera da data ex?"', ex: mcq('Risco principal:', ['Nenhum', 'Exercício antecipado (assignment) pelos titulares para capturar o dividendo', 'Ajuste do strike', 'Aumento de vega'], 1, 'Sem ajuste, exercer na véspera captura o dividendo: quem está vendido é exercido e perde o provento.') }
    ];
  } });
})();
