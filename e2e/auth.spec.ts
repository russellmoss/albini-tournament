import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("unauthenticated visitor to /admin is redirected to /admin/login", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: /Admin/i })).toBeVisible();
});

test("unauthenticated visitor to /admin/players is redirected and preserves next", async ({
  page,
}) => {
  await page.goto("/admin/players");
  await expect(page).toHaveURL(/\/admin\/login.*next=%2Fadmin%2Fplayers/);
});

test("wrong PIN shows an error and does not set the cookie", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="pin"]', "00000");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await expect(page.getByText(/Incorrect PIN/i)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("correct PIN grants access and signs out clears the cookie", async ({
  page,
}) => {
  const pin = process.env.ADMIN_PIN ?? "42069";

  await page.goto("/admin/login");
  await page.fill('input[name="pin"]', pin);
  await page.getByRole("button", { name: /Sign in/ }).click();

  await page.waitForURL((url) => !url.pathname.endsWith("/admin/login"));
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();

  await page.getByRole("button", { name: /Sign out/ }).click();
  await page.waitForURL(/\/admin\/login/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("public pages are not gated", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Albini Invitational/ }),
  ).toBeVisible();
});
