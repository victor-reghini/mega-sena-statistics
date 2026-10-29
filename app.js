(function () {
  "use strict";

  // Quantidade de apostas simples equivalentes C(k, 6) e custo oficial nas lotéricas
  const BET_TABLE = {
    6: { combos: 1, cost: 6.0 },
    7: { combos: 7, cost: 42.0 },
    8: { combos: 28, cost: 168.0 },
    9: { combos: 84, cost: 504.0 },
    10: { combos: 210, cost: 1260.0 }
  };

  const state = {
    draws: [],
    loading: true,
    error: null,
    betSize: 6,
    selectedNumbers: new Set([1, 10, 13, 20, 37, 38]),
    costMode: "single", // "single" (1 concurso) ou "all" (todos os concursos)
    freqSort: "num", // "num" | "most" | "least" | "delay"
    extrapHorizon: 500,
    extrapMode: "empirical", // "empirical" | "montecarlo" | "reversion"
    topProjectedSix: [10, 53, 5, 37, 34, 33],
    filterSearch: "",
    filterNumber: "",
    filterStatus: "all",
    sortOrder: "desc",
    page: 1,
    pageSize: 20
  };

  const brlFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const intFmt = new Intl.NumberFormat("pt-BR");

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function comb(n, r) {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return Math.round(res);
  }

  // Calcula quantos prêmios de Sena (6), Quina (5) e Quadra (4) uma aposta de k dezenas recebe ao acertar h dezenas
  function calcMultiplePrizes(k, h, drawPrizes) {
    if (h < 4) {
      return { senaCount: 0, quinaCount: 0, quadraCount: 0, totalValue: 0 };
    }
    const missed = k - h;
    const senaCount = comb(h, 6) * comb(missed, 0);
    const quinaCount = comb(h, 5) * comb(missed, 1);
    const quadraCount = comb(h, 4) * comb(missed, 2);

    const v6 = (drawPrizes && drawPrizes["6"] && drawPrizes["6"].v) || 0;
    const v5 = (drawPrizes && drawPrizes["5"] && drawPrizes["5"].v) || 0;
    const v4 = (drawPrizes && drawPrizes["4"] && drawPrizes["4"].v) || 0;

    const totalValue = senaCount * v6 + quinaCount * v5 + quadraCount * v4;
    return { senaCount, quinaCount, quadraCount, totalValue };
  }

  function initTheme() {
    const saved = localStorage.getItem("megasena_theme");
    const theme = saved === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeBtn(theme);
  }

  function updateThemeBtn(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.textContent = theme === "dark" ? "Tema: Escuro (mudar para Claro)" : "Tema: Claro (mudar para Escuro)";
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  function buildVolanteButtons() {
    const container = document.getElementById("volante-grid");
    container.innerHTML = "";
    for (let n = 1; n <= 60; n++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dezena-btn";
      btn.dataset.num = String(n);
      btn.textContent = pad2(n);
      const isSelected = state.selectedNumbers.has(n);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
      btn.setAttribute("aria-label", "Dezena " + pad2(n));
      btn.addEventListener("click", () => toggleDezena(n));
      container.appendChild(btn);
    }
  }

  function syncVolanteUI() {
    const buttons = document.querySelectorAll("#volante-grid .dezena-btn");
    buttons.forEach((btn) => {
      const n = Number(btn.dataset.num);
      btn.setAttribute("aria-pressed", state.selectedNumbers.has(n) ? "true" : "false");
    });

    const sizePills = document.querySelectorAll(".size-pill");
    sizePills.forEach((pill) => {
      const sz = Number(pill.dataset.size);
      pill.setAttribute("aria-pressed", sz === state.betSize ? "true" : "false");
    });

    const info = BET_TABLE[state.betSize];
    const picked = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    const summaryEl = document.getElementById("ticket-summary");
    summaryEl.innerHTML = `
      <span><strong>Selecionadas (${picked.length}/${state.betSize}):</strong> ${picked.length ? picked.map(pad2).join(", ") : "nenhuma"}</span>
      <span><strong>Equivalência:</strong> ${info.combos} ${info.combos === 1 ? "aposta simples" : "apostas simples"} | <strong>Valor da aposta (${state.betSize} dezenas):</strong> ${brlFmt.format(info.cost)}</span>
    `;
  }

  function toggleDezena(n) {
    const msgEl = document.getElementById("simulator-alert");
    msgEl.hidden = true;
    if (state.selectedNumbers.has(n)) {
      state.selectedNumbers.delete(n);
    } else {
      if (state.selectedNumbers.size >= state.betSize) {
        msgEl.textContent = `Você já selecionou o limite de ${state.betSize} dezenas. Desmarque uma dezena ou aumente o tamanho da aposta (até 10 dezenas).`;
        msgEl.className = "status-banner error";
        msgEl.hidden = false;
        return;
      }
      state.selectedNumbers.add(n);
    }
    syncVolanteUI();
    renderSimulation();
    renderDrawsTable();
  }

  function setBetSize(size) {
    state.betSize = size;
    if (state.selectedNumbers.size > size) {
      const trimmed = Array.from(state.selectedNumbers)
        .sort((a, b) => a - b)
        .slice(0, size);
      state.selectedNumbers = new Set(trimmed);
    }
    document.getElementById("simulator-alert").hidden = true;
    syncVolanteUI();
    renderSimulation();
    renderDrawsTable();
  }

  function fillRandomBet() {
    const pool = [];
    for (let i = 1; i <= 60; i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    state.selectedNumbers = new Set(pool.slice(0, state.betSize));
    document.getElementById("simulator-alert").hidden = true;
    syncVolanteUI();
    renderSimulation();
    renderDrawsTable();
  }

  function renderSimulation() {
    const panel = document.getElementById("simulation-output");
    if (state.loading) {
      panel.innerHTML = `<div class="status-banner" role="status">Carregando base histórica de sorteios para validar sua aposta...</div>`;
      return;
    }
    if (state.error) {
      panel.innerHTML = `<div class="status-banner error" role="alert">Erro ao carregar sorteios: ${state.error}. Use o botão "Recarregar base local" acima.</div>`;
      return;
    }

    const pickedCount = state.selectedNumbers.size;
    if (pickedCount < state.betSize) {
      const faltam = state.betSize - pickedCount;
      panel.innerHTML = `
        <div class="status-banner" role="status">
          <strong>Estado vazio (aguardando preenchimento):</strong> selecione mais <strong>${faltam}</strong> ${faltam === 1 ? "dezena" : "dezenas"} no volante ao lado (ou clique em "Surpresinha") para validar sua aposta de ${state.betSize} dezenas contra todos os ${intFmt.format(state.draws.length)} concursos.
        </div>
      `;
      return;
    }

    const k = state.betSize;
    const betCostSingle = BET_TABLE[k].cost;
    const totalDraws = state.draws.length;
    const betCostAll = betCostSingle * totalDraws;

    let maxHits = 0;
    const hitsByCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const allEvaluated = [];
    const winningDraws = [];

    let totalGrossWon = 0;
    let totalSenas = 0;
    let totalQuinas = 0;
    let totalQuadras = 0;

    for (let i = 0; i < totalDraws; i++) {
      const d = state.draws[i];
      const matched = d.n.filter((num) => state.selectedNumbers.has(num));
      const h = matched.length;
      hitsByCount[h] = (hitsByCount[h] || 0) + 1;
      if (h > maxHits) maxHits = h;

      const prizeCalc = calcMultiplePrizes(k, h, d.p);
      if (h >= 4) {
        totalGrossWon += prizeCalc.totalValue;
        totalSenas += prizeCalc.senaCount;
        totalQuinas += prizeCalc.quinaCount;
        totalQuadras += prizeCalc.quadraCount;
        winningDraws.push({
          draw: d,
          hits: h,
          matched,
          prizeCalc
        });
      }
      if (h >= 3) {
        allEvaluated.push({
          draw: d,
          hits: h,
          matched,
          prizeCalc
        });
      }
    }

    const bestDraws = allEvaluated
      .filter((item) => item.hits === maxHits)
      .sort((a, b) => b.prizeCalc.totalValue - a.prizeCalc.totalValue || b.draw.c - a.draw.c);

    const activeCost = state.costMode === "all" ? betCostAll : betCostSingle;
    const netBalance = totalGrossWon - activeCost;
    const isNegativeOrZero = winningDraws.length === 0 || netBalance < 0;

    let topHeadlineHTML = "";
    if (maxHits >= 4 && bestDraws.length > 0) {
      const top = bestDraws[0];
      const breakdownParts = [];
      if (top.prizeCalc.senaCount > 0) breakdownParts.push(`${top.prizeCalc.senaCount}x Sena`);
      if (top.prizeCalc.quinaCount > 0) breakdownParts.push(`${top.prizeCalc.quinaCount}x Quina`);
      if (top.prizeCalc.quadraCount > 0) breakdownParts.push(`${top.prizeCalc.quadraCount}x Quadra`);

      topHeadlineHTML = `
        <div class="highlight-box ${netBalance >= 0 ? "positive" : "negative"}" role="region" aria-label="Destaque de maior acerto">
          <strong>Maior acerto encontrado (${maxHits} dezenas):</strong> No <strong>concurso ${top.draw.c}</strong> (${top.draw.d}) você teria acertado <strong>${top.hits} dezenas</strong> (${top.matched.map(pad2).join(", ")}), ganhando <strong>${brlFmt.format(top.prizeCalc.totalValue)}</strong> (${breakdownParts.join(" + ")}).
          ${bestDraws.length > 1 ? `<div style="margin-top:6px;font-size:0.875rem;">Você atingiu ${maxHits} acertos em <strong>${bestDraws.length} concursos</strong> no total. Veja todos listados abaixo.</div>` : ""}
        </div>
      `;
    } else {
      const sampleBest = bestDraws.slice(0, 5).map((x) => `#${x.draw.c} (${x.draw.d})`).join(", ");
      topHeadlineHTML = `
        <div class="highlight-box negative" role="region" aria-label="Sem premiação nos sorteios passados">
          <strong>Nenhum concurso premiado encontrado:</strong> Seu maior acerto histórico foi de <strong>${maxHits} ${maxHits === 1 ? "dezena" : "dezenas"}</strong>${sampleBest ? ` (ex.: concursos ${sampleBest})` : ""}. Como a Mega-Sena premia a partir de 4 acertos (Quadra), você teria recebido <strong>R$ 0,00</strong> e ficado com saldo negativo de <strong>${brlFmt.format(netBalance)}</strong>.
        </div>
      `;
    }

    let costComparisonAlert = "";
    if (winningDraws.length > 0 && netBalance < 0) {
      costComparisonAlert = `
        <div class="status-banner error">
          <strong>Atenção ao Saldo Negativo:</strong> Embora você tenha acertado prêmios em ${winningDraws.length} ${winningDraws.length === 1 ? "concurso" : "concursos"} (recebendo ${brlFmt.format(totalGrossWon)}), o valor da aposta considerado (${brlFmt.format(activeCost)}) foi <strong>maior que o valor recebido</strong>, gerando prejuízo líquido de <strong>${brlFmt.format(netBalance)}</strong>.
        </div>
      `;
    }

    const sortedStatement = winningDraws
      .slice()
      .sort((a, b) => b.hits - a.hits || b.prizeCalc.totalValue - a.prizeCalc.totalValue || b.draw.c - a.draw.c);

    const statementRowsHTML = sortedStatement.length
      ? sortedStatement
          .map((item) => {
            const singleDiff = item.prizeCalc.totalValue - betCostSingle;
            const detailLabels = [];
            if (item.prizeCalc.senaCount) detailLabels.push(`${item.prizeCalc.senaCount} Sena`);
            if (item.prizeCalc.quinaCount) detailLabels.push(`${item.prizeCalc.quinaCount} Quina`);
            if (item.prizeCalc.quadraCount) detailLabels.push(`${item.prizeCalc.quadraCount} Quadra`);
            return `
              <div class="extrato-row-card">
                <div class="extrato-row-top">
                  <span><strong>Concurso #${item.draw.c}</strong> (${item.draw.d})</span>
                  <span class="badge-status">${item.hits} acertos: ${detailLabels.join(" + ")}</span>
                </div>
                <div class="extrato-row-mid">
                  Acertou: <strong>${item.matched.map(pad2).join(", ")}</strong> | Sorteio: ${item.draw.n.map(pad2).join(", ")}
                </div>
                <div class="extrato-row-bottom">
                  <span>Prêmio: <strong>${brlFmt.format(item.prizeCalc.totalValue)}</strong></span>
                  <span class="extrato-value ${singleDiff >= 0 ? "gain" : "loss"}" style="font-size:0.8125rem;">
                    Saldo vs. Aposta: ${singleDiff >= 0 ? "+" : ""}${brlFmt.format(singleDiff)}
                  </span>
                </div>
              </div>
            `;
          })
          .join("")
      : `
        <div class="extrato-row-card">
          Nenhum concurso com 4, 5 ou 6 acertos para esta combinação. Saldo final da aposta: <strong>${brlFmt.format(netBalance)}</strong>.
        </div>
      `;

    panel.innerHTML = `
      ${topHeadlineHTML}
      ${costComparisonAlert}

      <div>
        <h3 style="margin:0 0 8px 0;font-size:0.9375rem;">Extrato Financeiro e Saldo Final (${k} dezenas)</h3>
        <div class="extrato-grid">
          <div class="extrato-card">
            <div class="extrato-label">Custo da Aposta (${state.costMode === "all" ? `Todos os ${intFmt.format(totalDraws)} concursos` : "1 Concurso Avulso"})</div>
            <div class="extrato-value loss">- ${brlFmt.format(activeCost)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">
              Unitário (${k} dez.): ${brlFmt.format(betCostSingle)} | Em ${intFmt.format(totalDraws)} sorteios: ${brlFmt.format(betCostAll)}
            </div>
          </div>
          <div class="extrato-card">
            <div class="extrato-label">Total Bruto Recebido em Prêmios</div>
            <div class="extrato-value ${totalGrossWon > 0 ? "gain" : ""}">+ ${brlFmt.format(totalGrossWon)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">
              ${totalSenas} Sena(s), ${totalQuinas} Quina(s) e ${totalQuadras} Quadra(s) acumuladas
            </div>
          </div>
          <div class="extrato-card">
            <div class="extrato-label">Saldo Final (Recebido - Aposta Selecionada)</div>
            <div class="extrato-value ${netBalance >= 0 ? "gain" : "loss"}">
              ${netBalance >= 0 ? "+" : ""}${brlFmt.format(netBalance)}
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">
              Resultado: ${netBalance >= 0 ? "Lucro líquido" : "Prejuízo (aposta superou retorno)"}
            </div>
          </div>
          <div class="extrato-card">
            <div class="extrato-label">Resumo de Acertos nos ${intFmt.format(totalDraws)} Sorteios</div>
            <div style="font-family:var(--font-mono);font-size:0.75rem;line-height:1.45;">
              6 acertos: <strong>${hitsByCount[6]}</strong> | 5 acertos: <strong>${hitsByCount[5]}</strong> | 4 acertos: <strong>${hitsByCount[4]}</strong><br>
              3 acertos: <strong>${hitsByCount[3]}</strong> | 2 acertos: <strong>${hitsByCount[2]}</strong> | 0-1 acerto: <strong>${hitsByCount[1] + hitsByCount[0]}</strong>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style="margin:0 0 8px 0;font-size:0.9375rem;">Detalhamento do Extrato por Concurso Premiado (${winningDraws.length})</h3>
        <div class="extrato-list" role="region" aria-label="Lista de concursos premiados na simulação">
          ${statementRowsHTML}
        </div>
      </div>
    `;
  }

  function computeStatistics() {
    const totalDraws = state.draws.length;
    const freq = Array(61).fill(0);
    const lastSeenIndex = Array(61).fill(-1);
    const parityDist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const rowCounts = [0, 0, 0, 0, 0, 0]; // 01-10 .. 51-60
    let accumulatedCount = 0;
    let totalSumAllDraws = 0;

    for (let idx = 0; idx < totalDraws; idx++) {
      const d = state.draws[idx];
      if (d.a) accumulatedCount++;
      let evens = 0;
      let sum = 0;
      for (let j = 0; j < d.n.length; j++) {
        const num = d.n[j];
        freq[num]++;
        lastSeenIndex[num] = idx;
        if (num % 2 === 0) evens++;
        sum += num;
        const rowIdx = Math.min(5, Math.floor((num - 1) / 10));
        rowCounts[rowIdx]++;
      }
      parityDist[evens] = (parityDist[evens] || 0) + 1;
      totalSumAllDraws += sum;
    }

    const items = [];
    for (let n = 1; n <= 60; n++) {
      const delay = lastSeenIndex[n] === -1 ? totalDraws : totalDraws - 1 - lastSeenIndex[n];
      items.push({ num: n, count: freq[n], delay });
    }

    const byMost = items.slice().sort((a, b) => b.count - a.count || a.num - b.num);
    const byLeast = items.slice().sort((a, b) => a.count - b.count || a.num - b.num);
    const byDelay = items.slice().sort((a, b) => b.delay - a.delay || a.num - b.num);

    return {
      totalDraws,
      items,
      byMost,
      byLeast,
      byDelay,
      parityDist,
      rowCounts,
      accumulatedCount,
      avgSum: totalDraws ? Math.round(totalSumAllDraws / totalDraws) : 0
    };
  }

  function renderMetricsAndCharts() {
    const stats = computeStatistics();
    if (!stats.totalDraws) return;

    const latest = state.draws[state.draws.length - 1];
    const most = stats.byMost[0];
    const least = stats.byLeast[0];
    const mostDelayed = stats.byDelay[0];

    const kpiStrip = document.getElementById("kpi-strip");
    kpiStrip.innerHTML = `
      <div class="kpi-item">
        <p class="kpi-title">Total de Concursos Oficializados</p>
        <p class="kpi-num">${intFmt.format(stats.totalDraws)} sorteios</p>
        <p class="kpi-sub">Último: #${latest.c} em ${latest.d} (${Math.round((stats.accumulatedCount / stats.totalDraws) * 100)}% acumularam)</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Dezena Mais Sorteada</p>
        <p class="kpi-num">Dezena ${pad2(most.num)} (${most.count}x)</p>
        <p class="kpi-sub">Presente em ${((most.count / stats.totalDraws) * 100).toFixed(1)}% de todos os concursos</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Dezena Menos Sorteada</p>
        <p class="kpi-num">Dezena ${pad2(least.num)} (${least.count}x)</p>
        <p class="kpi-sub">Diferença de ${most.count - least.count} sorteios para a líder</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Maior Atraso Atual</p>
        <p class="kpi-num">Dezena ${pad2(mostDelayed.num)} (${mostDelayed.delay} jogos)</p>
        <p class="kpi-sub">Soma média por sorteio: ${stats.avgSum} pontos</p>
      </div>
    `;

    renderFrequencyMatrix(stats);
    renderDelayChart(stats);
    renderParityChart(stats);
    renderRowDistributionChart(stats);
    renderExtrapolation(stats);
  }

  function renderFrequencyMatrix(stats) {
    const container = document.getElementById("freq-matrix");
    let list = stats.items.slice();
    if (state.freqSort === "most") list = stats.byMost.slice();
    else if (state.freqSort === "least") list = stats.byLeast.slice();
    else if (state.freqSort === "delay") list = stats.byDelay.slice();

    const top10Nums = new Set(stats.byMost.slice(0, 10).map((x) => x.num));
    container.innerHTML = list
      .map(
        (item) => `
        <div class="freq-cell ${top10Nums.has(item.num) ? "hot" : ""}" title="Dezena ${pad2(item.num)}: ${item.count} sorteios, atraso de ${item.delay} concursos">
          <span class="freq-num">${pad2(item.num)}</span>
          <span class="freq-count">${item.count}x</span>
          <span class="freq-count">atraso: ${item.delay}</span>
        </div>
      `
      )
      .join("");
  }

  function renderDelayChart(stats) {
    const topDelayed = stats.byDelay.slice(0, 10);
    const maxDelay = topDelayed[0] ? topDelayed[0].delay : 1;
    const el = document.getElementById("delay-chart");
    el.innerHTML = topDelayed
      .map((item) => {
        const pct = Math.max(4, Math.round((item.delay / maxDelay) * 100));
        return `
          <div class="bar-row">
            <span>Dezena <strong>${pad2(item.num)}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span>${item.delay} jogos</span>
          </div>
        `;
      })
      .join("");
  }

  function renderParityChart(stats) {
    const el = document.getElementById("parity-chart");
    const rows = [
      { label: "3P / 3I", evens: 3 },
      { label: "4P / 2I", evens: 4 },
      { label: "2P / 4I", evens: 2 },
      { label: "5P / 1I", evens: 5 },
      { label: "1P / 5I", evens: 1 },
      { label: "6P / 0I", evens: 6 },
      { label: "0P / 6I", evens: 0 }
    ];
    const maxVal = Math.max(...rows.map((r) => stats.parityDist[r.evens] || 0), 1);
    el.innerHTML = rows
      .map((r) => {
        const count = stats.parityDist[r.evens] || 0;
        const pctWidth = Math.max(2, Math.round((count / maxVal) * 100));
        const pctTotal = ((count / stats.totalDraws) * 100).toFixed(1);
        return `
          <div class="bar-row">
            <span><strong>${r.label}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pctWidth}%"></div>
            </div>
            <span>${pctTotal}% (${count})</span>
          </div>
        `;
      })
      .join("");
  }

  function renderRowDistributionChart(stats) {
    const el = document.getElementById("row-chart");
    const totalBalls = stats.totalDraws * 6;
    const maxRow = Math.max(...stats.rowCounts, 1);
    const labels = ["01 a 10", "11 a 20", "21 a 30", "31 a 40", "41 a 50", "51 a 60"];
    el.innerHTML = labels
      .map((label, idx) => {
        const count = stats.rowCounts[idx];
        const pctWidth = Math.max(4, Math.round((count / maxRow) * 100));
        const share = ((count / totalBalls) * 100).toFixed(1);
        return `
          <div class="bar-row">
            <span><strong>${label}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pctWidth}%"></div>
            </div>
            <span>${share}% (${intFmt.format(count)})</span>
          </div>
        `;
      })
      .join("");
  }

  function simulateMonteCarloDraws(stats, horizon) {
    const counts = Array(61).fill(0);
    const parityProjected = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const rowProjected = [0, 0, 0, 0, 0, 0];

    const weights = Array(61).fill(1);
    for (let i = 0; i < stats.items.length; i++) {
      const it = stats.items[i];
      weights[it.num] = Math.max(1, it.count);
    }

    // Amostragem ponderada sem reposição (Efraimidis-Spirakis)
    for (let g = 0; g < horizon; g++) {
      const scored = [];
      for (let n = 1; n <= 60; n++) {
        const u = Math.max(1e-9, Math.random());
        scored.push({ n, key: Math.pow(u, 1 / weights[n]) });
      }
      scored.sort((a, b) => b.key - a.key);
      let evens = 0;
      for (let k = 0; k < 6; k++) {
        const picked = scored[k].n;
        counts[picked]++;
        if (picked % 2 === 0) evens++;
        rowProjected[Math.min(5, Math.floor((picked - 1) / 10))]++;
      }
      parityProjected[evens]++;
    }

    return { counts, parityProjected, rowProjected };
  }

  function renderExtrapolation(stats) {
    if (!stats || !stats.totalDraws) return;
    const H = state.extrapHorizon;
    const mode = state.extrapMode;
    const N = stats.totalDraws;
    const uniformExpected = H * 0.1;

    document.querySelectorAll(".horizon-pill").forEach((pill) => {
      pill.setAttribute("aria-pressed", Number(pill.dataset.horizon) === H ? "true" : "false");
    });

    const mcRun = mode === "montecarlo" ? simulateMonteCarloDraws(stats, H) : null;

    const rawProjections = stats.items.map((item) => {
      const pEmpirical = item.count / N;
      const avgCycle = pEmpirical > 0 ? 1 / pEmpirical : 10;
      const cyclePressure = item.delay / avgCycle;
      const probAtLeastOneInH = 1 - Math.pow(1 - pEmpirical, H);
      const probAtLeastOneIn10 = 1 - Math.pow(1 - pEmpirical, 10);
      const probAtLeastOneIn50 = 1 - Math.pow(1 - pEmpirical, 50);

      let addCount = pEmpirical * H;
      if (mode === "montecarlo" && mcRun) {
        addCount = mcRun.counts[item.num];
      } else if (mode === "reversion") {
        const historicalDeficit = N * 0.1 - item.count;
        const reversionPull = historicalDeficit * Math.min(1, H / (N * 0.8));
        const delayBoost = Math.min(3.0, cyclePressure * 0.65);
        addCount = Math.max(0.2, uniformExpected + reversionPull * 0.55 + delayBoost);
      }

      return {
        num: item.num,
        histCount: item.count,
        delay: item.delay,
        pEmpirical,
        avgCycle,
        cyclePressure,
        probAtLeastOneInH,
        probAtLeastOneIn10,
        probAtLeastOneIn50,
        addCount,
        futureTotal: item.count + addCount
      };
    });

    // Normaliza no modo reversion para somar 6*H bolas no horizonte
    if (mode === "reversion") {
      const sumAdd = rawProjections.reduce((acc, x) => acc + x.addCount, 0) || 1;
      const targetSum = H * 6;
      rawProjections.forEach((x) => {
        x.addCount = (x.addCount / sumAdd) * targetSum;
        x.futureTotal = x.histCount + x.addCount;
      });
    }

    const sortedByAdd = rawProjections.slice().sort((a, b) => b.addCount - a.addCount || b.histCount - a.histCount);
    const top6 = sortedByAdd.slice(0, 6).map((x) => x.num).sort((a, b) => a - b);
    state.topProjectedSix = top6;

    const latestConcurso = state.draws[state.draws.length - 1].c;
    const targetConcurso = latestConcurso + H;
    const scaleTag = H < 100 ? "Escala de Dezenas" : H < 1000 ? "Escala de Centenas" : "Escala de Milhares";

    const leaderProj = sortedByAdd[0];
    const tailProj = sortedByAdd[sortedByAdd.length - 1];
    const spreadFuture = Math.round(leaderProj.futureTotal - tailProj.futureTotal);
    const uniformProbH = (1 - Math.pow(0.9, H)) * 100;

    document.getElementById("extrap-kpi-strip").innerHTML = `
      <div class="kpi-item">
        <p class="kpi-title">Janela Futura Projetada (${scaleTag})</p>
        <p class="kpi-num">+${intFmt.format(H)} concursos</p>
        <p class="kpi-sub">Do #${latestConcurso + 1} até #${intFmt.format(targetConcurso)} (+${intFmt.format(H * 6)} bolas)</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Sexteto de Maior Projeção (+${intFmt.format(H)} jogos)</p>
        <p class="kpi-num">${top6.map(pad2).join(", ")}</p>
        <p class="kpi-sub">Média uniforme esperada: ${uniformExpected.toFixed(1)} saídas/dezena</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Líder Projetada no Horizonte</p>
        <p class="kpi-num">Dezena ${pad2(leaderProj.num)} (+${leaderProj.addCount.toFixed(1)}x)</p>
        <p class="kpi-sub">Total estimado no #${intFmt.format(targetConcurso)}: ${Math.round(leaderProj.futureTotal)} sorteios (amplitude: ${spreadFuture})</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Chance de Sair ao Menos 1x em +${intFmt.format(H)} Jogos</p>
        <p class="kpi-num">${uniformProbH >= 99.95 ? "> 99,9%" : uniformProbH.toFixed(1).replace(".", ",") + "%"}</p>
        <p class="kpi-sub">Em +10 jogos: 65,1% | Em +50 jogos: 99,5%</p>
      </div>
    `;

    renderMultiScaleSVG(stats, mode);

    // Gráfico 2: Top 12 dezenas projetadas no horizonte +H
    document.getElementById("title-extrap-top").textContent =
      `Quais dezenas terão mais sorteios adicionais nos próximos +${intFmt.format(H)} concursos?`;
    const top12 = sortedByAdd.slice(0, 12);
    const maxAdd = Math.max(...top12.map((x) => x.addCount), 1);
    document.getElementById("extrap-top-chart").innerHTML = top12
      .map((item) => {
        const pct = Math.max(6, Math.round((item.addCount / maxAdd) * 100));
        const diff = item.addCount - uniformExpected;
        const sign = diff >= 0 ? "+" : "";
        return `
          <div class="bar-row">
            <span>Dez. <strong>${pad2(item.num)}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span>+${item.addCount.toFixed(1)} (${sign}${diff.toFixed(1)})</span>
          </div>
        `;
      })
      .join("");

    // Gráfico 3: Pressão de ciclo e probabilidade acumulada das dezenas atrasadas
    document.getElementById("title-extrap-prob").textContent =
      `Como as 10 dezenas mais atrasadas se comportam nos próximos +10, +50 e +${intFmt.format(H)} jogos?`;
    const topDelayedProj = rawProjections
      .slice()
      .sort((a, b) => b.cyclePressure - a.cyclePressure)
      .slice(0, 10);
    const maxPressure = Math.max(...topDelayedProj.map((x) => x.cyclePressure), 1);
    document.getElementById("extrap-cycle-chart").innerHTML = topDelayedProj
      .map((item) => {
        const pct = Math.max(8, Math.round((item.cyclePressure / maxPressure) * 100));
        const p10 = (item.probAtLeastOneIn10 * 100).toFixed(0);
        return `
          <div class="bar-row">
            <span>Dez. <strong>${pad2(item.num)}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span>${item.cyclePressure.toFixed(1)}x ciclo (${p10}%/10j | +${item.addCount.toFixed(0)})</span>
          </div>
        `;
      })
      .join("");

    // Gráfico 4: Extrapolação de Paridade para +H jogos
    document.getElementById("title-extrap-parity").textContent =
      `Quantos dos próximos +${intFmt.format(H)} concursos terão cada proporção de Pares e Ímpares?`;
    const parityRows = [
      { label: "3P / 3I", evens: 3 },
      { label: "4P / 2I", evens: 4 },
      { label: "2P / 4I", evens: 2 },
      { label: "5P / 1I", evens: 5 },
      { label: "1P / 5I", evens: 1 },
      { label: "6P / 0I", evens: 6 },
      { label: "0P / 6I", evens: 0 }
    ];
    const parityCountsH = parityRows.map((r) => {
      const val =
        mode === "montecarlo" && mcRun
          ? mcRun.parityProjected[r.evens] || 0
          : ((stats.parityDist[r.evens] || 0) / N) * H;
      return { label: r.label, val };
    });
    const maxParityH = Math.max(...parityCountsH.map((x) => x.val), 1);
    document.getElementById("extrap-parity-chart").innerHTML = parityCountsH
      .map((r) => {
        const pct = Math.max(3, Math.round((r.val / maxParityH) * 100));
        return `
          <div class="bar-row">
            <span><strong>${r.label}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span>+${r.val.toFixed(1)} jogos</span>
          </div>
        `;
      })
      .join("");

    // Gráfico 5: Extrapolação por Linhas do Volante em +H jogos
    document.getElementById("title-extrap-rows").textContent =
      `Quantas dezenas sairão em cada linha do volante nos próximos +${intFmt.format(H)} jogos?`;
    const rowLabels = ["01 a 10", "11 a 20", "21 a 30", "31 a 40", "41 a 50", "51 a 60"];
    const totalHistBalls = N * 6;
    const rowVals = rowLabels.map((label, idx) => {
      const val =
        mode === "montecarlo" && mcRun
          ? mcRun.rowProjected[idx]
          : (stats.rowCounts[idx] / totalHistBalls) * (H * 6);
      return { label, val };
    });
    const maxRowVal = Math.max(...rowVals.map((x) => x.val), 1);
    document.getElementById("extrap-rows-chart").innerHTML = rowVals
      .map((r) => {
        const pct = Math.max(6, Math.round((r.val / maxRowVal) * 100));
        return `
          <div class="bar-row">
            <span><strong>${r.label}</strong></span>
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span>+${Math.round(r.val)} bolas</span>
          </div>
        `;
      })
      .join("");
  }

  function renderMultiScaleSVG(stats, mode) {
    const container = document.getElementById("extrap-svg-container");
    const N = stats.totalDraws;
    const horizons = [0, 50, 500, 1000, 5000];
    const xLabels = ["Atual (3.076)", "+50 (Dez.)", "+500 (Cent.)", "+1.000 (Mil.)", "+5.000 (Mil.)"];

    const leader = stats.byMost[0];
    const second = stats.byMost[1];
    const coldest = stats.byLeast[0];

    function projectAt(item, h) {
      const p = item.count / N;
      if (mode === "reversion") {
        const deficit = N * 0.1 - item.count;
        return Math.round(item.count + 0.1 * h + deficit * Math.min(1, h / (N * 0.8)) * 0.55);
      }
      return Math.round(item.count + p * h);
    }

    const seriesLeader = horizons.map((h) => projectAt(leader, h));
    const seriesSecond = horizons.map((h) => projectAt(second, h));
    const seriesUniform = horizons.map((h) => Math.round((N + h) * 0.1));
    const seriesColdest = horizons.map((h) => projectAt(coldest, h));

    const allVals = [...seriesLeader, ...seriesSecond, ...seriesUniform, ...seriesColdest];
    const minY = Math.min(...allVals) - 20;
    const maxY = Math.max(...allVals) + 30;

    const width = 760;
    const height = 250;
    const padL = 56;
    const padR = 32;
    const padT = 24;
    const padB = 42;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    function xPos(idx) {
      return Math.round(padL + (idx / (horizons.length - 1)) * plotW);
    }

    function yPos(val) {
      const ratio = (val - minY) / Math.max(1, maxY - minY);
      return Math.round(padT + plotH - ratio * plotH);
    }

    function polyPoints(arr) {
      return arr.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");
    }

    const gridYSteps = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(minY + r * (maxY - minY)));

    const gridLinesSVG = gridYSteps
      .map((gv) => {
        const y = yPos(gv);
        return `
          <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,3" stroke-width="1" />
          <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="11" font-family="monospace">${gv}</text>
        `;
      })
      .join("");

    const xAxisLabelsSVG = xLabels
      .map((lbl, idx) => {
        const x = xPos(idx);
        return `
          <line x1="${x}" y1="${padT}" x2="${x}" y2="${height - padB}" stroke="var(--border)" stroke-width="0.75" />
          <text x="${x}" y="${height - 14}" text-anchor="middle" fill="var(--text)" font-size="11" font-weight="700" font-family="monospace">${lbl}</text>
        `;
      })
      .join("");

    const leaderDots = seriesLeader
      .map(
        (v, i) => `
        <circle cx="${xPos(i)}" cy="${yPos(v)}" r="4.5" fill="var(--accent)" />
        <text x="${xPos(i)}" y="${yPos(v) - 8}" text-anchor="middle" fill="var(--text)" font-size="10" font-weight="700" font-family="monospace">${v}</text>
      `
      )
      .join("");

    const coldestDots = seriesColdest
      .map(
        (v, i) => `
        <circle cx="${xPos(i)}" cy="${yPos(v)}" r="4" fill="var(--danger-text)" />
        <text x="${xPos(i)}" y="${yPos(v) + 14}" text-anchor="middle" fill="var(--danger-text)" font-size="10" font-weight="700" font-family="monospace">${v}</text>
      `
      )
      .join("");

    container.innerHTML = `
      <svg class="extrap-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        ${gridLinesSVG}
        ${xAxisLabelsSVG}
        <polyline fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="6,4" points="${polyPoints(seriesUniform)}" />
        <polyline fill="none" stroke="var(--border-strong)" stroke-width="2" points="${polyPoints(seriesSecond)}" />
        <polyline fill="none" stroke="var(--danger-text)" stroke-width="2.5" points="${polyPoints(seriesColdest)}" />
        <polyline fill="none" stroke="var(--accent)" stroke-width="3" points="${polyPoints(seriesLeader)}" />
        ${leaderDots}
        ${coldestDots}
      </svg>
      <div class="svg-legend">
        <span class="svg-legend-item">
          <span class="legend-swatch" style="background:var(--accent);"></span>
          <strong>Líder (Dez. ${pad2(leader.num)}):</strong> ${seriesLeader[0]} -> ${seriesLeader[1]} (+50) -> ${seriesLeader[2]} (+500) -> ${seriesLeader[3]} (+1k) -> ${seriesLeader[4]} (+5k)
        </span>
        <span class="svg-legend-item">
          <span class="legend-swatch" style="background:var(--border-strong);"></span>
          <strong>2ª Líder (Dez. ${pad2(second.num)}):</strong> ${seriesSecond[0]} -> ${seriesSecond[4]} (+5k)
        </span>
        <span class="svg-legend-item">
          <span class="legend-swatch" style="background:var(--text-muted);"></span>
          <strong>Média Teórica (10%):</strong> ${seriesUniform[0]} -> ${seriesUniform[4]} (+5k)
        </span>
        <span class="svg-legend-item">
          <span class="legend-swatch" style="background:var(--danger-text);"></span>
          <strong>Lanterna (Dez. ${pad2(coldest.num)}):</strong> ${seriesColdest[0]} -> ${seriesColdest[1]} (+50) -> ${seriesColdest[2]} (+500) -> ${seriesColdest[3]} (+1k) -> ${seriesColdest[4]} (+5k)
        </span>
      </div>
    `;
  }

  function getFilteredDraws() {
    const q = state.filterSearch.trim().toLowerCase();
    const numFilter = state.filterNumber ? Number(state.filterNumber) : null;
    const status = state.filterStatus;

    const filtered = state.draws.filter((d) => {
      if (q) {
        const matchConcurso = String(d.c).includes(q);
        const matchDate = d.d.toLowerCase().includes(q);
        if (!matchConcurso && !matchDate) return false;
      }
      if (numFilter && !d.n.includes(numFilter)) {
        return false;
      }
      if (status === "winners" && d.a) return false;
      if (status === "accumulated" && !d.a) return false;
      return true;
    });

    filtered.sort((a, b) => (state.sortOrder === "asc" ? a.c - b.c : b.c - a.c));
    return filtered;
  }

  function renderDrawsTable() {
    const tbody = document.getElementById("draws-tbody");
    const countLabel = document.getElementById("draws-count-label");
    const pageInfo = document.getElementById("page-info");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    if (state.loading) {
      tbody.innerHTML = `<tr><td colspan="6">Carregando histórico de concursos...</td></tr>`;
      return;
    }

    const filtered = getFilteredDraws();
    const total = filtered.length;
    countLabel.textContent = `Exibindo ${intFmt.format(total)} de ${intFmt.format(state.draws.length)} concursos`;

    if (total === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <strong>Nenhum concurso encontrado para este filtro.</strong> Clique em "Limpar filtros" para exibir todos os ${intFmt.format(state.draws.length)} sorteios novamente.
          </td>
        </tr>
      `;
      pageInfo.textContent = "Página 0 de 0";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const totalPages = Math.ceil(total / state.pageSize);
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const start = (state.page - 1) * state.pageSize;
    const slice = filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = slice
      .map((d) => {
        const sena = (d.p && d.p["6"]) || { g: 0, v: 0 };
        const quina = (d.p && d.p["5"]) || { g: 0, v: 0 };
        const quadra = (d.p && d.p["4"]) || { g: 0, v: 0 };

        const ballsHTML = d.n
          .map((n) => `<span class="ball ${state.selectedNumbers.has(n) ? "hit" : ""}">${pad2(n)}</span>`)
          .join("");

        const senaText =
          sena.g > 0
            ? `<strong>${sena.g} ganhador(es)</strong><br><small>${brlFmt.format(sena.v)}</small>`
            : `<span class="badge-status">Acumulou (${brlFmt.format(sena.v)})</span>`;

        return `
          <tr>
            <td data-label="Concurso"><strong>#${d.c}</strong></td>
            <td data-label="Data">${d.d}</td>
            <td data-label="Dezenas Sorteadas"><div class="balls-row">${ballsHTML}</div></td>
            <td data-label="Sena (6 acertos)">${senaText}</td>
            <td data-label="Quina e Quadra"><small>Quina (${quina.g}): ${brlFmt.format(quina.v)}<br>Quadra (${quadra.g}): ${brlFmt.format(quadra.v)}</small></td>
            <td data-label="Ação">
              <button type="button" class="btn open-detail-btn" data-concurso="${d.c}">
                Ver rateio / Simular
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    pageInfo.textContent = `Página ${state.page} de ${intFmt.format(totalPages)}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;

    tbody.querySelectorAll(".open-detail-btn").forEach((btn) => {
      btn.addEventListener("click", () => openContestModal(Number(btn.dataset.concurso)));
    });
  }

  let lastFocusedTrigger = null;

  function openContestModal(concursoNum) {
    const d = state.draws.find((x) => x.c === concursoNum);
    if (!d) return;
    lastFocusedTrigger = document.activeElement;

    const sena = (d.p && d.p["6"]) || { g: 0, v: 0 };
    const quina = (d.p && d.p["5"]) || { g: 0, v: 0 };
    const quadra = (d.p && d.p["4"]) || { g: 0, v: 0 };

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    modalTitle.textContent = `Concurso #${d.c} (${d.d})`;

    modalBody.innerHTML = `
      <p style="margin:0 0 8px 0;"><strong>Dezenas sorteadas:</strong></p>
      <div class="balls-row" style="margin-bottom:16px;">
        ${d.n.map((n) => `<span class="ball hit">${pad2(n)}</span>`).join("")}
      </div>
      <div class="table-wrap" style="margin-bottom:16px;">
        <table class="draws-table">
          <thead>
            <tr>
              <th>Faixa</th>
              <th>Ganhadores</th>
              <th>Prêmio Individual</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Faixa"><strong>6 acertos (Sena)</strong></td>
              <td data-label="Ganhadores">${sena.g > 0 ? intFmt.format(sena.g) : "0 (Acumulou)"}</td>
              <td data-label="Prêmio Individual">${brlFmt.format(sena.v)}</td>
            </tr>
            <tr>
              <td data-label="Faixa"><strong>5 acertos (Quina)</strong></td>
              <td data-label="Ganhadores">${intFmt.format(quina.g)}</td>
              <td data-label="Prêmio Individual">${brlFmt.format(quina.v)}</td>
            </tr>
            <tr>
              <td data-label="Faixa"><strong>4 acertos (Quadra)</strong></td>
              <td data-label="Ganhadores">${intFmt.format(quadra.g)}</td>
              <td data-label="Prêmio Individual">${brlFmt.format(quadra.v)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        <button type="button" class="btn btn-primary" id="modal-load-bet">
          Carregar estas 6 dezenas no Simulador
        </button>
      </div>
    `;

    const backdrop = document.getElementById("contest-modal");
    backdrop.hidden = false;
    const closeBtn = document.getElementById("modal-close-btn");
    closeBtn.focus();

    document.getElementById("modal-load-bet").addEventListener("click", () => {
      state.betSize = 6;
      state.selectedNumbers = new Set(d.n);
      closeModal();
      syncVolanteUI();
      renderSimulation();
      renderDrawsTable();
      document.getElementById("simulador").scrollIntoView({ behavior: "smooth" });
    });
  }

  function closeModal() {
    const backdrop = document.getElementById("contest-modal");
    backdrop.hidden = true;
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
      lastFocusedTrigger.focus();
    }
  }

  function populateFilterNumberSelect() {
    const sel = document.getElementById("filter-number");
    for (let i = 1; i <= 60; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "Dezena " + pad2(i);
      sel.appendChild(opt);
    }
  }

  async function syncLatestFromAPI() {
    const statusEl = document.getElementById("sync-status");
    statusEl.hidden = false;
    statusEl.className = "status-banner";
    statusEl.textContent = "Consultando API de Loterias da Caixa para verificar novos sorteios...";

    try {
      const res = await fetch("https://loteriascaixa-api.herokuapp.com/api/megasena/latest");
      if (!res.ok) throw new Error("Resposta HTTP " + res.status);
      const item = await res.json();
      const exists = state.draws.some((d) => d.c === item.concurso);
      if (!exists && item.concurso && Array.isArray(item.dezenas)) {
        const premios = {};
        (item.premiacoes || []).forEach((p) => {
          if (p.faixa === 1 || p.faixa === 2 || p.faixa === 3) {
            const k = String(7 - p.faixa);
            let val = Number(p.valorPremio || 0);
            if (k === "6" && val === 0) {
              val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
            }
            premios[k] = { g: Number(p.ganhadores || 0), v: val };
          }
        });
        state.draws.push({
          c: item.concurso,
          d: item.data,
          n: item.dezenas.map(Number),
          p: premios,
          a: Boolean(item.acumulou)
        });
        renderMetricsAndCharts();
        renderSimulation();
        renderDrawsTable();
        statusEl.textContent = `Novo concurso #${item.concurso} (${item.data}) adicionado à base local.`;
      } else {
        statusEl.textContent = `A base já está sincronizada até o último concurso disponível (#${item.concurso} de ${item.data}).`;
      }
    } catch (err) {
      statusEl.className = "status-banner error";
      statusEl.textContent = `Não foi possível conectar à API externa no momento (${err.message}). Os ${intFmt.format(state.draws.length)} concursos locais seguem disponíveis para consulta e simulação.`;
    }
  }

  function bindEvents() {
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("megasena_theme", next);
      updateThemeBtn(next);
    });

    document.querySelectorAll(".size-pill").forEach((pill) => {
      pill.addEventListener("click", () => setBetSize(Number(pill.dataset.size)));
    });

    document.getElementById("cost-mode-select").addEventListener("change", (e) => {
      state.costMode = e.target.value;
      renderSimulation();
    });

    document.getElementById("btn-random-bet").addEventListener("click", fillRandomBet);

    document.getElementById("btn-clear-bet").addEventListener("click", () => {
      state.selectedNumbers.clear();
      document.getElementById("simulator-alert").hidden = true;
      syncVolanteUI();
      renderSimulation();
      renderDrawsTable();
    });

    document.getElementById("btn-example-2057").addEventListener("click", () => {
      // Exemplo citado pelo usuário: Concurso 2057 com 5 dezenas acertadas (10, 13, 20, 37, 38) + 01
      state.betSize = 6;
      state.selectedNumbers = new Set([1, 10, 13, 20, 37, 38]);
      document.getElementById("simulator-alert").hidden = true;
      syncVolanteUI();
      renderSimulation();
      renderDrawsTable();
    });

    document.getElementById("btn-example-loss").addEventListener("click", () => {
      // Aposta de 10 dezenas (R$ 1.260,00) onde o custo supera uma Quadra isolada
      state.betSize = 10;
      state.selectedNumbers = new Set([1, 2, 3, 14, 19, 21, 31, 40, 48, 59]);
      document.getElementById("simulator-alert").hidden = true;
      syncVolanteUI();
      renderSimulation();
      renderDrawsTable();
    });

    document.getElementById("freq-sort-select").addEventListener("change", (e) => {
      state.freqSort = e.target.value;
      renderFrequencyMatrix(computeStatistics());
    });

    document.querySelectorAll(".horizon-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        state.extrapHorizon = Number(pill.dataset.horizon);
        renderExtrapolation(computeStatistics());
      });
    });

    document.getElementById("extrap-mode-select").addEventListener("change", (e) => {
      state.extrapMode = e.target.value;
      renderExtrapolation(computeStatistics());
    });

    document.getElementById("btn-rerun-mc").addEventListener("click", () => {
      state.extrapMode = "montecarlo";
      document.getElementById("extrap-mode-select").value = "montecarlo";
      renderExtrapolation(computeStatistics());
    });

    document.getElementById("btn-load-projected-bet").addEventListener("click", () => {
      state.betSize = 6;
      state.selectedNumbers = new Set(state.topProjectedSix);
      document.getElementById("simulator-alert").hidden = true;
      syncVolanteUI();
      renderSimulation();
      renderDrawsTable();
      document.getElementById("simulador").scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("filter-search").addEventListener("input", (e) => {
      state.filterSearch = e.target.value;
      state.page = 1;
      renderDrawsTable();
    });

    document.getElementById("filter-number").addEventListener("change", (e) => {
      state.filterNumber = e.target.value;
      state.page = 1;
      renderDrawsTable();
    });

    document.getElementById("filter-status").addEventListener("change", (e) => {
      state.filterStatus = e.target.value;
      state.page = 1;
      renderDrawsTable();
    });

    document.getElementById("sort-order").addEventListener("change", (e) => {
      state.sortOrder = e.target.value;
      state.page = 1;
      renderDrawsTable();
    });

    document.getElementById("btn-reset-filters").addEventListener("click", () => {
      state.filterSearch = "";
      state.filterNumber = "";
      state.filterStatus = "all";
      state.sortOrder = "desc";
      state.page = 1;
      document.getElementById("filter-search").value = "";
      document.getElementById("filter-number").value = "";
      document.getElementById("filter-status").value = "all";
      document.getElementById("sort-order").value = "desc";
      renderDrawsTable();
    });

    document.getElementById("prev-page").addEventListener("click", () => {
      if (state.page > 1) {
        state.page--;
        renderDrawsTable();
      }
    });

    document.getElementById("next-page").addEventListener("click", () => {
      state.page++;
      renderDrawsTable();
    });

    document.getElementById("btn-sync-api").addEventListener("click", syncLatestFromAPI);

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("contest-modal").addEventListener("click", (e) => {
      if (e.target.id === "contest-modal") closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("contest-modal").hidden) {
        closeModal();
      }
    });
  }

  function loadInitialData() {
    if (Array.isArray(window.MEGASENA_DRAWS) && window.MEGASENA_DRAWS.length > 0) {
      state.draws = window.MEGASENA_DRAWS;
      state.loading = false;
      state.error = null;
      renderMetricsAndCharts();
      renderSimulation();
      renderDrawsTable();
      return;
    }

    fetch("data/megasena.json")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao ler data/megasena.json");
        return r.json();
      })
      .then((data) => {
        state.draws = data;
        state.loading = false;
        state.error = null;
        renderMetricsAndCharts();
        renderSimulation();
        renderDrawsTable();
      })
      .catch((err) => {
        state.loading = false;
        state.error = err.message;
        renderSimulation();
        renderDrawsTable();
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    populateFilterNumberSelect();
    buildVolanteButtons();
    bindEvents();
    syncVolanteUI();
    loadInitialData();
  });
})();
