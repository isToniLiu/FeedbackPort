import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>FeedbackPort</h1>
      <p>
        <Link href="/board">公开面板</Link> · <Link href="/login">管理后台登录</Link>
      </p>
      <p>
        进度见{" "}
        <a href="https://github.com/isToniLiu/feedbackport/blob/main/docs/ROADMAP.md">docs/ROADMAP.md</a> 的
        Phase 0 checklist。
      </p>
    </main>
  );
}
