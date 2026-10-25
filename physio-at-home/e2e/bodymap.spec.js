import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/physiotherapists**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
});

test('homepage renders the interactive body-area guide', async ({ page }) => {
  await page.goto('/');
  const guide = page.locator('#body-guide');
  await expect(guide).toBeVisible();
  await expect(guide.getByText('UNDERSTAND YOUR PAIN', { exact: true })).toBeVisible();
  await expect(guide.getByRole('heading', { name: /Start with the spot/ })).toBeVisible();
  await expect(guide.getByRole('group', { name: 'Body view' })).toBeVisible();
  await expect(guide.getByRole('button', { name: 'Front' })).toBeVisible();
  await expect(guide.getByRole('button', { name: 'Back' })).toBeVisible();
  await expect(guide.getByRole('group', { name: 'Body areas' })).toBeVisible();
});

test('body guide switches between front and back views', async ({ page }) => {
  await page.goto('/');
  const guide = page.locator('#body-guide');
  await expect(guide).toBeVisible();
  await guide.getByRole('button', { name: 'Back' }).click();
  await expect(guide.getByRole('button', { name: 'Back' })).toHaveAttribute('aria-pressed', 'true');
  await guide.getByRole('button', { name: 'Front' }).click();
  await expect(guide.getByRole('button', { name: 'Front' })).toHaveAttribute('aria-pressed', 'true');
});
