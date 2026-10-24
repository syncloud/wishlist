import { Page, expect } from '@playwright/test'
import { env } from './env'

const authUrl = `https://auth.${env('PLAYWRIGHT_FULL_DOMAIN')}`

export async function openApp(page: Page) {
  await page.goto('/')
}

export async function signIn(page: Page, username: string, password: string) {
  const usernameField = page.locator('#username-textfield')
  const signInButton = page.getByText('Sign in with Syncloud')
  await expect(usernameField.or(signInButton)).toBeVisible()
  if (await signInButton.isVisible()) {
    await signInButton.click()
  }
  await expect(usernameField).toBeVisible()
  await usernameField.fill(username)
  await page.locator('#password-textfield').fill(password)
  await page.locator('#sign-in-button').click()
  await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible()
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'User Menu' }).click()
  await page.getByRole('button', { name: 'Sign Out' }).click()
  await expect(page.getByText('Sign in with Syncloud')).toBeVisible()
  await page.goto(authUrl)
  await page.locator('#logout-button').click()
  await expect(page.locator('#username-textfield')).toBeVisible()
  await openApp(page)
}

export async function goToLists(page: Page) {
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Lists', exact: true })).toBeVisible()
  await expect(page.getByTestId('list-container')).toBeVisible()
}

export async function openListOf(page: Page, owner: string) {
  const list = page
    .getByTestId('list-container')
    .locator('a.card')
    .filter({ has: page.getByTestId('list-owner').filter({ hasText: new RegExp(`^${owner}$`, 'i') }) })
  await expect(list).toBeVisible()
  await list.click()
  await expect(page.getByTestId('items-container').or(page.getByText('No wishes yet'))).toBeVisible()
}

export function item(page: Page, name: string) {
  return page.getByTestId('items-container').locator('.card').filter({ has: page.getByTestId('name').filter({ hasText: name }) })
}

export async function addItem(page: Page, name: string) {
  if (await hasItem(page, name)) {
    return
  }
  await page.getByRole('button', { name: 'add item' }).click()
  await expect(page.getByRole('heading', { name: 'Create Wish' })).toBeVisible()
  await page.getByLabel('Item Name').fill(name)
  await page.getByRole('button', { name: 'Create item' }).click()
  await expect(item(page, name)).toBeVisible()
}

export async function hasItem(page: Page, name: string): Promise<boolean> {
  return (await item(page, name).count()) > 0
}

export async function claim(page: Page, name: string) {
  if (await item(page, name).getByRole('button', { name: 'Unclaim', exact: true }).isVisible()) {
    return
  }
  await item(page, name).getByRole('button', { name: 'Claim', exact: true }).click()
  await expect(item(page, name).getByRole('button', { name: 'Unclaim', exact: true })).toBeVisible()
}
