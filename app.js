(function () {
  "use strict";

  const LOTTERY_CONFIGS = {
    megasena: {
      id: "megasena",
      name: "Mega-Sena",
      mark: "60",
      title: "Atlas da Mega-Sena",
      subtitle: "3.077 sorteios, métricas, projeções e simulador financeiro",
      maxNum: 60,
      drawCount: 6,
      defaultSize: 6,
      allowedSizes: [6, 7, 8, 9, 10],
      startYear: 1996,
      basePrice: 6.0,
      defaultPicks: [1, 10, 13, 20, 37, 38],
      betTable: {
        6: { combos: 1, cost: 6.0 },
        7: { combos: 7, cost: 42.0 },
        8: { combos: 28, cost: 168.0 },
        9: { combos: 84, cost: 504.0 },
        10: { combos: 210, cost: 1260.0 }
      },
      minHitsForPrize: 4,
      tiers: [
        { key: "6", name: "Sena", minHits: 6 },
        { key: "5", name: "Quina", minHits: 5 },
        { key: "4", name: "Quadra", minHits: 4 }
      ],
      tablePrizeCols: { main: "Sena (6 acertos)", sub: "Quina (5) e Quadra (4)" },
      dataVar: "MEGASENA_DRAWS",
      dataFile: "data/megasena.json"
    },
    lotofacil: {
      id: "lotofacil",
      name: "Lotofácil",
      mark: "25",
      title: "Atlas da Lotofácil",
      subtitle: "3.816 sorteios, estatísticas das 25 dezenas e simulador combinatório",
      maxNum: 25,
      drawCount: 15,
      defaultSize: 15,
      allowedSizes: [15, 16, 17, 18, 19, 20],
      startYear: 2003,
      basePrice: 3.5,
      defaultPicks: [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 24, 25],
      betTable: {
        15: { combos: 1, cost: 3.5 },
        16: { combos: 16, cost: 56.0 },
        17: { combos: 136, cost: 476.0 },
        18: { combos: 816, cost: 2856.0 },
        19: { combos: 3876, cost: 13566.0 },
        20: { combos: 15504, cost: 54264.0 }
      },
      minHitsForPrize: 11,
      tiers: [
        { key: "15", name: "15 Acertos", minHits: 15 },
        { key: "14", name: "14 Acertos", minHits: 14 },
        { key: "13", name: "13 Acertos", minHits: 13 },
        { key: "12", name: "12 Acertos", minHits: 12 },
        { key: "11", name: "11 Acertos", minHits: 11 }
      ],
      tablePrizeCols: { main: "15 Acertos", sub: "14, 13, 12 e 11 Acertos" },
      dataVar: "LOTOFACIL_DRAWS",
      dataFile: "data/lotofacil.json"
    },
    quina: {
      id: "quina",
      name: "Quina",
      mark: "80",
      title: "Atlas da Quina",
      subtitle: "7.154 sorteios, métricas das 80 dezenas e simulador de acertos",
      maxNum: 80,
      drawCount: 5,
      defaultSize: 5,
      allowedSizes: [5, 6, 7, 8, 9, 10],
      startYear: 1994,
      basePrice: 3.0,
      defaultPicks: [5, 15, 27, 42, 60],
      betTable: {
        5: { combos: 1, cost: 3.0 },
        6: { combos: 6, cost: 18.0 },
        7: { combos: 21, cost: 63.0 },
        8: { combos: 56, cost: 168.0 },
        9: { combos: 126, cost: 378.0 },
        10: { combos: 252, cost: 756.0 }
      },
      minHitsForPrize: 2,
      tiers: [
        { key: "5", name: "Quina", minHits: 5 },
        { key: "4", name: "Quadra", minHits: 4 },
        { key: "3", name: "Terno", minHits: 3 },
        { key: "2", name: "Duque", minHits: 2 }
      ],
      tablePrizeCols: { main: "Quina (5 acertos)", sub: "Quadra (4), Terno (3) e Duque (2)" },
      dataVar: "QUINA_DRAWS",
      dataFile: "data/quina.json"
    },
    lotomania: {
      id: "lotomania",
      name: "Lotomania",
      mark: "100",
      title: "Atlas da Lotomania",
      subtitle: "2.993 sorteios, conferência de jogos de 50 dezenas e frequências",
      maxNum: 100,
      drawCount: 20,
      defaultSize: 50,
      allowedSizes: [50],
      startYear: 1999,
      basePrice: 3.0,
      defaultPicks: Array.from({ length: 50 }, (_, i) => i + 1),
      betTable: {
        50: { combos: 1, cost: 3.0 }
      },
      minHitsForPrize: 15,
      tiers: [
        { key: "20", name: "20 Acertos", minHits: 20 },
        { key: "19", name: "19 Acertos", minHits: 19 },
        { key: "18", name: "18 Acertos", minHits: 18 },
        { key: "17", name: "17 Acertos", minHits: 17 },
        { key: "16", name: "16 Acertos", minHits: 16 },
        { key: "15", name: "15 Acertos", minHits: 15 },
        { key: "0", name: "0 Acertos", minHits: 0 }
      ],
      tablePrizeCols: { main: "20 Acertos", sub: "19 a 15 e 0 Acertos" },
      dataVar: "LOTOMANIA_DRAWS",
      dataFile: "data/lotomania.json"
    }
  };

  const state = {
    lottery: "megasena",
    draws: [],
    loading: true,
    error: null,
    betSize: 6,
    selectedNumbers: new Set([1, 10, 13, 20, 37, 38]),
    costMode: "single",
    freqSort: "num",
    extrapHorizon: 500,
    extrapMode: "empirical",
    topProjectedSix: [10, 53, 5, 37, 34, 33],
    spendBetsPerMonth: 8,
    spendBetSize: 6,
    spendTimeMode: "sinceYear",
    spendStartYear: 2015,
    spendYearsCount: 10,
    spendAdjustMode: "official",
    filterSearch: "",
    filterNumber: "",
    filterStatus: "all",
    sortOrder: "desc",
    page: 1,
    pageSize: 20
  };

  const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const intFmt = new Intl.NumberFormat("pt-BR");

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function getCurrentLottery() {
    return LOTTERY_CONFIGS[state.lottery] || LOTTERY_CONFIGS.megasena;
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

  function calcMultiplePrizes(k, h, drawPrizes) {
    const cfg = getCurrentLottery();
    const res = { totalValue: 0, breakdown: [], senaCount: 0, quinaCount: 0, quadraCount: 0 };
    if (!cfg) return res;

    if (cfg.id === "lotomania") {
      cfg.tiers.forEach((t) => {
        let won = false;
        if (t.key === "0" && h === 0) won = true;
        else if (t.key !== "0" && h === Number(t.key)) won = true;
        if (won) {
          const v = (drawPrizes && drawPrizes[t.key] && drawPrizes[t.key].v) || 0;
          res.totalValue += v;
          res.breakdown.push({ tier: t.name, count: 1, value: v });
        }
      });
      return res;
    }

    const missed = k - h;
    const drawn = cfg.drawCount;

    cfg.tiers.forEach((tier) => {
      const m = tier.minHits;
      if (h >= m && (drawn - m) <= missed && (drawn - m) >= 0) {
        const count = comb(h, m) * comb(missed, drawn - m);
        if (count > 0) {
          const val = (drawPrizes && drawPrizes[tier.key] && drawPrizes[tier.key].v) || 0;
          const subtotal = count * val;
          res.totalValue += subtotal;
          res.breakdown.push({ tier: tier.name, count, value: subtotal });
          if (tier.key === "6") res.senaCount = count;
          else if (tier.key === "5") res.quinaCount = count;
          else if (tier.key === "4") res.quadraCount = count;
        }
      }
    });

    return res;
  }

  function initTheme() {
    const saved = localStorage.getItem("loterias_theme");
    const theme = saved === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeBtn(theme);
  }

  function updateThemeBtn(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = theme === "dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.title = isDark ? "Tema atual: Escuro (clique para Claro)" : "Tema atual: Claro (clique para Escuro)";
    const iconSvg = isDark
      ? `<svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 10.2A5.5 5.5 0 0 1 5.8 2.8a5.5 5.5 0 1 0 7.4 7.4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`
      : `<svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    btn.innerHTML = `${iconSvg}<span class="btn-label-text" id="theme-toggle-text">${isDark ? "Escuro" : "Claro"}</span>`;
  }

  function buildSizePills() {
    const cfg = getCurrentLottery();
    const group = document.getElementById("dezena-size-group");
    if (!group) return;
    group.innerHTML = "";
    cfg.allowedSizes.forEach((sz) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-pill";
      btn.dataset.size = String(sz);
      const info = cfg.betTable[sz] || { cost: cfg.basePrice };
      btn.textContent = `${sz} dez (${brlFmt.format(info.cost)})`;
      btn.setAttribute("aria-pressed", sz === state.betSize ? "true" : "false");
      btn.addEventListener("click", () => setBetSize(sz));
      group.appendChild(btn);
    });
  }

  function buildVolanteButtons() {
    const cfg = getCurrentLottery();
    const container = document.getElementById("volante-grid");
    if (!container) return;
    container.innerHTML = "";
    container.setAttribute("aria-label", `Volante de ${cfg.maxNum} dezenas da ${cfg.name}`);
    for (let n = 1; n <= cfg.maxNum; n++) {
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
    const cfg = getCurrentLottery();
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

    const info = cfg.betTable[state.betSize] || { combos: 1, cost: cfg.basePrice };
    const picked = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    const summaryEl = document.getElementById("ticket-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <span><strong>Selecionadas (${picked.length}/${state.betSize}):</strong> ${picked.length ? picked.map(pad2).join(", ") : "nenhuma"}</span>
        <span><strong>Equivalência:</strong> ${info.combos} ${info.combos === 1 ? "aposta simples" : "apostas simples"} | <strong>Valor da aposta (${state.betSize} dezenas):</strong> ${brlFmt.format(info.cost)}</span>
      `;
    }
  }

  function toggleDezena(n) {
    const cfg = getCurrentLottery();
    const msgEl = document.getElementById("simulator-alert");
    msgEl.hidden = true;
    if (state.selectedNumbers.has(n)) {
      state.selectedNumbers.delete(n);
    } else {
      if (state.selectedNumbers.size >= state.betSize) {
        msgEl.textContent = `Você já selecionou o limite de ${state.betSize} dezenas para esta aposta da ${cfg.name}. Desmarque uma dezena ou aumente o tamanho da aposta.`;
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
      const trimmed = Array.from(state.selectedNumbers).sort((a, b) => a - b).slice(0, size);
      state.selectedNumbers = new Set(trimmed);
    }
    document.getElementById("simulator-alert").hidden = true;
    syncVolanteUI();
    renderSimulation();
    renderDrawsTable();
  }

  function fillRandomBet() {
    const cfg = getCurrentLottery();
    const pool = [];
    for (let i = 1; i <= cfg.maxNum; i++) pool.push(i);
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
    const cfg = getCurrentLottery();
    const panel = document.getElementById("simulation-output");
    if (!panel) return;

    if (state.loading) {
      panel.innerHTML = `<div class="status-banner" role="status">Carregando histórico oficial da ${cfg.name}...</div>`;
      return;
    }

    if (state.error) {
      panel.innerHTML = `<div class="status-banner error" role="alert">Erro ao carregar sorteios: ${state.error}.</div>`;
      return;
    }

    const pickedCount = state.selectedNumbers.size;
    if (pickedCount < state.betSize) {
      const faltam = state.betSize - pickedCount;
      panel.innerHTML = `
        <div class="status-banner" role="status">
          <strong>Aguardando preenchimento:</strong> selecione mais <strong>${faltam}</strong> ${faltam === 1 ? "dezena" : "dezenas"} no volante ao lado (ou clique em "Surpresinha") para validar sua aposta de ${state.betSize} dezenas contra todos os ${intFmt.format(state.draws.length)} concursos da ${cfg.name}.
        </div>
      `;
      return;
    }

    const k = state.betSize;
    const betCostSingle = (cfg.betTable[k] && cfg.betTable[k].cost) || cfg.basePrice;
    const totalDraws = state.draws.length;
    const betCostAll = betCostSingle * totalDraws;

    let maxHits = 0;
    const hitsByCount = {};
    for (let i = 0; i <= cfg.drawCount; i++) hitsByCount[i] = 0;
    const allEvaluated = [];
    const winningDraws = [];

    let totalGrossWon = 0;

    for (let i = 0; i < totalDraws; i++) {
      const d = state.draws[i];
      const matched = d.n.filter((num) => state.selectedNumbers.has(num));
      const h = matched.length;
      hitsByCount[h] = (hitsByCount[h] || 0) + 1;
      if (h > maxHits) maxHits = h;

      const prizeCalc = calcMultiplePrizes(k, h, d.p);
      if (prizeCalc.totalValue > 0 || h >= cfg.minHitsForPrize) {
        totalGrossWon += prizeCalc.totalValue;
        winningDraws.push({ draw: d, hits: h, matched, prizeCalc });
      }
      if (h >= Math.max(1, cfg.minHitsForPrize - 1)) {
        allEvaluated.push({ draw: d, hits: h, matched, prizeCalc });
      }
    }

    const bestDraws = allEvaluated
      .filter((item) => item.hits === maxHits)
      .sort((a, b) => b.prizeCalc.totalValue - a.prizeCalc.totalValue || b.draw.c - a.draw.c);

    const activeCost = state.costMode === "all" ? betCostAll : betCostSingle;
    const netBalance = totalGrossWon - activeCost;

    let topHeadlineHTML = "";
    if (bestDraws.length > 0 && bestDraws[0].prizeCalc.totalValue > 0) {
      const top = bestDraws[0];
      const breakdownText = top.prizeCalc.breakdown.map((b) => `${b.count}x ${b.tier}`).join(" + ") || "Prêmio Oficial";

      topHeadlineHTML = `
        <div class="highlight-box ${netBalance >= 0 ? "positive" : "negative"}" role="region" aria-label="Destaque de maior acerto">
          <strong>Maior acerto encontrado (${maxHits} dezenas):</strong> No <strong>concurso #${top.draw.c}</strong> (${top.draw.d}) você teria acertado <strong>${top.hits} dezenas</strong> (${top.matched.map(pad2).join(", ")}), recebendo <strong>${brlFmt.format(top.prizeCalc.totalValue)}</strong> (${breakdownText}).
          ${bestDraws.length > 1 ? `<div style="margin-top:6px;font-size:0.875rem;">Você atingiu ${maxHits} acertos em <strong>${bestDraws.length} concursos</strong> no total.</div>` : ""}
        </div>
      `;
    } else {
      topHeadlineHTML = `
        <div class="highlight-box negative" role="region" aria-label="Sem premiação nos sorteios passados">
          <strong>Nenhum prêmio oficial encontrado:</strong> O jogo obteve no máximo <strong>${maxHits} acertos</strong> em concursos como ${bestDraws.slice(0, 3).map((x) => `#${x.draw.c}`).join(", ") || "nenhum"}, abaixo da faixa de premiação da ${cfg.name}.
        </div>
      `;
    }

    const rowsHTML = winningDraws
      .slice(0, 20)
      .map((item) => {
        const breakdown = item.prizeCalc.breakdown.map((b) => `${b.count}x ${b.tier}`).join(", ") || "Premiação";
        return `
          <tr>
            <td><strong>#${item.draw.c}</strong></td>
            <td>${item.draw.d}</td>
            <td><span class="badge ${item.hits >= cfg.drawCount ? "win" : "hit"}">${item.hits} acertos</span></td>
            <td>${item.matched.map(pad2).join(", ")}</td>
            <td>${breakdown}</td>
            <td><strong>${brlFmt.format(item.prizeCalc.totalValue)}</strong></td>
          </tr>
        `;
      })
      .join("");

    panel.innerHTML = `
      ${topHeadlineHTML}
      <div class="kpi-strip" style="margin-top:14px;">
        <div class="kpi-item">
          <p class="kpi-title">Total de Prêmios Recebidos</p>
          <p class="kpi-num" style="color:var(--success-text);">${brlFmt.format(totalGrossWon)}</p>
          <p class="kpi-sub">${winningDraws.length} sorteios premiados</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Custo Considerado (${state.costMode === "all" ? "Histórico Total" : "1 Concurso"})</p>
          <p class="kpi-num" style="color:var(--danger-text);">${brlFmt.format(activeCost)}</p>
          <p class="kpi-sub">${state.costMode === "all" ? `${intFmt.format(totalDraws)} concursos x ${brlFmt.format(betCostSingle)}` : "1 aposta avulsa"}</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Saldo Financeiro Final</p>
          <p class="kpi-num" style="color:${netBalance >= 0 ? "var(--success-text)" : "var(--danger-text)"};">${brlFmt.format(netBalance)}</p>
          <p class="kpi-sub">${netBalance >= 0 ? "Lucro acumulado no período" : "Prejuízo operacional"}</p>
        </div>
      </div>
      <div style="margin-top:16px;">
        <p style="margin:0 0 8px;font-weight:700;">Concursos Premiados (${intFmt.format(winningDraws.length)} no histórico):</p>
        ${winningDraws.length > 0 ? `
          <div class="table-wrap">
            <table class="draws-table">
              <thead>
                <tr>
                  <th>Concurso</th>
                  <th>Data</th>
                  <th>Acertos</th>
                  <th>Dezenas Coincidentes</th>
                  <th>Prêmios Multiplicados</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          </div>
        ` : `<p class="section-desc" style="margin:0;">Nenhum sorteio atingiu o patamar mínimo de premiação desta modalidade.</p>`}
      </div>
    `;
  }

  function computeStatistics() {
    const cfg = getCurrentLottery();
    const totalDraws = state.draws.length;
    const maxNum = cfg.maxNum;
    const freq = Array(maxNum + 1).fill(0);
    const lastSeenIndex = Array(maxNum + 1).fill(-1);
    const parityDist = {};
    for (let i = 0; i <= cfg.drawCount; i++) parityDist[i] = 0;
    const numRows = Math.ceil(maxNum / 10);
    const rowCounts = Array(numRows).fill(0);
    let accumulatedCount = 0;
    let totalSumAllDraws = 0;

    for (let idx = 0; idx < totalDraws; idx++) {
      const d = state.draws[idx];
      if (d.a) accumulatedCount++;
      let evens = 0;
      let sum = 0;
      for (let j = 0; j < d.n.length; j++) {
        const num = d.n[j];
        if (num >= 1 && num <= maxNum) {
          freq[num]++;
          lastSeenIndex[num] = idx;
          if (num % 2 === 0) evens++;
          sum += num;
          const rowIdx = Math.min(numRows - 1, Math.floor((num - 1) / 10));
          rowCounts[rowIdx]++;
        }
      }
      parityDist[evens] = (parityDist[evens] || 0) + 1;
      totalSumAllDraws += sum;
    }

    const items = [];
    for (let n = 1; n <= maxNum; n++) {
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
    const cfg = getCurrentLottery();
    const stats = computeStatistics();
    if (!stats.totalDraws) return;

    const latest = state.draws[state.draws.length - 1];
    const most = stats.byMost[0];
    const least = stats.byLeast[0];
    const mostDelayed = stats.byDelay[0];

    const kpiStrip = document.getElementById("kpi-strip");
    if (kpiStrip) {
      kpiStrip.innerHTML = `
        <div class="kpi-item">
          <p class="kpi-title">Total de Concursos (${cfg.name})</p>
          <p class="kpi-num">${intFmt.format(stats.totalDraws)} sorteios</p>
          <p class="kpi-sub">Último: #${latest.c} em ${latest.d} (${Math.round((stats.accumulatedCount / stats.totalDraws) * 100)}% acumularam)</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Dezena Mais Sorteada</p>
          <p class="kpi-num">Dezena ${pad2(most.num)} (${most.count}x)</p>
          <p class="kpi-sub">Presente em ${((most.count / stats.totalDraws) * 100).toFixed(1)}% dos concursos</p>
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
    }

    renderFrequencyMatrix(stats);
    renderDelayChart(stats);
    renderParityChart(stats);
    renderRowDistributionChart(stats);
    renderExtrapolation(stats);
    renderSpendingSimulator();
    updateDrawsOrderLabels();
  }

  function renderFrequencyMatrix(stats) {
    const container = document.getElementById("freq-matrix");
    if (!container) return;
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
    const el = document.getElementById("delay-chart");
    if (!el) return;
    const topDelayed = stats.byDelay.slice(0, 10);
    const maxDelay = topDelayed[0] ? topDelayed[0].delay : 1;
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
    const cfg = getCurrentLottery();
    const el = document.getElementById("parity-chart");
    if (!el) return;

    const rows = [];
    const drawn = cfg.drawCount;
    for (let evens = 0; evens <= drawn; evens++) {
      rows.push({ label: `${evens}P / ${drawn - evens}I`, evens });
    }
    rows.sort((a, b) => (stats.parityDist[b.evens] || 0) - (stats.parityDist[a.evens] || 0));

    const maxVal = Math.max(...rows.map((r) => stats.parityDist[r.evens] || 0), 1);
    el.innerHTML = rows
      .slice(0, 8)
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
    const cfg = getCurrentLottery();
    const el = document.getElementById("row-chart");
    if (!el) return;

    const totalBalls = stats.totalDraws * cfg.drawCount;
    const maxRow = Math.max(...stats.rowCounts, 1);
    const numRows = Math.ceil(cfg.maxNum / 10);

    const rowsHTML = [];
    for (let r = 0; r < numRows; r++) {
      const start = r * 10 + 1;
      const end = Math.min(cfg.maxNum, (r + 1) * 10);
      const label = `${pad2(start)} a ${pad2(end)}`;
      const count = stats.rowCounts[r] || 0;
      const pctWidth = Math.max(4, Math.round((count / maxRow) * 100));
      const share = totalBalls ? ((count / totalBalls) * 100).toFixed(1) : "0";
      rowsHTML.push(`
        <div class="bar-row">
          <span><strong>${label}</strong></span>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width:${pctWidth}%"></div>
          </div>
          <span>${share}% (${intFmt.format(count)})</span>
        </div>
      `);
    }
    el.innerHTML = rowsHTML.join("");
  }

  function simulateMonteCarloDraws(stats, horizon) {
    const cfg = getCurrentLottery();
    const counts = Array(cfg.maxNum + 1).fill(0);
    const weights = Array(cfg.maxNum + 1).fill(1);
    for (let i = 0; i < stats.items.length; i++) {
      const it = stats.items[i];
      weights[it.num] = Math.max(1, it.count);
    }

    for (let g = 0; g < horizon; g++) {
      const scored = [];
      for (let n = 1; n <= cfg.maxNum; n++) {
        const u = Math.max(1e-9, Math.random());
        scored.push({ n, key: Math.pow(u, 1 / weights[n]) });
      }
      scored.sort((a, b) => b.key - a.key);
      for (let k = 0; k < cfg.drawCount; k++) {
        counts[scored[k].n]++;
      }
    }
    return { counts };
  }

  function renderExtrapolation(stats) {
    const cfg = getCurrentLottery();
    if (!stats || !stats.totalDraws) return;
    const H = state.extrapHorizon;
    const mode = state.extrapMode;
    const N = stats.totalDraws;
    const uniformExpected = H * (cfg.drawCount / cfg.maxNum);

    document.querySelectorAll(".horizon-pill").forEach((pill) => {
      pill.setAttribute("aria-pressed", Number(pill.dataset.horizon) === H ? "true" : "false");
    });

    const mcRun = mode === "montecarlo" ? simulateMonteCarloDraws(stats, H) : null;

    const rawProjections = stats.items.map((item) => {
      const pEmpirical = item.count / N;
      const avgCycle = pEmpirical > 0 ? 1 / pEmpirical : 10;
      const cyclePressure = item.delay / avgCycle;
      let addCount = pEmpirical * H;
      if (mode === "montecarlo" && mcRun) {
        addCount = mcRun.counts[item.num];
      } else if (mode === "reversion") {
        const historicalDeficit = N * (cfg.drawCount / cfg.maxNum) - item.count;
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
        addCount,
        futureTotal: item.count + addCount
      };
    });

    if (mode === "reversion") {
      const sumAdd = rawProjections.reduce((acc, x) => acc + x.addCount, 0) || 1;
      const targetSum = H * cfg.drawCount;
      rawProjections.forEach((x) => {
        x.addCount = (x.addCount / sumAdd) * targetSum;
        x.futureTotal = x.histCount + x.addCount;
      });
    }

    const sortedByAdd = rawProjections.slice().sort((a, b) => b.addCount - a.addCount || b.histCount - a.histCount);
    const topProj = sortedByAdd.slice(0, cfg.drawCount).map((x) => x.num).sort((a, b) => a - b);
    state.topProjectedSix = topProj;

    const latestConcurso = state.draws[state.draws.length - 1].c;
    const targetConcurso = latestConcurso + H;
    const kpiEl = document.getElementById("extrap-kpi-strip");
    if (kpiEl) {
      kpiEl.innerHTML = `
        <div class="kpi-item">
          <p class="kpi-title">Janela Futura Projetada</p>
          <p class="kpi-num">+${intFmt.format(H)} concursos</p>
          <p class="kpi-sub">Do #${latestConcurso + 1} até #${intFmt.format(targetConcurso)} da ${cfg.name}</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Jogo Mais Projetado (+${intFmt.format(H)} jogos)</p>
          ${
            topProj.length <= 6
              ? `<p class="kpi-num">${topProj.map(pad2).join(" - ")}</p>`
              : `<div class="balls-row" style="margin:4px 0 2px;">${topProj.map((n) => `<span class="ball hit" style="width:26px;height:26px;font-size:0.75rem;">${pad2(n)}</span>`).join("")}</div>`
          }
          <p class="kpi-sub">${topProj.length} dezenas com maior impulso estatístico na ${cfg.name}</p>
        </div>
      `;
    }

    const gridEl = document.getElementById("extrap-grid");
    if (gridEl) {
      const topSet = new Set(topProj);
      gridEl.innerHTML = sortedByAdd
        .map((x) => `
          <div class="extrap-card ${topSet.has(x.num) ? "top" : ""}">
            <div class="extrap-head">
              <span class="extrap-num">${pad2(x.num)}</span>
              <span class="badge ${topSet.has(x.num) ? "win" : "hit"}">+${x.addCount.toFixed(1)} bolas</span>
            </div>
            <div style="font-size:0.8125rem;color:var(--text-muted);margin-top:6px;">
              Histórico: <strong>${x.histCount}x</strong> | Atraso: <strong>${x.delay}</strong> jogos
            </div>
          </div>
        `)
        .join("");
    }
  }

  const INVESTMENT_OPTIONS = [
    { id: "selic_cdi", name: "Tesouro Selic / 100% CDI", annualRate: 0.105 },
    { id: "ipca_mais", name: "Tesouro IPCA+ (IPCA + 6%)", annualRate: 0.102 },
    { id: "cdb_prefixado", name: "CDB Prefixado (11,5% a.a.)", annualRate: 0.115 },
    { id: "poupanca", name: "Caderneta de Poupança (TR + 6,17%)", annualRate: 0.068 }
  ];

  function populateSpendYears() {
    const cfg = getCurrentLottery();
    const sel = document.getElementById("spend-start-year");
    if (!sel) return;
    sel.innerHTML = "";
    const startYr = cfg.startYear || 1996;
    for (let y = 2026; y >= startYr; y--) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = `${y} (${2026 - y === 0 ? "ano atual" : "há " + (2026 - y) + (2026 - y === 1 ? " ano" : " anos")})`;
      if (y === state.spendStartYear) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function populateSpendBetSizes() {
    const cfg = getCurrentLottery();
    const sel = document.getElementById("spend-bet-size");
    if (!sel) return;
    sel.innerHTML = "";
    cfg.allowedSizes.forEach((sz) => {
      const opt = document.createElement("option");
      opt.value = String(sz);
      const info = cfg.betTable[sz] || { combos: 1 };
      opt.textContent = `${sz} dezenas (${info.combos}x valor base)`;
      if (sz === state.spendBetSize) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function renderSpendingSimulator() {
    const cfg = getCurrentLottery();
    const kpiEl = document.getElementById("spend-kpi-strip");
    if (!kpiEl) return;

    const betsPerMonth = Math.max(1, Math.min(500, Number(state.spendBetsPerMonth) || 1));
    const k = state.spendBetSize;
    const combosPerBet = (cfg.betTable[k] && cfg.betTable[k].combos) || 1;

    const endYM = 2026 * 12 + 10;
    const startYr = cfg.startYear || 1996;
    let startYM;
    if (state.spendTimeMode === "sinceYear") {
      const yr = Math.max(startYr, Math.min(2026, Number(state.spendStartYear) || 2015));
      startYM = yr === startYr ? startYr * 12 + 3 : yr * 12 + 1;
    } else {
      const yrs = Math.max(1, Math.min(30, Number(state.spendYearsCount) || 10));
      startYM = Math.max(startYr * 12 + 3, endYM - yrs * 12 + 1);
    }

    const totalMonths = Math.max(1, endYM - startYM + 1);
    const totalBetsPlaced = totalMonths * betsPerMonth;
    const totalSimpleEquiv = totalBetsPlaced * combosPerBet;

    const invBalances = {};
    const invMonthlyRate = {};
    INVESTMENT_OPTIONS.forEach((opt) => {
      invBalances[opt.id] = 0;
      invMonthlyRate[opt.id] = Math.pow(1 + opt.annualRate, 1 / 12) - 1;
    });

    let totalSpent = 0;
    const unitPrice = cfg.basePrice;

    for (let mIdx = 0; mIdx < totalMonths; mIdx++) {
      const singleBetCost = unitPrice * combosPerBet;
      const monthSpend = singleBetCost * betsPerMonth;
      totalSpent += monthSpend;

      INVESTMENT_OPTIONS.forEach((opt) => {
        invBalances[opt.id] = (invBalances[opt.id] + monthSpend) * (1 + invMonthlyRate[opt.id]);
      });
    }

    const pSingleJackpot = 1 / comb(cfg.maxNum, cfg.drawCount);
    const probWinOnce = 1 - Math.pow(1 - pSingleJackpot, totalSimpleEquiv);
    const probPct = (probWinOnce * 100).toFixed(4).replace(".", ",");
    const cdiTotal = invBalances["selic_cdi"];

    kpiEl.innerHTML = `
      <div class="kpi-item">
        <p class="kpi-title">Total Gasto em Apostas (${totalMonths} meses)</p>
        <p class="kpi-num" style="color:var(--danger-text);">${brlFmt.format(totalSpent)}</p>
        <p class="kpi-sub">${intFmt.format(totalBetsPlaced)} apostas de ${k} dezenas na ${cfg.name}</p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Patrimônio se Investido em CDI</p>
        <p class="kpi-num" style="color:var(--success-text);">${brlFmt.format(cdiTotal)}</p>
        <p class="kpi-sub">Lucro de juros compostos: <strong>+${brlFmt.format(cdiTotal - totalSpent)}</strong></p>
      </div>
      <div class="kpi-item">
        <p class="kpi-title">Chance Acumulada de Prêmio Máximo</p>
        <p class="kpi-num">${probPct}%</p>
        <p class="kpi-sub">1 em ${intFmt.format(Math.round(1 / (probWinOnce || 1e-12)))} no período</p>
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
      if (numFilter && !d.n.includes(numFilter)) return false;
      if (status === "winners" && d.a) return false;
      if (status === "accumulated" && !d.a) return false;
      return true;
    });

    filtered.sort((a, b) => (state.sortOrder === "asc" ? a.c - b.c : b.c - a.c));
    return filtered;
  }

  function renderDrawsTable() {
    const cfg = getCurrentLottery();
    const tbody = document.getElementById("draws-tbody");
    const countLabel = document.getElementById("draws-count-label");
    const pageInfo = document.getElementById("page-info");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    const thMain = document.getElementById("th-prize-main");
    const thSub = document.getElementById("th-prize-sub");
    if (thMain && thSub) {
      thMain.textContent = cfg.tablePrizeCols.main;
      thSub.textContent = cfg.tablePrizeCols.sub;
    }

    if (state.loading) {
      tbody.innerHTML = `<tr><td colspan="6">Carregando histórico oficial da ${cfg.name}...</td></tr>`;
      return;
    }

    const filtered = getFilteredDraws();
    const total = filtered.length;
    countLabel.textContent = `Exibindo ${intFmt.format(total)} de ${intFmt.format(state.draws.length)} concursos da ${cfg.name}`;

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="6">Nenhum concurso encontrado para os filtros selecionados.</td></tr>`;
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
        const ballsHTML = d.n
          .map((n) => `<span class="ball ${state.selectedNumbers.has(n) ? "hit" : ""}">${pad2(n)}</span>`)
          .join("");

        const mainTierKey = cfg.tiers[0].key;
        const mainPz = (d.p && d.p[mainTierKey]) || { g: 0, v: 0 };
        const mainWon = mainPz.g > 0;

        const mainPrizeHTML = `
          <span class="badge ${mainWon ? "win" : "acum"}">${mainWon ? `${mainPz.g} ${mainPz.g === 1 ? "ganhador" : "ganhadores"}` : "Acumulou"}</span>
          <span class="prize-val">${brlFmt.format(mainPz.v)}</span>
        `;

        const subPrizesHTML = cfg.tiers.slice(1, 3).map((t) => {
          const pz = (d.p && d.p[t.key]) || { g: 0, v: 0 };
          return `<span style="display:block;font-size:0.8125rem;">${t.name}: <strong>${intFmt.format(pz.g)}</strong> (${brlFmt.format(pz.v)})</span>`;
        }).join("");

        return `
          <tr>
            <td><strong>#${d.c}</strong></td>
            <td>${d.d}</td>
            <td><div class="balls-row">${ballsHTML}</div></td>
            <td>${mainPrizeHTML}</td>
            <td>${subPrizesHTML}</td>
            <td><button type="button" class="btn btn-sm btn-open-draw" data-concurso="${d.c}">Detalhes</button></td>
          </tr>
        `;
      })
      .join("");

    pageInfo.textContent = `Página ${state.page} de ${totalPages}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;

    tbody.querySelectorAll(".btn-open-draw").forEach((btn) => {
      btn.addEventListener("click", () => {
        openModalForDraw(Number(btn.dataset.concurso));
      });
    });
  }

  function openModalForDraw(c) {
    const cfg = getCurrentLottery();
    const d = state.draws.find((x) => x.c === c);
    if (!d) return;
    const modal = document.getElementById("contest-modal");
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");

    title.textContent = `${cfg.name} - Concurso #${d.c} (${d.d})`;
    const ballsHTML = d.n.map((n) => `<span class="ball ${state.selectedNumbers.has(n) ? "hit" : ""}">${pad2(n)}</span>`).join(" ");

    const prizesHTML = cfg.tiers.map((t) => {
      const pz = (d.p && d.p[t.key]) || { g: 0, v: 0 };
      return `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
          <span><strong>${t.name}:</strong></span>
          <span>${intFmt.format(pz.g)} apostas &mdash; <strong>${brlFmt.format(pz.v)}</strong></span>
        </div>
      `;
    }).join("");

    body.innerHTML = `
      <div style="margin-bottom:14px;">
        <p style="margin:0 0 8px;"><strong>Dezenas sorteadas:</strong></p>
        <div class="balls-row">${ballsHTML}</div>
      </div>
      <div>
        <p style="margin:0 0 8px;"><strong>Premiação Oficial:</strong></p>
        ${prizesHTML}
      </div>
    `;

    modal.hidden = false;
  }

  function closeModal() {
    document.getElementById("contest-modal").hidden = true;
  }

  function populateFilterNumberSelect() {
    const cfg = getCurrentLottery();
    const sel = document.getElementById("filter-number");
    if (!sel) return;
    sel.innerHTML = `<option value="">Todas as dezenas (01 a ${pad2(cfg.maxNum)})</option>`;
    for (let i = 1; i <= cfg.maxNum; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "Dezena " + pad2(i);
      sel.appendChild(opt);
    }
  }

  function updateDrawsOrderLabels() {
    const cfg = getCurrentLottery();
    if (!state.draws || !state.draws.length) return;
    const latest = state.draws[state.draws.length - 1];
    const first = state.draws[0];
    const descOpt = document.getElementById("opt-sort-desc");
    const ascOpt = document.getElementById("opt-sort-asc");
    if (descOpt) descOpt.textContent = `Mais recentes primeiro (#${latest.c} ao #1)`;
    if (ascOpt) ascOpt.textContent = `Mais antigos primeiro (#1 ao #${latest.c})`;
    const statsDesc = document.getElementById("stats-range-desc");
    if (statsDesc && first && latest) {
      statsDesc.textContent = `Contagem oficial da ${cfg.name} desde o Concurso #1 (${first.d}) até o Concurso #${latest.c} (${latest.d}).`;
    }
  }

  const baseMaxConcursos = {};
  let lastSyncTime = 0;

  function loadCachedExtraDraws(lotteryId) {
    try {
      const raw = localStorage.getItem(`loterias_extra_${lotteryId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCachedExtraDraws(lotteryId, allDraws) {
    try {
      const baseMax = baseMaxConcursos[lotteryId] || 0;
      const extras = allDraws.filter((d) => d && d.c > baseMax);
      if (extras.length > 0) {
        localStorage.setItem(`loterias_extra_${lotteryId}`, JSON.stringify(extras));
      }
    } catch (e) {
      console.warn("Falha ao salvar extra draws:", e);
    }
  }

  function mergeDraws(baseList, extraList) {
    const map = new Map();
    (baseList || []).forEach((d) => {
      if (d && d.c) map.set(d.c, d);
    });
    (extraList || []).forEach((d) => {
      if (d && d.c) map.set(d.c, d);
    });
    return Array.from(map.values()).sort((a, b) => a.c - b.c);
  }

  function formatApiDraw(lotteryId, item) {
    if (!item || !item.concurso || !Array.isArray(item.dezenas)) return null;
    const premios = {};
    (item.premiacoes || []).forEach((p) => {
      const faixa = p.faixa;
      let k = null;
      let val = Number(p.valorPremio || 0);

      if (lotteryId === "megasena") {
        if (faixa in { 1: 1, 2: 1, 3: 1 }) k = String(7 - faixa);
        if (k === "6" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "lotofacil") {
        if (faixa >= 1 && faixa <= 5) k = String(16 - faixa);
        if (k === "15" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "quina") {
        if (faixa >= 1 && faixa <= 4) k = String(6 - faixa);
        if (k === "5" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "lotomania") {
        const desc = p.descricao || "";
        k = desc.includes("0 acertos") || faixa === 7 ? "0" : String(21 - faixa);
        if (k === "20" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      }

      if (k) {
        premios[k] = { g: Number(p.ganhadores || 0), v: Math.round(val * 100) / 100 };
      }
    });

    let nums = item.dezenas.map(Number);
    if (lotteryId === "lotomania") {
      nums = nums.map((x) => (x === 0 ? 100 : x));
    }

    return {
      c: Number(item.concurso),
      d: String(item.data || ""),
      n: nums.sort((a, b) => a - b),
      p: premios,
      a: Boolean(item.acumulou)
    };
  }

  async function syncLatestFromAPI(options = {}) {
    const isAuto = Boolean(options && options.auto);
    const cfg = getCurrentLottery();
    const statusEl = document.getElementById("sync-status");
    const btnSync = document.getElementById("btn-sync-api");

    if (btnSync) {
      btnSync.classList.add("is-syncing");
      btnSync.setAttribute("aria-busy", "true");
    }

    if (!isAuto && statusEl) {
      statusEl.hidden = false;
      statusEl.className = "status-banner";
      statusEl.textContent = `Consultando API da Caixa para verificar novos sorteios da ${cfg.name}...`;
    }

    try {
      const res = await fetch(`https://loteriascaixa-api.herokuapp.com/api/${cfg.id}/latest`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error("Resposta HTTP " + res.status);
      const item = await res.json();
      const latestConcurso = Number(item.concurso);
      const maxExisting = state.draws.length > 0 ? state.draws[state.draws.length - 1].c : 0;

      if (latestConcurso > maxExisting && Array.isArray(item.dezenas)) {
        const missingDraws = [];
        const diff = latestConcurso - maxExisting;

        if (diff > 1 && diff <= 10) {
          const fetchPromises = [];
          for (let c = maxExisting + 1; c < latestConcurso; c++) {
            fetchPromises.push(
              fetch(`https://loteriascaixa-api.herokuapp.com/api/${cfg.id}/${c}`, {
                signal: AbortSignal.timeout(8000)
              })
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            );
          }
          const intermediateItems = await Promise.all(fetchPromises);
          intermediateItems.forEach((raw) => {
            const formatted = formatApiDraw(cfg.id, raw);
            if (formatted) missingDraws.push(formatted);
          });
        }

        const formattedLatest = formatApiDraw(cfg.id, item);
        if (formattedLatest) missingDraws.push(formattedLatest);

        if (missingDraws.length > 0) {
          state.draws = mergeDraws(state.draws, missingDraws);
          saveCachedExtraDraws(cfg.id, state.draws);

          renderMetricsAndCharts();
          renderSimulation();
          renderDrawsTable();
          updateDrawsOrderLabels();

          if (statusEl) {
            statusEl.hidden = false;
            statusEl.className = "status-banner success";
            statusEl.textContent =
              missingDraws.length === 1
                ? `[${cfg.name}] Novo concurso #${formattedLatest.c} (${formattedLatest.d}) adicionado com sucesso.`
                : `[${cfg.name}] ${missingDraws.length} novos concursos adicionados (até #${formattedLatest.c} de ${formattedLatest.d}).`;
          }
        }
      } else {
        if (!isAuto && statusEl) {
          statusEl.hidden = false;
          statusEl.className = "status-banner";
          statusEl.textContent = `A base da ${cfg.name} já está sincronizada até o último concurso disponível (#${item.concurso} de ${item.data}).`;
        }
      }
    } catch (err) {
      if (!isAuto && statusEl) {
        statusEl.hidden = false;
        statusEl.className = "status-banner error";
        statusEl.textContent = `Não foi possível conectar à API da Caixa (${err.message}). Os ${intFmt.format(state.draws.length)} concursos locais da ${cfg.name} seguem disponíveis.`;
      } else {
        console.warn(`Auto-sync da API Caixa (${cfg.id}):`, err.message);
      }
    } finally {
      if (btnSync) {
        btnSync.classList.remove("is-syncing");
        btnSync.removeAttribute("aria-busy");
      }
    }
  }

  function triggerAutoSync(force = false) {
    const now = Date.now();
    if (force || now - lastSyncTime > 5 * 60 * 1000) {
      lastSyncTime = now;
      syncLatestFromAPI({ auto: true });
    }
  }

  function loadLotteryData(lotteryId) {
    const cfg = LOTTERY_CONFIGS[lotteryId];
    if (!cfg) return;

    state.loading = true;
    const cachedExtras = loadCachedExtraDraws(lotteryId);

    if (Array.isArray(window[cfg.dataVar]) && window[cfg.dataVar].length > 0) {
      baseMaxConcursos[lotteryId] = window[cfg.dataVar][window[cfg.dataVar].length - 1].c;
      state.draws = mergeDraws(window[cfg.dataVar], cachedExtras);
      state.loading = false;
      state.error = null;
      renderMetricsAndCharts();
      renderSimulation();
      renderDrawsTable();
      updateDrawsOrderLabels();
      triggerAutoSync(true);
      return;
    }

    fetch(cfg.dataFile)
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao ler " + cfg.dataFile);
        return r.json();
      })
      .then((data) => {
        baseMaxConcursos[lotteryId] = data.length > 0 ? data[data.length - 1].c : 0;
        state.draws = mergeDraws(data, cachedExtras);
        state.loading = false;
        state.error = null;
        renderMetricsAndCharts();
        renderSimulation();
        renderDrawsTable();
        updateDrawsOrderLabels();
        triggerAutoSync(true);
      })
      .catch((err) => {
        state.loading = false;
        state.error = err.message;
        renderSimulation();
        renderDrawsTable();
      });
  }

  function selectLottery(lotteryId) {
    if (!LOTTERY_CONFIGS[lotteryId]) return;
    state.lottery = lotteryId;
    document.documentElement.setAttribute("data-lottery", lotteryId);

    document.querySelectorAll(".lottery-btn").forEach((btn) => {
      const active = btn.dataset.lottery === lotteryId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const cfg = LOTTERY_CONFIGS[lotteryId];
    state.betSize = cfg.defaultSize;
    state.selectedNumbers = new Set(cfg.defaultPicks);

    const markEl = document.getElementById("brand-mark");
    const titleEl = document.getElementById("brand-title");
    const subEl = document.getElementById("brand-subtitle");
    if (markEl) markEl.textContent = cfg.mark;
    if (titleEl) titleEl.textContent = cfg.title;
    if (subEl) subEl.textContent = cfg.subtitle;

    const simTitle = document.getElementById("title-simulador");
    const simDesc = document.getElementById("desc-simulador");
    if (simTitle) simTitle.textContent = `Simulador de Apostas da ${cfg.name}`;
    if (simDesc) simDesc.textContent = `Marque de ${cfg.allowedSizes[0]} a ${cfg.allowedSizes[cfg.allowedSizes.length - 1]} dezenas no volante para conferir seu desempenho contra todos os concursos históricos da ${cfg.name}.`;

    buildSizePills();
    buildVolanteButtons();
    populateFilterNumberSelect();
    populateSpendBetSizes();
    populateSpendYears();
    syncVolanteUI();

    loadLotteryData(lotteryId);
  }

  function bindEvents() {
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("loterias_theme", next);
      updateThemeBtn(next);
    });

    document.querySelectorAll(".lottery-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectLottery(btn.dataset.lottery);
      });
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
      const cfg = getCurrentLottery();
      state.betSize = cfg.defaultSize;
      state.selectedNumbers = new Set(cfg.defaultPicks);
      document.getElementById("simulator-alert").hidden = true;
      syncVolanteUI();
      renderSimulation();
      renderDrawsTable();
    });

    document.getElementById("btn-example-loss").addEventListener("click", () => {
      const cfg = getCurrentLottery();
      const maxSize = cfg.allowedSizes[cfg.allowedSizes.length - 1];
      state.betSize = maxSize;
      fillRandomBet();
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

    document.querySelectorAll(".model-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        state.extrapMode = pill.dataset.model;
        document.querySelectorAll(".model-pill").forEach((p) => {
          p.setAttribute("aria-pressed", p.dataset.model === state.extrapMode ? "true" : "false");
        });
        renderExtrapolation(computeStatistics());
      });
    });

    const copyBtn = document.getElementById("btn-copy-six");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const cfg = getCurrentLottery();
        state.betSize = cfg.defaultSize;
        state.selectedNumbers = new Set(state.topProjectedSix.slice(0, cfg.defaultSize));
        syncVolanteUI();
        renderSimulation();
        renderDrawsTable();
      });
    }

    document.getElementById("spend-bets-month").addEventListener("input", (e) => {
      state.spendBetsPerMonth = Number(e.target.value) || 1;
      renderSpendingSimulator();
    });

    document.getElementById("spend-bet-size").addEventListener("change", (e) => {
      state.spendBetSize = Number(e.target.value);
      renderSpendingSimulator();
    });

    document.getElementById("spend-time-mode").addEventListener("change", (e) => {
      state.spendTimeMode = e.target.value;
      renderSpendingSimulator();
    });

    document.getElementById("spend-start-year").addEventListener("change", (e) => {
      state.spendStartYear = Number(e.target.value);
      renderSpendingSimulator();
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

    document.getElementById("btn-sync-api").addEventListener("click", () => {
      syncLatestFromAPI({ auto: false });
    });

    window.addEventListener("focus", () => triggerAutoSync(false));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        triggerAutoSync(false);
      }
    });

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

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const hash = (location.hash || "").replace("#", "").toLowerCase();
    const startLottery = LOTTERY_CONFIGS[hash] ? hash : "megasena";
    bindEvents();
    selectLottery(startLottery);
  });
})();
