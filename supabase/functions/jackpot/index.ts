const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type JackpotEntry = {
  amount: string;
  period: string | null;
};

type JackpotData = {
  lotto649: JackpotEntry;
  superlotto: JackpotEntry;
  daily539: JackpotEntry;
};

const FETCH_TIMEOUT_MS = 12000;

const PROXIES: ((u: string) => string)[] = [
  (u) => u,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
];

const HARDCODED_FALLBACK: JackpotData = {
  superlotto: { amount: "NT$ 2.6 億", period: null },
  lotto649: { amount: "NT$ 1.2 億", period: null },
  daily539: { amount: "NT$ 800 萬", period: null },
};

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

async function fetchJsonViaProxies(targetUrl: string): Promise<unknown | null> {
  for (const wrap of PROXIES) {
    try {
      const response = await fetchWithTimeout(wrap(targetUrl), FETCH_TIMEOUT_MS);
      if (!response.ok) {
        console.error(`[jackpot] proxy returned ${response.status} for ${targetUrl}`);
        continue;
      }
      const payload = await response.json();
      if (payload !== null && payload !== undefined) {
        return payload;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[jackpot] proxy failed for ${targetUrl}:`, msg);
    }
  }
  return null;
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

const GAME_NAME_MAP: Record<string, keyof JackpotData> = {
  "威力彩": "superlotto",
  "superlotto": "superlotto",
  "SuperLotto638": "superlotto",
  "大樂透": "lotto649",
  "lotto649": "lotto649",
  "Lotto649": "lotto649",
  "今彩539": "daily539",
  "daily539": "daily539",
  "Daily539": "daily539",
};

function findGameKey(rawKey: string): keyof JackpotData | null {
  const lower = rawKey.toLowerCase();
  for (const [name, type] of Object.entries(GAME_NAME_MAP)) {
    if (rawKey === name || lower === name.toLowerCase()) return type;
  }
  for (const [name, type] of Object.entries(GAME_NAME_MAP)) {
    if (rawKey.includes(name) || lower.includes(name.toLowerCase())) return type;
  }
  return null;
}

function parseTimetableData(payload: unknown): JackpotData | null {
  if (!payload || typeof payload !== "object") return null;

  const result: JackpotData = {
    lotto649: { amount: "", period: null },
    superlotto: { amount: "", period: null },
    daily539: { amount: "", period: null },
  };

  let foundAny = false;

  const candidates: Record<string, unknown>[] = [];
  if (Array.isArray(payload)) {
    candidates.push(...(payload as Record<string, unknown>[]));
  } else {
    const obj = payload as Record<string, unknown>;
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        candidates.push(...(value as Record<string, unknown>[]));
      } else if (value && typeof value === "object") {
        candidates.push(value as Record<string, unknown>);
      }
    }
  }

  for (const item of candidates) {
    const gameName = item["game"] ?? item["gameName"] ?? item["lottery"] ?? item["lotteryName"] ?? item["name"] ?? item["type"];
    if (typeof gameName !== "string") continue;
    const gameType = findGameKey(gameName);
    if (!gameType) continue;
    if (result[gameType].amount) continue;

    const prizeFields = ["estimatedPrize", "prize", "jackpot", "jackpotAmount", "prizeAmount", "estimatedPrizeAmount", "headPrize", "firstPrize", "amount"];
    for (const field of prizeFields) {
      const raw = item[field];
      if (raw === undefined || raw === null) continue;
      const parsed = parsePrizeValue(raw as string | number);
      if (parsed) {
        const period = item["period"] ?? item["issue"] ?? item["drawNo"] ?? item["drawNumber"];
        result[gameType] = { amount: parsed, period: typeof period === "string" ? period : null };
        foundAny = true;
        break;
      }
    }
  }

  return foundAny ? result : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const targetUrl = "https://lottery.timetable.tw/api/draws?latestEach=true";
    const payload = await fetchJsonViaProxies(targetUrl);

    let result: JackpotData = HARDCODED_FALLBACK;

    if (payload) {
      const parsed = parseTimetableData(payload);
      if (parsed) {
        result = {
          lotto649: parsed.lotto649.amount ? parsed.lotto649 : HARDCODED_FALLBACK.lotto649,
          superlotto: parsed.superlotto.amount ? parsed.superlotto : HARDCODED_FALLBACK.superlotto,
          daily539: parsed.daily539.amount ? parsed.daily539 : HARDCODED_FALLBACK.daily539,
        };
        console.log("[jackpot] Successfully fetched from lottery.timetable.tw");
      } else {
        console.warn("[jackpot] timetable API returned data but no jackpots parsed, using hardcoded fallback");
      }
    } else {
      console.warn("[jackpot] All proxies failed, using hardcoded fallback");
    }

    return new Response(
      JSON.stringify({ ...result, timestamp: Date.now() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[jackpot] Unhandled error:", msg);
    return new Response(
      JSON.stringify({ ...HARDCODED_FALLBACK, timestamp: Date.now(), error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
