"use client";

import { useState } from "react";
import { loginAction } from "./action";

export default function LoginPage() {
  return <LoginForm />;
}

function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setLoading(false);
      setError(result.error);
    }
    // 성공 시 서버 액션의 redirectTo가 자동 리다이렉트 처리
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            US
          </div>
          <h1 className="mt-4 text-2xl font-bold">USFK Procurement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            주한미군 입찰 정보 인텔리전스 플랫폼
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8">
          <div className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <span className="text-primary">관리자에게 요청</span>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          본 시스템은 인가된 사용자만 접근할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
