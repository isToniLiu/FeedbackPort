import type { ReactNode } from "react";

export const metadata = {
  title: "FeedbackPort",
  description: "面向独立开发者的多产品用户反馈管理系统",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
