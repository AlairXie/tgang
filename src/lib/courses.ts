import type { Course, Phase } from './types';

/**
 * 阶段构造工具：让数据更紧凑、可读。
 * 严格按照盆底肌训练科学原则设计：
 *  - 收缩与放松时长比 1:1 ~ 1:2（避免疲劳代偿）
 *  - 单次最长 10s 持续收缩
 *  - 每组 8~12 次为一个标准 Kegel 单元
 *  - 每周建议 3 组、每组间充分放松
 *
 * 参考：NIH/Mayo Clinic Kegel 训练指南
 */
const p = {
  prepare: (durationMs = 4000, prompt = '准备开始，找到舒适的体位'): Phase => ({
    kind: 'prepare',
    durationMs,
    prompt,
  }),
  contract: (durationMs: number, prompt = '收紧', intensity = 80): Phase => ({
    kind: 'contract',
    durationMs,
    prompt,
    intensity,
  }),
  hold: (durationMs: number, prompt = '保持', intensity = 80): Phase => ({
    kind: 'hold',
    durationMs,
    prompt,
    intensity,
  }),
  relax: (durationMs: number, prompt = '放松'): Phase => ({
    kind: 'relax',
    durationMs,
    prompt,
  }),
  rest: (durationMs: number, prompt = '组间休息'): Phase => ({
    kind: 'rest',
    durationMs,
    prompt,
  }),
  breathIn: (durationMs = 4000, prompt = '吸气'): Phase => ({
    kind: 'breath_in',
    durationMs,
    prompt,
  }),
  breathOut: (durationMs = 4000, prompt = '呼气，同时收紧'): Phase => ({
    kind: 'breath_out',
    durationMs,
    prompt,
  }),
  ladder: (prompt = '阶梯收缩'): Phase => ({
    kind: 'ladder',
    durationMs: 9000,
    prompt,
    ladderSteps: [
      { intensity: 30, durationMs: 3000, prompt: '轻收三成' },
      { intensity: 60, durationMs: 3000, prompt: '加力到六成' },
      { intensity: 100, durationMs: 3000, prompt: '用尽全力' },
    ],
  }),
};

const sumPhases = (phases: Phase[]) =>
  phases.reduce((s, ph) => s + ph.durationMs, 0);

function buildCourse(
  course: Omit<Course, 'estimatedSeconds'>,
): Course {
  const total =
    course.sets.reduce(
      (s, set) =>
        s + (sumPhases(set.phases) * set.reps + (set.restBetweenMs ?? 0) * Math.max(0, set.reps - 1)),
      0,
    ) / 1000;
  return { ...course, estimatedSeconds: Math.round(total) };
}

