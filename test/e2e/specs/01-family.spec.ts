import { test, expect } from '../fixtures'
import { shoot } from '../helpers/screenshot'
import { env } from '../helpers/env'
import { addUser } from '../helpers/users'
import { addItem, claim, goToLists, item, openApp, openListOf, signIn, signOut } from '../helpers/wishlist'

const admin = env('PLAYWRIGHT_DEVICE_USER')
const adminPassword = env('PLAYWRIGHT_DEVICE_PASSWORD')
const password = 'Password1'

test('a family shares wishlists and claims a gift without spoiling it', async ({ page }) => {
  addUser('alice', password)
  addUser('bob', password)

  await test.step('admin signs in through Syncloud SSO', async () => {
    await openApp(page)
    await signIn(page, admin, adminPassword)
    await expect(page.getByTestId('list-container')).toBeVisible()
    await shoot(page, 'admin-lists')
  })

  await test.step('admin sees OIDC settings managed by the platform', async () => {
    await page.getByRole('button', { name: 'User Menu' }).click()
    await page.getByRole('link', { name: 'Admin', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible()
    await page.getByRole('tab', { name: 'Settings' }).click()
    await page.getByRole('link', { name: 'Security' }).click()
    await expect(page.locator('#oidcClientId')).toBeDisabled()
    await expect(page.locator('#oidcClientId')).toHaveValue('wishlist')
    await expect(page.locator('#oidcClientSecret')).toBeDisabled()
    await expect(page.locator('#oidcAdminGroup')).toHaveValue('syncloud')
    await expect(page.locator('#disablePasswordLogin')).toBeDisabled()
    await shoot(page, 'admin-security')
  })

  await test.step('admin puts new members in the default group', async () => {
    await page.getByRole('link', { name: 'General' }).click()
    await page.locator('#defaultGroup').selectOption({ label: 'Default' })
    await shoot(page, 'admin-default-group')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Settings saved')).toBeVisible()
  })

  await test.step('admin adds wishes', async () => {
    await goToLists(page)
    await openListOf(page, admin)
    await addItem(page, 'Board game')
    await addItem(page, 'Coffee grinder')
    await shoot(page, 'admin-wishes')
  })

  await test.step('alice joins and adds wishes', async () => {
    await signOut(page)
    await signIn(page, 'alice', password)
    await expect(page.getByTestId('list-container')).toBeVisible()
    await shoot(page, 'alice-lists')
    await openListOf(page, 'alice')
    await addItem(page, 'Running shoes')
    await addItem(page, 'Headphones')
    await shoot(page, 'alice-wishes')
  })

  await test.step('bob adds a wish', async () => {
    await signOut(page)
    await signIn(page, 'bob', password)
    await expect(page.getByTestId('list-container')).toBeVisible()
    await shoot(page, 'bob-lists')
    await openListOf(page, 'bob')
    await addItem(page, 'Book')
    await shoot(page, 'bob-wishes')
  })

  await test.step('bob claims a gift from the admin list', async () => {
    await goToLists(page)
    await openListOf(page, admin)
    await shoot(page, 'bob-admin-list')
    await claim(page, 'Board game')
    await shoot(page, 'bob-claimed')
  })

  await test.step('alice sees the gift is already claimed by bob', async () => {
    await signOut(page)
    await signIn(page, 'alice', password)
    await openListOf(page, admin)
    await expect(item(page, 'Board game').getByText(/Claimed by bob/i)).toBeVisible()
    await expect(item(page, 'Board game').getByRole('button', { name: 'Claim', exact: true })).toBeHidden()
    await expect(item(page, 'Coffee grinder').getByRole('button', { name: 'Claim', exact: true })).toBeVisible()
    await shoot(page, 'alice-sees-claim')
  })

  await test.step('the admin does not see the claim on their own list', async () => {
    await signOut(page)
    await signIn(page, admin, adminPassword)
    await openListOf(page, admin)
    await expect(item(page, 'Board game')).toBeVisible()
    await expect(item(page, 'Board game').getByText(/Claimed/i)).toBeHidden()
    await shoot(page, 'admin-claim-hidden')
  })
})
