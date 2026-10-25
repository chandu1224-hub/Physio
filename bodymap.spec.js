import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/physiotherapists**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
});

const section = (page) => page.locator('#body-guide');
const figure = (page) => section(page).locator('svg.bm-svg');
const dialog = (page) => page.getByRole('dialog');

test('body guide starts with no area selected and no popup', async ({ page }) => {
  await page.goto('/');
  await expect(section(page).getByText('Choose an area to begin')).toBeVisible();
  await expect(section(page).getByText(/General information only/)).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
});

test('tapping a body part highlights it and opens the details popup', async ({ page }) => {
  await page.goto('/');
  const knee = figure(page).getByRole('button', { name: /^Knee/ }).first();
  await knee.click();
  await expect(dialog(page).getByRole('heading', { name: 'Knee' })).toBeVisible();
  await expect(knee).toHaveAttribute('aria-pressed', 'true');
  const cause = dialog(page).getByText('Knee osteoarthritis');
  await expect(cause).toBeVisible();
  await cause.click();
  await expect(dialog(page).getByText(/Gradual wear of the joint surfaces/)).toBeVisible();
  await expect(dialog(page).getByText(/See a doctor promptly/)).toBeVisible();
});

test('popup closes with Escape and the close button', async ({ page }) => {
  await page.goto('/');
  await section(page).locator('.bm-chip', { hasText: 'Thigh' }).click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await section(page).locator('.bm-chip', { hasText: 'Thigh' }).click();
  await dialog(page).getByRole('button', { name: 'Close details' }).click();
  await expect(dialog(page)).toHaveCount(0);
});

test('back view offers back areas and choosing a front-only area switches the view', async ({ page }) => {
  await page.goto('/');
  const svg = figure(page);
  await expect(svg.getByRole('button', { name: 'Chest' })).toBeVisible();
  await expect(svg.getByRole('button', { name: 'Lower back' })).toHaveCount(0);

  await section(page).getByRole('button', { name: 'Back', exact: true }).click();
  await expect(svg.getByRole('button', { name: 'Lower back' })).toBeVisible();
  await expect(svg.getByRole('button', { name: 'Chest' })).toHaveCount(0);

  await section(page).locator('.bm-chip', { hasText: 'Chest' }).click();
  await expect(svg.getByRole('button', { name: 'Chest' })).toBeVisible();
  await expect(dialog(page).getByText(/Chest pain should never be assumed to be muscular/)).toBeVisible();
});

test('diagram regions work from the keyboard', async ({ page }) => {
  await page.goto('/');
  const region = figure(page).getByRole('button', { name: 'Neck' });
  await region.focus();
  await page.keyboard.press('Enter');
  await expect(dialog(page).getByRole('heading', { name: 'Neck' })).toBeVisible();
  await expect(region).toHaveAttribute('aria-pressed', 'true');
});

test('find a physio opens the existing Get started modal', async ({ page }) => {
  await page.goto('/');
  await section(page).locator('.bm-chip', { hasText: 'Lower back' }).click();
  await dialog(page).getByRole('button', { name: /Find a physio for lower back pain/ }).click();
  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toBeVisible();
  await expect(page.getByText(/Looking for help with:/)).toContainText('lower back pain');
});

test('opening Get started from the hero does not carry a body area', async ({ page }) => {
  await page.goto('/');
  await section(page).locator('.bm-chip', { hasText: 'Knee' }).click();
  await dialog(page).getByRole('button', { name: /Find a physio for knee pain/ }).click();
  await expect(page.getByText(/Looking for help with:/)).toBeVisible();
  await page.getByRole('button', { name: 'Close Get started dialog' }).click();
  await page.getByRole('button', { name: /Find nearby physio/ }).first().click();
  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toBeVisible();
  await expect(page.getByText(/Looking for help with:/)).toHaveCount(0);
});

test('popup traps focus and returns it to the tapped region on close', async ({ page }) => {
  await page.goto('/');
  const region = figure(page).getByRole('button', { name: 'Neck' });
  await region.focus();
  await page.keyboard.press('Enter');
  await expect(dialog(page).getByRole('button', { name: 'Close details' })).toBeFocused();
  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'));
    expect(inside).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect(region).toBeFocused();
});
