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

  await page.fill(SEARCH_INPUT, 'Frieren')
  await page.waitForSelector(RESULT_CARD)
  await page.locator(`${RESULT_CARD} a`).first().click()

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

// Search covers the whole catalogue, so it turns up titles the collection does
// not hold; one click puts them in and one click takes them back out.
test('adds a catalogue title to the collection from search and removes it again', async ({ page }) => {
  await page.goto('/search')

  await page.fill(SEARCH_INPUT, 'Steins;Gate')
  await page.waitForSelector(RESULT_CARD)

  const row = page.locator(RESULT_CARD).first()
  const addButton = row.getByRole('button', { name: 'В коллекцию' })
  await expect(addButton).toBeVisible()

  await addButton.click()

  await expect(row.getByText('В коллекции')).toBeVisible()

  await row.getByRole('button', { name: 'Убрать из коллекции' }).click()

  await expect(addButton).toBeVisible()
})

test('home lists the library and opens a detail page', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.p-card').first()).toBeVisible()

  // The library is the collection, so the count is the tagged subset of the
  // fixtures rather than the whole catalogue.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Библиотека')

  await page.locator('.p-card a').first().click()

  await expect(page).toHaveURL(/\/anime\/shikimori_/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('opens a tag page from the sidebar and lists its titles', async ({ page }) => {
  await page.goto('/tags')

  await page.getByRole('button', { name: /Просмотрено/ }).first().click()

  await expect(page).toHaveURL(/\/tags\//)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Просмотрено')
  await expect(page.getByRole('button', { name: 'Выбрать все' })).toBeVisible()
})

test('mobile viewport shows the bottom navigation without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')

  await expect(page.locator('nav.fixed')).toBeVisible()

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(375)
})
