import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/physiotherapists**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
});

test('homepage replaces the old pain guide with the approved interactive SVG guide', async ({ page }) => {
  await page.goto('/');
  const guide = page.locator('#body-guide');
  await expect(guide).toBeVisible();
  await expect(guide.getByRole('heading', { name: 'Where does it hurt?' })).toBeVisible();
  await expect(guide.getByText('UNDERSTAND YOUR PAIN', { exact: true })).toHaveCount(0);
  await expect(guide.getByRole('group', { name: 'Body view' })).toBeVisible();
  await expect(guide.getByRole('button', { name: 'Front', exact: true })).toBeVisible();
  await expect(guide.getByRole('button', { name: 'Back', exact: true })).toBeVisible();
  await expect(guide.getByRole('group', { name: 'Body areas' })).toBeVisible();
});

test('body guide switches views and opens an area details popup', async ({ page }) => {
  await page.goto('/');
  const guide = page.locator('#body-guide');
  await guide.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(guide.getByRole('button', { name: 'Back', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await guide.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(guide.getByRole('button', { name: 'Front', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await guide.getByRole('group', { name: 'Body map' }).getByRole('button', { name: 'Neck', exact: true }).click();
  const popup = page.getByRole('dialog', { name: 'Neck' });
  await expect(popup).toBeVisible();
  await expect(popup.getByText('Muscles and structures: Neck flexors, trapezius')).toBeVisible();
  await popup.getByRole('button', { name: 'Neck strain' }).click();
  await expect(popup.getByText('Overworked neck muscles; usually eases with movement and posture changes.')).toBeVisible();
  await popup.getByRole('button', { name: 'Find a physio for neck pain' }).click();
  await expect(page.getByText('Looking for help with: neck pain')).toBeVisible();
});
