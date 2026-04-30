'use client';

import { useMemo } from 'react';

interface Props {
  /** ISO 日期 → 当天训练次数 */
  byDate: Map<string, number>;
  /** 显示几个月，默认 3（含本月） */
  months?: number;
}

/**
 * GitHub-style 打卡热力日历。
 * 周一为列首，每列一周，自左向右展开。
 */
export function Calendar({ byDate, months = 3 }: Props) {
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    // 把 start 对齐到周一
    const day = start.getDay();
    const offset = (day + 6) % 7; // 周一=0
    start.setDate(start.getDate() - offset);

    const out: { iso: string; count: number; isToday: boolean; inFuture: boolean; label: string }[] = [];
    const cur = new Date(start);
    while (cur <= addDays(today, 6 - ((today.getDay() + 6) % 7))) {
      const iso = isoOf(cur);
      out.push({
        iso,
        count: byDate.get(iso) ?? 0,
        isToday: iso === isoOf(today),
        inFuture: cur > today,
        label: `${cur.getMonth() + 1}/${cur.getDate()}`,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [byDate, months]);

  return (
    <div className="card relative p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
            打卡日历
          </div>
          <div className="display mt-1 text-2xl text-ink-900">
            最近 {months} 个月
          </div>
        </div>
        <Legend />
      </div>

      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
        {cells.map((c) => (
          <div
            key={c.iso}
            title={`${c.label} · ${c.count} 次`}
            className={[
              'h-4 w-4 rounded-[3px] transition',
              c.inFuture
                ? 'bg-ink-900/5'
                : c.count === 0
                ? 'bg-ink-900/8 hover:bg-ink-900/15'
                : c.count === 1
                ? 'bg-moss-200'
                : c.count === 2
                ? 'bg-moss-300'
                : c.count === 3
                ? 'bg-moss-400'
                : 'bg-moss-600',
              c.isToday ? 'ring-2 ring-coral-500/70' : '',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-ink-500">
      <span>少</span>
      {['bg-ink-900/8', 'bg-moss-200', 'bg-moss-300', 'bg-moss-400', 'bg-moss-600'].map((c) => (
        <span key={c} className={`h-3 w-3 rounded-[3px] ${c}`} />
      ))}
      <span>多</span>
    </div>
  );
}

function isoOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
