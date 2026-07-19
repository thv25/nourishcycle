import { useState, useEffect, useRef } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const THEME = {
  orange:     "#C9622F",
  orangeLight:"#E8855A",
  orangePale: "#FDF0E8",
  tan:        "#C4A882",
  tanLight:   "#EDE0CE",
  tanPale:    "#FAF6F0",
  brown:      "#6B4C31",
  brownLight: "#8B6347",
  brownPale:  "#F5EDE4",
  green:      "#5A7A52",
  greenLight: "#7A9E70",
  greenPale:  "#EDF3EB",
  cream:      "#FBF7F2",
  text:       "#3A2A1A",
  textMid:    "#7A5C3E",
  textLight:  "#A68B6A",
  border:     "#E2CDB8",
  borderLight:"#EFE4D8",
};

// ─── CYCLE PHASES ─────────────────────────────────────────────────────────────
const PHASES = {
  menstrual: {
    id: "menstrual", name: "Menstrual", days: "Days 1–5",
    icon: "🌑", color: THEME.brown, bg: THEME.brownPale, border: "#D4B8A0",
    tagline: "Rest & replenish",
    description: "Focus on iron-rich, anti-inflammatory, warming foods to restore and comfort.",
    nutrients: ["Iron", "Magnesium", "Omega-3s", "Vitamin C"],
    symptoms: ["Fatigue", "Cramps", "Low energy"],
    tips: "Warm, cooked meals are easier to digest right now. Avoid cold raw foods.",
  },
  follicular: {
    id: "follicular", name: "Follicular", days: "Days 6–13",
    icon: "🌱", color: THEME.green, bg: THEME.greenPale, border: "#B8D4B0",
    tagline: "Rise & energize",
    description: "Light, fresh, energizing foods to support rising estrogen and new beginnings.",
    nutrients: ["Zinc", "B vitamins", "Probiotics", "Folate"],
    symptoms: ["Rising energy", "Mental clarity", "Creativity"],
    tips: "Great time for raw foods, sprouts, and fermented foods to support estrogen metabolism.",
  },
  ovulatory: {
    id: "ovulatory", name: "Ovulatory", days: "Days 14–16",
    icon: "🌕", color: THEME.orange, bg: THEME.orangePale, border: "#E8C4A8",
    tagline: "Peak & radiate",
    description: "Antioxidant-rich, fiber-heavy foods to support estrogen detox at peak energy.",
    nutrients: ["Fiber", "Antioxidants", "Glutathione", "Vitamin E"],
    symptoms: ["Peak energy", "Confidence", "Sociability"],
    tips: "Load up on colorful vegetables and fruits. Fiber helps clear excess estrogen.",
  },
  luteal: {
    id: "luteal", name: "Luteal", days: "Days 17–28",
    icon: "🍂", color: THEME.tan, bg: THEME.tanLight, border: "#D4B88A",
    tagline: "Slow & nourish",
    description: "Complex carbs, magnesium-rich and serotonin-boosting foods to ease PMS.",
    nutrients: ["Magnesium", "Complex carbs", "Calcium", "B6"],
    symptoms: ["PMS", "Bloating", "Mood swings", "Cravings"],
    tips: "Dark chocolate, sweet potatoes, and leafy greens are your best friends right now.",
  },
};

const PHASE_ORDER = ["menstrual", "follicular", "ovulatory", "luteal"];
const PHASE_LENGTHS = { menstrual: 5, follicular: 8, ovulatory: 3, luteal: 12 };

function getPhaseFromDay(cycleDay) {
  let day = ((cycleDay - 1) % 28) + 1;
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulatory";
  return "luteal";
}

function getDaysUntilNextPhase(cycleDay) {
  let day = ((cycleDay - 1) % 28) + 1;
  if (day <= 5) return 5 - day + 1;
  if (day <= 13) return 13 - day + 1;
  if (day <= 16) return 16 - day + 1;
  return 28 - day + 1;
}

function getDaysUntilPeriod(cycleDay) {
  let day = ((cycleDay - 1) % 28) + 1;
  if (day <= 5) return 0; // currently in period
  return 28 - day + 1;
}

// ─── HEALTH CONDITIONS ────────────────────────────────────────────────────────
const HEALTH_CONDITIONS = [
  { id: "pcos", label: "PCOS", icon: "🩺" },
  { id: "endometriosis", label: "Endometriosis", icon: "💊" },
  { id: "thyroid", label: "Thyroid issues", icon: "🦋" },
  { id: "anemia", label: "Anemia", icon: "🩸" },
  { id: "ibs", label: "IBS / Bloating", icon: "🫃" },
  { id: "vegetarian", label: "Vegetarian", icon: "🥦" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "gluten_free", label: "Gluten-free", icon: "🌾" },
];

// ─── MEAL PLANS ───────────────────────────────────────────────────────────────
const PAYMENT_PLANS = {
  single: { id: "single", label: "Single Plan", price: 5, priceLabel: "$5", desc: "One personalized meal prep plan", icon: "🥗" },
  monthly: { id: "monthly", label: "Monthly Access", price: 15, priceLabel: "$15/mo", desc: "Up to 5 meal prep plans per month", icon: "⭐" },
};

const STORAGE_KEY = "mealprep_access";
const TRACKER_KEY = "cycle_tracker";

function getAccess() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.type === "monthly" && Date.now() > data.expiresAt) {
      localStorage.removeItem(STORAGE_KEY); return null;
    }
    return data;
  } catch { return null; }
}

