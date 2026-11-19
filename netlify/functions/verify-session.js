// Netlify Serverless Function: Verificação Criptográfica de Sessão Stripe e Emissão de Token Assinado (HMAC-SHA256)
import crypto from "node:crypto";

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
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

function signExportToken(payload, secretKey) {
  const jsonStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(jsonStr, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secretKey).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
}

export default async (req) => {
  const url = new URL(req.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();

  const SESSION_REGEX = /^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/;
  if (!sessionId || !SESSION_REGEX.test(sessionId)) {
    return jsonResponse({ ok: false, paid: false, error: "Identificador de sessão inválido ou ausente." }, 400);
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeKey) {
    return jsonResponse({ ok: false, paid: false, error: "Serviço de pagamento não configurado no servidor." }, 503);
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        "Authorization": `Bearer ${stripeKey}`
      }
    });

    if (!res.ok) {
      return jsonResponse({ ok: false, paid: false, error: "Sessão de pagamento não localizada ou expirada." }, 404);
    }

    const data = await res.json();

    const isPaid = data.payment_status === "paid";
    const isCompleted = data.status === "complete";
    const isCorrectCurrency = String(data.currency || "").toLowerCase() === "brl";
    const amountCents = Number(data.amount_total || 0);

    const metadata = data.metadata || {};
    let metaProductId = typeof metadata.product_id === "string" ? metadata.product_id.trim() : "";
    const usedBasePrice = metadata.used_base_price === "true";

    let productName = null;
    let unlocks = [];
    let isCorrectAmount = false;

    if (metaProductId && PRODUCT_CATALOG[metaProductId]) {
      const product = PRODUCT_CATALOG[metaProductId];
      isCorrectAmount = amountCents === product.amountCents || (usedBasePrice && amountCents >= 1000);
      productName = product.name;
      unlocks = product.unlocks;
    } else if (!metaProductId && amountCents === 1500) {
      metaProductId = "legacy_all_15";
      productName = "Pacote 4 Loterias (Compra Anterior)";
      unlocks = ["megasena", "lotofacil", "quina", "lotomania"];
      isCorrectAmount = true;
    }

    const verified = isPaid && isCompleted && isCorrectAmount && isCorrectCurrency && unlocks.length > 0;
    const verifiedMetaEmail = typeof metadata.verified_email === "string" ? metadata.verified_email.trim().toLowerCase() : "";
    const stripeCustomerEmail =
      (data.customer_details && data.customer_details.email) ||
      data.customer_email ||
      "";
    const customerEmail = verifiedMetaEmail || String(stripeCustomerEmail || "").trim().toLowerCase() || null;

    const receiptNumber = `REC-ATLAS-${sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase()}`;
    const paidAtIso = new Date(data.created ? Number(data.created) * 1000 : Date.now()).toISOString();
    const amountFormatted = `R$ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;

    let exportToken = null;
    let receipt = null;
    if (verified) {
      const nowMs = Date.now();
      receipt = {
        receiptNumber,
        sessionId,
        paymentIntent: typeof data.payment_intent === "string" ? data.payment_intent : "",
        productId: metaProductId,
        productName,
        amountCents,
        amountFormatted,
        currency: "BRL",
        customerEmail: customerEmail || "",
        paidAtIso,
        senderEmail: (process.env.SMTP_USER || "reghinidev@gmail.com").trim() || "reghinidev@gmail.com"
      };
      exportToken = signExportToken(
        {
          sid: sessionId,
          pid: metaProductId,
          productName,
          amountCents,
          receiptNumber,
          paidAtIso,
          unlocks,
          email: customerEmail || "",
          iat: nowMs,
          exp: nowMs + 30 * 24 * 60 * 60 * 1000
        },
        stripeKey
      );
    }

    return jsonResponse({
      ok: true,
      paid: verified,
      exportToken,
      productId: metaProductId || null,
      productName,
      amountCents,
      unlocks: verified ? unlocks : [],
      status: data.status,
      customer_email: customerEmail,
      receipt
    }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, paid: false, error: "Falha na comunicação com o provedor de pagamento." }, 500);
  }
};
