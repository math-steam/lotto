import { useEffect, useMemo, useState } from 'react';
import { Award, Check, ChevronDown, Coffee, Coins, Copy, Download, Flame, History, Heart, RefreshCw, Sparkles, Target, Timer, Trash2, Trophy, X, Zap } from 'lucide-react';
import LotteryStats from '@/components/LotteryStats';

type Ratio = string;
type Strategy = 'hot' | 'cold' | 'golden' | 'random';
type LotteryType = 'lotto649' | 'superlotto' | 'daily539';
type View = 'generator' | 'records';

type SavedRecord = {
  id: string;
  lotteryType: LotteryType;
  lotteryLabel: string;
  numbers: number[];
  secondNumber: number | null;
  sum: number;
  oddEven: string;
  strategy: Strategy;
  createdAt: number;
};

type HistoryResponse = {
  draws: Draw[];
  offline: boolean;
};

export type Draw = {
  period: string;
  date: string;
  numbers: number[];
  special: number;
};

export type LotteryConfig = {
  id: LotteryType;
  label: string;
  title: string;
  subtitle: string;
  mainMax: number;
  mainCount: number;
  sumMin: number;
  sumMax: number;
  sumDefault: [number, number];
  hasSecondArea: boolean;
  secondMax: number;
  secondCount: number;
  hasSpecial: boolean;
  specialLabel: string;
};

const DRAW_DAYS: Record<LotteryType, number[]> = {
  lotto649: [2, 5],
  superlotto: [1, 4],
  daily539: [1, 2, 3, 4, 5, 6],
};
const DRAW_TIME_HOUR = 20;
const DRAW_TIME_MIN = 30;

const lotto649History: Draw[] = [
  { period: '115000101', date: '2026/10/30', numbers: [4, 22, 25, 30, 34, 37], special: 48 },
  { period: '115000100', date: '2026/10/27', numbers: [8, 14, 16, 34, 38, 41], special: 9 },
  { period: '115000099', date: '2026/10/23', numbers: [9, 10, 33, 38, 40, 45], special: 2 },
  { period: '115000098', date: '2026/10/20', numbers: [2, 5, 19, 33, 40, 43], special: 6 },
  { period: '115000097', date: '2026/10/16', numbers: [6, 15, 21, 40, 43, 49], special: 30 },
  { period: '115000096', date: '2026/10/13', numbers: [3, 31, 35, 36, 47, 48], special: 32 },
  { period: '115000095', date: '2026/10/09', numbers: [3, 9, 11, 25, 34, 41], special: 27 },
  { period: '115000094', date: '2026/10/06', numbers: [4, 6, 20, 32, 36, 39], special: 23 },
  { period: '115000093', date: '2026/10/02', numbers: [4, 14, 20, 26, 40, 47], special: 42 },
  { period: '115000092', date: '2026/09/29', numbers: [1, 2, 4, 13, 30, 38], special: 27 },
  { period: '115000091', date: '2026/09/25', numbers: [5, 13, 24, 25, 28, 33], special: 40 },
  { period: '115000090', date: '2026/09/22', numbers: [14, 15, 18, 30, 35, 45], special: 10 },
  { period: '115000089', date: '2026/09/18', numbers: [1, 6, 14, 21, 31, 35], special: 16 },
  { period: '115000088', date: '2026/09/15', numbers: [2, 3, 18, 21, 22, 39], special: 7 },
  { period: '115000087', date: '2026/09/11', numbers: [12, 15, 19, 27, 43, 48], special: 25 },
  { period: '115000086', date: '2026/09/08', numbers: [3, 15, 28, 35, 47, 49], special: 27 },
  { period: '115000085', date: '2026/09/04', numbers: [3, 13, 17, 18, 27, 37], special: 19 },
  { period: '115000084', date: '2026/09/01', numbers: [10, 16, 19, 26, 29, 48], special: 30 },
  { period: '115000083', date: '2026/08/28', numbers: [9, 20, 23, 26, 36, 44], special: 4 },
  { period: '115000082', date: '2026/08/25', numbers: [12, 24, 26, 32, 35, 40], special: 6 },
  { period: '115000081', date: '2026/08/21', numbers: [8, 14, 23, 24, 26, 47], special: 30 },
  { period: '115000080', date: '2026/08/18', numbers: [1, 14, 25, 27, 29, 43], special: 2 },
  { period: '115000079', date: '2026/08/14', numbers: [5, 12, 25, 33, 34, 35], special: 27 },
  { period: '115000078', date: '2026/08/11', numbers: [8, 12, 16, 24, 29, 46], special: 10 },
  { period: '115000077', date: '2026/08/07', numbers: [2, 12, 19, 21, 25, 41], special: 31 },
  { period: '115000076', date: '2026/08/04', numbers: [4, 9, 15, 30, 36, 49], special: 40 },
  { period: '115000075', date: '2026/07/31', numbers: [11, 20, 23, 33, 34, 44], special: 10 },
  { period: '115000074', date: '2026/07/28', numbers: [8, 19, 24, 26, 32, 43], special: 47 },
  { period: '115000073', date: '2026/07/24', numbers: [3, 15, 27, 34, 35, 44], special: 40 },
  { period: '115000072', date: '2026/07/21', numbers: [2, 8, 15, 26, 35, 46], special: 11 },
];

