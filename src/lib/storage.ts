'use client';

import type { SessionRecord } from './types';

const KEY = 'tgang.records.v1';
const PREF_KEY = 'tgang.prefs.v1';

export interface UserPrefs {
  gender?: 'male' | 'female';
  muteVoice?: boolean;
  cameraOn?: boolean;
  /** 用户自填的目标天数 */
  goalDays?: number;
}

const isClient = () => typeof window !== 'undefined';

export function loadRecords(): SessionRecord[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SessionRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveRecord(rec: SessionRecord) {
  if (!isClient()) return;
  const all = loadRecords();
  all.push(rec);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function loadPrefs(): UserPrefs {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? (JSON.parse(raw) as UserPrefs) : {};
  } catch {
    return {};
  }
}

export function savePrefs(p: UserPrefs) {
  if (!isClient()) return;
  const cur = loadPrefs();
  localStorage.setItem(PREF_KEY, JSON.stringify({ ...cur, ...p }));
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 计算连续打卡天数 */
export function calcStreak(records: SessionRecord[]): number {
  if (!records.length) return 0;
  const set = new Set(records.map((r) => r.date));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    if (set.has(iso)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calcStats(records: SessionRecord[]) {
  const totalSessions = records.length;
  const totalSeconds = records.reduce((s, r) => s + r.durationSec, 0);
  const days = new Set(records.map((r) => r.date)).size;
  return {
    totalSessions,
    totalMinutes: Math.round(totalSeconds / 60),
    daysActive: days,
    streak: calcStreak(records),
  };
}
