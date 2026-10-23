import { test, expect } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { env } from '../helpers/env'
import { addItem, item, openAs, openListOf } from '../helpers/wishlist'

const admin = env('PLAYWRIGHT_DEVICE_USER')

test('wishes and claims made before the upgrade survive it', async ({ browser }) => {
  const page = await openAs(browser, admin, env('PLAYWRIGHT_DEVICE_PASSWORD'))
  await openListOf(page, admin)
  await expect(item(page, 'Pre upgrade wish')).toBeVisible()
  await addItem(page, 'Post upgrade wish')
  await shoot(page, 'wishes-after-upgrade')

  const alice = await openAs(browser, 'alice', 'Password1')
  await openListOf(alice, admin)
  await expect(item(alice, 'Board game').getByText(/Claimed by bob/i)).toBeVisible()
  await shoot(alice, 'claim-after-upgrade')
})
