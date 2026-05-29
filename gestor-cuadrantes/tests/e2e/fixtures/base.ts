import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAs } from "../helpers/auth-utils";

export const test = base.extend<{
  adminPage: Page;
  projectAdminPage: Page;
  viewerPage: Page;
  superViewerPage: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, "super_admin");
    await use(page);
    await page.close();
  },
  projectAdminPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, "project_admin");
    await use(page);
    await page.close();
  },
  viewerPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, "viewer");
    await use(page);
    await page.close();
  },
  superViewerPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, "super_viewer");
    await use(page);
    await page.close();
  },
});

export { expect } from "@playwright/test";
