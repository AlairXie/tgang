'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Course } from '@/lib/types';

const DIFF_LABEL: Record<Course['difficulty'], string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高阶',
};
const GENDER_LABEL: Record<Course['gender'], string> = {
  male: '男士',
  female: '女士',
  all: '通用',
};
const POSTURE_LABEL: Record<Course['posture'], string> = {
  standing: '站立',
  sitting: '坐姿',
  supine: '仰卧',
};

export function CourseCard({ course, index }: { course: Course; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, ease: 'easeOut', duration: 0.5 }}
    >
      <Link
        href={`/train/${course.id}`}
        className="card grain group relative flex h-full flex-col overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-24px_rgba(46,78,36,0.4)]"
      >
        <div
          className={`absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${course.accent} opacity-50 blur-2xl transition group-hover:opacity-80`}
        />

        <div className="flex flex-wrap gap-2">
          <span className="pill">{DIFF_LABEL[course.difficulty]}</span>
          <span className="pill">{GENDER_LABEL[course.gender]}</span>
          <span className="pill">{POSTURE_LABEL[course.posture]}</span>
        </div>

        <h3 className="display mt-5 text-2xl leading-tight text-ink-900">
          {course.name}
        </h3>
        <div className="mt-1 text-sm text-ink-600">{course.tagline}</div>

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-700/90">
          {course.description}
        </p>

        <div className="mt-auto pt-6 flex items-center justify-between text-sm">
          <span className="text-ink-500">
            ⏱ 约 {Math.round(course.estimatedSeconds / 60)} 分钟
          </span>
          <span className="text-ink-900 transition group-hover:translate-x-1">
            开始训练 →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
