(function (root) {
  "use strict";

  const Specials =
    root.AtlasSpecials ||
    (typeof require === "function" ? require("./special-draws.js") : null);

  const ENTITLEMENT_STORAGE_KEY = "atlas_unlocked_entitlements_v2";
  const LEGACY_PAID_KEY = "mega_results_export_paid";
  const ALL_LOTTERIES = ["megasena", "lotofacil", "quina", "lotomania"];

  const PRODUCTS = {
    export_megasena: {
      id: "export_megasena",
      name: "Planilha Mega-Sena + Mega da Virada",
      shortName: "Mega-Sena + Virada",
      description: "Todo o histórico da Mega-Sena e todas as edições da Mega da Virada em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: ["megasena"],
      formatLabel: "XLSX + PDF"
    },
    export_lotofacil: {
      id: "export_lotofacil",
      name: "Planilha Lotofácil + Independência",
      shortName: "Lotofácil + Independência",
      description: "Todo o histórico da Lotofácil e Lotofácil da Independência em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: ["lotofacil"],
      formatLabel: "XLSX + PDF"
    },
    export_quina: {
      id: "export_quina",
      name: "Planilha Quina + São João",
      shortName: "Quina + São João",
      description: "Todo o histórico da Quina e Quina de São João em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: ["quina"],
      formatLabel: "XLSX + PDF"
    },
    export_lotomania: {
      id: "export_lotomania",
      name: "Planilha Lotomania + Páscoa",
      shortName: "Lotomania + Páscoa",
      description: "Todo o histórico da Lotomania e Lotomania de Páscoa em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: ["lotomania"],
      formatLabel: "XLSX + PDF"
    },
    combo_all: {
      id: "combo_all",
      name: "Combo 4 Loterias Completo",
      shortName: "Combo 4 Loterias",
      description: "Desbloqueia Mega-Sena, Lotofácil, Quina, Lotomania e todos os concursos especiais (38% de desconto).",
      amountCents: 2490,
      compareAtCents: 4000,
      unlocks: ["megasena", "lotofacil", "quina", "lotomania"],
      formatLabel: "XLSX Multi-Abas + PDFs"
    },
    kit_bolao_virada: {
      id: "kit_bolao_virada",
      name: "Kit Bolão Mega da Virada 2026",
      shortName: "Kit Bolão Virada 2026",
      description: "Planilha Excel com rateio de cotas, conferidor automático do concurso #3100, histórico e guia em PDF.",
      amountCents: 1490,
      compareAtCents: null,
      unlocks: ["kit_bolao_virada"],
      formatLabel: "XLSX com Fórmulas + Guia PDF"
    },
    dossie_especiais: {
      id: "dossie_especiais",
      name: "Dossiê Concursos Especiais",
      shortName: "Dossiê Especiais",
      description: "Relatório em Excel (5 abas) e PDF reunindo Virada, Independência, Quina de São João e Páscoa.",
      amountCents: 1990,
      compareAtCents: null,
      unlocks: ["dossie_especiais"],
      formatLabel: "XLSX 5 Abas + PDF"
    },
    super_combo: {
      id: "super_combo",
      name: "Pacote Completo Atlas + Virada",
      shortName: "Pacote Completo",
      description: "As 4 planilhas oficiais + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais com desconto máximo.",
      amountCents: 3490,
      compareAtCents: 7480,
      unlocks: ["megasena", "lotofacil", "quina", "lotomania", "kit_bolao_virada", "dossie_especiais"],
      formatLabel: "XLSX + PDF Completos"
    }
  };

  const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
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

  function formatBRLFromCents(cents) {
    return brlFmt.format((Number(cents) || 0) / 100);
  }

  function getProductByLottery(lotteryId) {
    return PRODUCTS[`export_${lotteryId}`] || PRODUCTS.export_megasena;
  }

  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  function readEntitlementsRecord() {
    const ls = getStorage();
    const record = { items: [], sessions: {} };
    if (!ls) return record;

    try {
      const raw = ls.getItem(ENTITLEMENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) {
          record.items = parsed.items.filter((x) => typeof x === "string");
        }
        if (parsed && parsed.sessions && typeof parsed.sessions === "object") {
          record.sessions = parsed.sessions;
        }
      }
    } catch (e) {}

    // Migração transparente da compra anterior de R$ 15,00 (4 loterias)
    try {
      if (ls.getItem(LEGACY_PAID_KEY) === "true") {
        const set = new Set(record.items);
        ALL_LOTTERIES.forEach((id) => set.add(id));
        record.items = Array.from(set);
      }
    } catch (e) {}

    return record;
  }

  function writeEntitlementsRecord(record) {
    const ls = getStorage();
    if (!ls) return;
    try {
      ls.setItem(ENTITLEMENT_STORAGE_KEY, JSON.stringify(record));
    } catch (e) {}
  }

  function getUnlockedSet() {
    return new Set(readEntitlementsRecord().items);
  }

  function hasEntitlement(key) {
    return getUnlockedSet().has(key);
  }

  function hasLotteryAccess(lotteryId) {
    return hasEntitlement(lotteryId);
  }

  function hasAllLotteries() {
    const set = getUnlockedSet();
    return ALL_LOTTERIES.every((id) => set.has(id));
  }

  function hasAnyEntitlement() {
    return getUnlockedSet().size > 0;
  }

  function getUnlockedLotteries() {
    const set = getUnlockedSet();
    return ALL_LOTTERIES.filter((id) => set.has(id));
  }

  function grantEntitlements(unlocks, sessionId, productId) {
    const record = readEntitlementsRecord();
    const set = new Set(record.items);
    (Array.isArray(unlocks) ? unlocks : []).forEach((item) => {
      if (typeof item === "string" && item.trim()) {
        set.add(item.trim());
      }
    });
    record.items = Array.from(set);
    if (sessionId) {
      record.sessions[sessionId] = {
        productId: productId || null,
        verifiedAt: new Date().toISOString()
      };
    }
    writeEntitlementsRecord(record);
    return record;
  }

  async function startCheckout(productId, options = {}) {
    const product = PRODUCTS[productId];
    const onError = typeof options.onError === "function" ? options.onError : null;
    const buttonEl = options.buttonEl || null;

    if (!product) {
      const msg = "Produto selecionado inválido.";
      if (onError) onError(msg);
      return { ok: false, error: msg };
    }

    let originalHTML = null;
    let originalDisabled = false;
    if (buttonEl) {
      originalHTML = buttonEl.innerHTML;
      originalDisabled = Boolean(buttonEl.disabled);
      buttonEl.disabled = true;
      buttonEl.innerHTML =
        '<svg class="btn-checkout-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg><span>Abrindo Stripe...</span>';
    }

    const restoreButton = () => {
      if (buttonEl && originalHTML !== null) {
        buttonEl.disabled = originalDisabled;
        buttonEl.innerHTML = originalHTML;
      }
    };

    try {
      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          origin: root.location ? root.location.origin : "",
          returnPath: root.location ? root.location.pathname : "/"
        })
      });

      let data = {};
      try {
        data = await resp.json();
      } catch (e) {
        data = {};
      }

      if (resp.ok && data && data.url) {
        if (root.location) {
          root.location.href = data.url;
        }
        return { ok: true, url: data.url, productId };
      }

      restoreButton();
      const errMsg =
        (data && data.error) ||
        "Não foi possível iniciar o checkout Stripe no momento. Tente novamente em instantes.";
      if (onError) onError(errMsg);
      return { ok: false, error: errMsg };
    } catch (err) {
      restoreButton();
      const errMsg = "Falha de conexão com o servidor de pagamento. Verifique sua conexão e tente novamente.";
      if (onError) onError(errMsg);
      return { ok: false, error: errMsg };
    }
  }

  async function verifySession(sessionId) {
    const cleanId = String(sessionId || "").trim();
    if (!/^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/.test(cleanId)) {
      return {
        ok: false,
        error: "Identificador de sessão inválido. Ele deve começar com cs_live_ ou cs_test_."
      };
    }

    try {
      const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(cleanId)}`);
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }

      if (res.ok && data && data.paid && Array.isArray(data.unlocks) && data.unlocks.length > 0) {
        grantEntitlements(data.unlocks, cleanId, data.productId);
        return { ok: true, data };
      }

      return {
        ok: false,
        error: (data && data.error) || "Sessão não confirmada como paga no Stripe.",
        data
      };
    } catch (err) {
      return { ok: false, error: "Erro temporário ao consultar o servidor de validação." };
    }
  }

  async function checkStripeReturn(callbacks = {}) {
    if (!root.location) return null;
    try {
      const params = new URLSearchParams(root.location.search);
      const paymentStatus = (params.get("payment") || "").trim();
      const sessionId = (params.get("session_id") || "").trim();
      const canceledProduct = (params.get("product") || "").trim();

      const cleanUrl = root.location.pathname + root.location.hash;

      if (sessionId) {
        if (!/^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/.test(sessionId)) {
          return null;
        }
        if (typeof callbacks.onValidating === "function") {
          callbacks.onValidating();
        }
        const result = await verifySession(sessionId);
        if (root.history && root.history.replaceState && root.document) {
          root.history.replaceState({}, root.document.title, cleanUrl);
        }
        if (result.ok) {
          if (typeof callbacks.onSuccess === "function") {
            callbacks.onSuccess(result.data);
          }
        } else if (typeof callbacks.onError === "function") {
          callbacks.onError(result.error || "O pagamento desta sessão ainda não foi confirmado.");
        }
        return result;
      }

      if (paymentStatus === "canceled") {
        if (root.history && root.history.replaceState && root.document) {
          root.history.replaceState({}, root.document.title, cleanUrl);
        }
        if (typeof callbacks.onCanceled === "function") {
          callbacks.onCanceled(canceledProduct);
        }
      }
    } catch (e) {}
    return null;
  }

  function getXLSX() {
    if (root.XLSX) return root.XLSX;
    if (typeof require === "function") {
      try {
        return require("./vendor/xlsx.full.min.js");
      } catch (e) {}
    }
    return null;
  }

  function getJsPDF() {
    if (root.jspdf && root.jspdf.jsPDF) return root.jspdf.jsPDF;
    return null;
  }

  function applyColumnWidths(XLSX, ws, headers, rows) {
    ws["!cols"] = headers.map((h, colIdx) => {
      let maxLen = String(h).length;
      const sample = rows.slice(0, 120);
      sample.forEach((r) => {
        const cell = r[colIdx];
        if (cell !== undefined && cell !== null) {
          const valStr =
            typeof cell === "object" && cell.w
              ? String(cell.w)
              : typeof cell === "object" && cell.v !== undefined
              ? String(cell.v)
              : String(cell);
          if (valStr.length > maxLen) maxLen = valStr.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 11), 36) };
    });
    return ws;
  }

  function createFormattedWorksheet(XLSX, headers, rows) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    return applyColumnWidths(XLSX, ws, headers, rows);
  }

  function buildLotterySheetData(cfg, drawsList) {
    const dezHeaders = Array.from({ length: cfg.drawCount }, (_, i) => `Dezena ${i + 1}`);
    const tierHeaders = [];
    cfg.tiers.forEach((t) => {
      tierHeaders.push(`Ganhadores ${t.name}`);
      tierHeaders.push(`Rateio ${t.name} (R$)`);
    });

    const headers = [
      "Concurso",
      "Data",
      "Concurso Especial",
      ...dezHeaders,
      "Dezenas Combinadas",
      "Acumulou?",
      ...tierHeaders,
      "Soma Dezenas",
      "Qtd Pares",
      "Qtd Ímpares"
    ];

    const rows = drawsList.map((d) => {
      const nums = (d.n || []).slice().sort((a, b) => a - b);
      const combined = nums.map(pad2).join(" - ");
      const sum = nums.reduce((acc, v) => acc + v, 0);
      const evenCount = nums.filter((n) => n % 2 === 0).length;
      const oddCount = nums.length - evenCount;
      const acumulouStr = d.a ? "Sim" : "Não";
      const spInfo = Specials ? Specials.getSpecialDrawInfo(cfg.id, d) : null;
      const specialLabel = spInfo ? spInfo.label : "Regular";

      const tierCols = [];
      cfg.tiers.forEach((t) => {
        const pInfo = (d.p && d.p[t.key]) || { g: 0, v: 0 };
        const gVal = Number(pInfo.g) || 0;
        const vVal = Number(pInfo.v) || 0;

        tierCols.push({
          t: "n",
          v: gVal,
          z: "#,##0",
          w: intFmt.format(gVal)
        });

        tierCols.push({
          t: "n",
          v: vVal,
          z: '"R$" #,##0.00',
          w: brlFmt.format(vVal)
        });
      });

      return [
        d.c,
        d.d,
        specialLabel,
        ...nums,
        combined,
        acumulouStr,
        ...tierCols,
        sum,
        evenCount,
        oddCount
      ];
    });

    return { headers, rows };
  }

  function exportLotteryXLSX(cfg, drawsList, scopeTag = "_Completo", opts = {}) {
    if (!hasLotteryAccess(cfg.id)) {
      throw new Error(`Exportação bloqueada para ${cfg.name}. Adquira o acesso individual ou o Combo 4 Loterias.`);
    }
    const XLSX = getXLSX();
    if (!XLSX) {
      throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    }
    if (!Array.isArray(drawsList) || !drawsList.length) {
      throw new Error("Nenhum sorteio encontrado para exportar.");
    }

    const wb = XLSX.utils.book_new();
    const { headers, rows } = buildLotterySheetData(cfg, drawsList);
    const ws = createFormattedWorksheet(XLSX, headers, rows);
    XLSX.utils.book_append_sheet(wb, ws, cfg.name);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Loterias_Caixa_${cfg.name}${scopeTag}_${dateStr}.xlsx`;
    if (opts.download !== false) {
      XLSX.writeFile(wb, filename);
    }
    return { wb, filename };
  }

  function exportAllLotteriesXLSX(configsMap, getDrawsByLotteryFn, opts = {}) {
    if (!hasAllLotteries()) {
      throw new Error("O arquivo consolidado das 4 loterias requer o Combo 4 Loterias ou Pacote Completo.");
    }
    const XLSX = getXLSX();
    if (!XLSX) {
      throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    }

    const wb = XLSX.utils.book_new();
    ALL_LOTTERIES.forEach((k) => {
      const cfg = configsMap[k];
      const draws = getDrawsByLotteryFn(k);
      if (cfg && Array.isArray(draws) && draws.length) {
        const { headers, rows } = buildLotterySheetData(cfg, draws);
        const ws = createFormattedWorksheet(XLSX, headers, rows);
        XLSX.utils.book_append_sheet(wb, ws, cfg.name);
      }
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Loterias_Caixa_Consolidado_Todas_${dateStr}.xlsx`;
    if (opts.download !== false) {
      XLSX.writeFile(wb, filename);
    }
    return { wb, filename };
  }

  function renderLotteryPDFSection(doc, cfg, drawsList, startOnNewPage, subtitleSuffix) {
    if (startOnNewPage) {
      doc.addPage();
    }

    const headerColors = {
      megasena: [15, 92, 58],
      lotofacil: [126, 34, 206],
      quina: [29, 78, 216],
      lotomania: [234, 88, 12]
    };
    const color = headerColors[cfg.id] || [15, 92, 58];

    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Atlas Estatístico - ${cfg.name}`, 14, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
      subtitleSuffix
        ? `Relatório Oficial - ${subtitleSuffix}`
        : "Relatório Oficial Consolidado de Resultados Históricos",
      14,
      17
    );

    const emitDate = new Date().toLocaleDateString("pt-BR");
    doc.text(`Data de Emissão: ${emitDate}`, 196, 17, { align: "right" });

    doc.setTextColor(20, 38, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Resumo dos Concursos:", 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const totalCount = drawsList.length;
    const oldestDraw = drawsList[drawsList.length - 1];
    const newestDraw = drawsList[0];
    const rangeText = `Exibindo ${intFmt.format(totalCount)} concursos (do Concurso #${oldestDraw.c} em ${oldestDraw.d} ao #${newestDraw.c} em ${newestDraw.d})`;
    doc.text(rangeText, 14, 35);

    const headRow = ["Concurso", "Data", "Dezenas Sorteadas", "Acumulou?", cfg.tablePrizeCols.main, "Faixa 2"];
    const tableRows = drawsList.map((d) => {
      const spInfo = Specials ? Specials.getSpecialDrawInfo(cfg.id, d) : null;
      const concursoLabel = spInfo ? `#${d.c}\n(${spInfo.shortName} ${spInfo.year})` : `#${d.c}`;
      const numsStr = (d.n || []).map(pad2).join(" ");
      const acumStr = d.a ? "Sim" : "Não";
      const mainTier = cfg.tiers[0];
      const subTier = cfg.tiers[1];
      const mainP = (d.p && d.p[mainTier.key]) || { g: 0, v: 0 };
      const subP = (subTier && d.p && d.p[subTier.key]) || { g: 0, v: 0 };

      const mainText = `${intFmt.format(mainP.g)} gan. (${brlFmt.format(mainP.v)})`;
      const subText = subTier ? `${intFmt.format(subP.g)} gan. (${brlFmt.format(subP.v)})` : "-";

      return [concursoLabel, d.d, numsStr, acumStr, mainText, subText];
    });

    doc.autoTable({
      head: [headRow],
      body: tableRows,
      startY: 38,
      theme: "striped",
      headStyles: {
        fillColor: color,
        textColor: 255,
        fontSize: 8,
        fontStyle: "bold"
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: [20, 38, 28]
      },
      alternateRowStyles: {
        fillColor: [247, 245, 240]
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: "bold" },
        1: { cellWidth: 20 },
        2: { cellWidth: 40, fontStyle: "bold" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 48 },
        5: { cellWidth: 42 }
      },
      margin: { top: 28, bottom: 14, left: 10, right: 10 },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(100, 115, 105);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount} | Atlas Oficial das Loterias Caixa (${cfg.name})`,
          105,
          290,
          { align: "center" }
        );
      }
    });
  }

  function exportLotteryPDF(cfg, drawsList, scopeTag = "_Completo", subtitleSuffix = "", opts = {}) {
    if (!hasLotteryAccess(cfg.id)) {
      throw new Error(`Exportação bloqueada para ${cfg.name}. Adquira o acesso individual ou o Combo 4 Loterias.`);
    }
    const JsPDF = getJsPDF();
    if (!JsPDF) {
      throw new Error("A biblioteca de geração de PDF ainda está carregando.");
    }
    if (!Array.isArray(drawsList) || !drawsList.length) {
      throw new Error("Nenhum sorteio encontrado para exportar em PDF.");
    }

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const sorted = drawsList.slice().sort((a, b) => b.c - a.c);
    renderLotteryPDFSection(doc, cfg, sorted, false, subtitleSuffix);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Loterias_Caixa_${cfg.name}${scopeTag}_${dateStr}.pdf`;
    if (opts.download !== false) {
      doc.save(filename);
    }
    return { doc, filename };
  }

  function exportAllLotteriesPDF(configsMap, getDrawsByLotteryFn, opts = {}) {
    if (!hasAllLotteries()) {
      throw new Error("O PDF consolidado das 4 loterias requer o Combo 4 Loterias ou Pacote Completo.");
    }
    const JsPDF = getJsPDF();
    if (!JsPDF) {
      throw new Error("A biblioteca de geração de PDF ainda está carregando.");
    }

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let sectionIdx = 0;
    ALL_LOTTERIES.forEach((k) => {
      const cfg = configsMap[k];
      const draws = getDrawsByLotteryFn(k);
      if (cfg && Array.isArray(draws) && draws.length) {
        const sorted = draws.slice().sort((a, b) => b.c - a.c);
        renderLotteryPDFSection(doc, cfg, sorted, sectionIdx > 0, "");
        sectionIdx++;
      }
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Loterias_Caixa_Consolidado_Todas_${dateStr}.pdf`;
    if (opts.download !== false) {
      doc.save(filename);
    }
    return { doc, filename };
  }

  function getViradaRows(megasenaDraws) {
    if (!Specials || !Array.isArray(megasenaDraws)) return [];
    return Specials.getSpecialDraws("megasena", megasenaDraws)
      .map((d) => {
        const sp = Specials.getSpecialDrawInfo("megasena", d);
        const p6 = (d.p && d.p["6"]) || { g: 0, v: 0 };
        const p5 = (d.p && d.p["5"]) || { g: 0, v: 0 };
        const p4 = (d.p && d.p["4"]) || { g: 0, v: 0 };
        const totalSena = Specials.computeTotalMainPrize("megasena", d);
        return { draw: d, sp, p6, p5, p4, totalSena };
      })
      .sort((a, b) => b.sp.year - a.sp.year);
  }

  function computeViradaFrequencies(viradaRows) {
    const counts = Array(61).fill(0);
    const lastYear = Array(61).fill(null);
    const asc = viradaRows.slice().sort((a, b) => a.sp.year - b.sp.year);
    asc.forEach((row) => {
      (row.draw.n || []).forEach((n) => {
        if (n >= 1 && n <= 60) {
          counts[n]++;
          lastYear[n] = row.sp.year;
        }
      });
    });

    const totalEditions = viradaRows.length || 1;
    const items = [];
    for (let n = 1; n <= 60; n++) {
      items.push({
        num: n,
        count: counts[n],
        pct: counts[n] / totalEditions,
        status: counts[n] > 0 ? "Já saiu" : "Nunca saiu",
        lastYear: lastYear[n]
      });
    }
    items.sort((a, b) => b.count - a.count || a.num - b.num);
    return items;
  }

  function exportKitBolaoViradaXLSX(megasenaDraws, opts = {}) {
    if (!hasEntitlement("kit_bolao_virada")) {
      throw new Error("Adquira o Kit Bolão Mega da Virada 2026 ou o Pacote Completo para baixar este arquivo.");
    }
    const XLSX = getXLSX();
    if (!XLSX) {
      throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    }

    const wb = XLSX.utils.book_new();

    // Aba 1: Rateio_Bolao (com fórmulas reais)
    const rateioRows = [
      ["KIT BOLÃO MEGA DA VIRADA 2026 - CONTROLE DE RATEIO E COTAS"],
      ["Altere os participantes, quantidade de cotas, valor por cota e prêmio estimado. Totais calculados automaticamente."],
      ["Parâmetro do Bolão", "Valor", "Observação"],
      ["Total de Cotas Vendidas", { t: "n", f: "SUM(B10:B39)", z: "#,##0" }, "Soma automática das cotas (B10:B39)"],
      ["Valor Unitário da Cota (R$)", { t: "n", v: 50, z: '"R$" #,##0.00' }, "Valor cobrado por cada cota"],
      ["Total Arrecadado (R$)", { t: "n", f: "SUM(C10:C39)", z: '"R$" #,##0.00' }, "Soma automática dos valores pagos (C10:C39)"],
      ["Prêmio Estimado Mega da Virada (R$)", { t: "n", v: 1000000000, z: '"R$" #,##0.00' }, "Estimativa oficial de R$ 1 bilhão (edite após o sorteio)"],
      ["Prêmio Bruto por Cota (R$)", { t: "n", f: "IF(B4>0,B7/B4,0)", z: '"R$" #,##0.00' }, "Prêmio dividido igualmente pelo total de cotas"],
      ["Participante", "Cotas", "Valor Pago (R$)", "Participação (%)", "Prêmio Estimado (R$)", "Status Pagamento"]
    ];

    for (let i = 1; i <= 30; i++) {
      const r = 9 + i; // linhas 10..39
      rateioRows.push([
        `Participante ${pad2(i)}`,
        { t: "n", v: i <= 10 ? 1 : 0, z: "#,##0" },
        { t: "n", f: `B${r}*$B$5`, z: '"R$" #,##0.00' },
        { t: "n", f: `IF($B$4>0,B${r}/$B$4,0)`, z: "0.00%" },
        { t: "n", f: `IF($B$4>0,$B$7*(B${r}/$B$4),0)`, z: '"R$" #,##0.00' },
        i <= 10 ? "Pendente" : ""
      ]);
    }
    const wsRateio = XLSX.utils.aoa_to_sheet(rateioRows);
    wsRateio["!cols"] = [
      { wch: 36 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRateio, "Rateio_Bolao");

    // Aba 2: Jogos_e_Conferidor (conferência automática para o Concurso #3100)
    const confRows = [
      ["CONFERIDOR AUTOMÁTICO - MEGA DA VIRADA 2026 (CONCURSO #3100)"],
      ["", "Dez 1", "Dez 2", "Dez 3", "Dez 4", "Dez 5", "Dez 6", "", "", "", "", "", "", ""],
      ["Resultado Oficial (#3100)", "", "", "", "", "", "", "", "", "", "", "", "", "Digite as 6 dezenas sorteadas em B3:G3"],
      ["Preencha seus jogos nas linhas abaixo (6 a 10 dezenas entre B6:K35). As colunas L, M e N conferem automaticamente."],
      ["Jogo", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "Dezenas", "Acertos", "Premiação"]
    ];
    for (let i = 1; i <= 30; i++) {
      const r = 5 + i; // linhas 6..35
      const countifs = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]
        .map((col) => `COUNTIF($B$3:$G$3,${col}${r})`)
        .join("+");
      confRows.push([
        `Jogo ${pad2(i)}`,
        "", "", "", "", "", "", "", "", "", "",
        { t: "n", f: `COUNTA(B${r}:K${r})`, z: "#,##0" },
        { t: "n", f: countifs, z: "#,##0" },
        {
          t: "s",
          f: `IF(L${r}<6,"-",IF(M${r}=6,"SENA",IF(M${r}=5,"QUINA",IF(M${r}=4,"QUADRA","-"))))`
        }
      ]);
    }
    const wsConf = XLSX.utils.aoa_to_sheet(confRows);
    wsConf["!cols"] = [
      { wch: 26 },
      { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 },
      { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 },
      { wch: 11 },
      { wch: 11 },
      { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsConf, "Jogos_e_Conferidor");

    // Aba 3: Historico_Virada
    const viradaRows = getViradaRows(megasenaDraws);
    const histHeaders = [
      "Edição",
      "Ano",
      "Concurso",
      "Data Sorteio",
      "Dezena 1",
      "Dezena 2",
      "Dezena 3",
      "Dezena 4",
      "Dezena 5",
      "Dezena 6",
      "Dezenas Combinadas",
      "Ganhadores Sena",
      "Prêmio por Aposta (R$)",
      "Prêmio Total Sena (R$)",
      "Ganhadores Quina",
      "Rateio Quina (R$)",
      "Ganhadores Quadra",
      "Rateio Quadra (R$)"
    ];
    const histData = viradaRows.map((row) => {
      const nums = (row.draw.n || []).slice().sort((a, b) => a - b);
      return [
        `${row.sp.edition}ª`,
        row.sp.year,
        row.draw.c,
        row.draw.d,
        ...nums,
        nums.map(pad2).join(" - "),
        { t: "n", v: Number(row.p6.g || 0), z: "#,##0" },
        { t: "n", v: Number(row.p6.v || 0), z: '"R$" #,##0.00' },
        { t: "n", v: Number(row.totalSena || 0), z: '"R$" #,##0.00' },
        { t: "n", v: Number(row.p5.g || 0), z: "#,##0" },
        { t: "n", v: Number(row.p5.v || 0), z: '"R$" #,##0.00' },
        { t: "n", v: Number(row.p4.g || 0), z: "#,##0" },
        { t: "n", v: Number(row.p4.v || 0), z: '"R$" #,##0.00' }
      ];
    });
    const wsHist = createFormattedWorksheet(XLSX, histHeaders, histData);
    XLSX.utils.book_append_sheet(wb, wsHist, "Historico_Virada");

    // Aba 4: Frequencia_Virada
    const freqItems = computeViradaFrequencies(viradaRows);
    const freqHeaders = [
      "Posição",
      "Dezena",
      "Aparições na Virada",
      "Frequência (%)",
      "Situação",
      "Última Aparição (Ano)"
    ];
    const freqData = freqItems.map((it, idx) => [
      idx + 1,
      pad2(it.num),
      { t: "n", v: it.count, z: "#,##0" },
      { t: "n", v: it.pct, z: "0.0%" },
      it.status,
      it.lastYear ? it.lastYear : "-"
    ]);
    const wsFreq = createFormattedWorksheet(XLSX, freqHeaders, freqData);
    XLSX.utils.book_append_sheet(wb, wsFreq, "Frequencia_Virada");

    const filename = "Kit_Bolao_Mega_da_Virada_2026.xlsx";
    if (opts.download !== false) {
      XLSX.writeFile(wb, filename);
    }
    return { wb, filename };
  }

  function exportKitBolaoViradaPDF(megasenaDraws, opts = {}) {
    if (!hasEntitlement("kit_bolao_virada")) {
      throw new Error("Adquira o Kit Bolão Mega da Virada 2026 ou o Pacote Completo para baixar este guia.");
    }
    const JsPDF = getJsPDF();
    if (!JsPDF) {
      throw new Error("A biblioteca de geração de PDF ainda está carregando.");
    }

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const viradaRows = getViradaRows(megasenaDraws);
    const freqItems = computeViradaFrequencies(viradaRows);
    const top12 = freqItems.slice(0, 12);
    const neverDrawn = freqItems.filter((x) => x.count === 0).map((x) => pad2(x.num));

    // Cabeçalho institucional
    doc.setFillColor(15, 92, 58);
    doc.rect(0, 0, 210, 28, "F");
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 26, 210, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Kit Bolão Mega da Virada 2026 (Concurso #3100)", 14, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Guia Executivo: Regras 2026, Tabela Oficial de Probabilidades, Checklist e Histórico", 14, 19);

    let y = 37;
    doc.setTextColor(20, 38, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("1. Regras Oficiais da Mega da Virada 2026 (#3100)", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const rulesLines = [
      "- Concurso Especial #3100 com estimativa oficial de prêmio principal de R$ 1 bilhão.",
      "- Prazo final para registro das apostas: 31/12/2026 às 22h (horário de Brasília).",
      "- Sorteio programado para a manhã de 01/01/2027 às 11h (novo horário oficial da Caixa).",
      "- Regra de não acumulação: se ninguém acertar as 6 dezenas, o valor é dividido na Quina (5 acertos).",
      "- Aposta simples (6 dezenas): R$ 6,00. Bolão oficial Caixa pode ser dividido em cotas com recibos individuais."
    ];
    rulesLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 4.5;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. Tabela Oficial de Custos e Probabilidades (6 a 20 dezenas)", 14, y);
    y += 3;

    const probRows = [];
    for (let k = 6; k <= 20; k++) {
      const combos = comb(k, 6);
      const cost = combos * 6.0;
      const oddsSena = Math.round(comb(60, 6) / combos);
      const oddsQuina = Math.round(comb(60, 6) / (combos * 6 * 54 / 6));
      probRows.push([
        `${k} dezenas`,
        intFmt.format(combos),
        brlFmt.format(cost),
        `1 em ${intFmt.format(oddsSena)}`,
        `${combos}x`
      ]);
    }

    doc.autoTable({
      head: [["Volante", "Apostas Simples", "Custo Oficial", "Chance na Sena", "Ganho de Chance"]],
      body: probRows,
      startY: y,
      theme: "striped",
      headStyles: { fillColor: [15, 92, 58], textColor: 255, fontSize: 7.5 },
      styles: { fontSize: 7.2, cellPadding: 1.4, textColor: [20, 38, 28] },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;
    if (y > 235) {
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("3. Checklist Prático para Organizar seu Bolão", 14, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const checklist = [
      "1. Defina o orçamento total e o valor de cada cota antes de registrar os bilhetes.",
      "2. Prefira o Bolão Oficial da Caixa na lotérica para emitir recibos nominais independentes por cota.",
      "3. Caso organize grupo informal, registre cada cota paga na aba Rateio_Bolao e envie foto dos bilhetes.",
      "4. Identifique verso de cada comprovante físico com nome completo e CPF do responsável.",
      "5. Evite jogos apenas com números de 01 a 31 (datas), que multiplicam a divisão de prêmio com outros ganhadores.",
      "6. Guarde os recibos originais: o prazo legal de resgate na Caixa é de 90 dias corridos após o sorteio."
    ];
    checklist.forEach((line) => {
      doc.text(line, 14, y);
      y += 4.6;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("4. Estatísticas Históricas da Mega da Virada (2009 a 2025)", 14, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const topStr = top12.map((x) => `${pad2(x.num)} (${x.count}x)`).join(", ");
    const neverStr = neverDrawn.length ? neverDrawn.join(", ") : "Nenhuma";
    doc.text(doc.splitTextToSize(`Top 12 dezenas mais sorteadas: ${topStr}.`, 182), 14, y);
    y += 9;
    doc.text(`Dezenas que nunca saíram na Virada (${neverDrawn.length}): ${neverStr}.`, 14, y);
    y += 6;

    const histTable = viradaRows.map((row) => [
      `${row.sp.year} (#${row.draw.c})`,
      row.draw.d,
      row.draw.n.map(pad2).join(" - "),
      `${row.p6.g} gan.`,
      brlFmt.format(row.p6.v || 0),
      brlFmt.format(row.totalSena || 0)
    ]);

    doc.autoTable({
      head: [["Edição", "Data", "Dezenas", "Sena", "Prêmio por Aposta", "Prêmio Total Sena"]],
      body: histTable,
      startY: y,
      theme: "striped",
      headStyles: { fillColor: [15, 92, 58], textColor: 255, fontSize: 7.5 },
      styles: { fontSize: 7.2, cellPadding: 1.5, textColor: [20, 38, 28] },
      margin: { left: 14, right: 14 },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(100, 115, 105);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount} | Kit Bolão Mega da Virada 2026 - Atlas das Loterias`,
          105,
          290,
          { align: "center" }
        );
      }
    });

    const filename = "Guia_Bolao_Mega_da_Virada_2026.pdf";
    if (opts.download !== false) {
      doc.save(filename);
    }
    return { doc, filename };
  }

  function buildSpecialSummaryRow(lotteryId, label, drawsList) {
    const specialDraws = Specials ? Specials.getSpecialDraws(lotteryId, drawsList) : [];
    const mainKey =
      lotteryId === "megasena" ? "6" : lotteryId === "lotofacil" ? "15" : lotteryId === "quina" ? "5" : "20";
    let totalWinners = 0;
    let maxPrize = 0;
    let maxPrizeYear = "-";
    let firstYear = "-";
    let lastYear = "-";

    const years = [];
    specialDraws.forEach((d) => {
      const sp = Specials.getSpecialDrawInfo(lotteryId, d);
      if (sp) years.push(sp.year);
      const pMain = (d.p && d.p[mainKey]) || null;
      if (pMain) totalWinners += Number(pMain.g || 0);
      const tot = Specials.computeTotalMainPrize(lotteryId, d);
      if (tot > maxPrize) {
        maxPrize = tot;
        maxPrizeYear = sp ? String(sp.year) : d.d;
      }
    });

    if (years.length) {
      firstYear = String(Math.min(...years));
      lastYear = String(Math.max(...years));
    }

    const meta = Specials ? Specials.getSpecialMeta(lotteryId) : null;
    return {
      lotteryId,
      label,
      count: specialDraws.length,
      firstYear,
      lastYear,
      totalWinners,
      maxPrize,
      maxPrizeYear,
      note: meta ? meta.ruleNote : ""
    };
  }

  function exportDossieEspeciaisXLSX(allLotteriesData, opts = {}) {
    if (!hasEntitlement("dossie_especiais")) {
      throw new Error("Adquira o Dossiê Concursos Especiais ou o Pacote Completo para baixar este arquivo.");
    }
    const XLSX = getXLSX();
    if (!XLSX) {
      throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    }

    const wb = XLSX.utils.book_new();
    const specs = [
      { id: "megasena", sheet: "Mega_da_Virada", label: "Mega da Virada" },
      { id: "lotofacil", sheet: "Lotofacil_Independencia", label: "Lotofácil da Independência" },
      { id: "quina", sheet: "Quina_Sao_Joao", label: "Quina de São João" },
      { id: "lotomania", sheet: "Lotomania_Pascoa", label: "Lotomania de Páscoa" }
    ];

    const summaryHeaders = [
      "Concurso Especial",
      "Edições na Base",
      "Primeiro Ano",
      "Último Ano",
      "Ganhadores Faixa Principal",
      "Maior Prêmio Total na Base (R$)",
      "Ano do Recorde",
      "Regra e Observações"
    ];
    const summaryRows = specs.map((s) => {
      const entry = allLotteriesData[s.id] || { draws: [] };
      const sum = buildSpecialSummaryRow(s.id, s.label, entry.draws || []);
      const isLotomania = s.id === "lotomania";
      return [
        sum.label,
        { t: "n", v: sum.count, z: "#,##0" },
        sum.firstYear,
        sum.lastYear,
        isLotomania ? "Faixa 20 acertos indisponível na API" : { t: "n", v: sum.totalWinners, z: "#,##0" },
        isLotomania ? "Consultar aba Lotomania_Pascoa (19 e 0 acertos)" : { t: "n", v: sum.maxPrize, z: '"R$" #,##0.00' },
        isLotomania ? "-" : sum.maxPrizeYear,
        sum.note
      ];
    });
    const wsSum = createFormattedWorksheet(XLSX, summaryHeaders, summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSum, "Resumo_Comparativo");

    specs.forEach((s) => {
      const entry = allLotteriesData[s.id];
      if (!entry || !entry.cfg) return;
      const specialDraws = Specials
        ? Specials.getSpecialDraws(s.id, entry.draws || []).slice().sort((a, b) => b.c - a.c)
        : [];
      const { headers, rows } = buildLotterySheetData(entry.cfg, specialDraws);
      const ws = createFormattedWorksheet(XLSX, headers, rows);
      XLSX.utils.book_append_sheet(wb, ws, s.sheet);
    });

    const filename = "Dossie_Concursos_Especiais_Loterias_Caixa.xlsx";
    if (opts.download !== false) {
      XLSX.writeFile(wb, filename);
    }
    return { wb, filename };
  }

  function exportDossieEspeciaisPDF(allLotteriesData, opts = {}) {
    if (!hasEntitlement("dossie_especiais")) {
      throw new Error("Adquira o Dossiê Concursos Especiais ou o Pacote Completo para baixar este arquivo.");
    }
    const JsPDF = getJsPDF();
    if (!JsPDF) {
      throw new Error("A biblioteca de geração de PDF ainda está carregando.");
    }

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFillColor(20, 38, 28);
    doc.rect(0, 0, 210, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Dossiê Histórico dos Concursos Especiais da Caixa", 14, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Mega da Virada, Lotofácil da Independência, Quina de São João e Lotomania de Páscoa", 14, 18);

    const specs = [
      { id: "megasena", label: "Mega da Virada" },
      { id: "lotofacil", label: "Lotofácil da Independência" },
      { id: "quina", label: "Quina de São João" },
      { id: "lotomania", label: "Lotomania de Páscoa" }
    ];

    const summaryBody = specs.map((s) => {
      const entry = allLotteriesData[s.id] || { draws: [] };
      const sum = buildSpecialSummaryRow(s.id, s.label, entry.draws || []);
      const isLotomania = s.id === "lotomania";
      return [
        sum.label,
        String(sum.count),
        `${sum.firstYear} a ${sum.lastYear}`,
        isLotomania ? "Ver faixas 19 e 0" : intFmt.format(sum.totalWinners),
        isLotomania ? "API sem faixa 20" : `${brlFmt.format(sum.maxPrize)} (${sum.maxPrizeYear})`
      ];
    });

    doc.autoTable({
      head: [["Concurso Especial", "Edições", "Período", "Ganhadores Faixa 1", "Maior Prêmio na Base"]],
      body: summaryBody,
      startY: 34,
      theme: "striped",
      headStyles: { fillColor: [15, 92, 58], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2, textColor: [20, 38, 28] },
      margin: { left: 14, right: 14 }
    });

    specs.forEach((s) => {
      const entry = allLotteriesData[s.id];
      if (!entry || !entry.cfg) return;
      const specialDraws = Specials
        ? Specials.getSpecialDraws(s.id, entry.draws || []).slice().sort((a, b) => b.c - a.c)
        : [];
      if (specialDraws.length) {
        renderLotteryPDFSection(doc, entry.cfg, specialDraws, true, s.label);
      }
    });

    const filename = "Dossie_Concursos_Especiais_Loterias_Caixa.pdf";
    if (opts.download !== false) {
      doc.save(filename);
    }
    return { doc, filename };
  }

  const api = {
    PRODUCTS,
    ALL_LOTTERIES,
    formatBRLFromCents,
    getProductByLottery,
    readEntitlementsRecord,
    getUnlockedSet,
    hasEntitlement,
    hasLotteryAccess,
    hasAllLotteries,
    hasAnyEntitlement,
    getUnlockedLotteries,
    grantEntitlements,
    startCheckout,
    verifySession,
    checkStripeReturn,
    exportLotteryXLSX,
    exportLotteryPDF,
    exportAllLotteriesXLSX,
    exportAllLotteriesPDF,
    exportKitBolaoViradaXLSX,
    exportKitBolaoViradaPDF,
    exportDossieEspeciaisXLSX,
    exportDossieEspeciaisPDF
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AtlasStore = api;
})(typeof window !== "undefined" ? window : globalThis);
