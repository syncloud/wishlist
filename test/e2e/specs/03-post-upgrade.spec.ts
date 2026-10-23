import { test } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { addItem, expectItem, login, openMyList } from '../helpers/wishlist'

test('wish added before the upgrade survives it', async ({ page }) => {
  await login(page)
  await openMyList(page)
  await expectItem(page, 'Pre upgrade wish')
  await addItem(page, 'Post upgrade wish')
  await shoot(page, 'post-upgrade')
})
