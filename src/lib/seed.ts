import "dotenv/config";
import { hash } from "bcryptjs";
import { getDb } from "./db";
import { users } from "./db/schema";

async function seed() {
  if (process.env.NODE_ENV === "production") {
    console.error("프로덕션 환경에서는 seed를 실행할 수 없습니다.");
    process.exit(1);
  }

  const db = getDb();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin1234!";
  const userPassword = process.env.SEED_USER_PASSWORD || "user1234!";

  await db
    .insert(users)
    .values({
      email: "admin@usfk-procurement.kr",
      name: "관리자",
      passwordHash: await hash(adminPassword, 12),
      role: "admin",
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  await db
    .insert(users)
    .values({
      email: "user@usfk-procurement.kr",
      name: "김대리",
      passwordHash: await hash(userPassword, 12),
      role: "user",
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  console.log("시드 데이터 생성 완료");
  process.exit(0);
}

seed().catch((e) => {
  console.error("시드 실패:", e);
  process.exit(1);
});