export const COURSES: Course[] = [
  buildCourse({
    id: 'starter-male',
    name: '入门觉察 · 男士',
    tagline: '第一次练？先学会"找到肌肉"',
    description:
      '专为初学男士设计。通过短促的快速收缩，先让大脑找到盆底肌（肛提肌）的发力感。仰卧姿势可减少腹肌代偿。',
    difficulty: 'beginner',
    gender: 'male',
    accent: 'from-moss-200 to-moss-400',
    posture: 'supine',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(5000, '请仰卧，双膝弯曲，脚掌踩地')],
      },
      {
        reps: 8,
        restBetweenMs: 0,
        phases: [
          p.contract(2000, '快速收紧，像在憋一个屁', 70),
          p.relax(3000, '完全放松，把肌肉松到底'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(15000, '组间休息，深呼吸')],
      },
      {
        reps: 6,
        restBetweenMs: 0,
        phases: [
          p.contract(3000, '收紧并保持', 60),
          p.relax(4000, '彻底放松'),
        ],
      },
    ],
  }),

  buildCourse({
    id: 'starter-female',
    name: '入门觉察 · 女士',
    tagline: '产后修复 / 初学者首选',
    description:
      '专为初学女士设计。先建立"内收上提"的肌肉记忆，对产后修复尤其重要。低强度、节奏平缓。',
    difficulty: 'beginner',
    gender: 'female',
    accent: 'from-clay-200 to-clay-400',
    posture: 'supine',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(5000, '请仰卧，双膝弯曲，骨盆中立')],
      },
      {
        reps: 10,
        phases: [
          p.contract(2000, '想象内收并向上提起', 60),
          p.relax(3000, '彻底放下来'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(20000, '组间休息')],
      },
      {
        reps: 6,
        phases: [
          p.contract(4000, '稳定上提', 70),
          p.relax(5000, '充分放松'),
        ],
      },
    ],
  }),

  buildCourse({
    id: 'breath-sync',
    name: '呼吸协同 · 通用',
    tagline: '把呼吸和盆底肌连成一条线',
    description:
      '呼气时收缩、吸气时放松。这是核心稳定的关键模式，能减少憋气与代偿，是所有人都该掌握的基础。',
    difficulty: 'beginner',
    gender: 'all',
    accent: 'from-moss-100 to-moss-300',
    posture: 'sitting',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(6000, '请坐直，双脚平放，骨盆中立')],
      },
      {
        reps: 6,
        phases: [
          p.breathIn(4000, '用鼻子缓慢吸气，腹部自然鼓起'),
          p.breathOut(5000, '呼气，同时温柔上提盆底肌'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(15000, '组间休息')],
      },
      {
        reps: 6,
        phases: [
          p.breathIn(4000, '吸气，松开'),
          p.breathOut(6000, '长呼气，逐渐加大上提力度'),
        ],
      },
    ],
  }),

  buildCourse({
    id: 'quick-burst',
    name: '快速点火 · 通用',
    tagline: '快肌纤维专项 · 增强反应',
    description:
      '针对快肌纤维（II 型）。短而有力的快速收缩，提升应急控制能力（咳嗽 / 跳跃 / 提重物时的瞬时支撑）。',
    difficulty: 'intermediate',
    gender: 'all',
    accent: 'from-coral-400 to-coral-600',
    posture: 'standing',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(5000, '请站直，双脚与肩同宽')],
      },
      {
        reps: 12,
        phases: [
          p.contract(800, '快收', 90),
          p.relax(1500, '完全松'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(20000, '组间休息')],
      },
      {
        reps: 12,
        phases: [
          p.contract(800, '快收', 95),
          p.relax(1500, '完全松'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(20000, '最后一组，准备好')],
      },
      {
        reps: 12,
        phases: [
          p.contract(800, '快收', 100),
          p.relax(1500, '完全松'),
        ],
      },
    ],
  }),

  buildCourse({
    id: 'long-hold',
    name: '持续耐力 · 通用',
    tagline: '慢肌纤维 · 深度耐力',
    description:
      '10 秒级长收缩。锻炼慢肌纤维（I 型），提升日常持续支撑能力。注意呼吸不能停。',
    difficulty: 'intermediate',
    gender: 'all',
    accent: 'from-moss-300 to-moss-500',
    posture: 'sitting',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(5000, '请坐直，把注意力收到骨盆底部')],
      },
      {
        reps: 6,
        phases: [
          p.contract(2000, '逐渐加力到六成', 60),
          p.hold(8000, '稳住，正常呼吸', 70),
          p.relax(8000, '完全放松，等待肌肉复原'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(30000, '中间长休息，喝口水')],
      },
      {
        reps: 4,
        phases: [
          p.contract(2000, '加力到八成', 80),
          p.hold(10000, '咬紧但别憋气', 80),
          p.relax(10000, '充分放松'),
        ],
      },
    ],
  }),

  buildCourse({
    id: 'ladder-mix',
    name: '阶梯混合 · 进阶',
    tagline: '三档力度 · 精细控制',
    description:
      '阶梯式收缩（30% → 60% → 100%）+ 快收 + 长保持的混合训练。要求大脑对力度有精细分级控制。',
    difficulty: 'advanced',
    gender: 'all',
    accent: 'from-clay-300 to-coral-500',
    posture: 'standing',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(5000, '请站立，膝盖微弯')],
      },
      {
        reps: 5,
        phases: [
          p.ladder('阶梯收缩，逐档加力'),
          p.relax(6000, '完全放松'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(20000, '组间休息')],
      },
      {
        reps: 10,
        phases: [
          p.contract(700, '快', 90),
          p.relax(1300, '松'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(20000, '最后一组：长保持')],
      },
      {
        reps: 4,
        phases: [
          p.contract(2000, '加力', 80),
          p.hold(10000, '咬紧但放松呼吸', 90),
          p.relax(10000, '彻底放松'),
        ],
      },
    ],
  }),

  buildCourse({
    id: 'advanced-male',
    name: '高阶强化 · 男士',
    tagline: '硬度与控制双提升',
    description:
      '面向有训练基础的男士。融合阶梯+长保持+呼吸协同，对盆底肌肉群进行综合强化。',
    difficulty: 'advanced',
    gender: 'male',
    accent: 'from-moss-400 to-ink-700',
    posture: 'standing',
    sets: [
      {
        reps: 1,
        phases: [p.prepare(5000, '站立，挺胸收下巴')],
      },
      {
        reps: 4,
        phases: [
          p.breathIn(3000, '吸气放松'),
          p.breathOut(6000, '呼气并用力上提'),
          p.hold(6000, '咬紧十秒', 90),
          p.relax(8000, '彻底放下来'),
        ],
      },
      {
        reps: 1,
        phases: [p.rest(25000, '组间休息')],
      },
      {
        reps: 6,
        phases: [
          p.ladder('三档冲刺'),
          p.relax(5000, '放松'),
        ],
      },
    ],
  }),
];

export function getCourseById(id: string) {
  return COURSES.find((c) => c.id === id);
}
