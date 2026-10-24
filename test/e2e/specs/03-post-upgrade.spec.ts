import { test, expect } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { env } from '../helpers/env'
import { addItem, item, openApp, openListOf, signIn, signOut } from '../helpers/wishlist'

const admin = env('PLAYWRIGHT_DEVICE_USER')

test('wishes and claims made before the upgrade survive it', async ({ page }) => {
  await openApp(page)
  await signIn(page, admin, env('PLAYWRIGHT_DEVICE_PASSWORD'))
  await openListOf(page, admin)
  await expect(item(page, 'Pre upgrade wish')).toBeVisible()
  await addItem(page, 'Post upgrade wish')
  await shoot(page, 'wishes-after-upgrade')

  await signOut(page)
  await signIn(page, 'alice', 'Password1')
  await openListOf(page, admin)
  await expect(item(page, 'Board game').getByText(/Claimed by bob/i)).toBeVisible()
  await shoot(page, 'claim-after-upgrade')
})