const superlottoHistory: Draw[] = [
  { period: '115000088', date: '2026/11/02', numbers: [4, 6, 16, 19, 21, 37], special: 7 },
  { period: '115000087', date: '2026/10/29', numbers: [3, 6, 11, 16, 26, 37], special: 1 },
  { period: '115000086', date: '2026/10/26', numbers: [1, 7, 19, 26, 31, 32], special: 3 },
  { period: '115000085', date: '2026/10/22', numbers: [1, 9, 10, 21, 22, 31], special: 6 },
  { period: '115000084', date: '2026/10/19', numbers: [9, 10, 21, 24, 27, 36], special: 8 },
  { period: '115000083', date: '2026/10/15', numbers: [6, 12, 18, 25, 30, 33], special: 6 },
  { period: '115000082', date: '2026/10/12', numbers: [3, 5, 20, 22, 26, 32], special: 3 },
  { period: '115000081', date: '2026/10/08', numbers: [4, 23, 27, 28, 29, 38], special: 5 },
  { period: '115000080', date: '2026/10/05', numbers: [2, 6, 17, 21, 26, 37], special: 6 },
  { period: '115000079', date: '2026/10/01', numbers: [2, 4, 18, 26, 33, 37], special: 3 },
  { period: '115000078', date: '2026/09/28', numbers: [1, 2, 4, 17, 29, 34], special: 1 },
  { period: '115000077', date: '2026/09/24', numbers: [3, 8, 25, 27, 30, 31], special: 1 },
  { period: '115000076', date: '2026/09/21', numbers: [3, 8, 17, 24, 25, 37], special: 6 },
  { period: '115000075', date: '2026/09/17', numbers: [23, 26, 27, 28, 31, 37], special: 7 },
  { period: '115000074', date: '2026/09/14', numbers: [10, 12, 14, 16, 29, 36], special: 8 },
  { period: '115000073', date: '2026/09/10', numbers: [8, 17, 18, 29, 33, 38], special: 2 },
  { period: '115000072', date: '2026/09/07', numbers: [7, 14, 17, 22, 29, 35], special: 2 },
  { period: '115000071', date: '2026/09/03', numbers: [1, 6, 7, 19, 30, 33], special: 8 },
  { period: '115000070', date: '2026/08/31', numbers: [4, 8, 12, 19, 32, 37], special: 2 },
  { period: '115000069', date: '2026/08/27', numbers: [2, 7, 9, 11, 24, 36], special: 1 },
  { period: '115000068', date: '2026/08/24', numbers: [6, 7, 9, 23, 26, 36], special: 7 },
  { period: '115000067', date: '2026/08/20', numbers: [1, 2, 9, 11, 29, 35], special: 2 },
  { period: '115000066', date: '2026/08/17', numbers: [5, 11, 18, 19, 35, 38], special: 8 },
  { period: '115000065', date: '2026/08/13', numbers: [1, 3, 4, 7, 10, 19], special: 6 },
  { period: '115000064', date: '2026/08/10', numbers: [11, 25, 28, 30, 31, 36], special: 3 },
  { period: '115000063', date: '2026/08/06', numbers: [2, 7, 8, 20, 26, 33], special: 4 },
  { period: '115000062', date: '2026/08/03', numbers: [4, 15, 22, 26, 34, 36], special: 7 },
  { period: '115000061', date: '2026/07/30', numbers: [8, 14, 17, 19, 21, 23], special: 7 },
  { period: '115000060', date: '2026/07/27', numbers: [19, 22, 28, 31, 33, 35], special: 7 },
  { period: '115000059', date: '2026/07/23', numbers: [8, 10, 13, 21, 29, 31], special: 7 },
  { period: '115000058', date: '2026/07/20', numbers: [6, 12, 13, 23, 29, 31], special: 2 },
];

const daily539History: Draw[] = [
  { period: '115000264', date: '2026/10/31', numbers: [2, 5, 17, 28, 37], special: 0 },
  { period: '115000263', date: '2026/10/30', numbers: [9, 11, 12, 31, 37], special: 0 },
  { period: '115000262', date: '2026/10/29', numbers: [2, 11, 14, 21, 22], special: 0 },
  { period: '115000261', date: '2026/10/28', numbers: [6, 11, 13, 19, 35], special: 0 },
  { period: '115000260', date: '2026/10/27', numbers: [2, 6, 15, 27, 28], special: 0 },
  { period: '115000259', date: '2026/10/26', numbers: [13, 15, 19, 28, 35], special: 0 },
  { period: '115000258', date: '2026/10/24', numbers: [1, 17, 24, 27, 35], special: 0 },
  { period: '115000257', date: '2026/10/23', numbers: [3, 7, 14, 17, 27], special: 0 },
  { period: '115000256', date: '2026/10/22', numbers: [3, 8, 14, 23, 28], special: 0 },
  { period: '115000255', date: '2026/10/21', numbers: [4, 8, 15, 18, 28], special: 0 },
  { period: '115000254', date: '2026/10/20', numbers: [1, 15, 30, 36, 38], special: 0 },
  { period: '115000253', date: '2026/10/19', numbers: [4, 12, 16, 22, 36], special: 0 },
  { period: '115000252', date: '2026/10/17', numbers: [10, 20, 26, 32, 39], special: 0 },
  { period: '115000251', date: '2026/10/16', numbers: [9, 23, 24, 25, 32], special: 0 },
  { period: '115000250', date: '2026/10/15', numbers: [14, 15, 26, 32, 34], special: 0 },
  { period: '115000249', date: '2026/10/14', numbers: [1, 9, 13, 19, 25], special: 0 },
  { period: '115000248', date: '2026/10/13', numbers: [2, 3, 9, 20, 30], special: 0 },
  { period: '115000247', date: '2026/10/12', numbers: [6, 16, 24, 36, 39], special: 0 },
  { period: '115000246', date: '2026/10/10', numbers: [14, 21, 23, 32, 34], special: 0 },
  { period: '115000245', date: '2026/10/09', numbers: [20, 23, 25, 27, 31], special: 0 },
  { period: '115000244', date: '2026/10/08', numbers: [3, 7, 15, 17, 30], special: 0 },
  { period: '115000243', date: '2026/10/07', numbers: [5, 11, 14, 18, 19], special: 0 },
  { period: '115000242', date: '2026/10/06', numbers: [14, 25, 26, 29, 33], special: 0 },
  { period: '115000241', date: '2026/10/05', numbers: [2, 5, 8, 16, 31], special: 0 },
  { period: '115000240', date: '2026/10/03', numbers: [5, 28, 29, 33, 38], special: 0 },
  { period: '115000239', date: '2026/10/02', numbers: [13, 24, 30, 34, 38], special: 0 },
  { period: '115000238', date: '2026/10/01', numbers: [1, 3, 16, 28, 38], special: 0 },
  { period: '115000237', date: '2026/09/30', numbers: [2, 7, 9, 14, 33], special: 0 },
  { period: '115000236', date: '2026/09/29', numbers: [6, 13, 17, 26, 28], special: 0 },
  { period: '115000235', date: '2026/09/28', numbers: [13, 19, 21, 27, 32], special: 0 },
];

const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  lotto649: {
    id: 'lotto649',
    label: '大樂透',
    title: '大樂透黃金選號大師',
    subtitle: '用條件選出心中的幸運組合，讓好運更靠近一步',
    mainMax: 49,
    mainCount: 6,
    sumMin: 21,
    sumMax: 279,
    sumDefault: [120, 180],
    hasSecondArea: false,
    secondMax: 0,
    secondCount: 0,
    hasSpecial: true,
    specialLabel: '特別號',
  },
  superlotto: {
    id: 'superlotto',
    label: '威力彩',
    title: '威力彩黃金選號大師',
    subtitle: '第一區 6 碼加第二區 1 碼，挑出你的幸運組合',
    mainMax: 38,
    mainCount: 6,
    sumMin: 21,
    sumMax: 198,
    sumDefault: [120, 180],
    hasSecondArea: true,
    secondMax: 8,
    secondCount: 1,
    hasSpecial: true,
    specialLabel: '第二區',
  },
  daily539: {
    id: 'daily539',
    label: '今彩539',
    title: '今彩539黃金選號大師',
    subtitle: '從 01~39 選出 5 個號碼，天天都有好運機會',
    mainMax: 39,
    mainCount: 5,
    sumMin: 15,
    sumMax: 185,
    sumDefault: [70, 130],
    hasSecondArea: false,
    secondMax: 0,
    secondCount: 0,
    hasSpecial: false,
    specialLabel: '',
  },
};

