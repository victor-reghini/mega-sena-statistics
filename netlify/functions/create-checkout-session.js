// Netlify Serverless Function: Criação Resiliente de Sessão Stripe Checkout Multi-Produto (com E-mail Validado)
import crypto from "node:crypto";

const ALL_LOTTERIES = [
  "megasena",
  "lotofacil",
  "quina",
  "lotomania",
  "maismilionaria",
  "timemania",
  "duplasena",
  "diadesorte",
  "supersete"
];

const PRODUCT_CATALOG = {
  export_megasena: {
    name: "Planilha Mega-Sena + Mega da Virada (XLSX + PDF)",
    description: "Base completa de resultados da Mega-Sena e todas as edições da Mega da Virada em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["megasena"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_MEGASENA",
    linkEnv: "STRIPE_LINK_EXPORT_MEGASENA",
    defaultPriceId: "price_1UdY0eLbOL7pa0nJXI2uQFTq",
    defaultLink: "https://buy.stripe.com/aFa6oI94p1F73QZ88beQM01"
  },
  export_lotofacil: {
    name: "Planilha Lotofácil + Independência (XLSX + PDF)",
    description: "Base completa de resultados da Lotofácil e Lotofácil da Independência em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["lotofacil"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_LOTOFACIL",
    linkEnv: "STRIPE_LINK_EXPORT_LOTOFACIL",
    defaultPriceId: "price_1UdY0gLbOL7pa0nJBrD7rC7F",
    defaultLink: "https://buy.stripe.com/eVqfZi1BX5Vndrz9cfeQM02"
  },
  export_quina: {
    name: "Planilha Quina + São João (XLSX + PDF)",
    description: "Base completa de resultados da Quina e Quina de São João em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["quina"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_QUINA",
    linkEnv: "STRIPE_LINK_EXPORT_QUINA",
    defaultPriceId: "price_1UdY0hLbOL7pa0nJIH7PZBlW",
    defaultLink: "https://buy.stripe.com/4gM8wQ5Sd1F7fzH0FJeQM03"
  },
  export_lotomania: {
    name: "Planilha Lotomania + Páscoa (XLSX + PDF)",
    description: "Base completa de resultados da Lotomania e Lotomania de Páscoa em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["lotomania"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_LOTOMANIA",
    linkEnv: "STRIPE_LINK_EXPORT_LOTOMANIA",
    defaultPriceId: "price_1UdY0iLbOL7pa0nJO77PSg9g",
    defaultLink: "https://buy.stripe.com/9B6dRa3K5abDevDewzeQM04"
  },
  export_maismilionaria: {
    name: "Planilha +Milionária Completa (XLSX + PDF)",
    description: "Base completa de resultados da +Milionária (6 dezenas + 2 trevos e 10 faixas de rateio) em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["maismilionaria"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_MAISMILIONARIA",
    linkEnv: "STRIPE_LINK_EXPORT_MAISMILIONARIA",
    defaultPriceId: "price_1Uf1U7LbOL7pa0nJBxgL5iRa",
    defaultLink: "https://buy.stripe.com/28E00k0xTfvX3QZ2NReQM09"
  },
  export_timemania: {
    name: "Planilha Timemania Completa (XLSX + PDF)",
    description: "Base completa de resultados da Timemania (7 dezenas + Time do Coração) em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["timemania"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_TIMEMANIA",
    linkEnv: "STRIPE_LINK_EXPORT_TIMEMANIA",
    defaultPriceId: "price_1Uf1U9LbOL7pa0nJG6V3Bdg1",
    defaultLink: "https://buy.stripe.com/eVq3cw0xTcjLdrz1JNeQM0a"
  },
  export_duplasena: {
    name: "Planilha Dupla Sena + Dupla de Páscoa (XLSX + PDF)",
    description: "Base completa de resultados da Dupla Sena (1º e 2º sorteios) e edições da Dupla de Páscoa em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["duplasena"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_DUPLASENA",
    linkEnv: "STRIPE_LINK_EXPORT_DUPLASENA",
    defaultPriceId: "price_1Uf1UALbOL7pa0nJHJP9GZ8y",
    defaultLink: "https://buy.stripe.com/00wfZidkF3Nf3QZ2NReQM0b"
  },
  export_diadesorte: {
    name: "Planilha Dia de Sorte Completa (XLSX + PDF)",
    description: "Base completa de resultados do Dia de Sorte (7 dezenas + Mês da Sorte) em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["diadesorte"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_DIADESORTE",
    linkEnv: "STRIPE_LINK_EXPORT_DIADESORTE",
    defaultPriceId: "price_1Uf1UCLbOL7pa0nJhjK2JkFC",
    defaultLink: "https://buy.stripe.com/9B6bJ23K5dnPafn3RVeQM0c"
  },
  export_supersete: {
    name: "Planilha Super Sete Completa (XLSX + PDF)",
    description: "Base completa de resultados do Super Sete (7 colunas numeradas de 0 a 9) em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["supersete"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_SUPERSETE",
    linkEnv: "STRIPE_LINK_EXPORT_SUPERSETE",
    defaultPriceId: "price_1Uf1UELbOL7pa0nJ8M1azGUo",
    defaultLink: "https://buy.stripe.com/aFa28sgwR4Rj87ffADeQM0d"
  },
  combo_all: {
    name: "Combo 9 Loterias Completo (XLSX + PDF)",
    description: "Acesso para exportar todas as 9 loterias oficiais da Caixa e todos os concursos especiais.",
    amountCents: 2490,
    unlocks: ALL_LOTTERIES,
    priceEnv: "STRIPE_PRICE_ID_COMBO_ALL",
    linkEnv: "STRIPE_LINK_COMBO_ALL",
    defaultPriceId: "price_1UdY0lLbOL7pa0nJk1nYqxgl",
    defaultLink: "https://buy.stripe.com/00weVe3K583v9bjewzeQM05"
  },
  kit_bolao_virada: {
    name: "Kit Bolão Mega da Virada 2026 (Excel + Guia PDF)",
    description: "Planilha com rateio de cotas, conferidor automático do concurso 3100, histórico da Virada e guia em PDF.",
    amountCents: 1490,
    unlocks: ["kit_bolao_virada"],
    priceEnv: "STRIPE_PRICE_ID_KIT_BOLAO_VIRADA",
    linkEnv: "STRIPE_LINK_KIT_BOLAO_VIRADA",
    defaultPriceId: "price_1UdY0nLbOL7pa0nJEJv2AN3m",
    defaultLink: "https://buy.stripe.com/aFabJ2gwR0B39bj88beQM06"
  },
  dossie_especiais: {
    name: "Dossiê Concursos Especiais (XLSX + PDF)",
    description: "Comparativo histórico em Excel e PDF de Mega da Virada, Independência, Quina de São João, Dupla de Páscoa e Lotomania de Páscoa.",
    amountCents: 1990,
    unlocks: ["dossie_especiais"],
    priceEnv: "STRIPE_PRICE_ID_DOSSIE_ESPECIAIS",
    linkEnv: "STRIPE_LINK_DOSSIE_ESPECIAIS",
    defaultPriceId: "price_1UdY0oLbOL7pa0nJiwGingZg",
    defaultLink: "https://buy.stripe.com/4gM00k94p5VngDLgEHeQM07"
  },
  super_combo: {
    name: "Pacote Completo Atlas + Virada (9 Loterias + Kit Bolão + Dossiê)",
    description: "Todas as 9 planilhas oficiais + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais.",
    amountCents: 3490,
    unlocks: [...ALL_LOTTERIES, "kit_bolao_virada", "dossie_especiais"],
    priceEnv: "STRIPE_PRICE_ID_SUPER_COMBO",
    linkEnv: "STRIPE_LINK_SUPER_COMBO",
    defaultPriceId: "price_1UdY0pLbOL7pa0nJFrkhnZIt",
    defaultLink: "https://buy.stripe.com/eVqeVebcxgA1cnvbkneQM08"
  }
};

