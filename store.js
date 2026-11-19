(function (root) {
  "use strict";

  const Specials =
    root.AtlasSpecials ||
    (typeof require === "function" ? require("./special-draws.js") : null);

  const SIGNED_TOKEN_STORAGE_KEY = "atlas_signed_export_token_v3";
  const LEGACY_KEYS_TO_PURGE = ["mega_results_export_paid", "mega_results_export_paid_session", "atlas_unlocked_entitlements_v2"];
  const ALL_LOTTERIES = ["megasena", "lotofacil", "quina", "lotomania"];
  const OFFICIAL_EMAIL = "reghinidev@gmail.com";

  const PRODUCTS = Object.freeze({
    export_megasena: Object.freeze({
      id: "export_megasena",
      name: "Planilha Mega-Sena + Mega da Virada",
      shortName: "Mega-Sena + Virada",
      description: "Todo o histórico da Mega-Sena e todas as edições da Mega da Virada em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: Object.freeze(["megasena"]),
      formatLabel: "XLSX + PDF"
    }),
    export_lotofacil: Object.freeze({
      id: "export_lotofacil",
      name: "Planilha Lotofácil + Independência",
      shortName: "Lotofácil + Independência",
      description: "Todo o histórico da Lotofácil e Lotofácil da Independência em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: Object.freeze(["lotofacil"]),
      formatLabel: "XLSX + PDF"
    }),
    export_quina: Object.freeze({
      id: "export_quina",
      name: "Planilha Quina + São João",
      shortName: "Quina + São João",
      description: "Todo o histórico da Quina e Quina de São João em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: Object.freeze(["quina"]),
      formatLabel: "XLSX + PDF"
    }),
    export_lotomania: Object.freeze({
      id: "export_lotomania",
      name: "Planilha Lotomania + Páscoa",
      shortName: "Lotomania + Páscoa",
      description: "Todo o histórico da Lotomania e Lotomania de Páscoa em Excel (.xlsx) e PDF.",
      amountCents: 1000,
      compareAtCents: null,
      unlocks: Object.freeze(["lotomania"]),
      formatLabel: "XLSX + PDF"
    }),
    combo_all: Object.freeze({
      id: "combo_all",
      name: "Combo 4 Loterias Completo",
      shortName: "Combo 4 Loterias",
      description: "Desbloqueia Mega-Sena, Lotofácil, Quina, Lotomania e todos os concursos especiais (38% de desconto).",
      amountCents: 2490,
      compareAtCents: 4000,
      unlocks: Object.freeze(["megasena", "lotofacil", "quina", "lotomania"]),
      formatLabel: "XLSX Multi-Abas + PDFs"
    }),
    kit_bolao_virada: Object.freeze({
      id: "kit_bolao_virada",
      name: "Kit Bolão Mega da Virada 2026",
      shortName: "Kit Bolão Virada 2026",
      description: "Planilha Excel com rateio de cotas, conferidor automático do concurso #3100, histórico e guia em PDF.",
      amountCents: 1490,
      compareAtCents: null,
      unlocks: Object.freeze(["kit_bolao_virada"]),
      formatLabel: "XLSX com Fórmulas + Guia PDF"
    }),
    dossie_especiais: Object.freeze({
      id: "dossie_especiais",
      name: "Dossiê Concursos Especiais",
      shortName: "Dossiê Especiais",
      description: "Relatório em Excel (5 abas) e PDF reunindo Virada, Independência, Quina de São João e Páscoa.",
      amountCents: 1990,
      compareAtCents: null,
      unlocks: Object.freeze(["dossie_especiais"]),
      formatLabel: "XLSX 5 Abas + PDF"
    }),
    super_combo: Object.freeze({
      id: "super_combo",
      name: "Pacote Completo Atlas + Virada",
      shortName: "Pacote Completo",
      description: "As 4 planilhas oficiais + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais com desconto máximo.",
      amountCents: 3490,
      compareAtCents: 7480,
      unlocks: Object.freeze(["megasena", "lotofacil", "quina", "lotomania", "kit_bolao_virada", "dossie_especiais"]),
      formatLabel: "XLSX + PDF Completos"
    })
  });

  const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const intFmt = new Intl.NumberFormat("pt-BR");

  // Estado privado inacessível pelo console do navegador: só é preenchido após resposta assinada do servidor
  let activeSignedToken = null;
  let verifiedEntitlements = new Set();
  let verifiedCustomerEmail = "";
  let verifiedSessionId = "";
  let activeWritePermit = false;

  // Blindagem das funções de escrita de arquivos contra execução direta pelo console DevTools
  let privateXlsxWriteFile = null;
  let privatePdfSave = null;

  function installConsoleDownloadGuards() {
    try {
      if (root.XLSX && typeof root.XLSX.writeFile === "function" && !privateXlsxWriteFile) {
        privateXlsxWriteFile = root.XLSX.writeFile.bind(root.XLSX);
        root.XLSX.writeFile = function () {
          if (!activeWritePermit) {
            throw new Error("Bloqueio de segurança: exportação direta via console desativada. Conclua o pagamento no Stripe.");
          }
          return privateXlsxWriteFile.apply(root.XLSX, arguments);
        };
      }
      if (
        root.jspdf &&
        root.jspdf.jsPDF &&
        root.jspdf.jsPDF.prototype &&
        typeof root.jspdf.jsPDF.prototype.save === "function" &&
        !privatePdfSave
      ) {
        privatePdfSave = root.jspdf.jsPDF.prototype.save;
        root.jspdf.jsPDF.prototype.save = function () {
          if (!activeWritePermit) {
            throw new Error("Bloqueio de segurança: exportação direta via console desativada. Conclua o pagamento no Stripe.");
          }
          return privatePdfSave.apply(this, arguments);
        };
      }
    } catch (e) {}
  }

  installConsoleDownloadGuards();

  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  function purgeLegacyUnverifiedStorage() {
    const ls = getStorage();
    if (!ls) return;
    LEGACY_KEYS_TO_PURGE.forEach((k) => {
      try {
        ls.removeItem(k);
      } catch (e) {}
    });
  }

  purgeLegacyUnverifiedStorage();

  function loadStoredSignedToken() {
    const ls = getStorage();
    if (!ls) return null;
    try {
      const raw = ls.getItem(SIGNED_TOKEN_STORAGE_KEY);
      if (raw && typeof raw === "string" && raw.includes(".")) {
        return raw.trim();
      }
    } catch (e) {}
    return null;
  }

  function saveSignedToken(tokenStr) {
    const ls = getStorage();
    if (!ls) return;
    try {
      if (tokenStr) {
        ls.setItem(SIGNED_TOKEN_STORAGE_KEY, tokenStr);
      } else {
        ls.removeItem(SIGNED_TOKEN_STORAGE_KEY);
      }
    } catch (e) {}
  }

  function clearVerifiedSession() {
    activeSignedToken = null;
    verifiedEntitlements = new Set();
    verifiedCustomerEmail = "";
    verifiedSessionId = "";
    saveSignedToken(null);
    purgeLegacyUnverifiedStorage();
  }

  function applyServerVerifiedState(tokenStr, unlocksList, customerEmail, sessionId) {
    if (!tokenStr || typeof tokenStr !== "string" || !tokenStr.includes(".")) {
      clearVerifiedSession();
      return;
    }
    activeSignedToken = tokenStr.trim();
    verifiedEntitlements = new Set(
      (Array.isArray(unlocksList) ? unlocksList : []).filter((x) => typeof x === "string" && x.trim())
    );
    verifiedCustomerEmail = typeof customerEmail === "string" ? customerEmail.trim() : "";
    verifiedSessionId = typeof sessionId === "string" ? sessionId.trim() : "";
    saveSignedToken(activeSignedToken);
  }

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

  function getUnlockedSet() {
    return new Set(verifiedEntitlements);
  }

  function hasEntitlement(key) {
    return Boolean(activeSignedToken) && verifiedEntitlements.has(key);
  }

  function hasLotteryAccess(lotteryId) {
    return hasEntitlement(lotteryId);
  }

  function hasAllLotteries() {
    return Boolean(activeSignedToken) && ALL_LOTTERIES.every((id) => verifiedEntitlements.has(id));
  }

  function hasAnyEntitlement() {
    return Boolean(activeSignedToken) && verifiedEntitlements.size > 0;
  }

  function getUnlockedLotteries() {
    if (!activeSignedToken) return [];
    return ALL_LOTTERIES.filter((id) => verifiedEntitlements.has(id));
  }

  function getVerifiedCustomerEmail() {
    return verifiedCustomerEmail;
  }

  function getVerifiedSessionId() {
    return verifiedSessionId;
  }

  async function revalidateStoredToken() {
    purgeLegacyUnverifiedStorage();
    const candidate = activeSignedToken || loadStoredSignedToken();
    if (!candidate) {
      clearVerifiedSession();
      return { ok: false, authorized: false };
    }

    try {
      const res = await fetch("/api/authorize-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: candidate, target: "status_check", format: "check" })
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (res.ok && data && data.authorized && Array.isArray(data.unlocks)) {
        applyServerVerifiedState(candidate, data.unlocks, data.customerEmail || "", data.sid || "");
        return { ok: true, authorized: true, data };
      }
      clearVerifiedSession();
      return { ok: false, authorized: false, error: (data && data.error) || "Sessão expirada." };
    } catch (err) {
      return { ok: false, authorized: false, error: "Erro de comunicação com o servidor." };
    }
  }

  async function authorizeExportOnServer(target, format) {
    purgeLegacyUnverifiedStorage();
    const token = activeSignedToken || loadStoredSignedToken();
    if (!token) {
      clearVerifiedSession();
      throw new Error("Acesso bloqueado: pagamento não confirmado. Conclua o checkout no Stripe para liberar a exportação.");
    }

    let res;
    let data = {};
    try {
      res = await fetch("/api/authorize-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, target, format })
      });
      data = await res.json();
    } catch (e) {
      throw new Error("Não foi possível validar sua permissão com o servidor de segurança.");
    }

    if (!res.ok || !data || !data.authorized || !data.nonce) {
      if (res && res.status === 403) {
        clearVerifiedSession();
      }
      throw new Error(
        (data && data.error) ||
          "Acesso negado pelo servidor: pagamento não confirmado para esta planilha."
      );
    }

    applyServerVerifiedState(token, data.unlocks, data.customerEmail || verifiedCustomerEmail, data.sid || verifiedSessionId);
    return data;
  }

  const DEFAULT_LOTTERY_META = {
    megasena: {
      id: "megasena",
      name: "Mega-Sena",
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
    }
  };

  function getDefaultDrawsForLottery(lotteryId) {
    const cfg = DEFAULT_LOTTERY_META[lotteryId];
    if (!cfg) return [];
    return Array.isArray(root[cfg.dataVar]) ? root[cfg.dataVar] : [];
  }

  function getDefaultAllLotteriesDataMap() {
    const out = {};
    ALL_LOTTERIES.forEach((id) => {
      out[id] = { cfg: DEFAULT_LOTTERY_META[id], draws: getDefaultDrawsForLottery(id) };
    });
    return out;
  }

  async function requestEmailVerificationCode(email, productId) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const resp = await fetch("/api/email-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_code", email: cleanEmail, productId })
    });
    let data = {};
    try {
      data = await resp.json();
    } catch (e) {
      data = {};
    }
    if (!resp.ok || !data || !data.ok || !data.challengeToken) {
      throw new Error((data && data.error) || "Não foi possível enviar o código de validação para este e-mail.");
    }
    return data;
  }

  async function verifyEmailCode(email, productId, code, challengeToken) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanCode = String(code || "").trim().replace(/\s+/g, "");
    const resp = await fetch("/api/email-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_code",
        email: cleanEmail,
        productId,
        code: cleanCode,
        challengeToken
      })
    });
    let data = {};
    try {
      data = await resp.json();
    } catch (e) {
      data = {};
    }
    if (!resp.ok || !data || !data.ok || !data.verified || !data.emailVerificationToken) {
      throw new Error((data && data.error) || "Código de validação inválido ou expirado.");
    }
    return data;
  }

  async function createCheckoutWithVerifiedEmail(productId, email, emailVerificationToken, options = {}) {
    const product = PRODUCTS[productId];
    const onError = typeof options.onError === "function" ? options.onError : null;
    if (!product) {
      const msg = "Produto selecionado inválido.";
      if (onError) onError(msg);
      return { ok: false, error: msg };
    }

    try {
      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          email: String(email || "").trim().toLowerCase(),
          emailVerificationToken: String(emailVerificationToken || "").trim(),
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
        if (options.autoRedirect === true && root.location) {
          root.location.href = data.url;
        }
        return { ok: true, url: data.url, sessionId: data.sessionId || null, productId, verifiedEmail: data.verifiedEmail || email };
      }

      const errMsg =
        (data && data.error) ||
        "Não foi possível gerar o link de pagamento no Stripe. Tente novamente em instantes.";
      if (onError) onError(errMsg);
      return { ok: false, error: errMsg };
    } catch (err) {
      const errMsg = "Falha de conexão com o servidor de pagamento. Certifique-se de que o servidor está em execução (python3 server.py).";
      if (onError) onError(errMsg);
      return { ok: false, error: errMsg };
    }
  }

  async function startCheckout(productId, options = {}) {
    const product = PRODUCTS[productId];
    const onError = typeof options.onError === "function" ? options.onError : null;
    if (!product) {
      const msg = "Produto selecionado inválido.";
      if (onError) onError(msg);
      return { ok: false, error: msg };
    }

    // Se já vier com e-mail e token validados, gera o link diretamente
    if (options.email && options.emailVerificationToken) {
      return createCheckoutWithVerifiedEmail(productId, options.email, options.emailVerificationToken, {
        ...options,
        autoRedirect: options.autoRedirect !== false
      });
    }

    // Caso contrário, abre o fluxo obrigatório: 1. Informar E-mail -> 2. Validar E-mail -> 3. Gerar Link de Pagamento
    if (root.document) {
      openPurchaseFlowModal(productId, options);
      return { ok: true, modalOpened: true, productId };
    }

    const msg = "É necessário informar e validar um e-mail antes de gerar o link de pagamento.";
    if (onError) onError(msg);
    return { ok: false, error: msg };
  }

  async function verifySession(sessionId, options = {}) {
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

      if (
        res.ok &&
        data &&
        data.paid === true &&
        typeof data.exportToken === "string" &&
        data.exportToken.includes(".") &&
        Array.isArray(data.unlocks) &&
        data.unlocks.length > 0
      ) {
        applyServerVerifiedState(data.exportToken, data.unlocks, data.customer_email || "", cleanId);
        if (options.autoDeliverEmail !== false && root.document) {
          // Dispara automaticamente o envio dos arquivos adquiridos + recibo para o e-mail cadastrado e validado
          autoDeliverPurchasedPackageAndShowReceipt(data);
        }
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
    purgeLegacyUnverifiedStorage();
    if (!root.location) return null;

    try {
      const params = new URLSearchParams(root.location.search);
      const paymentStatus = (params.get("payment") || "").trim();
      const sessionId = (params.get("session_id") || "").trim();
      const canceledProduct = (params.get("product") || "").trim();

      // Remove parâmetros de pagamento da URL imediatamente para impedir manipulação via barra de endereço
      const cleanParams = new URLSearchParams(root.location.search);
      cleanParams.delete("payment");
      cleanParams.delete("session_id");
      cleanParams.delete("product");
      cleanParams.delete("unlocked");
      cleanParams.delete("paid");
      const qs = cleanParams.toString();
      const cleanUrl = root.location.pathname + (qs ? `?${qs}` : "") + root.location.hash;

      if (sessionId || paymentStatus) {
        if (root.history && root.history.replaceState && root.document) {
          root.history.replaceState({}, root.document.title, cleanUrl);
        }
      }

      if (sessionId) {
        if (!/^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/.test(sessionId)) {
          if (typeof callbacks.onError === "function") {
            callbacks.onError("Identificador de sessão na URL é inválido.");
          }
          return null;
        }
        if (typeof callbacks.onValidating === "function") {
          callbacks.onValidating();
        }
        const result = await verifySession(sessionId);
        if (result.ok) {
          if (typeof callbacks.onSuccess === "function") {
            callbacks.onSuccess(result.data);
          }
        } else if (typeof callbacks.onError === "function") {
          callbacks.onError(result.error || "O pagamento desta sessão não foi confirmado pelo Stripe.");
        }
        return result;
      }

      if (paymentStatus === "success" && !sessionId) {
        // Tentativa de burlar adicionando ?payment=success sem session_id real do Stripe
        clearVerifiedSession();
        if (typeof callbacks.onError === "function") {
          callbacks.onError("Tentativa de desbloqueio por URL sem sessão Stripe válida foi bloqueada.");
        }
        return null;
      }

      if (paymentStatus === "canceled") {
        if (typeof callbacks.onCanceled === "function") {
          callbacks.onCanceled(canceledProduct);
        }
        return null;
      }

      // Se houver um token assinado salvo de uma compra anterior legítima, revalida no servidor
      if (loadStoredSignedToken()) {
        const reval = await revalidateStoredToken();
        if (reval.ok && typeof callbacks.onRevalidated === "function") {
          callbacks.onRevalidated(reval.data);
        }
      }
    } catch (e) {}
    return null;
  }

  function getXLSX() {
    installConsoleDownloadGuards();
    if (root.XLSX) return root.XLSX;
    if (typeof require === "function") {
      try {
        return require("./vendor/xlsx.full.min.js");
      } catch (e) {}
    }
    return null;
  }

  function getJsPDF() {
    installConsoleDownloadGuards();
    if (root.jspdf && root.jspdf.jsPDF) return root.jspdf.jsPDF;
    return null;
  }

  function performAuthorizedXlsxSave(XLSX, wb, filename) {
    activeWritePermit = true;
    try {
      if (privateXlsxWriteFile) {
        privateXlsxWriteFile(wb, filename);
      } else {
        XLSX.writeFile(wb, filename);
      }
    } finally {
      activeWritePermit = false;
    }
  }

  function performAuthorizedPdfSave(doc, filename) {
    activeWritePermit = true;
    try {
      if (privatePdfSave) {
        privatePdfSave.call(doc, filename);
      } else {
        doc.save(filename);
      }
    } finally {
      activeWritePermit = false;
    }
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
        const vVal = Math.round((Number(pInfo.v) || 0) * 100) / 100;
        tierCols.push(gVal, vVal);
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

  function buildLotteryWorkbook(XLSX, cfg, drawsList, scopeTag = "_Completo") {
    const wb = XLSX.utils.book_new();
    const { headers, rows } = buildLotterySheetData(cfg, drawsList);
    const ws = createFormattedWorksheet(XLSX, headers, rows);
    XLSX.utils.book_append_sheet(wb, ws, cfg.name);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Loterias_Caixa_${cfg.name}${scopeTag}_${dateStr}.xlsx`;
    return { wb, filename };
  }

  function buildAllLotteriesWorkbook(XLSX, configsMap, getDrawsByLotteryFn) {
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
    return { wb, filename };
  }

  async function exportLotteryXLSX(cfg, drawsList, scopeTag = "_Completo", opts = {}) {
    await authorizeExportOnServer(cfg.id, "xlsx");
    const XLSX = getXLSX();
    if (!XLSX) throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    if (!Array.isArray(drawsList) || !drawsList.length) {
      throw new Error("Nenhum sorteio encontrado para exportar.");
    }
    const { wb, filename } = buildLotteryWorkbook(XLSX, cfg, drawsList, scopeTag);
    if (opts.download !== false) {
      performAuthorizedXlsxSave(XLSX, wb, filename);
    }
    return { wb, filename };
  }

  async function exportAllLotteriesXLSX(configsMap, getDrawsByLotteryFn, opts = {}) {
    await authorizeExportOnServer("all", "xlsx");
    const XLSX = getXLSX();
    if (!XLSX) throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    const { wb, filename } = buildAllLotteriesWorkbook(XLSX, configsMap, getDrawsByLotteryFn);
    if (opts.download !== false) {
      performAuthorizedXlsxSave(XLSX, wb, filename);
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

  async function exportLotteryPDF(cfg, drawsList, scopeTag = "_Completo", subtitleSuffix = "", opts = {}) {
    await authorizeExportOnServer(cfg.id, "pdf");
    const JsPDF = getJsPDF();
    if (!JsPDF) throw new Error("A biblioteca de geração de PDF ainda está carregando.");
    if (!Array.isArray(drawsList) || !drawsList.length) {
      throw new Error("Nenhum sorteio encontrado para exportar em PDF.");
    }

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const sorted = drawsList.slice().sort((a, b) => b.c - a.c);
    renderLotteryPDFSection(doc, cfg, sorted, false, subtitleSuffix);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Loterias_Caixa_${cfg.name}${scopeTag}_${dateStr}.pdf`;
    if (opts.download !== false) {
      performAuthorizedPdfSave(doc, filename);
    }
    return { doc, filename };
  }

  async function exportAllLotteriesPDF(configsMap, getDrawsByLotteryFn, opts = {}) {
    await authorizeExportOnServer("all", "pdf");
    const JsPDF = getJsPDF();
    if (!JsPDF) throw new Error("A biblioteca de geração de PDF ainda está carregando.");

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
      performAuthorizedPdfSave(doc, filename);
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

  function buildKitBolaoViradaWorkbook(XLSX, megasenaDraws) {
    const wb = XLSX.utils.book_new();

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
      const r = 9 + i;
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

    const confRows = [
      ["CONFERIDOR AUTOMÁTICO - MEGA DA VIRADA 2026 (CONCURSO #3100)"],
      ["", "Dez 1", "Dez 2", "Dez 3", "Dez 4", "Dez 5", "Dez 6", "", "", "", "", "", "", ""],
      ["Resultado Oficial (#3100)", "", "", "", "", "", "", "", "", "", "", "", "", "Digite as 6 dezenas sorteadas em B3:G3"],
      ["Preencha seus jogos nas linhas abaixo (6 a 10 dezenas entre B6:K35). As colunas L, M e N conferem automaticamente."],
      ["Jogo", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "Dezenas", "Acertos", "Premiação"]
    ];
    for (let i = 1; i <= 30; i++) {
      const r = 5 + i;
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

    return { wb, filename: "Kit_Bolao_Mega_da_Virada_2026.xlsx" };
  }

  async function exportKitBolaoViradaXLSX(megasenaDraws, opts = {}) {
    await authorizeExportOnServer("kit_bolao_virada", "xlsx");
    const XLSX = getXLSX();
    if (!XLSX) throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    const { wb, filename } = buildKitBolaoViradaWorkbook(XLSX, megasenaDraws);
    if (opts.download !== false) {
      performAuthorizedXlsxSave(XLSX, wb, filename);
    }
    return { wb, filename };
  }

  async function exportKitBolaoViradaPDF(megasenaDraws, opts = {}) {
    await authorizeExportOnServer("kit_bolao_virada", "pdf");
    const JsPDF = getJsPDF();
    if (!JsPDF) throw new Error("A biblioteca de geração de PDF ainda está carregando.");

    const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const viradaRows = getViradaRows(megasenaDraws);
    const freqItems = computeViradaFrequencies(viradaRows);
    const top12 = freqItems.slice(0, 12);
    const neverDrawn = freqItems.filter((x) => x.count === 0).map((x) => pad2(x.num));

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
      performAuthorizedPdfSave(doc, filename);
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

  function buildDossieEspeciaisWorkbook(XLSX, allLotteriesData) {
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

    return { wb, filename: "Dossie_Concursos_Especiais_Loterias_Caixa.xlsx" };
  }

  async function exportDossieEspeciaisXLSX(allLotteriesData, opts = {}) {
    await authorizeExportOnServer("dossie_especiais", "xlsx");
    const XLSX = getXLSX();
    if (!XLSX) throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");
    const { wb, filename } = buildDossieEspeciaisWorkbook(XLSX, allLotteriesData);
    if (opts.download !== false) {
      performAuthorizedXlsxSave(XLSX, wb, filename);
    }
    return { wb, filename };
  }

  async function exportDossieEspeciaisPDF(allLotteriesData, opts = {}) {
    await authorizeExportOnServer("dossie_especiais", "pdf");
    const JsPDF = getJsPDF();
    if (!JsPDF) throw new Error("A biblioteca de geração de PDF ainda está carregando.");

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
      performAuthorizedPdfSave(doc, filename);
    }
    return { doc, filename };
  }

  function extractPdfBase64(doc) {
    if (!doc) return null;
    try {
      if (typeof doc.output === "function") {
        const dataUri = doc.output("datauristring");
        if (typeof dataUri === "string" && dataUri.includes(",")) {
          return dataUri.split(",")[1];
        }
      }
    } catch (e) {}
    return null;
  }

  function writeCompressedXlsxBase64(XLSX, wb) {
    return XLSX.write(wb, { type: "base64", bookType: "xlsx", compression: true });
  }

  function buildAttachmentsForTarget(target, options = {}) {
    const XLSX = getXLSX();
    if (!XLSX) throw new Error("A biblioteca de geração de Excel (.xlsx) ainda está carregando.");

    const attachments = [];
    const xlsxMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (target === "kit_bolao_virada") {
      const msDraws = options.megasenaDraws || options.draws || getDefaultDrawsForLottery("megasena");
      const built = buildKitBolaoViradaWorkbook(XLSX, msDraws);
      attachments.push({
        filename: built.filename,
        fileBase64: writeCompressedXlsxBase64(XLSX, built.wb),
        mimeType: xlsxMime
      });
    } else if (target === "dossie_especiais") {
      const allMap = options.allLotteriesData || options.allLotteriesDataMap || getDefaultAllLotteriesDataMap();
      const built = buildDossieEspeciaisWorkbook(XLSX, allMap);
      attachments.push({
        filename: built.filename,
        fileBase64: writeCompressedXlsxBase64(XLSX, built.wb),
        mimeType: xlsxMime
      });
    } else if (target === "all") {
      const cfgMap = options.configsMap || options.lotteryConfigsMap || DEFAULT_LOTTERY_META;
      const fn = options.getDrawsByLotteryFn || options.getDrawsFn || getDefaultDrawsForLottery;
      ALL_LOTTERIES.forEach((id) => {
        const cfg = cfgMap[id] || DEFAULT_LOTTERY_META[id];
        const draws = fn(id);
        if (cfg && Array.isArray(draws) && draws.length) {
          const builtLot = buildLotteryWorkbook(XLSX, cfg, draws, "_Completo");
          attachments.push({
            filename: builtLot.filename,
            fileBase64: writeCompressedXlsxBase64(XLSX, builtLot.wb),
            mimeType: xlsxMime
          });
        }
      });
    } else if (target === "purchased_bundle") {
      const unlocks = new Set(Array.isArray(options.unlocks) ? options.unlocks : Array.from(verifiedEntitlements));
      ALL_LOTTERIES.forEach((id) => {
        if (unlocks.has(id)) {
          const cfg = DEFAULT_LOTTERY_META[id];
          const draws = getDefaultDrawsForLottery(id);
          if (cfg && draws.length) {
            const builtLot = buildLotteryWorkbook(XLSX, cfg, draws, "_Completo");
            attachments.push({
              filename: builtLot.filename,
              fileBase64: writeCompressedXlsxBase64(XLSX, builtLot.wb),
              mimeType: xlsxMime
            });
          }
        }
      });
      if (unlocks.has("kit_bolao_virada")) {
        const builtKit = buildKitBolaoViradaWorkbook(XLSX, getDefaultDrawsForLottery("megasena"));
        attachments.push({
          filename: builtKit.filename,
          fileBase64: writeCompressedXlsxBase64(XLSX, builtKit.wb),
          mimeType: xlsxMime
        });
      }
      if (unlocks.has("dossie_especiais")) {
        const builtDossie = buildDossieEspeciaisWorkbook(XLSX, getDefaultAllLotteriesDataMap());
        attachments.push({
          filename: builtDossie.filename,
          fileBase64: writeCompressedXlsxBase64(XLSX, builtDossie.wb),
          mimeType: xlsxMime
        });
      }
    } else {
      const cfg = options.cfg || options.lotteryCfg || DEFAULT_LOTTERY_META[target];
      const drawsList = options.drawsList || options.draws || getDefaultDrawsForLottery(target);
      if (!cfg || !Array.isArray(drawsList) || !drawsList.length) {
        throw new Error("Nenhum sorteio selecionado para envio por e-mail.");
      }
      const built = buildLotteryWorkbook(XLSX, cfg, drawsList, options.scopeTag || "_Completo");
      attachments.push({
        filename: built.filename,
        fileBase64: writeCompressedXlsxBase64(XLSX, built.wb),
        mimeType: xlsxMime
      });
    }

    return attachments;
  }

  function batchAttachmentsByPayloadLimit(attachments, maxBatchB64Chars = 2800000) {
    const batches = [];
    let currentBatch = [];
    let currentLen = 0;

    for (const att of attachments) {
      const len = (att.fileBase64 || "").length;
      if (currentBatch.length > 0 && currentLen + len > maxBatchB64Chars) {
        batches.push(currentBatch);
        currentBatch = [att];
        currentLen = len;
      } else {
        currentBatch.push(att);
        currentLen += len;
      }
    }
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    return batches;
  }

  async function sendExportByEmail(options = {}) {
    const recipientEmail = String(options.recipientEmail || verifiedCustomerEmail || "").trim().toLowerCase();
    const target = String(options.target || "purchased_bundle").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      throw new Error("Informe um endereço de e-mail válido para receber os arquivos e o recibo.");
    }

    await authorizeExportOnServer(target === "purchased_bundle" ? "status_check" : target, "email");
    const attachments = buildAttachmentsForTarget(target, options);
    const batches = batchAttachmentsByPayloadLimit(attachments, 2800000);
    const token = activeSignedToken || loadStoredSignedToken();

    let lastData = null;
    const allDeliveredFiles = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const resp = await fetch("/api/send-export-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          target,
          recipientEmail,
          attachments: batch,
          partIndex: i + 1,
          totalParts: batches.length
        })
      });

      let data = {};
      try {
        data = await resp.json();
      } catch (e) {
        data = {};
      }

      if (!resp.ok || !data || !data.sent) {
        const statusHint = resp && resp.status === 413 ? " (Payload excedeu o limite HTTP 413)" : "";
        const err = new Error(
          (data && data.error) ||
            `Não foi possível enviar o e-mail no momento${statusHint}. Entre em contato com ${OFFICIAL_EMAIL}.`
        );
        if (data && data.receipt) {
          err.receipt = data.receipt;
        }
        throw err;
      }

      lastData = data;
      if (data.receipt && Array.isArray(data.receipt.filesDelivered)) {
        data.receipt.filesDelivered.forEach((f) => {
          if (!allDeliveredFiles.includes(f)) allDeliveredFiles.push(f);
        });
      }
    }

    if (lastData && lastData.receipt && allDeliveredFiles.length > 0) {
      lastData.receipt.filesDelivered = allDeliveredFiles;
    }

    return lastData;
  }

  function ensurePurchaseFlowModalDOM() {
    if (!root.document) return null;
    let modal = root.document.getElementById("atlas-purchase-flow-modal");
    if (modal) return modal;

    modal = root.document.createElement("div");
    modal.id = "atlas-purchase-flow-modal";
    modal.className = "modal-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "pf-modal-title");
    modal.hidden = true;

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-lg pf-modal-dialog">
        <div class="modal-header">
          <div>
            <span class="badge-status" style="margin-bottom:6px;display:inline-block;">Compra com Entrega por E-mail</span>
            <h3 id="pf-modal-title" style="margin:0;font-size:1.25rem;">Validar E-mail e Gerar Link de Pagamento</h3>
          </div>
          <button type="button" id="pf-modal-close-btn" class="btn" aria-label="Fechar janela de compra">Fechar (Esc)</button>
        </div>

        <div class="pf-product-summary">
          <div>
            <strong id="pf-product-name" class="pf-product-title">Produto Selecionado</strong>
            <span id="pf-product-desc" class="pf-product-sub"></span>
          </div>
          <div class="pf-product-price-pill" id="pf-product-price">R$ 10,00</div>
        </div>

        <ol class="pf-stepper" aria-label="Etapas da compra">
          <li class="pf-step is-active" id="pf-ind-1"><span class="pf-step-num">1</span><span>Informar E-mail</span></li>
          <li class="pf-step" id="pf-ind-2"><span class="pf-step-num">2</span><span>Validar E-mail</span></li>
          <li class="pf-step" id="pf-ind-3"><span class="pf-step-num">3</span><span>Link de Pagamento</span></li>
          <li class="pf-step" id="pf-ind-4"><span class="pf-step-num">4</span><span>Arquivos + Recibo</span></li>
        </ol>

        <div id="pf-error-banner" class="status-banner error" role="alert" hidden></div>

        <!-- ETAPA 1: INFORMAR E-MAIL -->
        <div id="pf-panel-step1" class="pf-step-panel">
          <p class="pf-panel-desc">
            Informe o seu endereço de e-mail abaixo. Após validar o e-mail e confirmar o pagamento no Stripe, <strong>o(s) arquivo(s) e o recibo oficial serão enviados automaticamente para este e-mail</strong>.
          </p>
          <div class="field-group" style="margin-bottom:14px;">
            <label class="field-label" for="pf-email-input">Seu e-mail para receber os arquivos e o recibo:</label>
            <input type="email" id="pf-email-input" class="text-input" placeholder="seuemail@exemplo.com" autocomplete="email" required>
          </div>
          <div class="pf-actions-row">
            <button type="button" id="pf-btn-request-code" class="btn btn-primary">
              Enviar Código de Validação para o E-mail
            </button>
          </div>
        </div>

        <!-- ETAPA 2: VALIDAR CÓDIGO DO E-MAIL -->
        <div id="pf-panel-step2" class="pf-step-panel" hidden>
          <div class="pf-email-pill-row">
            <span>E-mail informado: <strong id="pf-display-email"></strong></span>
            <button type="button" id="pf-btn-change-email" class="btn-link-action">Alterar e-mail</button>
          </div>
          <div id="pf-code-notice" class="status-banner success" style="margin-bottom:12px;"></div>
          <div id="pf-instant-code-box" class="pf-instant-code-box" hidden>
            <span>Código de verificação instantânea: <strong id="pf-instant-code-val"></strong></span>
            <button type="button" id="pf-btn-fill-instant" class="btn btn-sm">Preencher código</button>
          </div>
          <div class="field-group" style="margin-bottom:14px;">
            <label class="field-label" for="pf-code-input">Digite o código de 6 dígitos para validar seu e-mail:</label>
            <input type="text" id="pf-code-input" class="text-input pf-otp-input" maxlength="6" inputmode="numeric" placeholder="000000" autocomplete="one-time-code">
          </div>
          <div class="pf-actions-row">
            <button type="button" id="pf-btn-verify-code" class="btn btn-primary">
              Validar E-mail e Gerar Link de Pagamento
            </button>
            <button type="button" id="pf-btn-resend-code" class="btn">Reenviar código</button>
          </div>
        </div>

        <!-- ETAPA 3: LINK DE PAGAMENTO GERADO -->
        <div id="pf-panel-step3" class="pf-step-panel" hidden>
          <div class="status-banner success" style="margin-bottom:14px;">
            E-mail <strong id="pf-verified-email-badge"></strong> validado com sucesso!
          </div>
          <p class="pf-panel-desc">
            Seu link exclusivo de pagamento foi gerado no Stripe. Assim que o pagamento for confirmado, seus arquivos oficiais (XLSX e PDF) e o recibo serão enviados para o e-mail validado acima.
          </p>
          <div class="pf-generated-link-box">
            <a id="pf-checkout-link-btn" class="btn-checkout-stripe" href="#" rel="noopener">
              <svg class="btn-checkout-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span id="pf-checkout-link-label">Ir para o Pagamento Seguro no Stripe</span>
            </a>
            <div class="pf-copy-url-row">
              <input type="text" id="pf-checkout-url-readonly" class="text-input" readonly aria-label="Link de pagamento gerado">
              <button type="button" id="pf-btn-copy-url" class="btn">Copiar Link</button>
            </div>
          </div>
        </div>
      </div>
    `;

    root.document.body.appendChild(modal);

    const closeBtn = root.document.getElementById("pf-modal-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.hidden = true;
      });
    }
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.hidden = true;
    });

    return modal;
  }

  function openPurchaseFlowModal(productId, options = {}) {
    const product = PRODUCTS[productId];
    if (!product || !root.document) return;

    const modal = ensurePurchaseFlowModalDOM();
    if (!modal) return;

    const nameEl = root.document.getElementById("pf-product-name");
    const descEl = root.document.getElementById("pf-product-desc");
    const priceEl = root.document.getElementById("pf-product-price");
    const errEl = root.document.getElementById("pf-error-banner");
    const p1 = root.document.getElementById("pf-panel-step1");
    const p2 = root.document.getElementById("pf-panel-step2");
    const p3 = root.document.getElementById("pf-panel-step3");
    const ind1 = root.document.getElementById("pf-ind-1");
    const ind2 = root.document.getElementById("pf-ind-2");
    const ind3 = root.document.getElementById("pf-ind-3");
    const emailInput = root.document.getElementById("pf-email-input");
    const codeInput = root.document.getElementById("pf-code-input");
    const reqBtn = root.document.getElementById("pf-btn-request-code");
    const verifyBtn = root.document.getElementById("pf-btn-verify-code");
    const resendBtn = root.document.getElementById("pf-btn-resend-code");
    const changeEmailBtn = root.document.getElementById("pf-btn-change-email");
    const displayEmail = root.document.getElementById("pf-display-email");
    const codeNotice = root.document.getElementById("pf-code-notice");
    const instantBox = root.document.getElementById("pf-instant-code-box");
    const instantVal = root.document.getElementById("pf-instant-code-val");
    const fillInstantBtn = root.document.getElementById("pf-btn-fill-instant");
    const verifiedBadge = root.document.getElementById("pf-verified-email-badge");
    const checkoutBtn = root.document.getElementById("pf-checkout-link-btn");
    const checkoutLabel = root.document.getElementById("pf-checkout-link-label");
    const urlReadonly = root.document.getElementById("pf-checkout-url-readonly");
    const copyUrlBtn = root.document.getElementById("pf-btn-copy-url");

    if (nameEl) nameEl.textContent = product.name;
    if (descEl) descEl.textContent = product.description;
    if (priceEl) priceEl.textContent = formatBRLFromCents(product.amountCents);
    if (errEl) errEl.hidden = true;

    let currentChallengeToken = "";
    let currentEmail = verifiedCustomerEmail || (emailInput ? emailInput.value.trim() : "");
    if (emailInput && currentEmail) {
      emailInput.value = currentEmail;
    }

    const setStep = (stepNum) => {
      if (errEl) errEl.hidden = true;
      if (p1) p1.hidden = stepNum !== 1;
      if (p2) p2.hidden = stepNum !== 2;
      if (p3) p3.hidden = stepNum !== 3;
      if (ind1) {
        ind1.classList.toggle("is-active", stepNum === 1);
        ind1.classList.toggle("is-done", stepNum > 1);
      }
      if (ind2) {
        ind2.classList.toggle("is-active", stepNum === 2);
        ind2.classList.toggle("is-done", stepNum > 2);
      }
      if (ind3) {
        ind3.classList.toggle("is-active", stepNum === 3);
        ind3.classList.toggle("is-done", stepNum > 3);
      }
    };

    const showErr = (msg) => {
      if (errEl) {
        errEl.textContent = msg;
        errEl.hidden = false;
      }
    };

    setStep(1);
    modal.hidden = false;
    if (emailInput) emailInput.focus();

    const handleRequestCode = async () => {
      const candidateEmail = emailInput ? emailInput.value.trim().toLowerCase() : "";
      if (!candidateEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
        showErr("Informe um endereço de e-mail válido (exemplo: seuemail@dominio.com).");
        if (emailInput) emailInput.focus();
        return;
      }
      if (reqBtn) {
        reqBtn.disabled = true;
        reqBtn.textContent = "Enviando código de validação...";
      }
      if (resendBtn) resendBtn.disabled = true;

      try {
        const res = await requestEmailVerificationCode(candidateEmail, productId);
        currentEmail = res.email || candidateEmail;
        currentChallengeToken = res.challengeToken;
        if (displayEmail) displayEmail.textContent = currentEmail;
        if (codeNotice) {
          codeNotice.textContent =
            res.message ||
            `Código de 6 dígitos enviado para ${currentEmail} (remetente: ${OFFICIAL_EMAIL}).`;
        }
        if (instantBox && instantVal) {
          if (res.instantVerificationCode) {
            instantVal.textContent = res.instantVerificationCode;
            instantBox.hidden = false;
            if (fillInstantBtn) {
              fillInstantBtn.onclick = () => {
                if (codeInput) codeInput.value = res.instantVerificationCode;
              };
            }
          } else {
            instantBox.hidden = true;
          }
        }
        if (codeInput) codeInput.value = "";
        setStep(2);
        if (codeInput) codeInput.focus();
      } catch (err) {
        showErr(err.message);
      } finally {
        if (reqBtn) {
          reqBtn.disabled = false;
          reqBtn.textContent = "Enviar Código de Validação para o E-mail";
        }
        if (resendBtn) resendBtn.disabled = false;
      }
    };

    const handleVerifyAndGenerateLink = async () => {
      const code = codeInput ? codeInput.value.trim().replace(/\s+/g, "") : "";
      if (!/^\d{6}$/.test(code)) {
        showErr("Digite o código numérico de 6 dígitos para validar seu e-mail.");
        if (codeInput) codeInput.focus();
        return;
      }

      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.textContent = "Validando e-mail e gerando link no Stripe...";
      }

      try {
        const vRes = await verifyEmailCode(currentEmail, productId, code, currentChallengeToken);
        const checkoutRes = await createCheckoutWithVerifiedEmail(
          productId,
          currentEmail,
          vRes.emailVerificationToken,
          { autoRedirect: false }
        );
        if (!checkoutRes.ok || !checkoutRes.url) {
          throw new Error(checkoutRes.error || "Falha ao gerar o link de pagamento no Stripe.");
        }

        if (verifiedBadge) verifiedBadge.textContent = currentEmail;
        if (checkoutBtn) checkoutBtn.href = checkoutRes.url;
        if (checkoutLabel) {
          checkoutLabel.textContent = `Pagar ${formatBRLFromCents(product.amountCents)} no Stripe (${product.shortName})`;
        }
        if (urlReadonly) urlReadonly.value = checkoutRes.url;
        if (copyUrlBtn) {
          copyUrlBtn.onclick = () => {
            try {
              if (root.navigator && root.navigator.clipboard) {
                root.navigator.clipboard.writeText(checkoutRes.url);
                copyUrlBtn.textContent = "Link Copiado!";
                setTimeout(() => { copyUrlBtn.textContent = "Copiar Link"; }, 2500);
              }
            } catch (e) {}
          };
        }
        setStep(3);
      } catch (err) {
        showErr(err.message);
      } finally {
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = "Validar E-mail e Gerar Link de Pagamento";
        }
      }
    };

    if (reqBtn) reqBtn.onclick = handleRequestCode;
    if (resendBtn) resendBtn.onclick = handleRequestCode;
    if (verifyBtn) verifyBtn.onclick = handleVerifyAndGenerateLink;
    if (changeEmailBtn) {
      changeEmailBtn.onclick = () => setStep(1);
    }
    if (emailInput) {
      emailInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleRequestCode();
        }
      };
    }
    if (codeInput) {
      codeInput.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleVerifyAndGenerateLink();
        }
      };
    }
  }

  function ensureReceiptModalDOM() {
    if (!root.document) return null;
    let modal = root.document.getElementById("atlas-receipt-modal");
    if (modal) return modal;

    modal = root.document.createElement("div");
    modal.id = "atlas-receipt-modal";
    modal.className = "modal-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "rcpt-modal-title");
    modal.hidden = true;

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-lg pf-modal-dialog">
        <div class="modal-header">
          <div>
            <span class="badge-status badge-success" style="margin-bottom:6px;display:inline-block;">Pagamento Confirmado e Recibo Emitido</span>
            <h3 id="rcpt-modal-title" style="margin:0;font-size:1.25rem;">Recibo Oficial e Envio dos Arquivos por E-mail</h3>
          </div>
          <button type="button" id="rcpt-modal-close-btn" class="btn" aria-label="Fechar recibo">Fechar (Esc)</button>
        </div>

        <div id="rcpt-delivery-banner" class="status-banner success" style="margin-bottom:14px;"></div>

        <div class="rcpt-card" id="rcpt-printable-area">
          <div class="rcpt-card-header">
            <strong>Recibo Oficial de Compra</strong>
            <span id="rcpt-number" class="rcpt-code">REC-ATLAS</span>
          </div>
          <div class="rcpt-rows">
            <div class="rcpt-row"><span>Produto Adquirido:</span><strong id="rcpt-product"></strong></div>
            <div class="rcpt-row"><span>Valor Total Pago:</span><strong id="rcpt-amount" style="color:var(--accent);"></strong></div>
            <div class="rcpt-row"><span>E-mail Cadastrado e Validado:</span><strong id="rcpt-email"></strong></div>
            <div class="rcpt-row"><span>Remetente Oficial:</span><strong>${OFFICIAL_EMAIL}</strong></div>
            <div class="rcpt-row"><span>Sessão Stripe:</span><span id="rcpt-session" style="font-family:var(--font-mono);font-size:0.78rem;"></span></div>
            <div class="rcpt-row"><span>Arquivos Incluídos:</span><span id="rcpt-files" style="font-family:var(--font-mono);font-size:0.8rem;"></span></div>
          </div>
        </div>

        <div class="pf-actions-row" style="margin-top:14px;">
          <button type="button" id="rcpt-btn-resend-email" class="btn btn-primary">
            Reenviar Arquivos e Recibo por E-mail
          </button>
          <button type="button" id="rcpt-btn-close-ok" class="btn">
            Concluir e Ver Downloads Liberados
          </button>
        </div>
      </div>
    `;

    root.document.body.appendChild(modal);

    const closeModal = () => { modal.hidden = true; };
    const closeBtn = root.document.getElementById("rcpt-modal-close-btn");
    const okBtn = root.document.getElementById("rcpt-btn-close-ok");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (okBtn) okBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    return modal;
  }

  async function autoDeliverPurchasedPackageAndShowReceipt(verifyData) {
    if (!root.document || !verifyData) return;
    const modal = ensureReceiptModalDOM();
    if (!modal) return;

    const banner = root.document.getElementById("rcpt-delivery-banner");
    const numEl = root.document.getElementById("rcpt-number");
    const prodEl = root.document.getElementById("rcpt-product");
    const amtEl = root.document.getElementById("rcpt-amount");
    const emailEl = root.document.getElementById("rcpt-email");
    const sessEl = root.document.getElementById("rcpt-session");
    const filesEl = root.document.getElementById("rcpt-files");
    const resendBtn = root.document.getElementById("rcpt-btn-resend-email");

    const receipt = verifyData.receipt || {};
    const recipientEmail = verifyData.customer_email || receipt.customerEmail || verifiedCustomerEmail || "";
    const receiptNum = receipt.receiptNumber || `REC-ATLAS-${String(verifiedSessionId).slice(-8).toUpperCase()}`;
    const prodName = verifyData.productName || receipt.productName || "Planilha Oficial Atlas";
    const amtStr = receipt.amountFormatted || formatBRLFromCents(verifyData.amountCents || 1000);

    if (numEl) numEl.textContent = receiptNum;
    if (prodEl) prodEl.textContent = prodName;
    if (amtEl) amtEl.textContent = amtStr;
    if (emailEl) emailEl.textContent = recipientEmail || "Validado no Stripe";
    if (sessEl) sessEl.textContent = receipt.sessionId || verifiedSessionId;
    if (filesEl) filesEl.textContent = "Preparando arquivos oficiais (.xlsx) e Recibo...";

    if (banner) {
      banner.className = "status-banner";
      banner.textContent = recipientEmail
        ? `Enviando automaticamente o(s) arquivo(s) e o Recibo ${receiptNum} de ${OFFICIAL_EMAIL} para ${recipientEmail}...`
        : "Pagamento confirmado! Preparando seus arquivos e recibo...";
    }

    modal.hidden = false;

    const triggerDelivery = async () => {
      if (!recipientEmail) {
        if (banner) {
          banner.className = "status-banner";
          banner.textContent = "Pagamento confirmado! Utilize a área de downloads para baixar seus arquivos ou informar um e-mail.";
        }
        return;
      }
      if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.textContent = "Enviando para " + recipientEmail + "...";
      }
      try {
        const res = await sendExportByEmail({
          recipientEmail,
          target: "purchased_bundle",
          unlocks: verifyData.unlocks
        });
        if (filesEl && res.receipt && Array.isArray(res.receipt.filesDelivered)) {
          filesEl.textContent = res.receipt.filesDelivered.join(", ");
        }
        if (banner) {
          banner.className = "status-banner success";
          banner.textContent =
            res.message ||
            `Seus arquivos e o Recibo ${receiptNum} foram enviados com sucesso para ${recipientEmail} (remetente: ${OFFICIAL_EMAIL}).`;
        }
      } catch (err) {
        if (err.receipt && Array.isArray(err.receipt.filesDelivered) && filesEl) {
          filesEl.textContent = err.receipt.filesDelivered.join(", ");
        }
        if (banner) {
          banner.className = "status-banner error";
          banner.textContent = err.message;
        }
      } finally {
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = "Reenviar Arquivos e Recibo por E-mail";
        }
      }
    };

    if (resendBtn) {
      resendBtn.onclick = triggerDelivery;
    }

    await triggerDelivery();
  }

  const api = Object.freeze({
    PRODUCTS,
    ALL_LOTTERIES,
    OFFICIAL_EMAIL,
    SUPPORT_EMAIL: OFFICIAL_EMAIL,
    formatBRLFromCents,
    getProductByLottery,
    getUnlockedSet,
    hasEntitlement,
    hasLotteryAccess,
    hasAllLotteries,
    hasAnyEntitlement,
    getUnlockedLotteries,
    getVerifiedCustomerEmail,
    getVerifiedSessionId,
    revalidateStoredToken,
    requestEmailVerificationCode,
    verifyEmailCode,
    createCheckoutWithVerifiedEmail,
    openPurchaseFlowModal,
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
    exportDossieEspeciaisPDF,
    sendExportByEmail
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  try {
    Object.defineProperty(root, "AtlasStore", {
      value: api,
      writable: false,
      configurable: false,
      enumerable: true
    });
  } catch (e) {
    root.AtlasStore = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
