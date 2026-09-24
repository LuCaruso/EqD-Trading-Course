/* Módulo Brasil — lições extras (v4): mercados, aluguel, delta one, vanillas × flexíveis,
   medida neutra a risco, comprar vega × vender gamma, defeitos do BS e desastres com derivativos. */
(function () {
const R_ = window.REF;

/* ============ BR1-5 — Onde se negocia ============ */
Course.addLesson('br1', {
  id: 'br1-5', title: 'Onde se negocia: bolsa (B3), balcão organizado e OTC', tag: 'mercados',
  goal: 'Distinguir mercado listado, balcão registrado e OTC bilateral, e saber que risco (contraparte, liquidez, modelo) cada um traz para a mesa.',
  body: String.raw`
<p>O mesmo risco — "comprar proteção contra a queda de PETR4" — pode ser montado em ambientes muito diferentes. Para o trader, o ambiente muda três coisas: <b>quem é a sua contraparte</b>, <b>quão fácil é sair da posição</b> e <b>de onde vem o preço</b>.</p>
<h3>1. Bolsa (mercado listado — B3)</h3>
<ul><li><b>Contratos padronizados</b>: strike, vencimento, lote e regras de exercício definidos pela bolsa (ex.: opções de PETR4, IND/WIN, DOL/WDO, DI1, termo listado de ações).</li>
<li><b>Livro de ofertas público</b>: qualquer participante vê bid/ask e negócios (transparência pré e pós-negociação).</li>
<li><b>Contraparte central (CCP)</b>: depois do negócio, a Câmara da B3 se coloca no meio — você passa a ter a câmara como contraparte, não quem apertou o botão do outro lado. Em troca, todos depositam <b>margem</b> e, nos futuros, pagam/recebem <b>ajuste diário</b>.</li>
<li>Resultado: risco de contraparte mínimo, preço de tela, liquidez concentrada em poucos strikes e vencimentos.</li></ul>
<h3>2. Balcão organizado (registro — B3 balcão)</h3>
<ul><li>A negociação é <b>bilateral</b> (telefone, chat, plataforma do banco), com termos <b>sob medida</b>: vencimento no dia exato do pagamento do cliente, strike quebrado, barreiras, nocional qualquer.</li>
<li>O contrato é <b>registrado</b> na B3 (a antiga Cetip). No Brasil, a lei condiciona a validade dos derivativos de balcão ao registro em entidade autorizada (Lei 12.543/2011). Exemplos: swaps DI × pré, swaps de ações, NDF de dólar (termo de moeda), opções flexíveis e o próprio COE.</li>
<li>Pode ser <b>com garantia</b> (a B3 atua como contraparte central e exige margem) ou <b>sem garantia</b> (o risco de crédito fica entre as partes, mitigado por contrato e colateral).</li></ul>
<h3>3. OTC bilateral (internacional)</h3>
<ul><li>Contratado sob o <b>ISDA Master Agreement</b>, com o <b>CSA</b> (Credit Support Annex) regulando o colateral: margem de variação (VM), margem inicial (IM), threshold, moedas aceitas. O equivalente local é o <b>CGD</b> (Contrato Global de Derivativos).</li>
<li>Riscos: crédito da contraparte (daí o CVA, Módulo US), liquidez para desmontar, disputa de marcação, e <b>mark-to-model</b> — o preço vem do seu modelo, não de uma tela.</li>
<li>Parte do OTC padronizável (swaps de juros, CDS de índice) é hoje compensada em clearings; opções exóticas de equity continuam essencialmente bilaterais.</li></ul>
<table class="tbl"><tr><th></th><th>Bolsa (B3 listado)</th><th>Balcão registrado (B3)</th><th>OTC bilateral (ISDA)</th></tr>
<tr><td>Padronização</td><td>Total</td><td>Sob medida</td><td>Sob medida</td></tr>
<tr><td>Contraparte</td><td>Câmara (CCP)</td><td>CCP (com garantia) ou bilateral</td><td>Bilateral + CSA</td></tr>
<tr><td>Preço</td><td>Tela pública</td><td>Cotação (RFQ) / modelo</td><td>Cotação / modelo</td></tr>
<tr><td>Liquidez para sair</td><td>Alta nos contratos líquidos</td><td>Baixa: desmontar com a mesma contraparte</td><td>Baixa; novação/unwind negociado</td></tr>
<tr><td>Exemplos</td><td>PETR4 opções, IND, DOL, DI1</td><td>Swap DI × pré, NDF, opção flexível, COE</td><td>Autocall worst-of, variance swap, TRS</td></tr></table>
<h3>Por que isso importa para quem opera</h3>
<p>A mesa típica <b>vende sob medida no balcão</b> (o cliente quer a data exata e a barreira dele) e <b>hedgeia no listado</b> (onde há liquidez). O que sobra é <b>risco de base</b>: vencimento do cliente ≠ vencimento listado, strike do cliente ≠ strike líquido, exercício europeu ≠ americano. Esse resíduo é o dia a dia do livro — e é por isso que a mesa cobra spread no balcão.</p>`,
  desk: String.raw`"Faz no balcão com garantia?", "registra na B3", "boletar no listado". "CSA com threshold zero" = colateral trocado a cada centavo de marcação. "Novar" = transferir o contrato para outra contraparte. "O cliente quer a data quebrada" = vencimento fora do calendário listado.`,
  deep: String.raw`<p>Exposição de crédito a uma contraparte OTC num instante é \(\max(\text{MtM} - \text{colateral}, 0)\) somado por netting set (o ISDA permite compensar contratos positivos e negativos com a mesma contraparte na falência). A exposição <i>futura</i> depende da trajetória do MtM até a chamada de margem ser honrada (margin period of risk, tipicamente alguns dias) — é o que motiva a margem inicial em contratos não compensados em câmara.</p>`,
  refs: [R_.hull(1, 'Exchange-traded markets; over-the-counter markets'), R_.hull('2.5', 'OTC markets'), R_.hull('23.8', 'Credit risk mitigation (collateral, netting)'), R_.wil(1, 'Products and markets'), R_.car('infraestrutura da B3: listado, balcão e registro')],
  ex: [
    { t: 'mcq', q: 'Qual ambiente combina contratos padronizados, livro de ofertas público e contraparte central?', o: ['OTC bilateral sob ISDA', 'Balcão registrado sem garantia', 'Bolsa (mercado listado da B3)', 'Contrato de gaveta'], a: 2, e: 'No listado a câmara vira a contraparte de todos, e o preço é público.' },
    { t: 'mcq', q: 'Uma exportadora quer uma put de dólar com vencimento no dia 17 (data do recebimento) e nocional de US$ 7,3 milhões. Onde isso é feito naturalmente?', o: ['Opções listadas de DOL', 'Balcão: opção flexível/NDF registrada na B3', 'Mercado à vista de ações', 'Não é possível'], a: 1, e: 'Data e nocional quebrados pedem contrato sob medida, registrado no balcão.' },
    { t: 'tf', q: 'Num derivativo de balcão sem garantia, se a contraparte quebrar, você pode perder o valor de mercado positivo que tinha a receber (menos o colateral).', a: true, e: 'É o risco de crédito de contraparte — o que a CCP elimina no listado.' },
    { tag: 'mercados', gen: R => { const m = R.int(5, 60) * 100000, c = Math.round(m * R.f(0, 1.2, 2) / 10000) * 10000; const a = Math.max(m - c, 0); return { q: `Seu swap com um fundo vale R$ ${Q.fmt(m, 0)} a seu favor (MtM) e você detém R$ ${Q.fmt(c, 0)} de colateral dele. Se ele quebrar hoje, qual a sua exposição (perda antes de recuperação)?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `Exposição = max(MtM − colateral, 0) = max(${Q.fmt(m, 0)} − ${Q.fmt(c, 0)}, 0) = ${Q.fmt(a, 0)}.` }; } },
    { t: 'mcq', q: 'Você vendeu ao cliente uma put de 45 dias e hedgeou comprando puts listadas de 30 dias. Que risco sobra?', o: ['Nenhum', 'Risco de base de vencimento (estrutura a termo da vol e gamma em datas diferentes)', 'Só risco de juros', 'Só risco de liquidação física'], a: 1, e: 'O hedge vence antes; você fica com a exposição do dia 30 ao 45 e com vegas em pontos diferentes da curva.' },
    { t: 'mcq', q: 'O que o CSA de um ISDA regula?', o: ['O preço da opção', 'O colateral: margens de variação e inicial, threshold, ativos aceitos', 'O horário do pregão', 'A tributação'], a: 1, e: 'Credit Support Annex = anexo de garantias.' }
  ],
  cards: [['Contraparte central (CCP)', 'A câmara se interpõe entre comprador e vendedor e exige margem/ajuste.'], ['Balcão registrado', 'Negociação bilateral sob medida, registrada na B3; com ou sem garantia.'], ['ISDA + CSA', 'Contrato-mestre OTC + anexo de colateral (VM, IM, threshold).'], ['Risco de base (hedge listado)', 'Diferença entre o que você vendeu sob medida e o hedge padronizado.']]
}, 'br1-4');

/* ============ BR1-6 — Aluguel de ações ============ */
Course.addLesson('br1', {
  id: 'br1-6', title: 'Aluguel de ações (BTC): doador, tomador e o custo de ficar vendido', tag: 'aluguel',
  goal: 'Entender a mecânica do empréstimo de ações na B3, calcular a remuneração e ver como o custo de aluguel entra no preço de termos, futuros e opções.',
  body: String.raw`
<p>Para <b>vender uma ação que você não tem</b> (short), você precisa pegá-la emprestada. Na B3 isso acontece no serviço de <b>empréstimo de ativos (BTC)</b>: o <b>doador</b> empresta as ações que tem em carteira e recebe uma taxa; o <b>tomador</b> recebe as ações, pode vendê-las e se compromete a devolver a mesma quantidade no vencimento do contrato.</p>
<h3>Quem toma emprestado, e por quê</h3>
<ul><li><b>Venda a descoberto</b> (visão direcional de queda, ou a perna vendida de um long-short).</li>
<li><b>Hedge de derivativos</b>: a mesa comprada em calls (delta positivo) hedgeia <i>vendendo</i> ação — e precisa alugá-la. A mesa vendida em calls compra ação e pode <i>doá-la</i>, ganhando a taxa.</li>
<li><b>Arbitragens</b>: o reverse cash &amp; carry (vender à vista, comprar a termo) e conversões/reversões de opções.</li></ul>
<h3>A conta</h3>
<p>A taxa é livremente negociada, expressa em % ao ano, base 252 dias úteis. A remuneração do doador é:</p>
\[ RD = \frac{Q \cdot C \cdot i \cdot du}{252} \]
<p>com \(Q\) = quantidade, \(C\) = cotação de referência (a B3 usa a cotação média do dia anterior ao registro), \(i\) = taxa ao ano e \(du\) = dias úteis do empréstimo. O tomador paga essa taxa mais emolumentos e corretagem; o doador é isento das tarifas da B3.</p>
<h3>Regras que mordem</h3>
<ul><li><b>Garantias</b>: o tomador deposita margem, porque está devendo ações.</li>
<li><b>Devolução antecipada (recall)</b>: conforme o contrato, o doador pode pedir as ações de volta; o tomador tem alguns pregões para devolver — pode ter de recomprar no pior momento.</li>
<li><b>Proventos</b>: durante o empréstimo o doador não recebe o dividendo da empresa (quem está com as ações é outro); recebe um <b>reembolso</b> equivalente, pago pelo tomador.</li>
<li><b>Papel difícil de alugar</b> (<i>hard-to-borrow</i>): pouca oferta de doadores ⇒ taxa de 10%, 30%, às vezes mais de 100% ao ano, e risco de recall. É o combustível de um <i>short squeeze</i>.</li></ul>
<h3>O aluguel no preço dos derivativos</h3>
<p>Quem tem a ação pode emprestá-la e ganhar \(b\) ao ano: para o preço a termo, isso funciona exatamente como um dividendo extra:</p>
\[ F = S\,e^{(r - q - b)T} \]
<p>E a paridade put-call vira \(c - p = S e^{-(q+b)T} - K e^{-rT}\). Num papel com aluguel caro, o forward "justo" cai, <b>as puts ficam caras e as calls baratas</b> em relação ao que você calcularia ignorando o aluguel. O mercado de opções "sabe" disso: você pode extrair a <b>taxa de aluguel implícita</b> da paridade. Se o seu modelo ignora o borrow, seu delta e sua vol implícita saem errados — erro clássico de estagiário em papel apertado.</p>`,
  desk: String.raw`"Tá difícil de alugar", "o aluguel abriu pra 25%", "tomei 2 milhões de VALE no BTC", "chamaram de volta (recall)". "Doar a carteira" = emprestar as ações paradas para ganhar taxa. "GC" (general collateral) = papel fácil, taxa baixa.`,
  deep: String.raw`<p>Taxa implícita pela paridade: de \(c - p = S e^{-bT} - K e^{-rT}\) (com \(q = 0\)), \(b = -\frac1T\ln\!\big[(c - p + K e^{-rT})/S\big]\). Com dados reais use os mids das séries mais líquidas perto do ATM e compare com a taxa do BTC — diferenças grandes costumam indicar dividendo esperado mal estimado ou restrição de aluguel.</p>`,
  refs: [R_.hull('5.2', 'Short selling'), R_.hull('5.6', 'Known yield'), R_.wil('8.7', 'Stock borrowing and repo'), R_.car('empréstimo de ativos e custo de carregamento')],
  ex: [
    { tag: 'aluguel', gen: R => { const Qt = R.int(10, 200) * 1000, C = R.f(10, 60, 2), i = R.f(0.5, 12, 1) / 100, du = R.int(5, 60); const a = Qt * C * i * du / 252; return { q: `Você doou ${Q.fmt(Qt, 0)} ações cotadas (média do dia anterior) a R$ ${Q.fmt(C, 2)}, à taxa de ${Q.fmt(i * 100, 1)}% a.a., por ${du} dias úteis. Quanto recebe de remuneração (antes de impostos)?`, a, tol: 0.002, unit: 'R$', dec: 2, e: `RD = Q·C·i·du/252 = ${Q.fmt(Qt, 0)} × ${Q.fmt(C, 2)} × ${Q.fmt(i, 3)} × ${du}/252 = ${Q.fmt(a, 2)}.` }; } },
    { tag: 'aluguel', gen: R => { const S = R.f(20, 80, 2), r = R.f(9, 14, 1) / 100, b = R.f(0.5, 30, 1) / 100, T = R.pick([0.25, 0.5, 1]); const a = S * Math.exp((r - b) * T); return { q: `Ação a R$ ${Q.fmt(S, 2)}, sem dividendos, juros contínuos de ${Q.fmt(r * 100, 1)}% e aluguel de ${Q.fmt(b * 100, 1)}% a.a. Qual o forward justo para ${Q.fmt(T, 2)} ano?`, a, tol: 0.002, unit: 'R$', dec: 2, e: `F = S·e^{(r − b)T} = ${Q.fmt(S, 2)}·e^{(${Q.fmt(r, 3)} − ${Q.fmt(b, 3)})·${Q.fmt(T, 2)}} = ${Q.fmt(a, 2)}.` }; } },
    { t: 'mcq', q: 'Em um papel muito difícil de alugar, comparado a um papel fácil (tudo mais igual), tende a acontecer que:', o: ['Calls ficam caras e puts baratas', 'Puts ficam caras e calls baratas, e o forward cai', 'Nada muda nas opções', 'O forward sobe'], a: 1, e: 'O aluguel age como dividendo: reduz o forward; pela paridade, puts sobem em relação às calls.' },
    { tag: 'aluguel', gen: R => { const S = 50, K = 50, r = R.f(9, 13, 1) / 100, b = R.f(1, 25, 1) / 100, T = 0.5; const cp = S * Math.exp(-b * T) - K * Math.exp(-r * T); const a = b * 100; return { q: `S = K = 50, T = 0,5, r = ${Q.fmt(r * 100, 1)}% contínua, sem dividendos. No mercado, call − put = ${Q.fmt(cp, 4)}. Qual a taxa de aluguel implícita (% a.a., contínua)?`, a, tol: 0.01, tolAbs: 0.05, unit: '% a.a.', dec: 2, e: `b = −ln[(c − p + K·e^{−rT})/S]/T = −ln[(${Q.fmt(cp, 4)} + ${Q.fmt(K * Math.exp(-r * T), 4)})/50]/0,5 = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'tf', q: 'Durante o empréstimo, o doador recebe os dividendos diretamente da empresa, normalmente.', a: false, e: 'As ações estão com terceiros; o doador recebe um reembolso equivalente, pago pelo tomador.' },
    { t: 'mcq', q: 'Sua mesa está comprada em calls de VALE e faz delta hedge. Que operação no BTC ela precisa fazer?', o: ['Doar ações', 'Tomar ações emprestadas para vender (hedge short)', 'Nenhuma', 'Comprar puts'], a: 1, e: 'Long call ⇒ delta positivo ⇒ hedge vendendo ação ⇒ precisa alugar.' }
  ],
  cards: [['BTC (empréstimo de ativos)', 'Doador empresta ações e recebe taxa; tomador vende/usa e devolve depois.'], ['Remuneração do aluguel', 'RD = Q·C·i·du/252'], ['Aluguel no forward', 'F = S·e^{(r − q − b)T}: aluguel funciona como dividendo.'], ['Recall', 'Doador pede as ações de volta antes do fim; tomador pode ter de recomprar.']]
}, 'br1-5');

/* ============ BR1-7 — Delta one ============ */
Course.addLesson('br1', {
  id: 'br1-7', title: 'Delta one: cash & carry, arbitragem de índice, ETFs e swaps de ações', tag: 'deltaone',
  goal: 'Montar e precificar as estratégias lineares da mesa de delta one e saber de onde vem (e para onde vai) o dinheiro de cada uma.',
  body: String.raw`
<p><b>Delta one</b> é tudo cujo valor anda praticamente 1 para 1 com o ativo: ação, futuro de índice (IND/WIN), termo de ações, ETF (BOVA11), swap de ações (TRS), BDR. Não há opcionalidade: o jogo é <b>carry</b> — juros, dividendos, aluguel, custos de execução e financiamento. A mesa de delta one é quem "empresta balanço" ao mercado e arbitra preços lineares entre si.</p>
<h3>Cash &amp; carry: renda fixa sintética</h3>
<p>Compre a ação à vista e venda o termo (ou o futuro). No vencimento você entrega a ação pelo preço combinado: o resultado é certo, como um título prefixado. A taxa que você "trava":</p>
\[ i_{impl} = \left(\frac{F}{S}\right)^{252/du} - 1 \]
<p>(sem dividendos no período; se houver, some-os ao que você recebe). Compare com o DI do prazo, líquido de custos:</p>
<ul><li>\(i_{impl}\) &gt; DI + custos ⇒ faça o <b>cash &amp; carry</b> (compra à vista, vende a termo): você empresta dinheiro caro ao mercado.</li>
<li>\(i_{impl}\) &lt; DI − custos ⇒ faça o <b>reverse</b> (vende à vista, compra a termo) — mas para vender à vista você precisa <b>alugar</b> a ação (lição anterior): o aluguel é custo.</li></ul>
<p>No Brasil, o <b>termo de ações</b> é muito usado exatamente como financiamento: o investidor que compra à vista e vende a termo está aplicando a uma taxa; quem compra a termo está alavancando.</p>
<h3>Arbitragem de índice (futuro × cesta × ETF)</h3>
<p>O futuro de Ibovespa tem valor justo \(F = S(1+i)^{du/252} - D\), onde \(D\) são os dividendos esperados até o vencimento (em pontos, capitalizados). Se o IND está caro em relação a isso, a mesa vende o futuro e compra a cesta (ou o ETF); se está barato, faz o contrário. Os resíduos que tornam isso "arbitragem com risco": dividendos incertos, custo de execução da cesta, tracking error do ETF, margem e ajuste diário do futuro (o futuro ajusta todo dia; a cesta não).</p>
<h3>ETFs: criação e resgate</h3>
<p>Participantes autorizados podem entregar a cesta e receber cotas do ETF (criação) ou devolver cotas e receber a cesta (resgate). Esse mecanismo mantém o preço do BOVA11 colado no valor da carteira: se o ETF sobe acima da cesta, alguém compra a cesta, cria cotas e vende o ETF.</p>
<h3>Swap de ações / Total Return Swap</h3>
<p>O cliente recebe o <b>retorno total</b> da ação (variação + dividendos) e paga <b>CDI + spread</b> sobre o nocional. O banco hedgeia comprando a ação: carrega o custo do CDI, recebe os dividendos, pode doar a ação no BTC. O spread paga balanço, capital e aluguel (se o cliente estiver vendido, o banco precisa alugar). Usos: alavancagem, acesso sem custódia, investidores estrangeiros, fundos que não podem ter o ativo diretamente.</p>
<h3>Os riscos reais do delta one</h3>
<ul><li><b>Dividendos</b>: futuros e swaps embutem dividendos esperados; se a empresa corta o dividendo, o livro ganha/perde. Existem dividend futures/swaps para negociar isso.</li>
<li><b>Financiamento e aluguel</b>: a taxa de aluguel muda, recalls acontecem.</li>
<li><b>Execução</b>: rolagem de futuros, leilão de fechamento, rebalanceamento de índices (a carteira teórica muda a cada quadrimestre).</li></ul>`,
  desk: String.raw`"Fazer um caixa" / "financiar" = cash & carry. "Base" = futuro − spot. "Rolar o IND" = trocar o vencimento atual pelo próximo. "Fair value" = base teórica com juros e dividendos. "Tá pagando CDI + 50 no swap".`,
  deep: String.raw`<p>Com dividendos discretos \(D_j\) pagos em \(t_j\): \(F = \big(S - \sum_j D_j (1+i)^{-du_j/252}\big)(1+i)^{du/252}\). A base "justa" \(F - S\) é, portanto, juros sobre o spot menos dividendos. Uma base de mercado diferente da justa pode significar: (1) expectativa de dividendos diferente da sua, (2) custo de aluguel (a ponta vendida da cesta), (3) desequilíbrio de fluxo (ex.: rolagem concentrada de estrangeiros). Wilmott discute o carry com dividendos e repo no cap. 8 do PWOQF.</p>`,
  refs: [R_.hull('5.4', 'Forward price for an investment asset (cash-and-carry)'), R_.hull('5.9', 'Futures prices of stock indices'), R_.hull('3.5', 'Stock index futures'), R_.hull('5.12', 'The cost of carry'), R_.wil('8.2', 'Dividends, foreign interest and cost of carry')],
  ex: [
    { tag: 'deltaone', gen: R => { const S = R.f(20, 60, 2), du = R.int(21, 126), i0 = R.f(9, 15, 2) / 100, F = Math.round(S * Math.pow(1 + i0, du / 252) * 100) / 100; const a = (Math.pow(F / S, 252 / du) - 1) * 100; return { q: `Ação à vista a R$ ${Q.fmt(S, 2)} e termo de ${du} dias úteis a R$ ${Q.fmt(F, 2)} (sem proventos no período). Qual a taxa (% a.a., base 252) do cash & carry?`, a, tol: 0.01, tolAbs: 0.05, unit: '% a.a.', dec: 2, e: `(F/S)^{252/du} − 1 = (${Q.fmt(F, 2)}/${Q.fmt(S, 2)})^{252/${du}} − 1 = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'mcq', q: 'O termo implica 14% a.a., o DI do prazo é 11% e os custos somam 0,3% a.a. O que fazer?', o: ['Reverse cash & carry', 'Cash & carry: comprar à vista e vender a termo', 'Nada', 'Comprar calls'], a: 1, e: 'A taxa travada supera o DI mais custos: empresta caro ao mercado.' },
    { tag: 'deltaone', gen: R => { const S = R.int(110, 140) * 1000, i = R.f(9, 14, 2) / 100, du = R.int(10, 60), D = R.int(0, 600); const a = S * Math.pow(1 + i, du / 252) - D; return { q: `Ibovespa à vista em ${Q.fmt(S, 0)} pontos, DI de ${Q.fmt(i * 100, 2)}% a.a., ${du} dias úteis até o vencimento do IND e dividendos esperados de ${D} pontos (valor no vencimento). Qual o preço justo do futuro?`, a, tol: 0.0005, tolAbs: 1, unit: 'pontos', dec: 0, e: `F = S·(1+i)^{du/252} − D = ${Q.fmt(S, 0)}·${Q.fmt(Math.pow(1 + i, du / 252), 5)} − ${D} = ${Q.fmt(a, 0)}.` }; } },
    { tag: 'deltaone', gen: R => { const N = R.int(5, 50) * 1000000, ret = R.f(-8, 12, 1) / 100, fin = R.f(1.5, 4, 2) / 100; const a = N * (ret - fin); return { q: `Um fundo tem um swap de ações de nocional R$ ${Q.fmt(N, 0)}: recebe o retorno total da ação e paga CDI + spread. No período, o retorno total foi ${Q.fmt(ret * 100, 1)}% e o CDI + spread acumulado foi ${Q.fmt(fin * 100, 2)}%. Qual o resultado do fundo?`, a, tol: 0.001, tolAbs: 1, unit: 'R$', dec: 0, e: `N × (retorno − financiamento) = ${Q.fmt(N, 0)} × (${Q.fmt(ret * 100, 1)}% − ${Q.fmt(fin * 100, 2)}%) = ${Q.fmt(a, 0)}.` }; } },
    { t: 'mcq', q: 'Por que o reverse cash & carry costuma ser mais difícil de executar que o cash & carry?', o: ['Porque exige vender a ação à vista — é preciso alugá-la, pagar taxa e correr risco de recall', 'Porque o termo não existe', 'Porque não há juros', 'Porque é ilegal'], a: 0, e: 'A perna vendida depende do BTC.' },
    { t: 'tf', q: 'Uma mesa de delta one com futuros de índice vendidos e a cesta comprada tem exposição à mudança nas expectativas de dividendos.', a: true, e: 'O preço justo do futuro embute dividendos; um corte de dividendos altera o valor relativo.' }
  ],
  cards: [['Delta one', 'Instrumentos lineares (ação, futuro, termo, ETF, TRS): o risco é carry, não vol.'], ['Taxa do cash & carry', 'i = (F/S)^{252/du} − 1'], ['Futuro de índice justo', 'F = S(1+i)^{du/252} − dividendos'], ['Total return swap', 'Recebe retorno total do ativo, paga CDI + spread.']]
}, 'br1-6');

/* ============ BR2-5 — Vanillas, estilos e opções flexíveis ============ */
Course.addLesson('br2', {
  id: 'br2-5', title: 'Vanillas, europeias × americanas e as opções flexíveis da B3', tag: 'vanilla',
  goal: 'Saber o que é uma vanilla, como o estilo de exercício muda o valor e quando uma opção flexível de balcão é a ferramenta certa.',
  body: String.raw`
<p>Uma <b>vanilla</b> ("plain vanilla") é a opção mais simples possível: call ou put com payoff \(\max(S_T-K,0)\) ou \(\max(K-S_T,0)\), sem barreiras, sem médias, sem dependência do caminho. Tudo o que foge disso é <b>exótico</b> (digitais, barreiras, asiáticas...). A vanilla é a unidade de medida do mercado: vol implícita, smile e gregas são todos cotados a partir dela.</p>
<h3>Estilos de exercício</h3>
<ul><li><b>Europeia</b>: só pode ser exercida no vencimento.</li>
<li><b>Americana</b>: pode ser exercida em qualquer dia até o vencimento. Vale sempre pelo menos o mesmo que a europeia.</li>
<li><b>Bermudana</b>: exercício só em datas específicas (comum em juros e em alguns estruturados).</li></ul>
<p>Na B3, as opções sobre ações são, em sua maioria, <b>calls americanas</b> e <b>puts europeias</b>; as opções de Ibovespa são europeias. Confira sempre o estilo na especificação da série — o ticker não conta tudo.</p>
<h3>Quando o exercício antecipado vale a pena?</h3>
<ul><li><b>Call americana sem dividendos</b>: nunca vale exercer antes (é melhor vender a opção, que tem valor extrínseco). Com dividendos, só pode valer exercer imediatamente antes da data ex. Como a B3 ajusta o strike das opções de ações pelos proventos em dinheiro, esse incentivo praticamente desaparece nas calls listadas.</li>
<li><b>Put americana</b>: pode valer exercer cedo quando está <b>muito dentro do dinheiro</b> e os <b>juros são altos</b> — você recebe \(K\) hoje e aplica. Com juros brasileiros, isso é relevante: é a parte do prêmio americano que não existe numa put europeia.</li></ul>
<p>O ganho de exercer hoje uma put muito ITM é, no máximo, os juros sobre o strike até o vencimento:</p>
\[ \text{juros ganhos} \approx K\left[(1+i)^{du/252} - 1\right] \]
<p>Se isso supera o valor de "seguro" que a put ainda oferece (a chance de o papel voltar acima de K), exerça. As árvores binomiais (Unidade 3) fazem essa comparação nó a nó.</p>
<h3>Opções flexíveis (balcão B3)</h3>
<p>São opções <b>negociadas bilateralmente e registradas na B3</b>, com termos à escolha das partes: strike, vencimento, tamanho, e recursos que a opção listada não tem — <b>limitadores de preço</b> (cap/floor), <b>barreiras knock-in e knock-out</b> e <b>rebate</b>. Os ativos-objeto incluem ações, ETFs, BDRs, índices (Ibovespa), moedas (dólar, euro) e índices de juros (DI, Selic). A B3 oferece o registro na modalidade <b>com garantia</b>: ela atua como contraparte central, e o lançador deposita margem. Eventos corporativos ajustam automaticamente strike, barreiras e prêmio; a liquidação é financeira pela câmara.</p>
<table class="tbl"><tr><th></th><th>Vanilla listada</th><th>Opção flexível</th></tr>
<tr><td>Strike/vencimento</td><td>Padronizados (séries da B3)</td><td>Livres</td></tr>
<tr><td>Recursos</td><td>Só call/put</td><td>Barreiras, limitadores, rebate</td></tr>
<tr><td>Preço</td><td>Tela</td><td>Negociado (RFQ) — marcado por modelo</td></tr>
<tr><td>Liquidez para sair</td><td>Alta nas séries líquidas</td><td>Baixa: desmontar com a contraparte</td></tr></table>
<p>Uso típico: a tesouraria de uma importadora compra uma call de dólar para a data exata do pagamento; um fundo compra uma put de Ibovespa com knock-in a 85% (mais barata que a vanilla). Do lado do banco, a flexível vendida entra no livro e é hedgeada com listados — o risco de base da lição 1.5.</p>
<p>Para relembrar os parentes próximos: <b>digitais</b> (Unidade 7) pagam um valor fixo se terminarem dentro do dinheiro, e o <b>COE</b> (Unidade 9) é um título que empacota zero-cupom + opções para o investidor pessoa física.</p>`,
  desk: String.raw`"Vanilla ou exótica?", "americana ou europeia?", "flex de dólar para o dia 23", "com limitador de alta em 5,80", "KI a 85%". "Prêmio americano" = diferença entre a americana e a europeia.`,
  deep: String.raw`<p>Sem dividendos, \(C_{am} = C_{eu}\): exercer cedo joga fora o valor extrínseco e antecipa o pagamento de \(K\) (você perde juros). Para a put, \(P_{am} \ge \max(K - S, P_{eu})\), e a fronteira ótima de exercício \(S^*(t)\) é uma curva abaixo de \(K\) que sobe em direção a \(K\) perto do vencimento. Ela não tem fórmula fechada: resolve-se como problema de fronteira livre (EDP com restrição \(V \ge\) payoff) — ver Wilmott, Howison &amp; Dewynne, cap. 7, e Elliott &amp; Kopp, cap. 8.</p>`,
  refs: [R_.hull('9.1', 'Types of options'), R_.hull('10.5', 'Calls on a non-dividend-paying stock'), R_.hull('10.6', 'Puts on a non-dividend-paying stock'), R_.wil(9, 'Early exercise and American options'), R_.mfd(7, 'American options'), R_.car('opções flexíveis e registro de balcão')],
  ex: [
    { t: 'mcq', q: 'Qual destas é uma vanilla?', o: ['Call europeia com strike 100', 'Put com knock-in em 80', 'Opção asiática sobre a média mensal', 'Digital que paga R$ 1 se S > K'], a: 0, e: 'Vanilla = call/put simples, sem barreira, média ou payoff binário.' },
    { t: 'mcq', q: 'Quando o exercício antecipado de uma put americana é mais provável de ser ótimo?', o: ['Put fora do dinheiro, juros baixos', 'Put muito dentro do dinheiro, juros altos', 'Nunca', 'Sempre na véspera do vencimento'], a: 1, e: 'Recebe K hoje e aplica: o ganho de juros supera o valor residual de seguro.' },
    { tag: 'vanilla', gen: R => { const K = R.f(20, 60, 2), i = R.f(9, 15, 2) / 100, du = R.int(21, 126); const a = K * (Math.pow(1 + i, du / 252) - 1); return { q: `Você tem uma put americana de strike R$ ${Q.fmt(K, 2)}, muito dentro do dinheiro, com ${du} dias úteis até o vencimento. Com DI de ${Q.fmt(i * 100, 2)}% a.a., quanto de juros (por opção) você ganharia recebendo o strike hoje em vez de no vencimento?`, a, tol: 0.005, unit: 'R$', dec: 4, e: `K·[(1+i)^{du/252} − 1] = ${Q.fmt(K, 2)}·[${Q.fmt(Math.pow(1 + i, du / 252), 5)} − 1] = ${Q.fmt(a, 4)}.` }; } },
    { t: 'tf', q: 'Opções flexíveis da B3 podem incluir barreiras knock-in e knock-out e limitadores de preço.', a: true, e: 'Esses recursos são justamente o que as diferencia das listadas.' },
    { tag: 'vanilla', gen: R => { const K = 100, L = R.pick([110, 115, 120]), S = R.int(85, 135); const a = Math.max(Math.min(S, L) - K, 0); return { q: `Uma call flexível tem strike ${K} e limitador de alta em ${L} (payoff = max(min(S_T, ${L}) − ${K}, 0)). Se S_T = ${S}, qual o payoff?`, a, tol: 0.001, tolAbs: 0.001, dec: 2, e: `min(${S}, ${L}) = ${Math.min(S, L)} ⇒ payoff = max(${Math.min(S, L)} − ${K}, 0) = ${a}.` }; } },
    { t: 'mcq', q: 'Qual a principal desvantagem de uma opção flexível em relação a uma listada, para quem compra?', o: ['Não pode ter strike livre', 'Menor liquidez para sair antes do vencimento e preço marcado por modelo', 'Não tem garantia nunca', 'Só existe para dólar'], a: 1, e: 'Sob medida tem custo: sair antes depende de negociar com a contraparte.' }
  ],
  cards: [['Vanilla', 'Call/put simples, sem path dependence.'], ['Americana × europeia', 'Americana exerce a qualquer momento; vale ≥ europeia.'], ['Put americana e juros', 'Exercício antecipado pode ser ótimo quando muito ITM e juros altos.'], ['Opção flexível (B3)', 'Balcão registrado: strike/vencimento livres, barreiras, limitadores, rebate.']]
}, 'br2-4');
})();
