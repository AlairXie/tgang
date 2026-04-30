/**
 * MediaPipe Pose 33 关键点 → 姿态评分
 *
 * 我们检测以下问题（针对盆底肌训练时的静态体位）：
 *   1. 双肩高度不对称 → 耸肩 / 歪斜
 *   2. 双髋高度不对称 → 骨盆倾斜
 *   3. 头部前倾（鼻尖远离肩中点） → 含胸驼背
 *   4. 躯干前/后倾过大（肩中点偏离髋中点）
 *
 * 所有阈值基于归一化坐标（0-1）。
 */

import type { PostureSnapshot } from './types';
import { POSE_LM } from './types';

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

function dist(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function visibleEnough(lm: NormalizedLandmark | undefined, t = 0.5) {
  return !!lm && (lm.visibility ?? 1) >= t;
}

/**
 * 把单帧 landmarks 转为 PostureSnapshot。
 * 评分逻辑：从 100 分扣分，每个问题最多扣 25 分。
 */
export function analyzePose(
  landmarks: NormalizedLandmark[] | undefined,
): PostureSnapshot | null {
  if (!landmarks || landmarks.length < 33) return null;
  const ls = landmarks[POSE_LM.LEFT_SHOULDER];
  const rs = landmarks[POSE_LM.RIGHT_SHOULDER];
  const lh = landmarks[POSE_LM.LEFT_HIP];
  const rh = landmarks[POSE_LM.RIGHT_HIP];
  const nose = landmarks[POSE_LM.NOSE];

  if (
    !visibleEnough(ls) ||
    !visibleEnough(rs) ||
    !visibleEnough(lh) ||
    !visibleEnough(rh) ||
    !visibleEnough(nose)
  ) {
    return {
      score: 0,
      metrics: {
        shoulderTilt: 0,
        hipTilt: 0,
        headForward: 0,
        torsoLean: 0,
      },
      issues: ['未检测到完整身体，请正对镜头并显示上半身'],
      ts: Date.now(),
    };
  }

  const shoulderTilt = Math.abs(ls.y - rs.y);
  const hipTilt = Math.abs(lh.y - rh.y);

  const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2, z: 0 };
  const hipMid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2, z: 0 };
  const torsoH = Math.max(0.001, dist(shoulderMid, hipMid));

  // 头前伸：鼻 x 与肩中点 x 的水平偏移（归一化到肩宽）
  const shoulderW = Math.max(0.001, Math.abs(ls.x - rs.x));
  const headForward = Math.abs(nose.x - shoulderMid.x) / shoulderW;
  // 躯干前/后倾：肩中点-髋中点 与 垂直方向的角度
  const torsoLean =
    Math.abs(shoulderMid.x - hipMid.x) / torsoH;

  const issues: string[] = [];
  let score = 100;

  if (shoulderTilt > 0.04) {
    score -= 25;
    issues.push('双肩高度不一致，请放松双肩、保持水平');
  }
  if (hipTilt > 0.035) {
    score -= 25;
    issues.push('骨盆向一侧倾斜，请把重心放在两腿中间');
  }
  if (headForward > 0.35) {
    score -= 20;
    issues.push('头部前倾或偏移，请收下巴、把耳朵对齐肩膀');
  }
  if (torsoLean > 0.18) {
    score -= 20;
    issues.push('躯干前后倾过大，请挺直脊柱');
  }

  return {
    score: Math.max(0, score),
    metrics: { shoulderTilt, hipTilt, headForward, torsoLean },
    issues,
    ts: Date.now(),
  };
}

/**
 * 决策：是否需要调用 AI 给出个性化纠正建议。
 * 触发条件：连续 N 帧都低于阈值，且距上次调用至少 cooldownMs。
 */
export class PostureCoachTrigger {
  private below = 0;
  private lastCallAt = 0;
  constructor(
    private readonly windowFrames = 30,
    private readonly threshold = 60,
    private readonly cooldownMs = 25_000,
  ) {}

  feed(snapshot: PostureSnapshot): boolean {
    const now = Date.now();
    if (snapshot.score < this.threshold && snapshot.score > 0) {
      this.below += 1;
    } else {
      this.below = Math.max(0, this.below - 2);
    }
    if (
      this.below >= this.windowFrames &&
      now - this.lastCallAt > this.cooldownMs
    ) {
      this.below = 0;
      this.lastCallAt = now;
      return true;
    }
    return false;
  }

  reset() {
    this.below = 0;
    this.lastCallAt = 0;
  }
}
