// Netlify Serverless Function: Verificação Segura de Sessão Stripe Multi-Produto
const PRODUCT_CATALOG = {
  export_megasena: {
    name: "Planilha Mega-Sena + Mega da Virada (XLSX + PDF)",
    amountCents: 1000,
    unlocks: ["megasena"]
  },
  export_lotofacil: {
    name: "Planilha Lotofácil + Independência (XLSX + PDF)",
    amountCents: 1000,
    unlocks: ["lotofacil"]
  },
  export_quina: {
    name: "Planilha Quina + São João (XLSX + PDF)",
    amountCents: 1000,
    unlocks: ["quina"]
  },
  export_lotomania: {
    name: "Planilha Lotomania + Páscoa (XLSX + PDF)",
    amountCents: 1000,
    unlocks: ["lotomania"]
  },
  combo_all: {
    name: "Combo 4 Loterias Completo (XLSX + PDF)",
    amountCents: 2490,
    unlocks: ["megasena", "lotofacil", "quina", "lotomania"]
  },
  kit_bolao_virada: {
    name: "Kit Bolão Mega da Virada 2026 (Excel + Guia PDF)",
    amountCents: 1490,
    unlocks: ["kit_bolao_virada"]
  },
  dossie_especiais: {
    name: "Dossiê Concursos Especiais (XLSX + PDF)",
    amountCents: 1990,
    unlocks: ["dossie_especiais"]
  },
  super_combo: {
    name: "Pacote Completo Atlas + Virada (4 Loterias + Kit Bolão + Dossiê)",
    amountCents: 3490,
    unlocks: ["megasena", "lotofacil", "quina", "lotomania", "kit_bolao_virada", "dossie_especiais"]
  }
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();

  // 1. Sanitização estrita do formato do ID de sessão Stripe
  const SESSION_REGEX = /^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/;
  if (!sessionId || !SESSION_REGEX.test(sessionId)) {
    return jsonResponse({ ok: false, error: "Identificador de sessão inválido ou ausente." }, 400);
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeKey) {
    return jsonResponse({ ok: false, error: "Serviço de pagamento não configurado no servidor." }, 503);
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        "Authorization": `Bearer ${stripeKey}`
      }
    });

    if (!res.ok) {
      return jsonResponse({ ok: false, error: "Sessão de pagamento não localizada ou expirada." }, 404);
    }

    const data = await res.json();

    const isPaid = data.payment_status === "paid";
    const isCompleted = data.status === "complete";
    const isCorrectCurrency = String(data.currency || "").toLowerCase() === "brl";
    const amountCents = Number(data.amount_total || 0);

    let metaProductId = data.metadata && typeof data.metadata.product_id === "string"
      ? data.metadata.product_id.trim()
      : "";
    let productName = null;
    let unlocks = [];
    let isCorrectAmount = false;

    if (metaProductId && PRODUCT_CATALOG[metaProductId]) {
      const product = PRODUCT_CATALOG[metaProductId];
      isCorrectAmount = amountCents === product.amountCents;
      productName = product.name;
      unlocks = product.unlocks;
    } else if (!metaProductId && amountCents === 1500) {
      // Retrocompatibilidade com sessões antigas do pacote único de R$ 15,00
      metaProductId = "legacy_all_15";
      productName = "Pacote 4 Loterias (Compra Anterior)";
      unlocks = ["megasena", "lotofacil", "quina", "lotomania"];
      isCorrectAmount = true;
    }

    const verified = isPaid && isCompleted && isCorrectAmount && isCorrectCurrency;

    return jsonResponse({
      ok: true,
      paid: verified,
      productId: metaProductId || null,
      productName,
      amountCents,
      unlocks: verified ? unlocks : [],
      status: data.status,
      customer_email: data.customer_details ? data.customer_details.email : null
    }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Falha na comunicação com o provedor de pagamento." }, 500);
  }
};
