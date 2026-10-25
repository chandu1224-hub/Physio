import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/physiotherapists**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
});

const section = (page) => page.locator('#body-guide');

test('body guide starts with no area selected and shows guidance', async ({ page }) => {
  await page.goto('/');
  await expect(section(page).getByText('Choose an area to begin')).toBeVisible();
  await expect(section(page).getByText(/General information only/)).toBeVisible();
});

test('selecting an area lists common causes and a see-a-doctor note', async ({ page }) => {
  await page.goto('/');
  // Knee is drawn as two shapes (left and right). Click one shape; the centre of the whole group sits between them.
  await section(page).locator('svg.bm-svg [aria-label="Knee"] circle').first().click();
  await expect(section(page).getByRole('heading', { name: 'Knee' })).toBeVisible();
  const cause = section(page).getByText('Knee osteoarthritis');
  await expect(cause).toBeVisible();
  await cause.click();
  await expect(section(page).getByText(/Gradual wear of the joint surfaces/)).toBeVisible();
  await expect(section(page).getByText(/See a doctor promptly/)).toBeVisible();
});

test('back view offers back areas and choosing a front-only area switches the view', async ({ page }) => {
  await page.goto('/');
  const svg = section(page).locator('svg.bm-svg');
  await expect(svg.getByRole('button', { name: 'Chest' })).toBeVisible();
  await expect(svg.getByRole('button', { name: 'Lower back' })).toHaveCount(0);

  await section(page).getByRole('button', { name: 'Back', exact: true }).click();
  await expect(svg.getByRole('button', { name: 'Lower back' })).toBeVisible();
  await expect(svg.getByRole('button', { name: 'Chest' })).toHaveCount(0);

  await section(page).locator('.bm-chip', { hasText: 'Chest' }).click();
  await expect(svg.getByRole('button', { name: 'Chest' })).toBeVisible();
  await expect(section(page).getByText(/Chest pain should never be assumed to be muscular/)).toBeVisible();
});

test('diagram regions work from the keyboard', async ({ page }) => {
  await page.goto('/');
  const region = section(page).locator('svg.bm-svg').getByRole('button', { name: 'Neck' });
  await region.focus();
  await page.keyboard.press('Enter');
  await expect(section(page).getByRole('heading', { name: 'Neck' })).toBeVisible();
  await expect(region).toHaveAttribute('aria-pressed', 'true');
});

test('find a physio opens the existing Get started modal', async ({ page }) => {
  await page.goto('/');
  await section(page).locator('.bm-chip', { hasText: 'Lower back' }).click();
  await section(page).getByRole('button', { name: /Find a physio near you/ }).click();
  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toBeVisible();
});
