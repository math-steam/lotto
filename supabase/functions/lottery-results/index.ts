const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE_URL = "https://api.taiwanlottery.com/TLCAPIWeB/Lottery";

type ProxyDef = {
  name: string;
  wrap: (url: string) => string;
  unwrap?: (payload: unknown) => unknown;
};

const PROXIES: ProxyDef[] = [
  { name: "allorigins-raw", wrap: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  { name: "allorigins-get", wrap: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, unwrap: (p) => {
    if (p && typeof p === "object") { const obj = p as Record<string, unknown>; if (typeof obj.contents === "string") { try { return JSON.parse(obj.contents); } catch { return null; } } }
    return null;
  }},
  { name: "corsproxy", wrap: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}` },
  { name: "codetabs", wrap: (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}` },
  { name: "thingproxy", wrap: (u) => `https://thingproxy.freeboard.io/fetch/${u}` },
  { name: "direct", wrap: (u) => u },
];

type DrawItem = {
  period: string;
  date: string;
  numbers: number[];
  special: number;
};

type JackpotInfo = {
  amount: string | null;
  consecutiveNoWinner: number;
};

type LotteryResult = {
  lotto649: DrawItem[];
  superlotto: DrawItem[];
  daily539: DrawItem[];
  jackpots: {
    lotto649: JackpotInfo;
    superlotto: JackpotInfo;
    daily539: JackpotInfo;
  };
  debug: string[];
};

const MONTHS_BACK = 4;
const PAGE_SIZE = 100;
const FETCH_TIMEOUT_MS = 12000;

