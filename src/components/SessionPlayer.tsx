'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BreathRing } from './BreathRing';
import { PoseFigure } from './PoseFigure';
import { PoseCorrector } from './PoseCorrector';
import { initSpeech, speak, stopSpeak, setMuted, isMuted } from '@/lib/speech';
import { saveRecord, todayISO } from '@/lib/storage';
import type { Course, Phase, PostureSnapshot, SessionRecord } from '@/lib/types';

/**
 * 训练播放器：把 Course 展开成扁平的 Phase 队列，按时间逐个播放。
 * - 每个 phase 开始时 speak()
 * - ladder 阶段会按 ladderSteps 进一步细分
 * - 整体进度条 + 当前阶段倒计时
 */

interface FlatPhase extends Phase {
  /** 这是该 phase 内的第几个阶段（0 起） */
  index: number;
  /** 给阶梯收缩展开的子段（如果是 ladder，这里会拆为多个 contract 阶段） */
}

function flattenCourse(course: Course): FlatPhase[] {
  const out: FlatPhase[] = [];
  let i = 0;
  for (const set of course.sets) {
    for (let r = 0; r < set.reps; r++) {
      for (const phase of set.phases) {
        if (phase.kind === 'ladder' && phase.ladderSteps) {
          for (const s of phase.ladderSteps) {
            out.push({
              kind: 'contract',
              durationMs: s.durationMs,
              prompt: s.prompt,
              intensity: s.intensity,
              index: i++,
            });
          }
        } else {
          out.push({ ...phase, index: i++ });
        }
      }
      if (set.restBetweenMs && r < set.reps - 1) {
        out.push({
          kind: 'rest',
          durationMs: set.restBetweenMs,
          prompt: '短暂休息',
          index: i++,
        });
      }
    }
  }
  return out;
}

interface Props {
  course: Course;
  onComplete?: (rec: SessionRecord) => void;
  onExit?: () => void;
  defaultCamera?: boolean;
  gender?: 'male' | 'female';
}

