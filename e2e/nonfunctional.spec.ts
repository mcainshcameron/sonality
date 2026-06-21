import { test, expect } from '@playwright/test'

// TC-N-01 — no outbound network beyond the app's own origin / static assets.
test('TC-N-01: no third-party network requests during core flow', async ({ page }) => {
  const external: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (!url.startsWith('http://localhost') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      external.push(url)
    }
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Add person' }).click()
  await page.getByLabel(/name/i).fill('Privacy Person')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Privacy Person' })).toBeVisible()

  expect(external).toEqual([])
})

// TC-N-02 — core flows work with the network disabled.
test('TC-N-02: add a person while offline', async ({ page, context }) => {
  await page.goto('/')
  await context.setOffline(true)

  await page.getByRole('button', { name: 'Add person' }).click()
  await page.getByLabel(/name/i).fill('Offline Person')
  await page.getByRole('button', { name: 'Add', exact: true }).click()

  await expect(page.getByRole('link', { name: 'Offline Person' })).toBeVisible()
  await context.setOffline(false)
})

// TC-N-05 — no horizontal overflow across the responsive range (1024 → 768).
for (const width of [1024, 900, 768]) {
  test(`TC-N-05: no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  })
}
