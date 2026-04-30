'use client';

/**
 * 浏览器语音合成（Web Speech API）封装。
 * - 自动选用中文女声（如有）
 * - 提供节流：避免同一文本连续重复打断
 * - 静音开关
 */

let preferred: SpeechSynthesisVoice | null = null;
let lastSpoken = '';
let lastSpokenAt = 0;
let muted = false;

const isClient = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isClient()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const zhVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith('zh'),
  );
  const female = zhVoices.find((v) => /female|女|xiao|yun|hui/i.test(v.name));
  return female ?? zhVoices[0] ?? voices[0];
}

export function initSpeech() {
  if (!isClient()) return;
  preferred = pickVoice();
  if (!preferred) {
    window.speechSynthesis.onvoiceschanged = () => {
      preferred = pickVoice();
    };
  }
}

export function setMuted(value: boolean) {
  muted = value;
  if (muted && isClient()) window.speechSynthesis.cancel();
}

export function isMuted() {
  return muted;
}

/**
 * 播报一段文本。
 * @param text 要播报的中文短句
 * @param opts.priority 'normal'|'urgent' urgent 会先取消队列
 * @param opts.rate 语速 0.5~2，默认 1
 * @param opts.dedupeMs 同一文本去重间隔（ms）
 */
export function speak(
  text: string,
  opts: {
    priority?: 'normal' | 'urgent';
    rate?: number;
    pitch?: number;
    dedupeMs?: number;
  } = {},
) {
  if (!isClient() || muted || !text) return;

  const dedupeMs = opts.dedupeMs ?? 1500;
  const now = Date.now();
  if (text === lastSpoken && now - lastSpokenAt < dedupeMs) return;
  lastSpoken = text;
  lastSpokenAt = now;

  if (opts.priority === 'urgent') window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  if (preferred) u.voice = preferred;
  u.rate = opts.rate ?? 1;
  u.pitch = opts.pitch ?? 1;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if (!isClient()) return;
  window.speechSynthesis.cancel();
}
