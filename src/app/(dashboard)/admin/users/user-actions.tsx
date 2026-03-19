"use client";

import { updateRoleAction, toggleActiveAction } from "../actions";

interface Props {
  userId: string;
  isActive: boolean;
  role: string;
}

export function UserActions({ userId, isActive, role }: Props) {
  return (
    <div className="flex items-center gap-1">
      <select
        defaultValue={role}
        onChange={(e) => updateRoleAction(userId, e.target.value as "admin" | "user")}
        aria-label="역할 변경"
        className="h-7 rounded border border-input bg-background px-1 text-xs"
      >
        <option value="user">사용자</option>
        <option value="admin">관리자</option>
      </select>
      <button
        onClick={() => toggleActiveAction(userId)}
        className={`h-7 rounded px-2 text-xs ${
          isActive
            ? "text-destructive hover:bg-destructive/10"
            : "text-success hover:bg-success/10"
        }`}
      >
        {isActive ? "비활성화" : "활성화"}
      </button>
    </div>
  );
}
