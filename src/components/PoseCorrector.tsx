'use client';

import { useEffect, useRef, useState } from 'react';
import { analyzePose, PostureCoachTrigger } from '@/lib/pose-analysis';
import type { PostureSnapshot } from '@/lib/types';
import { speak } from '@/lib/speech';

/**
 * 摄像头 + MediaPipe Pose Landmarker 组件。
 * 关键点：
 *  - 通过 CDN 加载 wasm 与模型
 *  - 仅在客户端运行（动态 import 避免 SSR）
 *  - 每帧调用 analyzePose 得到分数
 *  - 当持续不达标，触发 onCoachAdvice 回调（父组件可调用 LLM API）
 *  - 摄像头画面与 landmarks 全程在浏览器本地，不上传图像
 */

interface Props {
  enabled: boolean;
  onSnapshot?: (snap: PostureSnapshot) => void;
  /** 当连续低分时调用，参数为最近的快照 */
  onCoachAdvice?: (snap: PostureSnapshot) => void;
}

export function PoseCorrector({ enabled, onSnapshot, onCoachAdvice }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<unknown>(null);
  const triggerRef = useRef(new PostureCoachTrigger(28, 65, 25_000));

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<PostureSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) {
      stopAll();
      return;
    }
    let cancelled = false;

    async function start() {
      setStatus('loading');
      setError(null);
      try {
        // 动态 import：仅在浏览器端加载，且模型从 CDN 拉取
        const { FilesetResolver, PoseLandmarker } = await import(
          '@mediapipe/tasks-vision'
        );

        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
        );
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            '浏览器不支持摄像头访问。请确保通过 HTTPS 或 localhost 打开本页面（手机访问需要 HTTPS）。',
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if (cancelled) {
          stopAll();
          return;
        }
        setStatus('ready');
        loop();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : '摄像头或 Pose 模型加载失败';
        if (!cancelled) {
          setStatus('error');
          setError(msg);
        }
      }
    }

    function loop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const lm = landmarkerRef.current as
        | {
            detectForVideo: (
              v: HTMLVideoElement,
              ts: number,
            ) => { landmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> };
          }
        | null;
      if (!video || !canvas || !lm) return;
      if (video.readyState >= 2) {
        const ts = performance.now();
        const result = lm.detectForVideo(video, ts);
        const landmarks = result.landmarks?.[0];
        const snapshot = analyzePose(landmarks);
        if (snapshot) {
          setSnap(snapshot);
          onSnapshot?.(snapshot);
          if (triggerRef.current.feed(snapshot)) {
            onCoachAdvice?.(snapshot);
          }
        }
        // 在 canvas 上绘制简单骨架
        drawSkeleton(canvas, video, landmarks);
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    function stopAll() {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const lm = landmarkerRef.current as { close?: () => void } | null;
      lm?.close?.();
      landmarkerRef.current = null;
      triggerRef.current.reset();
      setStatus('idle');
      setSnap(null);
    }

    start();
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <div className="card grain relative overflow-hidden">
      <div className="relative aspect-video w-full bg-ink-900/90">
        <video
          ref={videoRef}
          className="mirror absolute inset-0 h-full w-full object-cover opacity-90"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="mirror pointer-events-none absolute inset-0 h-full w-full"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="pill !text-[10px] !text-white !bg-black/40 !border-white/10">
            🔒 本地推理 · 摄像头不上传
          </span>
          {snap ? (
            <span
              className={`pill !text-[10px] !border-white/10 !bg-black/40 ${
                snap.score >= 80
                  ? '!text-moss-200'
                  : snap.score >= 60
                  ? '!text-clay-200'
                  : '!text-coral-400'
              }`}
            >
              姿势分 {snap.score}
            </span>
          ) : null}
        </div>

        {status === 'loading' && (
          <div className="absolute inset-0 grid place-items-center text-white">
            <div className="text-center">
              <div className="display text-2xl">正在加载姿态模型…</div>
              <div className="mt-1 text-sm opacity-70">首次约需 5–10 秒</div>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 grid place-items-center text-white">
            <div className="text-center">
              <div className="display text-2xl">⚠ 摄像头不可用</div>
              <div className="mt-1 max-w-xs text-sm opacity-80">{error}</div>
            </div>
          </div>
        )}
      </div>

      {snap && snap.issues.length > 0 && status === 'ready' ? (
        <div className="border-t border-ink-900/10 bg-white/70 p-3 text-sm text-ink-700">
          <div className="mb-1 text-xs uppercase tracking-widest text-ink-500">
            实时提醒
          </div>
          <ul className="space-y-0.5">
            {snap.issues.map((i, idx) => (
              <li key={idx}>• {i}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function drawSkeleton(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks?: Array<{ x: number; y: number; z: number; visibility?: number }>,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // 同步 canvas 与 video 尺寸（一次即可，但低成本）
  if (canvas.width !== video.videoWidth && video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) return;

  const conn: [number, number][] = [
    [11, 12],
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16],
    [11, 23],
    [12, 24],
    [23, 24],
    [23, 25],
    [25, 27],
    [24, 26],
    [26, 28],
  ];
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(130, 185, 117, 0.95)';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  conn.forEach(([a, b]) => {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb) return;
    ctx.beginPath();
    ctx.moveTo(la.x * canvas.width, la.y * canvas.height);
    ctx.lineTo(lb.x * canvas.width, lb.y * canvas.height);
    ctx.stroke();
  });
  for (const lm of landmarks) {
    ctx.beginPath();
    ctx.arc(
      lm.x * canvas.width,
      lm.y * canvas.height,
      3.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
