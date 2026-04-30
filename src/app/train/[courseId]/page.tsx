'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { SessionPlayer } from '@/components/SessionPlayer';
import { getCourseById } from '@/lib/courses';
import { initSpeech, speak } from '@/lib/speech';
import { loadPrefs } from '@/lib/storage';
import type { SessionRecord } from '@/lib/types';

export default function TrainPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const course = getCourseById(courseId);
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [done, setDone] = useState<SessionRecord | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | undefined>();

  useEffect(() => {
    initSpeech();
    const p = loadPrefs();
    if (p.gender) setGender(p.gender);
  }, []);

  if (!course) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="mx-auto mt-20 max-w-3xl px-6">
          <h1 className="display text-3xl">未找到该课程</h1>
          <Link href="/" className="btn-primary mt-6">
            返回课程列表
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <Header />
      <div className="mx-auto mt-10 max-w-6xl px-6">
        {phase === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-8 lg:grid-cols-[1.1fr_1fr]"
          >
            <div className="card grain relative overflow-hidden p-8">
              <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
                即将开始
              </div>
              <h1 className="display mt-2 text-4xl text-ink-900">
                {course.name}
              </h1>
              <p className="mt-2 text-base text-ink-700">{course.tagline}</p>
              <p className="mt-6 leading-relaxed text-ink-700/90">
                {course.description}
              </p>

              <ul className="mt-6 space-y-2 text-sm text-ink-700">
                <li>• 体位：{posture(course.posture)}</li>
                <li>• 难度：{diff(course.difficulty)}</li>
                <li>
                  • 预计 {Math.round(course.estimatedSeconds / 60)} 分钟，共
                  {course.sets.length} 组
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="btn-primary"
                  onClick={() => {
                    speak(`即将开始${course.name}`, { priority: 'urgent' });
                    setPhase('running');
                  }}
                >
                  ▶ 开始训练
                </button>
                <Link href="/" className="btn-ghost">
                  返回
                </Link>
              </div>
            </div>

            <aside className="card grain relative p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
                开始前请确认
              </div>
              <ul className="mt-3 space-y-2 text-sm text-ink-700">
                <li>1. 找一个安静、不被打扰的环境</li>
                <li>2. 穿宽松衣物，确保盆底区域无紧绷</li>
                <li>3. 声音已开启（手机设备记得打开声音）</li>
                <li>4. 训练中如有不适，立即停止</li>
                <li>5. 想要体位校正？开训后点右上角"开启摄像头"</li>
              </ul>
              <div className="mt-6 rounded-2xl bg-moss-50 p-4 text-sm leading-relaxed text-moss-700 ring-1 ring-moss-200">
                <strong className="display text-base">隐私保护：</strong>
                <br />
                摄像头检测全部在浏览器本地完成，画面不会上传。仅当连续姿势异常时，
                才会把"姿态指标数字"（不含图像）发给 DeepSeek
                获取个性化建议。
              </div>
            </aside>
          </motion.div>
        )}

        {phase === 'running' && (
          <SessionPlayer
            course={course}
            gender={gender}
            onComplete={(rec) => {
              setDone(rec);
              setPhase('done');
            }}
            onExit={() => setPhase('intro')}
          />
        )}

        {phase === 'done' && done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card grain relative overflow-hidden p-12 text-center"
          >
            <div className="text-6xl">🎉</div>
            <h1 className="display mt-4 text-4xl text-ink-900">
              你完成了 {course.name}
            </h1>
            <p className="mt-2 text-ink-700">
              用时 {Math.round(done.durationSec / 60)} 分钟 · 已打卡今日
              {done.avgPostureScore
                ? ` · 平均姿势分 ${done.avgPostureScore}`
                : ''}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/history" className="btn-primary">
                查看打卡日历
              </Link>
              <Link href="/" className="btn-ghost">
                再选一节
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function posture(p: 'standing' | 'sitting' | 'supine') {
  return { standing: '站立', sitting: '坐姿', supine: '仰卧' }[p];
}
function diff(d: 'beginner' | 'intermediate' | 'advanced') {
  return { beginner: '入门', intermediate: '进阶', advanced: '高阶' }[d];
}
