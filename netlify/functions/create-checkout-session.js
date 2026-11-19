// Netlify Serverless Function: Criação de Sessão Stripe Checkout Multi-Produto
const PRODUCT_CATALOG = {
  export_megasena: {
    name: "Planilha Mega-Sena + Mega da Virada (XLSX + PDF)",
    description: "Base completa de resultados da Mega-Sena e todas as edições da Mega da Virada em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["megasena"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_MEGASENA",
    linkEnv: "STRIPE_LINK_EXPORT_MEGASENA"
  },
  export_lotofacil: {
    name: "Planilha Lotofácil + Independência (XLSX + PDF)",
    description: "Base completa de resultados da Lotofácil e Lotofácil da Independência em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["lotofacil"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_LOTOFACIL",
    linkEnv: "STRIPE_LINK_EXPORT_LOTOFACIL"
  },
  export_quina: {
    name: "Planilha Quina + São João (XLSX + PDF)",
    description: "Base completa de resultados da Quina e Quina de São João em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["quina"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_QUINA",
    linkEnv: "STRIPE_LINK_EXPORT_QUINA"
  },
  export_lotomania: {
    name: "Planilha Lotomania + Páscoa (XLSX + PDF)",
    description: "Base completa de resultados da Lotomania e Lotomania de Páscoa em Excel (.xlsx) e PDF.",
    amountCents: 1000,
    unlocks: ["lotomania"],
    priceEnv: "STRIPE_PRICE_ID_EXPORT_LOTOMANIA",
    linkEnv: "STRIPE_LINK_EXPORT_LOTOMANIA"
  },
  combo_all: {
    name: "Combo 4 Loterias Completo (XLSX + PDF)",
    description: "Acesso vitalício para exportar Mega-Sena, Lotofácil, Quina, Lotomania e todos os concursos especiais.",
    amountCents: 2490,
    unlocks: ["megasena", "lotofacil", "quina", "lotomania"],
    priceEnv: "STRIPE_PRICE_ID_COMBO_ALL",
    linkEnv: "STRIPE_LINK_COMBO_ALL"
  },
  kit_bolao_virada: {
    name: "Kit Bolão Mega da Virada 2026 (Excel + Guia PDF)",
    description: "Planilha com rateio de cotas, conferidor automático do concurso 3100, histórico da Virada e guia em PDF.",
    amountCents: 1490,
    unlocks: ["kit_bolao_virada"],
    priceEnv: "STRIPE_PRICE_ID_KIT_BOLAO_VIRADA",
    linkEnv: "STRIPE_LINK_KIT_BOLAO_VIRADA"
  },
  dossie_especiais: {
    name: "Dossiê Concursos Especiais (XLSX + PDF)",
    description: "Comparativo histórico em Excel e PDF de Mega da Virada, Independência, Quina de São João e Páscoa.",
    amountCents: 1990,
    unlocks: ["dossie_especiais"],
    priceEnv: "STRIPE_PRICE_ID_DOSSIE_ESPECIAIS",
    linkEnv: "STRIPE_LINK_DOSSIE_ESPECIAIS"
  },
  super_combo: {
    name: "Pacote Completo Atlas + Virada (4 Loterias + Kit Bolão + Dossiê)",
    description: "Todas as 4 planilhas oficiais + Kit Bolão Mega da Virada 2026 + Dossiê Concursos Especiais.",
    amountCents: 3490,
    unlocks: ["megasena", "lotofacil", "quina", "lotomania", "kit_bolao_virada", "dossie_especiais"],
    priceEnv: "STRIPE_PRICE_ID_SUPER_COMBO",
    linkEnv: "STRIPE_LINK_SUPER_COMBO"
  }
};

const ALLOWED_ORIGINS = [
  "https://lotery-statistics.netlify.app",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
];

const ALLOWED_RETURN_PATHS = [
  "/",
  "/index.html",
  "/mega-da-virada",
  "/mega-da-virada.html"
];

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function sanitizeOrigin(candidate, fallback) {
  if (!candidate) return fallback;
  try {
    const u = new URL(candidate);
    const normalized = `${u.protocol}//${u.host}`;
    if (ALLOWED_ORIGINS.includes(normalized)) return normalized;
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

function buildStripeParams(productId, product, successUrl, cancelUrl, includePix) {
  const params = new URLSearchParams();
  const configuredPriceId = product.priceEnv ? (process.env[product.priceEnv] || "").trim() : "";

  if (configuredPriceId) {
    params.append("line_items[0][price]", configuredPriceId);
  } else {
    params.append("line_items[0][price_data][currency]", "brl");
    params.append("line_items[0][price_data][unit_amount]", String(product.amountCents));
    params.append("line_items[0][price_data][product_data][name]", product.name);
    params.append("line_items[0][price_data][product_data][description]", product.description);
  }

  params.append("line_items[0][quantity]", "1");
  params.append("mode", "payment");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("metadata[product_id]", productId);
  params.append("metadata[unlocks]", product.unlocks.join(","));
  params.append("payment_method_types[0]", "card");
  if (includePix) {
    params.append("payment_method_types[1]", "pix");
  }
  return params;
}

async function createStripeSession(stripeKey, params) {
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

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
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

  let origin = "https://lotery-statistics.netlify.app";
  try {
    const reqOrigin = new URL(req.url).origin;
    origin = sanitizeOrigin(reqOrigin, origin);
    if (body && body.origin) {
      origin = sanitizeOrigin(body.origin, origin);
    }
  } catch (e) {}

  const safeReturnPath = sanitizeReturnPath(body && body.returnPath);
  const successUrl = `${origin}${safeReturnPath}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${safeReturnPath}?payment=canceled&product=${encodeURIComponent(productId)}`;

  const productLink = product.linkEnv ? (process.env[product.linkEnv] || "").trim() : "";
  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();

  if (!stripeKey) {
    if (productLink) {
      return jsonResponse({ ok: true, url: productLink, fallback: true, productId }, 200);
    }
    return jsonResponse({ ok: false, error: "Serviço de pagamento não configurado no servidor." }, 503);
  }

  try {
    let result = await createStripeSession(
      stripeKey,
      buildStripeParams(productId, product, successUrl, cancelUrl, true)
    );

    if (!result.ok && result.status === 400) {
      const errMsg = String((result.data && result.data.error && result.data.error.message) || "").toLowerCase();
      const errParam = String((result.data && result.data.error && result.data.error.param) || "").toLowerCase();
      if (errMsg.includes("pix") || errParam.includes("payment_method_types")) {
        result = await createStripeSession(
          stripeKey,
          buildStripeParams(productId, product, successUrl, cancelUrl, false)
        );
      }
    }

    if (result.ok && result.data && result.data.url) {
      return jsonResponse({
        ok: true,
        url: result.data.url,
        sessionId: result.data.id,
        productId
      }, 200);
    }

    if (productLink) {
      return jsonResponse({ ok: true, url: productLink, fallback: true, productId }, 200);
    }

    return jsonResponse({
      ok: false,
      error: "Não foi possível iniciar o checkout Stripe no momento. Tente novamente em instantes."
    }, 502);
  } catch (err) {
    if (productLink) {
      return jsonResponse({ ok: true, url: productLink, fallback: true, productId }, 200);
    }
    return jsonResponse({
      ok: false,
      error: "Falha de comunicação com o provedor de pagamento. Tente novamente em instantes."
    }, 502);
  }
};
