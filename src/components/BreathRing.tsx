'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { PhaseKind } from '@/lib/types';

/**
 * 呼吸 / 收缩引导圈：
 * - contract / hold / breath_out → 收缩到小（target=0.5 / 0.4）
 * - relax / breath_in / rest / prepare → 扩张到大（target=1.0）
 * - ladder → 三档（30%, 60%, 100%）由父组件传入 sizeOverride
 *
 * 圆圈本身用径向渐变 + 多层光晕，强调"温柔健康"的视觉氛围。
 */
export interface BreathRingProps {
  kind: PhaseKind;
  /** 当前阶段时长（毫秒） */
  durationMs: number;
  /** 强度 0-100，影响收缩到多小 */
  intensity?: number;
  /** 主标题文字（如"收紧"） */
  label: string;
  /** 副标题（倒计时或子提示） */
  subLabel?: string;
  /** 阶梯收缩时由父组件强制覆盖目标尺寸 0~1 */
  sizeOverride?: number;
}

function targetScaleFor(kind: PhaseKind, intensity = 80): number {
  switch (kind) {
    case 'contract':
    case 'hold':
    case 'breath_out':
      // 收缩越大，圆变得越小
      return 1 - Math.min(0.55, intensity / 200);
    case 'relax':
    case 'rest':
    case 'breath_in':
    case 'prepare':
    default:
      return 1;
  }
}

export function BreathRing({
  kind,
  durationMs,
  intensity = 80,
  label,
  subLabel,
  sizeOverride,
}: BreathRingProps) {
  const reduce = useReducedMotion();
  const target = sizeOverride ?? targetScaleFor(kind, intensity);
  const fromScale =
    kind === 'breath_out' || kind === 'contract' || kind === 'hold'
      ? 1
      : 0.55;

  const palette = {
    contract: ['#3f7f33', '#82b975'],
    hold: ['#306526', '#82b975'],
    relax: ['#b5d6ab', '#dcecd6'],
    rest: ['#c89346', '#f3e7d2'],
    prepare: ['#b5d6ab', '#dcecd6'],
    breath_in: ['#b5d6ab', '#dcecd6'],
    breath_out: ['#3f7f33', '#82b975'],
    ladder: ['#cf4a3c', '#f3e7d2'],
  } as const;
  const [c1, c2] = palette[kind] ?? palette.relax;

  return (
    <div className="relative grid place-items-center">
      {/* 外层光晕 */}
      <div className="absolute inset-0 grid place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute h-72 w-72 rounded-full border border-moss-300/40"
            style={{
              animation: `pulseRing 2.4s ease-out ${i * 0.8}s infinite`,
            }}
          />
        ))}
      </div>

      <motion.div
        key={`${kind}-${durationMs}-${target}`}
        initial={reduce ? false : { scale: fromScale }}
        animate={{ scale: target }}
        transition={{
          duration: durationMs / 1000,
          ease: kind === 'contract' ? [0.5, 0, 0.2, 1] : [0.4, 0, 0.6, 1],
        }}
        className="relative grid h-72 w-72 place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${c2} 0%, ${c1} 70%)`,
          boxShadow: `0 30px 80px -30px ${c1}aa, inset 0 0 80px rgba(255,255,255,0.25)`,
        }}
      >
        <div className="text-center">
          <div className="display text-5xl text-white drop-shadow-md">
            {label}
          </div>
          {subLabel ? (
            <div className="mt-2 text-sm tracking-wider text-white/80">
              {subLabel}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
