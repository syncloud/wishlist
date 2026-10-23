import { test as base, expect } from '@playwright/test'
import * as path from 'node:path'
import { capture } from './helpers/screenshot'

export const test = base.extend<{ failureScreenshot: void }>({
  failureScreenshot: [
    async ({ browser }, use, info) => {
      await use()
      if (info.status === info.expectedStatus) {
        return
      }
      const name = `failed-${path.basename(info.file, '.spec.ts')}-line-${info.line}`
      const pages = browser.contexts().flatMap((context) => context.pages())
      for (const [index, page] of pages.entries()) {
        console.log(`failure url ${index}: ${page.url()}`)
        await capture(page, pages.length > 1 ? `${name}-${index + 1}` : name)
      }
    },
    { auto: true },
  ],
})

export { expect }
