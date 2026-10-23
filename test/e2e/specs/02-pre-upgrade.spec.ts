import { test } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { addItem, hasItem, login, openMyList } from '../helpers/wishlist'

const item = 'Pre upgrade wish'

test('add a wish before the upgrade', async ({ page }) => {
  await login(page)
  await openMyList(page)
  if (!(await hasItem(page, item))) {
    await addItem(page, item)
  }
  await shoot(page, 'wishes-before-upgrade')
})
