import { test, expect } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { addItem, login, openMyList } from '../helpers/wishlist'

test('sso login, admin settings locked to the platform, add a wish', async ({ page }) => {
  await test.step('sign in through Syncloud SSO', async () => {
    await login(page)
    await shoot(page, 'lists')
  })

  await test.step('admin sees OIDC settings managed by the platform', async () => {
    await page.getByRole('button', { name: 'User Menu' }).click()
    await page.getByRole('link', { name: 'Admin', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible()
    await page.getByRole('tab', { name: 'Settings' }).click()
    await page.getByRole('link', { name: 'Security' }).click()
    await expect(page.locator('#oidcClientId')).toBeDisabled()
    await expect(page.locator('#oidcClientId')).toHaveValue('wishlist')
    await expect(page.locator('#oidcAdminGroup')).toHaveValue('syncloud')
    await expect(page.locator('#disablePasswordLogin')).toBeDisabled()
    await shoot(page, 'admin-security')
  })

  await test.step('add a wish to my list', async () => {
    await page.getByRole('link', { name: 'Lists' }).first().click()
    await expect(page.getByTestId('list-container')).toBeVisible()
    await openMyList(page)
    await addItem(page, 'Smoke test wish')
    await shoot(page, 'wish-added')
  })
})