const ALLOWED_RETURN_PATHS = [
  "/",
  "/index.html",
  "/mega-da-virada",
  "/mega-da-virada.html"
];

function getCorsOrigin(req) {
  const origin = (req && req.headers && req.headers.get("origin")) || "";
  if (!origin) return "https://lotery-statistics.netlify.app";
  if (origin === "https://lotery-statistics.netlify.app") return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return "https://lotery-statistics.netlify.app";
}

function jsonResponse(payload, status = 200, req = null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": getCorsOrigin(req),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function sanitizeOrigin(candidate, fallback) {
  if (!candidate) return fallback;
  try {
    const u = new URL(candidate);
    const normalized = `${u.protocol}//${u.host}`;
    if (normalized === fallback) return normalized;
    if (u.hostname === "lotery-statistics.netlify.app" && u.protocol === "https:") return normalized;
    if (u.hostname.endsWith(".netlify.app") && u.protocol === "https:") return normalized;
    if ((u.hostname === "localhost" || u.hostname === "127.0.0.1") && (u.protocol === "http:" || u.protocol === "https:")) {
      return normalized;
    }
  } catch (e) {}
  return fallback;
}

function sanitizeReturnPath(candidate) {
  if (!candidate || typeof candidate !== "string") return "/";
  const clean = candidate.split("?")[0].split("#")[0].trim();
  return ALLOWED_RETURN_PATHS.includes(clean) ? clean : "/";
}

