/**
 * 提肛助手核心类型定义
 *
 * 训练动作分为以下原子阶段（phase）：
 *   prepare  - 准备阶段（语音提示，准备开始）
 *   contract - 收缩（快速收紧盆底肌，类似憋尿/憋屁）
 *   hold     - 持续保持收缩
 *   relax    - 放松（完全松开）
 *   ladder   - 阶梯收缩（30% → 60% → 100% 三段渐进）
 *   breath_in/out - 呼吸引导（用于呼吸协同）
 *   rest     - 整组休息
 *
 * 一个课程 = 一组阶段序列，按顺序执行。
 */

export type Gender = 'male' | 'female' | 'all';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type PhaseKind =
  | 'prepare'
  | 'contract'
  | 'hold'
  | 'relax'
  | 'ladder'
  | 'breath_in'
  | 'breath_out'
  | 'rest';

export interface Phase {
  /** 阶段类型 */
  kind: PhaseKind;
  /** 阶段时长（毫秒） */
  durationMs: number;
  /** 语音提示文本（中文，使用 SSML 友好的短句） */
  prompt: string;
  /** 力度 0-100，仅 contract / hold / ladder 使用 */
  intensity?: number;
  /** 阶梯收缩的子段（durationMs / intensity 数组），仅 ladder 使用 */
  ladderSteps?: { intensity: number; durationMs: number; prompt: string }[];
}

export interface CourseSet {
  /** 一组动作内的阶段 */
  phases: Phase[];
  /** 重复次数 */
  reps: number;
  /** 每次循环之间的休息（毫秒） */
  restBetweenMs?: number;
}

export interface Course {
  id: string;
  name: string;
  /** 简短描述 */
  tagline: string;
  /** 课程详情（科学原理 / 适用人群） */
  description: string;
  difficulty: Difficulty;
  gender: Gender;
  /** 整体预计时长（秒） */
  estimatedSeconds: number;
  /** 课程主色（Tailwind 色类，用于卡片渐变） */
  accent: string;
  /** 推荐姿势：standing / sitting / supine（仰卧）*/
  posture: 'standing' | 'sitting' | 'supine';
  /** 课程主体：多组动作 */
  sets: CourseSet[];
}

export interface SessionRecord {
  /** ISO 日期，例如 2026-04-30 */
  date: string;
  /** 完成时刻 */
  completedAt: number;
  courseId: string;
  courseName: string;
  difficulty: Difficulty;
  gender: Gender;
  /** 实际持续秒数 */
  durationSec: number;
  /** 完成度 0-1 */
  completionRatio: number;
  /** 平均姿势分（如果开启了体位校正） */
  avgPostureScore?: number;
}

/** MediaPipe 33 关键点中我们关心的索引 */
export const POSE_LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

export interface PostureSnapshot {
  /** 综合分 0-100 */
  score: number;
  /** 各维度分项 */
  metrics: {
    /** 左右肩高度差（归一化）*/
    shoulderTilt: number;
    /** 左右髋高度差（归一化） */
    hipTilt: number;
    /** 颈部前倾角度（鼻 vs 双肩中点）*/
    headForward: number;
    /** 躯干前倾度（肩中点 vs 髋中点） */
    torsoLean: number;
  };
  /** 检测到的具体问题（人话） */
  issues: string[];
  /** 时间戳 */
  ts: number;
}
