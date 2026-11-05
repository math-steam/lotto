const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type JackpotData = {
  lotto649: { amount: string; period: string | null };
  superlotto: { amount: string; period: string | null };
  daily539: { amount: string; period: string | null };
};

const FETCH_TIMEOUT_MS = 12000;

const PROXIES: ((u: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => u,
];

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonViaProxies(targetUrl: string): Promise<Record<string, unknown> | null> {
  for (const wrap of PROXIES) {
    try {
      const response = await fetchWithTimeout(wrap(targetUrl), FETCH_TIMEOUT_MS);
      if (!response.ok) {
        console.error(`[jackpot] proxy returned ${response.status} for ${targetUrl}`);
        continue;
      }
      const payload = await response.json();
      if (payload && typeof payload === "object") {
        return payload as Record<string, unknown>;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[jackpot] proxy failed for ${targetUrl}:`, msg);
    }
  }
  return null;
}

function formatAmount(yi: number): string {
  if (yi >= 1) return `NT$ ${yi.toFixed(1)} 億`;
  return `NT$ ${Math.round(yi * 10000)} 萬`;
}

function estimateFromSchedule(now: Date, type: string): { amount: string; period: string | null } {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const weekday = now.getDay();
  const hour = now.getHours();

  if (type === "superlotto") {
    const drawDays = [1, 4];
    const afterDraw = hour >= 20 && drawDays.includes(weekday);
    const base = 2.0;
    let extra = 0;
    if (!afterDraw) {
      const daysSinceLastDraw = drawDays.includes(weekday) && hour < 20 ? 0 : (() => {
        let count = 0;
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        for (let i = 1; i <= 7; i++) {
          const check = new Date(d);
          check.setDate(check.getDate() - i);
          if (drawDays.includes(check.getDay())) {
            count = i;
            break;
          }
        }
        return count;
      })();
      extra = daysSinceLastDraw * 0.15;
    }
    return { amount: formatAmount(base + extra), period: null };
  }
  if (type === "lotto649") {
    const base = 1.0;
    return { amount: formatAmount(base), period: null };
  }
  return { amount: "NT$ 800 萬", period: null };
}

function parseArcLightData(data: Record<string, unknown>): JackpotData | null {
  const result: JackpotData = {
    lotto649: { amount: "", period: null },
    superlotto: { amount: "", period: null },
    daily539: { amount: "", period: null },
  };

  const games: { key: string; type: keyof JackpotData }[] = [
    { key: "威力彩", type: "superlotto" },
    { key: "大樂透", type: "lotto649" },
    { key: "今彩539", type: "daily539" },
  ];

  let foundAny = false;
  for (const game of games) {
    const items = data[game.key];
    if (!Array.isArray(items) || items.length === 0) continue;
    const latest = items[0] as Record<string, unknown>;
    const prizeStr = latest["prize"] ?? latest["jackpot"] ?? latest["amount"] ?? latest["estimatedPrize"];
    const period = latest["period"] ?? latest["issue"] ?? null;
    if (typeof prizeStr === "string" || typeof prizeStr === "number") {
      const parsed = parsePrizeValue(prizeStr);
      if (parsed) {
        result[game.type] = { amount: parsed, period: typeof period === "string" ? period : null };
        foundAny = true;
      }
    }
  }

  return foundAny ? result : null;
}

function parsePrizeValue(value: string | number): string | null {
  if (typeof value === "number") {
    if (value >= 100000000) return `NT$ ${(value / 100000000).toFixed(1)} 億`;
    if (value >= 10000) return `NT$ ${Math.round(value / 10000)} 萬`;
    return `NT$ ${value}`;
  }
  const str = value.trim();
  const yiMatch = str.match(/([\d.]+)\s*億/);
  if (yiMatch) return `NT$ ${parseFloat(yiMatch[1]).toFixed(1)} 億`;
  const wanMatch = str.match(/([\d.]+)\s*萬/);
  if (wanMatch) return `NT$ ${Math.round(parseFloat(wanMatch[1]))} 萬`;
  if (/^[\d,]+$/.test(str)) {
    const num = parseInt(str.replace(/,/g, ""), 10);
    if (num >= 100000000) return `NT$ ${(num / 100000000).toFixed(1)} 億`;
    if (num >= 10000) return `NT$ ${Math.round(num / 10000)} 萬`;
  }
  if (str.startsWith("NT$")) return str;
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const now = new Date();
    const fallback: JackpotData = {
      lotto649: estimateFromSchedule(now, "lotto649"),
      superlotto: estimateFromSchedule(now, "superlotto"),
      daily539: estimateFromSchedule(now, "daily539"),
    };

    const targetUrl = "https://lotto.arclight.tw/api/data";
    const data = await fetchJsonViaProxies(targetUrl);

    let result: JackpotData = fallback;

    if (data) {
      const parsed = parseArcLightData(data);
      if (parsed) {
        result = {
          lotto649: parsed.lotto649.amount ? parsed.lotto649 : fallback.lotto649,
          superlotto: parsed.superlotto.amount ? parsed.superlotto : fallback.superlotto,
          daily539: parsed.daily539.amount ? parsed.daily539 : fallback.daily539,
        };
        console.log("[jackpot] Successfully fetched from arclight API");
      } else {
        console.warn("[jackpot] arclight API returned data but no jackpots parsed, using schedule estimate");
      }
    } else {
      console.warn("[jackpot] All proxies failed, using schedule-based estimate");
    }

    return new Response(
      JSON.stringify({ ...result, timestamp: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[jackpot] Unhandled error:", msg);
    const now = new Date();
    const fallback: JackpotData = {
      lotto649: estimateFromSchedule(now, "lotto649"),
      superlotto: estimateFromSchedule(now, "superlotto"),
      daily539: estimateFromSchedule(now, "daily539"),
    };
    return new Response(
      JSON.stringify({ ...fallback, timestamp: Date.now(), error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