const FALLBACK_DRAWS: LotteryResult = {
  lotto649: [
    { period: "115000101", date: "2026/10/30", numbers: [4, 22, 25, 30, 34, 37], special: 48 },
    { period: "115000100", date: "2026/10/27", numbers: [8, 14, 16, 34, 38, 41], special: 9 },
    { period: "115000099", date: "2026/10/23", numbers: [9, 10, 33, 38, 40, 45], special: 2 },
    { period: "115000098", date: "2026/10/20", numbers: [2, 5, 19, 33, 40, 43], special: 6 },
    { period: "115000097", date: "2026/10/16", numbers: [6, 15, 21, 40, 43, 49], special: 30 },
    { period: "115000096", date: "2026/10/13", numbers: [3, 31, 35, 36, 47, 48], special: 32 },
    { period: "115000095", date: "2026/10/09", numbers: [3, 9, 11, 25, 34, 41], special: 27 },
    { period: "115000094", date: "2026/10/06", numbers: [4, 6, 20, 32, 36, 39], special: 23 },
    { period: "115000093", date: "2026/10/02", numbers: [4, 14, 20, 26, 40, 47], special: 42 },
    { period: "115000092", date: "2026/09/29", numbers: [1, 2, 4, 13, 30, 38], special: 27 },
    { period: "115000091", date: "2026/09/25", numbers: [5, 13, 24, 25, 28, 33], special: 40 },
    { period: "115000090", date: "2026/09/22", numbers: [14, 15, 18, 30, 35, 45], special: 10 },
    { period: "115000089", date: "2026/09/18", numbers: [1, 6, 14, 21, 31, 35], special: 16 },
    { period: "115000088", date: "2026/09/15", numbers: [2, 3, 18, 21, 22, 39], special: 7 },
    { period: "115000087", date: "2026/09/11", numbers: [12, 15, 19, 27, 43, 48], special: 25 },
    { period: "115000086", date: "2026/09/08", numbers: [3, 15, 28, 35, 47, 49], special: 27 },
    { period: "115000085", date: "2026/09/04", numbers: [3, 13, 17, 18, 27, 37], special: 19 },
    { period: "115000084", date: "2026/09/01", numbers: [10, 16, 19, 26, 29, 48], special: 30 },
    { period: "115000083", date: "2026/08/28", numbers: [9, 20, 23, 26, 36, 44], special: 4 },
    { period: "115000082", date: "2026/08/25", numbers: [12, 24, 26, 32, 35, 40], special: 6 },
    { period: "115000081", date: "2026/08/21", numbers: [8, 14, 23, 24, 26, 47], special: 30 },
    { period: "115000080", date: "2026/08/18", numbers: [1, 14, 25, 27, 29, 43], special: 2 },
    { period: "115000079", date: "2026/08/14", numbers: [5, 12, 25, 33, 34, 35], special: 27 },
    { period: "115000078", date: "2026/08/11", numbers: [8, 12, 16, 24, 29, 46], special: 10 },
    { period: "115000077", date: "2026/08/07", numbers: [2, 12, 19, 21, 25, 41], special: 31 },
    { period: "115000076", date: "2026/08/04", numbers: [4, 9, 15, 30, 36, 49], special: 40 },
    { period: "115000075", date: "2026/07/31", numbers: [11, 20, 23, 33, 34, 44], special: 10 },
    { period: "115000074", date: "2026/07/28", numbers: [8, 19, 24, 26, 32, 43], special: 47 },
    { period: "115000073", date: "2026/07/24", numbers: [3, 15, 27, 34, 35, 44], special: 40 },
    { period: "115000072", date: "2026/07/21", numbers: [2, 8, 15, 26, 35, 46], special: 11 },
  ],
  superlotto: [
    { period: "115000088", date: "2026/11/02", numbers: [4, 6, 16, 19, 21, 37], special: 7 },
    { period: "115000087", date: "2026/10/29", numbers: [3, 6, 11, 16, 26, 37], special: 1 },
    { period: "115000086", date: "2026/10/26", numbers: [1, 7, 19, 26, 31, 32], special: 3 },
    { period: "115000085", date: "2026/10/22", numbers: [1, 9, 10, 21, 22, 31], special: 6 },
    { period: "115000084", date: "2026/10/19", numbers: [9, 10, 21, 24, 27, 36], special: 8 },
    { period: "115000083", date: "2026/10/15", numbers: [6, 12, 18, 25, 30, 33], special: 6 },
    { period: "115000082", date: "2026/10/12", numbers: [3, 5, 20, 22, 26, 32], special: 3 },
    { period: "115000081", date: "2026/10/08", numbers: [4, 23, 27, 28, 29, 38], special: 5 },
    { period: "115000080", date: "2026/10/05", numbers: [2, 6, 17, 21, 26, 37], special: 6 },
    { period: "115000079", date: "2026/10/01", numbers: [2, 4, 18, 26, 33, 37], special: 3 },
    { period: "115000078", date: "2026/09/28", numbers: [1, 2, 4, 17, 29, 34], special: 1 },
    { period: "115000077", date: "2026/09/24", numbers: [3, 8, 25, 27, 30, 31], special: 1 },
    { period: "115000076", date: "2026/09/21", numbers: [3, 8, 17, 24, 25, 37], special: 6 },
    { period: "115000075", date: "2026/09/17", numbers: [23, 26, 27, 28, 31, 37], special: 7 },
    { period: "115000074", date: "2026/09/14", numbers: [10, 12, 14, 16, 29, 36], special: 8 },
    { period: "115000073", date: "2026/09/10", numbers: [8, 17, 18, 29, 33, 38], special: 2 },
    { period: "115000072", date: "2026/09/07", numbers: [7, 14, 17, 22, 29, 35], special: 2 },
    { period: "115000071", date: "2026/09/03", numbers: [1, 6, 7, 19, 30, 33], special: 8 },
    { period: "115000070", date: "2026/08/31", numbers: [4, 8, 12, 19, 32, 37], special: 2 },
    { period: "115000069", date: "2026/08/27", numbers: [2, 7, 9, 11, 24, 36], special: 1 },
    { period: "115000068", date: "2026/08/24", numbers: [6, 7, 9, 23, 26, 36], special: 7 },
    { period: "115000067", date: "2026/08/20", numbers: [1, 2, 9, 11, 29, 35], special: 2 },
    { period: "115000066", date: "2026/08/17", numbers: [5, 11, 18, 19, 35, 38], special: 8 },
    { period: "115000065", date: "2026/08/13", numbers: [1, 3, 4, 7, 10, 19], special: 6 },
    { period: "115000064", date: "2026/08/10", numbers: [11, 25, 28, 30, 31, 36], special: 3 },
    { period: "115000063", date: "2026/08/06", numbers: [2, 7, 8, 20, 26, 33], special: 4 },
    { period: "115000062", date: "2026/08/03", numbers: [4, 15, 22, 26, 34, 36], special: 7 },
    { period: "115000061", date: "2026/07/30", numbers: [8, 14, 17, 19, 21, 23], special: 7 },
    { period: "115000060", date: "2026/07/27", numbers: [19, 22, 28, 31, 33, 35], special: 7 },
    { period: "115000059", date: "2026/07/23", numbers: [8, 10, 13, 21, 29, 31], special: 7 },
    { period: "115000058", date: "2026/07/20", numbers: [6, 12, 13, 23, 29, 31], special: 2 },
  ],
  daily539: [
    { period: "115000264", date: "2026/10/31", numbers: [2, 5, 17, 28, 37], special: 0 },
    { period: "115000263", date: "2026/10/30", numbers: [9, 11, 12, 31, 37], special: 0 },
    { period: "115000262", date: "2026/10/29", numbers: [2, 11, 14, 21, 22], special: 0 },
    { period: "115000261", date: "2026/10/28", numbers: [6, 11, 13, 19, 35], special: 0 },
    { period: "115000260", date: "2026/10/27", numbers: [2, 6, 15, 27, 28], special: 0 },
    { period: "115000259", date: "2026/10/26", numbers: [13, 15, 19, 28, 35], special: 0 },
    { period: "115000258", date: "2026/10/24", numbers: [1, 17, 24, 27, 35], special: 0 },
    { period: "115000257", date: "2026/10/23", numbers: [3, 7, 14, 17, 27], special: 0 },
    { period: "115000256", date: "2026/10/22", numbers: [3, 8, 14, 23, 28], special: 0 },
    { period: "115000255", date: "2026/10/21", numbers: [4, 8, 15, 18, 28], special: 0 },
    { period: "115000254", date: "2026/10/20", numbers: [1, 15, 30, 36, 38], special: 0 },
    { period: "115000253", date: "2026/10/19", numbers: [4, 12, 16, 22, 36], special: 0 },
    { period: "115000252", date: "2026/10/17", numbers: [10, 20, 26, 32, 39], special: 0 },
    { period: "115000251", date: "2026/10/16", numbers: [9, 23, 24, 25, 32], special: 0 },
    { period: "115000250", date: "2026/10/15", numbers: [14, 15, 26, 32, 34], special: 0 },
    { period: "115000249", date: "2026/10/14", numbers: [1, 9, 13, 19, 25], special: 0 },
    { period: "115000248", date: "2026/10/13", numbers: [2, 3, 9, 20, 30], special: 0 },
    { period: "115000247", date: "2026/10/12", numbers: [6, 16, 24, 36, 39], special: 0 },
    { period: "115000246", date: "2026/10/10", numbers: [14, 21, 23, 32, 34], special: 0 },
    { period: "115000245", date: "2026/10/09", numbers: [20, 23, 25, 27, 31], special: 0 },
    { period: "115000244", date: "2026/10/08", numbers: [3, 7, 15, 17, 30], special: 0 },
    { period: "115000243", date: "2026/10/07", numbers: [5, 11, 14, 18, 19], special: 0 },
    { period: "115000242", date: "2026/10/06", numbers: [14, 25, 26, 29, 33], special: 0 },
    { period: "115000241", date: "2026/10/05", numbers: [2, 5, 8, 16, 31], special: 0 },
    { period: "115000240", date: "2026/10/03", numbers: [5, 28, 29, 33, 38], special: 0 },
    { period: "115000239", date: "2026/10/02", numbers: [13, 24, 30, 34, 38], special: 0 },
    { period: "115000238", date: "2026/10/01", numbers: [1, 3, 16, 28, 38], special: 0 },
    { period: "115000237", date: "2026/09/30", numbers: [2, 7, 9, 14, 33], special: 0 },
    { period: "115000236", date: "2026/09/29", numbers: [6, 13, 17, 26, 28], special: 0 },
  ],
  jackpots: {
    lotto649: { amount: null, consecutiveNoWinner: 0 },
    superlotto: { amount: null, consecutiveNoWinner: 0 },
    daily539: { amount: null, consecutiveNoWinner: 0 },
  },
  debug: [],
};

