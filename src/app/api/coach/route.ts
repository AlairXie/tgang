import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * DeepSeek V4 个性化教练接口（OpenAI SDK 兼容）。
 *
 * 接收：
 *   {
 *     kind: 'posture' | 'plan' | 'reflection',
 *     payload: { ... }   // 例如 PostureSnapshot 或训练记录数组
 *   }
 *
 * 返回：
 *   { advice: string }    // 1-2 句中文建议（适合语音播报）
 *
 * 注意：摄像头图像永远不会发送，仅发送已抽象的姿态指标。
 */

export const runtime = 'nodejs';

interface CoachRequest {
  kind: 'posture' | 'plan' | 'reflection';
  payload: unknown;
}

const SYSTEM_PROMPT = `你是一位严谨且温暖的盆底肌训练教练（提肛 / 凯格尔运动），名字叫"提肛助手"。
请用简体中文，语气专业但亲切，像私教一样直接对用户说话，禁止使用"作为AI"等元话术。
所有建议要：
1) 用 1-2 句话说完，便于语音播报；
2) 给出具体、可立即执行的动作（比如"把左肩往下压一点点"、"让骨盆中立"）；
3) 不做医疗诊断，不给药物建议；
4) 注意安全：不鼓励憋气、不鼓励过度疲劳。`;

function buildUserPrompt(req: CoachRequest): string {
  switch (req.kind) {
    case 'posture': {
      const snap = req.payload as {
        score: number;
        metrics: {
          shoulderTilt: number;
          hipTilt: number;
          headForward: number;
          torsoLean: number;
        };
        issues: string[];
      };
      return `用户当前训练中的姿势数据（不含图像，全部本地分析得到）：
- 综合姿势分：${snap.score}/100
- 双肩高度差（归一化）：${snap.metrics.shoulderTilt.toFixed(3)}
- 双髋高度差（归一化）：${snap.metrics.hipTilt.toFixed(3)}
- 头部前伸量：${snap.metrics.headForward.toFixed(3)}
- 躯干前后倾：${snap.metrics.torsoLean.toFixed(3)}
- 已检测到的问题：${snap.issues.join('；') || '无'}

请用 1-2 句中文教练口吻，告诉用户最关键的一个调整点。`;
    }
    case 'plan': {
      const p = req.payload as {
        gender?: 'male' | 'female';
        recentDays?: number;
        recentSessions?: number;
      };
      return `用户性别：${p.gender ?? '未指定'}，近 7 天打卡 ${p.recentDays ?? 0} 天，共 ${p.recentSessions ?? 0} 次。
请用 1-2 句中文，给出今天的一句训练建议（要选哪类课程 / 持续时长）。`;
    }
    case 'reflection': {
      const r = req.payload as { courseName: string; durationSec: number };
      return `用户刚完成了课程「${r.courseName}」，总用时 ${r.durationSec} 秒。
请用 1 句中文做温暖的鼓励，并提示一个明天可以注意的小细节。`;
    }
    default:
      return '请鼓励用户继续坚持盆底肌训练。';
  }
}

export async function POST(req: NextRequest) {
  let body: CoachRequest;
  try {
    body = (await req.json()) as CoachRequest;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body || !body.kind) {
    return NextResponse.json({ error: 'missing kind' }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    // 没配置 key 时降级返回本地预设建议，保证页面可用
    return NextResponse.json({
      advice: localFallback(body),
      fallback: true,
    });
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
      temperature: 0.6,
      max_tokens: 160,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
      ],
    });
    const advice =
      completion.choices?.[0]?.message?.content?.trim() ?? localFallback(body);
    return NextResponse.json({ advice });
  } catch (e) {
    return NextResponse.json({
      advice: localFallback(body),
      fallback: true,
      error: e instanceof Error ? e.message : 'deepseek error',
    });
  }
}

function localFallback(body: CoachRequest): string {
  if (body.kind === 'posture') {
    const snap = body.payload as { issues?: string[] };
    return snap.issues?.[0] ?? '请把脊柱拉长，双肩自然下沉。';
  }
  if (body.kind === 'plan') {
    return '今天先做一组呼吸协同 5 分钟，节奏稳一点会更舒服。';
  }
  return '太棒啦！明天记得呼气时再缓一拍，效果会更好。';
}
