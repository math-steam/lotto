import { useMemo } from 'react';
import { BarChart3, Flame, Hash, Layers, Snowflake, Sparkles, TrendingUp } from 'lucide-react';
import type { Draw, LotteryConfig } from '@/App';

type LotteryStatsProps = {
  historyData: Draw[];
  config: LotteryConfig;
  onApplyHot: (numbers: number[]) => void;
  currentNumbers: number[];
};

type NumberStat = { number: number; count: number };
type PatternStat = { code: string; breakdown: string; description: string; count: number; pct: number };
type OddEvenStat = { label: string; odd: number; even: number; count: number; pct: number };

function computeFrequency(draws: Draw[], max: number): Map<number, number> {
  const counts = new Map<number, number>();
  for (let n = 1; n <= max; n += 1) counts.set(n, 0);
  draws.forEach((draw) => draw.numbers.forEach((number) => counts.set(number, (counts.get(number) ?? 0) + 1)));
  return counts;
}

function buildZoneBounds(mainMax: number): { min: number; max: number }[] {
  if (mainMax <= 39) {
    return [
      { min: 1, max: 9 },
      { min: 10, max: 19 },
      { min: 20, max: 29 },
      { min: 30, max: 39 },
    ];
  }
  return [
    { min: 1, max: 9 },
    { min: 10, max: 19 },
    { min: 20, max: 29 },
    { min: 30, max: 39 },
    { min: 40, max: 49 },
  ];
}

const ZONE_COLORS = ['#ff6b4a', '#f0a040', '#e8c679', '#6bb6ff', '#a06bd0'];

function computeZonePattern(numbers: number[], zoneBounds: { min: number; max: number }[]): string {
  const counts = zoneBounds.map((zone) => numbers.filter((n) => n >= zone.min && n <= zone.max).length);
  return counts.sort((a, b) => b - a).join('');
}

function describePattern(sortedCounts: number[]): string {
  const groups = new Map<number, number>();
  sortedCounts.forEach((c) => groups.set(c, (groups.get(c) ?? 0) + 1));
  const parts = Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([count, zones]) => `${zones} 個區${count > 0 ? `各 ${count} 顆` : '掛零'}`);
  return parts.join('、');
}

