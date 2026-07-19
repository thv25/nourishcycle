export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  const { sourceId, amount, planType, currency } = req.body;
  if (!sourceId || !amount || !planType) return res.status(400).json({ error: "Missing required payment fields" });
  try {
    const squareUrl = process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com/v2/payments"
      : "https://connect.squareupsandbox.com/v2/payments";
    const response = await fetch(squareUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`, "Square-Version": "2024-01-18" },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: `${planType}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        amount_money: { amount, currency: currency || "USD" },
        note: planType === "monthly" ? "NourishCycle — Monthly ($15/mo)" : "NourishCycle — Single Plan ($5)",
      }),
    });
    const data = await response.json();
    if (!response.ok || data.errors) return res.status(400).json({ error: data.errors?.[0]?.detail || "Payment declined." });
    if (data.payment?.status !== "COMPLETED") return res.status(400).json({ error: "Payment was not completed." });
    return res.status(200).json({ success: true, paymentId: data.payment.id, planType });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
