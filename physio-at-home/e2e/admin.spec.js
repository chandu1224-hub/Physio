import { test, expect } from '@playwright/test';

const project = 'https://e2e-test-project.supabase.co';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'e2e-admin-test@example.com',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z',
};

async function signInAsTestUser(page) {
  await page.route(`${project}/auth/v1/token**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'e2e-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'e2e-refresh-token',
        user,
      }),
    });
  });
  await page.route(`${project}/auth/v1/user**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
  });

  await page.goto('/admin');
  await page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill('test-only-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('admin route denies a signed-in user without an admins membership row', async ({ page }) => {
  await page.route(`${project}/rest/v1/admins**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await signInAsTestUser(page);
  await expect(page.getByRole('heading', { name: 'No admin access' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(new RegExp(user.email))).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin panel' })).toHaveCount(0);
});

test('admin route distinguishes membership lookup failure from confirmed non-admin', async ({ page }) => {
  await page.route(`${project}/rest/v1/admins**`, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Simulated admin lookup failure' }),
    });
  });

  await signInAsTestUser(page);
  await expect(page.getByRole('heading', { name: 'Could not verify admin access' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/could not verify your admin permissions/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No admin access' })).toHaveCount(0);
});

test('admin route opens the manager for a user with an admins membership row', async ({ page }) => {
  await page.route(`${project}/rest/v1/admins**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ user_id: user.id }]),
    });
  });
  await page.route(`${project}/rest/v1/physiotherapists**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await signInAsTestUser(page);
  await expect(page.getByRole('heading', { name: 'Admin panel' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(user.email)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add physiotherapist' })).toBeVisible();
  await expect(page.getByText('No records in physiotherapists yet.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No admin access' })).toHaveCount(0);
});

test('authorized admin can switch between booking and therapist application queues', async ({ page }) => {
  await page.route(`${project}/rest/v1/admins**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ user_id: user.id }]),
    });
  });
  for (const table of ['physiotherapists', 'booking_requests', 'therapist_applications']) {
    await page.route(`${project}/rest/v1/${table}**`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  }

  await signInAsTestUser(page);
  await expect(page.getByRole('heading', { name: 'Admin panel' })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'booking_requests' }).click();
  await expect(page.getByText('No records in booking_requests yet.')).toBeVisible();

  await page.getByRole('button', { name: 'therapist_applications' }).click();
  await expect(page.getByText('No records in therapist_applications yet.')).toBeVisible();

  await page.getByRole('button', { name: 'physiotherapists' }).click();
  await expect(page.getByText('No records in physiotherapists yet.')).toBeVisible();
});

test('admin requires a physiotherapist name before saving a new profile', async ({ page }) => {
  await page.route(`${project}/rest/v1/admins**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ user_id: user.id }]),
    });
  });

  let insertAttempted = false;
  await page.route(`${project}/rest/v1/physiotherapists**`, async (route) => {
    if (route.request().method() === 'POST') insertAttempted = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await signInAsTestUser(page);
  await expect(page.getByRole('heading', { name: 'Admin panel' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Add physiotherapist' }).click();
  await expect(page.getByRole('heading', { name: 'Add record' })).toBeVisible();

  const nameInput = page.getByLabel('name', { exact: true });
  await expect(nameInput).toBeVisible();
  // Change the controlled React value before clearing it; filling an already-empty
  // input can be a no-op and may not exercise the onChange validation path.
  await nameInput.fill('Temporary profile');
  await nameInput.fill('');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(nameInput).toHaveJSProperty('validity.valid', false);
  expect(insertAttempted).toBe(false);
});