function verifyEmailToken(tokenStr, secretKey, expectedEmail, expectedProductId) {
  if (!tokenStr || typeof tokenStr !== "string" || !secretKey) return null;
  const parts = tokenStr.trim().split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig || !/^[a-f0-9]{64}$/i.test(providedSig)) return null;

  const expectedSig = crypto.createHmac("sha256", secretKey).update(payloadB64).digest("hex");
  const bufA = Buffer.from(providedSig.toLowerCase(), "utf8");
  const bufB = Buffer.from(expectedSig.toLowerCase(), "utf8");
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object") return null;
    if (payload.purpose !== "verified_purchase_email" || payload.verified !== true) return null;
    if (Number(payload.exp || 0) <= Date.now()) return null;
    if (expectedEmail && String(payload.email || "").toLowerCase() !== expectedEmail.toLowerCase()) return null;
    if (expectedProductId && payload.productId !== expectedProductId) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function buildBaseParams(productId, product, successUrl, cancelUrl, paymentMode, verifiedEmail) {
  const params = new URLSearchParams();
  params.append("line_items[0][quantity]", "1");
  params.append("mode", "payment");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("metadata[product_id]", productId);
  params.append("metadata[unlocks]", product.unlocks.join(","));
  if (verifiedEmail) {
    params.append("customer_email", verifiedEmail);
    params.append("metadata[verified_email]", verifiedEmail);
  }

  if (paymentMode === "card_pix") {
    params.append("payment_method_types[0]", "card");
    params.append("payment_method_types[1]", "pix");
  } else if (paymentMode === "card_only") {
    params.append("payment_method_types[0]", "card");
  }
  return params;
}

