// Netlify Serverless Function: Verificação Segura de Sessão Stripe
export default async (req) => {
  const url = new URL(req.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();

  // 1. Sanitização estrita do formato do ID de sessão Stripe
  const SESSION_REGEX = /^cs_(live|test)_[a-zA-Z0-9_-]{20,120}$/;
  if (!sessionId || !SESSION_REGEX.test(sessionId)) {
    return new Response(JSON.stringify({ ok: false, error: "Identificador de sessão inválido ou ausente." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  if (!stripeKey) {
    return new Response(JSON.stringify({ ok: false, error: "Serviço de pagamento não configurado no servidor." }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        "Authorization": `Bearer ${stripeKey}`
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Sessão de pagamento não localizada ou expirada." }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await res.json();

    // 2. Validação rigorosa: status pago, valor exato (R$ 15,00 = 1500 centavos) e moeda BRL
    const isPaid = data.payment_status === "paid";
    const isCompleted = data.status === "complete";
    const isCorrectAmount = Number(data.amount_total) === 1500;
    const isCorrectCurrency = String(data.currency || "").toLowerCase() === "brl";

    const verified = isPaid && isCompleted && isCorrectAmount && isCorrectCurrency;

    return new Response(JSON.stringify({
      ok: true,
      paid: verified,
      status: data.status,
      customer_email: data.customer_details ? data.customer_details.email : null
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Falha na comunicação com o provedor de pagamento." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

