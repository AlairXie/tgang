# 提肛助手 · tgang-helper

> 科学盆底肌（凯格尔 / Kegel）训练 Web 应用 — 让闭着眼睛的人也能练对。

## 功能

- 🪷 **科学分级课程**：男 / 女 / 通用 × 入门 / 进阶 / 高阶；包含快速收缩、长保持、阶梯收缩、呼吸协同等模式。
- 🌬 **呼吸圈引导动画**：收缩时圆缩小、放松时圆放大，用一个圆讲清节奏。
- 🧍 **人体姿势 SVG 示范**：站立 / 坐姿 / 仰卧 三种体位，盆底高亮显示发力部位。
- 🎙 **语音播报**：基于浏览器 Web Speech API，每个阶段自动报指令；支持静音切换。
- 🧠 **MediaPipe Pose 体位校正**：浏览器本地实时检测站坐姿（耸肩 / 骨盆倾斜 / 头前伸 / 躯干前倾）。
- 🤖 **DeepSeek V4 个性化建议**：当持续姿势异常时，把抽象的"姿态指标数字"（不含图像）发到后端，调用 `deepseek-v4-flash` 生成 1-2 句教练建议并语音播报。
- 📅 **打卡日历 + 统计图**：训练记录全部保存在 localStorage，提供 GitHub 风格热力图、每日时长柱状图、连续打卡。
- 🔒 **隐私优先**：摄像头画面与原始关键点全程仅在浏览器本地处理，不上传任何服务器。

## 技术栈

- [Next.js 15](https://nextjs.org) + App Router + TypeScript
- [Tailwind CSS 3](https://tailwindcss.com) — 自定义健康配色（moss 苔绿 / clay 陶土 / coral 暖红）
- [Framer Motion](https://www.framer.com/motion/) — 阶段切换 / 呼吸圈动画
- [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) — 浏览器端 Pose Landmarker（GPU 加速，CDN 加载）
- [openai](https://www.npmjs.com/package/openai) SDK — 通过 OpenAI 兼容协议调用 DeepSeek V4

## 快速开始

```bash
# 1) 安装依赖
npm install

# 2) 配置 DeepSeek API Key（可选；不配置时 AI 教练会降级为本地预设建议）
cp .env.local.example .env.local
# 编辑 .env.local 填入 DEEPSEEK_API_KEY

# 3) 启动开发服务器
npm run dev
# 浏览器打开 http://localhost:3000
```

## 使用指北

1. 首页选择性别 / 难度，挑一节课。
2. 进入课程介绍页，点击「开始训练」。
3. 听语音、看呼吸圈和人体示范跟练即可。
4. 想要更准确的体态校正，点击右上角「开启摄像头」（首次会下载约 7 MB 的 Pose 模型）。
5. 训练完成后自动打卡，可在「打卡 & 统计」页查看日历和最近训练记录。

## 目录结构

```
src/
  app/
    layout.tsx               # 全局布局
    page.tsx                 # 首页（课程库 + 仪表盘）
    train/[courseId]/page.tsx # 训练页
    history/page.tsx         # 打卡 & 统计
    api/coach/route.ts       # DeepSeek V4 代理 API Route
    globals.css
  components/
    BreathRing.tsx           # 呼吸圈动画
    PoseFigure.tsx           # 人体姿势 SVG
    PoseCorrector.tsx        # 摄像头 + MediaPipe Pose
    SessionPlayer.tsx        # 训练播放器（核心引擎）
    Calendar.tsx             # 打卡热力日历
    StatsChart.tsx           # 训练时长柱状图
    CourseCard.tsx
    Header.tsx
    GenderPicker.tsx
  lib/
    courses.ts               # 课程数据（科学分级）
    types.ts
    speech.ts                # 语音合成封装
    storage.ts               # localStorage + 统计
    pose-analysis.ts         # 姿态评分算法
```

## 训练科学

课程参考 NIH / Mayo Clinic 凯格尔训练指南：

- **快速收缩**（quick contraction）：1s 收 + 2s 放 × 8-12 次 → 锻炼 II 型快肌纤维。
- **持续保持**（long hold）：8-10s 收 + 等长放松 × 4-6 次 → 锻炼 I 型慢肌纤维。
- **阶梯收缩**（laddered）：30% → 60% → 100% 三档力度 → 提升力度的精细控制。
- **呼吸协同**（breath sync）：呼气时收紧、吸气时放松 → 避免憋气与代偿。

每节课都设计了组间休息和动作前后的"准备 / 放松"提示，避免疲劳累积。

## 隐私

- 摄像头视频流仅写入本页面的 `<video>`，由 MediaPipe Pose 在浏览器本地推理。
- 即使开启 AI 教练建议，发送到 `/api/coach` 的也只是抽象的姿态分数与归一化指标（如双肩高度差 0.041），永远不发送图像或原始关键点。
- 训练记录保存在 `localStorage` 的 `tgang.records.v1` 里，清空浏览器数据即可删除。

## 免责声明

本应用不能替代医疗诊断和治疗。如有盆腔疼痛、漏尿、产后等具体健康问题，请咨询专业医生 / 物理治疗师。
