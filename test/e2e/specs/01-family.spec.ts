import { test, expect } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { env } from '../helpers/env'
import { addUser } from '../helpers/users'
import { addItem, claim, goToLists, item, openAs, openListOf } from '../helpers/wishlist'

const admin = env('PLAYWRIGHT_DEVICE_USER')
const adminPassword = env('PLAYWRIGHT_DEVICE_PASSWORD')
const password = 'Password1'

test('a family shares wishlists and claims a gift without spoiling it', async ({ browser }) => {
  addUser('alice', password)
  addUser('bob', password)

  const adminPage = await openAs(browser, admin, adminPassword)

  await test.step('admin signs in through Syncloud SSO', async () => {
    await expect(adminPage.getByTestId('list-container')).toBeVisible()
    await shoot(adminPage, 'admin-lists')
  })

  await test.step('admin sees OIDC settings managed by the platform', async () => {
    await adminPage.getByRole('button', { name: 'User Menu' }).click()
    await adminPage.getByRole('link', { name: 'Admin', exact: true }).click()
    await expect(adminPage.getByRole('heading', { name: 'Administration' })).toBeVisible()
    await adminPage.getByRole('tab', { name: 'Settings' }).click()
    await adminPage.getByRole('link', { name: 'Security' }).click()
    await expect(adminPage.locator('#oidcClientId')).toBeDisabled()
    await expect(adminPage.locator('#oidcClientId')).toHaveValue('wishlist')
    await expect(adminPage.locator('#oidcAdminGroup')).toHaveValue('syncloud')
    await expect(adminPage.locator('#disablePasswordLogin')).toBeDisabled()
    await shoot(adminPage, 'admin-security')
  })

  await test.step('admin puts new members in the default group', async () => {
    await adminPage.getByRole('link', { name: 'General' }).click()
    await adminPage.locator('#defaultGroup').selectOption({ label: 'Default' })
    await shoot(adminPage, 'admin-default-group')
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText('Settings saved')).toBeVisible()
  })

  await test.step('admin adds wishes', async () => {
    await goToLists(adminPage)
    await openListOf(adminPage, admin)
    await addItem(adminPage, 'Board game')
    await addItem(adminPage, 'Coffee grinder')
    await shoot(adminPage, 'admin-wishes')
  })

  const alicePage = await openAs(browser, 'alice', password)

  await test.step('alice joins and adds wishes', async () => {
    await shoot(alicePage, 'alice-lists')
    await openListOf(alicePage, 'alice')
    await addItem(alicePage, 'Running shoes')
    await addItem(alicePage, 'Headphones')
    await shoot(alicePage, 'alice-wishes')
  })

  const bobPage = await openAs(browser, 'bob', password)

  await test.step('bob adds a wish', async () => {
    await shoot(bobPage, 'bob-lists')
    await openListOf(bobPage, 'bob')
    await addItem(bobPage, 'Book')
    await shoot(bobPage, 'bob-wishes')
  })

  await test.step('bob claims a gift from the admin list', async () => {
    await goToLists(bobPage)
    await openListOf(bobPage, admin)
    await shoot(bobPage, 'bob-admin-list')
    await claim(bobPage, 'Board game')
    await shoot(bobPage, 'bob-claimed')
  })

  await test.step('alice sees the gift is already claimed by bob', async () => {
    await goToLists(alicePage)
    await openListOf(alicePage, admin)
    await expect(item(alicePage, 'Board game').getByText(/Claimed by bob/i)).toBeVisible()
    await expect(item(alicePage, 'Board game').getByRole('button', { name: 'Claim', exact: true })).toBeHidden()
    await expect(item(alicePage, 'Coffee grinder').getByRole('button', { name: 'Claim', exact: true })).toBeVisible()
    await shoot(alicePage, 'alice-sees-claim')
  })

  await test.step('the admin does not see the claim on their own list', async () => {
    await goToLists(adminPage)
    await openListOf(adminPage, admin)
    await expect(item(adminPage, 'Board game')).toBeVisible()
    await expect(item(adminPage, 'Board game').getByText(/Claimed/i)).toBeHidden()
    await shoot(adminPage, 'admin-claim-hidden')
  })
})