function monthsToFetch(): string[] {
  const now = new Date();
  const results: string[] = [];
  for (let i = 0; i < MONTHS_BACK; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    results.push(`${yyyy}-${mm}`);
  }
  return results;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function extractContent(payload: unknown, proxy: ProxyDef): Record<string, unknown> | null {
  let data = payload;
  if (proxy.unwrap) {
    data = proxy.unwrap(payload);
    if (!data) return null;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const content = obj.content;
    if (content && typeof content === "object") {
      return content as Record<string, unknown>;
    }
  }
  return null;
}

async function fetchViaProxies(
  targetUrl: string,
  debug: string[],
): Promise<Record<string, unknown> | null> {
  for (const proxy of PROXIES) {
    const proxiedUrl = proxy.wrap(targetUrl);
    try {
      const response = await fetchWithTimeout(proxiedUrl, FETCH_TIMEOUT_MS);
      if (!response.ok) {
        debug.push(`[${proxy.name}] HTTP ${response.status} for ${targetUrl}`);
        console.error(`[lottery] ${proxy.name} returned HTTP ${response.status}`);
        continue;
      }
      const payload: unknown = await response.json();
      const content = extractContent(payload, proxy);
      if (content) {
        debug.push(`[${proxy.name}] OK — got content`);
        console.log(`[lottery] ${proxy.name} succeeded for ${targetUrl}`);
        return content;
      }
      debug.push(`[${proxy.name}] response parsed but no content field`);
      console.error(`[lottery] ${proxy.name} response had no content field`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debug.push(`[${proxy.name}] fetch error: ${msg}`);
      console.error(`[lottery] ${proxy.name} failed:`, msg);
    }
  }
  return null;
}

async function fetchEndpoint(path: string, debug: string[]): Promise<Record<string, unknown> | null> {
  for (const month of monthsToFetch()) {
    const targetUrl = `${BASE_URL}/${path}?month=${month}&pageSize=${PAGE_SIZE}`;
    debug.push(`trying ${path} month=${month}`);
    const content = await fetchViaProxies(targetUrl, debug);
    if (content) return content;
  }
  return null;
}

function parseLotto649(content: Record<string, unknown>): DrawItem[] {
  const items = content["lotto649Res"];
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const draw = item as Record<string, unknown>;
    const allNumbers = Array.isArray(draw["drawNumberSize"]) ? (draw["drawNumberSize"] as number[]) : [];
    return {
      period: String(draw["period"]),
      date: String(draw["lotteryDate"]).slice(0, 10).replace(/-/g, "/"),
      numbers: allNumbers.slice(0, 6).sort((a, b) => a - b),
      special: allNumbers[6] ?? 0,
    };
  }).filter((d) => /^\d+$/.test(d.period) && d.numbers.length === 6);
}

