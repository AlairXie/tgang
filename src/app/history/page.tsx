'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Calendar } from '@/components/Calendar';
import { StatsChart } from '@/components/StatsChart';
import { calcStats, loadRecords } from '@/lib/storage';
import type { SessionRecord } from '@/lib/types';

export default function HistoryPage() {
  const [records, setRecords] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const stats = useMemo(() => calcStats(records), [records]);
  const byDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of records) m.set(r.date, (m.get(r.date) ?? 0) + 1);
    return m;
  }, [records]);

  const recent = [...records].sort((a, b) => b.completedAt - a.completedAt).slice(0, 12);

  return (
    <main className="min-h-screen pb-24">
      <Header />
      <section className="mx-auto max-w-6xl px-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="pill">坚持的力量</span>
          <h1 className="display mt-4 text-5xl text-ink-900">打卡 & 统计</h1>
          <p className="mt-2 text-ink-700">
            训练记录全部保存在你本地浏览器，不会上传任何服务器。
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          <Stat label="连续打卡" value={`${stats.streak}天`} accent="moss" />
          <Stat label="累计天数" value={`${stats.daysActive}天`} accent="clay" />
          <Stat label="累计次数" value={`${stats.totalSessions}次`} accent="moss" />
          <Stat label="总时长" value={`${stats.totalMinutes}分钟`} accent="coral" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Calendar byDate={byDate} months={6} />
          <StatsChart records={records} days={14} />
        </div>

        <div className="mt-8 card relative p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
            最近训练
          </div>
          {recent.length === 0 ? (
            <div className="mt-6 text-center text-ink-500">
              还没有训练记录哦，去
              <Link href="/" className="text-moss-600 underline mx-1">
                课程库
              </Link>
              选一节课开始吧。
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-ink-900/5">
              {recent.map((r) => (
                <li
                  key={r.completedAt}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="display text-lg text-ink-900">
                      {r.courseName}
                    </div>
                    <div className="text-xs uppercase tracking-[0.18em] text-ink-500">
                      {new Date(r.completedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right text-sm text-ink-700">
                    <div>{Math.round(r.durationSec / 60)} 分钟</div>
                    {typeof r.avgPostureScore === 'number' && (
                      <div className="text-xs text-ink-500">
                        姿势分 {r.avgPostureScore}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'moss' | 'clay' | 'coral';
}) {
  const tone =
    accent === 'moss'
      ? 'from-moss-200 to-moss-400'
      : accent === 'clay'
      ? 'from-clay-200 to-clay-400'
      : 'from-coral-400 to-coral-600';
  return (
    <div className="card grain relative overflow-hidden p-6">
      <div
        className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${tone} opacity-50 blur-2xl`}
      />
      <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
        {label}
      </div>
      <div className="display mt-2 text-4xl text-ink-900">{value}</div>
    </div>
  );
}
