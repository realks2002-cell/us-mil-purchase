import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth-state.json");

test("로그인 성공 및 세션 생성", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@admin.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "authjs.session-token")).toBe(true);
  await page.context().storageState({ path: authFile });
});

test("잘못된 비밀번호로 로그인 실패", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@admin.com");
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=올바르지 않습니다")).toBeVisible();
});

test.describe("인증 후 페이지 접근", () => {
  test.use({ storageState: authFile });

  for (const p of [
    { name: "맞춤 필터", path: "/filters" },
    { name: "알림", path: "/notifications" },
    { name: "시스템 설정", path: "/admin/settings" },
  ]) {
    test(`${p.name} (${p.path}) 접근 가능`, async ({ page }) => {
      const res = await page.goto(p.path, { timeout: 15_000, waitUntil: "domcontentloaded" });
      expect(page.url()).not.toContain("/login");
      expect(res?.status()).toBeLessThan(400);
    });
  }
});

test.describe("Cron 엔드포인트 인증", () => {
  test("sync-awards 인증 없이 401", async ({ request }) => {
    expect((await request.get("/api/cron/sync-awards")).status()).toBe(401);
  });

  test("sync-awards 잘못된 토큰 401", async ({ request }) => {
    expect(
      (await request.get("/api/cron/sync-awards", {
        headers: { Authorization: "Bearer wrong" },
      })).status()
    ).toBe(401);
  });

  test("sync-opportunities 인증 없이 401", async ({ request }) => {
    expect((await request.get("/api/cron/sync-opportunities")).status()).toBe(401);
  });
});
