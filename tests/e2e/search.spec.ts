import { expect, test, type Page } from '@playwright/test'

const SEARCH_INPUT = '[data-testid="search-input"]'
const RESULT_CARD = '[data-testid="anime-card"]'
const TAG_SELECT = '[data-testid="add-tag-btn"]'
const TAG_FILTER = '.p-multiselect-overlay input.p-multiselect-filter'
const TAG_OPTION = '.p-multiselect-overlay .p-multiselect-option'
const SELECTED_CHIPS = `${TAG_SELECT} .p-multiselect-chip`

async function selectedTagNames(page: Page): Promise<string[]> {
  return page.locator(SELECTED_CHIPS).allInnerTexts()
}

test('search and tag flow', async ({ page }) => {
  await page.goto('/search')

  await page.fill(SEARCH_INPUT, 'Naruto')
  await page.waitForSelector(RESULT_CARD)
  await page.locator(RESULT_CARD).first().click()

  await expect(page).toHaveURL(/\/anime\//)

  await page.locator(TAG_SELECT).click()
  await page.locator(TAG_FILTER).fill('Люб')

  const option = page.locator(TAG_OPTION).first()
  const tagName = (await option.innerText()).trim()
  const wasSelected = (await selectedTagNames(page)).includes(tagName)

  await option.click()
  await page.keyboard.press('Escape')

  await expect
    .poll(async () => (await selectedTagNames(page)).includes(tagName))
    .toBe(!wasSelected)
})

test('home lists the library and opens a detail page', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.p-card').first()).toBeVisible()

  // The card link carries both the Russian name and the original, so the
  // accessible name is a concatenation of the two.
  await page.getByRole('link', { name: /Fullmetal Alchemist/ }).first().click()

  await expect(page).toHaveURL(/\/anime\/shikimori_5114/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Стальной алхимик')
})

test('mobile viewport shows the bottom navigation without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')

  await expect(page.locator('nav.fixed')).toBeVisible()

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(375)
})