async function postStripeSession(stripeKey, params) {
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function tryCreateWithModes(stripeKey, makeParamsFn) {
  // Tenta com métodos automáticos do Dashboard, depois card_only, depois card_pix
  const modes = ["auto", "card_only", "card_pix"];
  let lastResult = null;
  for (const mode of modes) {
    const params = makeParamsFn(mode);
    const res = await postStripeSession(stripeKey, params);
    if (res.ok && res.data && res.data.url) {
      return res;
    }
    lastResult = res;
    const errMsg = String((res.data && res.data.error && res.data.error.message) || "").toLowerCase();
    // Se o erro for de permissão da chave restrita (403) em price_data, não adianta repetir o mesmo modo
    if (res.status === 403 || errMsg.includes("permission") || errMsg.includes("rak_")) {
      break;
    }
  }
  return lastResult;
}

async function fetchProductFromPrice(stripeKey, priceId) {
  if (!priceId) return null;
  try {
    const res = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}`, {
      headers: { "Authorization": `Bearer ${stripeKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data.product === "string" ? data.product : null;
  } catch (e) {
    return null;
  }
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(req),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método não permitido." }, 405, req);
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const productId = body && typeof body.productId === "string" ? body.productId.trim() : "";
  const product = PRODUCT_CATALOG[productId];
  if (!product) {
    return jsonResponse({ ok: false, error: "Produto selecionado inválido." }, 400);
  }

  const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const emailVerificationToken = body && typeof body.emailVerificationToken === "string" ? body.emailVerificationToken.trim() : "";

  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  const defaultPriceId = (process.env.STRIPE_PRICE_ID || "price_1UaaJVLbOL7pa0nJ0ROoF0wr").trim();
  const configuredPriceId = ((product.priceEnv && process.env[product.priceEnv]) || product.defaultPriceId || "").trim();
  const productLink = ((product.linkEnv && process.env[product.linkEnv]) || product.defaultLink || "").trim();

  if (!stripeKey) {
    return jsonResponse({ ok: false, error: "Serviço de pagamento não configurado no servidor." }, 503);
  }

  const verifiedEmailPayload = verifyEmailToken(emailVerificationToken, stripeKey, email);
  if (!verifiedEmailPayload || !verifiedEmailPayload.email) {
    return jsonResponse({
      ok: false,
      error: "Valide seu endereço de e-mail antes de gerar o link de pagamento."
    }, 403);
  }
  const verifiedEmail = verifiedEmailPayload.email;

  let origin = "https://lotery-statistics.netlify.app";
  try {
    const reqOrigin = new URL(req.url).origin;
    if (reqOrigin && reqOrigin !== "null") {
      origin = reqOrigin;
    }
    if (body && body.origin) {
      origin = sanitizeOrigin(body.origin, origin);
    }
  } catch (e) {}

  const safeReturnPath = sanitizeReturnPath(body && body.returnPath);
  const successUrl = `${origin}${safeReturnPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${safeReturnPath}?payment=canceled&product=${encodeURIComponent(productId)}`;

  const decorateLinkWithEmail = (url) => {
    if (!url || !verifiedEmail) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}prefilled_email=${encodeURIComponent(verifiedEmail)}`;
  };

  try {
    // Etapa 1: Price ID dedicado configurado para este produto
    if (configuredPriceId) {
      const r1 = await tryCreateWithModes(stripeKey, (mode) => {
        const p = buildBaseParams(productId, product, successUrl, cancelUrl, mode, verifiedEmail);
        p.append("line_items[0][price]", configuredPriceId);
        return p;
      });
      if (r1 && r1.ok && r1.data && r1.data.url) {
        return jsonResponse({ ok: true, url: r1.data.url, sessionId: r1.data.id, productId, verifiedEmail }, 200);
      }
    }

    // Etapa 2: price_data dinâmico com product_data inline
    const r2 = await tryCreateWithModes(stripeKey, (mode) => {
      const p = buildBaseParams(productId, product, successUrl, cancelUrl, mode, verifiedEmail);
      p.append("line_items[0][price_data][currency]", "brl");
      p.append("line_items[0][price_data][unit_amount]", String(product.amountCents));
      p.append("line_items[0][price_data][product_data][name]", product.name);
      p.append("line_items[0][price_data][product_data][description]", product.description);
      return p;
    });
    if (r2 && r2.ok && r2.data && r2.data.url) {
      return jsonResponse({ ok: true, url: r2.data.url, sessionId: r2.data.id, productId, verifiedEmail }, 200);
    }

    // Etapa 3: se a chave restrita (rk_live_) não tiver Products:Write, reutiliza o Product ID existente de STRIPE_PRICE_ID
    const existingProdId = await fetchProductFromPrice(stripeKey, defaultPriceId);
    if (existingProdId) {
      const r3 = await tryCreateWithModes(stripeKey, (mode) => {
        const p = buildBaseParams(productId, product, successUrl, cancelUrl, mode, verifiedEmail);
        p.append("line_items[0][price_data][currency]", "brl");
        p.append("line_items[0][price_data][unit_amount]", String(product.amountCents));
        p.append("line_items[0][price_data][product]", existingProdId);
        return p;
      });
      if (r3 && r3.ok && r3.data && r3.data.url) {
        return jsonResponse({ ok: true, url: r3.data.url, sessionId: r3.data.id, productId, verifiedEmail }, 200);
      }
    }

    // Etapa 4: se a chave restrita (rk_live_) só permitir Checkout Sessions com STRIPE_PRICE_ID pré-cadastrado
    if (defaultPriceId) {
      const r4 = await tryCreateWithModes(stripeKey, (mode) => {
        const p = buildBaseParams(productId, product, successUrl, cancelUrl, mode, verifiedEmail);
        p.append("line_items[0][price]", defaultPriceId);
        p.append("metadata[used_base_price]", "true");
        return p;
      });
      if (r4 && r4.ok && r4.data && r4.data.url) {
        return jsonResponse({ ok: true, url: r4.data.url, sessionId: r4.data.id, productId, verifiedEmail }, 200);
      }
    }

    if (productLink) {
      return jsonResponse({ ok: true, url: decorateLinkWithEmail(productLink), fallback: true, productId, verifiedEmail }, 200);
    }

    return jsonResponse({
      ok: false,
      error: "Não foi possível iniciar a sessão no Stripe. Verifique as permissões da chave STRIPE_SECRET_KEY (Checkout Sessions: Write)."
    }, 502);
  } catch (err) {
    if (productLink) {
      return jsonResponse({ ok: true, url: decorateLinkWithEmail(productLink), fallback: true, productId, verifiedEmail }, 200);
    }
    return jsonResponse({
      ok: false,
      error: "Falha de comunicação com o provedor de pagamento. Tente novamente em instantes."
    }, 502);
  }
};
