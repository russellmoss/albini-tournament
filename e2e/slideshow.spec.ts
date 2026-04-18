import { test, expect } from "@playwright/test";

test("landing page renders a blurred cover behind the framed card", async ({
  page,
}) => {
  const responses: string[] = [];
  page.on("response", (resp) => {
    const url = resp.url();
    if (url.includes("/covers/") && url.endsWith(".webp")) {
      responses.push(url);
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Albini Invitational/i }),
  ).toBeVisible();

  await page.waitForLoadState("networkidle");
  expect(responses.length).toBeGreaterThan(0);
});
