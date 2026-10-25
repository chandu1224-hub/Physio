import { test, expect } from '@playwright/test';

const api = 'https://e2e-test-project.supabase.co/rest/v1/physiotherapists**';

const base = {
  initials: 'TP', title: 'Physiotherapist', degree: 'BPT', experience_years: 5,
  specialties: ['Back & neck pain'], conditions: ['Back pain'], services: ['Home visit'],
  languages: ['English'], bio: 'Test-only provider profile.', price: 500,
  availability: 'Availability to be confirmed', rating: 4.5, reviews: 2, emoji: '🧑‍⚕️',
  color: 'sage', featured: false, status: 'published', service_radius_km: 10,
};

// Test-only fixtures. "indiranagar" is deliberately duplicated in a different case to prove de-duplication.
const providers = [
  { ...base, id: 'p1', name: 'Dr. Alpha Test', display_order: 1, service_location: 'Indiranagar, Bengaluru, Karnataka, India', service_areas: ['Indiranagar', 'HSR Layout'] },
  { ...base, id: 'p2', name: 'Dr. Beta Test', display_order: 2, service_location: 'Whitefield, Bengaluru, Karnataka, India', service_areas: ['indiranagar'] },
];

async function mockProviders(page, { status = 200, body = providers } = {}) {
  await page.route(api, (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }));
}

async function openFindModal(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^Find nearby physio/ }).first().click();
  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toBeVisible();
}

test('location selector is a non-editable dropdown that lists each configured area once', async ({ page }) => {
  await mockProviders(page);
  await openFindModal(page);

  const selector = page.locator('#start-location-search');
  await expect(selector).toBeVisible();
  // It must be a button, never a text field, so visitors cannot type arbitrary locations.
  await expect(selector).toHaveJSProperty('tagName', 'BUTTON');
  await expect(page.locator('input#start-location-search')).toHaveCount(0);
  await expect(page.getByRole('listbox')).toHaveCount(0);

  await selector.click();
  const list = page.getByRole('listbox', { name: /service areas/i });
  await expect(list).toBeVisible();
  const options = list.getByRole('option');
  await expect(options).toHaveText(['HSR Layout', 'Indiranagar', 'Whitefield']);
});

test('dropdown closes with Escape and re-opens from the keyboard', async ({ page }) => {
  await mockProviders(page);
  await openFindModal(page);

  const selector = page.locator('#start-location-search');
  await selector.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(selector).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(selector).toHaveAttribute('aria-expanded', 'false');
});

test('choosing an area with one provider opens that provider profile', async ({ page }) => {
  await mockProviders(page);
  await openFindModal(page);

  await page.locator('#start-location-search').click();
  await page.getByRole('option', { name: 'Whitefield' }).click();

  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toHaveCount(0);
  await expect(page.locator('.profile-modal').getByRole('heading', { name: 'Dr. Beta Test' })).toBeVisible();
});

test('choosing an area with several providers lists them all', async ({ page }) => {
  await mockProviders(page);
  await openFindModal(page);

  await page.locator('#start-location-search').click();
  await page.getByRole('option', { name: 'Indiranagar' }).click();

  const results = page.locator('.start-results-list');
  await expect(results.getByRole('heading', { name: 'Dr. Alpha Test' })).toBeVisible();
  await expect(results.getByRole('heading', { name: 'Dr. Beta Test' })).toBeVisible();
});

test('closing the modal discards an open dropdown', async ({ page }) => {
  await mockProviders(page);
  await openFindModal(page);

  await page.locator('#start-location-search').click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('button', { name: 'Close Get started dialog' }).click();
  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toHaveCount(0);
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('empty provider list shows the no-areas message instead of a broken list', async ({ page }) => {
  await mockProviders(page, { body: [] });
  await openFindModal(page);

  await page.locator('#start-location-search').click();
  await expect(page.getByText(/No service areas are available yet/i)).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(0);
});

test('a failing provider query shows no areas and does not crash the modal', async ({ page }) => {
  await mockProviders(page, { status: 401, body: { message: 'permission denied for table physiotherapists' } });
  await openFindModal(page);

  await page.locator('#start-location-search').click();
  await expect(page.getByText(/No service areas are available yet/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How would you like to find a physio?' })).toBeVisible();
});
