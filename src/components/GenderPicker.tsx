'use client';

import { useEffect, useState } from 'react';
import { loadPrefs, savePrefs } from '@/lib/storage';

export type GenderChoice = 'male' | 'female' | 'all';

export function GenderPicker({
  value,
  onChange,
}: {
  value: GenderChoice;
  onChange: (v: GenderChoice) => void;
}) {
  const opts: { id: GenderChoice; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'male', label: '男士' },
    { id: 'female', label: '女士' },
  ];
  return (
    <div className="inline-flex rounded-full border border-ink-900/15 bg-white/70 p-1 backdrop-blur">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => {
            onChange(o.id);
            if (o.id !== 'all') savePrefs({ gender: o.id });
          }}
          className={[
            'rounded-full px-4 py-1.5 text-sm transition',
            value === o.id
              ? 'bg-ink-900 text-ink-50 shadow-soft'
              : 'text-ink-600 hover:text-ink-900',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function useStoredGender(): [GenderChoice, (v: GenderChoice) => void] {
  const [g, setG] = useState<GenderChoice>('all');
  useEffect(() => {
    const p = loadPrefs();
    if (p.gender) setG(p.gender);
  }, []);
  return [g, setG];
}
