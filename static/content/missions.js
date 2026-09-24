/* Missões "Dia na mesa" — cenários com números aleatórios */
(function () {
const bs = (t, S, K, T, r, s, q) => Q.bs(t, S, K, T, r, q || 0, s);
const num = (q, a, e, o) => Object.assign({ t: 'num', q, a, e, tol: 0.01 }, o || {});
const mcq = (q, opts, a, e) => ({ t: 'mcq', q, o: opts, a, e });

/* ===== BRASIL ===== */
Course.mission({ id: 'm-br1', unit: 'br1', title: 'Primeiro dia: o hedge do fundo',
  brief: 'Um gestor de fundo liga para a mesa querendo proteger a carteira com futuros de Ibovespa. Você precisa calcular exposição, preço justo do futuro e o ajuste do dia.',
  gen: R => { const cart = R.int(20, 120) * 1e6, idx = R.step(118000, 140000, 500), i = R.f(0.1, 0.14, 4), du = R.pick([21, 42, 63]); const F0 = idx * Math.pow(1 + i, du / 252); const n = Math.round(cart / idx); const mv = R.step(-2000, 2000, 50);
    return [
      { who: 'sales', narr: `"O fundo tem R$ ${Q.fmt(cart / 1e6, 0)} milhões em ações com beta 1 contra o Ibovespa, hoje em ${Q.fmt(idx, 0)} pontos. Ele quer zerar a exposição com IND (R$ 1/ponto)."`, ex: num('Quantos contratos IND vender (arredonde ao inteiro)?', n, `R$ ${Q.fmt(cart, 0)} / ${Q.fmt(idx, 0)} ≈ ${n} contratos.`, { tolAbs: 1, tol: 0, dec: 0 }) },
      { who: 'trader sênior', narr: `"Antes de fechar, confere o preço justo do futuro. DI do prazo ${F.p(i, 2)}, ${du} dias úteis, e considere dividendos desprezíveis."`, ex: num('Preço justo do IND (pontos)?', F0, `F = ${Q.fmt(idx, 0)} × (1+${Q.fmt(i, 4)})^(${du}/252) = ${Q.fmt(F0, 0)}.`, { tol: 0.0005, dec: 0 }) },
      { who: 'risco', narr: `O cliente vendeu ${n} IND a ${Q.fmt(Math.round(F0), 0)}. No fim do dia, o ajuste veio em ${Q.fmt(Math.round(F0) + mv, 0)}.`, ex: num('Ajuste do dia para o cliente (R$, + recebe / − paga)?', -n * mv, `Vendido: −${n} × (${mv}) × R$1 = ${Q.fmt(-n * mv, 0)}.`, { tolAbs: 1, tol: 0, dec: 0 }) },
      { who: 'head', narr: '"E o que acontece com o resultado total do fundo (ações + futuros) se a bolsa cair 10%?"', ex: mcq('Resultado aproximado:', ['Perde 10% da carteira', 'Fica aproximadamente zerado (hedge compensa)', 'Ganha 10%', 'Perde 20%'], 1, 'Com beta 1 e hedge integral, a perda nas ações é compensada pelo ganho nos futuros vendidos (a menos de base e tracking).') }
    ]; } });

Course.mission({ id: 'm-br2', unit: 'br2', title: 'O cliente do lançamento coberto',
  brief: 'Um cliente de varejo quer "fazer renda" vendendo calls da PETR4 que tem em carteira. Explique o risco, calcule resultados e ache a arbitragem que apareceu na tela.',
  gen: R => { const S = R.f(30, 42, 2), K = Math.round(S * 1.05), c = R.f(0.5, 1.4, 2), ST = S * (1 + R.f(-0.2, 0.2, 3)); const res = Math.min(ST, K) - S + c; const r = 0.12, T = 0.25, Kb = Math.round(S); const cc = R.f(1.5, 2.5, 2); const pfair = cc - S + Kb * Math.exp(-r * T); const pm = pfair + R.pick([-0.4, 0.4]);
    return [
      { who: 'cliente', narr: `"Tenho PETR4 comprada a ${F.r(S)}. Quero vender a call ${K} por ${F.r(c)}. Quanto ganho no máximo?"`, ex: num('Lucro máximo por ação (R$)?', K - S + c, `(K − S0) + prêmio = ${Q.fmt(K - S + c, 2)}.`, { tolAbs: 0.01, tol: 0, dec: 2 }) },
      { who: 'mercado', narr: `No vencimento, PETR4 fechou a ${F.r(ST)}.`, ex: num('Resultado do cliente por ação (R$)?', res, `min(S_T, K) − S0 + prêmio = ${Q.fmt(res, 2)}.`, { tolAbs: 0.01, tol: 0, dec: 2 }) },
      { who: 'trader', narr: '"Explica para o cliente qual o risco de verdade dessa estratégia."', ex: mcq('O lançamento coberto equivale a:', ['Comprar call', 'Vender put (mais renda fixa): perde quase toda a queda, ganho limitado', 'Straddle', 'Sem risco'], 1, 'Paridade: S − C = −P + K·e^{−rT}.') },
      { who: 'tela', narr: `Na tela: S = ${F.r(S)}, call europeia ${Kb} a ${F.r(cc)}, put europeia ${Kb} a ${F.r(pm)}, 3 meses, r contínua 12%, sem dividendos.`, ex: mcq('Qual operação captura a arbitragem?', pm > pfair ? ['Vender put, comprar call, vender ação (reversão)', 'Comprar put, vender call, comprar ação (conversão)', 'Não há arbitragem', 'Comprar as duas opções'] : ['Vender put, comprar call, vender ação (reversão)', 'Comprar put, vender call, comprar ação (conversão)', 'Não há arbitragem', 'Comprar as duas opções'], pm > pfair ? 0 : 1, `Put justa pela paridade = ${Q.fmt(pfair, 3)}. A put está ${pm > pfair ? 'cara: venda-a e compre o sintético (call − ação + caixa)' : 'barata: compre-a (conversão: ação + put − call)'}.`) }
    ]; } });

Course.mission({ id: 'm-br3', unit: 'br3', title: 'Precifique a opção do cliente',
  brief: 'Um cliente institucional pede preço de uma put de VALE3. Você vai do binomial ao Black-Scholes, com a convenção brasileira de juros.',
  gen: R => { const S = R.f(55, 70, 2), K = Math.round(S * R.f(0.93, 1.02, 2)), du = R.pick([42, 63, 84]), i = R.f(0.1, 0.14, 4), s = R.f(0.25, 0.4, 2); const T = du / 252, r = Math.log(1 + i); const g = bs('put', S, K, T, r, s); const u = Math.exp(s * Math.sqrt(T)), d = 1 / u, p = (Math.exp(r * T) - d) / (u - d);
    return [
      { who: 'quant', narr: `"Começa pela intuição: árvore de 1 passo com σ = ${F.p(s, 0)}, T = ${du}/252, DI ${F.p(i, 2)}."`, ex: num('Probabilidade neutra a risco p* (CRR, 1 passo)?', p, `u = e^{σ√T} = ${Q.fmt(u, 4)}, d = ${Q.fmt(d, 4)}, p* = (e^{rT} − d)/(u − d) = ${Q.fmt(p, 4)}.`, { tol: 0.002, dec: 4 }) },
      { who: 'trader', narr: `"Agora o BS de verdade: S = ${F.r(S)}, K = ${K}, ${du} du, DI ${F.p(i, 2)} (converter!), vol ${F.p(s, 0)}, sem dividendos."`, ex: num('Preço BS da put (R$)?', g.price, `r = ln(1+i) = ${Q.fmt(r, 5)}; d1 = ${Q.fmt(g.d1, 4)}; put = ${Q.fmt(g.price, 4)}.`, { tol: 0.006, dec: 4 }) },
      { who: 'cliente', narr: '"Qual a chance (neutra a risco) de essa put ser exercida?"', ex: num('N(−d2) em %?', (1 - g.nd2) * 100, `N(−d2) = ${Q.fmt((1 - g.nd2) * 100, 2)}%.`, { tolAbs: 0.3, tol: 0, dec: 2 }) },
      { who: 'sales', narr: `"O cliente acha caro. Se a vol fosse 2 pontos menor, quanto baixaria o prêmio (aprox.)?"`, ex: num('Redução aproximada (R$) = vega × 2 pts?', g.vega / 100 * 2, `Vega/pt = ${Q.fmt(g.vega / 100, 4)} ⇒ × 2 = ${Q.fmt(g.vega / 50, 4)}.`, { tol: 0.01, dec: 4 }) }
    ]; } });

Course.mission({ id: 'm-br4', unit: 'br4', title: 'Relatório de risco da manhã',
  brief: 'O head da mesa quer as gregas do livro de opções de BOVA11 antes da abertura, e o que acontece se o mercado andar.',
  gen: R => { const S = R.f(115, 135, 2), n1 = R.int(10, 40) * 1000, n2 = R.int(10, 40) * 1000, K1 = Math.round(S * 1.03), K2 = Math.round(S * 0.95), T = R.pick([21, 42]) / 252, r = Math.log(1.11), s = R.f(0.18, 0.3, 2); const c = bs('call', S, K1, T, r, s), p = bs('put', S, K2, T, r, s); const D = -n1 * c.delta + n2 * p.delta, G = -n1 * c.gamma + n2 * p.gamma, V = (-n1 * c.vega + n2 * p.vega) / 100, Th = (-n1 * c.theta + n2 * p.theta) / 252; const mv = R.pick([-2, -1, 1, 2]);
    return [
      { who: 'head', narr: `Livro: vendido ${Q.fmt(n1, 0)} calls ${K1} e comprado ${Q.fmt(n2, 0)} puts ${K2}, ${Math.round(T * 252)} du, BOVA11 a ${F.r(S)}, vol ${F.p(s, 0)} flat, DI 11%.`, ex: num('Delta do livro (em cotas)?', D, `−${n1}×${Q.fmt(c.delta, 4)} + ${n2}×(${Q.fmt(p.delta, 4)}) = ${Q.fmt(D, 0)}.`, { tol: 0.01, tolAbs: 20, dec: 0 }) },
      { who: 'head', narr: '"E vega por ponto de vol?"', ex: num('Vega do livro (R$ por ponto)?', V, `(−${n1}×${Q.fmt(c.vega / 100, 4)} + ${n2}×${Q.fmt(p.vega / 100, 4)}) = ${Q.fmt(V, 0)}.`, { tol: 0.01, tolAbs: 20, dec: 0 }) },
      { who: 'head', narr: '"Theta por dia útil?"', ex: num('Theta (R$/dia útil)?', Th, `Σ qty × Θ/252 = ${Q.fmt(Th, 0)}.`, { tol: 0.02, tolAbs: 20, dec: 0 }) },
      { who: 'risco', narr: `"Se o mercado abrir ${mv > 0 ? '+' : ''}${mv}% e você estiver delta-neutro, qual o PnL de gamma (½Γ(δS)²)?"`, ex: num('PnL de gamma (R$)?', 0.5 * G * Math.pow(S * mv / 100, 2), `Γ livro = ${Q.fmt(G, 2)}; ½·Γ·(${Q.fmt(S * mv / 100, 3)})² = ${Q.fmt(0.5 * G * Math.pow(S * mv / 100, 2), 0)}.`, { tol: 0.02, tolAbs: 5, dec: 0 }) }
    ]; } });

Course.mission({ id: 'm-br5', unit: 'br5', title: 'RFQ: o cliente quer comprar vol',
  brief: 'Chega um pedido de preço de straddle ATM. Você cota em vol, fecha com delta cruzado e depois acompanha o PnL do gamma scalping.',
  gen: R => { const S = R.f(30, 45, 2), K = Math.round(S), du = 42, T = du / 252, r = Math.log(1.12), mid = R.f(26, 34, 1), w = 1; const ask = mid + w / 2; const c = bs('call', S, K, T, r, ask / 100), p = bs('put', S, K, T, r, ask / 100); const n = R.int(10, 50) * 1000; const D = n * (c.delta + p.delta); const V = n * (c.vega + p.vega) / 100; const rv = mid + R.f(-6, 6, 1);
    return [
      { who: 'sales', narr: `"Cliente quer comprar ${Q.fmt(n, 0)} straddles ${K} de ${du} du. Me mostra um two-way. O mid da sua superfície é ${Q.fmt(mid, 1)} e você cota 1 vol de largura."`, ex: num('Seu ask em vol?', ask, `mid + 0,5 = ${Q.fmt(ask, 1)}.`, { tolAbs: 0.01, tol: 0, dec: 1 }) },
      { who: 'sales', narr: `"Fechou a ${Q.fmt(ask, 1)}, com delta, referência ${F.r(S)}." (DI 12%)`, ex: num('Prêmio do straddle por unidade (R$)?', c.price + p.price, `call ${Q.fmt(c.price, 4)} + put ${Q.fmt(p.price, 4)} = ${Q.fmt(c.price + p.price, 4)}.`, { tol: 0.006, dec: 4 }) },
      { who: 'trader', narr: '"O straddle não é exatamente delta zero. Quantas ações o cliente troca com você na referência?"', ex: num(`Delta da posição do cliente (${Q.fmt(n, 0)} straddles), em ações?`, D, `n × (Δc + Δp) = ${Q.fmt(n, 0)} × ${Q.fmt(c.delta + p.delta, 4)} = ${Q.fmt(D, 0)} (a mesa compra/vende isso do cliente para ficar neutra).`, { tol: 0.03, tolAbs: 30, dec: 0 }) },
      { who: 'head', narr: `Você ficou vendido em vol a ${Q.fmt(ask, 1)}. Até o vencimento, a ação realiza ${Q.fmt(rv, 1)}.`, ex: num('PnL aproximado da mesa (vega × (σi − σr)), em R$?', V * (ask - rv), `Vega da posição ≈ ${Q.fmt(V, 0)}/pt; PnL ≈ ${Q.fmt(V, 0)} × (${Q.fmt(ask, 1)} − ${Q.fmt(rv, 1)}) = ${Q.fmt(V * (ask - rv), 0)}.`, { tol: 0.02, tolAbs: 50, dec: 0 }) }
    ]; } });

Course.mission({ id: 'm-br6', unit: 'br6', title: 'A fence da exportadora',
  brief: 'Uma empresa quer proteger a carteira de ações de tesouraria com uma estrutura "custo zero". Você monta, explica os cenários e mede o impacto no livro.',
  gen: R => { const S = 100, K1 = R.pick([95, 97]), K2 = R.pick([85, 88]), Kc = R.pick([108, 110, 112]), ST = R.f(70, 125, 1);     const T = 0.5, r = 0.1, s = 0.25; const g = { v: (-bs('put', S, K1, T, r, s).vega + bs('put', S, K2, T, r, s).vega + bs('call', S, Kc, T, r, s).vega) / 100 };
    return [
      { who: 'cliente', narr: `"Quero: comprar put ${K1}, vender put ${K2} e vender call ${Kc}, 6 meses, ação a 100."`, ex: mcq('Como se chama essa estrutura (com a ação)?', ['Collar', 'Fence', 'Seagull puro', 'Box'], 1, 'Put spread comprado + call vendida sobre a ação = fence.') },
      { who: 'cliente', narr: `"Se no vencimento a ação estiver em ${Q.fmt(ST, 1)}, quanto vale minha carteira por ação (ação + opções)?"`, ex: num('Valor por ação no vencimento?', ST + Math.max(K1 - ST, 0) - Math.max(K2 - ST, 0) - Math.max(ST - Kc, 0), `S + max(${K1}−S,0) − max(${K2}−S,0) − max(S−${Kc},0) = ${Q.fmt(ST + Math.max(K1 - ST, 0) - Math.max(K2 - ST, 0) - Math.max(ST - Kc, 0), 2)}.`, { tolAbs: 0.01, tol: 0, dec: 2 }) },
      { who: 'trader', narr: '"A mesa é a contraparte. Que vega a mesa fica, por unidade (vol 25% flat, r 10%)?" (a mesa vende a put ' + K1 + ', compra a ' + K2 + ' e compra a call ' + Kc + ')', ex: num('Vega da mesa por unidade (por ponto)?', g.v, `Mesa: −put${K1} + put${K2} + call${Kc} ⇒ vega = ${Q.fmt(g.v, 4)}/pt.`, { tol: 0.03, tolAbs: 0.001, dec: 4 }) },
      { who: 'head', narr: '"Qual o risco de cauda que o cliente não está vendo?"', ex: mcq('Resposta:', ['Nenhum, é custo zero', `Abaixo de ${K2}, a proteção acaba e ele volta a perder com a ação`, 'Risco de juros', 'Risco de dividendos'], 1, 'A put vendida devolve a cauda ao cliente.') }
    ]; } });

Course.mission({ id: 'm-br7', unit: 'br7', title: 'O tubarão e a barreira',
  brief: 'A mesa vendeu calls up-and-out ("tubarão") para clientes de um COE. O mercado sobe em direção à barreira. Gerencie.',
  gen: R => { const S0 = 100, K = 100, H = R.pick([115, 120, 125]), T = 0.5, r = 0.1, s = R.f(0.2, 0.3, 2); const p0 = Q.barrier('cuo', S0, K, H, T, r, 0, s, 0), v0 = Q.bsPrice('call', S0, K, T, r, 0, s); const S1 = H - R.f(1, 3, 1); const g1 = Q.fdGreeks((S, TT, v) => Q.barrier('cuo', S, K, H, TT, r, 0, v, 0), S1, T - 0.1, s);
    return [
      { who: 'estruturação', narr: `Call UO: K = 100, H = ${H}, 6 meses, vol ${F.p(s, 0)}, r 10%. A vanilla vale ${Q.fmt(v0, 3)}.`, ex: num('Preço da call up-and-out?', p0, `Reiner-Rubinstein: ${Q.fmt(p0, 3)} (${Q.fmt(p0 / v0 * 100, 0)}% da vanilla).`, { tol: 0.015, tolAbs: 0.01, dec: 3 }) },
      { who: 'estruturação', narr: '"E a call up-and-in correspondente, sem rebate?"', ex: num('Preço da up-and-in?', v0 - p0, `Paridade: vanilla − UO = ${Q.fmt(v0 - p0, 3)}.`, { tol: 0.015, tolAbs: 0.01, dec: 3 }) },
      { who: 'mercado', narr: `Semanas depois, o spot está em ${Q.fmt(S1, 1)}, colado na barreira ${H}.`, ex: mcq('O delta da call UO (para o titular) agora é:', ['Perto de 1', 'Negativo', 'Exatamente zero', 'Igual ao da vanilla'], 1, `Perto da barreira reverse, o delta fica negativo (FD: ${Q.fmt(g1.delta, 3)}).`) },
      { who: 'head', narr: '"Estamos vendidos nessas UO. Se a barreira bater, o que acontece com nosso hedge?"', ex: mcq('Resposta:', ['Nada', 'O delta das opções vai a zero de uma vez: precisamos desmontar o hedge rapidamente no nível da barreira', 'Recebemos rebate', 'Precisamos comprar mais ações'], 1, 'Salto de delta ⇒ desmontagem do hedge; por isso barrier shift e limites de concentração.') }
    ]; } });

Course.mission({ id: 'm-br8', unit: 'br8', title: 'Copom, DI e dólar',
  brief: 'Dia de Copom. O livro de COEs tem rho relevante e um cliente pede um forward de dólar. Calcule e hedgeie.',
  gen: R => { const t = R.f(0.11, 0.15, 4), du = R.pick([252, 504]), rho = R.int(-80, -10) * 1000; const dv = Q.BR.dv01DI(t, du); const n = Math.round(-rho / dv); const S = R.f(4.9, 5.7, 4), c = R.f(0.03, 0.06, 4), du2 = 63, dc = 91; const Fw = S * Math.pow(1 + t, du2 / 252) / (1 + c * dc / 360); const pc = R.f(0.3, 0.8, 2);
    return [
      { who: 'risco', narr: `O livro perde R$ ${Q.fmt(-rho, 0)} para cada +1 bp na taxa de ${du} du (DI a ${F.p(t, 2)}).`, ex: num('DV01 de um DI1 desse vértice (R$)?', dv, `PU(${Q.fmt(t * 100, 2)}%) − PU(+1bp) = ${Q.fmt(dv, 2)}.`, { tol: 0.01, dec: 2 }) },
      { who: 'trader', narr: '"Para neutralizar, você toma ou dá DI, e quantos contratos?"', ex: mcq(`Hedge (≈ ${n} contratos):`, [`Tomar ${n} DI1 (ganha se a taxa subir)`, `Dar ${n} DI1`, 'Comprar dólar', 'Nada'], 0, 'O livro perde com alta de taxa ⇒ tomar DI (ganha com alta) compensa.') },
      { who: 'sales', narr: `"Cliente quer comprar dólar a termo em 63 du (91 dc). Spot ${Q.fmt(S, 4)}, cupom ${F.p(c, 2)}."`, ex: num('Forward justo (R$/US$)?', Fw, `${Q.fmt(S, 4)}·(1+${Q.fmt(t, 4)})^(63/252)/(1+${Q.fmt(c, 4)}·91/360) = ${Q.fmt(Fw, 4)}.`, { tol: 0.0005, dec: 4 }) },
      { who: 'mesa de juros', narr: `A opção digital de Copom "corte de 50 bps" está a R$ ${Q.fmt(pc, 2)}.`, ex: num('Probabilidade implícita do corte (%)?', pc * 100, `≈ preço da digital (desconto desprezível): ${Q.fmt(pc * 100, 0)}%.`, { tolAbs: 1, tol: 0, dec: 0 }) }
    ]; } });

Course.mission({ id: 'm-br9', unit: 'br9', title: 'Estruturando o COE',
  brief: 'A área comercial quer lançar um COE de capital protegido em Ibovespa. Você define a participação, o teto e o risco para o livro.',
  gen: R => { const i = R.f(0.11, 0.15, 4), anos = 2, N = 1000; const zc = N / Math.pow(1 + i, anos); const bud = N - zc; const m = R.f(25, 45, 0); const cs = R.f(14, 20, 1); const part = (bud - m) / (cs * 10) * 100; const ret = R.f(-0.2, 0.5, 3);
    return [
      { who: 'comercial', narr: `COE de R$ 1.000, 2 anos (504 du), DI do prazo ${F.p(i, 2)}.`, ex: num('Custo do zero-cupom (R$)?', zc, `1000/(1+${Q.fmt(i, 4)})² = ${Q.fmt(zc, 2)}.`, { tol: 0.001, dec: 2 }) },
      { who: 'estruturação', narr: `O call spread 100/140 de 2 anos custa ${Q.fmt(cs, 1)}% do nocional. A margem do banco é R$ ${Q.fmt(m, 0)}.`, ex: num('Participação máxima (%)?', part, `(${Q.fmt(bud, 2)} − ${Q.fmt(m, 0)})/(${Q.fmt(cs, 1)}% × 1000) = ${Q.fmt(part, 1)}%.`, { tol: 0.005, dec: 1 }) },
      { who: 'cliente', narr: `Oferecido com participação de ${Q.fmt(Math.floor(part), 0)}% e teto de 40% de alta. O Ibovespa variou ${F.p(ret, 1)}.`, ex: num('Resgate (R$)?', 1000 * (1 + Math.floor(part) / 100 * Math.min(Math.max(ret, 0), 0.4)), `1000 × (1 + ${Math.floor(part)}% × min(max(${Q.fmt(ret * 100, 1)}%,0),40%)).`, { tol: 0.001, dec: 2 }) },
      { who: 'head', narr: '"Qual risco dominante fica no nosso livro com essa emissão?"', ex: mcq('Resposta:', ['Long vega de 2 anos', 'Short vega de 2 anos (vendemos a call ATM líquida)', 'Nenhum', 'Long correlação'], 1, 'O banco entrega o call spread ao cliente: fica vendido em vol longa.') }
    ]; } });

Course.mission({ id: 'm-br10', unit: 'br10', title: 'O dia do Joesley',
  brief: 'Circuit breaker: o Ibovespa despenca e a vol explode. Faça o PnL explain, cheque os limites e calcule o IR de um cliente PF.',
  gen: R => { const D = R.int(-300, 300) * 1000, Gc = -R.int(100, 600) * 1000, V = -R.int(50, 300) * 1000, Th = R.int(20, 80) * 1000, mv = -R.f(7, 10, 1), dv = R.f(8, 14, 1); const pD = D * mv / 100, pG = 0.5 * Gc * mv * mv / 100, pV = V * dv; const tot = pD + pG + pV + Th; const act = tot * R.f(1.05, 1.3, 2); const g = R.int(5, 40) * 1000;
    return [
      { who: 'risco', narr: `Gregas de ontem: delta cash R$ ${Q.fmt(D, 0)}, gamma cash R$ ${Q.fmt(Gc, 0)} por 1%, vega R$ ${Q.fmt(V, 0)}/pt, theta +R$ ${Q.fmt(Th, 0)}/dia. Hoje: Ibovespa ${Q.fmt(mv, 1)}%, vol +${Q.fmt(dv, 1)}.`, ex: num('PnL explicado (delta + gamma + vega + theta), R$?', tot, `Δ: ${Q.fmt(pD, 0)}; Γ: ½·${Q.fmt(Gc, 0)}·${Q.fmt(mv, 1)}²/100 = ${Q.fmt(pG, 0)}; vega: ${Q.fmt(pV, 0)}; θ: ${Q.fmt(Th, 0)}. Total ${Q.fmt(tot, 0)}.`, { tol: 0.01, tolAbs: 100, dec: 0 }) },
      { who: 'controller', narr: `O PnL oficial foi R$ ${Q.fmt(act, 0)}.`, ex: num('Unexplained (R$)?', act - tot, `${Q.fmt(act, 0)} − ${Q.fmt(tot, 0)} = ${Q.fmt(act - tot, 0)}.`, { tol: 0.01, tolAbs: 100, dec: 0 }) },
      { who: 'head', narr: '"Por que o unexplained ficou grande hoje?"', ex: mcq('Explicação mais provável:', ['Erro no theta', 'Choque grande: termos de ordem superior (volga, vanna, speed) e mudança de formato do smile', 'Dividendos', 'Nenhuma, é normal sempre'], 1, 'Taylor falha em choques extremos.') },
      { who: 'cliente PF', narr: `Um cliente pessoa física ganhou R$ ${Q.fmt(g, 0)} com puts (operações comuns, sem prejuízo a compensar) no mês.`, ex: num('IR devido pela regra de 15% (R$)?', g * 0.15, `${Q.fmt(g, 0)} × 15% = ${Q.fmt(g * 0.15, 2)} (menos o IRRF retido).`, { tol: 0.001, dec: 2 }) }
    ]; } });

/* ===== US ===== */
Course.mission({ id: 'm-us1', unit: 'us1', title: 'Opening bell em Nova York',
  brief: 'Primeiro dia na mesa de NY. Um cliente quer SPY calls antes do ex-dividendo e o livro precisa de hedge em ES.',
  gen: R => { const K = R.step(400, 600, 5), D = R.f(1.5, 2, 2), r = 0.045, days = R.int(3, 30); const thr = K * (1 - Math.exp(-r * days / 365)); const Dc = R.int(20, 150) * 1e6 * R.sign(), Fu = R.step(5000, 6500, 25); const n = -Dc / (50 * Fu); const prem = R.f(2, 12, 2), q = R.int(10, 300);
    return [
      { who: 'sales', narr: `Cliente compra ${q} contratos de call de SPY a US$ ${Q.fmt(prem, 2)}.`, ex: num('Prêmio total (US$)?', q * prem * 100, `${q} × ${Q.fmt(prem, 2)} × 100.`, { tol: 0.0001, dec: 2 }) },
      { who: 'trader', narr: `Você tem calls ITM de SPY vendidas, strike ${K}. Ex-div amanhã, dividendo US$ ${Q.fmt(D, 2)}, vencimento ${days} dias depois, r = 4,5%.`, ex: mcq('Pela condição D > K[1 − e^{−r(T−t)}], há risco de exercício antecipado?', D > thr ? ['Sim, a condição é satisfeita', 'Não'] : ['Sim, a condição é satisfeita', 'Não'], D > thr ? 0 : 1, `K[1 − e^{−r·${days}/365}] = ${Q.fmt(thr, 3)} vs D = ${Q.fmt(D, 2)}.`) },
      { who: 'risk', narr: `Delta cash do livro: US$ ${Q.fmt(Dc, 0)}. ES a ${Q.fmt(Fu, 0)}.`, ex: num('Contratos ES para zerar (+ compra / − venda)?', n, `−Δ$/(50·F) = ${Q.fmt(n, 1)}.`, { tol: 0.01, tolAbs: 0.6, dec: 1 }) }
    ]; } });

Course.mission({ id: 'm-us2', unit: 'us2', title: 'Earnings week',
  brief: 'Uma big tech divulga resultado na quinta. Extraia o move implícito, cote o skew e decida o delta.',
  gen: R => { const d = R.pick([3, 5, 7]), iv = R.f(0.45, 0.8, 2), b = R.f(0.25, 0.35, 2); const T = d / 365; const e = Math.sqrt(iv * iv * T - b * b * (T - 1 / 365)) * 100; const atm = R.f(25, 35, 1), p = atm + R.f(2, 6, 1), c = atm - R.f(0.5, 2, 1);
    return [
      { who: 'PM', narr: `Weekly com ${d} dias corridos, IV ${F.p(iv, 0)}, vol base ex-evento ${F.p(b, 0)}.`, ex: num('Move implícito do dia do balanço (%)?', e, `√(σ²T − σb²(T − 1/365)) = ${Q.fmt(e, 2)}%.`, { tol: 0.01, dec: 2 }) },
      { who: 'trader', narr: `Vol de 1 mês: ATM ${Q.fmt(atm, 1)}, 25Δ put ${Q.fmt(p, 1)}, 25Δ call ${Q.fmt(c, 1)}.`, ex: num('RR 25Δ (call − put)?', c - p, `${Q.fmt(c, 1)} − ${Q.fmt(p, 1)}.`, { tolAbs: 0.05, tol: 0, dec: 1 }) },
      { who: 'head', narr: '"Depois do balanço, o que acontece com a IV da weekly?"', ex: mcq('Resposta:', ['Sobe', 'Vol crush: cai forte', 'Não muda', 'Vai a 100'], 1, 'A variância do evento sai do vencimento.') },
      { who: 'quant', narr: '"Rodamos sticky strike. Com skew negativo, se a ação subir, a vol ATM…"', ex: mcq('…', ['sobe', 'cai', 'fica igual', 'vira zero'], 1, 'Novo ATM é um strike mais alto, com vol menor no smile fixo.') }
    ]; } });

Course.mission({ id: 'm-us3', unit: 'us3', title: 'Vendendo variance',
  brief: 'Um fundo quer vender var swap de S&P de 3 meses. Você cota, acompanha a vol realizada e checa a correlação implícita para uma ideia de dispersão.',
  gen: R => { const atm = R.f(14, 20, 1), K = atm + R.f(1, 3, 1), Nv = R.int(5, 20) * 10000, sr = R.f(9, 35, 1); const Nvar = Nv / (2 * K); const pnl = Nvar * (K * K - sr * sr); const sI = R.f(0.14, 0.2, 3), avg = R.f(0.26, 0.36, 3);
    return [
      { who: 'sales', narr: `Vol ATM 3M em ${Q.fmt(atm, 1)}; seu strike de var swap: ${Q.fmt(K, 1)}.`, ex: mcq('Por que o strike do var está acima da ATM?', ['Erro', 'A replicação pondera puts OTM (caras pelo skew) com 1/K²', 'Juros', 'Dividendos'], 1, 'Skew negativo ⇒ K_var > ATM.') },
      { who: 'sales', narr: `O fundo vende US$ ${Q.fmt(Nv, 0)} de vega notional a ${Q.fmt(K, 1)}. A mesa compra.`, ex: num('Variance notional (N_vega/(2K))?', Nvar, `${Q.fmt(Nv, 0)}/(2×${Q.fmt(K, 1)}) = ${Q.fmt(Nvar, 2)}.`, { tol: 0.001, dec: 2 }) },
      { who: 'mercado', narr: `No vencimento, a vol realizada foi ${Q.fmt(sr, 1)}.`, ex: num('PnL do FUNDO (vendido), US$?', pnl, `N_var·(K² − σr²) = ${Q.fmt(Nvar, 2)}×(${Q.fmt(K * K, 2)} − ${Q.fmt(sr * sr, 2)}) = ${Q.fmt(pnl, 0)}.`, { tol: 0.002, tolAbs: 5, dec: 0 }) },
      { who: 'estrategista', narr: `Vol do índice ${F.p(sI, 1)}; média ponderada das vols dos componentes ${F.p(avg, 1)}.`, ex: num('Correlação implícita aprox.?', sI * sI / (avg * avg), `σI²/(Σwσ)² = ${Q.fmt(sI * sI / (avg * avg), 3)}.`, { tol: 0.01, dec: 3 }) }
    ]; } });

Course.mission({ id: 'm-us4', unit: 'us4', title: 'O livro de autocalls',
  brief: 'Você herdou um livro de Phoenix worst-of. Precifique a DIP, calcule cupons e reaja a um rally.',
  gen: R => { const H = R.pick([60, 65, 70]), s1 = R.f(0.18, 0.22, 2); const dip = Q.barrier('pdi', 100, 100, H, 1, 0.04, 0.015, s1, 0); const obs = [R.f(0.72, 1.05, 3), R.f(0.6, 0.98, 3), R.f(0.75, 1.1, 3)], cup = 2; let paid = 0, memo = 0; for (let i = 0; i < 3; i++) { if (obs[i] >= 0.7) { paid += cup + memo; memo = 0; } else memo += cup; if (obs[i] >= 1) break; }
    return [
      { who: 'quant', narr: `DIP de 1 ano: K = 100, H = ${H}, r = 4%, q = 1,5%, vol ${F.p(s1, 0)}.`, ex: num('Preço da DIP (% do nocional)?', dip, `Reiner-Rubinstein: ${Q.fmt(dip, 3)}.`, { tol: 0.02, tolAbs: 0.02, dec: 3 }) },
      { who: 'cliente', narr: `Phoenix com memória: cupom 2%/trimestre se ≥ 70%, autocall ≥ 100%. Observações: ${obs.map(x => Q.fmt(x * 100, 1) + '%').join(', ')}.`, ex: num('Cupons pagos até agora (%)?', paid, `Aplique a regra com memória, parando no autocall. Total ${Q.fmt(paid, 1)}%.`, { tolAbs: 0.01, tol: 0, dec: 1 }) },
      { who: 'head', narr: '"O S&P subiu 12% e metade do livro foi autocallado. Nós tínhamos vendido vol listada para hedgear a vega longa."', ex: mcq('Como ficou nosso vega?', ['Mais long', 'Short vega (o hedge sobrou)', 'Zero', 'Igual'], 1, 'A vega longa sumiu com os produtos; a vol vendida ficou.') },
      { who: 'risk', narr: '"E a correlação nos worst-of?"', ex: mcq('Se a correlação subir, o livro (comprado nas puts worst-of):', ['Ganha', 'Perde', 'Não muda', 'Depende do cupom'], 1, 'Put worst-of vale menos com correlação alta.') }
    ]; } });

Course.mission({ id: 'm-us5', unit: 'us5', title: 'OpEx Friday',
  brief: 'Sexta de vencimento mensal. Você cota como market maker, lida com pin risk e com um cliente OTC sem CSA.',
  gen: R => { const theo = R.f(15, 22, 1), sk = 0.3, w = 0.6; const bid = theo + sk - w / 2; const G = R.int(-30, 30) * 1e8; const EE = R.int(2, 15) * 1e6, pd = R.f(0.01, 0.04, 3);
    return [
      { who: 'mm', narr: `Teórico ${Q.fmt(theo, 1)} vol. Você está vendido em vega nesse vencimento, desloca o mid +0,3 e cota 0,6 de largura.`, ex: num('Seu bid (vol)?', bid, `mid ${Q.fmt(theo + sk, 1)} − 0,3 = ${Q.fmt(bid, 2)}.`, { tolAbs: 0.01, tol: 0, dec: 2 }) },
      { who: 'estrategista', narr: `Dealers com gamma de US$ ${Q.fmt(G / 1e9, 1)} bi por 1%. O S&P sobe 1%.`, ex: mcq('O hedge dos dealers:', G > 0 ? ['Vende (amortece)', 'Compra (amplifica)'] : ['Vende (amortece)', 'Compra (amplifica)'], G > 0 ? 0 : 1, `Novo delta ${Q.fmt(G / 1e9, 1)} bi ⇒ ${G > 0 ? 'vendem' : 'compram'}.`) },
      { who: 'trader', narr: 'SPY fecha a 1 centavo do strike onde você vendeu 10 mil calls.', ex: mcq('Melhor ação antes do fechamento:', ['Nada', 'Recomprar as calls "pin" baratas para eliminar a incerteza de assignment', 'Vender mais', 'Exercer'], 1, 'Elimina o risco de acordar com delta desconhecido.') },
      { who: 'XVA', narr: `Cliente OTC sem CSA: exposição esperada US$ ${Q.fmt(EE, 0)}, PD ${F.p(pd, 1)}, LGD 60%.`, ex: num('CVA aproximado (US$)?', EE * pd * 0.6, `EE × PD × LGD = ${Q.fmt(EE * pd * 0.6, 0)}.`, { tol: 0.001, dec: 0 }) }
    ]; } });

Course.mission({ id: 'm-us6', unit: 'us6', title: 'Comitê de risco',
  brief: 'Você apresenta o livro ao comitê: vega ponderada, stress, PnL explain com dividendos. Não gagueje.',
  gen: R => { const v1 = R.int(-400, 400) * 1000, v2 = R.int(-400, 400) * 1000; const w = v1 * Math.sqrt(3) + v2 * 0.5; const s1 = 20, s2 = 8; const st = v1 * s1 + v2 * s2; const dd = R.int(-4, 4) * 10000, ch = R.f(-0.4, 0.4, 2);
    return [
      { who: 'comitê', narr: `Vega: ${Q.fmt(v1, 0)}/pt em 1M e ${Q.fmt(v2, 0)}/pt em 1A.`, ex: num('Vega ponderada (ref. 3M)?', w, `${Q.fmt(v1, 0)}×√3 + ${Q.fmt(v2, 0)}×0,5 = ${Q.fmt(w, 0)}.`, { tol: 0.003, tolAbs: 10, dec: 0 }) },
      { who: 'comitê', narr: 'Stress: vol 1M +20, vol 1A +8 (só vega, linear).', ex: num('PnL (US$)?', st, `${Q.fmt(v1, 0)}×20 + ${Q.fmt(v2, 0)}×8 = ${Q.fmt(st, 0)}.`, { tol: 0.001, tolAbs: 10, dec: 0 }) },
      { who: 'product control', narr: `Div delta US$ ${Q.fmt(dd, 0)} por US$1 de dividendo; a expectativa mudou ${Q.fmt(ch, 2)}.`, ex: num('PnL de dividendos (US$)?', dd * ch, `${Q.fmt(dd, 0)} × ${Q.fmt(ch, 2)} = ${Q.fmt(dd * ch, 0)}.`, { tol: 0.001, tolAbs: 1, dec: 0 }) },
      { who: 'CRO', narr: '"Qual cenário zera o capital da mesa?"', ex: mcq('Que análise responde isso?', ['VaR paramétrico', 'Reverse stress test', 'Theta', 'Backtest'], 1, 'Parte da perda inaceitável e busca o cenário.') }
    ]; } });
})();