const BUILT_IN_HISTORY: Record<LotteryType, Draw[]> = {
  lotto649: lotto649History,
  superlotto: superlottoHistory,
  daily539: daily539History,
};

const ratioOptionsFor = (count: number): Ratio[] =>
  count === 5 ? ['3:2', '2:3', '4:1', '1:4'] : ['3:3', '2:4', '4:2', '1:5', '5:1'];

const strategyOptions: { id: Strategy; icon: string; label: string; description: string }[] = [
  { id: 'hot', icon: '🔥', label: '熱門高頻', description: '優先近期常開號碼' },
  { id: 'cold', icon: '❄️', label: '冷門回補', description: '尋找久未開出的號碼' },
  { id: 'golden', icon: '⚖️', label: '黃金比例', description: '平衡奇偶與和值' },
  { id: 'random', icon: '🎲', label: '純條件隨機', description: '完全依照篩選條件' },
];
const strategyLabel: Record<Strategy, string> = { hot: '熱門高頻', cold: '冷門回補', golden: '黃金比例', random: '純條件隨機' };
const pad = (number: number) => number.toString().padStart(2, '0');

const RECORDS_KEY = 'hao-yun-xuan-hao-records';
const RECORDS_LIMIT = 200;
const LOTTERY_CACHE_KEY = 'hao-yun-xuan-hao-lottery-cache';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const LOTTERY_API_URL = `${SUPABASE_URL}/functions/v1/lottery-results`;

type LotteryApiResponse = {
  lotto649: Draw[];
  superlotto: Draw[];
  daily539: Draw[];
};

type LotteryCache = {
  data: LotteryApiResponse;
  timestamp: number;
};

function isDrawArray(value: unknown): value is Draw[] {
  return Array.isArray(value) && value.every((item): item is Draw =>
    Boolean(item) && typeof item === 'object'
    && typeof (item as Draw).period === 'string'
    && typeof (item as Draw).date === 'string'
    && Array.isArray((item as Draw).numbers)
    && typeof (item as Draw).special === 'number');
}

function loadLotteryCache(): LotteryApiResponse | null {
  try {
    const raw = localStorage.getItem(LOTTERY_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const cache = parsed as Partial<LotteryCache>;
    if (!cache.data || typeof cache.timestamp !== 'number') return null;
    const data = cache.data as Record<string, unknown>;
    if (isDrawArray(data.lotto649) && isDrawArray(data.superlotto) && isDrawArray(data.daily539)) {
      return cache.data!;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveLotteryCache(data: LotteryApiResponse) {
  try {
    const cache: LotteryCache = { data, timestamp: Date.now() };
    localStorage.setItem(LOTTERY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable or full */
  }
}

export async function fetchLatestLottery(): Promise<LotteryApiResponse> {
  let lastError: unknown = null;
  try {
    const response = await fetch(`${LOTTERY_API_URL}?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`lottery edge function returned ${response.status}: ${body.slice(0, 200)}`);
    }
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') throw new Error('invalid lottery API response');
    const data = payload as Record<string, unknown>;
    if (data.error) {
      throw new Error(`lottery API error: ${data.error}`);
    }
    if (!isDrawArray(data.lotto649) || !isDrawArray(data.superlotto) || !isDrawArray(data.daily539)) {
      throw new Error('incomplete lottery API response — missing draw arrays');
    }
    return {
      lotto649: data.lotto649,
      superlotto: data.superlotto,
      daily539: data.daily539,
    };
  } catch (err) {
    lastError = err;
    console.error('[lottery] Edge function fetch failed:', err);
  }

  // Browser-side direct proxy fallback — try fetching Taiwan Lottery API directly via CORS proxy
  console.warn('[lottery] Edge function failed, trying browser-side direct proxy fallback...');
  try {
    const directResult = await fetchLatestLotteryViaBrowserProxy();
    console.log('[lottery] Browser-side proxy fallback succeeded');
    return directResult;
  } catch (err2) {
    console.error('[lottery] Browser-side proxy fallback also failed:', err2);
  }

  throw lastError instanceof Error ? lastError : new Error('All lottery fetch methods failed');
}

const LOTTERY_DIRECT_API = 'https://api.taiwanlottery.com/TLCAPIWeB/Lottery';
const BROWSER_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
];

function monthsToFetchBrowser(): string[] {
  const now = new Date();
  const results: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    results.push(`${yyyy}-${mm}`);
  }
  return results;
}

async function fetchDrawsViaBrowserProxy(path: string): Promise<Record<string, unknown> | null> {
  for (const month of monthsToFetchBrowser()) {
    const targetUrl = `${LOTTERY_DIRECT_API}/${path}?month=${month}&pageSize=100`;
    for (const wrap of BROWSER_PROXIES) {
      try {
        const response = await fetch(`${wrap(targetUrl)}&_t=${Date.now()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok) { console.error(`[lottery] browser proxy ${wrap.name} returned ${response.status}`); continue; }
        const payload: unknown = await response.json();
        if (payload && typeof payload === 'object') {
          const obj = payload as Record<string, unknown>;
          const content = obj.content;
          if (content && typeof content === 'object') return content as Record<string, unknown>;
        }
      } catch (err) {
        console.error(`[lottery] browser proxy failed for ${path} month=${month}:`, err);
      }
    }
  }
  return null;
}

function parseDrawItems(content: Record<string, unknown>, key: string, hasSpecial: boolean): Draw[] {
  const items = content[key];
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const draw = item as Record<string, unknown>;
    const allNumbers = Array.isArray(draw['drawNumberSize']) ? (draw['drawNumberSize'] as number[]) : [];
    return {
      period: String(draw['period']),
      date: String(draw['lotteryDate']).slice(0, 10).replace(/-/g, '/'),
      numbers: hasSpecial ? allNumbers.slice(0, 6).sort((a, b) => a - b) : allNumbers.sort((a, b) => a - b),
      special: hasSpecial ? (allNumbers[6] ?? 0) : 0,
    } as Draw;
  }).filter((d) => /^\d+$/.test(d.period) && d.numbers.length === (hasSpecial ? 6 : 5));
}

async function fetchLatestLotteryViaBrowserProxy(): Promise<LotteryApiResponse> {
  const [lotto649Content, superlottoContent, daily539Content] = await Promise.all([
    fetchDrawsViaBrowserProxy('Lotto649Result'),
    fetchDrawsViaBrowserProxy('SuperLotto638Result'),
    fetchDrawsViaBrowserProxy('Daily539Result'),
  ]);

  const lotto649 = lotto649Content ? sortAndLimitDraws(parseDrawItems(lotto649Content, 'lotto649Res', true), 30) : [];
  const superlotto = superlottoContent ? sortAndLimitDraws(parseDrawItems(superlottoContent, 'superLotto638Res', true), 30) : [];
  const daily539 = daily539Content ? sortAndLimitDraws(parseDrawItems(daily539Content, 'daily539Res', false), 30) : [];

  if (lotto649.length === 0 && superlotto.length === 0 && daily539.length === 0) {
    throw new Error('browser proxy fallback: all endpoints returned empty');
  }
  return { lotto649, superlotto, daily539 };
}

function sortAndLimitDraws(draws: Draw[], limit: number): Draw[] {
  return [...draws].sort((a, b) => Number(b.period) - Number(a.period)).slice(0, limit);
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const ESTIMATED_JACKPOT: Record<LotteryType, string> = {
  lotto649: 'NT$ 1.5 億',
  superlotto: 'NT$ 1.2 億',
  daily539: 'NT$ 800 萬',
};

type NextDrawInfo = {
  date: Date;
  isToday: boolean;
  drawDateLabel: string;
  drawTimeLabel: string;
};

function getNextDraw(type: LotteryType, now: Date): NextDrawInfo {
  const days = DRAW_DAYS[type];
  const result = new Date(now);
  result.setHours(DRAW_TIME_HOUR, DRAW_TIME_MIN, 0, 0);
  if (now > result) result.setDate(result.getDate() + 1);
  for (let i = 0; i < 14; i += 1) {
    if (days.includes(result.getDay())) break;
    result.setDate(result.getDate() + 1);
  }
  const isToday = result.getDate() === now.getDate() && result.getMonth() === now.getMonth() && result.getFullYear() === now.getFullYear();
  const pad2 = (value: number) => value.toString().padStart(2, '0');
  return {
    date: result,
    isToday,
    drawDateLabel: `${pad2(result.getMonth() + 1)}/${pad2(result.getDate())} (${WEEKDAY_LABELS[result.getDay()]})`,
    drawTimeLabel: `${pad2(DRAW_TIME_HOUR)}:${pad2(DRAW_TIME_MIN)}`,
  };
}

function loadRecords(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedRecord =>
      Boolean(item) && typeof item === 'object' && typeof (item as SavedRecord).id === 'string' && Array.isArray((item as SavedRecord).numbers)
    );
  } catch {
    return [];
  }
}

function saveRecords(records: SavedRecord[]) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(0, RECORDS_LIMIT)));
  } catch {
    /* storage unavailable or full */
  }
}

