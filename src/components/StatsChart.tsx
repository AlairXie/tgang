'use client';

import type { SessionRecord } from '@/lib/types';

interface Props {
  records: SessionRecord[];
  days?: number;
}

/**
 * 最近 N 天每日训练时长柱状图（纯 SVG，无依赖）。
 */
export function StatsChart({ records, days = 14 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { iso: string; minutes: number; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
    const minutes = records
      .filter((r) => r.date === iso)
      .reduce((s, r) => s + r.durationSec / 60, 0);
    buckets.push({ iso, minutes, label: `${d.getMonth() + 1}/${d.getDate()}` });
  }

  const max = Math.max(1, ...buckets.map((b) => b.minutes));
  const W = 320;
  const H = 120;
  const barW = W / buckets.length - 4;

  return (
    <div className="card relative p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
        最近 {days} 天训练时长（分钟）
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="mt-3 w-full">
        {buckets.map((b, i) => {
          const h = (b.minutes / max) * H;
          const x = i * (barW + 4) + 2;
          const y = H - h;
          return (
            <g key={b.iso}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={3}
                className="fill-moss-500"
                opacity={b.minutes > 0 ? 1 : 0.18}
              />
              {i % Math.ceil(days / 7) === 0 && (
                <text
                  x={x + barW / 2}
                  y={H + 14}
                  textAnchor="middle"
                  className="fill-ink-500"
                  style={{ fontSize: 9 }}
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
