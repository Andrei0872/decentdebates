import { expect, test } from '@playwright/test';

test('login, browse debates, open a debate', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Email or username').fill(process.env.E2E_USERNAME ?? '');
  await page.getByPlaceholder('Password').fill(process.env.E2E_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Submit' }).click();

  await page.waitForURL('**/debates');

  const firstDebate = page.getByTestId('debate-card').first();
  await expect(firstDebate).toBeVisible();

  const title = (await firstDebate.getByTestId('debate-card-title').textContent())?.trim();
  expect(title, 'first debate card should render a title').toBeTruthy();

  await firstDebate.click();

  await page.waitForURL(/\/debates\/\d+/);
  await expect(page.getByTestId('debate-title')).toHaveText(title!);
});
