import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Shelf', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('PSY 101')).toBeVisible();
  });

  test('shows the binders and their progress', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Margin' })).toBeVisible();
    await expect(page.getByText('HIST 110')).toBeVisible();
    await expect(page.getByText('2 of 6 complete')).toBeVisible();
    await expect(page.getByRole('link', { name: /PSY 101/ })).toHaveAttribute('href', '/c/psy101');
  });

  test('opens a course contents page', async ({ page }) => {
    await page.getByRole('link', { name: /PSY 101/ }).click();
    await expect(page).toHaveURL(/\/c\/psy101/);
    await expect(page.getByRole('heading', { name: 'Introduction to Psychology' })).toBeVisible();
    await expect(page.getByText('Next up')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue at Memory/ })).toBeVisible();
  });

  test('opens the new binder dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add a new course' }).click();
    await expect(page.getByRole('heading', { name: 'New binder' })).toBeVisible();
    await expect(page.getByLabel('Course code')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'New binder' })).toBeHidden();
  });


  test('creates a binder and shows the empty contents state', async ({ page }) => {
    await page.getByRole('button', { name: 'Add a new course' }).click();
    await page.getByLabel('Course code').fill('BIO 101');
    await page.getByLabel('Course title').fill('Cell Biology');
    await page.getByRole('button', { name: 'Create binder' }).click();
    await expect(page).toHaveURL(/\/c\/course-/);
    await expect(page.getByRole('heading', { name: 'Cell Biology' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No sections yet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add readings' })).toBeVisible();
  });

  test('has no serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const serious = results.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );
    expect(serious).toEqual([]);
  });
});

test.describe('Contents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/c/psy101');
    await expect(page.getByRole('heading', { name: 'Introduction to Psychology' })).toBeVisible();
  });

  test('lists sections with completion state', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Progress' }).getByText('2 of 6 complete')).toBeVisible();
    const toc = page.getByRole('navigation', { name: 'Table of contents' });
    const memory = toc.getByRole('link', { name: /Section 4: Memory/ });
    await expect(memory).toBeVisible();
    await expect(toc.getByRole('link', { name: /Section 1: Foundations of Psychology, complete/ })).toBeVisible();
  });

  test('opens a worksheet from the table of contents', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Table of contents' }).getByRole('link', { name: /Section 4: Memory/ }).click();
    await expect(page).toHaveURL(/\/c\/psy101\/s\/sec-4/);
    await expect(page.getByText('Explain the difference between episodic and semantic memory')).toBeVisible();
  });

  test('has no serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const serious = results.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );
    expect(serious).toEqual([]);
  });
});

test.describe('Worksheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/c/psy101/s/sec-4');
    await expect(page.getByLabel('Your answer')).toBeVisible();
  });

  test('shows the prompt, prior attempt, and sources', async ({ page }) => {
    await expect(page.getByText('Explain the difference between episodic and semantic memory')).toBeVisible();
    await expect(page.getByText('Episodic memory is for personal events like my graduation')).toBeVisible();
    await expect(page.getByText('Chapter 7: Memory Systems, p. 88')).toBeVisible();
  });

  test('streams a tutor note, reveals the worked answer, and completes the section', async ({ page }) => {
    await page.getByLabel('Your answer').fill(
      'Episodic memory is for events in my life, like graduation. Semantic memory is for facts, like the capital of France.'
    );
    await page.getByRole('button', { name: 'Check my answer' }).click();

    await expect(page.getByText('Looking through your sources…')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Writing a note…')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Good distinction. Episodic is autobiographical')).toBeVisible({ timeout: 20000 });

    const worked = page.getByRole('button', { name: 'Show worked answer' });
    await expect(worked).toBeVisible({ timeout: 20000 });
    await worked.click();
    await expect(page.getByText('Worked answer', { exact: true })).toBeVisible();
    await expect(page.getByText('depends heavily on the hippocampus')).toBeVisible();

    await page.getByLabel('Your answer').fill(
      'Episodic is autobiographical and depends on the hippocampus; semantic is general knowledge.'
    );
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await expect(page.getByRole('heading', { name: 'Section complete' })).toBeVisible({ timeout: 25000 });
  });

  test('opens the source drawer from a citation', async ({ page }) => {
    await page.getByRole('button', { name: /Source 1: Chapter 7/ }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('heading', { name: 'Chapter 7: Memory Systems' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('has no serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const serious = results.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );
    expect(serious).toEqual([]);
  });
});

test.describe('Sources', () => {
  test('lists the indexed readings', async ({ page }) => {
    await page.goto('/c/psy101/sources');
    await expect(page.getByRole('heading', { name: 'Add readings' })).toBeVisible();
    await expect(page.getByText('Chapter 7: Memory Systems')).toBeVisible();
    await expect(page.getByText('4 total')).toBeVisible();
  });
});