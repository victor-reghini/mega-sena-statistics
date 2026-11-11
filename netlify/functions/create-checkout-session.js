// Netlify Serverless Function: Criação de Sessão Stripe Checkout
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
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || "";
  const priceId = process.env.STRIPE_PRICE_ID || "price_1UaaJVLbOL7pa0nJ0ROoF0wr";
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "https://buy.stripe.com/bJe6oI5Sd2JbgDLewzeQM00";

  const ALLOWED_ORIGINS = [
    "https://lotery-statistics.netlify.app",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
  ];

  function sanitizeOrigin(candidate, fallback) {
    if (!candidate) return fallback;
    try {
      const u = new URL(candidate);
      const normalized = `${u.protocol}//${u.host}`;
      if (ALLOWED_ORIGINS.includes(normalized)) return normalized;
      if (u.hostname.endsWith(".netlify.app")) return normalized;
    } catch (e) {}
    return fallback;
  }

  let origin = "https://lotery-statistics.netlify.app";
  try {
    const reqOrigin = new URL(req.url).origin;
    origin = sanitizeOrigin(reqOrigin, origin);

    const body = await req.json();
    if (body && body.origin) {
      origin = sanitizeOrigin(body.origin, origin);
    }
  } catch (e) { }

  const successUrl = `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/?payment=canceled`;

  const params = new URLSearchParams();
  params.append("line_items[0][price]", priceId);
  params.append("line_items[0][quantity]", "1");
  params.append("mode", "payment");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("payment_method_types[0]", "card");
  params.append("payment_method_types[1]", "pix");

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await res.json();
    if (res.ok && data.url) {
      return new Response(JSON.stringify({ ok: true, url: data.url, sessionId: data.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({ ok: true, url: paymentLink, fallback: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: true, url: paymentLink, fallback: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

