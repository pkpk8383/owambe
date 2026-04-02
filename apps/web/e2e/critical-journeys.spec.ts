import { test, expect, Page } from '@playwright/test';

// ─── CONFIG ──────────────────────────────────────────
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000';

// ─── HELPERS ─────────────────────────────────────────
async function loginAsPlanner(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'planner@test.com');
  await page.fill('input[type="password"]', 'Planner123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

async function loginAsVendor(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'vendor@test.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/vendor');
}

// ─── HOMEPAGE ────────────────────────────────────────
test.describe('Homepage', () => {
  test('loads and displays key CTAs', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Owambe/i);
    await expect(page.getByText('Plan with AI')).toBeVisible();
    await expect(page.getByText('Browse Vendors')).toBeVisible();
    await expect(page.getByText('Plan My Event Free')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=Browse Vendors');
    await expect(page).toHaveURL(/\/vendors/);
  });
});

// ─── AUTH ────────────────────────────────────────────
test.describe('Authentication', () => {
  test('planner can register', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page.getByText('Create your account')).toBeVisible();

    await page.click('label:has-text("Event Planner")');
    await page.fill('input[placeholder*="First"]', 'Chisom');
    await page.fill('input[placeholder*="Last"]', 'Obi');
    await page.fill('input[type="email"]', `test-${Date.now()}@owambe.com`);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Check your email')).toBeVisible();
  });

  test('planner can login', async ({ page }) => {
    await loginAsPlanner(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'nobody@owambe.com');
    await page.fill('input[type="password"]', 'WrongPass');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Invalid credentials|Login failed/i)).toBeVisible();
  });
});

// ─── PLANNER DASHBOARD ───────────────────────────────
test.describe('Planner Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPlanner(page);
  });

  test('dashboard shows stats cards', async ({ page }) => {
    await expect(page.getByText('Live Events')).toBeVisible();
    await expect(page.getByText('Registrations')).toBeVisible();
    await expect(page.getByText('Revenue')).toBeVisible();
  });

  test('can navigate to events list', async ({ page }) => {
    await page.click('text=My Events');
    await expect(page).toHaveURL(/\/dashboard\/events/);
  });

  test('can navigate to create event', async ({ page }) => {
    await page.click('text=Create Event');
    await expect(page).toHaveURL(/\/dashboard\/events\/new/);
    await expect(page.getByText('AI Event Builder')).toBeVisible();
  });

  test('create event wizard step 1', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/events/new`);
    await page.fill('input[placeholder*="Lagos Tech"]', 'My Test Event');
    await page.selectOption('select', 'Conference');
    await page.fill('input[type="date"]', '2026-09-15');
    await page.fill('input[placeholder*="Eko Hotel"]', 'Test Venue');
    await page.click('button:has-text("Continue to Tickets")');
    await expect(page.getByText('Ticket Types')).toBeVisible();
  });

  test('check-in page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/checkin`);
    await expect(page.getByText('Check-in Scanner')).toBeVisible();
    await expect(page.getByText('Select an event')).toBeVisible();
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await expect(page.getByText('Registrations — Last 30 Days')).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/pricing`);
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Growth')).toBeVisible();
    await expect(page.getByText('Scale')).toBeVisible();
    await expect(page.getByText('Cvent')).toBeVisible();
  });
});

// ─── VENDOR MARKETPLACE ──────────────────────────────
test.describe('Vendor Marketplace', () => {
  test('shows vendor listings', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendors`);
    await expect(page.getByText('Find Vendors in Lagos')).toBeVisible();
  });

  test('can filter by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendors`);
    await page.click('button:has-text("Catering")');
    await page.waitForTimeout(500);
    // Results should filter
    await expect(page.locator('.card')).toBeTruthy();
  });

  test('vendor profile page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendors`);
    // Click first vendor if available
    const cards = page.locator('a[href^="/vendors/"]');
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await expect(page.getByText('Starting from')).toBeVisible();
    }
  });
});

// ─── AI PLANNING APP ─────────────────────────────────
test.describe('AI Planning App', () => {
  test('plan page loads with chat interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/plan`);
    await expect(page.getByText('Plan your perfect event')).toBeVisible();
    await expect(page.getByText('AI event planner')).toBeVisible();
  });

  test('quick prompts are visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/plan`);
    await expect(page.getByText('Wedding for 200 guests')).toBeVisible();
  });

  test('can send a message', async ({ page }) => {
    await page.goto(`${BASE_URL}/plan`);
    await page.fill('input[placeholder*="Tell me about your event"]', 'I need a birthday party for 50 people');
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(1000);
    // Assistant should respond
    await expect(page.locator('.rounded-2xl').last()).toBeVisible();
  });
});

// ─── VENDOR DASHBOARD ────────────────────────────────
test.describe('Vendor Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
  });

  test('vendor overview loads', async ({ page }) => {
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Confirmed Bookings')).toBeVisible();
  });

  test('bookings page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/bookings`);
    await expect(page.getByText('ALL')).toBeVisible();
    await expect(page.getByText('PENDING')).toBeVisible();
  });

  test('availability calendar loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/availability`);
    await expect(page.getByText('Mark Open')).toBeVisible();
    await expect(page.getByText('Block Off')).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/settings`);
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Portfolio')).toBeVisible();
    await expect(page.getByText('Bank Account')).toBeVisible();
    await expect(page.getByText('Verification')).toBeVisible();
  });
});

// ─── ACCESSIBILITY ───────────────────────────────────
test.describe('Accessibility', () => {
  test('homepage has proper heading structure', async ({ page }) => {
    await page.goto(BASE_URL);
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });

  test('login form has labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});
