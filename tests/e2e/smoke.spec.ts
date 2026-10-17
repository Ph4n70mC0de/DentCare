import { test, expect } from '@playwright/test';

test.describe('DentCare frontend smoke', () => {
  test('app loads and shows DentCare brand', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('DentCare').first()).toBeVisible();
  });

  test('role switcher changes sidebar section label', async ({ page }) => {
    await page.goto('/');
    const roleSelect = page.getByLabel('Switch User Persona Role');
    await expect(roleSelect).toBeVisible();

    await roleSelect.selectOption('patient');
    await expect(page.getByText('Patient Services')).toBeVisible();

    await roleSelect.selectOption('front_desk');
    await expect(page.getByText('Reception Desk')).toBeVisible();

    await roleSelect.selectOption('dentist');
    await expect(page.getByText('Clinical Workspace')).toBeVisible();

    await roleSelect.selectOption('admin');
    await expect(page.getByText('Administration')).toBeVisible();
  });

  test('patient can navigate to the booking view', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Switch User Persona Role').selectOption('patient');

    // On mobile the sidebar is a drawer; open it first so the nav button is reachable.
    const menuToggle = page.getByLabel('Toggle Navigation');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
    }

    await page
      .getByRole('navigation')
      .getByRole('button', { name: 'Book Appointment' })
      .click();
    await expect(
      page.getByText(/Select Dental Service|Book an Appointment|Patient Summary/i)
    ).toBeVisible();
  });
});
