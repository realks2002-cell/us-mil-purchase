"use client";

import { useState } from "react";
import { createUserAction } from "../actions";

export function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await createUserAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-8 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        + 사용자 추가
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <input
        name="name"
        placeholder="이름"
        required
        className="h-8 w-20 rounded border border-input bg-background px-2 text-xs"
      />
      <input
        name="email"
        type="email"
        placeholder="이메일"
        required
        className="h-8 w-40 rounded border border-input bg-background px-2 text-xs"
      />
      <input
        name="password"
        type="password"
        placeholder="비밀번호"
        required
        minLength={8}
        className="h-8 w-24 rounded border border-input bg-background px-2 text-xs"
      />
      <select name="role" className="h-8 rounded border border-input bg-background px-1 text-xs">
        <option value="user">사용자</option>
        <option value="admin">관리자</option>
      </select>
      <button type="submit" className="h-8 rounded bg-primary px-3 text-xs text-primary-foreground">
        추가
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-8 rounded border border-input px-2 text-xs">
        취소
      </button>
    </form>
  );
}
