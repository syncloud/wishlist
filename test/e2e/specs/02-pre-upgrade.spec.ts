import { test } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { env } from '../helpers/env'
import { addItem, openApp, openListOf, signIn } from '../helpers/wishlist'

const admin = env('PLAYWRIGHT_DEVICE_USER')

test('add a wish before the upgrade', async ({ page }) => {
  await openApp(page)
  await signIn(page, admin, env('PLAYWRIGHT_DEVICE_PASSWORD'))
  await openListOf(page, admin)
  await addItem(page, 'Pre upgrade wish')
  await shoot(page, 'wishes-before-upgrade')
})
