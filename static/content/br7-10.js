/* ============ MÓDULO BRASIL — Unidades 7 a 10 ============ */
(function () {
const R_ = window.REF;

/* ---------------- BR7 — Exóticas ---------------- */
Course.unit('br', {
  id: 'br7', title: 'Opções exóticas: digitais e barreiras',
  desc: 'Digitais (binárias), barreiras knock-in/knock-out up/down com e sem rebate, a paridade in-out, o comportamento selvagem das gregas perto da barreira, hedge estático e outras exóticas (asiáticas, lookbacks, quantos).',
  sims: ['barrier', 'struct'], exam: { n: 12, minutes: 25 },
  lessons: [
  {
    id: 'br7-1', title: 'Digitais (binárias) e o pin risk', tag: 'digitais',
    goal: 'Precificar digitais, replicá-las com call spreads e entender por que são difíceis de hedgear perto do strike.',
    body: String.raw`
<p>Uma <b>digital cash-or-nothing</b> paga um valor fixo \(Q\) se \(S_T > K\) (call) ou \(S_T < K\) (put), e nada caso contrário. No Black-Scholes:</p>
\[ \text{Digital call} = Q\,e^{-rT}N(d_2), \qquad \text{Digital put} = Q\,e^{-rT}N(-d_2). \]
<p>Digital call + digital put = \(Qe^{-rT}\) (um zero-cupom). A <b>asset-or-nothing</b> paga a ação: \(S e^{-qT} N(d_1)\). E a call vanilla = asset-or-nothing − K × cash-or-nothing — a própria fórmula de BS decomposta!</p>
<h3>Replicação por call spread</h3>
<p>Uma digital de strike K se aproxima por \(\frac{1}{2\varepsilon}\)[call(K−ε) − call(K+ε)]. Quanto menor ε, melhor a aproximação e maior a quantidade de opções. Na prática, a mesa <b>precifica e hedgeia a digital como um call spread</b> com ε escolhido de forma conservadora ("overhedge"): sempre a favor da mesa. Isso também mostra que a digital é, em essência, uma aposta no <b>skew</b>: \(\text{Digital} = -\partial C/\partial K = e^{-rT}N(d_2) - \mathcal{V}\,\partial\sigma/\partial K\). Com skew negativo (\(\partial\sigma/\partial K<0\)), o termo \(-\mathcal{V}\,\partial\sigma/\partial K\) é positivo: a digital call vale <b>mais</b> do que o BS calculado com a vol do strike. Precificar digital com vol flat é erro clássico.</p>
<h3>Pin risk</h3>
<p>Perto do vencimento com spot próximo do strike, o delta da digital é enorme (a derivada de um degrau). Um centavo decide se você paga tudo ou nada. Esse é o <b>pin risk</b>, e aparece também em vanillas com grande open interest no strike no dia do vencimento: não se sabe se a opção será exercida e qual delta você terá no dia seguinte.</p>
<div class="w" data-w="payoff" data-a='{"preset":"Digital via call spread apertado","title":"Digital replicada por 10× call spread 99,95/100,05"}'></div>
<p>No Brasil, a B3 lista as <b>opções digitais de Copom</b>: pagam R$ 1 se a decisão do Copom for a do contrato (ex.: corte de 0,50 p.p.). O preço é a probabilidade (descontada) que o mercado atribui ao resultado.</p>`,
    desk: String.raw`"Bet", "binária", "digital". "Overhedge da digital" = replicar com call spread mais largo a favor da mesa. "Pinou no strike" = spot fechou colado no strike no vencimento.`,
    deep: String.raw`<p>A relação com o skew vem de \(c(K) = e^{-rT}\int_K^\infty (x-K)\,q(x)\,dx\) ⇒ \(-\partial c/\partial K = e^{-rT}\,\mathbb{Q}(S_T>K)\): a digital é a derivada (com sinal trocado) da call em relação ao strike. Com smile, \(c(K) = c_{BS}(K,\sigma(K))\), e pela regra da cadeia</p>
\[ \text{Digital}(K) = -\frac{dc}{dK} = e^{-rT}N(d_2) - \mathcal{V}(K)\,\frac{\partial\sigma}{\partial K}. \]
<p>Em equity, \(\partial\sigma/\partial K<0\), então a digital call vale mais do que \(e^{-rT}N(d_2)\) avaliado com \(\sigma(K)\); a digital put, menos. Intuição: o skew negativo engorda a cauda esquerda da densidade, mas desloca massa de probabilidade logo acima do ATM — a probabilidade de terminar acima de K perto do dinheiro aumenta. Confira no Laboratório de Smile (aba densidade implícita).</p>`,
    refs: [R_.hull('25.9', 'Binary options'), R_.wil('2.13', 'Binaries or digitals'), R_.mfd('5.5', 'Binary options'), R_.wil(22, 'An introduction to exotic and path-dependent derivatives')],
    sims: ['struct?preset=Digital via call spread apertado'],
    ex: [
      { tag: 'digitais', gen: R => { const S = 100, K = R.pick([95, 100, 105]), T = R.pick([0.25, 0.5]), r = 0.1, s = R.f(0.2, 0.35, 2), Qc = R.pick([1, 10, 100]); const a = Q.digital('cash', 'call', S, K, T, r, 0, s, Qc); return { q: `Digital call cash-or-nothing que paga ${Qc} se S_T > K: S = 100, K = ${K}, T = ${T}, r = 10% (cont.), σ = ${F.p(s, 0)}. Preço?`, a, tol: 0.005, dec: 4, e: `${Qc}·e^{−rT}·N(d2) = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'digitais', gen: R => { const r = R.f(0.05, 0.14, 3), T = R.pick([0.25, 0.5, 1]), dc = R.f(0.2, 0.6, 3); const a = Math.exp(-r * T) - dc; return { q: `Uma digital call (paga 1) vale ${Q.fmt(dc, 3)}. r = ${F.p(r, 1)} contínua, T = ${T}. Quanto vale a digital put de mesmo strike (paga 1)?`, a, tolAbs: 0.001, dec: 4, e: `DC + DP = e^{−rT} ⇒ DP = ${Q.fmt(Math.exp(-r * T), 4)} − ${Q.fmt(dc, 3)} = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'digitais', gen: R => { const N = R.int(1, 10) * 10000, eps = R.pick([0.5, 1, 2]); const a = N / (2 * eps); return { q: `Para replicar uma digital que paga R$ ${Q.fmt(N, 0)} com strike 50 usando um call spread 50−${eps}/50+${eps}, quantos call spreads você precisa?`, a, tol: 0.001, dec: 0, e: `Cada call spread paga até ${2 * eps}. ${Q.fmt(N, 0)}/${2 * eps} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Por que digitais são difíceis de hedgear perto do vencimento com spot perto do strike?', o: ['Vega alto', 'Delta e gamma gigantes e instáveis (pin risk)', 'Rho alto', 'Não têm delta'], a: 1, e: 'O payoff é um degrau: sua derivada explode no strike.' },
      { t: 'mcq', q: 'A opção digital de Copom da B3 que paga R$ 1 se o Copom cortar 0,50 p.p. está a R$ 0,62 (vencimento curto, desconto desprezível). A probabilidade implícita do corte é:', o: ['38%', '50%', '62%', 'Impossível saber'], a: 2, e: 'Preço de digital ≈ probabilidade neutra a risco descontada.' }
    ],
    cards: [['Digital call (BS)', 'Q·e^{−rT}·N(d2)'], ['Réplica da digital', '1/(2ε)·[call(K−ε) − call(K+ε)]'], ['Pin risk', 'Incerteza de exercício/delta com spot colado no strike no vencimento.']]
  },
  {
    id: 'br7-2', title: 'Barreiras: knock-in, knock-out e a paridade in-out', tag: 'barreiras',
    goal: 'Classificar e precificar opções com barreira e usar a paridade in + out = vanilla.',
    body: String.raw`
<p>Uma <b>opção com barreira</b> é uma vanilla que <b>nasce</b> (knock-in) ou <b>morre</b> (knock-out) se o spot tocar um nível \(H\) durante a vida da opção.</p>
<table><tr><th>Tipo</th><th>Barreira</th><th>Efeito</th><th>Exemplo</th></tr>
<tr><td>Up-and-out (UO)</td><td>acima do spot</td><td>morre se subir até H</td><td>call "tubarão": alta limitada</td></tr>
<tr><td>Up-and-in (UI)</td><td>acima</td><td>nasce se subir até H</td><td></td></tr>
<tr><td>Down-and-out (DO)</td><td>abaixo</td><td>morre se cair até H</td><td>put DO: proteção barata que some no crash</td></tr>
<tr><td>Down-and-in (DI)</td><td>abaixo</td><td>nasce se cair até H</td><td>a put do autocall (Módulo US)</td></tr></table>
<p><b>Paridade in-out</b> (sem rebate, mesmos parâmetros): exatamente um dos dois estará vivo no vencimento, então</p>
\[ \text{Knock-in} + \text{Knock-out} = \text{Vanilla}. \]
<p>Por isso barreiras são sempre <b>mais baratas</b> que a vanilla — o que as torna populares em produtos estruturados.</p>
<h3>Regular vs reverse</h3>
<ul><li><b>Regular</b>: a barreira está na região em que a opção já estaria OTM (ex.: call down-and-out com H < K). Tocar a barreira mata uma opção que valia pouco — comportamento suave.</li>
<li><b>Reverse</b>: a barreira está na região ITM (ex.: call up-and-out com H > K). A opção morre justamente quando valia mais! O payoff tem um "penhasco" em H. É aqui que moram os problemas de hedge (próxima lição).</li></ul>
<div class="w" data-w="barrier" data-a='{"kind":"cuo","K":100,"H":120,"title":"Call up-and-out K=100 H=120 (reverse) vs vanilla"}'></div>
<h3>Rebate e monitoramento</h3>
<p><b>Rebate</b>: valor pago se a opção knock-out morrer (ou se a knock-in nunca nascer), para "compensar" o titular. <b>Monitoramento</b>: contínuo (fórmulas fechadas de Reiner-Rubinstein) ou discreto (fechamento diário — o mais comum em contratos). Com monitoramento discreto, é mais difícil tocar a barreira; a correção de Broadie-Glasserman desloca a barreira por \(e^{\pm0{,}5826\,\sigma\sqrt{\Delta t}}\).</p>`,
    desk: String.raw`"KO", "KI", "tubarão" (call com knock-out, comum em COEs). "A barreira bateu" / "tocou". "Barreira americana" (contínua) vs "europeia" (só no vencimento — na verdade é uma digital+vanilla).`,
    refs: [R_.hull('25.8', 'Barrier options'), R_.wil(23, 'Barrier options'), R_.mfd(12, 'Barrier options'), R_.der(14, 'barrier options'), R_.ek('7.8', 'Barrier options'), R_.cqf(3, 'opções exóticas')],
    sims: ['barrier'],
    ex: [
      { tag: 'barreiras', gen: R => { const S = 100, K = 100, H = R.pick([115, 120, 130]), T = 0.5, r = 0.1, s = R.f(0.2, 0.35, 2); const a = Q.barrier('cuo', S, K, H, T, r, 0, s, 0); return { q: `Call up-and-out: S = 100, K = 100, H = ${H}, T = 0,5, r = 10%, σ = ${F.p(s, 0)}, sem rebate, monitoramento contínuo. Preço? <span class="muted">(use o Laboratório de Barreiras)</span>`, a, tol: 0.01, tolAbs: 0.005, dec: 4, e: `Reiner-Rubinstein: ${Q.fmt(a, 4)} (vanilla: ${Q.fmt(Q.bsPrice('call', S, K, T, r, 0, s), 4)}).` }; } },
      { tag: 'barreiras', gen: R => { const v = R.f(4, 12, 3), ko = R.f(0.5, 3.5, 3); const a = v - ko; return { q: `Uma call vanilla vale ${Q.fmt(v, 3)} e a call down-and-out correspondente (sem rebate) vale ${Q.fmt(ko, 3)}. Quanto vale a call down-and-in?`, a, tolAbs: 0.001, dec: 3, e: `Paridade: KI = vanilla − KO = ${Q.fmt(a, 3)}.` }; } },
      { t: 'mcq', q: 'Qual destas é uma barreira "reverse" (barreira na região ITM)?', o: ['Call down-and-out com H < K', 'Call up-and-out com H > K', 'Put up-and-out com H > K', 'Put down-and-in com H > K'], a: 1, e: 'A call UO com H > K morre quando está ITM: penhasco no payoff.' },
      { t: 'mcq', q: 'Com monitoramento diário (discreto) em vez de contínuo, uma knock-out vale:', o: ['Menos', 'Mais (é mais difícil tocar a barreira)', 'O mesmo', 'Zero'], a: 1, e: 'Menos observações ⇒ menor chance de knock-out ⇒ KO vale mais (KI vale menos).' },
      { t: 'tf', q: 'Uma knock-in sempre vale menos ou igual à vanilla correspondente (sem rebate).', a: true, e: 'KI = vanilla − KO, e KO ≥ 0.' }
    ],
    cards: [['Paridade in-out', 'KI + KO = vanilla (sem rebate)'], ['Barreira reverse', 'Barreira na região ITM: payoff com penhasco (ex.: call UO com H > K).'], ['Correção BGK', 'Barreira discreta ≈ contínua com H·e^{±0,5826σ√Δt}']]
  },
  {
    id: 'br7-3', title: 'Gregas de barreira e hedge', tag: 'barreiras',
    goal: 'Entender o comportamento das gregas perto da barreira, o vega negativo, e as técnicas de hedge (estático, barrier shift).',
    body: String.raw`
<p>Pegue a call up-and-out K=100, H=120. Longe da barreira, parece uma call normal. Perto de H:</p>
<ul><li><b>Delta fica negativo</b>: se subir mais, você se aproxima da morte da opção. O preço cai quando o spot sobe.</li>
<li><b>Gamma muito negativo</b> e enorme perto do vencimento.</li>
<li><b>Vega negativo</b>: mais vol = mais chance de tocar H = opção vale menos. Uma "call" que é vendida em vol!</li>
<li>No toque, o valor cai para o rebate de uma vez: o delta salta. Quem está <b>vendido</b> na UO e hedgeado com ações compradas de repente fica com delta enorme para desmontar — exatamente no nível H, com todo mundo que tem a mesma barreira fazendo o mesmo.</li></ul>
<div class="w" data-w="barrier" data-a='{"kind":"cuo","K":100,"H":120,"days":42,"title":"Mesma UO com 2 meses: veja o penhasco"}'></div>
<p>Abra o simulador e olhe as abas Delta, Gamma e Vega. Compare knock-outs regulares (suaves) com reverses (selvagens).</p>
<h3>Técnicas de hedge e gestão</h3>
<ol><li><b>Barrier shift</b>: a mesa precifica e gerencia como se a barreira estivesse um pouco mais longe (ou mais perto), a seu favor, para ter "colchão" para o custo de desmontar o hedge no toque. É a versão de barreira do overhedge da digital.</li>
<li><b>Hedge estático</b> (Derman-Ergener-Kani, Carr): replicar a barreira com um portfólio de vanillas que valha o mesmo na barreira. Ex.: uma put DI pode ser aproximada por puts com strike refletido \(K' = H^2/K\) (reflexão, exata em r=q e vol flat).</li>
<li><b>Limites de concentração</b> por nível de barreira: evitar que o livro inteiro tenha barreiras no mesmo lugar.</li>
<li><b>Vega por strike e skew</b>: o valor de barreiras depende muito do smile (a cauda). Precificar barreira com vol flat é erro clássico; usa-se vol local ou estocástica (Módulo US).</li></ol>
<h3>Leitura de risco</h3>
<p>Quando um cliente compra uma call UO "tubarão" da mesa, a mesa fica <b>vendida</b> na UO: longe da barreira é short gamma/vega normal; perto da barreira vira long gamma e long vega! O risco da mesa troca de sinal conforme o spot anda. Esse é o motivo de exóticas pedirem gestão ativa.</p>`,
    desk: String.raw`"Barreira no 120 com muito nocional: vai ter briga lá" (defesa/ataque de barreira). "Shift de 1% na barreira." "O livro vira de short para long gamma perto do KO."`,
    deep: String.raw`<p>Reflexão (princípio do espelho): com \(r=q\) e vol constante, o preço de uma down-and-in call com \(H<K\) é \(\frac{K}{H}\,P(S, H^2/K)\) — um múltiplo de uma put vanilla com strike refletido. Isso sugere o hedge estático: quando \(S=H\), a call e a put refletida valem igual. Com \(r\neq q\) aparece o fator \((H/S)^{2\mu}\) das fórmulas de Reiner-Rubinstein (\(\mu = (r-q-\sigma^2/2)/\sigma^2\)).</p>`,
    refs: [R_.wil('23.8', 'Hedging barrier options'), R_.wil('23.9', 'Slippage costs'), R_.hull('25.16', 'Static options replication'), R_.wil(60, 'Static hedging')],
    sims: ['barrier'],
    ex: [
      { t: 'mcq', q: 'Call up-and-out K=100, H=110, spot 108, 1 mês. O delta é provavelmente:', o: ['Perto de 1', 'Negativo', 'Exatamente 0,5', 'Zero'], a: 1, e: 'Perto da barreira reverse, subir aproxima o knock-out: delta negativo.' },
      { t: 'mcq', q: 'Por que uma knock-out reverse pode ter vega negativo?', o: ['Porque é uma put', 'Porque mais vol aumenta a probabilidade de tocar a barreira e morrer', 'Por causa dos juros', 'Não pode'], a: 1, e: 'O efeito de knock-out domina o efeito de convexidade.' },
      { tag: 'barreiras', gen: R => { const K = R.pick([100, 110]), H = R.pick([80, 85, 90]); const a = H * H / K; return { q: `Pelo princípio da reflexão (r = q, vol flat), qual o strike da put vanilla usada no hedge estático de uma call down-and-in com K = ${K} e H = ${H}?`, a, tol: 0.001, dec: 2, e: `K' = H²/K = ${H}²/${K} = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'barreiras', gen: R => { const H = R.pick([110, 120, 130]), s = R.f(0.2, 0.4, 2), dt = 1 / 252; const a = H * Math.exp(0.5826 * s * Math.sqrt(dt)); return { q: `Barreira up-and-out em ${H} com monitoramento diário (Δt = 1/252) e σ = ${F.p(s, 0)}. Qual barreira contínua equivalente (BGK)?`, a, tol: 0.0005, dec: 3, e: `H·e^{0,5826·σ·√Δt} = ${H}·e^{${Q.fmt(0.5826 * s * Math.sqrt(dt), 5)}} = ${Q.fmt(a, 3)}.` }; } },
      { t: 'mcq', q: 'A mesa vendeu muitas calls up-and-out com barreira em 120 e hedgeou comprando ações. Se o spot tocar 120:', o: ['Nada muda', 'A mesa precisa vender rapidamente as ações do hedge (delta salta para ~0), podendo empurrar o mercado', 'A mesa precisa comprar mais ações', 'A mesa recebe o rebate'], a: 1, e: 'O knock-out zera o delta da opção; o hedge vira posição direcional a ser desmontada.' }
    ],
    cards: [['Vega de KO reverse', 'Pode ser negativo: vol ↑ ⇒ chance de KO ↑.'], ['Barrier shift', 'Mover a barreira a favor da mesa para precificar/gerir o custo do salto de delta.'], ['Reflexão', 'Strike refletido K\' = H²/K para hedge estático.']]
  },
  {
    id: 'br7-4', title: 'Outras exóticas: asiáticas, lookbacks, quantos e compostas', tag: 'exoticas',
    goal: 'Conhecer as outras famílias de exóticas que aparecem em produtos e entender o risco dominante de cada uma.',
    body: String.raw`
<table><tr><th>Exótica</th><th>Payoff</th><th>Por que existe</th><th>Risco dominante</th></tr>
<tr><td><b>Asiática</b></td><td>depende da média dos preços (ex.: \(\max(\bar S - K,0)\))</td><td>mais barata (a média é menos volátil); difícil de manipular no vencimento; hedge de fluxos médios</td><td>vega decai com o período de média; delta cai à medida que a média "trava"</td></tr>
<tr><td><b>Lookback</b></td><td>\(S_T - \min S\) ou \(\max S - K\)</td><td>"comprar na mínima"</td><td>caríssima; muito vega e sensível à vol</td></tr>
<tr><td><b>Quanto</b></td><td>payoff em moeda diferente a câmbio fixo (ex.: S&amp;P pago em reais)</td><td>investidor quer o índice sem risco cambial</td><td>correlação ativo × câmbio (drift ajustado \(r_f - q - \rho\,\sigma_S\sigma_X\))</td></tr>
<tr><td><b>Composta</b></td><td>opção sobre opção</td><td>proteção contingente</td><td>vol da vol</td></tr>
<tr><td><b>Chooser</b></td><td>escolhe call ou put numa data</td><td>evento binário (eleição)</td><td>≈ call + put com prazos diferentes</td></tr>
<tr><td><b>Cliquet / ratchet</b></td><td>soma de retornos periódicos limitados</td><td>produtos de varejo</td><td>vol forward e skew forward (Módulo US)</td></tr>
<tr><td><b>Basket / worst-of</b></td><td>sobre várias ações</td><td>cupons maiores em estruturados</td><td>correlação (Módulo US)</td></tr></table>
<h3>Asiática: a intuição do preço</h3>
<p>A média aritmética de um GBM não tem distribuição fechada, mas a <b>média geométrica</b> é lognormal, com vol efetiva ~\(\sigma/\sqrt3\) para média contínua em todo o prazo. Por isso uma asiática vale bem menos que a vanilla. Precifica-se por Monte Carlo usando a geométrica como variável de controle.</p>
<h3>Quanto: o ajuste de drift</h3>
<p>Se você recebe o retorno do S&amp;P 500 convertido a um câmbio fixo, o hedge (em dólar) gera PnL cambial correlacionado com o ativo. Resultado: no mundo neutro a risco em reais, o ativo tem drift \(r_{USD} - q - \rho\,\sigma_S\sigma_{X}\), onde \(X\) é o USDBRL (reais por dólar) e \(\rho = \text{corr}(S, X)\). Historicamente, quando o S&amp;P cai o dólar tende a subir contra o real (\(\rho<0\)): o ajuste aumenta o forward quanto e encarece calls quanto. Mesas brasileiras que vendem COEs de índices internacionais carregam esse risco de correlação.</p>`,
    desk: String.raw`"Média no final" (averaging nos últimos pregões) é uma cláusula comum para evitar manipulação no fixing. "Quanto em reais" = "BRL quanto". "Worst-of" = pior de uma cesta.`,
    refs: [R_.hull('25.12', 'Asian options'), R_.hull('25.10', 'Lookback options'), R_.hull('25.6', 'Compound options'), R_.hull('29.3', 'Quantos'), R_.wil(25, 'Asian options'), R_.wil(26, 'Lookback options'), R_.wil('11.7', 'Quantos'), R_.mfd(11, 'Exotic and path-dependent options')],
    sims: ['struct'],
    ex: [
      { t: 'mcq', q: 'Por que uma opção asiática (média aritmética) costuma ser mais barata que a vanilla equivalente?', o: ['Porque tem vencimento menor', 'Porque a média é menos volátil que o preço final', 'Porque não tem delta', 'Porque é europeia'], a: 1, e: 'A média suaviza o preço: vol efetiva menor.' },
      { tag: 'exoticas', gen: R => { const s = R.f(0.2, 0.45, 2); const a = s / Math.sqrt(3) * 100; return { q: `Aproximação: qual a vol efetiva de uma asiática geométrica com média contínua em todo o prazo, se σ = ${F.p(s, 0)}? (em %)`, a, tol: 0.005, unit: '%', dec: 2, e: `σ/√3 = ${Q.fmt(a, 2)}%.` }; } },
      { t: 'mcq', q: 'Num produto quanto (ativo americano pago em reais a câmbio fixo), o risco específico que a mesa carrega é:', o: ['Pin risk', 'Correlação entre o ativo e o câmbio', 'Rho de DI apenas', 'Dividendos brasileiros'], a: 1, e: 'O ajuste quanto depende de ρ·σS·σFX.' },
      { t: 'mcq', q: 'Um lookback call que paga S_T − min(S) é:', o: ['Mais barato que uma call ATM', 'Mais caro que uma call ATM (você compra na mínima)', 'Igual a uma call ATM', 'Sem valor'], a: 1, e: 'Sempre ITM no vencimento e com o melhor strike possível: bem mais caro.' }
    ],
    cards: [['Asiática', 'Payoff sobre a média; mais barata; vol efetiva geométrica ≈ σ/√3.'], ['Quanto', 'Payoff em outra moeda a câmbio fixo; risco de correlação ativo×FX.'], ['Lookback', 'Payoff usa máximo/mínimo do caminho; muito cara.']]
  }
  ]
});

/* ---------------- BR8 — Juros e câmbio ---------------- */
Course.unit('br', {
  id: 'br8', title: 'Juros e câmbio: DI1, dólar, cupom cambial e suas opções',
  desc: 'O mercado que dá identidade ao Brasil (e ao livro do Carreira): curva pré com DI1, DV01, cupom cambial e dólar futuro, opções de dólar (Garman-Kohlhagen), opções de IDI e de Copom — e como isso entra num livro de equity.',
  sims: ['br', 'bs'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'br8-1', title: 'DI1 futuro e a curva pré', tag: 'di',
    goal: 'Precificar DI1, calcular DV01, entender tomado/dado e montar a curva de juros prefixada.',
    body: String.raw`
<p>O <b>DI1</b> é o contrato futuro mais negociado da B3. Ele troca uma taxa prefixada (negociada) pelo CDI acumulado até o vencimento (1º dia útil do mês). É negociado em <b>taxa</b> e liquidado em <b>PU</b>:</p>
\[ PU = \frac{100.000}{(1+\text{taxa})^{du/252}}. \]
<ul><li><b>Tomado</b> em taxa = <b>vendido</b> em PU: ganha se a taxa subir.</li>
<li><b>Dado</b> em taxa = <b>comprado</b> em PU: ganha se a taxa cair.</li></ul>
<p><b>Ajuste diário</b>: o PU de ajuste do dia anterior é corrigido pelo CDI do dia e comparado ao novo PU de ajuste. Para quem está comprado em PU (dado): \(\text{Ajuste} = PA_t - PA_{t-1}\times(1+CDI_{t-1})^{1/252}\), por contrato. Assim, se a taxa não mudar, o ajuste é ~zero: o contrato "carrega" o CDI.</p>
<h3>DV01</h3>
<p>A sensibilidade do PU a 1 bp (0,01%) de taxa: \(DV01 \approx PU\cdot\frac{du/252}{1+\text{taxa}}\cdot 0{,}0001\). Um DI de 2 anos com taxa 12% tem DV01 ≈ R$ 13 por contrato. Mesas de juros medem risco em "DV01" ou em "contratos equivalentes".</p>
<h3>A curva pré</h3>
<p>Os DI1 de vários vencimentos formam a <b>curva de juros prefixada</b>. Entre vértices, interpola-se tipicamente com <b>flat forward</b> (taxa a termo constante entre dois vencimentos, em base 252). Da curva sai a taxa correta para cada opção: uma opção de PETR4 com 90 du usa a taxa DI do prazo de 90 du, não o CDI de hoje.</p>
<p>A taxa a termo entre dois vértices: \((1+f)^{(du_2-du_1)/252} = \frac{(1+i_2)^{du_2/252}}{(1+i_1)^{du_1/252}}\). Ela revela o que o mercado precifica para o Copom.</p>
<h3>Por que um trader de equity liga</h3>
<ul><li>Rho de opções longas e de COEs: hedgeado com DI1.</li>
<li>O forward de ações e índices depende da curva.</li>
<li>Choques de juros no Brasil (fiscal, Copom) movem juros, câmbio e bolsa juntos — correlações que entram nos cenários de stress.</li></ul>`,
    desk: String.raw`"Tomar o jan/27", "dar o jan/29". "A curva inclinou/achatou". "O DI precifica 50 bps de corte no próximo Copom." "Carregar DI": manter posição recebendo/pagando o carrego do CDI.`,
    refs: [R_.car('o contrato DI1, ajuste diário, DV01 e construção da curva pré'), R_.hull('4.6', 'Forward rates'), R_.hull(6, 'Interest rate futures'), R_.cqf(6, 'curvas e modelos de juros')],
    sims: ['br'],
    ex: [
      { tag: 'di', gen: R => { const t = R.f(0.1, 0.15, 4), du = R.int(100, 1000); const a = Q.BR.puDI(t, du); return { q: `PU de um DI1 com ${du} du e taxa ${F.p(t, 2)} a.a.?`, a, tol: 0.00005, dec: 2, e: `100.000/(1+${Q.fmt(t, 4)})^(${du}/252) = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'di', gen: R => { const t = R.f(0.1, 0.15, 4), du = R.pick([252, 504, 756]); const a = Q.BR.dv01DI(t, du); return { q: `DV01 (variação do PU para +1 bp) de um DI1 com ${du} du e taxa ${F.p(t, 2)}? (em R$ por contrato, valor positivo)`, a, tol: 0.01, unit: 'R$', dec: 2, e: `PU(${Q.fmt(t * 100, 2)}%) − PU(${Q.fmt(t * 100 + 0.01, 2)}%) = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'di', gen: R => { const t = R.f(0.1, 0.14, 4), du = R.pick([252, 504]), n = R.int(50, 500), bp = R.int(-40, 40); const pu0 = Q.BR.puDI(t, du), pu1 = Q.BR.puDI(t + bp / 10000, du); const a = -(pu1 - pu0) * n; return { q: `Você está <b>tomado</b> em ${n} contratos DI1 (${du} du, taxa ${F.p(t, 2)}). A taxa se move ${bp > 0 ? '+' : ''}${bp} bps instantaneamente. PnL?`, a, tol: 0.003, tolAbs: 2, unit: 'R$', dec: 0, e: `Tomado = vendido em PU. ΔPU = ${Q.fmt(pu1 - pu0, 2)}; PnL = −${n}×ΔPU = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'di', gen: R => { const i1 = R.f(0.11, 0.14, 4), du1 = 252, i2 = i1 + R.f(-0.01, 0.01, 4), du2 = 504; const f = Math.pow(Math.pow(1 + i2, du2 / 252) / Math.pow(1 + i1, du1 / 252), 252 / (du2 - du1)) - 1; return { q: `DI de 252 du a ${F.p(i1, 2)} e de 504 du a ${F.p(i2, 2)}. Qual a taxa a termo (forward) entre 252 e 504 du, em % a.a.?`, a: f * 100, tol: 0.001, unit: '%', dec: 3, e: `(1+f)^(252/252) = (1+${Q.fmt(i2, 4)})²/(1+${Q.fmt(i1, 4)}) ⇒ f = ${Q.fmt(f * 100, 3)}%.` }; } },
      { t: 'mcq', q: 'Um investidor que acha que o Copom vai cortar juros mais do que o mercado espera deveria:', o: ['Tomar DI', 'Dar DI (comprado em PU)', 'Comprar dólar futuro', 'Vender calls'], a: 1, e: 'Dado em taxa ganha se a taxa cair.' }
    ],
    cards: [['DI1 PU', '100.000/(1+taxa)^(du/252)'], ['Tomado em DI', '= vendido em PU; ganha se a taxa sobe.'], ['Flat forward', 'Interpolação com taxa a termo constante entre vértices.']]
  },
  {
    id: 'br8-2', title: 'Dólar futuro e cupom cambial', tag: 'fx',
    goal: 'Precificar o dólar futuro por paridade coberta e entender o cupom cambial (DDI/FRC).',
    body: String.raw`
<p>O <b>cupom cambial</b> é a taxa de juros em dólar paga no Brasil (onshore). Não é a SOFR: reflete o risco-país, a demanda por hedge e fluxos. Convenção: <b>linear, base 360 dias corridos</b>.</p>
<p>Por não-arbitragem (paridade coberta de juros), o dólar a termo:</p>
\[ F = S\cdot\frac{(1+DI)^{du/252}}{1 + \text{cupom}\cdot dc/360}. \]
<p>A diferença \(F - S\) é chamada de <b>pontos a termo</b> (forward points). Com DI muito acima do cupom, o dólar futuro fica bem acima do spot: carregar um real comprado (vendido em dólar) rende o diferencial — o famoso <b>carry trade</b>.</p>
<h3>Contratos</h3>
<ul><li><b>DOL</b> (US$ 50.000) e <b>WDO</b> (US$ 10.000), cotados em R$ por US$ 1.000. Vencem no 1º dia útil do mês.</li>
<li><b>DDI</b>: futuro de cupom cambial (sujo, desde a última PTAX). <b>FRC</b>: FRA de cupom (cupom limpo entre dois vencimentos), mais usado.</li>
<li><b>Casado</b>: operação de dólar spot vs futuro, que isola o cupom.</li></ul>
<h3>Por que importa para equity</h3>
<ul><li>Produtos quanto e COEs sobre índices internacionais: o hedge envolve câmbio.</li>
<li>Estrangeiros comprando bolsa brasileira hedgeiam câmbio: fluxos de ações e dólar se misturam.</li>
<li>Correlação bolsa × dólar no Brasil é tipicamente negativa (bolsa cai, dólar sobe): essencial em stress.</li></ul>`,
    desk: String.raw`"O casado está pagando X" = diferença futuro−spot. "Cupom limpo/sujo". "PTAX" = taxa de referência do BC usada na liquidação. "Rolar o dólar" = trocar o vencimento no fim do mês.`,
    refs: [R_.car('dólar futuro, cupom cambial, DDI/FRC e paridade coberta'), R_.hull('5.10', 'Forward and futures contracts on currencies'), R_.hull('16.2', 'Currency options')],
    sims: ['br'],
    ex: [
      { tag: 'fx', gen: R => { const S = R.f(4.8, 5.8, 4), i = R.f(0.1, 0.15, 4), c = R.f(0.03, 0.07, 4), du = R.pick([21, 42, 63]), dc = Math.round(du * 365 / 252); const a = S * Math.pow(1 + i, du / 252) / (1 + c * dc / 360); return { q: `Dólar spot ${Q.fmt(S, 4)}, DI ${F.p(i, 2)} (exp 252, ${du} du), cupom cambial ${F.p(c, 2)} (linear 360, ${dc} dc). Qual o dólar a termo?`, a, tol: 0.0003, dec: 4, e: `F = ${Q.fmt(S, 4)}·(1+${Q.fmt(i, 4)})^(${du}/252)/(1+${Q.fmt(c, 4)}·${dc}/360) = ${Q.fmt(a, 4)}.` }; } },
      { tag: 'fx', gen: R => { const n = R.int(5, 100), p0 = R.f(5000, 5800, 1), p1 = p0 + R.f(-60, 60, 1); const a = n * (p1 - p0) * 50; return { q: `Comprado em ${n} DOL (US$ 50.000, cotado em R$ por US$ 1.000) a ${Q.fmt(p0, 1)}. O ajuste foi ${Q.fmt(p1, 1)}. Resultado do dia?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `${n} × (${Q.fmt(p1, 1)} − ${Q.fmt(p0, 1)}) × 50 = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Se o DI está muito acima do cupom cambial, o dólar futuro fica:', o: ['Abaixo do spot', 'Acima do spot', 'Igual ao spot', 'Indefinido'], a: 1, e: 'F = S·fator_DI/fator_cupom > S.' },
      { t: 'mcq', q: 'Em crises locais, a correlação típica entre Ibovespa e dólar (USDBRL) é:', o: ['Positiva', 'Negativa (bolsa cai, dólar sobe)', 'Zero', 'Sempre 1'], a: 1, e: 'Fuga de risco: vende bolsa, compra dólar.' }
    ],
    cards: [['Cupom cambial', 'Juros em dólar onshore; linear 360.'], ['Dólar a termo', 'S·(1+DI)^(du/252)/(1+cupom·dc/360)'], ['DOL / WDO', 'US$ 50 mil / 10 mil; cotado em R$ por US$ 1.000.']]
  },
  {
    id: 'br8-3', title: 'Opções de dólar, de IDI e de Copom', tag: 'fxopt',
    goal: 'Adaptar Black-Scholes para câmbio (Garman-Kohlhagen) e entender as opções de juros locais.',
    body: String.raw`
<h3>Garman-Kohlhagen (opções de câmbio)</h3>
<p>Uma moeda estrangeira rende juros como uma ação rende dividendos. Basta usar \(q = r_f\) (taxa em dólar, no Brasil o cupom cambial convertido para contínua) e \(r = r_d\) (DI contínua):</p>
\[ c = S e^{-r_fT}N(d_1) - K e^{-r_dT}N(d_2). \]
<p>Na prática, precifica-se sobre o <b>forward</b> (modelo de Black): \(c = e^{-r_dT}[F N(d_1) - K N(d_2)]\), com \(d_1 = [\ln(F/K) + \tfrac12\sigma^2T]/(\sigma\sqrt T)\). O mercado de opções de dólar na B3 e no balcão é cotado em vol, com <b>skew positivo</b>: calls de dólar (proteção contra desvalorização do real) mais caras — o espelho do equity.</p>
<h3>Opções de IDI</h3>
<p>O IDI é um índice que acumula o CDI. Opções sobre IDI são, na prática, opções sobre a taxa média de juros até o vencimento: uma call de IDI paga se o CDI acumulado superar o strike (juros subirem). Precificação: Black sobre o IDI a termo, com vol do IDI (derivada da vol de taxa × duration), ou modelos de taxa curta (Vasicek, etc.). O Carreira dedica bastante espaço a elas.</p>
<h3>Opções de Copom</h3>
<p>Digitais listadas na B3 que pagam R$ 1 se a decisão do Copom for a especificada (manutenção, corte de 25 bps, 50 bps...). O conjunto das opções forma uma distribuição de probabilidade implícita da decisão — muito usada por mesas para ler o mercado.</p>
<h3>Conexão com equity</h3>
<p>Mesas de equity derivatives no Brasil frequentemente dividem espaço (e risco) com as de juros e câmbio: produtos quanto, COEs em dólar, hedge de estrangeiros. Saber falar "cupom", "casado" e "DV01" é parte do repertório.</p>`,
    desk: String.raw`"Vol de dólar 1 mês a 14 com RR de +2" (calls mais caras). "Comprar call de dólar é comprar seguro contra o real." "O Copom está precificado 70/30 entre 25 e 50."`,
    refs: [R_.hull(16, 'Options on stock indices and currencies'), R_.hull('17.8', 'Black\'s model for valuing futures options'), R_.car('opções de dólar, opções de IDI e de Copom'), R_.cqf(3, 'opções de moedas')],
    sims: ['bs'],
    ex: [
      { tag: 'fxopt', gen: R => { const S = R.f(5, 5.6, 4), K = Math.round(S * 20) / 20, T = R.pick([1 / 12, 0.25, 0.5]), rd = R.f(0.1, 0.14, 3), rf = R.f(0.03, 0.06, 3), s = R.f(0.1, 0.2, 3); const a = Q.bsPrice('call', S, K, T, rd, rf, s); return { q: `Call de dólar (Garman-Kohlhagen): S = ${Q.fmt(S, 4)}, K = ${Q.fmt(K, 2)}, T = ${Q.fmt(T, 3)}, r_d = ${F.p(rd, 1)} cont., r_f = ${F.p(rf, 1)} cont., σ = ${F.p(s, 1)}. Preço (R$ por US$1)?`, a, tol: 0.01, tolAbs: 0.0003, dec: 4, e: `BS com q = r_f: ${Q.fmt(a, 4)}.` }; } },
      { tag: 'fxopt', gen: R => { const F0 = R.f(5, 5.6, 4), K = Math.round(F0 * 20) / 20, T = 0.25, r = 0.12, s = R.f(0.1, 0.2, 3); const a = Q.black76('call', F0, K, T, r, s).price; return { q: `Modelo de Black: forward de dólar ${Q.fmt(F0, 4)}, K = ${Q.fmt(K, 2)}, T = 0,25, r_d = 12% cont., σ = ${F.p(s, 1)}. Preço da call?`, a, tol: 0.01, tolAbs: 0.0003, dec: 4, e: `e^{−rT}[F·N(d1) − K·N(d2)] = ${Q.fmt(a, 4)}.` }; } },
      { t: 'mcq', q: 'O skew típico das opções de dólar contra real é:', o: ['Puts de dólar mais caras', 'Calls de dólar mais caras (RR positivo)', 'Simétrico sempre', 'Inexistente'], a: 1, e: 'O medo é de desvalorização do real (dólar sobe).' },
      { t: 'mcq', q: 'Uma call de IDI ganha valor quando:', o: ['Os juros (CDI acumulado) sobem acima do esperado', 'A bolsa sobe', 'O dólar cai', 'Os juros caem'], a: 0, e: 'O IDI acumula o CDI; call de IDI = aposta em juros mais altos.' }
    ],
    cards: [['Garman-Kohlhagen', 'BS com q = r_f (juros da moeda estrangeira).'], ['Black-76', 'c = e^{−rT}[F N(d1) − K N(d2)]'], ['Opções de Copom', 'Digitais da B3 sobre a decisão do Copom.']]
  }
  ]
});

/* ---------------- BR9 — Estruturados locais ---------------- */
Course.unit('br', {
  id: 'br9', title: 'Produtos estruturados locais',
  desc: 'COE com capital protegido e em risco, box e financiamento com opções, travas como produto de varejo, notas com barreira — como decompor, precificar e o risco que o banco emissor fica carregando.',
  sims: ['struct', 'book'], exam: { n: 10, minutes: 20 },
  lessons: [
  {
    id: 'br9-1', title: 'COE: decomposição e precificação', tag: 'coe',
    goal: 'Decompor um COE em zero-cupom + opções, calcular a participação possível e a margem embutida.',
    body: String.raw`
<p>O <b>COE</b> (Certificado de Operações Estruturadas) é o instrumento brasileiro para vender produtos estruturados ao investidor, emitido por bancos. Há duas modalidades: <b>valor nominal protegido</b> (capital garantido no vencimento, sujeito ao risco de crédito do emissor) e <b>valor nominal em risco</b>.</p>
<h3>Decomposição do capital protegido</h3>
<p>Com R$ 1.000 investidos por 2 anos, DI de 2 anos a 12%:</p>
<ol><li>Para garantir R$ 1.000 no fim, o banco "compra" um zero-cupom: \(1000/1{,}12^2 = R\$\,797{,}19\).</li>
<li>Sobram R$ 202,81 — o <b>orçamento de opções</b> (menos a margem do banco e custos de distribuição).</li>
<li>Com esse orçamento compra-se, por exemplo, um call spread de Ibovespa 100%/130%. Se ele custar 12% do nocional (R$ 120 por R$ 1.000), o orçamento compraria \(202{,}81/120 \approx 169\%\) de participação. Descontando uma margem do banco de, digamos, R$ 40, sobram R$ 162,81: \(162{,}81/120 \approx 136\%\) de participação na alta, limitada a 30%.</li></ol>
<div class="w" data-w="payoff" data-a='{"preset":"COE capital protegido (zero + call spread)","title":"Parte de opções de um COE: call spread 100/125 de 1 ano"}'></div>
<p>A fórmula: \(\text{Participação} = \dfrac{\text{Nocional} - ZC - \text{margem}}{\text{Custo das opções por 100\% de participação}}\).</p>
<h3>O que afeta o produto</h3>
<ul><li><b>Juros altos</b> = zero-cupom barato = mais orçamento = produtos atrativos. É por isso que COEs de capital protegido florescem no Brasil.</li>
<li><b>Vol alta</b> = opções caras = menor participação (ou teto mais baixo).</li>
<li><b>Prazo</b>: mais longo = zero mais barato, mas opções mais caras.</li>
<li><b>Dividendos</b>: índices com dividendos altos têm forward mais baixo → calls mais baratas.</li></ul>
<h3>O que o investidor precisa saber (e o trader também)</h3>
<ul><li><b>Risco de crédito do emissor</b>: o "capital protegido" é uma promessa do banco emissor — o COE <b>não</b> tem cobertura do FGC.</li>
<li><b>Liquidez</b>: não há mercado secundário relevante; resgatar antes do vencimento depende do preço que o emissor oferecer (marcado a mercado, com spread).</li>
<li><b>Documentação</b>: o COE é registrado na B3 e ofertado com um documento de informações essenciais (DIE) que descreve cenários de ganho e perda; a distribuição exige avaliação de adequação (suitability) do investidor.</li>
<li><b>Tipos populares</b>: capital protegido com participação na alta (call spread), "autocall" de valor nominal em risco (o investidor vende uma put com barreira), e estruturas com digitais (cupom fixo se o ativo terminar numa faixa).</li></ul>
<p>Para o investidor, o COE parece "não perde nunca". Para o trader, é um livro de opções longas vendidas: o banco fica <b>vendido</b> nas opções que entregou ao cliente (e as hedgeia). Próxima lição.</p>`,
    desk: String.raw`"Budget de opções", "participação", "teto/cap", "cupom". "O COE saiu com 110% de participação até 25% de alta". "Margem de estruturação" = o que o banco embute.`,
    refs: [R_.car('produtos estruturados e notas locais'), R_.hull('11.1', 'Principal-protected notes'), R_.hull('25.1', 'Packages')],
    sims: ['struct?preset=COE capital protegido (zero + call spread)'],
    ex: [
      { tag: 'coe', gen: R => { const N = 1000, i = R.f(0.1, 0.15, 4), anos = R.pick([1, 2, 3]); const a = N - N / Math.pow(1 + i, anos); return { q: `COE de R$ 1.000 com capital protegido, ${anos} ano(s) (${anos * 252} du), DI do prazo ${F.p(i, 2)}. Qual o orçamento para opções (antes da margem do banco)?`, a, tol: 0.001, unit: 'R$', dec: 2, e: `ZC = 1000/(1+${Q.fmt(i, 4)})^${anos} = ${Q.fmt(N - a, 2)}; orçamento = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'coe', gen: R => { const budget = R.f(100, 250, 2), m = R.f(20, 50, 2), cs = R.f(8, 16, 2); const a = (budget - m) / (cs * 10) * 100; return { q: `Orçamento de opções: R$ ${Q.fmt(budget, 2)} por R$ 1.000 de nocional. Margem do banco: R$ ${Q.fmt(m, 2)}. O call spread 100/130 custa ${Q.fmt(cs, 2)}% do nocional (por 100% de participação). Qual a participação máxima (em %)?`, a, tol: 0.003, unit: '%', dec: 1, e: `(${Q.fmt(budget, 2)} − ${Q.fmt(m, 2)}) / (${Q.fmt(cs, 2)}% × 1000) = ${Q.fmt(a, 1)}%.` }; } },
      { tag: 'coe', gen: R => { const part = R.pick([0.8, 1, 1.2, 1.5]), cap = R.pick([0.2, 0.3, 0.4]), ret = R.f(-0.3, 0.6, 3); const a = 1000 * (1 + part * Math.min(Math.max(ret, 0), cap)); return { q: `COE capital protegido R$ 1.000: participação de ${Q.fmt(part * 100, 0)}% na alta do Ibovespa, limitada a alta de ${Q.fmt(cap * 100, 0)}%. O índice variou ${F.p(ret, 1)}. Valor de resgate?`, a, tol: 0.0005, unit: 'R$', dec: 2, e: `1000 × (1 + ${part} × min(max(${Q.fmt(ret, 3)}, 0), ${cap})) = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'Por que COEs de capital protegido são mais atrativos quando os juros estão altos?', o: ['Porque as opções ficam mais baratas', 'Porque o zero-cupom fica mais barato, sobrando mais orçamento para opções', 'Porque a vol cai', 'Porque o IR é menor'], a: 1, e: 'Juros altos ⇒ ZC barato ⇒ mais budget.' },
      { t: 'mcq', q: 'Qual risco o investidor do COE de capital protegido ainda corre?', o: ['Nenhum', 'Risco de crédito do banco emissor (e liquidez antes do vencimento)', 'Risco de delta', 'Risco de margem na B3'], a: 1, e: 'A proteção é uma promessa do emissor; o COE não conta com a garantia do FGC.' }
    ],
    cards: [['COE capital protegido', 'Zero-cupom + opções (budget = nocional − ZC − margem).'], ['Participação', '(budget − margem) / custo das opções por 100%.']]
  },
  {
    id: 'br9-2', title: 'Box, financiamento com opções e travas como produto', tag: 'estruturados',
    goal: 'Entender as operações de renda fixa sintética com opções e as travas vendidas como produto de varejo.',
    body: String.raw`
<h3>Box de 4 pontas</h3>
<p>Como vimos na paridade, o box (call K1 − put K1 − call K2 + put K2) paga \(K_2 - K_1\) com certeza. É uma operação de renda fixa sintética: quem compra o box aplica; quem vende capta. A taxa implícita:</p>
\[ i_{box} = \left(\frac{K_2-K_1}{\text{Preço do box}}\right)^{252/du} - 1. \]
<p>Mesas usam box como funding/aplicação e arbitram quando a taxa se afasta do DI. Tributação: box é tratado como <b>renda fixa</b> (tabela regressiva), não como renda variável.</p>
<h3>Financiamento com opções ("financiamento")</h3>
<p>Compra a ação e lança uma call deep ITM. O resultado é quase certo: no vencimento, a ação será "chamada" pelo strike. O lucro = strike − (preço da ação − prêmio) — uma taxa prefixada. É o termo sintético usado por pessoas físicas para "aplicar a CDI+". Risco: se a ação cair abaixo do strike (improvável com call bem ITM), o financiamento vira perda.</p>
<h3>Travas como produto</h3>
<p>Bancos e corretoras vendem "operações estruturadas" de varejo: trava de alta com proteção parcial, fences, "tubarão" (call UO). Para o cliente, é uma visão com risco limitado; para a mesa, o fluxo agrega risco no livro — tipicamente a mesa fica <b>comprada</b> nas opções que o cliente vendeu (ex.: calls OTM das travas de alta) e vendida nas que ele comprou.</p>
<h3>Leitura de risco agregada</h3>
<p>O fluxo de varejo brasileiro é concentrado: lançamento coberto (mesa compra calls OTM), puts protetoras (mesa vende puts), COEs de alta com teto (mesa vende calls ATM e compra calls OTM). Isso molda o smile local: as calls OTM de ações populares tendem a ficar "baratas" (muita oferta).</p>`,
    desk: String.raw`"Box pagando 102% do CDI", "financiamento em PETR", "fazer uma estruturada para o cliente". "O varejo está vendendo calls" = oferta de vol nas asas de alta.`,
    refs: [R_.hull('11.3', 'Spreads (box spreads)'), R_.car('operações de renda fixa sintética no mercado brasileiro')],
    sims: ['struct?preset=Box (4 pontas)', 'struct?preset=Covered call (lançamento coberto)'],
    ex: [
      { tag: 'estruturados', gen: R => { const K1 = R.step(20, 40, 1), K2 = K1 + R.pick([5, 10]), du = R.pick([126, 252, 378]), i = R.f(0.1, 0.14, 4); const P = (K2 - K1) / Math.pow(1 + i, du / 252); const Pr = Math.round(P * 100) / 100; const a = (Math.pow((K2 - K1) / Pr, 252 / du) - 1) * 100; return { q: `Box ${K1}/${K2} com ${du} du negociado a ${Q.fmt(Pr, 2)}. Qual a taxa implícita (exp 252), em %?`, a, tol: 0.003, unit: '%', dec: 2, e: `(${K2 - K1}/${Q.fmt(Pr, 2)})^(252/${du}) − 1 = ${Q.fmt(a, 2)}%.` }; } },
      { tag: 'estruturados', gen: R => { const S = R.f(25, 40, 2), K = Math.round(S * 0.8), c = S - K + R.f(0.3, 0.9, 2), du = R.pick([21, 42]); const cost = S - c; const a = (Math.pow(K / cost, 252 / du) - 1) * 100; return { q: `Financiamento: compra a ação a ${F.r(S)} e lança call ${K} (deep ITM) a ${F.r(c)}, vencimento em ${du} du. Supondo exercício, qual a taxa anual (exp 252) da operação, em %?`, a, tol: 0.005, unit: '%', dec: 2, e: `Investe ${Q.fmt(cost, 2)}, recebe ${K}. (${K}/${Q.fmt(cost, 2)})^(252/${du}) − 1 = ${Q.fmt(a, 2)}%.` }; } },
      { t: 'mcq', q: 'Varejo fazendo muito lançamento coberto em uma ação popular tende a:', o: ['Encarecer as calls OTM', 'Baratear as calls OTM (muita oferta de vol)', 'Não afetar nada', 'Encarecer as puts'], a: 1, e: 'Oferta de calls deprime a IV das calls OTM.' },
      { t: 'tf', q: 'No Brasil, a tributação do box de 4 pontas segue a regra de renda fixa.', a: true, e: 'Operações conjugadas que resultam em renda fixa são tributadas como tal.' }
    ],
    cards: [['Taxa do box', '((K2−K1)/Preço)^(252/du) − 1'], ['Financiamento', 'Ação + call deep ITM vendida = renda fixa sintética.']]
  },
  {
    id: 'br9-3', title: 'O risco que o emissor carrega', tag: 'estruturados',
    goal: 'Ler o livro de uma mesa que emite estruturados e identificar os riscos que não se hedgeiam facilmente.',
    body: String.raw`
<p>Ao vender um COE com call spread 100/130 de 2 anos em Ibovespa, o banco fica <b>vendido</b> na call 100 e <b>comprado</b> na call 130 (a que limita o ganho do cliente). Somando milhares de clientes:</p>
<ul><li><b>Short vega longo</b> (opções de 1–3 anos): o mercado listado brasileiro tem pouca liquidez nesses prazos. A mesa hedgeia com o que existe (opções mais curtas, rolando) e fica com <b>risco de term structure</b>.</li>
<li><b>Skew</b>: vendeu ATM, comprou OTM → comprado na asa de alta. Se o skew mudar, o livro muda de valor mesmo sem a vol ATM mexer.</li>
<li><b>Dividendos</b>: forward de 2 anos depende de dividendos futuros incertos. Vendido em calls = comprado em dividendos (se os dividendos caírem, o forward sobe e as calls encarecem → perda). Mesas grandes hedgeiam com futuros/swaps de dividendos quando existem.</li>
<li><b>Rho / juros</b>: o zero-cupom e o forward dependem da curva de DI → hedge com DI1.</li>
<li><b>Correlação</b> (em COEs de cestas ou worst-of) e <b>quanto</b> (em índices internacionais).</li>
<li><b>Gap/liquidez</b>: em eventos (circuit breaker, feriados), o hedge não se ajusta a tempo.</li></ul>
<h3>O livro concentrado</h3>
<p>Como a distribuição de produtos vai "na mesma direção" (clientes querem alta com proteção), todos os emissores ficam com riscos parecidos: short vol longa, long skew de alta, short dividendos… Quando todos precisam hedgear o mesmo risco ao mesmo tempo, o mercado se mexe contra eles. Isso cria oportunidades (e perigos) para mesas proprietárias que operam o outro lado.</p>
<p>Explore o livro "Emissor de COE" no simulador <b>Livro de Risco</b>: veja a ladder de vega (concentrada em 1–2 anos) e os cenários de stress.</p>`,
    desk: String.raw`"O fluxo de estruturados deixa o street curto de vol longa." "Axe para comprar vol de 2 anos." "Risco de dividendos" / "div risk". "Street" = conjunto dos bancos dealers.`,
    refs: [R_.hull('25.16', 'Static options replication'), R_.wil(29, 'Equity and FX term sheets'), R_.car('gestão de risco de livros de derivativos locais')],
    sims: ['book'],
    ex: [
      { t: 'mcq', q: 'Um banco que emite muitos COEs de alta com call spread fica, em vega de prazos longos:', o: ['Comprado', 'Vendido', 'Neutro', 'Depende do DI'], a: 1, e: 'Vendeu a call ATM (mais vega) e comprou a OTM: líquido vendido em vega.' },
      { t: 'mcq', q: 'Estar vendido em calls longas de índice deixa a mesa exposta a dividendos como:', o: ['Vendido em dividendos: ganha se dividendos subirem', 'Comprado em dividendos: perde se dividendos caírem (forward sobe)', 'Sem exposição', 'Só exposição a juros'], a: 1, e: 'Dividendos menores ⇒ forward maior ⇒ calls mais caras ⇒ perda para quem está vendido.' },
      { tag: 'estruturados', gen: R => { const n = R.int(50, 300) * 1000, vg = R.f(0.3, 0.6, 2), dv = R.f(1, 5, 1); const a = -n * vg * dv; return { q: `O livro de COEs está vendido em ${Q.fmt(n, 0)} calls de 2 anos (vega R$ ${Q.fmt(vg, 2)}/pt cada). A vol de 2 anos sobe ${Q.fmt(dv, 1)} pts. PnL?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `−${n} × ${Q.fmt(vg, 2)} × ${Q.fmt(dv, 1)} = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'Por que a concentração de fluxo de estruturados é um risco sistêmico para os emissores?', o: ['Porque todos carregam riscos parecidos e precisam hedgeá-los ao mesmo tempo', 'Porque a B3 proíbe', 'Porque os clientes cancelam', 'Não é risco'], a: 0, e: 'Hedge "crowded" move o mercado contra quem hedgeia.' }
    ],
    cards: [['Risco do emissor de COE', 'Short vega longo, skew, dividendos, rho, correlação, gap.'], ['Vendido em calls ⇒ dividendos', 'Comprado em dividendos (perde se caírem).']]
  }
  ]
});

/* ---------------- BR10 — Risco, PnL e operação ---------------- */
Course.unit('br', {
  id: 'br10', title: 'Gestão de risco, PnL, margem e tributação',
  desc: 'PnL attribution (explain), limites de gregas, stress e VaR, margem da B3 e custos, e a tributação de derivativos para pessoa física no Brasil.',
  sims: ['book'], exam: { n: 12, minutes: 25 },
  lessons: [
  {
    id: 'br10-1', title: 'Cálculo de PnL e PnL explain', tag: 'pnl-explain',
    goal: 'Calcular o PnL de um livro de opções e decompô-lo por gregas, identificando o não explicado.',
    body: String.raw`
<p>O <b>PnL</b> (profit and loss) diário de um livro é a diferença de valor de mercado (MtM) entre dois fechamentos, mais fluxos (prêmios, ajustes de futuros, dividendos, juros sobre caixa):</p>
\[ \text{PnL}_t = MtM_t - MtM_{t-1} + \text{fluxos}_t. \]
<p>O <b>PnL explain</b> (ou <i>attribution</i>) usa a expansão de Taylor com as gregas do fechamento anterior:</p>
\[ \text{PnL} \approx \underbrace{\Delta\,\delta S}_{\text{delta}} + \underbrace{\tfrac12\Gamma\,\delta S^2}_{\text{gamma}} + \underbrace{\mathcal{V}\,\delta\sigma}_{\text{vega}} + \underbrace{\Theta\,\delta t}_{\text{theta}} + \underbrace{\text{Vanna}\,\delta S\,\delta\sigma + \tfrac12\text{Volga}\,\delta\sigma^2}_{\text{2ª ordem}} + \rho\,\delta r + \dots + \text{novos negócios} + \text{não explicado}. \]
<h3>Componentes típicos de um relatório</h3>
<table><tr><th>Linha</th><th>O que é</th></tr>
<tr><td>Delta PnL</td><td>efeito do spot sobre o delta de abertura (pequeno se hedgeado)</td></tr>
<tr><td>Gamma PnL</td><td>convexidade ½Γ(δS)²</td></tr>
<tr><td>Theta</td><td>passagem do tempo</td></tr>
<tr><td>Vega PnL</td><td>mudança de vol implícita (geralmente por vencimento e strike)</td></tr>
<tr><td>New deals / day-1 PnL</td><td>edge dos negócios fechados no dia (bid/ask)</td></tr>
<tr><td>Carry / financiamento</td><td>juros sobre caixa, aluguel, dividendos</td></tr>
<tr><td>Unexplained</td><td>o que sobra; tem que ser pequeno</td></tr></table>
<p>Um unexplained grande sinaliza: gregas mal calculadas, risco de ordem superior (barreiras, gaps), mudança no formato do smile não capturada por um único "vega", erro de booking ou de preço de mercado. Controllers e risco olham isso todo dia.</p>`,
    desk: String.raw`"O explain fechou com 95% explicado." "Ganhei no gamma e perdi no vega." "Day-one PnL" = lucro do negócio no momento da contratação. "Unexplained de 200 mil: tem algo errado no booking."`,
    refs: [R_.hull('18ap', 'Taylor series expansions and hedge parameters'), R_.wil(7, 'The Black-Scholes formulae and the Greeks'), R_.hull('21.5', 'Quadratic model')],
    sims: ['book'],
    ex: [
      { tag: 'pnl-explain', gen: R => { const D = R.int(-2000, 2000), G = R.f(50, 400, 1) * R.sign(), V = R.int(-8000, 8000), Th = R.int(-3000, 3000), dS = R.f(-2, 2, 2), dv = R.f(-1.5, 1.5, 1); const a = D * dS + 0.5 * G * dS * dS + V * dv + Th; return { q: `Gregas do livro no fechamento de ontem: Δ = ${D} ações, Γ = ${Q.fmt(G, 1)} (ações por R$), vega = R$ ${V}/pt, θ = R$ ${Th}/dia. Hoje: spot ${dS >= 0 ? '+' : ''}${Q.fmt(dS, 2)} R$, vol ${dv >= 0 ? '+' : ''}${Q.fmt(dv, 1)} pt, 1 dia. PnL explicado?`, a, tol: 0.002, tolAbs: 2, unit: 'R$', dec: 0, e: `Δ: ${Q.fmt(D * dS, 0)}; Γ: ${Q.fmt(0.5 * G * dS * dS, 0)}; vega: ${Q.fmt(V * dv, 0)}; θ: ${Th}. Total: ${Q.fmt(a, 0)}.` }; } },
      { tag: 'pnl-explain', gen: R => { const exp = R.int(-50, 50) * 1000, act = exp + R.int(-30, 30) * 1000; const a = act - exp; return { q: `O PnL total do dia foi R$ ${Q.fmt(act, 0)} e a soma das componentes explicadas foi R$ ${Q.fmt(exp, 0)}. Qual o unexplained?`, a, tolAbs: 1, unit: 'R$', dec: 0, e: `Unexplained = real − explicado = ${Q.fmt(a, 0)}.` }; } },
      { t: 'mcq', q: 'O unexplained do livro ficou grande num dia de crash. Causa mais provável:', o: ['Theta', 'Termos de ordem superior e mudança de formato do smile não capturados pela expansão de 1ª/2ª ordem', 'Erro no dividendo', 'Juros'], a: 1, e: 'Choques grandes quebram a aproximação de Taylor; barreiras e skew amplificam.' },
      { t: 'mcq', q: 'O "day-1 PnL" de um negócio com cliente corresponde a:', o: ['Theta do primeiro dia', 'O edge entre o preço negociado e o valor justo (mid) no momento do trade', 'O ajuste do futuro', 'Os dividendos'], a: 1, e: 'É o spread capturado na contratação.' }
    ],
    cards: [['PnL explain', 'ΔδS + ½ΓδS² + 𝒱δσ + Θδt + vanna/volga + ... + unexplained'], ['Unexplained grande', 'Sinal de risco não mapeado ou erro de booking/preço.']]
  },
  {
    id: 'br10-2', title: 'Limites, stress e VaR', tag: 'risco',
    goal: 'Entender como uma mesa controla risco: limites de gregas, cenários de stress, VaR e concentração.',
    body: String.raw`
<h3>Limites de gregas</h3>
<p>Cada mesa tem limites aprovados: delta cash, gamma (por 1%), vega (total e por vencimento), vega ponderada, skew, theta, concentração por ativo e por nível de barreira. O trader opera dentro deles; estouros precisam de aprovação e plano para reduzir.</p>
<h3>Stress e cenários</h3>
<p>Gregas são locais. Para choques grandes, a mesa faz <b>reprecificação completa</b> (full revaluation) numa grade de spot × vol (ex.: spot de −30% a +30%, vol de −10 a +30 pontos) e em cenários históricos: 1987, 2008, Joesley Day (18/05/2017, circuit breaker no Ibovespa), Covid (mar/2020). A B3 também usa cenários na margem.</p>
<p>Por que a grade é essencial: um livro short gamma com gregas "pequenas" pode perder uma fortuna num gap de 10%; um livro com barreiras pode mudar de sinal. Uma forma clássica de ler: <b>onde está o pior ponto da grade</b> e se ele cabe no limite de stress.</p>
<h3>VaR</h3>
<p>O <b>Value at Risk</b> responde: "com X% de confiança, qual a perda máxima em h dias?".</p>
<ul><li><b>Paramétrico (delta-normal)</b>: \(VaR = z_\alpha\,\sigma_{diária}\sqrt{h}\times \text{exposição}\); \(z_{95\%}=1{,}645\), \(z_{99\%}=2{,}326\). Ignora gamma e vega — ruim para opções.</li>
<li><b>Histórico</b>: reaplica os retornos dos últimos N dias à carteira atual com reprecificação completa. Captura não linearidade e caudas reais.</li>
<li><b>Monte Carlo</b>: simula cenários de um modelo.</li></ul>
<p>O <b>Expected Shortfall</b> (média das perdas além do VaR) é a medida de Basileia hoje: olha a cauda, não só o limiar.</p>
<h3>Outros riscos</h3>
<p>Liquidez (quanto tempo para desmontar), concentração (muitas barreiras no mesmo nível, posição grande versus volume), risco de modelo (vol flat para barreira), risco operacional (booking).</p>`,
    desk: String.raw`"Estou em 85% do limite de vega." "O stress de −20% está pegando." "VaR de 1 dia a 99%." "Joesley Day" é o cenário de stress brasileiro clássico (Ibovespa −8,8% com circuit breaker).`,
    refs: [R_.hull(21, 'Value at risk'), R_.wil(19, 'Value at Risk'), R_.wil(43, 'CrashMetrics'), R_.ek('11.1', 'Value at risk'), R_.ek('11.2', 'Coherent risk measures'), R_.cqf(2, 'VaR e gestão de risco')],
    sims: ['book'],
    ex: [
      { tag: 'risco', gen: R => { const E = R.int(1, 20) * 1e6, s = R.f(0.15, 0.4, 2), h = R.pick([1, 10]), z = R.pick([[1.645, '95%'], [2.326, '99%']]); const a = z[0] * s / Math.sqrt(252) * Math.sqrt(h) * E; return { q: `VaR paramétrico: exposição de R$ ${Q.fmt(E, 0)}, vol anual ${F.p(s, 0)}, horizonte ${h} dia(s), confiança ${z[1]} (z = ${z[0]}).`, a, tol: 0.003, unit: 'R$', dec: 0, e: `${z[0]} × ${Q.fmt(s, 2)}/√252 × √${h} × ${Q.fmt(E, 0)} = ${Q.fmt(a, 0)}.` }; } },
      { tag: 'risco', gen: R => { const G = R.int(-600, -100) * 1000, mv = R.pick([5, 8, 10]); const a = 0.5 * G * mv * mv / 100; return { q: `Um livro delta-neutro tem gamma cash de R$ ${Q.fmt(G, 0)} por 1% (o delta cash varia ${Q.fmt(G, 0)} para cada 1% de move). Estime o PnL de gamma num gap de ${mv}% (em qualquer direção).`, a, tol: 0.001, unit: 'R$', dec: 0, e: `PnL ≈ ½·Γ·(S·n%)² = ½ × (Γ·S²·1%) × n² × 1% = ½ × ${Q.fmt(G, 0)} × ${mv}² / 100 = ${Q.fmt(a, 0)}. Short gamma perde nos dois sentidos.` }; } },
      { t: 'mcq', q: 'Por que o VaR delta-normal é inadequado para livros de opções?', o: ['Porque é muito conservador', 'Porque ignora gamma, vega e não linearidade (caudas)', 'Porque usa dados históricos', 'Porque a B3 não aceita'], a: 1, e: 'Aproximação linear falha em carteiras convexas/côncavas.' },
      { t: 'mcq', q: 'O Expected Shortfall a 97,5% mede:', o: ['A perda no percentil 97,5%', 'A média das perdas piores que o percentil 97,5%', 'O ganho esperado', 'O VaR de 10 dias'], a: 1, e: 'ES = média da cauda além do VaR.' }
    ],
    cards: [['VaR paramétrico', 'z·σ_diária·√h·exposição (z95 = 1,645; z99 = 2,326)'], ['Expected Shortfall', 'Média das perdas além do VaR.'], ['Full revaluation', 'Reprecificar tudo em cada cenário (grade spot×vol).']]
  },
  {
    id: 'br10-3', title: 'Margem na B3 e custos operacionais', tag: 'margem',
    goal: 'Entender como a B3 exige garantias de posições em derivativos e quais custos corroem o edge.',
    body: String.raw`
<h3>Contraparte central e margem</h3>
<p>A B3 é a <b>contraparte central</b> (CCP) de todos os negócios de bolsa: ela garante o cumprimento, e por isso exige <b>garantias</b> (margem) de quem assume risco. A metodologia é o <b>CORE</b> (Close-Out Risk Evaluation): a B3 estima quanto custaria encerrar a carteira do participante em cenários de stress (de vários dias, considerando o tempo de liquidação), e exige garantias para cobrir a pior perda, levando em conta compensação entre posições.</p>
<ul><li><b>Titular de opção</b> (comprado): paga o prêmio à vista e, em geral, não deposita margem pela opção.</li>
<li><b>Lançador</b> (vendido): deposita margem (ou as próprias ações, na venda coberta).</li>
<li><b>Futuros</b>: margem + ajuste diário em dinheiro.</li>
<li>Carteiras hedgeadas (ex.: box, collar) exigem bem menos margem que as pernas isoladas — o CORE enxerga a compensação.</li></ul>
<p>Garantias aceitas: dinheiro, títulos públicos, ações (com deságio), CDBs, cartas de fiança etc. <b>Chamada de margem</b>: se a garantia não cobre o risco, o participante precisa depositar mais — ou tem posições encerradas.</p>
<h3>Custos</h3>
<table><tr><th>Custo</th><th>Comentário</th></tr>
<tr><td>Emolumentos e taxas da B3</td><td>por negócio/volume; diferentes para day trade</td></tr>
<tr><td>Corretagem</td><td>negociada; mesas institucionais pagam pouquíssimo</td></tr>
<tr><td>Spread bid/ask</td><td>o maior custo para quem hedgeia muito (short gamma!)</td></tr>
<tr><td>Aluguel de ações (BTC)</td><td>para vender a descoberto no hedge</td></tr>
<tr><td>Custo de capital/margem</td><td>garantias têm custo de oportunidade</td></tr></table>
<p>Um trade de vol com edge de 0,5 ponto pode desaparecer em custos de hedge se o ativo for ilíquido. Por isso mesas escolhem onde hedgear (futuro de índice vs cesta de ações, por exemplo).</p>`,
    desk: String.raw`"Chamada de margem", "garantia depositada", "o CORE aliviou porque o livro está hedgeado". "BTC" = banco de títulos (aluguel). "Taxa de aluguel está alta: shortar está caro".`,
    refs: [R_.hull('2.4', 'The operation of margins'), R_.hull('9.7', 'Margins'), R_.car('infraestrutura da B3: câmara, margens e garantias')],
    ex: [
      { t: 'mcq', q: 'Na B3, quem normalmente precisa depositar margem por uma posição em opções?', o: ['O titular (comprador)', 'O lançador (vendedor)', 'Ambos igualmente', 'Ninguém'], a: 1, e: 'O titular paga o prêmio; o lançador assume obrigação e deposita garantias.' },
      { t: 'mcq', q: 'Um box de 4 pontas tende a exigir margem:', o: ['Enorme, soma das quatro pernas', 'Pequena, pois o risco líquido é quase nulo e o CORE compensa as pernas', 'Zero sempre', 'Igual a um futuro'], a: 1, e: 'Metodologias de portfólio reconhecem compensação.' },
      { tag: 'margem', gen: R => { const n = R.int(10, 200) * 1000, S = R.f(10, 60, 2), tx = R.f(0.5, 8, 1); const a = n * S * tx / 100 / 252 * R.pick([21]); return { q: `Você aluga ${Q.fmt(n, 0)} ações a ${F.r(S)} para o hedge, com taxa de aluguel de ${Q.fmt(tx, 1)}% a.a. (base 252). Custo em 21 dias úteis?`, a, tol: 0.003, unit: 'R$', dec: 2, e: `${Q.fmt(n, 0)}×${Q.fmt(S, 2)}×${Q.fmt(tx, 1)}%×21/252 = ${Q.fmt(a, 2)}.` }; } },
      { t: 'tf', q: 'A B3 atua como contraparte central, garantindo os negócios realizados em bolsa.', a: true, e: 'É a câmara de compensação: interpõe-se entre comprador e vendedor.' }
    ],
    cards: [['CORE', 'Metodologia de margem da B3 (close-out risk evaluation), por carteira.'], ['Quem deposita margem em opções', 'O lançador (vendedor).'], ['BTC', 'Aluguel de ações na B3.']]
  },
  {
    id: 'br10-4', title: 'Tributação de derivativos (pessoa física)', tag: 'ir',
    goal: 'Conhecer as regras básicas de IR sobre opções e futuros para pessoa física no Brasil.',
    body: String.raw`
<div class="box warn"><div class="bt">Atenção</div>As regras tributárias mudam (houve propostas recentes de unificação de alíquotas). O conteúdo abaixo resume as regras gerais de referência para pessoa física; confirme a legislação vigente antes de declarar. Não é aconselhamento tributário.</div>
<h3>Regras gerais (renda variável, PF)</h3>
<table><tr><th>Item</th><th>Operações comuns (swing)</th><th>Day trade</th></tr>
<tr><td>Alíquota sobre ganho líquido mensal</td><td>15%</td><td>20%</td></tr>
<tr><td>IRRF ("dedo-duro")</td><td>0,005% sobre o valor de venda</td><td>1% sobre o ganho</td></tr>
<tr><td>Compensação de prejuízos</td><td>com ganhos futuros da mesma modalidade</td><td>só com day trade</td></tr>
<tr><td>Isenção de vendas até R$ 20 mil/mês</td><td colspan="2">vale para <b>ações à vista</b>, <b>não</b> para opções e futuros</td></tr></table>
<ul><li>Apuração <b>mensal</b> pelo próprio investidor; pagamento via DARF (código 6015) até o último dia útil do mês seguinte.</li>
<li>Opções: o ganho é apurado no encerramento (venda/recompra), no exercício (o prêmio compõe o custo/preço da ação) ou no vencimento sem exercício (prêmio pago vira prejuízo; prêmio recebido vira ganho).</li>
<li>Futuros: ganhos e perdas pelos ajustes diários, apurados no mês.</li>
<li><b>Operações conjugadas que resultam em renda fixa</b> (box, financiamento) são tributadas como renda fixa.</li>
<li>Pessoa jurídica, fundos e investidores estrangeiros têm regimes diferentes — relevante para a mesa, que normalmente opera pelo banco.</li></ul>
<h3>Para o trader</h3>
<p>Na mesa do banco, o PnL é bruto e a tributação é corporativa. Mas entender o IR do cliente pessoa física explica o <b>fluxo</b>: estratégias como financiamento e box, a preferência por certas estruturas, e o comportamento no fim do mês/ano.</p>`,
    desk: String.raw`"Dedo-duro" = IRRF sobre a operação. "Zerar no mesmo dia vira day trade" (alíquota maior). Clientes PF "realizam prejuízo" no fim do ano para compensar ganhos.`,
    refs: [R_.car('aspectos tributários do mercado brasileiro (verificar legislação atual)'), R_.hull('9.10', 'Taxation (regras dos EUA — só para comparação)')],
    ex: [
      { tag: 'ir', gen: R => { const g = R.int(2, 50) * 1000, l = R.int(0, 20) * 500; const a = Math.max(g - l, 0) * 0.15; return { q: `Pessoa física, operações comuns com opções no mês: ganhos de R$ ${Q.fmt(g, 0)} e prejuízo acumulado a compensar de R$ ${Q.fmt(l, 0)}. Qual o IR devido (antes de descontar o IRRF), pela regra de 15%?`, a, tol: 0.001, tolAbs: 0.5, unit: 'R$', dec: 2, e: `(${Q.fmt(g, 0)} − ${Q.fmt(l, 0)}) × 15% = ${Q.fmt(a, 2)}.` }; } },
      { tag: 'ir', gen: R => { const g = R.int(1, 30) * 1000; const a = g * 0.2; return { q: `Ganho líquido de R$ ${Q.fmt(g, 0)} em day trade com opções no mês, sem prejuízos a compensar. IR devido (antes do IRRF), pela regra de 20%?`, a, tol: 0.001, unit: 'R$', dec: 2, e: `${Q.fmt(g, 0)} × 20% = ${Q.fmt(a, 2)}.` }; } },
      { t: 'mcq', q: 'A isenção para vendas de até R$ 20 mil por mês se aplica a opções?', o: ['Sim', 'Não, vale para ações no mercado à vista', 'Só para puts', 'Só para day trade'], a: 1, e: 'A isenção é para alienação de ações à vista.' },
      { t: 'mcq', q: 'Uma put comprada que vence sem valor gera, para fins de IR:', o: ['Nada', 'Prejuízo igual ao prêmio pago (compensável)', 'Ganho', 'Isenção'], a: 1, e: 'O prêmio pago vira prejuízo no mês do vencimento.' }
    ],
    cards: [['IR swing trade (PF)', '15% sobre ganho líquido mensal; IRRF 0,005% sobre venda.'], ['IR day trade (PF)', '20%; IRRF 1% sobre o ganho.'], ['Isenção R$ 20 mil', 'Só ações à vista, não opções/futuros.']]
  }
  ]
});
})();
