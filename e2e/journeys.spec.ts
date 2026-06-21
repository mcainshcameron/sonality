import { test, expect, type Page } from '@playwright/test'

async function addPerson(page: Page, name: string) {
  await page.getByRole('button', { name: 'Add person' }).click()
  await page.getByLabel(/name/i).fill(name)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('link', { name }).click()
}

async function addObservation(page: Page, text: string) {
  await page.getByRole('button', { name: 'Add observation' }).click()
  await page.getByLabel(/observation/i).first().fill(text)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
}

// TC-E-01 — add person → observation → Big Five evidence → correct score
test('TC-E-01: Big Five evidence produces the correct score', async ({ page }) => {
  await page.goto('/')
  await addPerson(page, 'E2E Alice')
  await addObservation(page, 'Tried a brand-new approach to the problem')

  // Expand evidence on the observation and add a Big Five item (O, High +1, weight 2 → 100)
  await page.getByRole('button', { name: /Evidence \(0\)/ }).click()
  await page.getByRole('button', { name: 'Add evidence' }).click()

  // Verify via the Big Five table alternative
  await page.getByRole('button', { name: /show table/i }).click()
  const oRow = page.getByRole('row', { name: /Openness/ })
  await expect(oRow).toContainText('100')
})

// TC-E-02 — MBTI evidence → assembled type + per-axis confidence
test('TC-E-02: MBTI evidence yields a type letter and confidence', async ({ page }) => {
  await page.goto('/')
  await addPerson(page, 'E2E Bob')
  await addObservation(page, 'Energized after a big group event')

  await page.getByRole('button', { name: /Evidence \(0\)/ }).click()
  await page.getByRole('button', { name: 'MBTI' }).click()
  // default axis EI, pole E, weight 2 → winner E, confidence 100%
  await page.getByRole('button', { name: 'Add evidence' }).click()

  const mbti = page.getByRole('region', { name: 'MBTI profile' })
  await expect(mbti).toContainText('100%')
  await expect(mbti.getByText('E', { exact: true }).first()).toBeVisible()
})

// TC-E-03 — expand a dimension → land on the driving observation
test('TC-E-03: evidence breakdown lists the driving observation', async ({ page }) => {
  await page.goto('/')
  await addPerson(page, 'E2E Carol')
  await addObservation(page, 'Meticulously organized the whole event')

  await page.getByRole('button', { name: /Evidence \(0\)/ }).click()
  await page.getByLabel('Dimension').selectOption('C')
  await page.getByRole('button', { name: 'Add evidence' }).click()

  // In the breakdown, expand Conscientiousness and see the observation text
  const breakdown = page.getByRole('region', { name: 'Evidence breakdown' })
  await breakdown.getByRole('button', { name: /Conscientiousness/ }).click()
  await expect(breakdown).toContainText('Meticulously organized the whole event')
})

// TC-E-04 — export downloads a file; clear empties the list
test('TC-E-04: export downloads JSON and clear empties data', async ({ page }) => {
  await page.goto('/')
  await addPerson(page, 'E2E Dave')
  await page.getByRole('link', { name: 'People', exact: true }).click()

  await page.getByRole('link', { name: 'Settings' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('sonality-export')

  await page.getByRole('button', { name: 'Clear all data' }).click()
  await page.getByRole('button', { name: 'Clear everything' }).click()
  await expect(page.getByRole('status')).toContainText(/cleared/i)

  await page.getByRole('link', { name: 'People', exact: true }).click()
  await expect(page.getByText(/No people yet/i)).toBeVisible()
})