export function SessionPlayer({
  course,
  onComplete,
  onExit,
  defaultCamera = false,
  gender,
}: Props) {
  const phases = useMemo(() => flattenCourse(course), [course]);
  const totalDurationMs = useMemo(
    () => phases.reduce((s, p) => s + p.durationMs, 0),
    [phases],
  );

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseStart, setPhaseStart] = useState<number>(0);
  const [now, setNow] = useState<number>(0);
  const [running, setRunning] = useState(true);
  const [muteUI, setMuteUI] = useState(false);
  const [cameraOn, setCameraOn] = useState(defaultCamera);
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  const [postureScores, setPostureScores] = useState<number[]>([]);

  const startedAtRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    initSpeech();
    return () => {
      stopSpeak();
    };
  }, []);

  // 阶段切换时立即播报
  useEffect(() => {
    if (!running) return;
    const phase = phases[phaseIndex];
    if (!phase) return;
    setPhaseStart(performance.now());
    speak(phase.prompt, { priority: 'urgent' });
  }, [phaseIndex, running, phases]);

  // 主循环：用 rAF 推进时间
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const t = performance.now();
      setNow(t);
      const phase = phases[phaseIndex];
      if (!phase) return;
      if (t - phaseStart >= phase.durationMs) {
        if (phaseIndex >= phases.length - 1) {
          finish();
        } else {
          setPhaseIndex((i) => i + 1);
        }
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, phaseIndex, phaseStart, phases]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false);
    stopSpeak();
    speak('训练完成，给你点个赞', { priority: 'urgent' });
    const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
    const avg =
      postureScores.length > 0
        ? Math.round(
            postureScores.reduce((s, x) => s + x, 0) / postureScores.length,
          )
        : undefined;
    const rec: SessionRecord = {
      date: todayISO(),
      completedAt: Date.now(),
      courseId: course.id,
      courseName: course.name,
      difficulty: course.difficulty,
      gender: course.gender,
      durationSec,
      completionRatio: 1,
      avgPostureScore: avg,
    };
    saveRecord(rec);
    // 训练结束后请求一次反思鼓励
    fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'reflection',
        payload: { courseName: course.name, durationSec },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.advice) {
          setCoachAdvice(d.advice);
          speak(d.advice);
        }
      })
      .catch(() => undefined);
    onComplete?.(rec);
  }, [course, postureScores, onComplete]);

  const handleQuit = () => {
    stopSpeak();
    setRunning(false);
    onExit?.();
  };

  const handleToggleMute = () => {
    const next = !isMuted();
    setMuted(next);
    setMuteUI(next);
  };

  const handleCoachAdvice = useCallback(
    async (snap: PostureSnapshot) => {
      try {
        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'posture',
            payload: {
              score: snap.score,
              metrics: snap.metrics,
              issues: snap.issues,
            },
          }),
        });
        const data = (await res.json()) as { advice?: string };
        if (data?.advice) {
          setCoachAdvice(data.advice);
          speak(data.advice, { priority: 'urgent' });
        }
      } catch {
        // 网络问题忽略，本地仍有 issues 提示
      }
    },
    [],
  );

  const handleSnapshot = useCallback((snap: PostureSnapshot) => {
    if (snap.score > 0) {
      setPostureScores((prev) =>
        prev.length > 200 ? [...prev.slice(-150), snap.score] : [...prev, snap.score],
      );
    }
  }, []);

  const phase = phases[phaseIndex] ?? phases[phases.length - 1];
  const phaseElapsed = Math.min(phase.durationMs, now - phaseStart);
  const phasePct = phase.durationMs > 0 ? phaseElapsed / phase.durationMs : 0;
  const totalElapsed =
    phases.slice(0, phaseIndex).reduce((s, p) => s + p.durationMs, 0) +
    phaseElapsed;
  const totalPct = totalElapsed / totalDurationMs;

  const phaseLabel = labelFor(phase.kind);
  const remaining = Math.max(0, Math.ceil((phase.durationMs - phaseElapsed) / 1000));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* 左：主训练区 */}
      <section className="card grain relative overflow-hidden p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-ink-500">
              正在训练
            </div>
            <h2 className="display mt-1 text-3xl text-ink-900">{course.name}</h2>
            <div className="mt-1 text-sm text-ink-600">{course.tagline}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleMute}
              className="btn-ghost"
              aria-label={muteUI ? '取消静音' : '静音'}
              title={muteUI ? '取消静音' : '静音'}
            >
              {muteUI ? '🔇 已静音' : '🔊 语音播报中'}
            </button>
            <button
              onClick={() => setCameraOn((v) => !v)}
              className="btn-ghost"
              title={cameraOn ? '关闭摄像头' : '打开摄像头校正'}
            >
              {cameraOn ? '📷 关闭体位校正' : '📷 开启体位校正'}
            </button>
            <button onClick={handleQuit} className="btn-ghost">
              退出
            </button>
          </div>
        </header>

        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10">
            <motion.div
              animate={{ width: `${totalPct * 100}%` }}
              className="h-full rounded-full bg-gradient-to-r from-moss-400 to-moss-600"
              transition={{ ease: 'linear' }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-ink-500">
            <span>{Math.floor(totalElapsed / 1000)}s 已用</span>
            <span>共 {Math.round(totalDurationMs / 1000)}s</span>
          </div>
        </div>

        <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
          <div className="grid place-items-center">
            <BreathRing
              kind={phase.kind}
              durationMs={phase.durationMs}
              intensity={phase.intensity}
              label={phaseLabel}
              subLabel={`${remaining}s · ${phase.prompt}`}
            />
          </div>
          <div className="grid place-items-center">
            <div className="aspect-[5/6] w-full max-w-xs">
              <PoseFigure posture={course.posture} kind={phase.kind} />
            </div>
          </div>
        </div>

        {/* 阶段进度小条 */}
        <div className="mt-10">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>当前阶段：{phaseLabel}</span>
            <span>
              {phaseIndex + 1} / {phases.length}
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-900/10">
            <div
              className="h-full bg-ink-900/40 transition-[width]"
              style={{ width: `${phasePct * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* 右：教练面板 */}
      <aside className="space-y-4">
        {cameraOn ? (
          <PoseCorrector
            enabled={cameraOn}
            onSnapshot={handleSnapshot}
            onCoachAdvice={handleCoachAdvice}
          />
        ) : (
          <div className="card grain relative p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
              体位校正（可选）
            </div>
            <p className="mt-3 text-sm text-ink-700">
              开启摄像头后，浏览器本地的 MediaPipe Pose
              将持续检查你的站坐姿，所有计算都在本机完成，画面不会上传。
            </p>
            <button
              onClick={() => setCameraOn(true)}
              className="btn-primary mt-4"
            >
              📷 开启摄像头
            </button>
          </div>
        )}

        <AnimatePresence>
          {coachAdvice && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card relative overflow-hidden p-5"
            >
              <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
                AI 教练建议
              </div>
              <div className="display mt-2 text-lg leading-snug text-ink-900">
                {coachAdvice}
              </div>
              <div className="mt-2 text-[11px] text-ink-500">
                由 AI 教练个性化生成 · 已语音播报
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card relative p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-ink-500">
            动作要点
          </div>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            {gender === 'male' && (
              <li>• 男士：想象把睾丸"轻轻向上提"</li>
            )}
            {gender === 'female' && (
              <li>• 女士：想象把卫生棉条"向内向上吸"</li>
            )}
            <li>• 收缩时不要憋气，正常呼吸或配合呼气</li>
            <li>• 不要用屁股、大腿、腹部代偿发力</li>
            <li>• 放松要彻底，让肌肉真正"松到底"</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function labelFor(kind: Phase['kind']): string {
  switch (kind) {
    case 'prepare':
      return '准备';
    case 'contract':
      return '收紧';
    case 'hold':
      return '保持';
    case 'relax':
      return '放松';
    case 'breath_in':
      return '吸气';
    case 'breath_out':
      return '呼气';
    case 'rest':
      return '休息';
    case 'ladder':
      return '阶梯';
    default:
      return '';
  }
}
