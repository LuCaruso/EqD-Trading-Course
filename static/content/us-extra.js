/* Módulo US — lições extras baseadas nos livros (v4): saltos e caudas, term sheets e métodos numéricos */
(function () {
const R_ = window.REF;

/* ============ US2-5 — Saltos, crashes e caudas gordas ============ */
Course.addLesson('us2', {
  id: 'us2-5', title: 'Saltos, crashes e caudas gordas: o risco que o delta não pega', tag: 'saltos',
  goal: 'Entender por que retornos têm caudas gordas, como o modelo de Merton gera o skew de curto prazo e como a mesa gerencia gap risk.',
  body: String.raw`
<p>Em 19 de outubro de 1987 o S&amp;P 500 caiu cerca de 20% num único dia. Com vol de 20% ao ano, o desvio diário é ~1,26%: a queda foi de uns 16 desvios. Sob a normal, isso não aconteceria nem uma vez na idade do universo. A conclusão não é que 1987 foi "azar": é que <b>retornos não são normais</b>. Eles têm <b>caudas gordas</b> (curtose alta) e <b>saltos</b>.</p>
<h3>O que os dados mostram</h3>
<ul><li>Muitos dias parados e alguns dias enormes — a distribuição é mais "pontuda" no centro e mais pesada nas pontas que a normal.</li>
<li>As caudas decaem como potência, não como exponencial (Focardi &amp; Fabozzi, cap. 13): eventos extremos são raros, mas muito menos raros do que o GBM diz.</li>
<li>Em ações, a cauda de baixa é mais gorda que a de alta: crashes são para baixo.</li></ul>
<h3>O modelo de Merton (jump-diffusion)</h3>
<p>Ao GBM soma-se um processo de Poisson: em média \(\lambda\) saltos por ano, cada um multiplicando o preço por \(J\) (lognormal, com média \(\mu_J\) no log e desvio \(\delta\)):</p>
\[ \frac{dS}{S} = (r - \lambda k)\,dt + \sigma\,dW + (J - 1)\,dN, \qquad k = \mathbb{E}[J] - 1 \]
<p>O termo \(-\lambda k\) mantém o drift neutro a risco igual a \(r\). O preço de uma call é uma média de preços de Black-Scholes, ponderada pela probabilidade de ocorrerem \(n\) saltos:</p>
\[ C = \sum_{n=0}^{\infty} \frac{e^{-\lambda' T}(\lambda' T)^n}{n!}\; C_{BS}(S, K, T, r_n, \sigma_n), \quad \sigma_n^2 = \sigma^2 + \frac{n\,\delta^2}{T} \]
<p>com \(\lambda' = \lambda(1+k)\) e \(r_n = r - \lambda k + n\ln(1+k)/T\).</p>
<div class="w" data-w="jumpsmile"></div>
<h3>A assinatura dos saltos no smile</h3>
<ul><li><b>Saltos negativos</b> ⇒ puts OTM ficam caras ⇒ <b>skew</b>.</li>
<li>O efeito é <b>forte no curto e se dilui no longo</b>: em 1 ano, um salto vira "só mais variância". Vol estocástica faz o contrário (skew que persiste com o prazo). O mercado de índices tem as duas coisas — por isso modelos de produção combinam vol estocástica com saltos.</li>
<li><b>Evento binário conhecido</b> (resultado, julgamento, eleição): a distribuição fica bimodal e o smile pode virar um "frown" (Hull §19.8).</li></ul>
<h3>Hedgear saltos</h3>
<p>No salto, a perda de uma posição delta-hedgeada é \(V(S+J) - V(S) - \Delta J \approx \tfrac12\Gamma J^2\) — e o delta não tem tempo de reagir. Só outras opções protegem. Por isso a mesa:</p>
<ul><li>limita <b>gap risk</b> com cenários de −10%, −20% e +10% instantâneos, além do gamma;</li>
<li>compra <b>puts OTM</b> (ou put spreads) como "seguro de cauda" contra livros short gamma;</li>
<li>aceita que o mercado é <b>incompleto</b>: a intensidade de saltos neutra a risco fica acima da histórica (o crash premium que você paga no skew). CrashMetrics (Wilmott, cap. 43 e 58) formaliza o pior caso: dado um crash de até X%, qual a pior perda e qual o hedge estático ótimo?</li></ul>`,
  desk: String.raw`"Gap risk", "tail hedge", "o skew está pagando crash", "cenário −20% instantâneo", "jump to default". "Puts de 10 delta" = proteção de cauda. "Isso é um evento de 6 sigma? Não, é terça-feira" — piada sobre caudas gordas.`,
  deep: String.raw`<p>No modelo de Merton o mercado é incompleto (duas fontes de risco, \(dW\) e \(dN\), e um só ativo), e o preço acima usa a hipótese de Merton de que o risco de salto é diversificável (não precificado). Hedge com a ação apenas minimiza a variância, mas não zera. Com uma segunda opção é possível neutralizar o salto de tamanho conhecido (Wilmott, cap. 57). Estatística de caudas: se \(P(|X| &gt; x) \sim x^{-\alpha}\), a curtose é infinita para \(\alpha \le 4\); estimativas para retornos diários de ações costumam ficar em torno de \(\alpha \approx 3\) (lei cúbica), em linha com a discussão de leis estáveis e escala em Focardi &amp; Fabozzi.</p>`,
  refs: [R_.wil(57, 'Jump diffusion'), R_.wil(58, 'Crash modeling'), R_.wil(43, 'CrashMetrics'), R_.der(26, 'jump diffusion'), R_.der(27, 'crash modeling'), R_.ff(13, 'Fat tails, scaling, and stable laws'), R_.hull('19.8', 'When a single large jump is anticipated'), R_.hull('26.1', 'Alternatives to Black–Scholes–Merton (jumps)')],
  sims: ['smile', 'book'],
  ex: [
    { tag: 'saltos', gen: R => { const s = R.f(12, 40, 0) / 100, mv = R.f(3, 22, 1); const a = mv / (s * 100 / Math.sqrt(252)); return { q: `Um índice com vol de ${Q.fmt(s * 100, 0)}% a.a. cai ${Q.fmt(mv, 1)}% em um dia. Quantos desvios-padrão diários (regra: σ/√252) foi esse movimento?`, a, tol: 0.005, dec: 2, unit: 'desvios', e: `Desvio diário = ${Q.fmt(s * 100, 0)}%/√252 = ${Q.fmt(s * 100 / Math.sqrt(252), 3)}% ⇒ ${Q.fmt(mv, 1)}/${Q.fmt(s * 100 / Math.sqrt(252), 3)} = ${Q.fmt(a, 2)}.` }; } },
    { tag: 'saltos', gen: R => { const lam = R.f(0.2, 2, 1), T = R.pick([0.25, 0.5, 1]), n = R.int(0, 3); let f = 1; for (let i = 2; i <= n; i++) f *= i; const a = Math.exp(-lam * T) * Math.pow(lam * T, n) / f * 100; return { q: `Saltos chegam como Poisson com intensidade λ = ${Q.fmt(lam, 1)} por ano. Qual a probabilidade (%) de ocorrerem exatamente ${n} salto(s) em ${Q.fmt(T, 2)} ano?`, a, tol: 0.003, tolAbs: 0.01, dec: 3, unit: '%', e: `e^{−λT}(λT)^n/n! = e^{−${Q.fmt(lam * T, 3)}}·${Q.fmt(lam * T, 3)}^${n}/${n}! = ${Q.fmt(a, 3)}%.` }; } },
    { tag: 'saltos', gen: R => { const s = R.f(0.12, 0.3, 2), d = R.f(0.05, 0.25, 2), n = R.int(1, 3), T = R.pick([0.25, 0.5, 1]); const a = Math.sqrt(s * s + n * d * d / T) * 100; return { q: `No termo n da série de Merton, a vol usada é σₙ = √(σ² + nδ²/T). Com σ = ${Q.fmt(s * 100, 0)}%, δ = ${Q.fmt(d * 100, 0)}%, n = ${n} e T = ${Q.fmt(T, 2)}, quanto vale σₙ (%)?`, a, tol: 0.003, dec: 2, unit: '%', e: `√(${Q.fmt(s * s, 4)} + ${n}·${Q.fmt(d * d, 4)}/${Q.fmt(T, 2)}) = ${Q.fmt(a, 2)}%.` }; } },
    { t: 'mcq', q: 'Qual assinatura no smile é típica de saltos negativos (comparada com vol estocástica)?', o: ['Skew igual em todos os prazos', 'Skew forte no curto prazo que se achata rapidamente com o vencimento', 'Smile só no longo prazo', 'Nenhuma'], a: 1, e: 'No longo prazo o salto se dilui em variância total; no curto domina a distribuição.' },
    { t: 'mcq', q: 'Seu livro está short gamma e você teme um gap de −15%. O hedge adequado é:', o: ['Aumentar a frequência do delta hedge', 'Comprar puts OTM / put spreads (convexidade)', 'Vender mais calls', 'Não há hedge'], a: 1, e: 'Salto não se hedgeia com ação; só com convexidade (opções).' },
    { t: 'tf', q: 'Com saltos no processo do ativo, o mercado continua completo e o delta hedge replica qualquer opção.', a: false, e: 'Duas fontes de risco, um ativo ⇒ incompleto.' }
  ],
  cards: [['Caudas gordas', 'Extremos muito mais frequentes que na normal; cauda de baixa mais pesada.'], ['Merton (1976)', 'GBM + saltos de Poisson; preço = média de BS ponderada por Poisson.'], ['Skew de saltos', 'Forte no curto, achata com o prazo.'], ['Gap risk', 'Perda ≈ ½ΓJ² no salto; hedge com opções, não com ação.']]
}, 'us2-4');

/* ============ US4-5 — Lendo um term sheet ============ */
Course.addLesson('us4', {
  id: 'us4-5', title: 'Lendo um term sheet: do contrato às gregas', tag: 'termsheet',
  goal: 'Ler um term sheet de estruturado, classificar o produto (à la Wilmott) e mapear cada cláusula para o risco que ela cria no livro.',
  body: String.raw`
<p>Todo exótico começa como um <b>term sheet</b>: duas ou três páginas que dizem o que é pago, quando e sob que condições. O trader precisa transformar esse texto em <b>payoff → método de precificação → gregas → hedge</b>. Wilmott (PWOQF cap. 29) faz isso com vários contratos reais; aqui vai o roteiro.</p>
<h3>Os campos que importam</h3>
<ul><li><b>Emissor e forma</b> (nota, swap, COE): quem carrega o risco de crédito.</li>
<li><b>Ativo(s)-objeto</b> e <b>nível inicial</b> (fixing de fechamento, média de alguns dias...).</li>
<li><b>Datas</b>: trade, strike, observações, pagamentos, vencimento; convenção de dia útil.</li>
<li><b>Fórmula de pagamento</b>: cupom, participação, cap/floor, memória.</li>
<li><b>Barreiras</b>: nível, direção, e sobretudo o <b>tipo de monitoramento</b> — contínuo, fechamento diário, ou só no vencimento (barreira europeia).</li>
<li><b>Autocall</b>: gatilho e datas.</li>
<li><b>Liquidação</b>: financeira ou física (entrega de ações no pior cenário).</li>
<li><b>Agente de cálculo e eventos</b>: quem calcula os fixings, ajustes por eventos corporativos e disrupção de mercado.</li></ul>
<h3>Classificar antes de precificar (Wilmott, cap. 22)</h3>
<table class="tbl"><tr><th>Pergunta</th><th>Por que importa</th></tr>
<tr><td>Dependência do tempo? (datas discretas)</td><td>Saltos no valor/gregas perto das datas de observação</td></tr>
<tr><td>Fluxos intermediários? (cupons)</td><td>Valor cai na data do pagamento; ajuste na EDP/MC</td></tr>
<tr><td>Dependência do caminho? fraca (barreira) ou forte (média, máximo)</td><td>Fraca: EDP com condição de contorno. Forte: variável extra ou Monte Carlo</td></tr>
<tr><td>Dimensão (quantos ativos)?</td><td>1–2: árvore/EDP. 3+: Monte Carlo (e correlação!)</td></tr>
<tr><td>Ordem (opção sobre opção)?</td><td>Compostas, sensíveis à vol da vol</td></tr>
<tr><td>Decisões embutidas? (exercício, callable)</td><td>Problema de parada ótima: americana/bermudana</td></tr></table>
<h3>Exemplo (fictício): nota autocall worst-of</h3>
<div class="box"><div class="bt">Term sheet resumido — produto ilustrativo</div>
<b>Prazo</b> 3 anos · <b>Ativos</b> ação A e ação B · <b>Nível inicial</b> fechamento do trade date · <b>Observações</b> trimestrais · <b>Cupom</b> 2,5% por trimestre <b>com memória</b>, pago se o <i>pior</i> ativo ≥ 70% do inicial · <b>Autocall</b> se o pior ativo ≥ 100% em qualquer observação (paga 100% + cupom) · <b>Proteção</b>: no vencimento, se o pior ativo &lt; 60% (barreira observada só no vencimento), o investidor recebe 100% × desempenho do pior; senão, 100%.</div>
<p>Decodificando:</p>
<ul><li>O investidor está <b>vendido em uma put down-and-in worst-of</b> (strike 100%, barreira europeia 60%) e em digitais de cupom (barreira 70%). O cupom alto paga essa venda de vol.</li>
<li>O banco fica com o oposto: <b>comprado na put worst-of</b> ⇒ em geral <b>long vega</b> (especialmente vol baixa/downside) e <b>vendido em correlação</b> — a put worst-of vale mais quando os ativos andam descorrelacionados. É por isso que emissores de autocalls "reciclam" vega vendendo vol longa no mercado e acompanham correlação implícita.</li>
<li><b>Memória</b>: cupons não pagos são pagos depois, se a condição voltar a ser atendida — mais valioso para o investidor, mais digital para o banco.</li>
<li><b>Worst-of + 2 ativos + datas discretas + autocall</b> ⇒ Monte Carlo com correlação, vol local/estocástica e cuidado com gregas ruidosas perto das barreiras.</li></ul>
<h3>Checklist de 10 perguntas</h3>
<ol><li>Quem está comprado em opcionalidade, e qual?</li><li>Qual o pior cenário do investidor e do banco?</li><li>A barreira é contínua, diária ou no vencimento?</li><li>O que acontece em cada data de observação?</li><li>Há memória, autocall, callable?</li><li>Quantos ativos? Worst-of ou basket?</li><li>Liquidação física ou financeira?</li><li>Quem calcula e como se ajustam eventos corporativos?</li><li>Quais gregas mudam de sinal perto das barreiras?</li><li>Qual o método de precificação e quanto de reserva de modelo cobrar?</li></ol>`,
  desk: String.raw`"Worst-of", "memória", "barreira europeia" (só no vencimento), "KI contínuo", "autocall trimestral", "calculation agent", "recyclar vega". "O investidor vendeu a put down-and-in" é a frase que resume 80% dos estruturados de varejo.`,
  deep: String.raw`<p>Sensibilidade à correlação de uma put worst-of: com correlação \(\rho \to 1\), o worst-of vira uma put sobre um único ativo; com \(\rho\) baixo, a chance de <i>algum</i> ativo cair muito aumenta, e a put vale mais. Logo \(\partial V_{\text{put WO}}/\partial\rho &lt; 0\): o detentor (o banco) está vendido em correlação. O cupom digital com barreira de 70% é, localmente, um call spread muito apertado ⇒ gamma e vega trocam de sinal perto de 70% (pin risk de barreira), como nas digitais da Unidade 7. Wilmott mostra como decompor term sheets em vanillas quando possível (§29.9).</p>`,
  refs: [R_.wil(29, 'Equity and FX term sheets'), R_.wil('29.9', 'Decomposition of exotics into vanillas'), R_.wil(22, 'Introduction to exotic and path-dependent derivatives (classification)'), R_.hull(25, 'Exotic options'), R_.hull('25.14', 'Options involving several assets'), R_.der(13, 'an introduction to exotic and path-dependent options')],
  sims: ['barrier'],
  ex: [
    { tag: 'termsheet', gen: R => { const c = R.pick([2, 2.5, 3]), flags = [0, 0, 0, 0].map(() => R.u() < 0.5 ? 1 : 0); let last = 0; flags.forEach((f, i) => { if (f) last = i + 1; }); const a = c * last; return { q: `Cupom de ${Q.fmt(c, 1)}% por trimestre com memória, pago se a condição for atendida. Nos 4 primeiros trimestres a condição foi: ${flags.map((f, i) => `T${i + 1} ${f ? 'atendida' : 'não atendida'}`).join(', ')}. Quanto de cupom (em % do nocional) foi pago no total nesses 4 trimestres?`, a, tol: 0.001, tolAbs: 0.001, dec: 1, unit: '%', e: `Com memória, cada pagamento quita os cupons atrasados: total = cupom × (último trimestre atendido) = ${Q.fmt(c, 1)} × ${last} = ${Q.fmt(a, 1)}%.` }; } },
    { tag: 'termsheet', gen: R => { const pa = R.f(0.4, 1.3, 2), pb = R.f(0.4, 1.3, 2), b = 0.6; const w = Math.min(pa, pb); const a = (w < b ? w : 1) * 100; return { q: `No vencimento da nota worst-of (barreira de 60% observada só no vencimento), a ação A está em ${Q.fmt(pa * 100, 0)}% e a B em ${Q.fmt(pb * 100, 0)}% do nível inicial. Quanto o investidor recebe (% do nocional, sem contar cupons)?`, a, tol: 0.001, tolAbs: 0.01, dec: 0, unit: '%', e: `Pior desempenho = ${Q.fmt(w * 100, 0)}%. ${w < b ? 'Abaixo de 60% ⇒ recebe 100% × pior = ' + Q.fmt(w * 100, 0) + '%.' : 'Acima de 60% ⇒ capital protegido: 100%.'}` }; } },
    { t: 'mcq', q: 'Para o investidor que vendeu a put down-and-in, trocar a barreira "só no vencimento" por monitoramento contínuo deveria:', o: ['Reduzir o cupom', 'Aumentar o cupom (a put vendida vale mais, pois é mais fácil tocar a barreira)', 'Não mudar nada', 'Eliminar o risco'], a: 1, e: 'Monitoramento contínuo ⇒ maior chance de knock-in ⇒ put mais valiosa ⇒ mais prêmio para pagar cupom.' },
    { t: 'mcq', q: 'O banco que emitiu uma autocall worst-of (e ficou comprado na put worst-of) está, quanto à correlação entre os ativos:', o: ['Comprado em correlação', 'Vendido em correlação (ganha se a correlação cair)', 'Neutro', 'Depende só dos juros'], a: 1, e: 'A put worst-of vale mais com correlação baixa ⇒ quem a detém está short correlation no sentido de mesa.' },
    { t: 'mcq', q: 'Pela classificação de Wilmott, uma opção asiática sobre a média aritmética diária é:', o: ['Sem dependência de caminho', 'Fracamente dependente do caminho', 'Fortemente dependente do caminho (precisa de uma variável extra: a média)', 'Multiativo'], a: 2, e: 'A média é uma nova variável de estado — EDP em 3 dimensões ou Monte Carlo.' },
    { t: 'tf', q: 'O agente de cálculo é quem determina os fixings e os ajustes em caso de evento corporativo ou disrupção de mercado, conforme o term sheet.', a: true, e: 'Cláusula que parece burocrática e decide pagamentos em dias difíceis.' }
  ],
  cards: [['Term sheet', 'Contrato resumido: ativos, datas, fórmula, barreiras, liquidação, agente de cálculo.'], ['Classificação de Wilmott', 'Tempo, fluxos, dependência de caminho, dimensão, ordem, decisões.'], ['Autocall worst-of (banco)', 'Long put worst-of: em geral long vega, short correlação.'], ['Cupom com memória', 'Cupons não pagos são pagos depois se a condição voltar.']]
}, 'us4-4');

/* ============ US6-5 — Métodos numéricos ============ */
Course.addLesson('us6', {
  id: 'us6-5', title: 'Métodos numéricos da mesa: árvores, diferenças finitas e Monte Carlo', tag: 'numerico',
  goal: 'Saber qual método usar para cada produto, entender convergência, estabilidade e ruído, e ler criticamente o número que sai do pricer.',
  body: String.raw`
<p>Fórmula fechada é exceção. Americanas, barreiras discretas, asiáticas, worst-of, autocalls, vol local/estocástica — tudo isso sai de um <b>método numérico</b>. O trader não precisa programá-lo, mas precisa saber quando o número é confiável.</p>
<h3>1. Árvores (binomial/trinomial)</h3>
<p>Já vistas na Unidade 3: intuitivas, ótimas para <b>exercício americano</b> e 1 ativo. Convergem oscilando (o preço "pula" conforme o strike cai entre nós); custo \(O(N^2)\). Truques: alinhar nós ao strike/barreira, média de N e N+1 passos.</p>
<h3>2. Diferenças finitas (EDP)</h3>
<p>Discretiza-se a EDP de Black-Scholes numa grade de preço × tempo e marcha-se do vencimento para hoje. O <b>esquema explícito</b> é simples, mas só é estável se o passo de tempo for pequeno o suficiente:</p>
\[ \delta t \;\le\; \frac{\delta S^2}{\sigma^2 S_{max}^2} \]
<p>Dobrar a resolução no preço exige 4× mais passos no tempo. Esquemas <b>implícitos</b> e <b>Crank-Nicolson</b> são estáveis para qualquer passo (CN tem erro de 2ª ordem, mas pode oscilar com payoffs não suaves — usa-se alguns passos implícitos no início, o "Rannacher"). Vantagens: barreiras entram como condição de contorno, americanas como restrição \(V \ge\) payoff, e as <b>gregas saem da própria grade</b> (delta e gamma por diferenças entre nós vizinhos). Limite prático: 1–2, no máximo 3 dimensões.</p>
<div class="w" data-w="fdstab"></div>
<h3>3. Monte Carlo</h3>
<p>Simula-se milhares de caminhos sob Q, calcula-se o payoff de cada um e tira-se a média descontada:</p>
\[ \hat V = e^{-rT}\,\frac{1}{N}\sum_{i=1}^{N} \text{payoff}^{(i)}, \qquad \text{EP} = \frac{s}{\sqrt N} \]
<p>O erro cai com \(1/\sqrt N\): para dividir o erro por 10, 100× mais caminhos. Em troca, a dimensão quase não importa — é <b>o</b> método para worst-of, baskets, autocalls e qualquer dependência de caminho. Técnicas de <b>redução de variância</b>: variáveis antitéticas (usar \(Z\) e \(-Z\)), variáveis de controle (usar algo com preço conhecido, como a própria ação ou a vanilla), números quasi-aleatórios (Sobol). Americanas: Longstaff-Schwartz (regressão). Gregas: "bump and reprice" com os <b>mesmos números aleatórios</b> — senão o ruído engole o delta.</p>
<div class="w" data-w="mcconv"></div>
<h3>Qual usar?</h3>
<table class="tbl"><tr><th>Produto</th><th>Método natural</th></tr>
<tr><td>Vanilla europeia</td><td>Fórmula fechada (BS/Black)</td></tr>
<tr><td>Americana, 1 ativo</td><td>Árvore ou diferenças finitas</td></tr>
<tr><td>Barreira contínua, 1 ativo</td><td>Fórmula (vol constante) ou EDP (vol local)</td></tr>
<tr><td>Asiática, lookback</td><td>EDP com variável extra ou Monte Carlo</td></tr>
<tr><td>Worst-of / basket / autocall multiativo</td><td>Monte Carlo</td></tr>
<tr><td>Vol estocástica (Heston) vanilla</td><td>Integração numérica (Fourier)</td></tr></table>
<h3>Lendo o pricer como trader</h3>
<ul><li>Pergunte o <b>erro numérico</b> (erro padrão no MC, sensibilidade ao tamanho da grade na EDP).</li>
<li>Gregas de MC perto de barreiras/digitais são <b>ruidosas</b>: suavize o payoff (call spread no lugar da digital) ou use EDP.</li>
<li>Faça <b>benchmark</b>: o método reproduz a vanilla/barreira com fórmula fechada?</li>
<li>Tempo de cálculo importa: o livro inteiro precisa ser reavaliado em cenários de stress todo dia.</li></ul>`,
  desk: String.raw`"O MC está ruidoso", "quantos paths?", "sobe a grade", "gregas por bump", "mesma seed", "o pricer não converge perto da barreira". "Quasi-MC" = Sobol. "LSM" = Longstaff-Schwartz.`,
  deep: String.raw`<p><b>Estabilidade do explícito.</b> Com \(V_i^{k+1} = a_iV_{i-1}^k + b_iV_i^k + c_iV_{i+1}^k\), \(b_i = 1 - \delta t(\sigma^2 i^2 + r)\). Se \(b_i &lt; 0\) em algum nó, erros de arredondamento se amplificam a cada passo (análise de von Neumann); a condição \(b_i \ge 0\) no nó mais alto \(i = N_S\) dá \(\delta t \le 1/(\sigma^2 N_S^2)\) com \(S = i\,\delta S\) — a forma acima. <b>MC e dimensão.</b> O erro \(s/\sqrt N\) independe do número de ativos, enquanto uma grade com \(m\) pontos por dimensão custa \(m^d\): é a "maldição da dimensionalidade" que torna o MC imbatível acima de 3 fatores (Wilmott, cap. 76 e 80).</p>`,
  refs: [R_.wil(76, 'Overview of numerical methods'), R_.wil(77, 'Finite-difference methods for one-factor models'), R_.wil(78, 'Further finite-difference methods (Crank-Nicolson)'), R_.wil(80, 'Monte Carlo simulation'), R_.mfd(8, 'Finite-difference methods'), R_.mfd(10, 'Binomial methods'), R_.hull('20.6', 'Monte Carlo simulation'), R_.hull('20.7', 'Variance reduction procedures'), R_.hull('20.8', 'Finite difference methods'), R_.hull('26.8', 'Monte Carlo simulation and American options'), R_.der(46, 'finite-difference methods for one-factor models'), R_.der(49, 'Monte Carlo simulation and related methods'), R_.cqf(3, 'métodos numéricos: diferenças finitas e Monte Carlo')],
  sims: ['bs', 'barrier'],
  ex: [
    { tag: 'numerico', gen: R => { const s = R.f(5, 40, 1), N = R.pick([1000, 10000, 40000, 100000]); const a = s / Math.sqrt(N); return { q: `Num Monte Carlo com ${Q.fmt(N, 0)} caminhos, o desvio-padrão dos payoffs descontados é ${Q.fmt(s, 1)}. Qual o erro padrão da estimativa?`, a, tol: 0.005, dec: 4, e: `EP = s/√N = ${Q.fmt(s, 1)}/√${N} = ${Q.fmt(a, 4)}.` }; } },
    { tag: 'numerico', gen: R => { const s = R.f(5, 40, 1), e = R.pick([0.01, 0.02, 0.05]); const a = Math.pow(s / e, 2); return { q: `Desvio dos payoffs = ${Q.fmt(s, 1)}. Quantos caminhos são necessários para erro padrão de ${Q.fmt(e, 2)}?`, a, tol: 0.005, dec: 0, unit: 'caminhos', e: `N = (s/EP)² = (${Q.fmt(s, 1)}/${Q.fmt(e, 2)})² = ${Q.fmt(a, 0)}.` }; } },
    { tag: 'numerico', gen: R => { const s = R.f(0.15, 0.5, 2), NS = R.pick([50, 80, 100, 150]), T = R.pick([0.5, 1, 2]); const raw = s * s * NS * NS * T, a = Math.ceil(raw - 1e-9); return { q: `Esquema explícito com ${NS} passos no preço (S de 0 a S_max), σ = ${Q.fmt(s * 100, 0)}% e T = ${Q.fmt(T, 1)}. Qual o número mínimo (inteiro) de passos no tempo para estabilidade (M ≥ σ²·N_S²·T)?`, a, tol: 0.005, dec: 0, unit: 'passos', e: `σ²·N_S²·T = ${Q.fmt(s * s, 4)}·${NS * NS}·${Q.fmt(T, 1)} = ${Q.fmt(raw, 2)} ⇒ arredondando para cima, ${a} passos.` }; } },
    { t: 'mcq', q: 'Qual método é o natural para uma autocall worst-of sobre 4 ações?', o: ['Árvore binomial', 'Diferenças finitas em 4 dimensões', 'Monte Carlo', 'Fórmula de Black-Scholes'], a: 2, e: 'Alta dimensão + datas discretas + caminho: Monte Carlo.' },
    { t: 'mcq', q: 'Variáveis antitéticas consistem em:', o: ['Usar Z e −Z em pares de caminhos para reduzir variância', 'Dobrar a vol', 'Usar dois modelos diferentes', 'Descartar caminhos extremos'], a: 0, e: 'Pares simétricos cancelam parte do ruído.' },
    { t: 'tf', q: 'Crank-Nicolson é estável para qualquer passo de tempo, mas pode gerar oscilações espúrias com payoffs não suaves (como digitais).', a: true, e: 'Por isso se usam alguns passos totalmente implícitos no início (Rannacher).' },
    { t: 'mcq', q: 'Ao calcular o delta por "bump and reprice" num Monte Carlo, o essencial é:', o: ['Usar números aleatórios diferentes no preço base e no preço com bump', 'Usar os mesmos números aleatórios (mesma seed) nas duas avaliações', 'Aumentar a vol', 'Usar poucos caminhos'], a: 1, e: 'Common random numbers: senão a diferença é dominada pelo ruído.' }
  ],
  cards: [['Erro do Monte Carlo', 'EP = s/√N: 100× caminhos para 10× menos erro.'], ['Estabilidade do explícito', 'δt ≤ δS²/(σ²S²max) — M ≥ σ²N_S²T.'], ['Crank-Nicolson', 'Estável e de 2ª ordem; oscila com payoff não suave (usar Rannacher).'], ['Qual método?', '1 ativo americano: árvore/EDP; multiativo/caminho: Monte Carlo.']]
}, 'us6-4');
})();