export default function LotteryStats({ historyData, config, onApplyHot, currentNumbers }: LotteryStatsProps) {
  const stats = useMemo(() => {
    const freq = computeFrequency(historyData, config.mainMax);
    const allEntries: NumberStat[] = Array.from(freq.entries())
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count || a.number - b.number);

    const hotTop6 = allEntries.slice(0, 6);
    const coldTop6 = [...allEntries].sort((a, b) => a.count - b.count || a.number - b.number).slice(0, 6);

    let oddTotal = 0;
    let evenTotal = 0;
    let smallTotal = 0;
    let bigTotal = 0;
    const median = Math.ceil(config.mainMax / 2);
    const oddEvenCounts = new Map<string, number>();
    const sizeCounts = new Map<string, number>();

    const sums: number[] = [];
    historyData.forEach((draw) => {
      sums.push(draw.numbers.reduce((total, number) => total + number, 0));
      const oddCount = draw.numbers.filter((n) => n % 2 === 1).length;
      const evenCount = draw.numbers.length - oddCount;
      oddTotal += oddCount;
      evenTotal += evenCount;
      const smallCount = draw.numbers.filter((n) => n <= median).length;
      const bigCount = draw.numbers.length - smallCount;
      smallTotal += smallCount;
      bigTotal += bigCount;
      const oeKey = `${oddCount}:${evenCount}`;
      oddEvenCounts.set(oeKey, (oddEvenCounts.get(oeKey) ?? 0) + 1);
      const sbKey = `${smallCount}:${bigCount}`;
      sizeCounts.set(sbKey, (sizeCounts.get(sbKey) ?? 0) + 1);
    });

    const totalDrawn = oddTotal + evenTotal || 1;
    const totalDraws = historyData.length || 1;
    const oddEvenStats: OddEvenStat[] = Array.from(oddEvenCounts.entries())
      .map(([key, count]) => {
        const [odd, even] = key.split(':').map(Number);
        return { label: `${odd}奇${even}偶`, odd, even, count, pct: Math.round((count / totalDraws) * 100) };
      })
      .sort((a, b) => b.count - a.count || b.odd - a.odd);
    const sizeStats: OddEvenStat[] = Array.from(sizeCounts.entries())
      .map(([key, count]) => {
        const [small, big] = key.split(':').map(Number);
        return { label: `${small}小${big}大`, odd: small, even: big, count, pct: Math.round((count / totalDraws) * 100) };
      })
      .sort((a, b) => b.count - a.count || b.odd - a.odd);
    const maxOddEvenCount = oddEvenStats[0]?.count || 1;
    const maxSizeCount = sizeStats[0]?.count || 1;

    const maxCount = hotTop6[0]?.count || 1;

    const sumAvg = sums.length > 0 ? Math.round(sums.reduce((a, b) => a + b, 0) / sums.length) : 0;
    const sumMax = sums.length > 0 ? Math.max(...sums) : 0;
    const sumMin = sums.length > 0 ? Math.min(...sums) : 0;

    const zoneBounds = buildZoneBounds(config.mainMax);
    const patternCounts = new Map<string, number>();
    historyData.forEach((draw) => {
      const pattern = computeZonePattern(draw.numbers, zoneBounds);
      patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
    });
    const totalPatterns = historyData.length || 1;
    const patternStats: PatternStat[] = Array.from(patternCounts.entries())
      .map(([code, count]) => {
        const digits = code.split('').map(Number);
        return {
          code,
          breakdown: digits.join('-'),
          description: describePattern(digits),
          count,
          pct: Math.round((count / totalPatterns) * 100),
        };
      })
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
      .slice(0, 5);
    const maxPatternCount = patternStats[0]?.count || 1;

    return { hotTop6, coldTop6, oddEvenStats, sizeStats, maxOddEvenCount, maxSizeCount, median, maxCount, freq, sumAvg, sumMax, sumMin, patternStats, maxPatternCount, zoneBounds };
  }, [historyData, config.mainMax]);

  const currentSum = currentNumbers.reduce((total, number) => total + number, 0);
  const inGoldenRange = currentSum >= config.sumDefault[0] && currentSum <= config.sumDefault[1];

  const handleApplyHot = () => {
    const hotNumbers = stats.hotTop6.map((item) => item.number).sort((a, b) => a - b);
    onApplyHot(hotNumbers);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="stats-card panel-frame rounded-2xl p-5 sm:p-6">
      <div className="stats-heading">
        <div>
          <span className="eyebrow">STATISTICS</span>
          <h2>{config.label} 近 30 期統計分析</h2>
        </div>
        <div className="stats-heading-icon"><BarChart3 size={16} /></div>
      </div>

      <div className="stats-grid">
        <div className="stats-sub-card">
          <div className="stats-sub-header"><Flame size={16} className="stats-hot-icon" /><h3>熱門號碼 TOP 6</h3></div>
          <div className="stats-number-list">
            {stats.hotTop6.map((item, index) => (
              <div key={item.number} className="stats-number-row">
                <span className={`stats-rank rank-${index + 1}`}>{index + 1}</span>
                <span className="stats-number-ball hot-ball">{pad(item.number)}</span>
                <div className="stats-bar-wrap">
                  <div className="stats-bar hot-bar" style={{ width: `${(item.count / stats.maxCount) * 100}%` }} />
                </div>
                <span className="stats-count">{item.count} 次</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-sub-card">
          <div className="stats-sub-header"><Snowflake size={16} className="stats-cold-icon" /><h3>冷門號碼 TOP 6</h3></div>
          <div className="stats-number-list">
            {stats.coldTop6.map((item, index) => (
              <div key={item.number} className="stats-number-row">
                <span className={`stats-rank rank-cold-${index + 1}`}>{index + 1}</span>
                <span className="stats-number-ball cold-ball">{pad(item.number)}</span>
                <div className="stats-bar-wrap">
                  <div className="stats-bar cold-bar" style={{ width: `${Math.max(8, (item.count / stats.maxCount) * 100)}%` }} />
                </div>
                <span className="stats-count">{item.count} 次</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-sub-card stats-ratio-card">
          <div className="stats-sub-header"><TrendingUp size={16} className="stats-ratio-icon" /><h3>奇偶比結構型態</h3></div>
          <div className="stats-ratio-list">
            {stats.oddEvenStats.map((item) => (
              <div key={item.label} className="stats-ratio-row">
                <span className={`stats-ratio-tag ${item.odd >= item.even ? 'odd-heavy' : 'even-heavy'}`}>{item.label}</span>
                <div className="stats-ratio-bar-wrap">
                  <div className={`stats-ratio-bar ${item.odd >= item.even ? 'odd-bar' : 'even-bar'}`} style={{ width: `${(item.count / stats.maxOddEvenCount) * 100}%` }} />
                </div>
                <span className="stats-ratio-count">{item.count} 次</span>
                <span className="stats-ratio-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
          <div className="stats-sub-header" style={{ marginTop: '18px' }}><TrendingUp size={16} className="stats-ratio-icon" /><h3>大小比結構型態</h3></div>
          <div className="stats-ratio-list">
            {stats.sizeStats.map((item) => (
              <div key={item.label} className="stats-ratio-row">
                <span className={`stats-ratio-tag ${item.odd >= item.even ? 'small-heavy' : 'big-heavy'}`}>{item.label}</span>
                <div className="stats-ratio-bar-wrap">
                  <div className={`stats-ratio-bar ${item.odd >= item.even ? 'small-bar' : 'big-bar'}`} style={{ width: `${(item.count / stats.maxSizeCount) * 100}%` }} />
                </div>
                <span className="stats-ratio-count">{item.count} 次</span>
                <span className="stats-ratio-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid stats-grid-second">
        <div className="stats-sub-card stats-sum-card">
          <div className="stats-sub-header"><Hash size={16} className="stats-sum-icon" /><h3>總和值統計</h3></div>
          <div className="stats-sum-grid">
            <div className="stats-sum-item">
              <span className="stats-sum-label">平均總和</span>
              <span className="stats-sum-value">{stats.sumAvg}</span>
            </div>
            <div className="stats-sum-item">
              <span className="stats-sum-label">最高總和</span>
              <span className="stats-sum-value sum-high">{stats.sumMax}</span>
            </div>
            <div className="stats-sum-item">
              <span className="stats-sum-label">最低總和</span>
              <span className="stats-sum-value sum-low">{stats.sumMin}</span>
            </div>
          </div>
          <div className="stats-sum-current">
            <div className="stats-sum-current-row">
              <span className="stats-sum-current-label">目前選號總和</span>
              <span className={`stats-sum-current-value ${inGoldenRange ? 'in-range' : 'out-range'}`}>{currentSum}</span>
            </div>
            <div className="stats-sum-range-bar">
              <div className="stats-sum-range-track">
                <div className="stats-sum-range-golden" style={{ left: `${((config.sumDefault[0] - config.sumMin) / (config.sumMax - config.sumMin)) * 100}%`, width: `${((config.sumDefault[1] - config.sumDefault[0]) / (config.sumMax - config.sumMin)) * 100}%` }} />
                <div className="stats-sum-range-marker" style={{ left: `${Math.min(100, Math.max(0, ((currentSum - config.sumMin) / (config.sumMax - config.sumMin)) * 100))}%` }} />
              </div>
              <div className="stats-sum-range-labels">
                <span>{config.sumMin}</span>
                <span className="stats-golden-label">黃金區間 {config.sumDefault[0]}–{config.sumDefault[1]}</span>
                <span>{config.sumMax}</span>
              </div>
            </div>
            <div className={`stats-sum-badge ${inGoldenRange ? 'badge-in' : 'badge-out'}`}>
              {inGoldenRange ? '✓ 落在黃金建議區間內' : '✗ 未落在黃金建議區間'}
            </div>
          </div>
        </div>

        <div className="stats-sub-card stats-zone-card">
          <div className="stats-sub-header"><Layers size={16} className="stats-zone-icon" /><h3>近 30 期區間型態熱門排名</h3><button className="stats-apply-mini" onClick={handleApplyHot}><Sparkles size={14} />帶入熱門號</button></div>
          <div className="stats-zone-hint">
            {stats.zoneBounds.map((zone, index) => (
              <span key={index} className="stats-zone-tag" style={{ color: ZONE_COLORS[index] }}>
                {String(zone.min).padStart(2, '0')}–{String(zone.max).padStart(2, '0')}
              </span>
            ))}
          </div>
          <div className="stats-pattern-list">
            {stats.patternStats.map((pattern, index) => (
              <div key={pattern.code} className="stats-pattern-row">
                <span className={`stats-rank rank-${index + 1}`}>{index + 1}</span>
                <div className="stats-pattern-code-wrap">
                  <span className="stats-pattern-code">{pattern.breakdown}</span>
                  <span className="stats-pattern-breakdown">{pattern.description}</span>
                </div>
                <div className="stats-pattern-bar-wrap">
                  <div className="stats-pattern-bar" style={{ width: `${(pattern.count / stats.maxPatternCount) * 100}%`, background: `linear-gradient(90deg, ${ZONE_COLORS[index % ZONE_COLORS.length]}aa, ${ZONE_COLORS[index % ZONE_COLORS.length]})` }} />
                </div>
                <span className="stats-zone-count">{pattern.count} 次</span>
                <span className="stats-zone-pct">{pattern.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
