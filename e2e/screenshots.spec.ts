import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const apiURL = process.env.API_URL ?? "http://127.0.0.1:3000/api";
const screenshotDir = "artifacts/screenshots";

const authenticatedRoutes = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/availability", name: "availability" },
  { path: "/book", name: "book" },
  { path: "/meetings", name: "meetings" },
  { path: "/settings", name: "settings" },
];

test.beforeAll(async () => {
  await mkdir(screenshotDir, { recursive: true });
});

test("capture app screenshots", async ({ page, request }) => {
  const loginResponse = await request.post(`${apiURL}/auth/dev-login`);
  expect(loginResponse.ok()).toBeTruthy();

  const { token } = (await loginResponse.json()) as { token: string };

  await page.goto("/login");
  await page.screenshot({
    path: `${screenshotDir}/login.png`,
    fullPage: true,
  });

  await page.addInitScript((authToken) => {
    window.localStorage.setItem("auth_token", authToken);
  }, token);

  for (const route of authenticatedRoutes) {
    await page.goto(route.path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: `${screenshotDir}/${route.name}.png`,
      fullPage: true,
    });
  }
});
