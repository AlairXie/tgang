'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
      <Link href="/" className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-ink-900 text-ink-50 shadow-soft">
          <span className="display text-xl">提</span>
        </div>
        <div>
          <div className="display text-xl leading-none text-ink-900">
            提肛助手
          </div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-ink-500">
            Pelvic · Floor · Lab
          </div>
        </div>
      </Link>

      <nav className="flex items-center gap-2 text-sm">
        <Link href="/" className="btn-ghost">
          课程
        </Link>
        <Link href="/history" className="btn-ghost">
          打卡 & 统计
        </Link>
        <Link
          href="https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/kegel-exercises/art-20045283"
          target="_blank"
          className="hidden text-ink-500 hover:text-ink-900 sm:inline"
        >
          科普
        </Link>
      </nav>
    </header>
  );
}
