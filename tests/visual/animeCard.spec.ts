import { expect, test } from '@playwright/test'

const CARD = '.p-card'

test.describe('AnimeCard', () => {
  test('default state', async ({ page }) => {
    await page.goto('/')

    const card = page.locator(CARD).first()
    await expect(card).toBeVisible()
    await expect(card).toHaveScreenshot('anime-card-default.png')
  })

  test('loading skeletons', async ({ page }) => {
    // MSW answers inside the page, so Playwright's network routing never sees
    // the library request. Stalling the XHR transport is what keeps it pending.
    await page.addInitScript(() => {
      const nativeOpen = XMLHttpRequest.prototype.open
      const nativeSend = XMLHttpRequest.prototype.send
      const stalled = new WeakSet<XMLHttpRequest>()

      XMLHttpRequest.prototype.open = function open(
        this: XMLHttpRequest,
        method: string,
        url: string | URL,
        isAsync: boolean = true,
        username?: string | null,
        password?: string | null,
      ): void {
        if (String(url).includes('/anime?')) stalled.add(this)
        nativeOpen.call(this, method, url, isAsync, username, password)
      }

      XMLHttpRequest.prototype.send = function send(
        this: XMLHttpRequest,
        body?: Document | XMLHttpRequestBodyInit | null,
      ): void {
        if (stalled.has(this)) return
        nativeSend.call(this, body)
      }
    })

    await page.goto('/')

    const skeleton = page.locator('.animate-pulse').first()
    await expect(skeleton).toBeVisible()
    await expect(skeleton).toHaveScreenshot('anime-card-loading.png')
  })

  test('image error fallback', async ({ page }) => {
    await page.route('**/*.{png,jpg,jpeg,webp}', (route) => route.abort())
    await page.goto('/')

    const card = page.locator(CARD).first()
    await expect(card).toBeVisible()
    await expect(card).toHaveScreenshot('anime-card-image-error.png')
  })
})
