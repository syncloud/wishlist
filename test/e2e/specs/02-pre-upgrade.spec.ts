import { test } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { env } from '../helpers/env'
import { addItem, hasItem, openAs, openListOf } from '../helpers/wishlist'

const admin = env('PLAYWRIGHT_DEVICE_USER')

test('add a wish before the upgrade', async ({ browser }) => {
  const page = await openAs(browser, admin, env('PLAYWRIGHT_DEVICE_PASSWORD'))
  await openListOf(page, admin)
  if (!(await hasItem(page, 'Pre upgrade wish'))) {
    await addItem(page, 'Pre upgrade wish')
  }
  await shoot(page, 'wishes-before-upgrade')
})
