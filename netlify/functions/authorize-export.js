// Netlify Serverless Function: Autorização Criptográfica de Exportação Antes do Download
import crypto from "node:crypto";

const ALL_LOTTERIES = ["megasena", "lotofacil", "quina", "lotomania"];

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

function verifyExportToken(tokenStr, secretKey) {
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
    const rawJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(rawJson);
    if (!payload || typeof payload !== "object") return null;
    if (!payload.sid || !/^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/.test(payload.sid)) return null;
    if (!Array.isArray(payload.unlocks) || payload.unlocks.length === 0) return null;
    if (Number(payload.exp || 0) <= Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function isTargetAllowed(target, unlocks) {
  const set = new Set(unlocks || []);
  if (target === "status_check") return set.size > 0;
  if (target === "all") return ALL_LOTTERIES.every((k) => set.has(k));
  return set.has(target);
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
    return jsonResponse({ ok: false, authorized: false, error: "Método não permitido." }, 405);
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeKey) {
    return jsonResponse({ ok: false, authorized: false, error: "Serviço de verificação não configurado." }, 503);
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    body = {};
  }

  const token = body && typeof body.token === "string" ? body.token.trim() : "";
  const target = body && typeof body.target === "string" ? body.target.trim() : "";

  const payload = verifyExportToken(token, stripeKey);
  if (!payload) {
    return jsonResponse({
      ok: false,
      authorized: false,
      error: "Token de pagamento ausente, expirado ou adulterado. Realize o pagamento para desbloquear."
    }, 403);
  }

  if (!isTargetAllowed(target, payload.unlocks)) {
    return jsonResponse({
      ok: false,
      authorized: false,
      error: "Seu pagamento atual não inclui esta modalidade ou pacote."
    }, 403);
  }

  // Revalidação online da sessão direto na API Stripe para impedir uso de sessão estornada ou falsa
  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(payload.sid)}`, {
      headers: { "Authorization": `Bearer ${stripeKey}` }
    });
    if (!res.ok) {
      return jsonResponse({
        ok: false,
        authorized: false,
        error: "Sessão Stripe não localizada ou inválida."
      }, 403);
    }
    const sessionData = await res.json();
    if (sessionData.payment_status !== "paid" || sessionData.status !== "complete") {
      return jsonResponse({
        ok: false,
        authorized: false,
        error: "O pagamento desta sessão não consta como quitado no Stripe."
      }, 403);
    }
  } catch (err) {
    return jsonResponse({
      ok: false,
      authorized: false,
      error: "Não foi possível confirmar o status do pagamento com o Stripe."
    }, 502);
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  return jsonResponse({
    ok: true,
    authorized: true,
    sid: payload.sid,
    productId: payload.pid,
    unlocks: payload.unlocks,
    customerEmail: payload.email || "",
    target,
    nonce
  }, 200);
};
