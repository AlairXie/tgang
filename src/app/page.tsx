'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { CourseCard } from '@/components/CourseCard';
import { Calendar } from '@/components/Calendar';
import { GenderPicker, useStoredGender } from '@/components/GenderPicker';
import { COURSES } from '@/lib/courses';
import {
  calcStats,
  loadRecords,
  todayISO,
} from '@/lib/storage';
import type { SessionRecord, Difficulty } from '@/lib/types';

export default function HomePage() {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [gender, setGender] = useStoredGender();
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const stats = useMemo(() => calcStats(records), [records]);
  const byDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of records) m.set(r.date, (m.get(r.date) ?? 0) + 1);
    return m;
  }, [records]);

  const today = todayISO();
  const trainedToday = (byDate.get(today) ?? 0) > 0;

  const filtered = COURSES.filter(
    (c) =>
      (gender === 'all' || c.gender === 'all' || c.gender === gender) &&
      (diff === 'all' || c.difficulty === diff),
  );

  return (
    <main className="min-h-screen pb-24">
      <Header />

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="grid gap-10 lg:grid-cols-[1.2fr_1fr]"
        >
          <div>
            <span className="pill">傻子也能练对 · 科学盆底肌训练</span>
            <h1 className="display mt-6 text-5xl leading-[1.05] text-ink-900 sm:text-6xl">
              把<span className="italic text-moss-600">看不见</span>
              <br />
              的肌肉，练得<span className="italic text-coral-500">很</span>结实。
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-700">
              呼吸圈引导节奏、人体姿势示范每个动作、语音播报实时陪练。
              开启摄像头，浏览器本地的 MediaPipe Pose 还会帮你校正站坐姿，
              所有计算只在你这台设备上进行。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#courses" className="btn-primary">
                ⌇ 选一节课，立即开始
              </a>
              <a
                href="https://www.nih.gov/health-information"
                target="_blank"
                className="btn-ghost"
                rel="noreferrer"
              >
                了解盆底肌训练
              </a>
            </div>
          </div>

          {/* 仪表盘 */}
          <div className="grid gap-4">
            <div className="card grain relative p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
                今日状态
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div className="display text-4xl text-ink-900">
                  {trainedToday ? '已打卡 ✓' : '尚未训练'}
                </div>
                <div className="text-3xl">{trainedToday ? '🌱' : '🪷'}</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Stat label="连续打卡" value={`${stats.streak}天`} />
                <Stat label="累计训练" value={`${stats.totalSessions}次`} />
                <Stat label="总时长" value={`${stats.totalMinutes}min`} />
              </div>
            </div>

            <Calendar byDate={byDate} months={3} />
          </div>
        </motion.div>
      </section>

      <section id="courses" className="mx-auto max-w-6xl px-6 pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
              课程库
            </div>
            <h2 className="display mt-1 text-3xl text-ink-900">
              选择今天的训练
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GenderPicker value={gender} onChange={setGender} />
            <DiffPicker value={diff} onChange={setDiff} />
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="display text-2xl text-ink-900">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-ink-500">
        {label}
      </div>
    </div>
  );
}

function DiffPicker({
  value,
  onChange,
}: {
  value: Difficulty | 'all';
  onChange: (v: Difficulty | 'all') => void;
}) {
  const opts: { id: Difficulty | 'all'; label: string }[] = [
    { id: 'all', label: '全部难度' },
    { id: 'beginner', label: '入门' },
    { id: 'intermediate', label: '进阶' },
    { id: 'advanced', label: '高阶' },
  ];
  return (
    <div className="inline-flex rounded-full border border-ink-900/15 bg-white/70 p-1 backdrop-blur">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={[
            'rounded-full px-3.5 py-1.5 text-sm transition',
            value === o.id
              ? 'bg-ink-900 text-ink-50 shadow-soft'
              : 'text-ink-600 hover:text-ink-900',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-24 max-w-6xl px-6 text-sm text-ink-500">
      <div className="border-t border-ink-900/10 pt-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            提肛助手 · 由 Next.js + MediaPipe Pose + MiniMax M2.7 驱动
          </div>
          <div className="text-[11px]">
            本应用不替代医疗建议。如有盆腔疼痛或其他健康问题，请咨询医生。
          </div>
        </div>
      </div>
    </footer>
  );
}
