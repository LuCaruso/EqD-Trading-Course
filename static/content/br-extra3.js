/* Módulo Brasil — lições v5: leitura de tela, gráficos da mesa, bid/offer e remuneração eficiente do portfólio */
(function () {
const R_ = window.REF;

/* ============ BR2-6 — Lendo a tela ============ */
Course.addLesson('br2', {
  id: 'br2-6', title: 'Lendo a tela: livro de ofertas, grade de opções, times & trades e open interest', tag: 'tela',
  goal: 'Olhar uma tela de opções e, em segundos, saber onde está o preço justo, o que está líquido, quem está agredindo e onde está o posicionamento.',
  body: String.raw`
<p>A tela de uma mesa (Profit, Bloomberg, a plataforma da corretora) tem quatro painéis que você vai ler centenas de vezes por dia. O objetivo desta lição é criar o <b>roteiro de leitura</b> — e depois treinar no simulador <b>Tela de Opções</b>, que tem um jogo de perguntas.</p>
<h3>1. Livro de ofertas (book)</h3>
<ul><li>À esquerda as <b>compras (bid)</b>, à direita as <b>vendas (offer/ask)</b>, do melhor preço para o pior, com a quantidade em cada nível. A diferença entre o melhor bid e o melhor ask é o <b>spread</b>.</li>
<li><b>Profundidade</b>: quanto dá para negociar sem mexer o preço. Um ask de 200 ações a 39,27 com 50 mil a 39,30 conta uma história diferente de 50 mil a 39,27.</li>
<li>Ordens podem estar escondidas (iceberg: só uma parte aparece) e o book muda de cara no <b>leilão</b> de abertura e de fechamento.</li></ul>
<h3>2. Grade de opções (option chain)</h3>
<p>Uma linha por strike, calls de um lado e puts do outro. Colunas típicas: bid, ask, último, vol implícita, delta, volume e contratos em aberto. O roteiro:</p>
<ol><li><b>Ache o ATM</b> (strike mais próximo do spot/forward). É ali que estão liquidez, gamma e vega.</li>
<li><b>Leia o spread</b> de cada série — em R$ e, principalmente, em pontos de vol:</li></ol>
\[ \text{mid} = \frac{\text{bid} + \text{ask}}{2}, \qquad \text{largura em vol} \approx \frac{\text{ask} - \text{bid}}{\mathcal{V}_{pt}} \]
<ol start="3"><li><b>Monte o smile</b>: a vol implícita do mid por strike. Em ações ela costuma cair com o strike (skew).</li>
<li><b>Compare call e put do mesmo strike</b>: pela paridade, as vols implícitas devem ser quase iguais. Se não forem, algo explica — dividendo, aluguel caro, exercício americano, ou um preço fora do lugar.</li>
<li><b>Sanidade</b>: calls ficam mais baratas quando o strike sobe e puts mais caras; nenhuma opção abaixo do valor intrínseco; borboletas nunca negativas (\(C_{K-1} - 2C_K + C_{K+1} \ge 0\)). Violação na tela = arbitragem (ou cotação velha).</li></ol>
<div class="box warn"><div class="bt">Armadilha nº 1: o "último"</div>O último negócio pode ter acontecido horas atrás, com outro spot. Preço justo se lê no <b>bid/ask agora</b>, não no último. Variação do dia calculada com o último de uma série ilíquida engana.</div>
<h3>3. Times &amp; trades (negócios realizados)</h3>
<ul><li>Hora, série, preço, quantidade e quem <b>agrediu</b>: negócio no ask = <b>comprador</b> atravessou o spread; no bid = <b>vendedor</b> bateu.</li>
<li>Procure <b>blocos grandes</b>, <b>sequências</b> na mesma direção (alguém "varrendo" vários strikes) e de que lado está o fluxo nas puts (compra de proteção empina o skew).</li></ul>
<h3>4. Volume e open interest</h3>
<ul><li><b>Volume</b> = contratos negociados hoje. <b>Open interest (OI)</b> = contratos em aberto (a B3 divulga diariamente as posições em aberto por série).</li>
<li>OI subindo com volume alto = <b>posições novas</b>; OI caindo = <b>encerramento</b>. Volume alto sem mudança de OI = giro (day trade).</li>
<li>Strikes com OI enorme viram "ímãs" perto do vencimento (pin risk, Módulo US) e dizem onde está o gamma dos market makers.</li></ul>
<h3>Checklist de 20 segundos</h3>
<ol><li>Spot e variação; o book está equilibrado?</li><li>Vencimento certo selecionado?</li><li>ATM e sua vol implícita (mid).</li><li>Spreads em vol: onde dá para operar?</li><li>Forma do smile; call × put coerentes?</li><li>Alguma violação de sanidade?</li><li>Fluxo recente no times &amp; trades.</li><li>Onde está o OI.</li></ol>`,
  desk: String.raw`"Tela tá seca" (sem liquidez), "book fino", "tem um iceberg no 39,30", "estão varrendo as puts", "o último é velho, olha o mid", "formador tá cotando 1,20 / 1,26", "OI grande no 40: vai pinar".`,
  deep: String.raw`<p>O <b>forward implícito</b> sai da paridade usando os mids do strike ATM: \(F = K + (c - p)\,e^{rT}\). Comparar \(F\) com \(S e^{rT}\) revela o dividendo e o aluguel embutidos (lição 1.6). Mesas usam esse F implícito — e não o spot — para calcular as vols da grade, porque ele já incorpora o carry que o mercado está precificando.</p>`,
  refs: [R_.hull('9.5', 'Trading (market makers, bid–offer spread)'), R_.hull('10.4', 'Put–call parity'), R_.hull('14.11', 'Implied volatilities'), R_.wil('2.7', 'Market conventions'), R_.car('microestrutura e prática do mercado brasileiro')],
  sims: ['tela'],
  ex: [
    { tag: 'tela', gen: R => { const b = R.f(0.5, 4, 2), a = Math.round((b + R.f(0.02, 0.2, 2)) * 100) / 100; const x = (a + b) / 2; return { q: `Na tela, a call está ${Q.fmt(b, 2)} / ${Q.fmt(a, 2)} (bid / ask). Qual o mid?`, a: x, tol: 0.001, tolAbs: 0.0051, dec: 3, unit: 'R$', e: `(${Q.fmt(b, 2)} + ${Q.fmt(a, 2)})/2 = ${Q.fmt(x, 3)}.` }; } },
    { tag: 'tela', gen: R => { const w = R.f(0.03, 0.25, 2), v = R.f(0.02, 0.15, 3); const x = w / v; return { q: `O spread de uma série é de R$ ${Q.fmt(w, 2)} e a vega é ${Q.fmt(v, 3)} por ponto de vol. Qual a largura do bid/offer em pontos de vol?`, a: x, tol: 0.005, dec: 3, unit: 'pts', e: `${Q.fmt(w, 2)} / ${Q.fmt(v, 3)} = ${Q.fmt(x, 2)} pontos de vol.` }; } },
    { t: 'mcq', q: 'A put está 1,45 / 1,52. No times & trades aparece um negócio de 5.000 a 1,52. O que isso indica?', o: ['Um vendedor agressivo bateu no bid', 'Um comprador agressivo pagou o ask', 'Um negócio no mid', 'Um erro de cotação'], a: 1, e: 'Negócio no preço do ask = o comprador atravessou o spread (agressor comprador).' },
    { t: 'mcq', q: 'Numa série, o open interest foi de 20 mil para 45 mil contratos com volume alto e o prêmio subiu. A leitura mais provável:', o: ['Posições antigas sendo encerradas', 'Novas posições compradas sendo abertas', 'Só day trade, sem posição nova', 'Exercício antecipado'], a: 1, e: 'OI subindo = posições novas; prêmio subindo junto sugere pressão compradora.' },
    { tag: 'tela', gen: R => { const S = R.f(30, 50, 2), K = Math.round(S - R.int(3, 6)), r = 0.105, T = R.pick([21, 42]) / 252; const intr = S - K * Math.exp(-r * T), ask = Math.round((intr - R.f(0.05, 0.3, 2)) * 100) / 100; const x = intr - ask; return { q: `Spot ${F.r(S)}, call europeia strike ${K} com ${Q.fmt(T * 252, 0)} d.u., r = 10,5% contínua, sem dividendos. O ask da call está em ${Q.fmt(ask, 2)}. Quanto você trava por opção comprando a call, vendendo a ação e aplicando K·e^{−rT}?`, a: x, tol: 0.01, tolAbs: 0.005, dec: 3, unit: 'R$', e: `Limite inferior: S − K·e^{−rT} = ${Q.fmt(S, 2)} − ${Q.fmt(K * Math.exp(-r * T), 3)} = ${Q.fmt(intr, 3)}. Lucro garantido = ${Q.fmt(intr, 3)} − ${Q.fmt(ask, 2)} = ${Q.fmt(x, 3)}.` }; } },
    { t: 'mcq', q: 'O último negócio da call foi 1,20 às 10h05. Agora (16h30) o spot subiu e a tela mostra 1,45 / 1,52. Qual a melhor estimativa do preço justo agora?', o: ['1,20 (último)', 'Perto de 1,485 (mid atual)', '1,52 sempre', 'Impossível estimar'], a: 1, e: 'O último é velho; o preço de agora está no bid/ask — use o mid.' },
    { tag: 'tela', gen: R => { const c1 = R.f(3, 5, 2), c3 = Math.round((c1 - R.f(1.2, 1.8, 2)) * 100) / 100; const fair = (c1 + c3) / 2 - R.f(0.02, 0.1, 2), wrong = R.u() < 0.5; const c2 = Math.round((wrong ? (c1 + c3) / 2 + R.f(0.03, 0.1, 2) : fair) * 100) / 100; const fly = c1 - 2 * c2 + c3; return { t: 'mcq', q: `Calls (mids) nos strikes 38 / 39 / 40: ${Q.fmt(c1, 2)} / ${Q.fmt(c2, 2)} / ${Q.fmt(c3, 2)}. A borboleta 38-39-40 está coerente?`, o: ['Sim: C38 − 2·C39 + C40 ≥ 0', 'Não: a borboleta sai negativa — há arbitragem (ou preço velho)'], a: fly < 0 ? 1 : 0, e: `C38 − 2·C39 + C40 = ${Q.fmt(c1, 2)} − 2×${Q.fmt(c2, 2)} + ${Q.fmt(c3, 2)} = ${Q.fmt(fly, 2)}. ${fly < 0 ? 'Negativa: você receberia para montar algo que nunca paga negativo.' : 'Não negativa: ok.'}` }; } }
  ],
  cards: [['Mid', '(bid + ask)/2 — o preço justo de tela, não o último.'], ['Largura em vol', '(ask − bid) / vega por ponto.'], ['Agressor', 'Negócio no ask = comprador agressivo; no bid = vendedor.'], ['Open interest', 'Contratos em aberto: sobe com posições novas, cai com encerramento.'], ['Sanidade da grade', 'Nada abaixo do intrínseco; borboletas ≥ 0; call × put com vols coerentes.']]
}, 'br2-5');

/* ============ BR3-7 — Gráficos da mesa ============ */
Course.addLesson('br3', {
  id: 'br3-7', title: 'Gráficos da mesa: candles, vol realizada × implícita, cone de vol e IV rank', tag: 'graficos',
  goal: 'Ler os gráficos que um trader de vol olha todo dia e tirar deles uma pergunta objetiva: a vol está cara ou barata?',
  body: String.raw`
<h3>Candles: o preço em quatro números</h3>
<p>Cada candle resume um período (1 dia, 60 min, 5 min) com <b>abertura, máxima, mínima e fechamento</b> (OHLC). O corpo vai da abertura ao fechamento (verde se fechou acima, vermelho se abaixo); os pavios mostram até onde o preço foi. Pavio longo embaixo com fechamento perto da máxima = a queda foi rejeitada. <b>Gap</b> = abertura longe do fechamento anterior (a notícia saiu com o mercado fechado — é o salto que o delta hedge não pega).</p>
<p><b>Médias móveis</b> (MM20, MM50, MM200) e <b>suportes/resistências</b>: a mesa olha porque muito fluxo se concentra nesses níveis (ordens, stops, strikes com open interest grande). Use como mapa de onde o fluxo pode aparecer — não como previsão.</p>
<div class="w" data-w="candles"></div>
<h3>Vol realizada: o que o mercado de fato andou</h3>
\[ \sigma_R = \sqrt{\frac{252}{N}\sum_{i=1}^{N} r_i^2}, \qquad r_i = \ln\frac{S_i}{S_{i-1}} \]
<p>Janelas usuais: 10, 21 e 63 dias úteis. Janela curta reage rápido e é ruidosa; janela longa é estável e atrasada. Quando há máxima e mínima, o estimador de <b>Parkinson</b> usa a amplitude do dia e é mais eficiente que o fechamento a fechamento:</p>
\[ \sigma_P = \sqrt{\frac{252}{4N\ln 2}\sum_{i=1}^{N}\Big(\ln\frac{H_i}{L_i}\Big)^2} \]
<h3>Realizada × implícita</h3>
<p>O gráfico mais importante da mesa de vol. A diferença IV − RV é o preço do seguro: costuma ser positiva (prêmio de risco de vol), fecha ou inverte depois de choques (a realizada dispara) e se abre de novo quando o mercado acalma. Comprar vol com IV muito acima da RV recente exige um motivo (evento, mudança de regime).</p>
<h3>IV rank e IV percentil</h3>
\[ \text{IV rank} = \frac{IV_{hoje} - IV_{min}}{IV_{max} - IV_{min}}, \qquad \text{IV percentil} = \frac{\#\{\text{dias com } IV &lt; IV_{hoje}\}}{\#\{\text{dias}\}} \]
<p>Ambos comparam a vol de hoje com a <b>própria história</b> (tipicamente 1 ano). O rank é sensível a um único pico (um crash deixa o máximo lá em cima por um ano); o percentil é mais robusto.</p>
<h3>Cone de volatilidade</h3>
<p>Para cada janela (10, 21, 63, 126, 252 dias), a distribuição histórica da vol realizada: mínimo, quartis, mediana e máximo. Sobreponha a vol implícita de hoje de cada prazo: acima do percentil 75 = cara em relação ao que o ativo costuma realizar naquele horizonte; abaixo do 25 = barata. É o gráfico que mais ajuda a responder "vendo ou compro vol neste vencimento?".</p>
<div class="w" data-w="volcone"></div>
<h3>Outros gráficos de rotina</h3>
<ul><li><b>Estrutura a termo</b> (vol ATM por vencimento): inclinada para cima em mercado calmo; <b>invertida</b> (curto &gt; longo) em estresse.</li>
<li><b>Skew no tempo</b> (risk reversal 25Δ): mostra o apetite por proteção.</li>
<li><b>Open interest e gamma por strike</b>: onde os dealers estão comprados ou vendidos em gamma (Módulo US).</li>
<li><b>Correlação</b> implícita × realizada para índices (dispersão).</li></ul>`,
  desk: String.raw`"A realizada está rodando 18 contra 25 de implícita", "IV rank em 90%", "a vol está no topo do cone", "estrutura invertida", "gap de abertura", "tá respeitando a MM200".`,
  deep: String.raw`<p>O estimador fechamento-a-fechamento assume média zero; com média, use \(\frac{252}{N-1}\sum (r_i - \bar r)^2\) — em janelas curtas a diferença é pequena e a versão sem média é mais estável. Parkinson é ~5× mais eficiente que o fechamento a fechamento sob GBM, mas subestima a vol quando há gaps (não vê o salto da noite); Garman-Klass e Yang-Zhang combinam abertura, máxima, mínima e fechamento para corrigir isso. Para previsão, modelos GARCH (lição de estrutura a termo e CQF Módulo 2) fazem a vol reverter à média, o que dá forma ao cone.</p>`,
  refs: [R_.hull('14.4', 'Volatility (estimating from historical data)'), R_.hull(22, 'Estimating volatilities and correlations'), R_.wil('49.3', 'Volatility estimation by statistical means'), R_.wil(53, 'Empirical analysis of volatility'), R_.der(25, 'empirical analysis of volatility'), R_.ff(11, 'Financial econometrics: time series concepts'), R_.cqf(2, 'volatilidade, ARCH/GARCH')],
  sims: ['smile'],
  ex: [
    { tag: 'graficos', gen: R => { const rs = [0, 0, 0, 0, 0].map(() => R.f(-2.5, 2.5, 1)); const a = Math.sqrt(252 / 5 * rs.reduce((s, x) => s + (x / 100) * (x / 100), 0)) * 100; return { q: `Retornos diários (log) dos últimos 5 dias: ${rs.map(x => Q.fmt(x, 1) + '%').join(', ')}. Qual a vol realizada anualizada (fórmula sem média)?`, a, tol: 0.005, dec: 2, unit: '%', e: `σ = √(252/5 · Σr²) = √(252/5 · ${Q.fmt(rs.reduce((s, x) => s + (x / 100) * (x / 100), 0), 6)}) = ${Q.fmt(a, 2)}%.` }; } },
    { tag: 'graficos', gen: R => { const mn = R.f(14, 22, 1), mx = mn + R.f(15, 40, 1), iv = mn + R.f(0, mx - mn, 1); const a = (iv - mn) / (mx - mn) * 100; return { q: `Nos últimos 12 meses a vol implícita ATM variou entre ${Q.fmt(mn, 1)}% e ${Q.fmt(mx, 1)}%. Hoje está em ${Q.fmt(iv, 1)}%. Qual o IV rank?`, a, tol: 0.01, tolAbs: 0.2, dec: 1, unit: '%', e: `(${Q.fmt(iv, 1)} − ${Q.fmt(mn, 1)})/(${Q.fmt(mx, 1)} − ${Q.fmt(mn, 1)}) = ${Q.fmt(a, 1)}%.` }; } },
    { tag: 'graficos', gen: R => { const x = R.f(1, 3.5, 1); const a = x * Math.sqrt(252 / (4 * Math.log(2))); return { q: `Se em todos os dias da janela ln(máxima/mínima) = ${Q.fmt(x, 1)}%, qual a vol de Parkinson anualizada?`, a, tol: 0.005, dec: 2, unit: '%', e: `σ = √(252/(4 ln 2)) × ${Q.fmt(x, 1)}% = ${Q.fmt(Math.sqrt(252 / (4 * Math.log(2))), 3)} × ${Q.fmt(x, 1)}% = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'mcq', q: 'Um candle diário com pavio inferior longo, corpo pequeno e fechamento perto da máxima indica:', o: ['Vendedores dominaram o dia todo', 'O preço caiu durante o dia, mas os compradores recuperaram — a queda foi rejeitada', 'Gap de alta', 'Nada, candles não carregam informação'], a: 1, e: 'O pavio mostra até onde foi; o fechamento mostra quem venceu.' },
    { t: 'mcq', q: 'No cone de vol de 21 dias, a realizada histórica vai de 12% (mín.) a 45% (máx.), mediana 20%, percentil 75 de 26%. A implícita de 1 mês está em 30%. Leitura:', o: ['Barata em relação à história', 'Acima do percentil 75: cara em relação ao que o ativo costuma realizar — venda de vol é candidata, salvo evento', 'Exatamente na mediana', 'Impossível comparar'], a: 1, e: 'Comparar IV com a distribuição da RV do mesmo horizonte é o uso do cone.' },
    { t: 'tf', q: 'IV rank de 90% significa que a vol implícita está acima da vol realizada.', a: false, e: 'O rank compara a IV com a própria história da IV; não diz nada direto sobre a realizada.' }
  ],
  cards: [['Candle (OHLC)', 'Abertura, máxima, mínima e fechamento de um período.'], ['Vol realizada', '√(252/N·Σr²) com r = ln(S_i/S_{i−1}).'], ['Parkinson', 'Vol pela amplitude: √(252/(4N ln2)·Σ ln(H/L)²).'], ['IV rank × percentil', 'Rank = posição entre mín. e máx.; percentil = % de dias abaixo de hoje.'], ['Cone de vol', 'Distribuição da RV por janela × IV de hoje por prazo.']]
}, 'br3-6');

/* ============ BR5-7 — Bid/offer na prática ============ */
Course.addLesson('br5', {
  id: 'br5-7', title: 'Bid/offer na prática: como o spread nasce, como executar e quanto custa cruzar', tag: 'bidoffer',
  goal: 'Entender de onde vem o spread de uma opção, convertê-lo entre preço e vol, e executar sem entregar o edge para o mercado.',
  body: String.raw`
<h3>Vocabulário</h3>
<ul><li><b>Bid</b>: o melhor preço de compra na tela (alguém compra a esse preço). <b>Offer/ask</b>: o melhor preço de venda. <b>Mid</b>: o meio.</li>
<li>"<b>Pagar o offer</b>" = comprar no ask (agredir). "<b>Bater no bid</b>" = vender no bid. "<b>Juntar</b>" = colocar sua ordem no mesmo preço do melhor bid/offer (entra na fila). "<b>Melhorar</b>" = colocar um tick melhor.</li>
<li>Em opções, a mesa fala em vol: "<b>28 / 29,5</b>" = compra a 28 de vol, vende a 29,5. A conversão para preço usa a vega:</li></ul>
\[ \text{spread em R\$} \;\approx\; \mathcal{V}_{pt} \times \text{largura em pontos de vol} \]
<h3>Por que o spread existe (a visão do market maker)</h3>
<ol><li><b>Custo de hedge</b>: o delta precisa ser feito na ação/futuro, pagando o spread de lá, e depois rebalanceado (custos de Leland, lição 5.6).</li>
<li><b>Risco de estoque</b>: enquanto não se livra da posição, o dealer carrega vega, gamma e skew que não queria.</li>
<li><b>Seleção adversa</b>: parte do fluxo sabe mais (notícia, fluxo grande vindo). O spread compensa as vezes em que o cliente "acerta".</li>
<li><b>Capital e margem</b>, e a <b>concorrência</b> entre formadores de mercado (na B3, os formadores têm compromisso de spread máximo e quantidade mínima em séries definidas).</li></ol>
<p>Consequências: spreads abrem antes de eventos (resultado, Copom), na abertura e no fechamento, em séries ilíquidas e em momentos de estresse. Como a largura em vol é parecida entre strikes, o spread em R$ é maior onde a vega é maior (ATM, prazos longos) — mas nas OTM o spread em <b>% do prêmio</b> é enorme.</p>
<div class="w" data-w="bidoffer"></div>
<h3>Executando bem</h3>
<ul><li><b>Trabalhe a ordem</b>: ordem limitada perto do mid, paciência onde há fluxo; agrida só quando a urgência (ou o edge) paga o spread.</li>
<li><b>Pacote × pernas</b>: cote spreads, straddles e risk reversals como <b>pacote</b> (preço único) — "legar" (montar perna a perna) deixa você exposto entre uma perna e outra.</li>
<li><b>Delta cruzado</b>: em opções de ação/índice, negocie "com referência": a opção vem junto com a ação/futuro do hedge a um spot combinado. Você negocia só a vol.</li>
<li><b>RFQ</b>: para tamanho, peça preço a vários dealers; não mostre a direção nem o tamanho todo de uma vez.</li>
<li><b>Custo total</b> de uma operação de vol: meio spread na entrada + meio spread na saída (ou o carrego até o vencimento) + custo do hedge + emolumentos. O edge esperado tem de pagar tudo isso:</li></ul>
\[ \text{lucro esperado} \approx \mathcal{V}_{pt}\,q\,(\sigma_{justa} - \sigma_{paga}) - \text{custos de execução e hedge} \]`,
  desk: String.raw`"28 / 29,5, cinquenta mil", "pago 29,5", "dou 28", "junto no bid", "melhoro um tick", "tá largo", "cota o pacote", "com delta cruzado a 38,40", "você está no meu offer". "Mine!" / "yours!" = fechado comprando / vendendo (jargão em inglês).`,
  deep: String.raw`<p>Modelos de market making (Avellaneda-Stoikov) formalizam o spread ótimo: o dealer desloca seu mid de referência contra o estoque (quem está comprado baixa bid e ask para estimular vendas a ele e compras dele) e abre a largura com a volatilidade e a aversão a risco. Em opções, o "estoque" é multidimensional (delta, gamma, vega por prazo, skew), e a cotação de cada série é ajustada pela contribuição dela ao risco agregado do livro — por isso o mesmo dealer pode ser agressivo num strike e defensivo em outro.</p>`,
  refs: [R_.hull('9.5', 'Trading (market makers and the bid–offer spread)'), R_.wil(48, 'Transaction costs'), R_.wil('2.7', 'Market conventions'), R_.der(21, 'transaction costs'), R_.car('microestrutura e prática do mercado brasileiro')],
  sims: ['tela', 'hedge'],
  ex: [
    { tag: 'bidoffer', gen: R => { const b = R.f(24, 32, 1), w = R.pick([0.5, 1, 1.5, 2]), v = R.f(0.03, 0.2, 3); const a = w * v; return { q: `Cotação em vol: ${Q.fmt(b, 1)} / ${Q.fmt(b + w, 1)}. A vega da opção é ${Q.fmt(v, 3)} por ponto. Qual o spread aproximado em R$?`, a, tol: 0.005, dec: 4, unit: 'R$', e: `${Q.fmt(w, 1)} pt × ${Q.fmt(v, 3)} = ${Q.fmt(a, 4)}.` }; } },
    { tag: 'bidoffer', gen: R => { const bid = R.f(0.8, 3, 2), ask = Math.round((bid + R.f(0.03, 0.15, 2)) * 100) / 100, q = R.int(10, 200) * 1000; const a = (ask - bid) / 2 * q; return { q: `A série está ${Q.fmt(bid, 2)} / ${Q.fmt(ask, 2)} e você precisa comprar ${Q.fmt(q, 0)} opções já, pagando o offer. Quanto custa cruzar o spread (em relação ao mid)?`, a, tol: 0.002, tolAbs: 1, unit: 'R$', dec: 0, e: `Meio spread × q = ${Q.fmt((ask - bid) / 2, 3)} × ${Q.fmt(q, 0)} = ${Q.fmt(a, 0)}.` }; } },
    { t: 'mcq', q: '"Pago o offer" significa:', o: ['Vendo no bid', 'Compro no preço de venda da tela (agredindo)', 'Coloco ordem no mid', 'Cancelo a ordem'], a: 1, e: 'Pagar o offer = comprar no ask.' },
    { t: 'mcq', q: 'Por que os spreads de opções de uma empresa abrem na véspera do resultado?', o: ['Porque a B3 obriga', 'Risco de gap e seleção adversa: o market maker não sabe o que vem e alguns clientes sabem mais', 'Porque a vega cai', 'Porque os juros sobem'], a: 1, e: 'Evento binário = mais risco de estoque e de fluxo informado.' },
    { tag: 'bidoffer', gen: R => { const v = R.f(0.05, 0.15, 3), q = R.int(20, 100) * 1000, fair = R.f(28, 34, 1), paid = Math.round((fair - R.f(0.5, 3, 1)) * 10) / 10, cost = Math.round(q * R.f(0.005, 0.03, 3)); const a = v * q * (fair - paid) - cost; return { q: `Você acredita que a vol justa é ${Q.fmt(fair, 1)} e compra ${Q.fmt(q, 0)} opções a ${Q.fmt(paid, 1)} de vol (vega ${Q.fmt(v, 3)} por ponto). Custos de execução e hedge estimados: R$ ${Q.fmt(cost, 0)}. Lucro esperado?`, a, tol: 0.003, tolAbs: 1, unit: 'R$', dec: 0, e: `${Q.fmt(v, 3)} × ${Q.fmt(q, 0)} × (${Q.fmt(fair, 1)} − ${Q.fmt(paid, 1)}) − ${Q.fmt(cost, 0)} = ${Q.fmt(a, 0)}.` }; } },
    { t: 'mcq', q: 'Você quer montar um straddle grande. Qual execução reduz o risco de "legar"?', o: ['Comprar a call agora e a put amanhã', 'Pedir cotação do straddle como pacote (preço único), de preferência com delta cruzado', 'Comprar só a call', 'Usar ordens a mercado nas duas pernas separadamente'], a: 1, e: 'Pacote elimina o risco de o mercado andar entre as pernas.' },
    { t: 'tf', q: 'Em opções bem fora do dinheiro, o spread em % do prêmio costuma ser muito maior que nas ATM.', a: true, e: 'Prêmio pequeno, largura mínima de tick e vega baixa: o % explode.' }
  ],
  cards: [['Bid / offer / mid', 'Compra / venda / meio da tela.'], ['Spread em R$', '≈ vega por ponto × largura em vol.'], ['Por que existe spread', 'Custo de hedge, risco de estoque, seleção adversa, capital.'], ['Pacote × pernas', 'Cotar a estrutura inteira evita o risco de legar.'], ['Delta cruzado', 'Opção negociada junto com o hedge a um spot de referência.']]
}, 'br5-6');

/* ============ BR10-6 — Remunerar o portfólio com eficiência ============ */
Course.addLesson('br10', {
  id: 'br10-6', title: 'Remunerando o portfólio com eficiência: caixa, garantias, aluguel e carry', tag: 'carry',
  goal: 'Fazer cada real do livro trabalhar: aplicar o caixa, escolher as garantias certas, doar ações, financiar posições pelo menor custo e medir o retorno por unidade de risco e de margem.',
  body: String.raw`
<p>O PnL de uma mesa não vem só das gregas. Há uma linha silenciosa — <b>carry e financiamento</b> — que, somada ao longo do ano, separa um livro eficiente de um que "vaza" dinheiro. Com juros de dois dígitos no Brasil, caixa parado é prejuízo.</p>
\[ \text{Carry} = C\,i_{CDI} + G_{tit}\,i_{tit} + A\,b_{doação} - V\,b_{tomador} + \text{dividendos} - \text{custos de financiamento} \]
<p>(\(C\) = caixa aplicado; \(G_{tit}\) = garantias depositadas em títulos que rendem; \(A\) = ações doadas no BTC; \(V\) = posição vendida alugada.)</p>
<h3>1. Caixa</h3>
<ul><li>Prêmios recebidos, ajustes positivos e margem liberada viram caixa: aplique no mesmo dia (operação compromissada, Tesouro Selic/LFT, fundo DI ou CDB com liquidez, conforme a política da casa).</li>
<li>Quando pagam acima do CDI, o <b>box</b> (Unidade 9) e o <b>cash &amp; carry</b> (lição 1.7) são alternativas de aplicação — e, do outro lado, de captação.</li></ul>
<h3>2. Garantias (margem)</h3>
<ul><li>A câmara da B3 calcula a margem pelo <b>risco do portfólio inteiro</b> (modelo CORE: estima o custo de encerrar a carteira em cenários de estresse). Posições que se hedgeiam <b>reduzem a margem</b> — por isso concentrar o livro e seus hedges no mesmo participante/conta é eficiência de capital.</li>
<li>A B3 aceita como garantia, além de dinheiro: títulos públicos federais, ações e units, ETFs, CDB/LCI/LCA de bancos aceitos, cartas de fiança, moedas e títulos soberanos estrangeiros, debêntures, entre outros — com <b>deságio</b> (haircut) e limites.</li>
<li>Regra de bolso: <b>dinheiro depositado como margem normalmente não rende para você</b>; título público depositado continua rendendo. Usar as próprias ações da carteira como garantia também libera caixa.</li></ul>
<h3>3. Ações paradas</h3>
<ul><li><b>Doe no BTC</b>: taxa extra sobre posições que você carrega de qualquer jeito (atenção a recall, direito de voto e ao reembolso de proventos).</li>
<li><b>Overwriting</b> (vender calls cobertas OTM) também "remunera", mas é <b>venda de vol</b>: você troca parte da alta por prêmio. Faça quando a vol estiver cara (cone, IV rank), não por hábito.</li></ul>
<h3>4. Posições vendidas e compradas: o financiamento mais barato</h3>
<ul><li>Um mesmo delta pode ser carregado de vários jeitos: ação alugada, futuro, termo, swap (TRS), ou sintético com opções (long put + short call de mesmo strike = short sintético). A <b>paridade put-call</b> revela o custo de aluguel embutido nas opções: compare com a taxa do BTC e escolha o mais barato.</li>
<li>Para posições compradas: caixa próprio (custo de oportunidade = CDI), termo (taxa do termo) ou TRS (CDI + spread). Compare as taxas.</li></ul>
<h3>5. Dividendos e JCP</h3>
<p>Têm tratamento tributário diferente entre si e entre investidores, e as regras mudaram recentemente — confira a legislação vigente antes de montar trades de dividendo. No BTC, o doador recebe o reembolso do provento.</p>
<h3>6. Medir eficiência</h3>
<ul><li><b>Retorno sobre margem</b> = PnL (incluindo carry) ÷ margem média; <b>retorno sobre capital</b> alocado; <b>carry por unidade de risco</b> (carry ÷ VaR ou ÷ stress).</li>
<li>No limite, remunerar com eficiência é maximizar retorno por unidade de risco — o tema de Markowitz, Sharpe e Kelly (lição US6-6, trilha CQF).</li></ul>
<div class="w" data-w="carry"></div>`,
  desk: String.raw`"Caixa parado é prejuízo", "zerou o caixa na compromissada?", "troca a margem em dinheiro por LFT", "doa a carteira", "o aluguel está mais caro que o sintético — faz o short via opções", "retorno sobre margem", "tesouraria da mesa".`,
  deep: String.raw`<p><b>Custo do short sintético.</b> Com \(c - p = S e^{-(q+b)T} - K e^{-rT}\), a taxa de aluguel implícita nas opções é \(b = -\frac1T\ln\frac{c - p + Ke^{-rT}}{S} - q\). Se \(b_{implícito} &lt; b_{BTC}\), é mais barato ficar vendido via opções (vender call e comprar put) do que alugar a ação; se \(b_{implícito} &gt; b_{BTC}\), dá para fazer a <b>reversão</b>: vender a ação alugada, comprar a call e vender a put, embolsando a diferença (é assim que as mesas de delta one arbitram o aluguel embutido nas opções).</p>`,
  refs: [R_.hull('2.4', 'The operation of margins'), R_.hull('9.7', 'Margins'), R_.hull('5.2', 'Short selling'), R_.wil('8.7', 'Stock borrowing and repo'), R_.wil(18, 'Portfolio management'), R_.cqf(2, 'retorno por unidade de risco'), R_.car('infraestrutura da B3: margens e garantias')],
  sims: ['br'],
  ex: [
    { tag: 'carry', gen: R => { const M = R.int(2, 40) * 1e6, i = R.f(9, 15, 2) / 100, du = R.pick([21, 63, 126, 252]); const a = M * (Math.pow(1 + i, du / 252) - 1); return { q: `Sua mesa deixou R$ ${Q.fmt(M, 0)} de margem em dinheiro por ${du} dias úteis, com CDI de ${Q.fmt(i * 100, 2)}% a.a. Quanto deixou de ganhar (sem deságio) em relação a depositar títulos que rendem CDI?`, a, tol: 0.002, tolAbs: 1, unit: 'R$', dec: 0, e: `M·[(1+i)^{du/252} − 1] = ${Q.fmt(M, 0)} × ${Q.fmt(Math.pow(1 + i, du / 252) - 1, 5)} = ${Q.fmt(a, 0)}.` }; } },
    { tag: 'carry', gen: R => { const A = R.int(5, 80) * 1e6, b = R.f(0.3, 3, 2) / 100; const a = A * b; return { q: `Você carrega R$ ${Q.fmt(A, 0)} em ações que não pretende vender no ano. Doando no BTC a uma taxa média de ${Q.fmt(b * 100, 2)}% a.a., quanto rende por ano (aprox., antes de impostos)?`, a, tol: 0.002, tolAbs: 1, unit: 'R$', dec: 0, e: `${Q.fmt(A, 0)} × ${Q.fmt(b * 100, 2)}% = ${Q.fmt(a, 0)}.` }; } },
    { t: 'mcq', q: 'Qual a forma mais eficiente de atender a margem da B3, em geral?', o: ['Depositar dinheiro, que rende CDI automaticamente', 'Depositar títulos públicos (que continuam rendendo) ou ações da carteira, aceitando o deságio', 'Não depositar nada', 'Vender posições para liberar caixa sempre'], a: 1, e: 'Dinheiro como margem normalmente não rende; títulos e ações continuam trabalhando.' },
    { tag: 'carry', gen: R => { const pnl = R.int(2, 30) * 1e5, carry = R.int(1, 15) * 1e5, mg = R.int(10, 80) * 1e6; const a = (pnl + carry) / mg * 100; return { q: `No ano, o livro gerou R$ ${Q.fmt(pnl, 0)} de PnL de trading e R$ ${Q.fmt(carry, 0)} de carry, usando margem média de R$ ${Q.fmt(mg, 0)}. Qual o retorno sobre a margem (%)?`, a, tol: 0.005, tolAbs: 0.01, dec: 2, unit: '%', e: `(${Q.fmt(pnl, 0)} + ${Q.fmt(carry, 0)}) / ${Q.fmt(mg, 0)} = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'mcq', q: 'Por que incluir o hedge na mesma conta/câmara pode reduzir a margem exigida?', o: ['Porque a B3 dá desconto por volume', 'Porque a margem é calculada pelo risco do portfólio combinado (cenários de estresse), e posições que se compensam reduzem a perda de encerramento', 'Não reduz', 'Porque hedges não têm margem'], a: 1, e: 'Margem de portfólio (CORE) enxerga compensações entre posições.' },
    { tag: 'carry', gen: R => { const S = 50, K = 50, r = R.f(10, 13, 1) / 100, T = 0.5, bImpl = R.f(1, 12, 1) / 100, bBTC = R.f(1, 12, 1) / 100; const cp = S * Math.exp(-bImpl * T) - K * Math.exp(-r * T); const cheaper = bImpl < bBTC ? 0 : 1; return { t: 'mcq', q: `S = K = 50, T = 0,5, r = ${Q.fmt(r * 100, 1)}%, sem dividendos. Nas opções, c − p = ${Q.fmt(cp, 4)}. No BTC o aluguel está ${Q.fmt(bBTC * 100, 1)}% a.a. Para ficar vendido no papel, o mais barato é:`, o: ['Short sintético (vender call e comprar put)', 'Alugar a ação no BTC e vender'], a: cheaper, e: `Aluguel implícito: b = −ln[(c − p + K·e^{−rT})/S]/T = ${Q.fmt(bImpl * 100, 2)}% vs BTC ${Q.fmt(bBTC * 100, 1)}%. ${cheaper === 0 ? 'O sintético embute aluguel menor.' : 'O BTC está mais barato que o embutido nas opções.'}` }; } },
    { t: 'tf', q: 'Vender calls cobertas sobre a carteira é uma forma de remuneração sem risco.', a: false, e: 'É venda de vol: você abre mão da alta acima do strike em troca do prêmio.' }
  ],
  cards: [['Linha de carry', 'Caixa a CDI + garantias que rendem + aluguel recebido − aluguel pago + dividendos − financiamento.'], ['Margem eficiente', 'Títulos/ações como garantia em vez de dinheiro parado; hedges no mesmo portfólio reduzem margem (CORE).'], ['Doar a carteira', 'Posições carregadas de qualquer jeito rendem taxa no BTC.'], ['Short mais barato', 'Compare o aluguel do BTC com o aluguel implícito na paridade (short sintético).'], ['Retorno sobre margem', 'PnL (incl. carry) ÷ margem média.']]
}, 'br10-5');
})();