function parseSuperlotto(content: Record<string, unknown>): DrawItem[] {
  const items = content["superLotto638Res"];
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const draw = item as Record<string, unknown>;
    const allNumbers = Array.isArray(draw["drawNumberSize"]) ? (draw["drawNumberSize"] as number[]) : [];
    return {
      period: String(draw["period"]),
      date: String(draw["lotteryDate"]).slice(0, 10).replace(/-/g, "/"),
      numbers: allNumbers.slice(0, 6).sort((a, b) => a - b),
      special: allNumbers[6] ?? 0,
    };
  }).filter((d) => /^\d+$/.test(d.period) && d.numbers.length === 6);
}

function parseDaily539(content: Record<string, unknown>): DrawItem[] {
  const items = content["daily539Res"];
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const draw = item as Record<string, unknown>;
    return {
      period: String(draw["period"]),
      date: String(draw["lotteryDate"]).slice(0, 10).replace(/-/g, "/"),
      numbers: Array.isArray(draw["drawNumberSize"]) ? (draw["drawNumberSize"] as number[]).sort((a, b) => a - b) : [],
      special: 0,
    };
  }).filter((d) => /^\d+$/.test(d.period) && d.numbers.length === 5);
}

function sortAndLimit(draws: DrawItem[], limit: number): DrawItem[] {
  return draws.sort((a, b) => Number(b.period) - Number(a.period)).slice(0, limit);
}

