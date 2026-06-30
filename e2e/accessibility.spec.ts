import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const apiURL = process.env.API_URL ?? "http://127.0.0.1:3000/api";

const authenticatedRoutes = [
  { path: "/dashboard", name: "Главная" },
  { path: "/availability", name: "Доступность" },
  { path: "/book", name: "Бронирование" },
  { path: "/meetings", name: "Встречи" },
  { path: "/groups", name: "Группы" },
  { path: "/profile", name: "Профиль" },
  { path: "/access", name: "Доступ" },
];

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoAccessibilityViolations(page: Page, pageName: string) {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();

  expect(
    results.violations,
    formatViolations(pageName, results.violations),
  ).toEqual([]);
}

function formatViolations(
  pageName: string,
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  if (violations.length === 0) {
    return `${pageName}: accessibility violations were not found.`;
  }

  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map(
          (node) => `    - ${node.target.join(", ")}: ${node.failureSummary}`,
        )
        .join("\n");

      return [
        `${pageName}: ${violation.id} (${violation.impact ?? "unknown"})`,
        `  ${violation.help}`,
        `  ${violation.helpUrl}`,
        nodes,
      ].join("\n");
    })
    .join("\n\n");
}

test.describe("accessibility", () => {
  test("login page has no WCAG A/AA axe violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expectNoAccessibilityViolations(page, "Login");
  });

  test("authenticated pages have no WCAG A/AA axe violations", async ({
    page,
    request,
  }) => {
    const loginResponse = await request.post(`${apiURL}/auth/dev-login`);
    expect(loginResponse.ok()).toBeTruthy();

    const { token } = (await loginResponse.json()) as { token: string };

    await page.addInitScript((authToken) => {
      window.localStorage.setItem("auth_token", authToken);
    }, token);

    for (const route of authenticatedRoutes) {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      await expectNoAccessibilityViolations(page, route.name);
    }
  });
});
