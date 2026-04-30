'use client';

import { motion } from 'framer-motion';
import type { PhaseKind } from '@/lib/types';

/**
 * 人体姿势示范 SVG（火柴人 + 高亮发力部位）。
 *
 * 直观展示：
 *  - 站立 / 坐姿 / 仰卧
 *  - 收缩时盆底处出现"上提"红光，圆缩小
 *  - 呼吸时胸腹起伏
 *
 * 注：每条线显式写 stroke 颜色（不依赖 group 上的 url 渐变继承），
 *      避免某些浏览器在嵌套 motion 元素时丢失 stroke 的兼容问题。
 */

interface Props {
  posture: 'standing' | 'sitting' | 'supine';
  kind: PhaseKind;
}

const STROKE = '#36422d';
const HEAD_FILL = '#e9ece4';
const STEP = 4; // 默认线宽

export function PoseFigure({ posture, kind }: Props) {
  const isContracting =
    kind === 'contract' || kind === 'hold' || kind === 'breath_out';
  const isBreathingIn = kind === 'breath_in' || kind === 'relax';

  return (
    <svg
      viewBox="0 0 200 240"
      className="h-full w-full"
      role="img"
      aria-label={`${posture} 姿势示范`}
    >
      <defs>
        <radialGradient id="pelvis-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef7d6b" stopOpacity="1" />
          <stop offset="60%" stopColor="#ef7d6b" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ef7d6b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {posture === 'standing' && (
        <>
          {/* 头 */}
          <circle cx={100} cy={38} r={14} fill={HEAD_FILL} stroke={STROKE} strokeWidth={STEP} />
          {/* 躯干（呼吸时上下变化） */}
          <motion.line
            x1={100}
            y1={52}
            x2={100}
            y2={120}
            stroke={STROKE}
            strokeWidth={STEP}
            strokeLinecap="round"
            animate={{ y2: isBreathingIn ? 122 : 118 }}
            transition={{ duration: 1.4 }}
          />
          {/* 双肩 */}
          <line x1={70} y1={72} x2={130} y2={72} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 双臂 */}
          <line x1={70} y1={72} x2={58} y2={130} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={130} y1={72} x2={142} y2={130} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 髋 */}
          <line x1={82} y1={120} x2={118} y2={120} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 双腿（站立、与肩同宽） */}
          <line x1={88} y1={120} x2={80} y2={210} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={112} y1={120} x2={120} y2={210} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 脚 */}
          <line x1={70} y1={210} x2={92} y2={210} stroke={STROKE} strokeWidth={6} strokeLinecap="round" />
          <line x1={108} y1={210} x2={130} y2={210} stroke={STROKE} strokeWidth={6} strokeLinecap="round" />

          {/* 盆底高亮 */}
          <motion.circle
            cx={100}
            cy={130}
            r={22}
            fill="url(#pelvis-glow)"
            animate={{
              opacity: isContracting ? 1 : 0.32,
              scale: isContracting ? 0.78 : 1,
            }}
            transition={{ duration: 0.8 }}
            style={{ transformOrigin: '100px 130px', transformBox: 'fill-box' }}
          />

          {isContracting && (
            <motion.line
              x1={100}
              y1={130}
              x2={100}
              y2={104}
              stroke="#cf4a3c"
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}
        </>
      )}

      {posture === 'sitting' && (
        <>
          {/* 头 */}
          <circle cx={100} cy={48} r={14} fill={HEAD_FILL} stroke={STROKE} strokeWidth={STEP} />
          {/* 躯干 */}
          <motion.line
            x1={100}
            y1={62}
            x2={100}
            y2={138}
            stroke={STROKE}
            strokeWidth={STEP}
            strokeLinecap="round"
            animate={{ y2: isBreathingIn ? 142 : 136 }}
            transition={{ duration: 1.4 }}
          />
          {/* 双肩 */}
          <line x1={72} y1={80} x2={128} y2={80} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 手臂 */}
          <line x1={72} y1={80} x2={62} y2={128} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={128} y1={80} x2={138} y2={128} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 髋 */}
          <line x1={82} y1={138} x2={118} y2={138} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 大腿水平（向左右伸展） */}
          <line x1={118} y1={138} x2={172} y2={138} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={82} y1={138} x2={28} y2={138} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 小腿垂直 */}
          <line x1={166} y1={138} x2={166} y2={210} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={34} y1={138} x2={34} y2={210} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 椅子 */}
          <line x1={20} y1={216} x2={180} y2={216} stroke={STROKE} strokeWidth={2} strokeDasharray="4 4" />

          <motion.circle
            cx={100}
            cy={142}
            r={22}
            fill="url(#pelvis-glow)"
            animate={{
              opacity: isContracting ? 1 : 0.32,
              scale: isContracting ? 0.78 : 1,
            }}
            transition={{ duration: 0.8 }}
            style={{ transformOrigin: '100px 142px', transformBox: 'fill-box' }}
          />
        </>
      )}

      {posture === 'supine' && (
        <>
          {/* 仰卧：人体水平躺下，膝盖弯曲，头朝左 */}
          <circle cx={32} cy={120} r={14} fill={HEAD_FILL} stroke={STROKE} strokeWidth={STEP} />
          {/* 躯干（水平） */}
          <motion.line
            x1={46}
            y1={120}
            x2={120}
            y2={120}
            stroke={STROKE}
            strokeWidth={STEP}
            strokeLinecap="round"
            animate={{ y1: isBreathingIn ? 116 : 122 }}
            transition={{ duration: 1.4 }}
          />
          {/* 双肩竖直 */}
          <line x1={46} y1={102} x2={46} y2={138} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 髋 */}
          <line x1={120} y1={102} x2={120} y2={138} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 大腿向上 */}
          <line x1={120} y1={108} x2={158} y2={70} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={120} y1={132} x2={158} y2={170} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 小腿向下（弯曲后回到地面） */}
          <line x1={158} y1={70} x2={158} y2={210} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          <line x1={158} y1={170} x2={158} y2={210} stroke={STROKE} strokeWidth={STEP} strokeLinecap="round" />
          {/* 地面 */}
          <line x1={20} y1={222} x2={180} y2={222} stroke={STROKE} strokeWidth={2} strokeDasharray="4 4" />

          <motion.circle
            cx={120}
            cy={120}
            r={22}
            fill="url(#pelvis-glow)"
            animate={{
              opacity: isContracting ? 1 : 0.32,
              scale: isContracting ? 0.78 : 1,
            }}
            transition={{ duration: 0.8 }}
            style={{ transformOrigin: '120px 120px', transformBox: 'fill-box' }}
          />
        </>
      )}
    </svg>
  );
}
