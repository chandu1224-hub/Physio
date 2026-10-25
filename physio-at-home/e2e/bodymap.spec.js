import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/physiotherapists**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
});

test('homepage no longer renders the Understand Your Pain body guide', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('UNDERSTAND YOUR PAIN', { exact: true })).toHaveCount(0);
  await expect(page.locator('#body-guide')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Care, without the extra steps.' })).toBeVisible();
});