function saveAccess(type, plansUsed = 0) {
  const data = { type, plansUsed, purchasedAt: Date.now(), expiresAt: type === "monthly" ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function canGeneratePlan(access) {
  if (!access) return false;
  if (access.type === "single") return access.plansUsed < 1;
  if (access.type === "monthly") return access.plansUsed < 5;
  return false;
}

function getCycleData() {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) || "{}"); } catch { return {}; }
}

function saveCycleData(data) {
  localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
}

// ─── FOOD IMAGES ─────────────────────────────────────────────────────────────
const FOOD_IMAGES = {
  "lentil":     "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
  "salmon":     "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
  "spinach":    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  "oats":       "https://images.unsplash.com/photo-1614961908502-fab5a9be4de9?w=400",
  "smoothie":   "https://images.unsplash.com/photo-1612832021026-945d3b0c2f0d?w=400",
  "salad":      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  "soup":       "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
  "sweet potato":"https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=400",
  "chicken":    "https://images.unsplash.com/photo-1604503468506-a8da13d11d36?w=400",
  "avocado":    "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400",
  "eggs":       "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=400",
  "bowl":       "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  "curry":      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
  "stir fry":   "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
  "pasta":      "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400",
  "wrap":       "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
  "chocolate":  "https://images.unsplash.com/photo-1511381939415-e44f3b8c5d9d?w=400",
  "berries":    "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400",
  "default breakfast": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
  "default lunch":     "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
  "default dinner":    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
  "default snack":     "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=400",
};

function getMealImage(name, type) {
  const lower = (name || "").toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGES)) {
    if (!key.startsWith("default") && lower.includes(key)) return url;
  }
  return FOOD_IMAGES[`default ${type}`] || FOOD_IMAGES["default lunch"];
}

const FRESHNESS = {
  breakfast: { cook: "Prep night before or morning of", shelf: "1–2 days" },
  lunch:     { cook: "Prep Sunday & Wednesday", shelf: "3–4 days" },
  dinner:    { cook: "Cook fresh or 1–2 days ahead", shelf: "3–4 days" },
  snack:     { cook: "Prep at start of week", shelf: "4–5 days" },
};

const parseJSON = (text) => {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const arrStart = clean.indexOf("["); const arrEnd = clean.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) { try { return JSON.parse(clean.slice(arrStart, arrEnd + 1)); } catch {} }
  const objStart = clean.indexOf("{"); const objEnd = clean.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) { try { return JSON.parse(clean.slice(objStart, objEnd + 1)); } catch {} }
  try { const fixed = clean.replace(/,\s*([}\]])/g, "$1"); const s = fixed.indexOf("["); const e = fixed.lastIndexOf("]"); if (s !== -1 && e > s) return JSON.parse(fixed.slice(s, e + 1)); } catch {}
  return null;
};

async function callClaude(messages, systemPrompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 4000, system: systemPrompt, messages }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(JSON.stringify(err)); }
  const data = await res.json();
  return data.content?.find((b) => b.type === "text")?.text || "";
}

