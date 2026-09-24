/* Módulo US — lição v5 (trilha CQF): risco e retorno */
(function () {
const R_ = window.REF;

Course.addLesson('us6', {
  id: 'us6-6', title: 'Risco e retorno (trilha CQF): fronteira eficiente, Sharpe, Kelly e orçamento de risco', tag: 'riscoretorno',
  goal: 'Usar a teoria de carteiras (tema do Módulo 2 do CQF) para dimensionar posições e alocar risco entre estratégias — e saber onde ela falha para livros de opções.',
  body: String.raw`
<p>"Remunerar o portfólio com eficiência" tem uma versão quantitativa: obter o maior retorno possível <b>por unidade de risco</b>. É o núcleo do Módulo 2 do CQF (Quantitative Risk &amp; Return) e dos capítulos de gestão de carteiras de Wilmott e Focardi &amp; Fabozzi.</p>
<h3>Markowitz: diversificação em uma fórmula</h3>
<p>Para dois ativos com pesos \(w\) e \(1-w\):</p>
\[ \sigma_p^2 = w^2\sigma_A^2 + (1-w)^2\sigma_B^2 + 2\,w(1-w)\,\rho\,\sigma_A\sigma_B \]
<p>Com \(\rho &lt; 1\), a vol da carteira é menor que a média ponderada das vols — o único "almoço grátis" em finanças. O conjunto das melhores combinações (maior retorno para cada nível de risco) é a <b>fronteira eficiente</b>. O ponto mais à esquerda é a <b>carteira de mínima variância</b>:</p>
\[ w_A^{mv} = \frac{\sigma_B^2 - \rho\,\sigma_A\sigma_B}{\sigma_A^2 + \sigma_B^2 - 2\rho\,\sigma_A\sigma_B} \]
<h3>Com um ativo livre de risco: Sharpe e a carteira tangente</h3>
\[ S = \frac{\mu_p - r}{\sigma_p} \]
<p>Misturando caixa (taxa \(r\)) com uma carteira de risco, você anda sobre uma reta; a melhor reta toca a fronteira na <b>carteira tangente</b>, a de <b>maior Sharpe</b>. Todo investidor racional (nesse modelo) segura a mesma carteira de risco e só ajusta quanto põe nela — a separação em dois fundos. Se todos fazem isso, a tangente é o mercado e surge o <b>CAPM</b>: \(\mu_i - r = \beta_i(\mu_M - r)\), com \(\beta_i = \text{cov}(r_i, r_M)/\sigma_M^2\) — o mesmo beta que você usa para hedgear uma carteira com futuro de índice (lição 1.4).</p>
<div class="w" data-w="frontier"></div>
<h3>Kelly: quanto apostar</h3>
<p>Para maximizar o crescimento de longo prazo do capital (log-riqueza), a fração ótima a investir num ativo com excesso de retorno \(\mu - r\) e vol \(\sigma\) é:</p>
\[ f^* = \frac{\mu - r}{\sigma^2} \]
<p>Wilmott chega a isso pelo blackjack (PWOQF cap. 17). Na prática, mesas e gestores usam <b>meio Kelly</b> ou menos: \(\mu\) é estimado com erro enorme, e Kelly cheio tem drawdowns brutais. Para um trade de vol: o "edge" é a diferença entre vol justa e negociada, e o "σ" é a incerteza do PnL do trade (erro de hedge, saltos) — a fórmula dá a intuição de dimensionamento: tamanho ∝ edge ÷ variância.</p>
<h3>Orçamento de risco na mesa</h3>
<ul><li>A mesa distribui limites (VaR, stress, vega, gamma) entre estratégias de acordo com o Sharpe esperado e com a <b>contribuição marginal ao risco</b> total — uma estratégia descorrelacionada merece mais limite do que o seu risco isolado sugere.</li>
<li><b>Risk parity</b>: pesos tais que cada estratégia contribua com o mesmo risco — robusto quando você não confia nas estimativas de retorno.</li></ul>
<h3>Onde a teoria quebra</h3>
<ul><li><b>Erro de estimação</b>: pesos de Markowitz são hipersensíveis a \(\mu\). Remédios: restrições, shrinkage, Black-Litterman, risk parity.</li>
<li><b>Variância não basta para opções</b>: um livro vendido em opções tem vol baixa quase sempre e caudas enormes. Use stress, CrashMetrics e medidas coerentes como o Expected Shortfall (Elliott &amp; Kopp, cap. 11) além da variância.</li>
<li><b>Correlações sobem nas crises</b> (LTCM, lição 10.5): a diversificação some quando você mais precisa dela.</li></ul>`,
  desk: String.raw`"Qual o Sharpe dessa estratégia?", "tá pesado demais para o edge", "meio Kelly", "orçamento de VaR", "contribuição marginal ao risco", "essa estratégia diversifica o livro", "o beta da carteira".`,
  deep: String.raw`<p>Com \(n\) ativos, vetor de excessos de retorno \(\boldsymbol\mu - r\mathbf 1\) e matriz de covariância \(\Sigma\), a carteira tangente é \(\mathbf w \propto \Sigma^{-1}(\boldsymbol\mu - r\mathbf 1)\) — que é exatamente o vetor de Kelly multivariado \(\mathbf f^* = \Sigma^{-1}(\boldsymbol\mu - r\mathbf 1)\) sem normalização. A inversa de \(\Sigma\) amplifica erros de estimação nos autovetores de menor variância; por isso a estimação robusta da covariância (e o tratamento de caudas, Focardi &amp; Fabozzi cap. 13) importa tanto quanto a fórmula.</p>`,
  refs: [R_.cqf(2, 'Markowitz, CAPM, risco'), R_.wil('18.3', 'Modern Portfolio Theory'), R_.wil('18.6', 'Capital Asset Pricing Model'), R_.wil('17.5', 'The Kelly criterion'), R_.ff(16, 'Portfolio selection using mean-variance analysis'), R_.ff(17, 'Capital asset pricing model'), R_.ek(11, 'Measures of risk (VaR, coherent measures)'), R_.hull(21, 'Value at risk')],
  ex: [
    { tag: 'riscoretorno', gen: R => { const sA = R.f(0.15, 0.4, 2), sB = R.f(0.08, 0.3, 2), rho = R.f(-0.5, 0.9, 2), w = R.pick([0.3, 0.4, 0.5, 0.6, 0.7]); const a = Math.sqrt(w * w * sA * sA + (1 - w) * (1 - w) * sB * sB + 2 * w * (1 - w) * rho * sA * sB) * 100; return { q: `Carteira com ${Q.fmt(w * 100, 0)}% em A (vol ${Q.fmt(sA * 100, 0)}%) e ${Q.fmt((1 - w) * 100, 0)}% em B (vol ${Q.fmt(sB * 100, 0)}%), correlação ${Q.fmt(rho, 2)}. Qual a vol da carteira (%)?`, a, tol: 0.003, dec: 2, unit: '%', e: `σp = √(w²σA² + (1−w)²σB² + 2w(1−w)ρσAσB) = ${Q.fmt(a, 2)}%.` }; } },
    { tag: 'riscoretorno', gen: R => { const sA = R.f(0.15, 0.4, 2), sB = R.f(0.08, 0.3, 2), rho = R.f(-0.5, 0.6, 2); const a = (sB * sB - rho * sA * sB) / (sA * sA + sB * sB - 2 * rho * sA * sB) * 100; return { q: `Vol de A = ${Q.fmt(sA * 100, 0)}%, vol de B = ${Q.fmt(sB * 100, 0)}%, ρ = ${Q.fmt(rho, 2)}. Qual o peso de A (%) na carteira de mínima variância?`, a, tol: 0.005, tolAbs: 0.05, dec: 2, unit: '%', e: `(σB² − ρσAσB)/(σA² + σB² − 2ρσAσB) = ${Q.fmt(a, 2)}%.` }; } },
    { tag: 'riscoretorno', gen: R => { const mu = R.f(6, 25, 1) / 100, r = R.f(2, 12, 1) / 100, s = R.f(8, 40, 0) / 100; const a = (mu - r) / s; return { q: `Uma estratégia tem retorno esperado de ${Q.fmt(mu * 100, 1)}% a.a. e vol de ${Q.fmt(s * 100, 0)}%; a taxa livre de risco é ${Q.fmt(r * 100, 1)}%. Qual o índice de Sharpe?`, a, tol: 0.005, tolAbs: 0.001, dec: 3, e: `(μ − r)/σ = (${Q.fmt(mu, 3)} − ${Q.fmt(r, 3)})/${Q.fmt(s, 2)} = ${Q.fmt(a, 3)}.` }; } },
    { tag: 'riscoretorno', gen: R => { const ex = R.f(2, 10, 1) / 100, s = R.f(10, 40, 0) / 100; const a = ex / (s * s); return { q: `Excesso de retorno esperado de ${Q.fmt(ex * 100, 1)}% a.a. e vol de ${Q.fmt(s * 100, 0)}%. Qual a fração de Kelly f* (em vezes o capital)?`, a, tol: 0.005, tolAbs: 0.001, dec: 3, unit: '×', e: `f* = (μ − r)/σ² = ${Q.fmt(ex, 3)}/${Q.fmt(s * s, 4)} = ${Q.fmt(a, 3)}. Meio Kelly = ${Q.fmt(a / 2, 3)}.` }; } },
    { t: 'mcq', q: 'Por que profissionais usam meio Kelly (ou menos) em vez de Kelly cheio?', o: ['Porque Kelly cheio minimiza o retorno', 'Porque o retorno esperado é estimado com muito erro e Kelly cheio gera drawdowns enormes; superestimar o edge é muito pior que subestimar', 'Por regra da B3', 'Porque Kelly só vale para blackjack'], a: 1, e: 'Crescimento cai pouco com meio Kelly, e o risco de ruína/drawdown cai muito.' },
    { t: 'mcq', q: 'Dois ativos com correlação −1 permitem:', o: ['Nada de especial', 'Montar uma carteira de vol zero com os pesos certos', 'Só aumentar a vol', 'Ignorar o retorno esperado'], a: 1, e: 'Com ρ = −1, w = σB/(σA + σB) anula a variância.' },
    { t: 'tf', q: 'Para um livro vendido em opções OTM, a variância histórica do PnL é uma medida suficiente de risco.', a: false, e: 'Vol baixa quase sempre, perdas enormes nas caudas: use stress e Expected Shortfall.' }
  ],
  cards: [['Vol de 2 ativos', 'σp² = w²σA² + (1−w)²σB² + 2w(1−w)ρσAσB'], ['Mínima variância', 'wA = (σB² − ρσAσB)/(σA² + σB² − 2ρσAσB)'], ['Sharpe', '(μ − r)/σ; a carteira tangente maximiza.'], ['Kelly', 'f* = (μ − r)/σ²; use meio Kelly.'], ['Risk parity', 'Cada estratégia contribui com o mesmo risco.']]
}, 'us6-5');
})();
