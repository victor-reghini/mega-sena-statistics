(function () {
  "use strict";

  const Specials = window.AtlasSpecials;
  const Store = window.AtlasStore;

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
    },
    maismilionaria: {
      id: "maismilionaria",
      name: "+Milionária",
      mark: "+M",
      title: "Atlas da +Milionária",
      subtitle: "408 sorteios, estatísticas das 50 dezenas + 6 trevos e simulador",
      maxNum: 50,
      drawCount: 6,
      defaultSize: 6,
      allowedSizes: [6, 7, 8, 9, 10],
      hasTrevos: true,
      defaultTrevos: [1, 2],
      startYear: 2022,
      basePrice: 6.0,
      defaultPicks: [4, 12, 21, 33, 41, 48],
      betTable: {
        6: { combos: 1, cost: 6.0 },
        7: { combos: 7, cost: 42.0 },
        8: { combos: 28, cost: 168.0 },
        9: { combos: 84, cost: 504.0 },
        10: { combos: 210, cost: 1260.0 }
      },
      minHitsForPrize: 2,
      tiers: [
        { key: "6+2", name: "6 Acertos + 2 Trevos", minHits: 6, trevos: [2] },
        { key: "6+1", name: "6 Acertos + 1/0 Trevo", minHits: 6, trevos: [1, 0] },
        { key: "5+2", name: "5 Acertos + 2 Trevos", minHits: 5, trevos: [2] },
        { key: "5+1", name: "5 Acertos + 1/0 Trevo", minHits: 5, trevos: [1, 0] },
        { key: "4+2", name: "4 Acertos + 2 Trevos", minHits: 4, trevos: [2] },
        { key: "4+1", name: "4 Acertos + 1/0 Trevo", minHits: 4, trevos: [1, 0] },
        { key: "3+2", name: "3 Acertos + 2 Trevos", minHits: 3, trevos: [2] },
        { key: "3+1", name: "3 Acertos + 1 Trevo", minHits: 3, trevos: [1] },
        { key: "2+2", name: "2 Acertos + 2 Trevos", minHits: 2, trevos: [2] },
        { key: "2+1", name: "2 Acertos + 1 Trevo", minHits: 2, trevos: [1] }
      ],
      tablePrizeCols: { main: "6 + 2 Trevos (Faixa 1)", sub: "6+1/0, 5+2 e demais faixas" },
      dataVar: "MAISMILIONARIA_DRAWS",
      dataFile: "data/maismilionaria.json"
    },
    timemania: {
      id: "timemania",
      name: "Timemania",
      mark: "80",
      title: "Atlas da Timemania",
      subtitle: "2.455 sorteios, métricas das 80 dezenas, Time do Coração e simulador",
      maxNum: 80,
      drawCount: 7,
      defaultSize: 10,
      allowedSizes: [10],
      hasTimeCoracao: true,
      defaultTimeCoracao: "FLAMENGO /RJ",
      startYear: 2008,
      basePrice: 3.5,
      defaultPicks: [4, 11, 19, 25, 34, 43, 52, 61, 70, 78],
      betTable: {
        10: { combos: 1, cost: 3.5 }
      },
      minHitsForPrize: 3,
      tiers: [
        { key: "7", name: "7 Acertos", minHits: 7 },
        { key: "6", name: "6 Acertos", minHits: 6 },
        { key: "5", name: "5 Acertos", minHits: 5 },
        { key: "4", name: "4 Acertos", minHits: 4 },
        { key: "3", name: "3 Acertos", minHits: 3 },
        { key: "time", name: "Time do Coração", minHits: -1 }
      ],
      tablePrizeCols: { main: "7 Acertos", sub: "6 a 3 Acertos e Time do Coração" },
      dataVar: "TIMEMANIA_DRAWS",
      dataFile: "data/timemania.json"
    },
    duplasena: {
      id: "duplasena",
      name: "Dupla Sena",
      mark: "2x",
      title: "Atlas da Dupla Sena",
      subtitle: "3.034 sorteios (1º e 2º sorteios), Dupla de Páscoa e simulador duplo",
      maxNum: 50,
      drawCount: 6,
      defaultSize: 6,
      allowedSizes: [6, 7, 8, 9, 10],
      hasSecondDraw: true,
      startYear: 2001,
      basePrice: 2.5,
      defaultPicks: [3, 11, 18, 27, 36, 45],
      betTable: {
        6: { combos: 1, cost: 2.5 },
        7: { combos: 7, cost: 17.5 },
        8: { combos: 28, cost: 70.0 },
        9: { combos: 84, cost: 210.0 },
        10: { combos: 210, cost: 525.0 }
      },
      minHitsForPrize: 3,
      tiers: [
        { key: "6", name: "1º Sorteio - Sena (6)", minHits: 6, drawIndex: 1 },
        { key: "5", name: "1º Sorteio - Quina (5)", minHits: 5, drawIndex: 1 },
        { key: "4", name: "1º Sorteio - Quadra (4)", minHits: 4, drawIndex: 1 },
        { key: "3", name: "1º Sorteio - Terno (3)", minHits: 3, drawIndex: 1 },
        { key: "2_6", name: "2º Sorteio - Sena (6)", minHits: 6, drawIndex: 2 },
        { key: "2_5", name: "2º Sorteio - Quina (5)", minHits: 5, drawIndex: 2 },
        { key: "2_4", name: "2º Sorteio - Quadra (4)", minHits: 4, drawIndex: 2 },
        { key: "2_3", name: "2º Sorteio - Terno (3)", minHits: 3, drawIndex: 2 }
      ],
      tablePrizeCols: { main: "1º Sorteio (Sena)", sub: "2º Sorteio e Demais Faixas" },
      dataVar: "DUPLASENA_DRAWS",
      dataFile: "data/duplasena.json"
    },
    diadesorte: {
      id: "diadesorte",
      name: "Dia de Sorte",
      mark: "31",
      title: "Atlas do Dia de Sorte",
      subtitle: "1.353 sorteios, estatísticas dos 31 dias + Mês da Sorte e simulador",
      maxNum: 31,
      drawCount: 7,
      defaultSize: 7,
      allowedSizes: [7, 8, 9, 10, 11, 12],
      hasMesSorte: true,
      defaultMesSorte: "Maio",
      startYear: 2018,
      basePrice: 2.5,
      defaultPicks: [2, 7, 11, 15, 20, 25, 30],
      betTable: {
        7: { combos: 1, cost: 2.5 },
        8: { combos: 8, cost: 20.0 },
        9: { combos: 36, cost: 90.0 },
        10: { combos: 120, cost: 300.0 },
        11: { combos: 330, cost: 825.0 },
        12: { combos: 792, cost: 1980.0 }
      },
      minHitsForPrize: 4,
      tiers: [
        { key: "7", name: "7 Acertos", minHits: 7 },
        { key: "6", name: "6 Acertos", minHits: 6 },
        { key: "5", name: "5 Acertos", minHits: 5 },
        { key: "4", name: "4 Acertos", minHits: 4 },
        { key: "mes", name: "Mês da Sorte", minHits: -1 }
      ],
      tablePrizeCols: { main: "7 Acertos", sub: "6, 5, 4 Acertos e Mês da Sorte" },
      dataVar: "DIADESORTE_DRAWS",
      dataFile: "data/diadesorte.json"
    },
    supersete: {
      id: "supersete",
      name: "Super Sete",
      mark: "C7",
      title: "Atlas do Super Sete",
      subtitle: "924 sorteios, estatísticas das 7 colunas (0 a 9) e simulador posicional",
      maxNum: 70,
      drawCount: 7,
      defaultSize: 7,
      allowedSizes: [7, 8, 9, 10, 11, 12, 13, 14],
      isColumnLottery: true,
      startYear: 2020,
      basePrice: 2.5,
      defaultPicks: [3, 18, 29, 39, 46, 55, 67],
      betTable: {
        7: { combos: 1, cost: 2.5 },
        8: { combos: 2, cost: 5.0 },
        9: { combos: 4, cost: 10.0 },
        10: { combos: 8, cost: 20.0 },
        11: { combos: 16, cost: 40.0 },
        12: { combos: 32, cost: 80.0 },
        13: { combos: 64, cost: 160.0 },
        14: { combos: 128, cost: 320.0 }
      },
      minHitsForPrize: 3,
      tiers: [
        { key: "7", name: "7 Colunas", minHits: 7 },
        { key: "6", name: "6 Colunas", minHits: 6 },
        { key: "5", name: "5 Colunas", minHits: 5 },
        { key: "4", name: "4 Colunas", minHits: 4 },
        { key: "3", name: "3 Colunas", minHits: 3 }
      ],
      tablePrizeCols: { main: "7 Colunas", sub: "6, 5, 4 e 3 Colunas" },
      dataVar: "SUPERSETE_DRAWS",
      dataFile: "data/supersete.json"
    }
  };

  const MESES_SORTE = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const DEFAULT_TIMES_CORACAO = [
    "ABC /RN", "AMÉRICA /MG", "AMÉRICA /RJ", "AMÉRICA /RN", "ATHLETICO /PR", "ATLÉTICO /GO", "ATLÉTICO /MG",
    "AVAÍ /SC", "BAHIA /BA", "BANGU /RJ", "BOTAFOGO /PB", "BOTAFOGO /RJ", "BOTAFOGO /SP", "BRAGANTINO /SP",
    "BRASILIENSE /DF", "CEARÁ /CE", "CORINTHIANS /SP", "CORITIBA /PR", "CRB /AL", "CRICIÚMA /SC",
    "CRUZEIRO /MG", "CSA /AL", "CUIABÁ /MT", "FIGUEIRENSE /SC", "FLAMENGO /RJ", "FLUMINENSE /RJ",
    "FORTALEZA /CE", "GAMA /DF", "GOIÁS /GO", "GRÊMIO /RS", "GUARANI /SP", "INTER DE LIMEIRA /SP",
    "INTERNACIONAL /RS", "ITUANO /SP", "JOINVILLE /SC", "JUVENTUDE /RS", "JUVENTUS /SP", "LONDRINA /PR",
    "MARÍLIA /SP", "MIRASSOL /SP", "MOTO CLUB /MA", "NÁUTICO /PE", "NOVORIZONTINO /SP", "OESTE /SP",
    "OPERÁRIO /PR", "PALMAS /TO", "PALMEIRAS /SP", "PARANÁ /PR", "PAYSANDU /PA", "PONTE PRETA /SP",
    "PORTUGUESA /SP", "REMO /PA", "RIVER /PI", "SAMPAIO CORRÊA /MA", "SANTA CRUZ /PE", "SANTO ANDRÉ /SP",
    "SANTOS /SP", "SÃO CAETANO /SP", "SÃO PAULO /SP", "SÃO RAIMUNDO /AM", "SERGIPE /SE", "SPORT /PE",
    "TREZE /PB", "TUNA LUSO /PA", "UBERLÂNDIA /MG", "UNIÃO BARBARENSE /SP", "UNIÃO SÃO JOÃO /SP",
    "VASCO DA GAMA /RJ", "VILA NOVA /GO", "VILLA NOVA /MG", "VITÓRIA /BA", "XV DE PIRACICABA /SP", "YPIRANGA /AP"
  ];

  const state = {
    lottery: "megasena",
    draws: [],
    loading: true,
    error: null,
    betSize: 6,
    selectedNumbers: new Set([1, 10, 13, 20, 37, 38]),
    selectedTrevos: new Set([1, 2]),
    selectedTimeCoracao: "FLAMENGO /RJ",
    selectedMesSorte: "Maio",
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
    specialScope: false,
    filterSearch: "",
    filterNumber: "",
    filterSpecial: "all",
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

  function formatNumLabel(n, cfg) {
    const c = cfg || getCurrentLottery();
    if (c && c.isColumnLottery) {
      const col = Math.floor((n - 1) / 10) + 1;
      const dig = (n - 1) % 10;
      return `C${col}:${dig}`;
    }
    return pad2(n);
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCurrentLottery() {
    return LOTTERY_CONFIGS[state.lottery] || LOTTERY_CONFIGS.megasena;
  }

  function getAnalysisDraws() {
    if (!state.specialScope || !Specials) return state.draws;
    return Specials.getSpecialDraws(state.lottery, state.draws);
  }

  function updateSpecialUI() {
    const cfg = getCurrentLottery();
    const meta = Specials ? Specials.getSpecialMeta(cfg.id) : null;
    const specialDraws = Specials ? Specials.getSpecialDraws(cfg.id, state.draws) : [];
    const specialName = meta ? meta.name : "Concursos Especiais";
    const specialCount = specialDraws.length;

    document.querySelectorAll(".special-chip[data-special-lottery]").forEach((btn) => {
      const target = btn.dataset.specialLottery;
      const active =
        target === state.lottery &&
        (state.specialScope || state.filterSpecial === "special");
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const resetChip = document.getElementById("btn-clear-special-scope");
    if (resetChip) {
      resetChip.hidden = !state.specialScope && state.filterSpecial === "all";
    }

    const scopeLabel = document.getElementById("simulator-scope-label");
    const scopeMeta = document.getElementById("simulator-scope-meta");
    if (scopeLabel) {
      scopeLabel.textContent = state.specialScope && meta
        ? `Base ativa no simulador e métricas: Somente ${specialName}`
        : `Base ativa no simulador e métricas: Todos os concursos da ${cfg.name}`;
    }
    if (scopeMeta) {
      if (!meta) {
        scopeMeta.textContent = `${intFmt.format(state.draws.length)} concursos oficiais na base histórica`;
      } else {
        scopeMeta.textContent = state.specialScope
          ? `${intFmt.format(specialCount)} edições especiais (${meta.ruleNote})`
          : `${intFmt.format(state.draws.length)} concursos no total (${intFmt.format(specialCount)} edições de ${specialName})`;
      }
    }

    const btnAll = document.getElementById("btn-scope-all");
    const btnSpec = document.getElementById("btn-scope-special");
    if (btnAll) btnAll.setAttribute("aria-pressed", state.specialScope ? "false" : "true");
    if (btnSpec) {
      btnSpec.hidden = !meta;
      btnSpec.textContent = `Somente ${meta ? meta.shortName : "Especiais"} (${specialCount})`;
      btnSpec.setAttribute("aria-pressed", state.specialScope ? "true" : "false");
    }

    const statsToggle = document.getElementById("btn-stats-special-toggle");
    if (statsToggle) {
      statsToggle.hidden = !meta;
      statsToggle.setAttribute("aria-pressed", state.specialScope ? "true" : "false");
      statsToggle.classList.toggle("btn-primary", state.specialScope);
      statsToggle.textContent = state.specialScope
        ? `Voltar para todos os ${intFmt.format(state.draws.length)} concursos`
        : `Filtrar somente ${specialName} (${specialCount})`;
    }

    const optSpecialOnly = document.getElementById("opt-filter-special-only");
    if (optSpecialOnly) {
      optSpecialOnly.disabled = !meta;
      optSpecialOnly.textContent = meta
        ? `Somente ${specialName} (${specialCount})`
        : "Sem concurso especial nesta modalidade";
    }

    const costAllOpt = document.querySelector('#cost-mode-select option[value="all"]');
    if (costAllOpt) {
      const count = getAnalysisDraws().length;
      costAllOpt.textContent = state.specialScope && meta
        ? `Custo Acumulado nos ${intFmt.format(count)} Concursos (${specialName})`
        : `Custo Acumulado nos ${intFmt.format(count)} Concursos (Teimosinha Histórica)`;
    }
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

  function calcMultiplePrizes(k, h, drawPrizes, extraInfo = {}) {
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
    const combosTotal = (cfg.betTable[k] && cfg.betTable[k].combos) || 1;

    if (cfg.id === "maismilionaria") {
      const trevoHits = Number(extraInfo.trevoHits || 0);
      cfg.tiers.forEach((tier) => {
        const m = tier.minHits;
        if (tier.trevos && tier.trevos.includes(trevoHits) && h >= m && (drawn - m) <= missed && (drawn - m) >= 0) {
          const count = comb(h, m) * comb(missed, drawn - m);
          if (count > 0) {
            const val = (drawPrizes && drawPrizes[tier.key] && drawPrizes[tier.key].v) || 0;
            const subtotal = count * val;
            res.totalValue += subtotal;
            res.breakdown.push({ tier: tier.name, count, value: subtotal });
          }
        }
      });
      return res;
    }

    if (cfg.id === "duplasena") {
      const h2 = Number(extraInfo.h2 || 0);
      const missed2 = k - h2;
      cfg.tiers.forEach((tier) => {
        const m = tier.minHits;
        const activeH = tier.drawIndex === 2 ? h2 : h;
        const activeMissed = tier.drawIndex === 2 ? missed2 : missed;
        if (activeH >= m && (drawn - m) <= activeMissed && (drawn - m) >= 0) {
          const count = comb(activeH, m) * comb(activeMissed, drawn - m);
          if (count > 0) {
            const val = (drawPrizes && drawPrizes[tier.key] && drawPrizes[tier.key].v) || 0;
            const subtotal = count * val;
            res.totalValue += subtotal;
            res.breakdown.push({ tier: tier.name, count, value: subtotal });
          }
        }
      });
      return res;
    }

    cfg.tiers.forEach((tier) => {
      if (tier.key === "time") {
        if (extraInfo.timeHit) {
          const val = (drawPrizes && drawPrizes.time && drawPrizes.time.v) || 0;
          const subtotal = combosTotal * val;
          res.totalValue += subtotal;
          res.breakdown.push({ tier: tier.name, count: combosTotal, value: subtotal });
        }
        return;
      }
      if (tier.key === "mes") {
        if (extraInfo.mesHit) {
          const val = (drawPrizes && drawPrizes.mes && drawPrizes.mes.v) || 0;
          const subtotal = combosTotal * val;
          res.totalValue += subtotal;
          res.breakdown.push({ tier: tier.name, count: combosTotal, value: subtotal });
        }
        return;
      }

      const m = tier.minHits;
      if (m >= 0 && h >= m && (drawn - m) <= missed && (drawn - m) >= 0) {
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

  function getAvailableTimesCoracao() {
    const set = new Set(DEFAULT_TIMES_CORACAO);
    if (Array.isArray(state.draws)) {
      state.draws.forEach((d) => {
        if (d && d.tm) set.add(String(d.tm).trim());
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function buildExtraVolanteControls() {
    const cfg = getCurrentLottery();
    const extraEl = document.getElementById("volante-extra-controls");
    if (!extraEl) return;

    if (cfg.hasTrevos) {
      extraEl.hidden = false;
      const trevosArr = [1, 2, 3, 4, 5, 6];
      extraEl.innerHTML = `
        <span class="field-label">Trevos da Sorte (selecione 2 trevos de 1 a 6):</span>
        <div class="trevos-grid" role="group" aria-label="Trevos numerados de 1 a 6">
          ${trevosArr
            .map(
              (t) => `
            <button type="button" class="trevo-btn" data-trevo="${t}" aria-pressed="${state.selectedTrevos.has(t) ? "true" : "false"}">
              <span>Trevo ${t}</span>
            </button>
          `
            )
            .join("")}
        </div>
      `;
      extraEl.querySelectorAll(".trevo-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const t = Number(btn.dataset.trevo);
          toggleTrevo(t);
        });
      });
      return;
    }

    if (cfg.hasTimeCoracao) {
      extraEl.hidden = false;
      const times = getAvailableTimesCoracao();
      if (!times.includes(state.selectedTimeCoracao)) {
        state.selectedTimeCoracao = times[0] || "FLAMENGO /RJ";
      }
      extraEl.innerHTML = `
        <div class="field-group">
          <label class="field-label" for="select-time-coracao">Escolha o seu Time do Coração (80 clubes):</label>
          <select id="select-time-coracao" class="select-input">
            ${times
              .map(
                (tm) =>
                  `<option value="${escapeHtml(tm)}" ${tm === state.selectedTimeCoracao ? "selected" : ""}>${escapeHtml(tm)}</option>`
              )
              .join("")}
          </select>
        </div>
      `;
      const sel = document.getElementById("select-time-coracao");
      if (sel) {
        sel.addEventListener("change", (e) => {
          state.selectedTimeCoracao = e.target.value;
          syncVolanteUI();
          renderSimulation();
          renderDrawsTable();
        });
      }
      return;
    }

    if (cfg.hasMesSorte) {
      extraEl.hidden = false;
      if (!MESES_SORTE.includes(state.selectedMesSorte)) {
        state.selectedMesSorte = "Maio";
      }
      extraEl.innerHTML = `
        <div class="field-group">
          <label class="field-label" for="select-mes-sorte">Escolha o seu Mês da Sorte:</label>
          <select id="select-mes-sorte" class="select-input">
            ${MESES_SORTE.map(
              (m) => `<option value="${escapeHtml(m)}" ${m === state.selectedMesSorte ? "selected" : ""}>${escapeHtml(m)}</option>`
            ).join("")}
          </select>
        </div>
      `;
      const sel = document.getElementById("select-mes-sorte");
      if (sel) {
        sel.addEventListener("change", (e) => {
          state.selectedMesSorte = e.target.value;
          syncVolanteUI();
          renderSimulation();
          renderDrawsTable();
        });
      }
      return;
    }

    extraEl.hidden = true;
    extraEl.innerHTML = "";
  }

  function toggleTrevo(t) {
    const msgEl = document.getElementById("simulator-alert");
    if (msgEl) msgEl.hidden = true;
    if (state.selectedTrevos.has(t)) {
      if (state.selectedTrevos.size <= 1) return;
      state.selectedTrevos.delete(t);
    } else {
      if (state.selectedTrevos.size >= 2) {
        const first = Array.from(state.selectedTrevos)[0];
        state.selectedTrevos.delete(first);
      }
      state.selectedTrevos.add(t);
    }
    syncVolanteUI();
    renderSimulation();
    renderDrawsTable();
  }

  function buildVolanteButtons() {
    const cfg = getCurrentLottery();
    const container = document.getElementById("volante-grid");
    if (!container) return;
    container.innerHTML = "";
    container.setAttribute("aria-label", `Volante da ${cfg.name}`);

    if (cfg.isColumnLottery) {
      const colsWrap = document.createElement("div");
      colsWrap.className = "volante-supersete-cols";
      for (let col = 0; col < 7; col++) {
        const colDiv = document.createElement("div");
        colDiv.className = "supersete-col";
        const hdr = document.createElement("div");
        hdr.className = "supersete-col-header";
        hdr.textContent = `C${col + 1}`;
        colDiv.appendChild(hdr);
        for (let dig = 0; dig <= 9; dig++) {
          const cellId = col * 10 + dig + 1;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "dezena-btn";
          btn.dataset.num = String(cellId);
          btn.textContent = String(dig);
          const isSelected = state.selectedNumbers.has(cellId);
          btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
          btn.setAttribute("aria-label", `Coluna ${col + 1} dígito ${dig}`);
          btn.addEventListener("click", () => toggleDezena(cellId));
          colDiv.appendChild(btn);
        }
        colsWrap.appendChild(colDiv);
      }
      container.appendChild(colsWrap);
    } else {
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

    buildExtraVolanteControls();
  }

  function syncVolanteUI() {
    const cfg = getCurrentLottery();
    const buttons = document.querySelectorAll("#volante-grid .dezena-btn");
    buttons.forEach((btn) => {
      const n = Number(btn.dataset.num);
      btn.setAttribute("aria-pressed", state.selectedNumbers.has(n) ? "true" : "false");
    });

    const trevoBtns = document.querySelectorAll("#volante-extra-controls .trevo-btn");
    trevoBtns.forEach((btn) => {
      const t = Number(btn.dataset.trevo);
      btn.setAttribute("aria-pressed", state.selectedTrevos.has(t) ? "true" : "false");
    });

    const sizePills = document.querySelectorAll(".size-pill");
    sizePills.forEach((pill) => {
      const sz = Number(pill.dataset.size);
      pill.setAttribute("aria-pressed", sz === state.betSize ? "true" : "false");
    });

    const info = cfg.betTable[state.betSize] || { combos: 1, cost: cfg.basePrice };
    const picked = Array.from(state.selectedNumbers).sort((a, b) => a - b);
    let extraSummary = "";
    if (cfg.hasTrevos) {
      const trs = Array.from(state.selectedTrevos).sort((a, b) => a - b);
      extraSummary = ` | <strong>Trevos:</strong> ${trs.map((t) => "T" + t).join(", ")}`;
    } else if (cfg.hasTimeCoracao) {
      extraSummary = ` | <strong>Time:</strong> ${escapeHtml(state.selectedTimeCoracao)}`;
    } else if (cfg.hasMesSorte) {
      extraSummary = ` | <strong>Mês:</strong> ${escapeHtml(state.selectedMesSorte)}`;
    }

    const summaryEl = document.getElementById("ticket-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `
        <span><strong>Selecionadas (${picked.length}/${state.betSize}):</strong> ${picked.length ? picked.map((n) => formatNumLabel(n, cfg)).join(", ") : "nenhuma"}${extraSummary}</span>
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
    if (cfg.isColumnLottery) {
      const chosen = new Set();
      for (let col = 0; col < 7; col++) {
        const dig = Math.floor(Math.random() * 10);
        chosen.add(col * 10 + dig + 1);
      }
      while (chosen.size < state.betSize) {
        const col = Math.floor(Math.random() * 7);
        const dig = Math.floor(Math.random() * 10);
        chosen.add(col * 10 + dig + 1);
      }
      state.selectedNumbers = chosen;
    } else {
      const pool = [];
      for (let i = 1; i <= cfg.maxNum; i++) pool.push(i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
      }
      state.selectedNumbers = new Set(pool.slice(0, state.betSize));
    }

    if (cfg.hasTrevos) {
      const tPool = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      state.selectedTrevos = new Set(tPool.slice(0, 2));
    }
    if (cfg.hasTimeCoracao) {
      const times = getAvailableTimesCoracao();
      if (times.length) {
        state.selectedTimeCoracao = times[Math.floor(Math.random() * times.length)];
        const sel = document.getElementById("select-time-coracao");
        if (sel) sel.value = state.selectedTimeCoracao;
      }
    }
    if (cfg.hasMesSorte) {
      state.selectedMesSorte = MESES_SORTE[Math.floor(Math.random() * MESES_SORTE.length)];
      const sel = document.getElementById("select-mes-sorte");
      if (sel) sel.value = state.selectedMesSorte;
    }

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
      panel.innerHTML = `<div class="status-banner error" role="alert">Erro ao carregar sorteios: ${escapeHtml(state.error)}.</div>`;
      return;
    }

    const analysisDraws = getAnalysisDraws();
    const meta = Specials ? Specials.getSpecialMeta(cfg.id) : null;
    const scopeText = state.specialScope && meta
      ? `${intFmt.format(analysisDraws.length)} concursos de ${meta.name}`
      : `todos os ${intFmt.format(analysisDraws.length)} concursos da ${cfg.name}`;

    if (analysisDraws.length === 0) {
      panel.innerHTML = `<div class="status-banner" role="status">Nenhum concurso encontrado no escopo selecionado para a ${cfg.name}.</div>`;
      return;
    }

    const pickedCount = state.selectedNumbers.size;
    if (pickedCount < state.betSize) {
      const faltam = state.betSize - pickedCount;
      panel.innerHTML = `
        <div class="status-banner" role="status">
          <strong>Aguardando preenchimento:</strong> selecione mais <strong>${faltam}</strong> ${faltam === 1 ? "dezena" : "dezenas"} no volante ao lado (ou clique em "Surpresinha") para validar sua aposta de ${state.betSize} dezenas contra ${scopeText}.
        </div>
      `;
      return;
    }

    const k = state.betSize;
    const betCostSingle = (cfg.betTable[k] && cfg.betTable[k].cost) || cfg.basePrice;
    const totalDraws = analysisDraws.length;
    const betCostAll = betCostSingle * totalDraws;

    let maxHits = 0;
    const hitsByCount = {};
    for (let i = 0; i <= cfg.drawCount; i++) hitsByCount[i] = 0;
    const allEvaluated = [];
    const winningDraws = [];

    let totalGrossWon = 0;

    for (let i = 0; i < totalDraws; i++) {
      const d = analysisDraws[i];
      const matched1 = d.n.filter((num) => state.selectedNumbers.has(num));
      const h1 = matched1.length;

      let h = h1;
      let matched = matched1;
      const extraInfo = {};

      if (cfg.hasTrevos) {
        const matchedTrevos = (d.tr || []).filter((t) => state.selectedTrevos.has(t));
        extraInfo.trevoHits = matchedTrevos.length;
      } else if (cfg.hasTimeCoracao) {
        extraInfo.timeHit = Boolean(d.tm && state.selectedTimeCoracao && d.tm.toUpperCase() === state.selectedTimeCoracao.toUpperCase());
      } else if (cfg.hasMesSorte) {
        extraInfo.mesHit = Boolean(d.ms && state.selectedMesSorte && d.ms.toLowerCase() === state.selectedMesSorte.toLowerCase());
      } else if (cfg.hasSecondDraw) {
        const matched2 = (d.n2 || []).filter((num) => state.selectedNumbers.has(num));
        extraInfo.h2 = matched2.length;
        if (matched2.length > h1) {
          h = matched2.length;
          matched = matched2;
        }
      }

      hitsByCount[h] = (hitsByCount[h] || 0) + 1;
      if (h > maxHits) maxHits = h;

      const prizeCalc = calcMultiplePrizes(k, h1, d.p, extraInfo);
      if (prizeCalc.totalValue > 0 || h >= cfg.minHitsForPrize) {
        totalGrossWon += prizeCalc.totalValue;
        winningDraws.push({ draw: d, hits: h, matched, prizeCalc });
      }
      if (h >= Math.max(1, cfg.minHitsForPrize - 1) || prizeCalc.totalValue > 0) {
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
      const spTop = Specials ? Specials.getSpecialDrawInfo(cfg.id, top.draw) : null;
      const topLabel = spTop ? ` (${spTop.label})` : "";
      const breakdownText = top.prizeCalc.breakdown.map((b) => `${b.count}x ${b.tier}`).join(" + ") || "Prêmio Oficial";

      topHeadlineHTML = `
        <div class="highlight-box ${netBalance >= 0 ? "positive" : "negative"}" role="region" aria-label="Destaque de maior acerto">
          <strong>Maior acerto encontrado (${maxHits} dezenas):</strong> No <strong>concurso #${top.draw.c}${escapeHtml(topLabel)}</strong> (${top.draw.d}) você teria acertado <strong>${top.hits} dezenas</strong> (${top.matched.map((n) => formatNumLabel(n, cfg)).join(", ")}), recebendo <strong>${brlFmt.format(top.prizeCalc.totalValue)}</strong> (${breakdownText}).
          ${bestDraws.length > 1 ? `<div style="margin-top:6px;font-size:0.875rem;">Você atingiu ${maxHits} acertos em <strong>${bestDraws.length} concursos</strong> no total.</div>` : ""}
        </div>
      `;
    } else {
      topHeadlineHTML = `
        <div class="highlight-box negative" role="region" aria-label="Sem premiação nos sorteios passados">
          <strong>Nenhum prêmio oficial encontrado:</strong> O jogo obteve no máximo <strong>${maxHits} acertos</strong> em concursos como ${bestDraws.slice(0, 3).map((x) => `#${x.draw.c}`).join(", ") || "nenhum"}, abaixo da faixa de premiação no recorte selecionado.
        </div>
      `;
    }

    const rowsHTML = winningDraws
      .slice(0, 20)
      .map((item) => {
        const sp = Specials ? Specials.getSpecialDrawInfo(cfg.id, item.draw) : null;
        const breakdown = item.prizeCalc.breakdown.map((b) => `${b.count}x ${b.tier}`).join(", ") || "Premiação";
        return `
          <tr class="${sp ? "draw-row-special" : ""}">
            <td data-label="Concurso"><strong>#${item.draw.c}</strong>${sp ? `<span class="special-draw-tag">${escapeHtml(sp.label)}</span>` : ""}</td>
            <td data-label="Data">${escapeHtml(item.draw.d)}</td>
            <td data-label="Acertos"><span class="badge ${item.hits >= cfg.drawCount ? "win" : "hit"}">${item.hits} acertos</span></td>
            <td data-label="Dezenas">${item.matched.map((n) => formatNumLabel(n, cfg)).join(", ") || "-"}</td>
            <td data-label="Prêmios">${breakdown}</td>
            <td data-label="Valor Total"><strong>${brlFmt.format(item.prizeCalc.totalValue)}</strong></td>
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
          <p class="kpi-sub">${winningDraws.length} sorteios premiados (${state.specialScope && meta ? meta.shortName : "histórico"})</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Custo Considerado (${state.costMode === "all" ? "Período Ativo" : "1 Concurso"})</p>
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
        <p style="margin:0 0 8px;font-weight:700;">Concursos Premiados (${intFmt.format(winningDraws.length)} no recorte):</p>
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
        ` : `<p class="section-desc" style="margin:0;">Nenhum sorteio atingiu o patamar mínimo de premiação neste recorte.</p>`}
      </div>
    `;
  }

  function computeStatistics() {
    const cfg = getCurrentLottery();
    const analysisDraws = getAnalysisDraws();
    const totalDraws = analysisDraws.length;
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
      const d = analysisDraws[idx];
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
      firstDraw: totalDraws ? analysisDraws[0] : null,
      latestDraw: totalDraws ? analysisDraws[totalDraws - 1] : null,
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
    const kpiStrip = document.getElementById("kpi-strip");
    if (!stats.totalDraws) {
      if (kpiStrip) {
        kpiStrip.innerHTML = `<div class="status-banner">Nenhum sorteio encontrado para o filtro de análise atual.</div>`;
      }
      const freqMatrix = document.getElementById("freq-matrix");
      if (freqMatrix) freqMatrix.innerHTML = "";
      updateDrawsOrderLabels();
      updateSpecialUI();
      return;
    }

    const latest = stats.latestDraw || state.draws[state.draws.length - 1];
    const most = stats.byMost[0];
    const least = stats.byLeast[0];
    const mostDelayed = stats.byDelay[0];
    const meta = Specials ? Specials.getSpecialMeta(cfg.id) : null;

    if (kpiStrip) {
      kpiStrip.innerHTML = `
        <div class="kpi-item">
          <p class="kpi-title">Total de Concursos (${state.specialScope && meta ? meta.shortName : cfg.name})</p>
          <p class="kpi-num">${intFmt.format(stats.totalDraws)} sorteios</p>
          <p class="kpi-sub">Último no recorte: #${latest.c} em ${latest.d} (${Math.round((stats.accumulatedCount / stats.totalDraws) * 100)}% acumularam)</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Dezena Mais Sorteada</p>
          <p class="kpi-num">Dezena ${formatNumLabel(most.num, cfg)} (${most.count}x)</p>
          <p class="kpi-sub">Presente em ${((most.count / stats.totalDraws) * 100).toFixed(1)}% dos concursos</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Dezena Menos Sorteada</p>
          <p class="kpi-num">Dezena ${formatNumLabel(least.num, cfg)} (${least.count}x)</p>
          <p class="kpi-sub">Diferença de ${most.count - least.count} sorteios para a líder</p>
        </div>
        <div class="kpi-item">
          <p class="kpi-title">Maior Atraso Atual</p>
          <p class="kpi-num">Dezena ${formatNumLabel(mostDelayed.num, cfg)} (${mostDelayed.delay} jogos)</p>
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
    updateSpecialUI();
  }

  function renderFrequencyMatrix(stats) {
    const cfg = getCurrentLottery();
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
        <div class="freq-cell ${top10Nums.has(item.num) ? "hot" : ""}" title="Dezena ${formatNumLabel(item.num, cfg)}: ${item.count} sorteios, atraso de ${item.delay} concursos">
          <span class="freq-num">${formatNumLabel(item.num, cfg)}</span>
          <span class="freq-count">${item.count}x</span>
          <span class="freq-count">atraso: ${item.delay}</span>
        </div>
      `
      )
      .join("");
  }

  function renderDelayChart(stats) {
    const cfg = getCurrentLottery();
    const el = document.getElementById("delay-chart");
    if (!el) return;
    const topDelayed = stats.byDelay.slice(0, 10);
    const maxDelay = topDelayed[0] ? topDelayed[0].delay : 1;
    el.innerHTML = topDelayed
      .map((item) => {
        const pct = Math.max(4, Math.round((item.delay / maxDelay) * 100));
        return `
          <div class="bar-row">
            <span>Dezena <strong>${formatNumLabel(item.num, cfg)}</strong></span>
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
      const label = cfg.isColumnLottery ? `Coluna ${r + 1}` : `${pad2(start)} a ${pad2(end)}`;
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

    const latestConcurso = (stats.latestDraw && stats.latestDraw.c) || (state.draws.length ? state.draws[state.draws.length - 1].c : 0);
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
              ? `<p class="kpi-num">${topProj.map((n) => formatNumLabel(n, cfg)).join(" - ")}</p>`
              : `<div class="balls-row" style="margin:4px 0 2px;">${topProj.map((n) => `<span class="ball hit" style="width:30px;height:30px;font-size:0.72rem;">${formatNumLabel(n, cfg)}</span>`).join("")}</div>`
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
              <span class="extrap-num">${formatNumLabel(x.num, cfg)}</span>
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

  const LOTTERY_PRICE_ERAS = {
    megasena: [
      { startYear: 1996, endYear: 1999, label: "1996 a 1999", price: 1.00 },
      { startYear: 1999, endYear: 2002, label: "1999 a 2002", price: 1.25 },
      { startYear: 2002, endYear: 2008, label: "2002 a 2008", price: 1.50 },
      { startYear: 2008, endYear: 2009, label: "2008 a 2009", price: 1.75 },
      { startYear: 2009, endYear: 2014, label: "2009 a 2014", price: 2.00 },
      { startYear: 2014, endYear: 2015, label: "2014 a 2015", price: 2.50 },
      { startYear: 2015, endYear: 2019, label: "2015 a 2019", price: 3.50 },
      { startYear: 2019, endYear: 2023, label: "2019 a 2023", price: 4.50 },
      { startYear: 2023, endYear: 2025, label: "2023 a 2025", price: 5.00 },
      { startYear: 2025, endYear: 2027, label: "2025 a 2026", price: 6.00 }
    ],
    lotofacil: [
      { startYear: 2003, endYear: 2009, label: "2003 a 2009", price: 1.00 },
      { startYear: 2009, endYear: 2014, label: "2009 a 2014", price: 1.25 },
      { startYear: 2014, endYear: 2015, label: "2014 a 2015", price: 1.50 },
      { startYear: 2015, endYear: 2019, label: "2015 a 2019", price: 2.00 },
      { startYear: 2019, endYear: 2023, label: "2019 a 2023", price: 2.50 },
      { startYear: 2023, endYear: 2027, label: "2023 a 2026", price: 3.00 }
    ],
    quina: [
      { startYear: 1994, endYear: 2002, label: "1994 a 2002", price: 0.50 },
      { startYear: 2002, endYear: 2009, label: "2002 a 2009", price: 0.75 },
      { startYear: 2009, endYear: 2014, label: "2009 a 2014", price: 1.00 },
      { startYear: 2014, endYear: 2015, label: "2014 a 2015", price: 1.50 },
      { startYear: 2015, endYear: 2019, label: "2015 a 2019", price: 2.00 },
      { startYear: 2019, endYear: 2023, label: "2019 a 2023", price: 2.00 },
      { startYear: 2023, endYear: 2027, label: "2023 a 2026", price: 2.50 }
    ],
    lotomania: [
      { startYear: 1999, endYear: 2009, label: "1999 a 2009", price: 1.00 },
      { startYear: 2009, endYear: 2014, label: "2009 a 2014", price: 1.25 },
      { startYear: 2014, endYear: 2015, label: "2014 a 2015", price: 1.50 },
      { startYear: 2015, endYear: 2019, label: "2015 a 2019", price: 2.00 },
      { startYear: 2019, endYear: 2023, label: "2019 a 2023", price: 2.50 },
      { startYear: 2023, endYear: 2027, label: "2023 a 2026", price: 3.00 }
    ],
    maismilionaria: [
      { startYear: 2022, endYear: 2027, label: "2022 a 2026", price: 6.00 }
    ],
    timemania: [
      { startYear: 2008, endYear: 2015, label: "2008 a 2015", price: 2.00 },
      { startYear: 2015, endYear: 2019, label: "2015 a 2019", price: 2.00 },
      { startYear: 2019, endYear: 2023, label: "2019 a 2023", price: 3.00 },
      { startYear: 2023, endYear: 2027, label: "2023 a 2026", price: 3.50 }
    ],
    duplasena: [
      { startYear: 2001, endYear: 2009, label: "2001 a 2009", price: 1.00 },
      { startYear: 2009, endYear: 2015, label: "2009 a 2015", price: 1.00 },
      { startYear: 2015, endYear: 2019, label: "2015 a 2019", price: 2.00 },
      { startYear: 2019, endYear: 2027, label: "2019 a 2026", price: 2.50 }
    ],
    diadesorte: [
      { startYear: 2018, endYear: 2023, label: "2018 a 2023", price: 2.00 },
      { startYear: 2023, endYear: 2027, label: "2023 a 2026", price: 2.50 }
    ],
    supersete: [
      { startYear: 2020, endYear: 2027, label: "2020 a 2026", price: 2.50 }
    ]
  };

  function getLotteryUnitPrice(lotteryId, year, adjustMode) {
    const eras = LOTTERY_PRICE_ERAS[lotteryId] || LOTTERY_PRICE_ERAS.megasena;
    if (adjustMode === "official") {
      const found = eras.find((e) => year >= e.startYear && year < e.endYear);
      if (found) return found.price;
      return eras[eras.length - 1].price;
    }
    const base = eras[0].price;
    const startYr = eras[0].startYear;
    const steps = Math.max(0, Math.floor((year - startYr) / 3));
    return Number((base * Math.pow(1.25, steps)).toFixed(2));
  }

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

    const cdiMonthly = invMonthlyRate["selic_cdi"];
    let totalSpent = 0;
    const eraStats = {};

    for (let ym = startYM; ym <= endYM; ym++) {
      const year = Math.floor(ym / 12);
      const unitPrice = getLotteryUnitPrice(state.lottery, year, state.spendAdjustMode);
      const singleBetCost = unitPrice * combosPerBet;
      const monthSpend = singleBetCost * betsPerMonth;
      totalSpent += monthSpend;

      INVESTMENT_OPTIONS.forEach((opt) => {
        invBalances[opt.id] = (invBalances[opt.id] + monthSpend) * (1 + invMonthlyRate[opt.id]);
      });

      const eras = LOTTERY_PRICE_ERAS[state.lottery] || LOTTERY_PRICE_ERAS.megasena;
      const matchedEra = eras.find((e) => year >= e.startYear && year < e.endYear) || eras[eras.length - 1];
      const eraKey = state.spendAdjustMode === "official" ? matchedEra.label : `Ciclo ${year}`;
      if (!eraStats[eraKey]) {
        eraStats[eraKey] = {
          label: eraKey,
          unitPrice,
          months: 0,
          bets: 0,
          spent: 0,
          cdiToday: 0
        };
      }
      eraStats[eraKey].months += 1;
      eraStats[eraKey].bets += betsPerMonth;
      eraStats[eraKey].spent += monthSpend;
      const monthsUntilNow = endYM - ym;
      eraStats[eraKey].cdiToday += monthSpend * Math.pow(1 + cdiMonthly, monthsUntilNow);
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

    // Gráfico de barras comparativo de investimentos
    const chartEl = document.getElementById("spend-investments-chart");
    if (chartEl) {
      const maxVal = Math.max(totalSpent, ...Object.values(invBalances));
      const chartItems = [
        { name: "Total Apostado", val: totalSpent, color: "var(--danger-text)" },
        ...INVESTMENT_OPTIONS.map((opt) => ({
          name: opt.name.split(" (")[0],
          val: invBalances[opt.id],
          color: "var(--accent)"
        }))
      ];
      chartEl.innerHTML = chartItems.map((it) => {
        const pct = Math.max(6, Math.round((it.val / (maxVal || 1)) * 100));
        return `
          <div class="bar-row" style="grid-template-columns: 140px minmax(0, 1fr) auto;">
            <span style="font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${it.name}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%;background:${it.color};"></div>
            </div>
            <strong style="font-size:0.85rem;color:${it.color};">${brlFmt.format(it.val)}</strong>
          </div>
        `;
      }).join("");
    }

    // Detalhamento por investimento
    const cardsEl = document.getElementById("spend-investments-cards");
    if (cardsEl) {
      cardsEl.innerHTML = INVESTMENT_OPTIONS.map((opt) => {
        const finalBal = invBalances[opt.id];
        const profit = finalBal - totalSpent;
        const mult = (finalBal / (totalSpent || 1)).toFixed(1).replace(".", ",");
        return `
          <div class="extrato-row-card">
            <div class="extrato-row-top">
              <strong>${opt.name}</strong>
              <span class="badge-status ${profit >= 0 ? "success" : "danger"}">${profit >= 0 ? "+" + mult + "x o valor gasto" : "Prejuízo"}</span>
            </div>
            <div class="extrato-row-bottom">
              <span>Saldo Acumulado: <strong style="color:var(--success-text);">${brlFmt.format(finalBal)}</strong></span>
              <span>Lucro Líquido: <strong>+${brlFmt.format(profit)}</strong></span>
            </div>
          </div>
        `;
      }).join("");
    }

    // Detalhamento por época histórica de preços da Caixa
    const erasEl = document.getElementById("spend-eras-list");
    if (erasEl) {
      erasEl.innerHTML = Object.values(eraStats).map((era) => {
        return `
          <div class="extrato-row-card">
            <div class="extrato-row-top">
              <strong>Época ${era.label}</strong>
              <span class="badge-status">${brlFmt.format(era.unitPrice)} / bilhete</span>
            </div>
            <div class="extrato-row-mid">
              ${era.months} meses ativos • ${intFmt.format(era.bets)} apostas realizadas
            </div>
            <div class="extrato-row-bottom">
              <span>Gasto no ciclo: <strong style="color:var(--danger-text);">${brlFmt.format(era.spent)}</strong></span>
              <span>Teria hoje no CDI: <strong style="color:var(--success-text);">${brlFmt.format(era.cdiToday)}</strong></span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  function renderDrawBallsHTML(cfg, d) {
    if (cfg.hasSecondDraw && Array.isArray(d.n2) && d.n2.length > 0) {
      const b1 = d.n
        .map((n) => `<span class="ball ${state.selectedNumbers.has(n) ? "hit" : ""}">${pad2(n)}</span>`)
        .join("");
      const b2 = d.n2
        .map((n) => `<span class="ball ${state.selectedNumbers.has(n) ? "hit" : ""}">${pad2(n)}</span>`)
        .join("");
      return `
        <div class="draw-pair-block">
          <div class="draw-pair-row"><span class="draw-pair-label">1º:</span>${b1}</div>
          <div class="draw-pair-row"><span class="draw-pair-label">2º:</span>${b2}</div>
        </div>
      `;
    }

    const baseBalls = d.n
      .map((n) => `<span class="ball ${state.selectedNumbers.has(n) ? "hit" : ""}">${formatNumLabel(n, cfg)}</span>`)
      .join("");

    if (cfg.hasTrevos && Array.isArray(d.tr) && d.tr.length > 0) {
      const trevosHTML = d.tr
        .map((t) => `<span class="ball ball-trevo ${state.selectedTrevos.has(t) ? "hit" : ""}" title="Trevo ${t}">T${t}</span>`)
        .join("");
      return `<div class="balls-row">${baseBalls}${trevosHTML}</div>`;
    }

    if (cfg.hasTimeCoracao && d.tm) {
      const isHit = state.selectedTimeCoracao && d.tm.toUpperCase() === state.selectedTimeCoracao.toUpperCase();
      return `<div class="balls-row">${baseBalls}<span class="ball-extra-badge ${isHit ? "hit" : ""}">${escapeHtml(d.tm)}</span></div>`;
    }

    if (cfg.hasMesSorte && d.ms) {
      const isHit = state.selectedMesSorte && d.ms.toLowerCase() === state.selectedMesSorte.toLowerCase();
      return `<div class="balls-row">${baseBalls}<span class="ball-extra-badge ${isHit ? "hit" : ""}">${escapeHtml(d.ms)}</span></div>`;
    }

    return `<div class="balls-row">${baseBalls}</div>`;
  }

  function getFilteredDraws() {
    const q = state.filterSearch.trim().toLowerCase();
    const numFilter = state.filterNumber ? Number(state.filterNumber) : null;
    const status = state.filterStatus;
    const specialFilter = state.filterSpecial;

    const filtered = state.draws.filter((d) => {
      if (q) {
        const matchConcurso = String(d.c).includes(q);
        const matchDate = d.d.toLowerCase().includes(q);
        const matchTeam = d.tm ? d.tm.toLowerCase().includes(q) : false;
        const matchMonth = d.ms ? d.ms.toLowerCase().includes(q) : false;
        if (!matchConcurso && !matchDate && !matchTeam && !matchMonth) return false;
      }
      if (numFilter && !d.n.includes(numFilter) && !(Array.isArray(d.n2) && d.n2.includes(numFilter))) return false;
      if (specialFilter === "special" && Specials && !Specials.isSpecialDraw(state.lottery, d)) return false;
      if (specialFilter === "regular" && Specials && Specials.isSpecialDraw(state.lottery, d)) return false;
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
        const sp = Specials ? Specials.getSpecialDrawInfo(cfg.id, d) : null;
        const ballsBlockHTML = renderDrawBallsHTML(cfg, d);

        const mainTierKey = cfg.tiers[0].key;
        const mainPz = (d.p && d.p[mainTierKey]) || { g: 0, v: 0 };
        const mainWon = mainPz.g > 0;
        const mainTotal = Specials ? Specials.computeTotalMainPrize(cfg.id, d) : mainPz.v;

        let mainPrizeHTML = "";
        if (mainWon) {
          mainPrizeHTML = `
            <span class="badge win">${intFmt.format(mainPz.g)} ${mainPz.g === 1 ? "ganhador" : "ganhadores"}</span>
            <span class="prize-val">${brlFmt.format(mainPz.v)}</span>
          `;
        } else if (sp && !d.a) {
          mainPrizeHTML = `
            <span class="badge hit">Sem acertador na 1ª faixa (rateado abaixo)</span>
            <span class="prize-val">${brlFmt.format(mainTotal)}</span>
          `;
        } else {
          mainPrizeHTML = `
            <span class="badge acum">Acumulou</span>
            <span class="prize-val">${brlFmt.format(mainPz.v)}</span>
          `;
        }

        const subTiers = cfg.id === "duplasena" ? [cfg.tiers[4], cfg.tiers[1]] : cfg.tiers.slice(1, 3);
        const subPrizesHTML = subTiers
          .filter(Boolean)
          .map((t) => {
            const pz = (d.p && d.p[t.key]) || { g: 0, v: 0 };
            return `<span style="display:block;font-size:0.8125rem;">${t.name}: <strong>${intFmt.format(pz.g)}</strong> (${brlFmt.format(pz.v)})</span>`;
          })
          .join("");

        return `
          <tr class="${sp ? "draw-row-special" : ""}">
            <td data-label="Concurso"><strong>#${d.c}</strong>${sp ? `<span class="special-draw-tag">${escapeHtml(sp.label)}</span>` : ""}</td>
            <td data-label="Data">${escapeHtml(d.d)}</td>
            <td data-label="Dezenas">${ballsBlockHTML}</td>
            <td data-label="Prêmio Principal">${mainPrizeHTML}</td>
            <td data-label="Demais Faixas">${subPrizesHTML}</td>
            <td data-label="Ações"><button type="button" class="btn btn-sm btn-open-draw" data-concurso="${d.c}">Detalhes</button></td>
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
    const sp = Specials ? Specials.getSpecialDrawInfo(cfg.id, d) : null;

    title.textContent = sp
      ? `${sp.label} - Concurso #${d.c} (${d.d})`
      : `${cfg.name} - Concurso #${d.c} (${d.d})`;
    const ballsBlockHTML = renderDrawBallsHTML(cfg, d);

    const prizesHTML = cfg.tiers.map((t) => {
      const pz = (d.p && d.p[t.key]) || { g: 0, v: 0 };
      return `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">
          <span><strong>${t.name}:</strong></span>
          <span>${intFmt.format(pz.g)} apostas &mdash; <strong>${brlFmt.format(pz.v)}</strong></span>
        </div>
      `;
    }).join("");

    const specialBannerHTML = sp
      ? `<div class="highlight-box" style="margin-bottom:14px;"><strong>${escapeHtml(sp.label)} (${sp.edition}ª edição):</strong> ${escapeHtml(sp.ruleNote)}</div>`
      : "";

    body.innerHTML = `
      ${specialBannerHTML}
      <div style="margin-bottom:14px;">
        <p style="margin:0 0 8px;"><strong>Dezenas sorteadas:</strong></p>
        ${ballsBlockHTML}
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
    sel.innerHTML = `<option value="">Todas as dezenas (${formatNumLabel(1, cfg)} a ${formatNumLabel(cfg.maxNum, cfg)})</option>`;
    for (let i = 1; i <= cfg.maxNum; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "Dezena " + formatNumLabel(i, cfg);
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
      const meta = Specials ? Specials.getSpecialMeta(cfg.id) : null;
      if (state.specialScope && meta && Specials) {
        const spDraws = Specials.getSpecialDraws(cfg.id, state.draws);
        const spFirst = spDraws[0];
        const spLast = spDraws[spDraws.length - 1];
        if (spFirst && spLast) {
          statsDesc.textContent = `Analisando exclusivamente os ${intFmt.format(spDraws.length)} concursos da ${meta.name} (${spFirst.d} a ${spLast.d}).`;
          return;
        }
      }
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
      } else if (lotteryId === "maismilionaria") {
        const mmMap = { 1: "6+2", 2: "6+1", 3: "5+2", 4: "5+1", 5: "4+2", 6: "4+1", 7: "3+2", 8: "3+1", 9: "2+2", 10: "2+1" };
        k = mmMap[faixa] || null;
        if (k === "6+2" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "timemania") {
        if (faixa >= 1 && faixa <= 5) k = String(8 - faixa);
        else if (faixa === 6) k = "time";
        if (k === "7" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "duplasena") {
        const dsMap = { 1: "6", 2: "5", 3: "4", 4: "3", 5: "2_6", 6: "2_5", 7: "2_4", 8: "2_3" };
        k = dsMap[faixa] || null;
        if (k === "6" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "diadesorte") {
        if (faixa >= 1 && faixa <= 4) k = String(8 - faixa);
        else if (faixa === 5) k = "mes";
        if (k === "7" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      } else if (lotteryId === "supersete") {
        if (faixa >= 1 && faixa <= 5) k = String(8 - faixa);
        if (k === "7" && val === 0) val = Number(item.valorAcumuladoProximoConcurso || item.valorEstimadoProximoConcurso || 0);
      }

      if (k) {
        premios[k] = { g: Number(p.ganhadores || 0), v: Math.round(val * 100) / 100 };
      }
    });

    let nums = item.dezenas.map(Number);
    if (lotteryId === "lotomania") {
      nums = nums.map((x) => (x === 0 ? 100 : x));
    }

    const out = {
      c: Number(item.concurso),
      d: String(item.data || ""),
      n: nums.slice().sort((a, b) => a - b),
      p: premios,
      a: Boolean(item.acumulou)
    };

    if (lotteryId === "maismilionaria") {
      out.tr = (item.trevos || []).map(Number).filter((x) => x >= 1 && x <= 6).sort((a, b) => a - b);
    } else if (lotteryId === "timemania") {
      if (item.timeCoracao) out.tm = String(item.timeCoracao).trim();
    } else if (lotteryId === "duplasena") {
      out.n = nums.slice(0, 6).sort((a, b) => a - b);
      out.n2 = nums.slice(6, 12).sort((a, b) => a - b);
    } else if (lotteryId === "diadesorte") {
      if (item.mesSorte) out.ms = String(item.mesSorte).trim();
    } else if (lotteryId === "supersete") {
      const cols = nums.slice(0, 7);
      out.cols = cols;
      out.n = cols.map((dig, idx) => idx * 10 + dig + 1);
    }

    return out;
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

          const subEl = document.getElementById("brand-subtitle");
          if (subEl) subEl.textContent = `${intFmt.format(state.draws.length)} sorteios, métricas, projeções e simulador financeiro`;

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

  function selectLottery(lotteryId, options = {}) {
    if (!LOTTERY_CONFIGS[lotteryId]) return;
    state.lottery = lotteryId;
    document.documentElement.setAttribute("data-lottery", lotteryId);

    if (options.activateSpecial) {
      state.specialScope = true;
      state.filterSpecial = "special";
    } else if (!options.keepSpecialScope) {
      state.specialScope = false;
      state.filterSpecial = "all";
    }

    const filterSpecialEl = document.getElementById("filter-special");
    if (filterSpecialEl) filterSpecialEl.value = state.filterSpecial;

    document.querySelectorAll(".lottery-btn").forEach((btn) => {
      const active = btn.dataset.lottery === lotteryId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const cfg = LOTTERY_CONFIGS[lotteryId];
    state.betSize = cfg.defaultSize;
    state.spendBetSize = cfg.defaultSize;
    state.spendStartYear = Math.max(cfg.startYear || 1996, 2015);
    state.selectedNumbers = new Set(cfg.defaultPicks);
    if (cfg.hasTrevos) {
      state.selectedTrevos = new Set(cfg.defaultTrevos || [1, 2]);
    }
    if (cfg.hasTimeCoracao) {
      state.selectedTimeCoracao = cfg.defaultTimeCoracao || "FLAMENGO /RJ";
    }
    if (cfg.hasMesSorte) {
      state.selectedMesSorte = cfg.defaultMesSorte || "Maio";
    }
    state.page = 1;

    const markEl = document.getElementById("brand-mark");
    const titleEl = document.getElementById("brand-title");
    const subEl = document.getElementById("brand-subtitle");
    if (markEl) markEl.textContent = cfg.mark;
    if (titleEl) titleEl.textContent = cfg.title;
    if (subEl) subEl.textContent = `${intFmt.format(state.draws.length)} sorteios, métricas, projeções e simulador financeiro`;

    const simTitle = document.getElementById("title-simulador");
    const simDesc = document.getElementById("desc-simulador");
    if (simTitle) simTitle.textContent = `Simulador de Apostas da ${cfg.name}`;
    if (simDesc) simDesc.textContent = `Marque de ${cfg.allowedSizes[0]} a ${cfg.allowedSizes[cfg.allowedSizes.length - 1]} dezenas no volante para conferir seu desempenho contra os concursos históricos da ${cfg.name}.`;

    buildSizePills();
    buildVolanteButtons();
    populateFilterNumberSelect();
    populateSpendBetSizes();
    populateSpendYears();
    syncVolanteUI();

    loadLotteryData(lotteryId);
    updateSpecialUI();
    updateExportButtonUI();
  }

  function activateSpecialMode(lotteryId, scrollTargetId) {
    if (lotteryId && lotteryId !== state.lottery) {
      selectLottery(lotteryId, { activateSpecial: true });
    } else {
      state.specialScope = true;
      state.filterSpecial = "special";
      state.page = 1;
      const filterSpecialEl = document.getElementById("filter-special");
      if (filterSpecialEl) filterSpecialEl.value = "special";
      updateSpecialUI();
      renderMetricsAndCharts();
      renderSimulation();
      renderDrawsTable();
    }
    if (scrollTargetId) {
      const target = document.getElementById(scrollTargetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function setAnalysisSpecialScope(enabled) {
    state.specialScope = Boolean(enabled);
    updateSpecialUI();
    renderMetricsAndCharts();
    renderSimulation();
  }

  function resetSpecialScope() {
    state.specialScope = false;
    state.filterSpecial = "all";
    state.page = 1;
    const filterSpecialEl = document.getElementById("filter-special");
    if (filterSpecialEl) filterSpecialEl.value = "all";
    updateSpecialUI();
    renderMetricsAndCharts();
    renderSimulation();
    renderDrawsTable();
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

    document.querySelectorAll(".special-chip[data-special-lottery]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activateSpecialMode(btn.dataset.specialLottery, "historico");
      });
    });

    const clearSpecialBtn = document.getElementById("btn-clear-special-scope");
    if (clearSpecialBtn) {
      clearSpecialBtn.addEventListener("click", resetSpecialScope);
    }

    const scopeAllBtn = document.getElementById("btn-scope-all");
    if (scopeAllBtn) {
      scopeAllBtn.addEventListener("click", () => setAnalysisSpecialScope(false));
    }

    const scopeSpecialBtn = document.getElementById("btn-scope-special");
    if (scopeSpecialBtn) {
      scopeSpecialBtn.addEventListener("click", () => setAnalysisSpecialScope(true));
    }

    const statsSpecialToggle = document.getElementById("btn-stats-special-toggle");
    if (statsSpecialToggle) {
      statsSpecialToggle.addEventListener("click", () => setAnalysisSpecialScope(!state.specialScope));
    }

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

    const betsMonthEl = document.getElementById("spend-bets-month");
    if (betsMonthEl) {
      betsMonthEl.addEventListener("input", (e) => {
        state.spendBetsPerMonth = Number(e.target.value) || 1;
        renderSpendingSimulator();
      });
    }

    const betSizeEl = document.getElementById("spend-bet-size");
    if (betSizeEl) {
      betSizeEl.addEventListener("change", (e) => {
        state.spendBetSize = Number(e.target.value);
        renderSpendingSimulator();
      });
    }

    const timeModeEl = document.getElementById("spend-time-mode");
    const grpSinceYear = document.getElementById("group-since-year");
    const grpDuration = document.getElementById("group-duration-years");
    if (timeModeEl) {
      timeModeEl.addEventListener("change", (e) => {
        state.spendTimeMode = e.target.value;
        if (grpSinceYear) grpSinceYear.hidden = state.spendTimeMode !== "sinceYear";
        if (grpDuration) grpDuration.hidden = state.spendTimeMode === "sinceYear";
        renderSpendingSimulator();
      });
    }

    const startYearEl = document.getElementById("spend-start-year");
    if (startYearEl) {
      startYearEl.addEventListener("change", (e) => {
        state.spendStartYear = Number(e.target.value);
        renderSpendingSimulator();
      });
    }

    const yearsCountEl = document.getElementById("spend-years-count");
    if (yearsCountEl) {
      yearsCountEl.addEventListener("input", (e) => {
        state.spendYearsCount = Number(e.target.value) || 1;
        renderSpendingSimulator();
      });
    }

    const adjustModeEl = document.getElementById("spend-adjust-mode");
    if (adjustModeEl) {
      adjustModeEl.addEventListener("change", (e) => {
        state.spendAdjustMode = e.target.value;
        renderSpendingSimulator();
      });
    }

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

    const filterSpecialEl = document.getElementById("filter-special");
    if (filterSpecialEl) {
      filterSpecialEl.addEventListener("change", (e) => {
        state.filterSpecial = e.target.value;
        state.page = 1;
        renderDrawsTable();
        updateSpecialUI();
      });
    }

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
      state.filterSpecial = "all";
      state.filterStatus = "all";
      state.sortOrder = "desc";
      state.page = 1;
      document.getElementById("filter-search").value = "";
      document.getElementById("filter-number").value = "";
      if (filterSpecialEl) filterSpecialEl.value = "all";
      document.getElementById("filter-status").value = "all";
      document.getElementById("sort-order").value = "desc";
      renderDrawsTable();
      updateSpecialUI();
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

    // Eventos do Sistema de Exportação Multi-Produto (Stripe)
    const btnOpenExport = document.getElementById("btn-open-export");
    if (btnOpenExport) {
      btnOpenExport.addEventListener("click", () => {
        if (Store && Store.hasLotteryAccess(state.lottery)) {
          openExportDownloadModal();
        } else {
          openExportPayModal(state.lottery);
        }
      });
    }

    const btnOpenUnlockedDownloads = document.getElementById("btn-open-unlocked-downloads");
    if (btnOpenUnlockedDownloads) {
      btnOpenUnlockedDownloads.addEventListener("click", () => {
        closeExportPayModal();
        openExportDownloadModal();
      });
    }

    const payCloseBtn = document.getElementById("pay-modal-close-btn");
    if (payCloseBtn) {
      payCloseBtn.addEventListener("click", closeExportPayModal);
    }

    const downloadCloseBtn = document.getElementById("download-modal-close-btn");
    if (downloadCloseBtn) {
      downloadCloseBtn.addEventListener("click", closeExportDownloadModal);
    }

    const payModalEl = document.getElementById("export-pay-modal");
    if (payModalEl) {
      payModalEl.addEventListener("click", (e) => {
        if (e.target.id === "export-pay-modal") closeExportPayModal();
      });
    }

    const downloadModalEl = document.getElementById("export-download-modal");
    if (downloadModalEl) {
      downloadModalEl.addEventListener("click", (e) => {
        if (e.target.id === "export-download-modal") closeExportDownloadModal();
      });
    }

    document.querySelectorAll("#export-pay-modal [data-product-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!Store) return;
        const pid = btn.dataset.productId;
        if (!pid) return;
        const errBox = document.getElementById("checkout-error-banner");
        if (errBox) errBox.hidden = true;
        Store.startCheckout(pid, {
          buttonEl: btn,
          onError: (msg) => showCheckoutError(msg)
        });
      });
    });

    document.querySelectorAll("#export-download-modal [data-product-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!Store) return;
        const pid = btn.dataset.productId;
        if (!pid) return;
        const statusBox = document.getElementById("export-status-banner");
        if (statusBox) statusBox.hidden = true;
        Store.startCheckout(pid, {
          buttonEl: btn,
          onError: (msg) => {
            if (statusBox) {
              statusBox.hidden = false;
              statusBox.textContent = msg;
            }
          }
        });
      });
    });

    const exportLotterySelect = document.getElementById("export-lottery-select");
    if (exportLotterySelect) {
      exportLotterySelect.addEventListener("change", syncDownloadModalAvailability);
    }

    document.querySelectorAll('input[name="export-scope"]').forEach((radio) => {
      radio.addEventListener("change", syncDownloadModalAvailability);
    });

    const btnCheckPaid = document.getElementById("btn-check-paid");
    if (btnCheckPaid) {
      btnCheckPaid.addEventListener("click", async () => {
        if (!Store) return;
        const inputSession = window.prompt(
          "Se você já concluiu o pagamento no Stripe, informe o identificador da sessão (inicia com cs_...):"
        );
        if (!inputSession) return;
        btnCheckPaid.disabled = true;
        btnCheckPaid.textContent = "Verificando...";
        const res = await Store.verifySession(inputSession);
        btnCheckPaid.disabled = false;
        btnCheckPaid.textContent = "Validar sessão Stripe";
        if (res.ok) {
          updateExportButtonUI();
          closeExportPayModal();
          openExportDownloadModal();
          showPaymentToast("Pagamento verificado com sucesso!", "Seus arquivos desbloqueados já estão disponíveis para download.");
        } else {
          showCheckoutError(res.error || "Sessão não confirmada como paga.");
        }
      });
    }

    const btnXLSX = document.getElementById("btn-download-xlsx");
    if (btnXLSX) {
      btnXLSX.addEventListener("click", () => {
        exportToXLSX();
      });
    }

    const btnPDF = document.getElementById("btn-download-pdf");
    if (btnPDF) {
      btnPDF.addEventListener("click", () => {
        exportToPDF();
      });
    }

    const btnBoth = document.getElementById("btn-download-both");
    if (btnBoth) {
      btnBoth.addEventListener("click", async () => {
        const ok = await exportToXLSX();
        if (ok) {
          setTimeout(() => {
            exportToPDF();
          }, 500);
        }
      });
    }

    const btnSendEmail = document.getElementById("btn-send-export-email");
    if (btnSendEmail) {
      btnSendEmail.addEventListener("click", () => {
        sendExportEmailFromModal();
      });
    }

    const btnToastClose = document.getElementById("btn-toast-close");
    if (btnToastClose) {
      btnToastClose.addEventListener("click", () => {
        const toast = document.getElementById("payment-toast");
        if (toast) toast.hidden = true;
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const cModal = document.getElementById("contest-modal");
        const pModal = document.getElementById("export-pay-modal");
        const dModal = document.getElementById("export-download-modal");
        if (cModal && !cModal.hidden) closeModal();
        if (pModal && !pModal.hidden) closeExportPayModal();
        if (dModal && !dModal.hidden) closeExportDownloadModal();
      }
    });
  }

  /* =========================================================
     EXPORTAÇÃO MULTI-PRODUTO E INTEGRAÇÃO STRIPE (VIA AtlasStore)
     ========================================================= */
  function showCheckoutError(msg) {
    const errBox = document.getElementById("checkout-error-banner");
    if (errBox) {
      errBox.textContent = msg;
      errBox.hidden = false;
    } else {
      showPaymentToast("Atenção no pagamento", msg);
    }
  }

  function updateExportButtonUI() {
    const btn = document.getElementById("btn-open-export");
    const label = document.getElementById("export-btn-label");
    const badge = document.getElementById("export-badge-pill");
    if (!btn || !label || !badge) return;

    const cfg = getCurrentLottery();
    const unlocked = Store && Store.hasLotteryAccess(cfg.id);

    if (unlocked) {
      btn.classList.add("is-unlocked");
      btn.title = `Exportação da ${cfg.name} liberada: clique para baixar XLSX ou PDF`;
      label.textContent = "Exportar Resultados";
      badge.textContent = "✓ Liberado (XLSX / PDF)";
    } else {
      btn.classList.remove("is-unlocked");
      btn.title = `Exportar ${cfg.name} por R$ 10,00 ou Combo 9 Loterias por R$ 24,90`;
      label.textContent = "Exportar Resultados";
      badge.textContent = "R$ 10 (Combo R$ 24,90)";
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

  function openExportPayModal(targetLotteryId) {
    const modal = document.getElementById("export-pay-modal");
    if (!modal || !Store) return;

    const targetId = LOTTERY_CONFIGS[targetLotteryId] ? targetLotteryId : state.lottery;
    const targetCfg = LOTTERY_CONFIGS[targetId];
    const meta = Specials ? Specials.getSpecialMeta(targetId) : null;
    const singleProduct = Store.getProductByLottery(targetId);

    const titleEl = document.getElementById("pay-modal-title");
    const singleTitle = document.getElementById("pay-single-title");
    const singleDesc = document.getElementById("pay-single-desc");
    const buySingleBtn = document.getElementById("btn-buy-single");
    const errBox = document.getElementById("checkout-error-banner");

    if (errBox) errBox.hidden = true;
    if (titleEl) titleEl.textContent = `Exportar ${targetCfg.name} em Excel (.xlsx) e PDF`;
    if (singleTitle) singleTitle.textContent = singleProduct.name;
    if (singleDesc) {
      singleDesc.textContent = meta
        ? `Todo o histórico da ${targetCfg.name}, filtros da tabela e todas as edições da ${meta.name} em XLSX e PDF.`
        : singleProduct.description;
    }
    if (buySingleBtn) {
      buySingleBtn.dataset.productId = singleProduct.id;
      buySingleBtn.textContent = `Comprar apenas ${targetCfg.name} (R$ 10,00)`;
    }

    const partialBar = document.getElementById("partial-unlocked-bar");
    const partialText = document.getElementById("partial-unlocked-text");
    if (partialBar && partialText) {
      const unlockedLotteries = Store.getUnlockedLotteries().map((id) => LOTTERY_CONFIGS[id].name);
      const extras = [];
      if (Store.hasEntitlement("kit_bolao_virada")) extras.push("Kit Bolão Virada 2026");
      if (Store.hasEntitlement("dossie_especiais")) extras.push("Dossiê Especiais");
      const allOwned = [...unlockedLotteries, ...extras];
      if (allOwned.length > 0) {
        partialText.textContent = `Já liberado nesta sessão: ${allOwned.join(", ")}.`;
        partialBar.hidden = false;
      } else {
        partialBar.hidden = true;
      }
    }

    modal.hidden = false;
  }

  function closeExportPayModal() {
    const modal = document.getElementById("export-pay-modal");
    if (modal) modal.hidden = true;
  }

  function resolveSelectedExportLottery() {
    const selectEl = document.getElementById("export-lottery-select");
    const val = selectEl ? selectEl.value : "current";
    return val === "current" ? state.lottery : val;
  }

  function renderExtraProductsInDownloadModal() {
    const container = document.getElementById("extra-products-downloads");
    if (!container || !Store) return;

    const hasBolao = Store.hasEntitlement("kit_bolao_virada");
    const hasDossie = Store.hasEntitlement("dossie_especiais");

    const parts = [];
    parts.push('<div class="extra-downloads-header"><strong>Produtos Especiais de Fim de Ano</strong><a href="mega-da-virada.html#produtos" class="btn-link-action">Ver detalhes na página da Mega da Virada</a></div>');

    if (hasBolao || hasDossie) {
      parts.push('<div class="extra-downloads-grid">');
      if (hasBolao) {
        parts.push(`
          <div class="extra-dl-card unlocked">
            <strong>Kit Bolão Mega da Virada 2026</strong>
            <span>Planilha com fórmulas de rateio, conferidor #3100 e Guia Executivo</span>
            <div class="extra-dl-btns">
              <button type="button" id="btn-dl-bolao-xlsx" class="btn btn-sm btn-primary">Baixar XLSX</button>
              <button type="button" id="btn-dl-bolao-pdf" class="btn btn-sm">Baixar Guia PDF</button>
            </div>
          </div>
        `);
      }
      if (hasDossie) {
        parts.push(`
          <div class="extra-dl-card unlocked">
            <strong>Dossiê Concursos Especiais</strong>
            <span>Virada, Independência, São João e Páscoa consolidados</span>
            <div class="extra-dl-btns">
              <button type="button" id="btn-dl-dossie-xlsx" class="btn btn-sm btn-primary">Baixar XLSX</button>
              <button type="button" id="btn-dl-dossie-pdf" class="btn btn-sm">Baixar PDF</button>
            </div>
          </div>
        `);
      }
      parts.push("</div>");
    }

    if (!hasBolao || !hasDossie) {
      parts.push('<div class="extra-upsell-row">');
      if (!hasBolao) {
        parts.push('<button type="button" class="btn btn-sm extra-buy-btn" data-product-id="kit_bolao_virada">Adicionar Kit Bolão Virada 2026 (R$ 14,90)</button>');
      }
      if (!hasDossie) {
        parts.push('<button type="button" class="btn btn-sm extra-buy-btn" data-product-id="dossie_especiais">Adicionar Dossiê Especiais (R$ 19,90)</button>');
      }
      if (!hasBolao && !hasDossie && !Store.hasAllLotteries()) {
        parts.push('<button type="button" class="btn btn-sm btn-primary extra-buy-btn" data-product-id="super_combo">Pacote Completo Atlas + Virada (R$ 34,90)</button>');
      }
      parts.push("</div>");
    }

    container.innerHTML = parts.join("");

    const runSecureExtraExport = async (fn) => {
      const statusBox = document.getElementById("export-status-banner");
      if (statusBox) {
        statusBox.hidden = false;
        statusBox.textContent = "Validando autorização criptográfica do pagamento...";
      }
      try {
        await fn();
        if (statusBox) {
          statusBox.textContent = "Arquivo gerado e baixado com sucesso!";
          setTimeout(() => { statusBox.hidden = true; }, 4000);
        }
      } catch (err) {
        updateExportButtonUI();
        syncDownloadModalAvailability();
        renderExtraProductsInDownloadModal();
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.textContent = err.message;
        }
      }
    };

    const dlBolaoX = document.getElementById("btn-dl-bolao-xlsx");
    if (dlBolaoX) {
      dlBolaoX.addEventListener("click", () => {
        const ms = getDrawsForLotteryKey("megasena");
        runSecureExtraExport(() => Store.exportKitBolaoViradaXLSX(ms ? ms.draws : []));
      });
    }
    const dlBolaoP = document.getElementById("btn-dl-bolao-pdf");
    if (dlBolaoP) {
      dlBolaoP.addEventListener("click", () => {
        const ms = getDrawsForLotteryKey("megasena");
        runSecureExtraExport(() => Store.exportKitBolaoViradaPDF(ms ? ms.draws : []));
      });
    }
    const dlDossieX = document.getElementById("btn-dl-dossie-xlsx");
    if (dlDossieX) {
      dlDossieX.addEventListener("click", () => {
        runSecureExtraExport(() => Store.exportDossieEspeciaisXLSX(getAllLotteriesDataMap()));
      });
    }
    const dlDossieP = document.getElementById("btn-dl-dossie-pdf");
    if (dlDossieP) {
      dlDossieP.addEventListener("click", () => {
        runSecureExtraExport(() => Store.exportDossieEspeciaisPDF(getAllLotteriesDataMap()));
      });
    }

    container.querySelectorAll(".extra-buy-btn[data-product-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        Store.startCheckout(btn.dataset.productId, {
          buttonEl: btn,
          onError: (msg) => {
            const box = document.getElementById("export-status-banner");
            if (box) {
              box.hidden = false;
              box.textContent = msg;
            }
          }
        });
      });
    });
  }

  function syncDownloadModalAvailability() {
    if (!Store) return;
    const selectEl = document.getElementById("export-lottery-select");
    const rawVal = selectEl ? selectEl.value : "current";
    const resolved = rawVal === "current" ? state.lottery : rawVal;

    const filteredRadio = document.querySelector('input[name="export-scope"][value="filtered"]');
    if (filteredRadio) {
      if (resolved === "all") {
        if (filteredRadio.checked) {
          const allRadio = document.querySelector('input[name="export-scope"][value="all"]');
          if (allRadio) allRadio.checked = true;
        }
        filteredRadio.disabled = true;
      } else {
        filteredRadio.disabled = false;
      }
    }

    const targetId = resolved === "all" ? "all" : resolved;
    const targetCfg = LOTTERY_CONFIGS[targetId];
    const specialMeta = targetId !== "all" && Specials ? Specials.getSpecialMeta(targetId) : null;
    const targetDraws = targetId !== "all" ? (getDrawsForLotteryKey(targetId) || { draws: [] }).draws : [];
    const specialCount =
      targetId === "all" && Specials
        ? Store.ALL_LOTTERIES.reduce((acc, k) => {
            const d = getDrawsForLotteryKey(k);
            return acc + (d ? Specials.getSpecialDraws(k, d.draws).length : 0);
          }, 0)
        : Specials
        ? Specials.getSpecialDraws(targetId, targetDraws).length
        : 0;

    const scopeSpecialDesc = document.getElementById("scope-special-desc");
    if (scopeSpecialDesc) {
      scopeSpecialDesc.innerHTML =
        targetId === "all"
          ? `<strong>Somente Concursos Especiais:</strong> Apenas as ${intFmt.format(specialCount)} edições especiais das loterias`
          : `<strong>Somente Concursos Especiais:</strong> Apenas os ${intFmt.format(specialCount)} sorteios de ${specialMeta ? specialMeta.name : targetCfg.name}`;
    }

    const hasAccess =
      targetId === "all" ? Store.hasAllLotteries() : Store.hasLotteryAccess(targetId);

    const notice = document.getElementById("locked-export-notice");
    const noticeText = document.getElementById("locked-export-text");
    const unlockBtn = document.getElementById("btn-unlock-selected-export");
    const unlockComboBtn = document.getElementById("btn-unlock-combo-export");
    const statusBox = document.getElementById("export-status-banner");
    const emailInput = document.getElementById("export-email-input");
    const emailBtn = document.getElementById("btn-send-export-email");
    const dlButtons = [
      document.getElementById("btn-download-xlsx"),
      document.getElementById("btn-download-pdf"),
      document.getElementById("btn-download-both"),
      emailBtn
    ];

    dlButtons.forEach((b) => {
      if (b) b.disabled = !hasAccess;
    });
    if (emailInput) {
      emailInput.disabled = !hasAccess;
      const verifiedEmail = Store.getVerifiedCustomerEmail && Store.getVerifiedCustomerEmail();
      if (verifiedEmail && !emailInput.value) {
        emailInput.value = verifiedEmail;
      }
    }

    if (notice && noticeText && unlockBtn) {
      if (hasAccess) {
        notice.hidden = true;
      } else {
        notice.hidden = false;
        const showDlError = (msg) => {
          if (statusBox) {
            statusBox.hidden = false;
            statusBox.textContent = msg;
          }
        };
        if (targetId === "all") {
          noticeText.textContent =
            "A exportação consolidada das 9 loterias requer todas as modalidades liberadas ou o Combo 9 Loterias.";
          unlockBtn.textContent = "Desbloquear Combo 9 Loterias (R$ 24,90)";
          unlockBtn.dataset.productId = "combo_all";
          if (unlockComboBtn) unlockComboBtn.hidden = true;
          unlockBtn.onclick = () => Store.startCheckout("combo_all", { buttonEl: unlockBtn, onError: showDlError });
        } else {
          const prod = Store.getProductByLottery(targetId);
          noticeText.textContent = `A modalidade ${targetCfg.name} ainda está bloqueada. Cada loteria tem exportação separada por R$ 10,00 ou você pode levar todas as 9 no Combo com desconto.`;
          unlockBtn.textContent = `Comprar ${targetCfg.name} (R$ 10,00)`;
          unlockBtn.dataset.productId = prod.id;
          if (unlockComboBtn) unlockComboBtn.hidden = false;
          unlockBtn.onclick = () => Store.startCheckout(prod.id, { buttonEl: unlockBtn, onError: showDlError });
        }
      }
    }
  }

  function openExportDownloadModal() {
    const modal = document.getElementById("export-download-modal");
    if (!modal || !Store) return;

    const curCfg = getCurrentLottery();
    const selectEl = document.getElementById("export-lottery-select");
    if (selectEl) {
      const curOpt = selectEl.querySelector('option[value="current"]');
      if (curOpt) {
        const curStatus = Store.hasLotteryAccess(curCfg.id) ? "Liberada" : "Bloqueada";
        curOpt.textContent = `Loteria Atual na Tela (${curCfg.name} - ${curStatus})`;
      }
      Store.ALL_LOTTERIES.forEach((id) => {
        const opt = document.getElementById(`opt-exp-${id}`);
        const cfg = LOTTERY_CONFIGS[id];
        if (opt && cfg) {
          const dataObj = getDrawsForLotteryKey(id);
          const count = dataObj && dataObj.draws ? dataObj.draws.length : 0;
          const tag = Store.hasLotteryAccess(id) ? "✓ Liberada" : "Bloqueada - R$ 10,00";
          opt.textContent = `${cfg.name} (${intFmt.format(count)} concursos) - ${tag}`;
        }
      });
      const allOpt = document.getElementById("opt-exp-all");
      if (allOpt) {
        allOpt.textContent = Store.hasAllLotteries()
          ? "Todas as 9 Loterias (XLSX Multi-Abas / PDF) - ✓ Liberado"
          : "Todas as 9 Loterias (XLSX Multi-Abas / PDF) - Combo R$ 24,90";
      }
    }

    const filtered = getFilteredDraws();
    const scopeDesc = document.getElementById("scope-filtered-desc");
    if (scopeDesc) {
      scopeDesc.innerHTML = `<strong>Concursos Filtrados:</strong> Apenas os ${intFmt.format(filtered.length)} concursos filtrados na tabela agora (${curCfg.name})`;
    }

    const statusBox = document.getElementById("export-status-banner");
    if (statusBox) statusBox.hidden = true;

    syncDownloadModalAvailability();
    renderExtraProductsInDownloadModal();
    modal.hidden = false;
  }

  function closeExportDownloadModal() {
    const modal = document.getElementById("export-download-modal");
    if (modal) modal.hidden = true;
  }

  function getDrawsForLotteryKey(lotteryKey) {
    if (lotteryKey === "current" || lotteryKey === state.lottery) {
      return { cfg: getCurrentLottery(), draws: state.draws };
    }
    const cfg = LOTTERY_CONFIGS[lotteryKey];
    if (!cfg) return null;
    const raw = window[cfg.dataVar] || [];
    return { cfg, draws: raw };
  }

  function getAllLotteriesDataMap() {
    const out = {};
    Store.ALL_LOTTERIES.forEach((k) => {
      const entry = getDrawsForLotteryKey(k);
      if (entry) out[k] = entry;
    });
    return out;
  }

  function resolveDrawsForExport(lotteryId, scope) {
    const base = getDrawsForLotteryKey(lotteryId);
    if (!base) return null;
    if (scope === "filtered" && lotteryId === state.lottery) {
      return { cfg: base.cfg, draws: getFilteredDraws(), tag: "_Filtrados", subtitle: "Concursos Filtrados" };
    }
    if (scope === "special" && Specials) {
      const meta = Specials.getSpecialMeta(lotteryId);
      return {
        cfg: base.cfg,
        draws: Specials.getSpecialDraws(lotteryId, base.draws),
        tag: "_Especiais",
        subtitle: meta ? meta.name : "Concursos Especiais"
      };
    }
    return { cfg: base.cfg, draws: base.draws, tag: "_Completo", subtitle: "" };
  }

  async function exportToXLSX() {
    if (!Store) return false;
    const targetId = resolveSelectedExportLottery();
    const scopeRadio = document.querySelector('input[name="export-scope"]:checked');
    const scope = scopeRadio ? scopeRadio.value : "all";
    const statusBox = document.getElementById("export-status-banner");

    if (statusBox) {
      statusBox.hidden = false;
      statusBox.textContent = "Validando pagamento no servidor e gerando planilha Excel (.xlsx)...";
    }

    try {
      if (targetId === "all") {
        await Store.exportAllLotteriesXLSX(LOTTERY_CONFIGS, (k) => {
          const entry = getDrawsForLotteryKey(k);
          if (!entry) return [];
          return scope === "special" && Specials
            ? Specials.getSpecialDraws(k, entry.draws)
            : entry.draws;
        });
      } else {
        const resolved = resolveDrawsForExport(targetId, scope);
        if (!resolved) throw new Error("Modalidade inválida.");
        await Store.exportLotteryXLSX(resolved.cfg, resolved.draws, resolved.tag);
      }
      if (statusBox) {
        statusBox.textContent = "Planilha Excel (.xlsx) validada, gerada e baixada com sucesso!";
        setTimeout(() => { statusBox.hidden = true; }, 4000);
      }
      return true;
    } catch (err) {
      console.error("Erro ao gerar XLSX:", err);
      updateExportButtonUI();
      syncDownloadModalAvailability();
      if (!Store.hasLotteryAccess(targetId === "all" ? state.lottery : targetId)) {
        closeExportDownloadModal();
        openExportPayModal(targetId === "all" ? state.lottery : targetId);
        showCheckoutError(err.message);
      } else if (statusBox) {
        statusBox.textContent = "Erro ao gerar Excel: " + err.message;
      }
      return false;
    }
  }

  async function exportToPDF() {
    if (!Store) return false;
    const targetId = resolveSelectedExportLottery();
    const scopeRadio = document.querySelector('input[name="export-scope"]:checked');
    const scope = scopeRadio ? scopeRadio.value : "all";
    const statusBox = document.getElementById("export-status-banner");

    if (statusBox) {
      statusBox.hidden = false;
      statusBox.textContent = "Validando pagamento no servidor e gerando documento PDF...";
    }

    try {
      if (targetId === "all") {
        await Store.exportAllLotteriesPDF(LOTTERY_CONFIGS, (k) => {
          const entry = getDrawsForLotteryKey(k);
          if (!entry) return [];
          return scope === "special" && Specials
            ? Specials.getSpecialDraws(k, entry.draws)
            : entry.draws;
        });
      } else {
        const resolved = resolveDrawsForExport(targetId, scope);
        if (!resolved) throw new Error("Modalidade inválida.");
        await Store.exportLotteryPDF(resolved.cfg, resolved.draws, resolved.tag, resolved.subtitle);
      }
      if (statusBox) {
        statusBox.textContent = "Documento PDF validado, gerado e baixado com sucesso!";
        setTimeout(() => { statusBox.hidden = true; }, 4000);
      }
      return true;
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      updateExportButtonUI();
      syncDownloadModalAvailability();
      if (!Store.hasLotteryAccess(targetId === "all" ? state.lottery : targetId)) {
        closeExportDownloadModal();
        openExportPayModal(targetId === "all" ? state.lottery : targetId);
        showCheckoutError(err.message);
      } else if (statusBox) {
        statusBox.textContent = "Erro ao gerar PDF: " + err.message;
      }
      return false;
    }
  }

  async function sendExportEmailFromModal() {
    if (!Store) return false;
    const emailInput = document.getElementById("export-email-input");
    const btnSend = document.getElementById("btn-send-export-email");
    const statusBox = document.getElementById("export-status-banner");
    const recipientEmail = emailInput ? emailInput.value.trim() : "";

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      if (statusBox) {
        statusBox.hidden = false;
        statusBox.textContent = "Informe um endereço de e-mail válido para receber a planilha.";
      }
      if (emailInput) emailInput.focus();
      return false;
    }

    const targetId = resolveSelectedExportLottery();
    const scopeRadio = document.querySelector('input[name="export-scope"]:checked');
    const scope = scopeRadio ? scopeRadio.value : "all";

    if (btnSend) {
      btnSend.disabled = true;
      btnSend.textContent = "Enviando...";
    }
    if (statusBox) {
      statusBox.hidden = false;
      statusBox.textContent = `Enviando planilha (.xlsx) via ${Store.SUPPORT_EMAIL} para ${recipientEmail}...`;
    }

    try {
      let res;
      if (targetId === "all") {
        res = await Store.sendExportByEmail({
          recipientEmail,
          target: "all",
          lotteryConfigsMap: LOTTERY_CONFIGS,
          getDrawsFn: (k) => {
            const entry = getDrawsForLotteryKey(k);
            if (!entry) return [];
            return scope === "special" && Specials
              ? Specials.getSpecialDraws(k, entry.draws)
              : entry.draws;
          }
        });
      } else {
        const resolved = resolveDrawsForExport(targetId, scope);
        if (!resolved) throw new Error("Modalidade inválida.");
        res = await Store.sendExportByEmail({
          recipientEmail,
          target: targetId,
          lotteryCfg: resolved.cfg,
          draws: resolved.draws,
          scopeTag: resolved.tag
        });
      }
      if (statusBox) {
        statusBox.textContent =
          (res && res.message) ||
          `Planilha enviada com sucesso para ${recipientEmail} (remetente: ${Store.SUPPORT_EMAIL}).`;
      }
      return true;
    } catch (err) {
      console.error("Erro ao enviar planilha por e-mail:", err);
      if (statusBox) {
        statusBox.hidden = false;
        statusBox.textContent = err.message;
      }
      return false;
    } finally {
      if (btnSend) {
        btnSend.disabled = false;
        btnSend.textContent = "Enviar Planilha por E-mail";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const params = new URLSearchParams(window.location.search);
    const paramLottery = (params.get("lottery") || "").toLowerCase();
    const paramSpecial = params.get("special") === "1" || params.get("special") === "true";
    const hash = (location.hash || "").replace("#", "").toLowerCase();
    const startLottery = LOTTERY_CONFIGS[paramLottery]
      ? paramLottery
      : LOTTERY_CONFIGS[hash]
      ? hash
      : "megasena";

    bindEvents();
    selectLottery(startLottery, { activateSpecial: paramSpecial });
    updateExportButtonUI();

    if (Store) {
      Store.checkStripeReturn({
        onValidating: () => {
          showPaymentToast("Validando pagamento...", "Consultando confirmação criptográfica no Stripe.");
        },
        onSuccess: (data) => {
          updateExportButtonUI();
          const label = (data && data.productName) || "Exportação de Resultados";
          const amountStr = data && data.amountCents ? Store.formatBRLFromCents(data.amountCents) : "";
          showPaymentToast(
            amountStr ? `Pagamento de ${amountStr} confirmado!` : "Pagamento confirmado!",
            `${label} liberado para download e envio por e-mail.`
          );
          openExportDownloadModal();
        },
        onRevalidated: () => {
          updateExportButtonUI();
        },
        onCanceled: () => {
          showPaymentToast("Checkout cancelado", "Nenhuma cobrança foi realizada. Você pode escolher outro plano quando quiser.");
        },
        onError: (msg) => {
          updateExportButtonUI();
          showPaymentToast("Pagamento não confirmado", msg);
        }
      });
    }
  });
})();
