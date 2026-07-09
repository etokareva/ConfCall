import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

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

const publicRoutes = [
  { path: "/", name: "Главная публичная" },
  { path: "/login", name: "Login" },
  {
    path: "/verify-email?token=invalid-a11y-token",
    name: "Подтверждение email",
  },
  { path: "/reset-password?token=invalid-a11y-token", name: "Сброс пароля" },
  { path: "/invite?token=invalid-a11y-token", name: "Приглашение" },
  {
    path: "/book/cancel/invalid-a11y-token",
    name: "Отмена публичной встречи",
  },
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

async function devLogin(request: APIRequestContext) {
  const loginResponse = await request.post(`${apiURL}/auth/dev-login`);
  expect(loginResponse.ok()).toBeTruthy();

  return (await loginResponse.json()) as {
    token: string;
    user: { id: number; email: string; name: string };
  };
}

async function preparePublicBookingPath(request: APIRequestContext) {
  const { token, user } = await devLogin(request);
  const headers = { Authorization: `Bearer ${token}` };

  const groupsResponse = await request.get(`${apiURL}/groups`, { headers });
  expect(groupsResponse.ok()).toBeTruthy();

  const groups = (await groupsResponse.json()) as {
    id: number;
    name: string;
    members: { id: number; email: string; name: string }[];
  }[];
  let group = groups[0];

  if (!group) {
    const createGroupResponse = await request.post(`${apiURL}/groups`, {
      headers,
      data: { name: "A11y test group" },
    });
    expect(createGroupResponse.ok()).toBeTruthy();
    group = (await createGroupResponse.json()) as typeof group;
  }

  const usersResponse = await request.get(`${apiURL}/groups/${group.id}/users`, {
    headers,
  });
  expect(usersResponse.ok()).toBeTruthy();

  const users = (await usersResponse.json()) as {
    id: number;
    email: string;
    name: string;
  }[];
  const participantId = users[0]?.id ?? user.id;

  const linkResponse = await request.post(`${apiURL}/booking/links`, {
    headers,
    data: {
      groupId: group.id,
      participantIds: [participantId],
      title: "A11y public booking",
      description: "Accessibility audit fixture",
      durationMinutes: 30,
    },
  });
  expect(linkResponse.ok()).toBeTruthy();

  const link = (await linkResponse.json()) as { slug: string };
  return `/book/${link.slug}`;
}

test.describe("accessibility", () => {
  test("public pages have no WCAG A/AA axe violations", async ({
    page,
    request,
  }) => {
    const publicBookingPath = await preparePublicBookingPath(request);

    for (const route of [
      ...publicRoutes,
      { path: publicBookingPath, name: "Публичное бронирование" },
    ]) {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      await expectNoAccessibilityViolations(page, route.name);
    }
  });

  test("authenticated pages have no WCAG A/AA axe violations", async ({
    page,
    request,
  }) => {
    const { token } = await devLogin(request);

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