function extractJackpot(content: Record<string, unknown>, drawItems: DrawItem[], key: string, debug: string[]): JackpotInfo {
  const items = content[key];
  if (!Array.isArray(items) || items.length === 0) {
    return { amount: null, consecutiveNoWinner: 0 };
  }
  const sorted = [...items].sort((a, b) => {
    const pa = Number((a as Record<string, unknown>)["period"]);
    const pb = Number((b as Record<string, unknown>)["period"]);
    return pb - pa;
  });
  const latest = sorted[0] as Record<string, unknown>;
  const prizeAmount = latest["estimatedPrizeAmount"] ?? latest["prizeAmount"] ?? latest["jackpotAmount"];
  let amountStr: string | null = null;
  if (typeof prizeAmount === "number" && prizeAmount > 0) {
    amountStr = `NT$ ${(prizeAmount / 100000000).toFixed(1)} 億`;
  } else if (typeof prizeAmount === "string" && prizeAmount.trim()) {
    amountStr = prizeAmount.trim();
  }
  let consecutive = 0;
  for (const item of sorted) {
    const draw = item as Record<string, unknown>;
    const winner = draw["winningTicket"] ?? draw["hasWinner"];
    if (winner === false || winner === "false" || winner === 0 || winner === "N") {
      consecutive += 1;
    } else {
      break;
    }
  }
  debug.push(`[${key}] jackpot: amount=${amountStr}, consecutiveNoWinner=${consecutive}`);
  return { amount: amountStr, consecutiveNoWinner: consecutive };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const debug: string[] = [];

  try {
    const [lotto649Content, superlottoContent, daily539Content] = await Promise.all([
      fetchEndpoint("Lotto649Result", debug),
      fetchEndpoint("SuperLotto638Result", debug),
      fetchEndpoint("Daily539Result", debug),
    ]);

    const lotto649Draws = lotto649Content && parseLotto649(lotto649Content).length > 0 ? sortAndLimit(parseLotto649(lotto649Content), 30) : FALLBACK_DRAWS.lotto649;
    const superlottoDraws = superlottoContent && parseSuperlotto(superlottoContent).length > 0 ? sortAndLimit(parseSuperlotto(superlottoContent), 30) : FALLBACK_DRAWS.superlotto;
    const daily539Draws = daily539Content && parseDaily539(daily539Content).length > 0 ? sortAndLimit(parseDaily539(daily539Content), 30) : FALLBACK_DRAWS.daily539;

    const lotto649Jackpot = lotto649Content ? extractJackpot(lotto649Content, lotto649Draws, "lotto649Res", debug) : { amount: null, consecutiveNoWinner: 0 };
    const superlottoJackpot = superlottoContent ? extractJackpot(superlottoContent, superlottoDraws, "superLotto638Res", debug) : { amount: null, consecutiveNoWinner: 0 };
    const daily539Jackpot = daily539Content ? extractJackpot(daily539Content, daily539Draws, "daily539Res", debug) : { amount: null, consecutiveNoWinner: 0 };

    const result: LotteryResult = {
      lotto649: lotto649Draws,
      superlotto: superlottoDraws,
      daily539: daily539Draws,
      jackpots: {
        lotto649: lotto649Jackpot,
        superlotto: superlottoJackpot,
        daily539: daily539Jackpot,
      },
      debug,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[lottery] Unhandled error:", msg);
    return new Response(JSON.stringify({ error: msg, debug }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