function formatRecordTime(ts: number): string {
  const date = new Date(ts);
  const pad2 = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export async function fetchLotteryHistory(): Promise<HistoryResponse> {
  try {
    const latest = await fetchLatestLottery();
    saveLotteryCache(latest);
    return { draws: latest.lotto649, offline: false };
  } catch (err) {
    console.error('[lottery] fetchLotteryHistory failed, falling back to cache/built-in:', err);
    const cached = loadLotteryCache();
    if (cached) { console.warn('[lottery] Using cached data (offline mode)'); return { draws: cached.lotto649, offline: true }; }
    console.warn('[lottery] Using built-in static data (offline mode)');
    return { draws: lotto649History, offline: true };
  }
}

async function fetchHistoryByType(type: LotteryType): Promise<HistoryResponse> {
  try {
    const latest = await fetchLatestLottery();
    saveLotteryCache(latest);
    if (latest[type].length > 0) return { draws: latest[type], offline: false };
    console.warn(`[lottery] fetchHistoryByType(${type}): API returned empty, falling back`);
  } catch (err) {
    console.error(`[lottery] fetchHistoryByType(${type}) failed, falling back:`, err);
  }
  const cached = loadLotteryCache();
  if (cached && cached[type].length > 0) return { draws: cached[type], offline: true };
  return { draws: BUILT_IN_HISTORY[type], offline: true };
}

function hasAllowedStreak(numbers: number[], maxStreak: number) {
  let streak = 1;
  for (let index = 1; index < numbers.length; index += 1) {
    if (numbers[index] === numbers[index - 1] + 1) {
      streak += 1;
      if (streak > maxStreak) return false;
    } else {
      streak = 1;
    }
  }
  return true;
}

type PrizeResult = {
  matchedCount: number;
  specialHit: boolean;
  prize: string | null;
  status: 'win' | 'lose' | 'pending';
  statusLabel: string;
  matchedSet: Set<number>;
};

function determinePrize(type: LotteryType, matchedCount: number, specialHit: boolean): string | null {
  if (type === 'lotto649') {
    if (matchedCount === 6) return '頭獎';
    if (matchedCount === 5 && specialHit) return '貳獎';
    if (matchedCount === 5) return '參獎';
    if (matchedCount === 4 && specialHit) return '肆獎';
    if (matchedCount === 4) return '伍獎';
    if (matchedCount === 3 && specialHit) return '陸獎';
    if (matchedCount === 3) return '普獎';
    if (matchedCount === 2 && specialHit) return '普獎';
    return null;
  }
  if (type === 'daily539') {
    if (matchedCount === 5) return '頭獎';
    if (matchedCount === 4) return '貳獎';
    if (matchedCount === 3) return '參獎';
    if (matchedCount === 2) return '普獎';
    return null;
  }
  if (matchedCount === 6 && specialHit) return '頭獎';
  if (matchedCount === 6) return '貳獎';
  if (matchedCount === 5 && specialHit) return '參獎';
  if (matchedCount === 5) return '肆獎';
  if (matchedCount === 4 && specialHit) return '伍獎';
  if (matchedCount === 4) return '陸獎';
  if (matchedCount === 3 && specialHit) return '柒獎';
  if (matchedCount === 3) return '普獎';
  if (matchedCount === 2 && specialHit) return '普獎';
  return null;
}

function checkPrize(record: SavedRecord, draw: Draw | undefined): PrizeResult {
  if (!draw) {
    return { matchedCount: 0, specialHit: false, prize: null, status: 'pending', statusLabel: '⏳ 等待最新開獎中', matchedSet: new Set() };
  }
  const drawSet = new Set(draw.numbers);
  const matched = record.numbers.filter((number) => drawSet.has(number));
  const matchedSet = new Set(matched);
  const matchedCount = matched.length;
  let specialHit = false;
  if (record.lotteryType === 'superlotto') {
    specialHit = record.secondNumber === draw.special;
  } else if (record.lotteryType === 'lotto649') {
    specialHit = draw.special !== 0 && record.numbers.includes(draw.special);
  }
  const prize = determinePrize(record.lotteryType, matchedCount, specialHit);
  let statusLabel: string;
  let status: 'win' | 'lose' | 'pending';
  if (prize) {
    status = 'win';
    statusLabel = `🎉 恭喜中獎！【${prize}】`;
  } else {
    status = 'lose';
    statusLabel = `⚪ 未中獎（中 ${matchedCount} 碼${specialHit ? '+特別號' : ''}）`;
  }
  return { matchedCount, specialHit, prize, status, statusLabel, matchedSet };
}

function App() {
  const [lotteryType, setLotteryType] = useState<LotteryType>('lotto649');
  const [view, setView] = useState<View>('generator');
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);
  const [checkResults, setCheckResults] = useState<Record<string, PrizeResult>>({});
  const [checkSummary, setCheckSummary] = useState<string | null>(null);
  const [isCheckingPrize, setIsCheckingPrize] = useState(false);
  const config = LOTTERY_CONFIGS[lotteryType];

  const [excluded, setExcluded] = useState<number[]>([7, 13]);
  const [excludedSecond, setExcludedSecond] = useState<number[]>([]);
  const [sumRange, setSumRange] = useState<[number, number]>(config.sumDefault);
  const [ratio, setRatio] = useState<Ratio>('3:3');
  const [maxStreak, setMaxStreak] = useState(2);
  const [strategy, setStrategy] = useState<Strategy>('random');
  const [result, setResult] = useState<number[]>([5, 12, 23, 31, 38, 44]);
  const [resultSecond, setResultSecond] = useState<number>(1);
  const [recommendation, setRecommendation] = useState('包含 3 個熱門號、奇偶比 3:3');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [historyData, setHistoryData] = useState<Draw[]>(lotto649History);
  const [isOffline, setIsOffline] = useState(true);
  const [autoExcludeRecent, setAutoExcludeRecent] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false);

  const refreshHistory = async (type: LotteryType, markChecked: boolean) => {
    const latest = await fetchHistoryByType(type);
    if (latest.draws.length > 0) {
      setHistoryData(latest.draws);
      setIsOffline(latest.offline);
    }
    if (markChecked) setChecked(true);
  };

  useEffect(() => {
    setRecords(loadRecords());
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    refreshHistory(lotteryType, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ratioOptions = useMemo(() => ratioOptionsFor(config.mainCount), [config.mainCount]);

  const switchLottery = (type: LotteryType) => {
    if (type === lotteryType) return;
    const next = LOTTERY_CONFIGS[type];
    setLotteryType(type);
    setExcluded([]);
    setExcludedSecond([]);
    setSumRange(next.sumDefault);
    setRatio(ratioOptionsFor(next.mainCount)[0]);
    setMaxStreak(2);
    setResult(Array.from({ length: next.mainCount }, (_, index) => index + 1));
    setResultSecond(1);
    setRecommendation('點擊「生成選號」開始挑選幸運組合');
    setChecked(false);
    setShowAll(false);
    setHistoryData(BUILT_IN_HISTORY[type]);
    setIsOffline(true);
  };

  const recentNumbers = useMemo(() => historyData.slice(0, 2).flatMap((draw) => draw.numbers), [historyData]);
  const blockedNumbers = useMemo(() => new Set([...excluded, ...(autoExcludeRecent ? recentNumbers : [])]), [autoExcludeRecent, excluded, recentNumbers]);
  const availableNumbers = useMemo(
    () => Array.from({ length: config.mainMax }, (_, index) => index + 1).filter((number) => !blockedNumbers.has(number)),
    [blockedNumbers, config.mainMax],
  );
  const availableSecond = useMemo(
    () => Array.from({ length: config.secondMax }, (_, index) => index + 1).filter((number) => !excludedSecond.includes(number)),
    [excludedSecond, config.secondMax],
  );

  const frequency = useMemo(() => {
    const counts = new Map<number, number>();
    historyData.forEach((draw) => draw.numbers.forEach((number) => counts.set(number, (counts.get(number) ?? 0) + 1)));
    return counts;
  }, [historyData]);

  const generateNumbers = () => {
    const targetRatio: Ratio = strategy === 'golden' ? (Math.random() > 0.5 ? ratioOptions[0] : ratioOptions[1]) : ratio;
    const [oddTarget] = targetRatio.split(':').map(Number);
    const targetSum: [number, number] = strategy === 'golden' ? config.sumDefault : sumRange;
    const lastSeen = new Map<number, number>();
    historyData.forEach((draw, index) => draw.numbers.forEach((number) => { if (!lastSeen.has(number)) lastSeen.set(number, index); }));
    const ranked = [...availableNumbers].sort((a, b) => {
      if (strategy === 'hot') return (frequency.get(b) ?? 0) - (frequency.get(a) ?? 0);
      if (strategy === 'cold') return (lastSeen.get(b) ?? historyData.length) - (lastSeen.get(a) ?? historyData.length);
      return 0;
    });
    let selected: number[] | undefined;
    for (let attempt = 0; attempt < 2200 && !selected; attempt += 1) {
      const pool = strategy === 'random' || strategy === 'golden' ? [...availableNumbers] : ranked.slice(0, Math.min(28, availableNumbers.length));
      const numbers = pool.sort(() => Math.random() - 0.5).slice(0, config.mainCount).sort((a, b) => a - b);
      const sum = numbers.reduce((total, number) => total + number, 0);
      const oddCount = numbers.filter((number) => number % 2 === 1).length;
      if (sum >= targetSum[0] && sum <= targetSum[1] && oddCount === oddTarget && hasAllowedStreak(numbers, maxStreak)) selected = numbers;
    }
    if (!selected) return;
    setResult(selected);
    const selectedSecond = config.hasSecondArea ? (availableSecond[Math.floor(Math.random() * availableSecond.length)] ?? 1) : null;
    if (config.hasSecondArea && selectedSecond !== null) setResultSecond(selectedSecond);
    const hotCount = selected.filter((number) => (frequency.get(number) ?? 0) >= 3).length;
    const coldCount = selected.filter((number) => (lastSeen.get(number) ?? historyData.length) >= Math.max(5, historyData.length - 4)).length;
    const evenCount = config.mainCount - oddTarget;
    if (strategy === 'hot') setRecommendation(`包含 ${hotCount} 個熱門號、奇偶比 ${oddTarget}:${evenCount}`);
    else if (strategy === 'cold') setRecommendation(`包含 ${coldCount} 個冷門回補號、已避開 ${blockedNumbers.size} 個排除號`);
    else if (strategy === 'golden') setRecommendation(`黃金和值 ${selected.reduce((total, number) => total + number, 0)}、奇偶比 ${oddTarget}:${evenCount}`);
    else setRecommendation(`符合全部篩選條件、奇偶比 ${oddTarget}:${evenCount}`);

    const sumValue = selected.reduce((total, number) => total + number, 0);
    const oddCount = selected.filter((number) => number % 2 === 1).length;
    const record: SavedRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lotteryType,
      lotteryLabel: config.label,
      numbers: selected,
      secondNumber: selectedSecond,
      sum: sumValue,
      oddEven: `${oddCount}:${config.mainCount - oddCount}`,
      strategy,
      createdAt: Date.now(),
    };
    setRecords((current) => {
      const updated = [record, ...current].slice(0, RECORDS_LIMIT);
      saveRecords(updated);
      return updated;
    });
  };

  const copyResult = async () => {
    const text = config.hasSecondArea
      ? `${result.map(pad).join('、')} ｜ 第二區 ${pad(resultSecond)}`
      : result.map(pad).join('、');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const checkLatest = async () => {
    setChecking(true);
    setChecked(false);
    await refreshHistory(lotteryType, true);
    setChecking(false);
  };

  const toggleExcluded = (number: number) => {
    if (autoExcludeRecent && recentNumbers.includes(number)) return;
    setExcluded((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number]);
  };

  const toggleExcludedSecond = (number: number) => {
    setExcludedSecond((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number]);
  };

  const recordCopyText = (record: SavedRecord) =>
    record.secondNumber !== null ? `${record.numbers.map(pad).join('、')} ｜ 第二區 ${pad(record.secondNumber)}` : record.numbers.map(pad).join('、');

  const copyRecord = async (record: SavedRecord) => {
    await navigator.clipboard.writeText(recordCopyText(record));
    setCopiedRecordId(record.id);
    window.setTimeout(() => setCopiedRecordId((current) => (current === record.id ? null : current)), 1800);
  };

  const deleteRecord = (id: string) => {
    setRecords((current) => {
      const updated = current.filter((item) => item.id !== id);
      saveRecords(updated);
      return updated;
    });
  };

  const clearAllRecords = () => {
    setRecords([]);
    saveRecords([]);
    setCheckResults({});
    setCheckSummary(null);
  };

  const exportRecords = () => {
    const lines: string[] = [];
    lines.push('好運選號 - 選號記錄匯出');
    lines.push(`匯出時間：${formatRecordTime(Date.now())}`);
    lines.push(`共 ${records.length} 筆記錄`);
    lines.push('='.repeat(40));
    records.forEach((record, index) => {
      const numbersText = record.secondNumber !== null
        ? `${record.numbers.map(pad).join('、')} ｜ 第二區 ${pad(record.secondNumber)}`
        : record.numbers.map(pad).join('、');
      lines.push(`[${index + 1}] ${record.lotteryLabel} | ${formatRecordTime(record.createdAt)}`);
      lines.push(`  號碼：${numbersText}`);
      lines.push(`  和值：${record.sum} | 奇偶：${record.oddEven} | 策略：${strategyLabel[record.strategy]}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `好運選號-記錄-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runAutoCheck = async () => {
    if (records.length === 0) return;
    setIsCheckingPrize(true);
    setCheckSummary(null);
    const latestByType: Partial<Record<LotteryType, Draw>> = {};
    let usedFallback = false;
    try {
      const latest = await fetchLatestLottery();
      saveLotteryCache(latest);
      latestByType.lotto649 = latest.lotto649[0];
      latestByType.superlotto = latest.superlotto[0];
      latestByType.daily539 = latest.daily539[0];
    } catch {
      usedFallback = true;
      const cached = loadLotteryCache();
      if (cached) {
        latestByType.lotto649 = cached.lotto649[0];
        latestByType.superlotto = cached.superlotto[0];
        latestByType.daily539 = cached.daily539[0];
      } else {
        latestByType.lotto649 = lotto649History[0];
        latestByType.superlotto = superlottoHistory[0];
        latestByType.daily539 = daily539History[0];
      }
    }
    const results: Record<string, PrizeResult> = {};
    let winCount = 0;
    records.forEach((record) => {
      const result = checkPrize(record, latestByType[record.lotteryType]);
      results[record.id] = result;
      if (result.status === 'win') winCount += 1;
    });
    setCheckResults(results);
    setCheckSummary(
      usedFallback
        ? `本次共比對 ${records.length} 組，恭喜中獎 ${winCount} 組（使用離線資料）`
        : `本次共比對 ${records.length} 組，恭喜中獎 ${winCount} 組！`,
    );
    setIsCheckingPrize(false);
  };

  const applyHotNumbers = (numbers: number[]) => {
    setResult(numbers);
    if (config.hasSecondArea) {
      const hotSecond = historyData
        .flatMap((draw) => draw.special > 0 ? [draw.special] : [])
        .sort((a, b) => {
          const ca = historyData.filter((d) => d.special === a).length;
          const cb = historyData.filter((d) => d.special === b).length;
          return cb - ca;
        })[0];
      setResultSecond(hotSecond ?? 1);
    }
    setRecommendation(`已帶入近 30 期最熱門的 ${numbers.length} 個號碼，可點擊「生成選號」重新組合`);
  };

  const hotTopNumbers = useMemo(() => {
    const counts = new Map<number, number>();
    for (let n = 1; n <= config.mainMax; n += 1) counts.set(n, 0);
    historyData.forEach((draw) => draw.numbers.forEach((num) => counts.set(num, (counts.get(num) ?? 0) + 1)));
    return Array.from(counts.entries())
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count || a.number - b.number)
      .slice(0, config.mainCount)
      .map((item) => item.number)
      .sort((a, b) => a - b);
  }, [historyData, config.mainMax, config.mainCount]);

  const handleApplyHot = () => applyHotNumbers(hotTopNumbers);

  const visibleHistory = showAll ? historyData : historyData.slice(0, 8);
  const resultSum = result.reduce((total, number) => total + number, 0);
  const resultOdd = result.filter((number) => number % 2 === 1).length;
  const resultEven = result.length - resultOdd;
  const sumGap = config.sumMax - config.sumMin;

  const nextDraw = useMemo(() => getNextDraw(lotteryType, now), [lotteryType, now]);
  const timeRemaining = useMemo(() => {
    const diff = Math.max(0, nextDraw.date.getTime() - now.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  }, [nextDraw, now]);

  return (
    <div className="app-shell min-h-screen text-stone-100">
      <header className="topbar">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="brand-mark"><Coins size={25} strokeWidth={2.2} /></div>
            <div><div className="brand-name">80歲少女之好運選號</div><div className="brand-subtitle">福氣加持 ‧ 喜迎頭獎</div></div>
          </div>
          <nav className="lotto-tabs">
            {(Object.keys(LOTTERY_CONFIGS) as LotteryType[]).map((type) => (
              <button key={type} onClick={() => { switchLottery(type); setView('generator'); }} className={`lotto-tab ${type === lotteryType && view === 'generator' ? 'active' : ''}`}>{LOTTERY_CONFIGS[type].label}</button>
            ))}
            <button onClick={() => setView('records')} className={`lotto-tab records-tab ${view === 'records' ? 'active' : ''}`}><History size={15} /> 選號記錄</button>
          </nav>
          <div className="header-notice"><span className="header-notice-dot" />個人記錄自動儲存中</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        {view === 'generator' ? (
          <>
        <section className="hero-banner panel-frame mb-6 overflow-hidden rounded-2xl px-6 py-7 text-center sm:px-12">
          <div className="ornament ornament-left">卍</div><div className="ornament ornament-right">卍</div>
          <div className="relative z-10"><div className="hero-kicker"><Sparkles size={15} /> 每一次選號，都是好運的開始 <Sparkles size={15} /></div><h1>{config.title}</h1><p>{config.subtitle}</p></div>
        </section>

        <section className={`countdown-dashboard panel-frame rounded-2xl ${nextDraw.isToday ? 'draw-today' : ''}`}>
          <div className="countdown-left">
            <div className="countdown-eyebrow"><Timer size={14} /> NEXT DRAW</div>
            <div className="countdown-lottery-name">{config.label}</div>
            <div className="countdown-date">下期開獎：{nextDraw.drawDateLabel} {nextDraw.drawTimeLabel}</div>
            <div className="countdown-jackpot">預估頭獎 <strong>{ESTIMATED_JACKPOT[lotteryType]}</strong></div>
          </div>
          <div className="countdown-right">
            {nextDraw.isToday ? (
              <div className="countdown-today-badge">🔥 今日開獎日！快抓緊時間選號</div>
            ) : (
              <div className="countdown-timer-label">距離開獎還有</div>
            )}
            <div className="countdown-timer">
              <div className="time-unit"><span className="time-value">{pad(timeRemaining.hours)}</span><small>小時</small></div>
              <span className="time-colon">:</span>
              <div className="time-unit"><span className="time-value">{pad(timeRemaining.minutes)}</span><small>分鐘</small></div>
              <span className="time-colon">:</span>
              <div className="time-unit"><span className="time-value">{pad(timeRemaining.seconds)}</span><small>秒</small></div>
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          <aside className="filter-card panel-frame rounded-2xl p-5 sm:p-6">
            <div className="section-heading"><div><span className="eyebrow">SMART FILTER</span><h2>選號條件設定</h2></div><div className="heading-seal"><Zap size={16} /></div></div>
            <div className="filter-section">
              <div className="label-row"><label>{config.hasSecondArea ? '第一區排除號碼' : '排除號碼'}</label><span className="muted">已排除 {blockedNumbers.size} 個</span></div>
              <div className="number-grid">{Array.from({ length: config.mainMax }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => toggleExcluded(number)} className={`number-toggle ${blockedNumbers.has(number) ? 'excluded' : ''} ${autoExcludeRecent && recentNumbers.includes(number) ? 'recent-excluded' : ''}`}>{pad(number)}{blockedNumbers.has(number) && <span className="strike" />}</button>)}</div>
              {config.hasSecondArea && (
                <>
                  <div className="label-row second-area-label"><label>第二區排除號碼</label><span className="muted">已排除 {excludedSecond.length} 個</span></div>
                  <div className="number-grid second-grid">{Array.from({ length: config.secondMax }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => toggleExcludedSecond(number)} className={`number-toggle ${excludedSecond.includes(number) ? 'excluded' : ''}`}>{pad(number)}{excludedSecond.includes(number) && <span className="strike" />}</button>)}</div>
                </>
              )}
              <label className="auto-exclude"><input type="checkbox" checked={autoExcludeRecent} onChange={(event) => setAutoExcludeRecent(event.target.checked)} /><span className="switch-track" /><span>自動排除前兩期號碼</span></label>
              <div className="pool-status">目前候選號碼池 <strong>{availableNumbers.length}</strong> / {config.mainMax}{config.hasSecondArea ? ` ｜ 第二區 ${availableSecond.length} / ${config.secondMax}` : ''}</div>
              <div className="hint">點擊號碼即可加入或取消排除</div>
            </div>
            <div className="filter-section">
              <div className="label-row"><label>和值區間</label><span className="value-pill">{sumRange[0]} — {sumRange[1]}</span></div>
              <div className="range-wrap"><input aria-label="和值下限" type="range" min={config.sumMin} max={config.sumMax} value={sumRange[0]} onChange={(event) => setSumRange(([_, high]) => [Math.min(Number(event.target.value), high - Math.max(2, Math.floor(sumGap * 0.03))), high])} /><input aria-label="和值上限" type="range" min={config.sumMin} max={config.sumMax} value={sumRange[1]} onChange={(event) => setSumRange(([low]) => [low, Math.max(Number(event.target.value), low + Math.max(2, Math.floor(sumGap * 0.03)))])} /></div>
              <div className="range-labels"><span>{config.sumMin}</span><span>{config.sumMax}</span></div>
            </div>
            <div className="filter-section"><div className="label-row"><label>奇偶數比例</label><span className="muted">奇數 : 偶數</span></div><div className="segmented">{ratioOptions.map((option) => <button key={option} onClick={() => setRatio(option)} className={ratio === option ? 'selected' : ''}>{option}</button>)}</div></div>
            <div className="filter-section last"><div className="label-row"><label>連號上限</label><span className="value-pill">最多 {maxStreak} 個</span></div><div className="streak-options">{[1, 2, 3, 4].map((number) => <button key={number} onClick={() => setMaxStreak(number)} className={maxStreak === number ? 'selected' : ''}>{number}</button>)}</div></div>
          </aside>

          <section className="generator-column">
            <div className="generator-intro"><span className="eyebrow">YOUR LUCKY NUMBERS</span><h2>準備好迎接好運了嗎？</h2><p>依照左側條件，為你挑出專屬幸運組合</p></div>
            <div className="strategy-panel"><div className="strategy-title"><div><span className="eyebrow">SMART MODE</span><h3>智慧選號模式</h3></div><button className="hot-apply-mini" onClick={handleApplyHot}><Flame size={14} />一鍵帶入熱門號</button></div><div className="strategy-tabs">{strategyOptions.map((option) => <button key={option.id} onClick={() => setStrategy(option.id)} className={strategy === option.id ? 'selected' : ''}><span className="strategy-icon">{option.icon}</span><span className="strategy-label">{option.label}</span><small>{option.description}</small></button>)}</div></div>
            <button className="generate-button" onClick={generateNumbers}><span className="button-spark">✦</span>生成選號<span className="button-spark">✦</span></button>
            <div className="result-card panel-frame rounded-2xl p-6 sm:p-8"><div className="result-header"><div><span className="eyebrow">LUCKY PICK · 01</span><h3>你的幸運號碼</h3></div><button className="copy-button" onClick={copyResult}>{copied ? <Check size={18} /> : <Copy size={18} />}<span>{copied ? '已複製' : '複製號碼'}</span></button></div>
              <div className="balls">
                {result.map((number) => <span className="lotto-ball" key={number}>{pad(number)}</span>)}
                {config.hasSecondArea && <span className="lotto-ball second-ball" key={resultSecond}>{pad(resultSecond)}</span>}
              </div>
              <div className="result-meta">
                <span>和值 <strong>{resultSum}</strong></span>
                <span>奇偶 <strong>{resultOdd} : {resultEven}</strong></span>
                {config.hasSecondArea && <span>第二區 <strong>{pad(resultSecond)}</strong></span>}
                <span className="meta-good"><Trophy size={14} /> 條件符合</span>
              </div>
              <div className="recommendation"><Sparkles size={15} /><span><b>推薦理由</b>{recommendation}</span></div>
            </div>
            <div className="tip-card"><Sparkles size={18} /><p>小提醒：號碼組合僅供娛樂參考，保持平常心，享受選號的樂趣！</p></div>
            <button className="coffee-btn" onClick={() => setCoffeeModalOpen(true)}><Coffee size={20} /> 請 80 歲少女喝杯咖啡 ☕（好運加持）</button>
          </section>

          <section className="history-card panel-frame rounded-2xl p-5 sm:p-6"><div className="history-heading"><div><span className="eyebrow">LATEST RESULTS</span><h2>{config.label} 近期開獎紀錄</h2></div><button className={`refresh-button ${checking ? 'spinning' : ''}`} onClick={checkLatest}><RefreshCw size={16} />{checking ? '檢查中' : '檢查最新開獎'}</button></div>{checked && <div className={`checked-message ${isOffline ? 'offline-message' : ''}`}><Check size={15} />{isOffline ? '目前為離線歷史資料' : '已載入最新歷史資料'}</div>}<div className="history-table-wrap"><table><thead><tr><th>期別</th><th>日期</th><th>開獎號碼</th>{config.hasSpecial && <th>{config.specialLabel}</th>}</tr></thead><tbody>{visibleHistory.map((draw) => <tr key={draw.period}><td className="period">{draw.period}</td><td>{draw.date.slice(5)}</td><td><div className="mini-balls">{draw.numbers.map((number) => <span key={number}>{pad(number)}</span>)}</div></td>{config.hasSpecial && <td><span className="special-ball">{pad(draw.special)}</span></td>}</tr>)}</tbody></table></div><button className="show-more" onClick={() => setShowAll((current) => !current)}>{showAll ? '收起紀錄' : `查看完整 ${historyData.length} 期`}<ChevronDown size={16} className={showAll ? 'rotate-180' : ''} /></button></section>
        </div>

        <LotteryStats historyData={historyData} config={config} currentNumbers={result} />
          </>
        ) : (
          <section className="records-page">
            <div className="records-header">
              <div><span className="eyebrow">SAVED PICKS</span><h2>選號記錄</h2><p className="records-subtitle">共 {records.length} 筆儲存的幸運組合</p></div>
              {records.length > 0 && (
                <div className="records-actions">
                  <button className={`auto-check-button ${isCheckingPrize ? 'spinning' : ''}`} onClick={runAutoCheck} disabled={isCheckingPrize}><Target size={16} /> {isCheckingPrize ? '對獎中' : '🎯 一鍵自動對獎'}</button>
                  <button className="export-button" onClick={exportRecords}><Download size={16} /> 匯出選號記錄</button>
                  <button className="clear-all-button" onClick={clearAllRecords}><Trash2 size={16} /> 清空所有歷史紀錄</button>
                </div>
              )}
            </div>
            {checkSummary && <div className="check-summary"><Award size={18} /> {checkSummary}</div>}
            {records.length === 0 ? (
              <div className="records-empty panel-frame rounded-2xl">
                <Sparkles size={40} />
                <h3>目前尚無選號記錄</h3>
                <p>快去生成你的第一組幸運號碼吧！</p>
                <button className="goto-generator-button" onClick={() => setView('generator')}>前往生成選號</button>
              </div>
            ) : (
              <div className="records-list">
                {records.map((record) => (
                  <div key={record.id} className="record-card panel-frame rounded-2xl">
                    <div className="record-card-top">
                      <span className="record-lottery-tag">{record.lotteryLabel}</span>
                      {checkResults[record.id] ? (
                        <span className={`status-badge status-${checkResults[record.id].status}`}>{checkResults[record.id].statusLabel}</span>
                      ) : (
                        <span className="record-time">{formatRecordTime(record.createdAt)}</span>
                      )}
                    </div>
                    <div className="balls">
                      {record.numbers.map((number, index) => <span className={`lotto-ball ${checkResults[record.id]?.matchedSet.has(number) ? 'ball-hit' : ''}`} key={`${record.id}-${index}`}>{pad(number)}</span>)}
                      {record.secondNumber !== null && <span className={`lotto-ball second-ball ${checkResults[record.id]?.specialHit ? 'ball-hit' : ''}`} key={`${record.id}-second`}>{pad(record.secondNumber)}</span>}
                    </div>
                    <div className="result-meta">
                      <span>和值 <strong>{record.sum}</strong></span>
                      <span>奇偶 <strong>{record.oddEven}</strong></span>
                      <span>策略 <strong>{strategyLabel[record.strategy]}</strong></span>
                    </div>
                    <div className="record-actions">
                      <button className="copy-button" onClick={() => copyRecord(record)}>
                        {copiedRecordId === record.id ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedRecordId === record.id ? '已複製' : '一鍵複製號碼'}</span>
                      </button>
                      <button className="delete-record-button" onClick={() => deleteRecord(record.id)}>
                        <Trash2 size={16} /><span>刪除這筆紀錄</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <footer><span>© 2026 80歲少女之好運選號</span><span>理性投注．量力而為</span></footer>

      <button className="coffee-fab" onClick={() => setCoffeeModalOpen(true)} aria-label="請喝咖啡"><Coffee size={26} /></button>

      {coffeeModalOpen && (
        <div className="coffee-overlay" onClick={() => setCoffeeModalOpen(false)}>
          <div className="coffee-modal" onClick={(e) => e.stopPropagation()}>
            <button className="coffee-modal-close" onClick={() => setCoffeeModalOpen(false)}><X size={20} /></button>
            <div className="coffee-modal-icon"><Coffee size={40} /></div>
            <h3>請 80 歲少女喝杯咖啡</h3>
            <p>感謝您使用好運選號！<br />如果您覺得實用，一杯咖啡的鼓勵<br />就是 80 歲少女最大的福氣加持 ☕✨</p>
            <a href="https://buymeacoffee.com/mama80" target="_blank" rel="noopener noreferrer" className="coffee-modal-btn">
              <Heart size={18} /> 前去贊助 Buy Me a Coffee
            </a>
            <span className="coffee-modal-hint">點擊後將於新分頁開啟贊助頁面</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
