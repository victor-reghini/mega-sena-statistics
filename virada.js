(function () {
  "use strict";

  const Specials = window.AtlasSpecials;
  const Store = window.AtlasStore;

  const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const intFmt = new Intl.NumberFormat("pt-BR");

  const LOTTERY_META = {
    megasena: {
      id: "megasena",
      name: "Mega-Sena",
      specialLabel: "Mega da Virada",
      drawCount: 6,
      tiers: [
        { key: "6", name: "Sena", minHits: 6 },
        { key: "5", name: "Quina", minHits: 5 },
        { key: "4", name: "Quadra", minHits: 4 }
      ],
      tablePrizeCols: { main: "Sena (6 acertos)", sub: "Quina (5) e Quadra (4)" },
      dataVar: "MEGASENA_DRAWS"
    },
    lotofacil: {
      id: "lotofacil",
      name: "Lotofácil",
      specialLabel: "Independência",
      drawCount: 15,
      tiers: [
        { key: "15", name: "15 Acertos", minHits: 15 },
        { key: "14", name: "14 Acertos", minHits: 14 },
        { key: "13", name: "13 Acertos", minHits: 13 },
        { key: "12", name: "12 Acertos", minHits: 12 },
        { key: "11", name: "11 Acertos", minHits: 11 }
      ],
      tablePrizeCols: { main: "15 Acertos", sub: "14, 13, 12 e 11 Acertos" },
      dataVar: "LOTOFACIL_DRAWS"
    },
    quina: {
      id: "quina",
      name: "Quina",
      specialLabel: "Quina de São João",
      drawCount: 5,
      tiers: [
        { key: "5", name: "Quina", minHits: 5 },
        { key: "4", name: "Quadra", minHits: 4 },
        { key: "3", name: "Terno", minHits: 3 },
        { key: "2", name: "Duque", minHits: 2 }
      ],
      tablePrizeCols: { main: "Quina (5 acertos)", sub: "Quadra (4), Terno (3) e Duque (2)" },
      dataVar: "QUINA_DRAWS"
    },
    lotomania: {
      id: "lotomania",
      name: "Lotomania",
      specialLabel: "Lotomania de Páscoa",
      hasSpecial: true,
      drawCount: 20,
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
      dataVar: "LOTOMANIA_DRAWS"
    },
    maismilionaria: {
      id: "maismilionaria",
      name: "+Milionária",
      specialLabel: "6 dezenas + 2 trevos",
      hasSpecial: false,
      drawCount: 6,
      tiers: [
        { key: "6+2", name: "6 + 2 Trevos", minHits: 6 },
        { key: "6+1", name: "6 + 1/0 Trevo", minHits: 6 },
        { key: "5+2", name: "5 + 2 Trevos", minHits: 5 },
        { key: "5+1", name: "5 + 1/0 Trevo", minHits: 5 },
        { key: "4+2", name: "4 + 2 Trevos", minHits: 4 },
        { key: "4+1", name: "4 + 1/0 Trevo", minHits: 4 },
        { key: "3+2", name: "3 + 2 Trevos", minHits: 3 },
        { key: "3+1", name: "3 + 1 Trevo", minHits: 3 },
        { key: "2+2", name: "2 + 2 Trevos", minHits: 2 },
        { key: "2+1", name: "2 + 1 Trevo", minHits: 2 }
      ],
      tablePrizeCols: { main: "6 Acertos + 2 Trevos", sub: "Demais Faixas" },
      dataVar: "MAISMILIONARIA_DRAWS"
    },
    timemania: {
      id: "timemania",
      name: "Timemania",
      specialLabel: "7 dezenas + Time do Coração",
      hasSpecial: false,
      drawCount: 7,
      tiers: [
        { key: "7", name: "7 Acertos", minHits: 7 },
        { key: "6", name: "6 Acertos", minHits: 6 },
        { key: "5", name: "5 Acertos", minHits: 5 },
        { key: "4", name: "4 Acertos", minHits: 4 },
        { key: "3", name: "3 Acertos", minHits: 3 },
        { key: "time", name: "Time do Coração", minHits: 0 }
      ],
      tablePrizeCols: { main: "7 Acertos", sub: "6 a 3 e Time do Coração" },
      dataVar: "TIMEMANIA_DRAWS"
    },
    duplasena: {
      id: "duplasena",
      name: "Dupla Sena",
      specialLabel: "Dupla de Páscoa",
      hasSpecial: true,
      drawCount: 6,
      tiers: [
        { key: "6", name: "Sena (1º)", minHits: 6 },
        { key: "5", name: "Quina (1º)", minHits: 5 },
        { key: "4", name: "Quadra (1º)", minHits: 4 },
        { key: "3", name: "Terno (1º)", minHits: 3 },
        { key: "2_6", name: "Sena (2º)", minHits: 6 },
        { key: "2_5", name: "Quina (2º)", minHits: 5 },
        { key: "2_4", name: "Quadra (2º)", minHits: 4 },
        { key: "2_3", name: "Terno (2º)", minHits: 3 }
      ],
      tablePrizeCols: { main: "Sena 1º Sorteio", sub: "2º Sorteio e Demais Faixas" },
      dataVar: "DUPLASENA_DRAWS"
    },
    diadesorte: {
      id: "diadesorte",
      name: "Dia de Sorte",
      specialLabel: "7 dezenas + Mês da Sorte",
      hasSpecial: false,
      drawCount: 7,
      tiers: [
        { key: "7", name: "7 Acertos", minHits: 7 },
        { key: "6", name: "6 Acertos", minHits: 6 },
        { key: "5", name: "5 Acertos", minHits: 5 },
        { key: "4", name: "4 Acertos", minHits: 4 },
        { key: "mes", name: "Mês da Sorte", minHits: 0 }
      ],
      tablePrizeCols: { main: "7 Acertos", sub: "6, 5, 4 e Mês da Sorte" },
      dataVar: "DIADESORTE_DRAWS"
    },
    supersete: {
      id: "supersete",
      name: "Super Sete",
      specialLabel: "7 colunas numeradas (0 a 9)",
      hasSpecial: false,
      drawCount: 7,
      tiers: [
        { key: "7", name: "7 Colunas", minHits: 7 },
        { key: "6", name: "6 Colunas", minHits: 6 },
        { key: "5", name: "5 Colunas", minHits: 5 },
        { key: "4", name: "4 Colunas", minHits: 4 },
        { key: "3", name: "3 Colunas", minHits: 3 }
      ],
      tablePrizeCols: { main: "7 Colunas", sub: "6, 5, 4 e 3 Colunas" },
      dataVar: "SUPERSETE_DRAWS"
    }
  };

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

  function formatCompactBRL(value) {
    if (value >= 1e9) {
      return `R$ ${(value / 1e9).toFixed(2).replace(".", ",")} bi`;
    }
    if (value >= 1e6) {
      return `R$ ${(value / 1e6).toFixed(2).replace(".", ",")} mi`;
    }
    return brlFmt.format(value);
  }

  function initTheme() {
    let saved = "light";
    try {
      saved = localStorage.getItem("loterias_theme") === "dark" ? "dark" : "light";
    } catch (e) { }
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeBtn(saved);
  }

  function updateThemeBtn(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = theme === "dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    btn.title = isDark ? "Tema atual: Escuro (clique para Claro)" : "Tema atual: Claro (clique para Escuro)";
    const iconSvg = isDark
      ? '<svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 10.2A5.5 5.5 0 0 1 5.8 2.8a5.5 5.5 0 1 0 7.4 7.4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
      : '<svg class="nav-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
    btn.innerHTML = `${iconSvg}<span class="btn-label-text" id="theme-toggle-text">${isDark ? "Escuro" : "Claro"}</span>`;
  }

  function getViradaEditions() {
    const raw = Array.isArray(window.MEGASENA_DRAWS) ? window.MEGASENA_DRAWS : [];
    if (!Specials) return [];
    return Specials.getSpecialDraws("megasena", raw)
      .map((d) => {
        const sp = Specials.getSpecialDrawInfo("megasena", d);
        const p6 = (d.p && d.p["6"]) || { g: 0, v: 0 };
        const p5 = (d.p && d.p["5"]) || { g: 0, v: 0 };
        const totalSena = Specials.computeTotalMainPrize("megasena", d);
        return {
          draw: d,
          sp,
          p6: { g: Number(p6.g || 0), v: Number(p6.v || 0) },
          p5: { g: Number(p5.g || 0), v: Number(p5.v || 0) },
          totalSena
        };
      })
      .sort((a, b) => a.sp.year - b.sp.year);
  }

  function renderHeroAndRecords(editions) {
    const heroStatsEl = document.getElementById("hero-dossier-stats");
    const recordsEl = document.getElementById("virada-records-strip");
    if (!editions.length) return;

    const totalWinners = editions.reduce((acc, e) => acc + e.p6.g, 0);
    const totalPrize = editions.reduce((acc, e) => acc + e.totalSena, 0);
    const maxTotalEd = editions.slice().sort((a, b) => b.totalSena - a.totalSena)[0];
    const maxPerWinnerEd = editions.slice().sort((a, b) => b.p6.v - a.p6.v)[0];
    const maxWinnersEd = editions.slice().sort((a, b) => b.p6.g - a.p6.g)[0];
    const firstYear = editions[0].sp.year;
    const lastYear = editions[editions.length - 1].sp.year;

    if (heroStatsEl) {
      heroStatsEl.innerHTML = `
        <div class="dossier-stat">
          <span class="dossier-stat-label">Edições Realizadas</span>
          <span class="dossier-stat-val">${editions.length} edições</span>
          <span class="dossier-stat-sub">De ${firstYear} (#${editions[0].draw.c}) a ${lastYear} (#${editions[editions.length - 1].draw.c})</span>
        </div>
        <div class="dossier-stat">
          <span class="dossier-stat-label">Total Pago na Sena</span>
          <span class="dossier-stat-val">${formatCompactBRL(totalPrize)}</span>
          <span class="dossier-stat-sub">Soma das faixas principais</span>
        </div>
        <div class="dossier-stat">
          <span class="dossier-stat-label">Apostas Ganhadoras</span>
          <span class="dossier-stat-val">${intFmt.format(totalWinners)} bilhetes</span>
          <span class="dossier-stat-sub">100% das edições tiveram ganhadores</span>
        </div>
        <div class="dossier-stat">
          <span class="dossier-stat-label">Maior Prêmio da História</span>
          <span class="dossier-stat-val">${formatCompactBRL(maxTotalEd.totalSena)}</span>
          <span class="dossier-stat-sub">Edição ${maxTotalEd.sp.year} (#${maxTotalEd.draw.c}) com ${maxTotalEd.p6.g} apostas</span>
        </div>
      `;
    }

    if (recordsEl) {
      recordsEl.innerHTML = `
        <div class="kpi-item">
          <p class="kpi-title">Maior Prêmio Total Distribuído</p>
          <p class="kpi-num">${brlFmt.format(maxTotalEd.totalSena)}</p>
          <p class="kpi-sub">Edição ${maxTotalEd.sp.year} (Concurso #${maxTotalEd.draw.c}), dividido por ${maxTotalEd.p6.g} apostas</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Maior Prêmio Individual por Aposta</p>
          <p class="kpi-num">${brlFmt.format(maxPerWinnerEd.p6.v)}</p>
          <p class="kpi-sub">Edição ${maxPerWinnerEd.sp.year} (Concurso #${maxPerWinnerEd.draw.c}), apenas ${maxPerWinnerEd.p6.g} apostas</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Recorde de Bilhetes Ganhadores</p>
          <p class="kpi-num">${intFmt.format(maxWinnersEd.p6.g)} apostas na Sena</p>
          <p class="kpi-sub">Edição ${maxWinnersEd.sp.year} (Concurso #${maxWinnersEd.draw.c}): ${brlFmt.format(maxWinnersEd.p6.v)} cada</p>
        </div>
      `;
    }
  }

  function renderPrizeChart(editions) {
    const container = document.getElementById("virada-prize-chart");
    if (!container || !editions.length) return;

    const w = 780;
    const h = 260;
    const padL = 58;
    const padR = 16;
    const padT = 22;
    const padB = 42;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxVal = Math.max(...editions.map((e) => e.totalSena), 1);
    const barSlot = plotW / editions.length;
    const barW = Math.max(14, barSlot * 0.68);

    const gridSteps = [0, 0.25, 0.5, 0.75, 1];
    const gridLines = gridSteps
      .map((ratio) => {
        const y = padT + plotH - ratio * plotH;
        const valMi = Math.round((maxVal * ratio) / 1e6);
        const label = valMi >= 1000 ? `${(valMi / 1000).toFixed(1).replace(".", ",")} bi` : `${valMi} mi`;
        return `
          <line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1" stroke-dasharray="3 3"/>
          <text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10" font-family="var(--font-mono)" fill="var(--text-muted)">${label}</text>
        `;
      })
      .join("");

    const bars = editions
      .map((ed, idx) => {
        const barH = Math.max(4, (ed.totalSena / maxVal) * plotH);
        const x = padL + idx * barSlot + (barSlot - barW) / 2;
        const y = padT + plotH - barH;
        const isRecord = ed.totalSena === maxVal;
        const fill = isRecord ? "var(--virada-gold-border)" : "var(--accent)";
        const valLabel = ed.totalSena >= 1e9
          ? `${(ed.totalSena / 1e9).toFixed(2).replace(".", ",")}B`
          : `${Math.round(ed.totalSena / 1e6)}M`;

        return `
          <g>
            <title>${ed.sp.year} (#${ed.draw.c}): ${brlFmt.format(ed.totalSena)} (${ed.p6.g} ganhadores)</title>
            <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="${fill}"/>
            <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="9" font-family="var(--font-mono)" font-weight="700" fill="var(--text)">${valLabel}</text>
            <text x="${(x + barW / 2).toFixed(1)}" y="${h - 18}" text-anchor="middle" font-size="9.5" font-family="var(--font-mono)" fill="var(--text-muted)">${String(ed.sp.year).slice(-2)}</text>
          </g>
        `;
      })
      .join("");

    container.innerHTML = `
      <svg class="virada-chart-svg" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        ${gridLines}
        ${bars}
        <text x="${padL + plotW / 2}" y="${h - 4}" text-anchor="middle" font-size="10" fill="var(--text-muted)">Ano da Edição (2009 a 2025)</text>
      </svg>
    `;
  }

  function renderHistoryTable(editions, sortBy) {
    const tbody = document.getElementById("virada-history-tbody");
    if (!tbody) return;

    const list = editions.slice();
    if (sortBy === "total_desc") {
      list.sort((a, b) => b.totalSena - a.totalSena);
    } else if (sortBy === "winners_desc") {
      list.sort((a, b) => b.p6.g - a.p6.g || b.sp.year - a.sp.year);
    } else if (sortBy === "per_winner_desc") {
      list.sort((a, b) => b.p6.v - a.p6.v);
    } else {
      list.sort((a, b) => b.sp.year - a.sp.year);
    }

    tbody.innerHTML = list
      .map((ed) => {
        const balls = (ed.draw.n || [])
          .slice()
          .sort((a, b) => a - b)
          .map((n) => `<span class="ball">${pad2(n)}</span>`)
          .join("");
        return `
          <tr>
            <td data-label="Edição"><strong>${ed.sp.edition}ª (${ed.sp.year})</strong></td>
            <td data-label="Concurso / Data"><strong>#${ed.draw.c}</strong><br><span style="font-size:0.8rem;color:var(--text-muted);">${ed.draw.d}</span></td>
            <td data-label="Dezenas"><div class="balls-row">${balls}</div></td>
            <td data-label="Ganhadores Sena"><span class="badge win">${intFmt.format(ed.p6.g)} ${ed.p6.g === 1 ? "aposta" : "apostas"}</span></td>
            <td data-label="Prêmio por Aposta"><span class="prize-val">${brlFmt.format(ed.p6.v)}</span></td>
            <td data-label="Prêmio Total Sena"><span class="prize-val">${brlFmt.format(ed.totalSena)}</span></td>
            <td data-label="Quina">${intFmt.format(ed.p5.g)} (${brlFmt.format(ed.p5.v)})</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderNumberStats(editions) {
    const topEl = document.getElementById("virada-top-numbers");
    const parityEl = document.getElementById("virada-parity-chart");
    const neverEl = document.getElementById("virada-never-drawn");
    if (!editions.length) return;

    const counts = Array(61).fill(0);
    const parityCounts = {};
    for (let i = 0; i <= 6; i++) parityCounts[i] = 0;

    editions.forEach((ed) => {
      let evens = 0;
      (ed.draw.n || []).forEach((n) => {
        if (n >= 1 && n <= 60) counts[n]++;
        if (n % 2 === 0) evens++;
      });
      parityCounts[evens] = (parityCounts[evens] || 0) + 1;
    });

    const items = [];
    for (let n = 1; n <= 60; n++) {
      items.push({ num: n, count: counts[n] });
    }
    items.sort((a, b) => b.count - a.count || a.num - b.num);

    if (topEl) {
      const top12 = items.slice(0, 12);
      const maxCount = top12[0] ? top12[0].count : 1;
      topEl.innerHTML = top12
        .map((it) => {
          const pct = Math.max(8, Math.round((it.count / maxCount) * 100));
          return `
            <div class="bar-row">
              <span>Dezena <strong>${pad2(it.num)}</strong></span>
              <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${pct}%"></div></div>
              <span>${it.count}x (${((it.count / editions.length) * 100).toFixed(0)}%)</span>
            </div>
          `;
        })
        .join("");
    }

    if (parityEl) {
      const rows = Object.keys(parityCounts)
        .map((k) => ({ evens: Number(k), count: parityCounts[k] }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count);
      const maxP = Math.max(...rows.map((r) => r.count), 1);
      parityEl.innerHTML = rows
        .map((r) => {
          const pct = Math.max(6, Math.round((r.count / maxP) * 100));
          const share = ((r.count / editions.length) * 100).toFixed(1);
          return `
            <div class="bar-row">
              <span><strong>${r.evens}P / ${6 - r.evens}I</strong></span>
              <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${pct}%"></div></div>
              <span>${share}% (${r.count})</span>
            </div>
          `;
        })
        .join("");
    }

    if (neverEl) {
      const never = items.filter((x) => x.count === 0);
      neverEl.innerHTML = never.length
        ? never.map((x) => `<span class="ball">${pad2(x.num)}</span>`).join("")
        : '<span style="font-size:0.85rem;color:var(--text-muted);">Todas as 60 dezenas já foram sorteadas pelo menos uma vez.</span>';
    }
  }

  function initCountdown() {
    const daysEl = document.getElementById("cd-days");
    const hoursEl = document.getElementById("cd-hours");
    const minsEl = document.getElementById("cd-mins");
    const secsEl = document.getElementById("cd-secs");
    const titleEl = document.getElementById("countdown-title");
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    const targetMs = new Date("2026-12-31T22:00:00-03:00").getTime();

    function tick() {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        if (titleEl) titleEl.textContent = "Prazo de apostas do Concurso #3100 encerrado em 31/12/2026 às 22h BRT.";
        daysEl.textContent = "00";
        hoursEl.textContent = "00";
        minsEl.textContent = "00";
        secsEl.textContent = "00";
        return false;
      }
      const totalSecs = Math.floor(diff / 1000);
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      daysEl.textContent = String(d).padStart(2, "0");
      hoursEl.textContent = pad2(h);
      minsEl.textContent = pad2(m);
      secsEl.textContent = pad2(s);
      return true;
    }

    if (tick()) {
      const timer = setInterval(() => {
        if (!tick()) clearInterval(timer);
      }, 1000);
    }
  }

  function renderBolaoCalculator() {
    const dezEl = document.getElementById("calc-dezenas");
    const cotasEl = document.getElementById("calc-cotas");
    const outEl = document.getElementById("bolao-calc-results");
    if (!dezEl || !cotasEl || !outEl) return;

    const k = Math.max(6, Math.min(20, Number(dezEl.value) || 10));
    const cotas = Math.max(1, Math.min(100, Number(cotasEl.value) || 1));
    const combos = comb(k, 6);
    const totalCost = combos * 6.0;
    const costPerCota = totalCost / cotas;
    const oddsSena = Math.round(comb(60, 6) / combos);
    const soloPrize = 1000000000 / cotas;
    const split6Prize = 1000000000 / 6 / cotas;

    outEl.innerHTML = `
      <div class="calc-res-item">
        <span class="calc-res-label">Equivalência em Jogos Simples</span>
        <span class="calc-res-val">${intFmt.format(combos)} apostas</span>
      </div>
      <div class="calc-res-item">
        <span class="calc-res-label">Custo Total do Volante</span>
        <span class="calc-res-val">${brlFmt.format(totalCost)}</span>
      </div>
      <div class="calc-res-item">
        <span class="calc-res-label">Valor por Cota (${cotas}x)</span>
        <span class="calc-res-val">${brlFmt.format(costPerCota)}</span>
      </div>
      <div class="calc-res-item">
        <span class="calc-res-label">Probabilidade na Sena (${intFmt.format(combos)}x)</span>
        <span class="calc-res-val">1 em ${intFmt.format(oddsSena)}</span>
      </div>
      <div class="calc-res-item">
        <span class="calc-res-label">Prêmio/Cota (1 Ganhador em R$ 1 bi)</span>
        <span class="calc-res-val">${formatCompactBRL(soloPrize)}</span>
      </div>
      <div class="calc-res-item">
        <span class="calc-res-label">Prêmio/Cota (Se 6 Ganhadores)</span>
        <span class="calc-res-val">${formatCompactBRL(split6Prize)}</span>
      </div>
    `;
  }

  function showViradaError(msg) {
    const errEl = document.getElementById("virada-checkout-error");
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
      errEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function showPaymentToast(title, message) {
    const toast = document.getElementById("payment-toast");
    if (!toast) return;
    const titleEl = document.getElementById("payment-toast-title");
    const bodyEl = document.getElementById("payment-toast-body");
    if (titleEl && title) titleEl.textContent = title;
    if (bodyEl && message) bodyEl.textContent = message;
    toast.hidden = false;
    setTimeout(() => {
      toast.hidden = true;
    }, 8000);
  }

  function getAllLotteriesDataMap() {
    const out = {};
    Object.keys(LOTTERY_META).forEach((k) => {
      const cfg = LOTTERY_META[k];
      out[k] = { cfg, draws: Array.isArray(window[cfg.dataVar]) ? window[cfg.dataVar] : [] };
    });
    return out;
  }

  function wireBuyButton(btn) {
    if (!btn || !Store) return;
    btn.addEventListener("click", () => {
      const pid = btn.dataset.productId;
      if (!pid) return;
      const errEl = document.getElementById("virada-checkout-error");
      if (errEl) errEl.hidden = true;
      Store.startCheckout(pid, {
        buttonEl: btn,
        onError: (msg) => showViradaError(msg)
      });
    });
  }

  async function runSecureViradaExport(fn) {
    const errEl = document.getElementById("virada-checkout-error");
    if (errEl) errEl.hidden = true;
    try {
      await fn();
    } catch (err) {
      renderStoreSection();
      showViradaError(err.message || "Falha na validação criptográfica do pagamento.");
    }
  }

  function renderViradaEmailBox() {
    if (!Store) return;
    const box = document.getElementById("virada-email-delivery-box");
    const sel = document.getElementById("virada-email-target");
    const emailInput = document.getElementById("virada-email-input");
    if (!box || !sel) return;

    const options = [];
    if (Store.hasAllLotteries()) {
      options.push({ value: "all", label: "Combo 9 Loterias Completo (Multi-Abas .xlsx)" });
    }
    Store.ALL_LOTTERIES.forEach((id) => {
      if (Store.hasLotteryAccess(id)) {
        const cfg = LOTTERY_META[id];
        options.push({ value: id, label: `Planilha ${cfg.name} (${cfg.specialLabel}) (.xlsx)` });
      }
    });
    if (Store.hasEntitlement("kit_bolao_virada")) {
      options.push({ value: "kit_bolao_virada", label: "Kit Bolão Mega da Virada 2026 (.xlsx)" });
    }
    if (Store.hasEntitlement("dossie_especiais")) {
      options.push({ value: "dossie_especiais", label: "Dossiê Concursos Especiais 6 Abas (.xlsx)" });
    }

    if (options.length === 0) {
      box.hidden = true;
      return;
    }

    sel.innerHTML = options
      .map((o) => `<option value="${o.value}">${o.label}</option>`)
      .join("");
    if (emailInput) {
      const verifiedEmail = Store.getVerifiedCustomerEmail && Store.getVerifiedCustomerEmail();
      if (verifiedEmail && !emailInput.value) {
        emailInput.value = verifiedEmail;
      }
    }
    box.hidden = false;
  }

  async function sendViradaEmail() {
    if (!Store) return;
    const sel = document.getElementById("virada-email-target");
    const emailInput = document.getElementById("virada-email-input");
    const btn = document.getElementById("btn-virada-send-email");
    const statusEl = document.getElementById("virada-email-status");
    const errEl = document.getElementById("virada-checkout-error");

    if (errEl) errEl.hidden = true;
    if (statusEl) statusEl.hidden = true;

    const target = sel ? sel.value : "";
    const recipientEmail = emailInput ? emailInput.value.trim() : "";

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      showViradaError("Informe um endereço de e-mail válido para receber a planilha.");
      if (emailInput) emailInput.focus();
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Enviando...";
    }

    try {
      let res;
      if (target === "all") {
        res = await Store.sendExportByEmail({
          recipientEmail,
          target: "all",
          lotteryConfigsMap: LOTTERY_META,
          getDrawsFn: (k) => window[LOTTERY_META[k].dataVar] || []
        });
      } else if (target === "kit_bolao_virada") {
        res = await Store.sendExportByEmail({
          recipientEmail,
          target: "kit_bolao_virada",
          draws: window.MEGASENA_DRAWS || []
        });
      } else if (target === "dossie_especiais") {
        res = await Store.sendExportByEmail({
          recipientEmail,
          target: "dossie_especiais",
          allLotteriesDataMap: getAllLotteriesDataMap()
        });
      } else if (LOTTERY_META[target]) {
        const cfg = LOTTERY_META[target];
        res = await Store.sendExportByEmail({
          recipientEmail,
          target,
          lotteryCfg: cfg,
          draws: window[cfg.dataVar] || [],
          scopeTag: "_Completo"
        });
      } else {
        throw new Error("Selecione uma planilha válida.");
      }

      if (statusEl) {
        statusEl.textContent =
          (res && res.message) ||
          `Planilha enviada com sucesso para ${recipientEmail} (remetente: ${Store.SUPPORT_EMAIL}).`;
        statusEl.hidden = false;
      }
    } catch (err) {
      renderStoreSection();
      showViradaError(err.message || "Falha ao enviar planilha por e-mail.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Enviar Planilha por E-mail";
      }
    }
  }

  function renderStoreSection() {
    if (!Store) return;
    renderViradaEmailBox();

    const lotteryGrid = document.getElementById("virada-lottery-products");
    if (lotteryGrid) {
      lotteryGrid.innerHTML = Store.ALL_LOTTERIES.map((id) => {
        const cfg = LOTTERY_META[id];
        const prod = Store.getProductByLottery(id);
        const draws = Array.isArray(window[cfg.dataVar]) ? window[cfg.dataVar] : [];
        const spCount = Specials ? Specials.getSpecialDraws(id, draws).length : 0;
        const owned = Store.hasLotteryAccess(id);

        const descText = spCount > 0
          ? `${intFmt.format(draws.length)} concursos oficiais e ${intFmt.format(spCount)} edições da ${cfg.specialLabel}.`
          : `${intFmt.format(draws.length)} concursos oficiais (${cfg.specialLabel}).`;

        return `
          <article class="product-card ${owned ? "is-owned" : ""}">
            <div class="product-card-top">
              <strong class="product-title">${cfg.name}</strong>
              <span class="product-format-tag">${owned ? "Liberado" : "XLSX + PDF"}</span>
            </div>
            <p class="product-desc">
              ${descText}
            </p>
            <div class="product-price-line">
              ${owned ? '<span class="product-price-main">Acesso Ativo</span>' : `
                <span class="product-price-compare">De R$ 20,00 por</span>
                <span class="product-price-main">R$ 10,00</span>
              `}
            </div>
            <div class="product-actions">
              ${owned
            ? `
                    <button type="button" class="btn btn-primary btn-dl-lot-xlsx" data-lottery="${id}">Baixar Excel (.xlsx)</button>
                    <button type="button" class="btn btn-dl-lot-pdf" data-lottery="${id}">Baixar Relatório (.pdf)</button>
                  `
            : `
                    <button type="button" class="btn btn-primary btn-buy-virada" data-product-id="${prod.id}">Comprar Planilha (R$ 10,00)</button>
                  `
          }
            </div>
          </article>
        `;
      }).join("");

      lotteryGrid.querySelectorAll(".btn-dl-lot-xlsx").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.lottery;
          const cfg = LOTTERY_META[id];
          const draws = Array.isArray(window[cfg.dataVar]) ? window[cfg.dataVar] : [];
          runSecureViradaExport(() => Store.exportLotteryXLSX(cfg, draws, "_Completo"));
        });
      });

      lotteryGrid.querySelectorAll(".btn-dl-lot-pdf").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.lottery;
          const cfg = LOTTERY_META[id];
          const draws = Array.isArray(window[cfg.dataVar]) ? window[cfg.dataVar] : [];
          runSecureViradaExport(() => Store.exportLotteryPDF(cfg, draws, "_Completo"));
        });
      });
    }

    const comboActions = document.getElementById("combo-all-actions");
    if (comboActions) {
      if (Store.hasAllLotteries()) {
        comboActions.innerHTML = `
          <span class="badge win" style="align-self:flex-start;">Todas as 9 loterias liberadas</span>
          <button type="button" id="btn-dl-combo-xlsx" class="btn btn-primary">Baixar Excel Multi-Abas (.xlsx)</button>
          <button type="button" id="btn-dl-combo-pdf" class="btn">Baixar PDF Consolidado</button>
        `;
        const bX = document.getElementById("btn-dl-combo-xlsx");
        const bP = document.getElementById("btn-dl-combo-pdf");
        if (bX) bX.addEventListener("click", () => runSecureViradaExport(() => Store.exportAllLotteriesXLSX(LOTTERY_META, (k) => window[LOTTERY_META[k].dataVar] || [])));
        if (bP) bP.addEventListener("click", () => runSecureViradaExport(() => Store.exportAllLotteriesPDF(LOTTERY_META, (k) => window[LOTTERY_META[k].dataVar] || [])));
      } else {
        comboActions.innerHTML = `
          <div class="product-price-line">
            <span class="product-price-compare">De R$ 90,00 por</span>
            <span class="product-price-main">R$ 24,90</span>
          </div>
          <button type="button" class="btn btn-primary btn-buy-virada" data-product-id="combo_all">
            Comprar Combo 9 Loterias (R$ 24,90)
          </button>
        `;
      }
    }

    const cardBolao = document.getElementById("card-kit_bolao_virada");
    const actionsBolao = document.getElementById("actions-kit_bolao_virada");
    const calcKitBtn = document.getElementById("btn-calc-buy-kit");
    const hasBolao = Store.hasEntitlement("kit_bolao_virada");
    if (cardBolao) cardBolao.classList.toggle("is-owned", hasBolao);
    if (actionsBolao) {
      if (hasBolao) {
        actionsBolao.innerHTML = `
          <button type="button" id="btn-dl-bolao-xlsx" class="btn btn-primary">Baixar Planilha Bolão (.xlsx)</button>
          <button type="button" id="btn-dl-bolao-pdf" class="btn">Baixar Guia Executivo (.pdf)</button>
        `;
        document.getElementById("btn-dl-bolao-xlsx").addEventListener("click", () => {
          runSecureViradaExport(() => Store.exportKitBolaoViradaXLSX(window.MEGASENA_DRAWS || []));
        });
        document.getElementById("btn-dl-bolao-pdf").addEventListener("click", () => {
          runSecureViradaExport(() => Store.exportKitBolaoViradaPDF(window.MEGASENA_DRAWS || []));
        });
      } else {
        actionsBolao.innerHTML = `
          <button type="button" class="btn btn-primary btn-buy-virada" data-product-id="kit_bolao_virada">
            Comprar Kit Bolão (R$ 14,90)
          </button>
        `;
      }
    }
    if (calcKitBtn) {
      if (hasBolao) {
        calcKitBtn.textContent = "Baixar meu Kit Bolão Virada 2026 (.xlsx)";
        calcKitBtn.removeAttribute("data-product-id");
        calcKitBtn.onclick = () => runSecureViradaExport(() => Store.exportKitBolaoViradaXLSX(window.MEGASENA_DRAWS || []));
      } else {
        calcKitBtn.textContent = "Organizar meu Bolão com o Kit Virada 2026 (R$ 14,90)";
        calcKitBtn.dataset.productId = "kit_bolao_virada";
        calcKitBtn.onclick = null;
      }
    }

    const cardDossie = document.getElementById("card-dossie_especiais");
    const actionsDossie = document.getElementById("actions-dossie_especiais");
    const hasDossie = Store.hasEntitlement("dossie_especiais");
    if (cardDossie) cardDossie.classList.toggle("is-owned", hasDossie);
    if (actionsDossie) {
      if (hasDossie) {
        actionsDossie.innerHTML = `
          <button type="button" id="btn-dl-dossie-xlsx" class="btn btn-primary">Baixar Dossiê 6 Abas (.xlsx)</button>
          <button type="button" id="btn-dl-dossie-pdf" class="btn">Baixar Dossiê Completo (.pdf)</button>
        `;
        document.getElementById("btn-dl-dossie-xlsx").addEventListener("click", () => {
          runSecureViradaExport(() => Store.exportDossieEspeciaisXLSX(getAllLotteriesDataMap()));
        });
        document.getElementById("btn-dl-dossie-pdf").addEventListener("click", () => {
          runSecureViradaExport(() => Store.exportDossieEspeciaisPDF(getAllLotteriesDataMap()));
        });
      } else {
        actionsDossie.innerHTML = `
          <button type="button" class="btn btn-primary btn-buy-virada" data-product-id="dossie_especiais">
            Comprar Dossiê Especiais (R$ 19,90)
          </button>
        `;
      }
    }

    const actionsSuper = document.getElementById("actions-super_combo");
    const bannerBtnMs = document.getElementById("btn-banner-buy-ms");
    if (actionsSuper) {
      if (Store.hasAllLotteries() && hasBolao && hasDossie) {
        actionsSuper.innerHTML = '<span class="badge win">Pacote Completo 100% liberado acima</span>';
      } else {
        actionsSuper.innerHTML = `
          <div class="product-price-line">
            <span class="product-price-compare">De R$ 124,80 por</span>
            <span class="product-price-main">R$ 34,90</span>
          </div>
          <button type="button" class="btn btn-primary btn-buy-virada" data-product-id="super_combo">
            Comprar Pacote Completo (R$ 34,90)
          </button>
        `;
      }
    }

    if (bannerBtnMs) {
      if (Store.hasLotteryAccess("megasena")) {
        bannerBtnMs.textContent = "Baixar Planilha Mega-Sena (.xlsx)";
        bannerBtnMs.removeAttribute("data-product-id");
        bannerBtnMs.onclick = () => runSecureViradaExport(() => Store.exportLotteryXLSX(LOTTERY_META.megasena, window.MEGASENA_DRAWS || [], "_Completo"));
      } else {
        bannerBtnMs.textContent = "Planilha Mega-Sena (R$ 10,00)";
        bannerBtnMs.dataset.productId = "export_megasena";
        bannerBtnMs.onclick = null;
      }
    }

    document.querySelectorAll("[data-product-id]").forEach((btn) => {
      if (!btn.dataset.wired) {
        btn.dataset.wired = "1";
        wireBuyButton(btn);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") || "light";
        const next = cur === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("loterias_theme", next);
        } catch (e) { }
        updateThemeBtn(next);
      });
    }

    const editions = getViradaEditions();
    renderHeroAndRecords(editions);
    renderPrizeChart(editions);
    renderHistoryTable(editions, "year_desc");
    renderNumberStats(editions);
    initCountdown();
    renderBolaoCalculator();
    renderStoreSection();

    const sortSel = document.getElementById("virada-sort-select");
    if (sortSel) {
      sortSel.addEventListener("change", () => {
        renderHistoryTable(editions, sortSel.value);
      });
    }

    const calcDez = document.getElementById("calc-dezenas");
    const calcCotas = document.getElementById("calc-cotas");
    if (calcDez) calcDez.addEventListener("change", renderBolaoCalculator);
    if (calcCotas) calcCotas.addEventListener("input", renderBolaoCalculator);

    const sendEmailBtn = document.getElementById("btn-virada-send-email");
    if (sendEmailBtn) {
      sendEmailBtn.addEventListener("click", sendViradaEmail);
    }

    const checkPaidBtn = document.getElementById("btn-virada-check-paid");
    if (checkPaidBtn && Store) {
      checkPaidBtn.addEventListener("click", async () => {
        const inputSession = window.prompt(
          "Se você já concluiu o pagamento no Stripe, informe o identificador da sessão (inicia com cs_...):"
        );
        if (!inputSession) return;
        checkPaidBtn.disabled = true;
        checkPaidBtn.textContent = "Verificando...";
        const res = await Store.verifySession(inputSession);
        checkPaidBtn.disabled = false;
        checkPaidBtn.textContent = "Já paguei: Validar sessão Stripe";
        if (res.ok) {
          renderStoreSection();
          showPaymentToast("Pagamento verificado!", "Seus arquivos já estão disponíveis para download e envio por e-mail.");
        } else {
          showViradaError(res.error || "Sessão não confirmada como paga.");
        }
      });
    }

    const toastClose = document.getElementById("btn-toast-close");
    if (toastClose) {
      toastClose.addEventListener("click", () => {
        const toast = document.getElementById("payment-toast");
        if (toast) toast.hidden = true;
      });
    }

    if (Store) {
      Store.checkStripeReturn({
        onValidating: () => {
          showPaymentToast("Validando pagamento...", "Consultando confirmação criptográfica no Stripe.");
        },
        onSuccess: (data) => {
          renderStoreSection();
          const label = (data && data.productName) || "Produto";
          const amountStr = data && data.amountCents ? Store.formatBRLFromCents(data.amountCents) : "";
          showPaymentToast(
            amountStr ? `Pagamento de ${amountStr} confirmado!` : "Pagamento confirmado!",
            `${label} liberado. Baixe abaixo ou envie a planilha por e-mail.`
          );
          const prodSec = document.getElementById("produtos");
          if (prodSec) prodSec.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        onRevalidated: () => {
          renderStoreSection();
        },
        onCanceled: () => {
          showPaymentToast("Checkout cancelado", "Nenhuma cobrança foi realizada.");
        },
        onError: (msg) => {
          renderStoreSection();
          showViradaError(msg);
        }
      });
    }
  });
})();
