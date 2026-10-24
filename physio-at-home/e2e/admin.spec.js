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
