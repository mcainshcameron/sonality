import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// TC-N-04 (axe half) — no critical accessibility violations on core screens.
test('People list has no critical accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const critical = results.violations.filter((v) => v.impact === 'critical')
  expect(critical).toEqual([])
})

test('Settings page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/settings')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()
  const critical = results.violations.filter((v) => v.impact === 'critical')
  expect(critical).toEqual([])
})

// TC-N-04 (keyboard half) — a person can be created keyboard-only.
test('can add a person using only the keyboard', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add person' }).click()
  // Name field autofocuses; type a name and submit with Enter.
  await page.keyboard.type('Keyboard Person')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('link', { name: 'Keyboard Person' })).toBeVisible()
})
