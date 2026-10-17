import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load landing page and show content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByText("TanStack Start template")).toBeVisible();
    // The primary CTA is the in-app sign-up path, not an external docs link.
    const cta = page.getByRole("link", { name: /get started/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/signup");
  });
});
