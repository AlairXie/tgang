import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '提肛助手 · 科学盆底肌训练',
  description:
    '科学分级的提肛 / 凯格尔训练课程。呼吸圈引导 + 姿势示范 + AI 体位校正，闭眼也能跟练。',
  keywords: ['Kegel', '凯格尔运动', '盆底肌', '提肛', '产后修复'],
  authors: [{ name: 'tgang-helper' }],
};

export const viewport: Viewport = {
  themeColor: '#5b9b4c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Noto+Serif+SC:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
