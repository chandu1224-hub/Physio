import { test, expect } from '@playwright/test';

const provider = {
  id: 'e2e-provider-1',
  name: 'Dr. Test Provider',
  initials: 'TP',
  title: 'Physiotherapist',
  degree: 'BPT',
  experience_years: 5,
  specialties: ['Back & neck pain'],
  conditions: ['Back pain'],
  services: ['Home visit'],
  service_areas: ['Bengaluru'],
  languages: ['English'],
  bio: 'Test-only provider profile.',
  price: 500,
  availability: 'Availability to be confirmed',
  rating: 4.5,
  reviews: 2,
  emoji: '🧑‍⚕️',
  color: 'sage',
  display_order: 1,
  featured: false,
  status: 'published',
  service_location: 'Bengaluru, Karnataka, India',
  service_radius_km: 10,
};

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/physiotherapists**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([provider]) });
      return;
    }
    await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'Unexpected provider write in E2E test' }) });
  });
  await page.route('https://e2e-test-project.supabase.co/rest/v1/booking_requests**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('https://e2e-test-project.supabase.co/rest/v1/therapist_applications**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('https://wa.me/**', (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: 'WhatsApp handoff intercepted by E2E test.' }));
});

test('homepage loads published provider cards from the mocked API', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find physiotherapy/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dr. Test Provider' }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Demo platform: profiles/i)).toBeVisible();
});

test('booking saves the request before showing the success confirmation', async ({ page }) => {
  let savedPayload;
  await page.route('https://e2e-test-project.supabase.co/rest/v1/booking_requests**', async (route) => {
    if (route.request().method() === 'POST') {
      savedPayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '' });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: /^Request/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Request a session.' })).toBeVisible();

  await page.getByLabel('Your name').fill('E2E Test Patient');
  await page.getByLabel('Phone number').fill('+91 98765 43210');
  await page.getByLabel('Area / address').fill('Test Area, Bengaluru');
  await page.getByLabel('What do you need help with?').selectOption('Back pain');
  await page.getByLabel('Preferred date').fill('2099-01-15');
  await page.getByLabel('I agree that Physio at Home may store and use these details to respond to my request.').check();

  await page.getByRole('button', { name: /Save request & continue/i }).click();
  await expect(page.getByText(/Your request has been saved/i)).toBeVisible();
  expect(savedPayload).toMatchObject({
    name: 'E2E Test Patient',
    phone: '+91 98765 43210',
    area: 'Test Area, Bengaluru',
    condition: 'Back pain',
    consent: true,
    status: 'new',
  });
});

test('booking failure displays an error and does not claim success', async ({ page }) => {
  await page.route('https://e2e-test-project.supabase.co/rest/v1/booking_requests**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Test insert rejected' }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: /^Request/ }).first().click();
  await page.getByLabel('Your name').fill('E2E Test Patient');
  await page.getByLabel('Phone number').fill('+91 98765 43210');
  await page.getByLabel('Area / address').fill('Test Area, Bengaluru');
  await page.getByLabel('What do you need help with?').selectOption('Back pain');
  await page.getByLabel('Preferred date').fill('2099-01-15');
  await page.getByLabel('I agree that Physio at Home may store and use these details to respond to my request.').check();

  await page.getByRole('button', { name: /Save request & continue/i }).click();
  await expect(page.getByText(/We could not save your request/i)).toBeVisible();
  await expect(page.getByText(/Your request has been saved/i)).toHaveCount(0);
});

test('therapist application validates required fields and can save with consent', async ({ page }) => {
  let savedApplication;
  await page.route('https://e2e-test-project.supabase.co/rest/v1/therapist_applications**', async (route) => {
    if (route.request().method() === 'POST') {
      savedApplication = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 201, headers: { 'content-type': 'application/json' }, body: '' });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Join as Physiotherapist/i }).click();
  await expect(page.getByRole('heading', { name: 'Join as a Physiotherapist' })).toBeVisible();
  await page.getByPlaceholder('Full name *').fill('E2E Test Therapist');
  await page.getByPlaceholder('Phone number *').fill('+91 98765 43210');
  await page.getByPlaceholder('Qualification (e.g. BPT, MPT) *').fill('BPT');
  await page.getByPlaceholder('City / Clinic name *').fill('Bengaluru');
  await page.getByLabel(/I agree that Physio at Home may store your details/i).check();
  await page.getByRole('button', { name: /Save application & continue to WhatsApp/i }).click();

  await expect(page.getByRole('status').filter({ hasText: /Application saved/i })).toBeVisible();
  expect(savedApplication).toMatchObject({
    name: 'E2E Test Therapist',
    qualification: 'BPT',
    city: 'Bengaluru',
    consent: true,
    status: 'new',
  });
});