// ─── TYPE COLORS ─────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  breakfast: { bg: THEME.orangePale, text: THEME.brown, border: "#E8C4A0" },
  lunch:     { bg: THEME.greenPale,  text: THEME.green, border: "#B8D4B0" },
  dinner:    { bg: THEME.brownPale,  text: THEME.brown, border: "#D4B8A0" },
  snack:     { bg: THEME.tanLight,   text: THEME.brownLight, border: "#D4C0A0" },
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // Navigation
  const [screen, setScreen] = useState("home"); // home | tracker | mealSetup | loading | plan | recipe | cycleInfo
  const [appMode, setAppMode] = useState("home"); // home | mealprep | cycle

  // Meal prep state
  const [days, setDays] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [plan, setPlan] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Crafting your meal plan…");
  const [error, setError] = useState(null);

  // Cycle state
  const [cycleData, setCycleDataState] = useState(() => getCycleData());
  const [selectedPhase, setSelectedPhase] = useState(null); // for cycle meal plan
  const [trackerInput, setTrackerInput] = useState({ lastPeriod: "", cycleLength: "28" });

  // Payment state
  const [showPaywall, setShowPaywall] = useState(false);
  const [access, setAccess] = useState(() => getAccess());
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const squareCardRef = useRef(null);
  const squarePaymentsRef = useRef(null);

  // Derived cycle info
  const currentCycleDay = cycleData.lastPeriod
    ? Math.floor((Date.now() - new Date(cycleData.lastPeriod).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null;
  const currentPhaseId = currentCycleDay ? getPhaseFromDay(currentCycleDay) : null;
  const currentPhase = currentPhaseId ? PHASES[currentPhaseId] : null;
  const daysUntilNextPhase = currentCycleDay ? getDaysUntilNextPhase(currentCycleDay) : null;
  const daysUntilPeriod = currentCycleDay ? getDaysUntilPeriod(currentCycleDay) : null;

  const conditionLabels = conditions.length === 0 ? "No restrictions"
    : conditions.map(id => HEALTH_CONDITIONS.find(c => c.id === id)?.label).filter(Boolean).join(", ");

  const toggleCondition = (id) => {
    setConditions(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  // Square init
  useEffect(() => {
    if (!showPaywall) {
      if (squareCardRef.current) { squareCardRef.current.destroy().catch(() => {}); squareCardRef.current = null; }
      return;
    }
    async function initSquare() {
      try {
        if (!window.Square) throw new Error("Square not loaded");
        if (squareCardRef.current) { await squareCardRef.current.destroy().catch(() => {}); squareCardRef.current = null; }
        const payments = window.Square.payments(import.meta.env.VITE_SQUARE_APP_ID, import.meta.env.VITE_SQUARE_LOCATION_ID);
        squarePaymentsRef.current = payments;
        const card = await payments.card({ style: {
          ".input-container": { borderColor: THEME.border, borderRadius: "8px" },
          ".input-container.is-focus": { borderColor: THEME.orange },
          "input": { color: THEME.text, fontFamily: "Georgia, serif" },
        }});
        await card.attach("#square-payment-form");
        squareCardRef.current = card;
      } catch (err) {
        setPaymentError("Could not load payment form: " + (err?.message || "Please refresh."));
      }
    }
    const t = setTimeout(initSquare, 300);
    return () => clearTimeout(t);
  }, [showPaywall]);

  // Generate meal plan
  async function generatePlan(phaseOverride = null) {
    setScreen("loading");
    setError(null);
    const msgs = ["Nourishing your body…", "Syncing with your cycle…", "Selecting healing ingredients…", "Almost ready!"];
    let i = 0; setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 1800);

    try {
      const phase = phaseOverride ? PHASES[phaseOverride] : (appMode === "cycle" && currentPhase ? currentPhase : null);
      const condInfo = conditions.length > 0 ? `HEALTH CONDITIONS (strictly follow all): ${conditionLabels}.` : "";
      const phaseInfo = phase
        ? `MENSTRUAL CYCLE PHASE: ${phase.name} (${phase.days}). ${phase.description} Focus on these nutrients: ${phase.nutrients.join(", ")}. Common symptoms to address: ${phase.symptoms.join(", ")}. ${phase.tips}`
        : "General healthy meal prep — balanced macros, whole foods, diverse nutrients.";

      const prompt = `Generate a ${days}-day meal prep plan.
${condInfo}
${phaseInfo}

Return ONLY a valid JSON array of ${days} day objects, no markdown:
[{
  "day": 1,
  "meals": [
    { "type": "breakfast", "name": "...", "description": "1 sentence", "calories": 350, "protein": 18, "carbs": 42, "fat": 12, "cycleNote": "why this helps for ${phase?.name || "general health"}" },
    { "type": "lunch", ... },
    { "type": "dinner", ... },
    { "type": "snack", ... }
  ]
}]
Vary meals each day. Be specific with dish names. Return ONLY the JSON array.`;

      const text = await callClaude([{ role: "user", content: prompt }],
        "You are a certified nutritionist specializing in cycle-syncing nutrition and women's health. Return valid JSON only.");
      const parsed = parseJSON(text);
      if (!parsed || !Array.isArray(parsed)) throw new Error("Invalid plan format");

      const currentAccess = getAccess();
      if (currentAccess) { const updated = saveAccess(currentAccess.type, (currentAccess.plansUsed || 0) + 1); setAccess(updated); }

      setPlan(parsed);
      setSelectedPhase(phaseOverride || currentPhaseId);
      setScreen("plan");
    } catch (e) {
      setError("Could not generate plan — " + (e?.message || "please try again."));
      setScreen(appMode === "cycle" ? "tracker" : "mealSetup");
    } finally { clearInterval(interval); }
  }

  async function openRecipe(meal) {
    setSelectedMeal(meal);
    setRecipe(null);
    setLoadingRecipe(true);
    setScreen("recipe");
    try {
      const phase = selectedPhase ? PHASES[selectedPhase] : null;
      const phaseContext = phase ? `This meal is for the ${phase.name} phase of the menstrual cycle. Emphasize how the ingredients support ${phase.nutrients.join(", ")}.` : "";
      const condInfo = conditions.length > 0 ? `Must comply with: ${conditionLabels}.` : "";
      const prompt = `Give a detailed recipe for "${meal.name}". ${condInfo} ${phaseContext}
Return ONLY valid JSON:
{
  "ingredients": ["2 cups X", ...],
  "steps": ["Step 1...", ...],
  "prepTime": "10 mins",
  "cookTime": "20 mins",
  "tips": "1-2 meal prep storage tips",
  "healthBenefits": ["benefit 1", "benefit 2", "benefit 3"],
  "cycleSupport": "How this meal specifically supports this phase"
}`;
      const text = await callClaude([{ role: "user", content: prompt }],
        "You are a professional chef and women's health nutritionist. Return valid JSON only.");
      setRecipe(parseJSON(text) || { error: true });
    } catch { setRecipe({ error: true }); }
    finally { setLoadingRecipe(false); }
  }

  function handleGenerateClick() {
    const acc = getAccess();
    if (acc && canGeneratePlan(acc)) { generatePlan(); }
    else { setShowPaywall(true); setPaymentError(null); }
  }

  function handleCycleGenerateClick(phaseId) {
    const acc = getAccess();
    if (acc && canGeneratePlan(acc)) { generatePlan(phaseId); }
    else { setSelectedPhase(phaseId); setShowPaywall(true); setPaymentError(null); }
  }

  // ─── UI HELPERS ───────────────────────────────────────────────────────────
  const S = {
    // Buttons
    btn: (active, color = THEME.orange, bg = THEME.orangePale, border = "#E8C4A0") => ({
      padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, transition: "all 0.15s",
      background: active ? bg : THEME.cream, color: active ? color : THEME.textMid,
      border: active ? `1.5px solid ${border}` : `0.5px solid ${THEME.border}`,
      fontWeight: active ? 600 : 400,
    }),
    card: { background: THEME.cream, borderRadius: 12, padding: "1.25rem", marginBottom: "1rem", border: `0.5px solid ${THEME.border}` },
    sectionTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: THEME.textMid },
    tag: (color, bg, border) => ({ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: bg, color, border: `0.5px solid ${border}`, textTransform: "uppercase", letterSpacing: "0.3px" }),
  };

  // ─── HOME SCREEN ──────────────────────────────────────────────────────────
  if (screen === "home") return (
    <Wrapper>
      <div style={{ textAlign: "center", padding: "2rem 1rem 1.5rem" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🌿</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: THEME.brown, letterSpacing: "-0.5px" }}>NourishCycle</h1>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: THEME.textLight, lineHeight: 1.7 }}>
          Personalized meal prep that works with your body — whether you're syncing to your cycle or just eating well.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340, margin: "0 auto" }}>
          <button onClick={() => { setAppMode("cycle"); setScreen("tracker"); }}
            style={{ padding: "18px 20px", borderRadius: 14, cursor: "pointer", background: THEME.brown, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>🌑</span>
            <div>
              <div>Cycle-Sync Meal Prep</div>
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>Meals tailored to your menstrual phase</div>
            </div>
          </button>
          <button onClick={() => { setAppMode("mealprep"); setScreen("mealSetup"); }}
            style={{ padding: "18px 20px", borderRadius: 14, cursor: "pointer", background: THEME.orange, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>🥗</span>
            <div>
              <div>General Meal Prep</div>
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>Healthy plans for any day</div>
            </div>
          </button>
        </div>
      </div>
      <PaywallOverlay show={showPaywall} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
        paymentLoading={paymentLoading} setPaymentLoading={setPaymentLoading}
        paymentError={paymentError} setPaymentError={setPaymentError}
        access={access} squareCardRef={squareCardRef} days={days}
        onClose={() => setShowPaywall(false)}
        onSuccess={(newAccess) => { setAccess(newAccess); setShowPaywall(false); generatePlan(selectedPhase); }}
        THEME={THEME} PAYMENT_PLANS={PAYMENT_PLANS} saveAccess={saveAccess} />
    </Wrapper>
  );

  // ─── PERIOD TRACKER ───────────────────────────────────────────────────────
  if (screen === "tracker") {
    const today = new Date().toISOString().split("T")[0];
    return (
      <Wrapper>
        <Header title="🌿 NourishCycle" subtitle="Cycle tracker & meal sync"
          onBack={() => setScreen("home")} THEME={THEME} />

        {/* Current phase card */}
        {currentPhase && (
          <div style={{ background: currentPhase.bg, border: `1px solid ${currentPhase.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: currentPhase.color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Current phase</div>
                <h2 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 700, color: currentPhase.color }}>
                  {currentPhase.icon} {currentPhase.name}
                </h2>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: THEME.textMid }}>{currentPhase.days} · Day {currentCycleDay} of your cycle</p>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: THEME.text, lineHeight: 1.6 }}>{currentPhase.tagline}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {currentPhase.nutrients.map(n => (
                <span key={n} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.6)", color: currentPhase.color, fontWeight: 500, border: `0.5px solid ${currentPhase.border}` }}>{n}</span>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${currentPhase.border}`, display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: currentPhase.color }}>{daysUntilNextPhase}</div>
                <div style={{ fontSize: 10, color: THEME.textMid }}>days in phase</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: currentPhase.color }}>
                  {daysUntilPeriod === 0 ? "Now" : daysUntilPeriod}
                </div>
                <div style={{ fontSize: 10, color: THEME.textMid }}>{daysUntilPeriod === 0 ? "on period" : "days to period"}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: currentPhase.color }}>{cycleData.cycleLength || 28}</div>
                <div style={{ fontSize: 10, color: THEME.textMid }}>cycle length</div>
              </div>
            </div>
          </div>
        )}

        {/* Cycle wheel */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Your cycle at a glance</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {PHASE_ORDER.map(phaseId => {
              const ph = PHASES[phaseId];
              const isCurrent = currentPhaseId === phaseId;
              return (
                <button key={phaseId} onClick={() => setScreen("cycleInfo_" + phaseId)}
                  style={{ padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    background: isCurrent ? ph.bg : THEME.tanPale,
                    border: isCurrent ? `2px solid ${ph.color}` : `0.5px solid ${THEME.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{ph.icon}</span>
                    {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, color: ph.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>Current</span>}
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: isCurrent ? ph.color : THEME.brown }}>{ph.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: THEME.textLight }}>{ph.days}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tracker input */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Update your tracker</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: THEME.textMid, display: "block", marginBottom: 4 }}>First day of last period</label>
              <input type="date" max={today}
                value={trackerInput.lastPeriod || cycleData.lastPeriod || ""}
                onChange={e => setTrackerInput(p => ({ ...p, lastPeriod: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${THEME.border}`, fontSize: 13, background: THEME.cream, color: THEME.text, fontFamily: "Georgia, serif" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: THEME.textMid, display: "block", marginBottom: 4 }}>Average cycle length (days)</label>
              <input type="number" min="21" max="35" placeholder="28"
                value={trackerInput.cycleLength || cycleData.cycleLength || "28"}
                onChange={e => setTrackerInput(p => ({ ...p, cycleLength: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `0.5px solid ${THEME.border}`, fontSize: 13, background: THEME.cream, color: THEME.text, fontFamily: "Georgia, serif" }} />
            </div>
            <button onClick={() => {
              if (!trackerInput.lastPeriod && !cycleData.lastPeriod) return;
              const updated = { lastPeriod: trackerInput.lastPeriod || cycleData.lastPeriod, cycleLength: trackerInput.cycleLength || "28" };
              saveCycleData(updated);
              setCycleDataState(updated);
            }}
              style={{ padding: "12px", borderRadius: 10, background: THEME.brown, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Save tracker
            </button>
          </div>
        </div>

        {/* Generate plan section */}
        <div style={S.card}>
          <p style={S.sectionTitle}>Generate a cycle-synced meal plan</p>

          {/* Days */}
          <p style={{ margin: "0 0 8px", fontSize: 12, color: THEME.textLight }}>How many days?</p>
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
            {[3, 5, 7].map(d => (
              <button key={d} onClick={() => setDays(d)}
                style={{ flex: 1, padding: "12px 0", fontSize: 16, fontWeight: 600, borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                  background: days === d ? THEME.orange : THEME.cream, color: days === d ? "#fff" : THEME.text,
                  border: days === d ? `2px solid ${THEME.orange}` : `0.5px solid ${THEME.border}` }}>
                {d}
              </button>
            ))}
          </div>

          {/* Phase select */}
          <p style={{ margin: "0 0 8px", fontSize: 12, color: THEME.textLight }}>Which phase to plan for?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: "1rem" }}>
            {PHASE_ORDER.map(phaseId => {
              const ph = PHASES[phaseId];
              const isCurrent = currentPhaseId === phaseId;
              const active = selectedPhase === phaseId;
              return (
                <button key={phaseId} onClick={() => setSelectedPhase(phaseId)}
                  style={{ ...S.btn(active, ph.color, ph.bg, ph.border), textAlign: "left", padding: "10px 12px" }}>
                  {ph.icon} {ph.name}
                  {isCurrent && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>← you</span>}
                </button>
              );
            })}
          </div>

          {/* Health conditions */}
          <p style={{ margin: "0 0 8px", fontSize: 12, color: THEME.textLight }}>Health conditions (optional)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: "1rem" }}>
            {HEALTH_CONDITIONS.map(hc => {
              const active = conditions.includes(hc.id);
              return (
                <button key={hc.id} onClick={() => toggleCondition(hc.id)}
                  style={{ ...S.btn(active), padding: "8px 10px", textAlign: "left", fontSize: 12, position: "relative" }}>
                  {hc.icon} {hc.label}
                  {active && <span style={{ position: "absolute", top: 4, right: 6, fontSize: 10, color: THEME.orange }}>✓</span>}
                </button>
              );
            })}
          </div>

          <button onClick={() => { if (!days || !selectedPhase) return; handleCycleGenerateClick(selectedPhase); }}
            disabled={!days || !selectedPhase}
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 700, cursor: days && selectedPhase ? "pointer" : "not-allowed",
              background: days && selectedPhase ? THEME.brown : "#D4C0A8", color: "#fff" }}>
            {!days ? "Select days above" : !selectedPhase ? "Select a phase above" : `Generate ${days}-Day ${PHASES[selectedPhase]?.name} Plan →`}
          </button>
        </div>

        <PaywallOverlay show={showPaywall} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
          paymentLoading={paymentLoading} setPaymentLoading={setPaymentLoading}
          paymentError={paymentError} setPaymentError={setPaymentError}
          access={access} squareCardRef={squareCardRef} days={days}
          onClose={() => setShowPaywall(false)}
          onSuccess={(newAccess) => { setAccess(newAccess); setShowPaywall(false); generatePlan(selectedPhase); }}
          THEME={THEME} PAYMENT_PLANS={PAYMENT_PLANS} saveAccess={saveAccess} />
      </Wrapper>
    );
  }

  // ─── CYCLE INFO SCREEN ────────────────────────────────────────────────────
  if (screen.startsWith("cycleInfo_")) {
    const phaseId = screen.replace("cycleInfo_", "");
    const ph = PHASES[phaseId];
    return (
      <Wrapper>
        <Header title={`${ph.icon} ${ph.name} Phase`} subtitle={ph.days} onBack={() => setScreen("tracker")} THEME={THEME} />
        <div style={{ background: ph.bg, border: `1px solid ${ph.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: ph.color }}>{ph.tagline}</p>
          <p style={{ margin: 0, fontSize: 13, color: THEME.text, lineHeight: 1.7 }}>{ph.description}</p>
        </div>
        <div style={S.card}>
          <p style={S.sectionTitle}>Key nutrients</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ph.nutrients.map(n => <span key={n} style={{ padding: "6px 12px", borderRadius: 20, background: ph.bg, color: ph.color, fontSize: 12, fontWeight: 500, border: `0.5px solid ${ph.border}` }}>{n}</span>)}
          </div>
        </div>
        <div style={S.card}>
          <p style={S.sectionTitle}>Common symptoms</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ph.symptoms.map(s => <span key={s} style={{ padding: "6px 12px", borderRadius: 20, background: THEME.tanLight, color: THEME.brown, fontSize: 12, border: `0.5px solid ${THEME.border}` }}>{s}</span>)}
          </div>
        </div>
        <div style={{ background: THEME.orangePale, border: `0.5px solid ${THEME.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: 13, color: THEME.brown }}><strong>💡 Tip:</strong> {ph.tips}</p>
        </div>
        <button onClick={() => { setScreen("tracker"); setSelectedPhase(phaseId); }}
          style={{ width: "100%", padding: "14px", borderRadius: 12, background: ph.color, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Plan meals for {ph.name} →
        </button>
      </Wrapper>
    );
  }

  // ─── GENERAL MEAL SETUP ───────────────────────────────────────────────────
  if (screen === "mealSetup") return (
    <Wrapper>
      <Header title="🥗 Meal Prep Planner" subtitle="Healthy plans for any day" onBack={() => setScreen("home")} THEME={THEME} />
      {error && <div style={{ background: "#FEF2F2", border: "0.5px solid #FECACA", borderRadius: 8, padding: "12px 16px", marginBottom: "1rem", color: "#991B1B", fontSize: 13 }}>{error}</div>}

      <div style={S.card}>
        <p style={S.sectionTitle}>How many days?</p>
        <div style={{ display: "flex", gap: 10 }}>
          {[3, 5, 7].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ flex: 1, padding: "14px 0", fontSize: 18, fontWeight: 600, borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                background: days === d ? THEME.orange : THEME.cream, color: days === d ? "#fff" : THEME.text,
                border: days === d ? `2px solid ${THEME.orange}` : `0.5px solid ${THEME.border}` }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <p style={S.sectionTitle}>Health conditions & dietary needs</p>
          {conditions.length > 0 && <button onClick={() => setConditions([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: THEME.orange, padding: 0 }}>Clear all</button>}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: THEME.textLight, fontStyle: "italic" }}>Select all that apply</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {HEALTH_CONDITIONS.map(hc => {
            const active = conditions.includes(hc.id);
            return (
              <button key={hc.id} onClick={() => toggleCondition(hc.id)}
                style={{ ...S.btn(active), textAlign: "left", position: "relative" }}>
                {hc.icon} {hc.label}
                {active && <span style={{ position: "absolute", top: 4, right: 6, fontSize: 10, color: THEME.orange }}>✓</span>}
              </button>
            );
          })}
        </div>
        {conditions.length > 0 && (
          <div style={{ marginTop: 10, padding: "8px 10px", background: THEME.orangePale, borderRadius: 8, border: `0.5px solid ${THEME.border}` }}>
            <p style={{ margin: 0, fontSize: 12, color: THEME.brown }}><strong>Active:</strong> {conditionLabels}</p>
          </div>
        )}
      </div>

      <button onClick={handleGenerateClick} disabled={!days}
        style={{ width: "100%", padding: "16px", fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: days ? "pointer" : "not-allowed",
          background: days ? THEME.orange : "#D4C0A8", color: "#fff", border: "none" }}>
        {days ? `Generate My ${days}-Day Plan →` : "Select number of days to continue"}
      </button>

      <PaywallOverlay show={showPaywall} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan}
        paymentLoading={paymentLoading} setPaymentLoading={setPaymentLoading}
        paymentError={paymentError} setPaymentError={setPaymentError}
        access={access} squareCardRef={squareCardRef} days={days}
        onClose={() => setShowPaywall(false)}
        onSuccess={(newAccess) => { setAccess(newAccess); setShowPaywall(false); generatePlan(); }}
        THEME={THEME} PAYMENT_PLANS={PAYMENT_PLANS} saveAccess={saveAccess} />
    </Wrapper>
  );

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (screen === "loading") return (
    <Wrapper>
      <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
        <div style={{ fontSize: 52, display: "inline-block", animation: "spin 2s linear infinite" }}>🌿</div>
        <p style={{ marginTop: "1rem", fontSize: 16, color: THEME.textMid, animation: "pulse 1.5s ease-in-out infinite" }}>{loadingMsg}</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    </Wrapper>
  );

  // ─── PLAN SCREEN ──────────────────────────────────────────────────────────
  if (screen === "plan" && plan) {
    const planPhase = selectedPhase ? PHASES[selectedPhase] : null;
    return (
      <Wrapper>
        <Header title={planPhase ? `${planPhase.icon} ${planPhase.name} Plan` : "🥗 Your Meal Plan"}
          subtitle={`${days}-day plan${conditions.length > 0 ? " · " + conditionLabels : ""}`}
          onBack={() => setScreen(appMode === "cycle" ? "tracker" : "mealSetup")} THEME={THEME} />

        {/* Phase banner */}
        {planPhase && (
          <div style={{ background: planPhase.bg, border: `1px solid ${planPhase.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: "1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: planPhase.color }}>{planPhase.tagline}</p>
            <p style={{ margin: 0, fontSize: 12, color: THEME.textMid }}>{planPhase.description}</p>
          </div>
        )}

        {/* Prep schedule */}
        <div style={{ background: THEME.tanLight, border: `0.5px solid ${THEME.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: "1.5rem" }}>
          <p style={{ margin: 0, fontSize: 12, color: THEME.brown, lineHeight: 1.7 }}>
            <strong>📅 Prep schedule:</strong> Batch-cook on <strong>Sunday</strong>, refresh <strong>Wednesday</strong>. Proteins keep 3–4 days, grains 5 days.
          </p>
        </div>

        {plan.map(dayObj => (
          <div key={dayObj.day} style={{ marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 10px", padding: "5px 0", borderBottom: `0.5px solid ${THEME.border}`, color: THEME.brown }}>
              Day {dayObj.day}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {dayObj.meals?.map((meal, mi) => {
                const tc = TYPE_COLORS[meal.type] || TYPE_COLORS.lunch;
                const freshInfo = FRESHNESS[meal.type];
                const imgUrl = getMealImage(meal.name, meal.type);
                return (
                  <button key={mi} onClick={() => openRecipe(meal)}
                    style={{ textAlign: "left", background: THEME.cream, border: `0.5px solid ${tc.border}`, borderRadius: 12, padding: 0, cursor: "pointer", overflow: "hidden", transition: "transform 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
                    <div style={{ width: "100%", height: 90, overflow: "hidden", position: "relative" }}>
                      <img src={imgUrl} alt={meal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }} />
                      <div style={{ position: "absolute", top: 6, left: 6 }}>
                        <span style={S.tag(tc.text, tc.bg, tc.border)}>{meal.type}</span>
                      </div>
                    </div>
                    <div style={{ padding: "9px 11px" }}>
                      <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: THEME.brown }}>{meal.name}</p>
                      <p style={{ margin: "0 0 6px", fontSize: 10, color: THEME.textLight, lineHeight: 1.5 }}>{meal.description}</p>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }}>
                        {[
                          { k: "Cal", v: meal.calories, c: THEME.orange },
                          { k: "P", v: `${meal.protein}g`, c: THEME.green },
                          { k: "C", v: `${meal.carbs}g`, c: THEME.tan },
                        ].map(m => (
                          <span key={m.k} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 20, background: `${m.c}20`, color: m.c, fontWeight: 600 }}>{m.k}: {m.v}</span>
                        ))}
                      </div>
                      {meal.cycleNote && planPhase && (
                        <p style={{ margin: "0 0 4px", fontSize: 9, color: planPhase.color, fontStyle: "italic", lineHeight: 1.4 }}>✨ {meal.cycleNote}</p>
                      )}
                      <p style={{ margin: 0, fontSize: 9, color: THEME.textLight }}>📦 {freshInfo.shelf}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 9, color: THEME.orange, fontStyle: "italic" }}>Tap for recipe →</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Wrapper>
    );
  }

  // ─── RECIPE SCREEN ────────────────────────────────────────────────────────
  if (screen === "recipe" && selectedMeal) {
    const planPhase = selectedPhase ? PHASES[selectedPhase] : null;
    return (
      <Wrapper>
        <Header title={selectedMeal.name} subtitle={selectedMeal.description} onBack={() => setScreen("plan")} THEME={THEME} />

        <div style={{ marginBottom: "1rem", borderRadius: 12, overflow: "hidden", position: "relative", height: 200 }}>
          <img src={getMealImage(selectedMeal.name, selectedMeal.type)} alt={selectedMeal.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(58,42,26,0.7) 0%, transparent 50%)" }} />
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <h2 style={{ margin: "0 0 4px", color: "#fff", fontSize: 18, fontWeight: 700 }}>{selectedMeal.name}</h2>
            {planPhase && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>{planPhase.icon} {planPhase.name} phase</span>}
          </div>
        </div>

        {/* Macros */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: "1rem" }}>
          {[
            { k: "Calories", v: selectedMeal.calories, c: THEME.orange },
            { k: "Protein", v: `${selectedMeal.protein}g`, c: THEME.green },
            { k: "Carbs", v: `${selectedMeal.carbs}g`, c: THEME.tan },
            { k: "Fat", v: `${selectedMeal.fat}g`, c: THEME.brown },
          ].map(m => (
            <div key={m.k} style={{ background: `${m.c}18`, border: `0.5px solid ${m.c}40`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 10, color: THEME.textLight, marginTop: 2 }}>{m.k}</div>
            </div>
          ))}
        </div>

        {/* Freshness */}
        <div style={{ background: THEME.greenPale, border: `0.5px solid ${THEME.green}40`, borderRadius: 10, padding: "11px 14px", marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 3px", fontSize: 12, color: THEME.green }}><strong>🕐 When to cook:</strong> {FRESHNESS[selectedMeal.type].cook}</p>
          <p style={{ margin: 0, fontSize: 12, color: THEME.green }}><strong>📦 Stays fresh:</strong> {FRESHNESS[selectedMeal.type].shelf} refrigerated</p>
        </div>

        {loadingRecipe && (
          <div style={{ textAlign: "center", padding: "3rem", color: THEME.textMid }}>
            <div style={{ fontSize: 36, display: "inline-block", animation: "spin 1.5s linear infinite" }}>🌿</div>
            <p style={{ marginTop: 10, fontSize: 14 }}>Loading recipe…</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {recipe && !recipe.error && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
              {[{ label: "Prep", val: recipe.prepTime }, { label: "Cook", val: recipe.cookTime }].map(t => (
                <div key={t.label} style={{ flex: 1, background: THEME.tanLight, borderRadius: 8, padding: "10px", textAlign: "center", border: `0.5px solid ${THEME.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: THEME.brown }}>{t.val}</div>
                  <div style={{ fontSize: 10, color: THEME.textLight, marginTop: 2 }}>{t.label} time</div>
                </div>
              ))}
            </div>

            {/* Cycle support */}
            {recipe.cycleSupport && planPhase && (
              <div style={{ background: planPhase.bg, border: `0.5px solid ${planPhase.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: "1rem" }}>
                <p style={{ margin: 0, fontSize: 13, color: planPhase.color }}><strong>{planPhase.icon} {planPhase.name} support:</strong> {recipe.cycleSupport}</p>
              </div>
            )}

            {/* Health benefits */}
            {recipe.healthBenefits?.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: THEME.brown }}>✨ Health benefits</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {recipe.healthBenefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: THEME.greenPale, borderRadius: 8, padding: "8px 10px", border: `0.5px solid ${THEME.green}30` }}>
                      <span style={{ color: THEME.green, fontSize: 13, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13, color: THEME.text, lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: THEME.brown }}>🛒 Ingredients</h3>
              <div style={{ background: THEME.tanLight, borderRadius: 10, padding: "12px 14px", border: `0.5px solid ${THEME.border}` }}>
                {recipe.ingredients?.map((ing, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < recipe.ingredients.length - 1 ? `0.5px solid ${THEME.border}` : "none" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: THEME.orange, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: THEME.text }}>{ing}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: THEME.brown }}>👨‍🍳 Instructions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recipe.steps?.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: THEME.orange, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, flex: 1, color: THEME.text }}>{step.replace(/^Step \d+:\s*/i, "")}</p>
                  </div>
                ))}
              </div>
            </div>

            {recipe.tips && (
              <div style={{ background: THEME.orangePale, border: `0.5px solid ${THEME.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ margin: 0, fontSize: 13, color: THEME.brown }}><strong>💡 Meal prep tip:</strong> {recipe.tips}</p>
              </div>
            )}
          </div>
        )}

        {recipe?.error && (
          <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "1rem", textAlign: "center", color: "#991B1B", fontSize: 14 }}>
            Could not load recipe. Please go back and try again.
          </div>
        )}
      </Wrapper>
    );
  }

  return <Wrapper><div style={{ padding: "2rem", textAlign: "center", color: THEME.textMid }}>Loading…</div></Wrapper>;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Wrapper({ children }) {
  return (
    <div style={{ fontFamily: "'Georgia', serif", maxWidth: 720, margin: "0 auto", padding: "1.5rem 1rem", background: "#FAF6F0", minHeight: "100vh", color: "#3A2A1A" }}>
      {children}
    </div>
  );
}

function Header({ title, subtitle, onBack, THEME }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
      {onBack && (
        <button onClick={onBack}
          style={{ background: "none", border: `0.5px solid ${THEME.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: THEME.textMid }}>
          ← Back
        </button>
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: THEME.brown, letterSpacing: "-0.3px" }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: 12, color: THEME.textLight }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function PaywallOverlay({ show, selectedPlan, setSelectedPlan, paymentLoading, setPaymentLoading, paymentError, setPaymentError, access, squareCardRef, days, onClose, onSuccess, THEME, PAYMENT_PLANS, saveAccess }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(58,42,26,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#FAF6F0", borderRadius: 16, padding: "1.75rem", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(58,42,26,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: THEME.brown }}>Get Your Meal Plan</h2>
          <p style={{ margin: 0, fontSize: 13, color: THEME.textLight }}>Choose a plan to generate your personalized {days}-day meal prep</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.25rem" }}>
          {Object.values(PAYMENT_PLANS).map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
              style={{ padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                background: selectedPlan === plan.id ? THEME.orangePale : THEME.tanLight,
                border: selectedPlan === plan.id ? `2px solid ${THEME.orange}` : `0.5px solid ${THEME.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{plan.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: selectedPlan === plan.id ? THEME.orange : THEME.brown }}>{plan.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: THEME.textLight, marginTop: 2 }}>{plan.desc}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: selectedPlan === plan.id ? THEME.orange : THEME.brown }}>{plan.priceLabel}</p>
                  <p style={{ margin: 0, fontSize: 10, color: THEME.textLight }}>{plan.id === "monthly" ? "billed monthly" : "one time"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {access?.type === "monthly" && (
          <div style={{ background: THEME.greenPale, border: `0.5px solid ${THEME.green}40`, borderRadius: 8, padding: "8px 12px", marginBottom: "1rem" }}>
            <p style={{ margin: 0, fontSize: 12, color: THEME.green }}><strong>Active subscription</strong> — {5 - (access.plansUsed || 0)} of 5 plans remaining</p>
          </div>
        )}

        {paymentError && (
          <div style={{ background: "#FEF2F2", border: "0.5px solid #FECACA", borderRadius: 8, padding: "10px 12px", marginBottom: "1rem", fontSize: 12, color: "#991B1B" }}>
            {paymentError}
          </div>
        )}

        <div id="square-payment-form" style={{ marginBottom: "1rem" }} />

        <button disabled={!selectedPlan || paymentLoading}
          onClick={async () => {
            if (!selectedPlan) return;
            setPaymentLoading(true);
            setPaymentError(null);
            try {
              if (!squareCardRef.current) throw new Error("Payment form not ready. Please refresh and try again.");
              const result = await squareCardRef.current.tokenize();
              if (result.status !== "OK") {
                const errors = result.errors || [];
                throw new Error(errors.map(e => `${e.field || ""}: ${e.message || e.type}`).join(", ") || "Card details invalid.");
              }
              const plan = PAYMENT_PLANS[selectedPlan];
              const response = await fetch("/api/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceId: result.token, amount: plan.price * 100, planType: plan.id, currency: "USD" }),
              });
              const data = await response.json();
              if (!response.ok || data.error) throw new Error(data.error || "Payment failed. Please try again.");
              const newAccess = saveAccess(plan.id, 0);
              onSuccess(newAccess);
            } catch (err) {
              setPaymentError(err.message || "Payment failed. Please try again.");
            } finally {
              setPaymentLoading(false);
            }
          }}
          style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, borderRadius: 12, border: "none",
            cursor: selectedPlan && !paymentLoading ? "pointer" : "not-allowed",
            background: selectedPlan ? THEME.orange : "#D4C0A8", color: "#fff" }}>
          {paymentLoading ? "Processing…" : selectedPlan ? `Pay ${PAYMENT_PLANS[selectedPlan]?.priceLabel} & Generate Plan` : "Select a plan above"}
        </button>

        <button onClick={onClose}
          style={{ width: "100%", marginTop: 10, padding: "10px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: THEME.textLight }}>
          Cancel
        </button>

        <p style={{ margin: "12px 0 0", fontSize: 11, color: THEME.textLight, textAlign: "center" }}>
          🔒 Payments secured by Square. We never store your card details.
        </p>
      </div>
    </div>
  );
}
