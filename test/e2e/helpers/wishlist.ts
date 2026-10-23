import { Browser, Page, expect } from '@playwright/test'
import { env } from './env'

export async function openAs(browser: Browser, username: string, password: string): Promise<Page> {
  const context = await browser.newContext({
    baseURL: `https://${env('PLAYWRIGHT_APP_DOMAIN')}`,
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 960 },
  })
  const page = await context.newPage()
  await login(page, username, password)
  return page
}

export async function login(page: Page, username: string, password: string) {
  await page.goto('/')

  const usernameField = page.locator('#username-textfield')
  await expect(usernameField).toBeVisible()
  await usernameField.fill(username)
  await page.locator('#password-textfield').fill(password)
  await page.locator('#sign-in-button').click()

  await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible()
}

export async function goToLists(page: Page) {
  await page.getByRole('link', { name: 'Lists' }).first().click()
  await expect(page.getByTestId('list-container')).toBeVisible()
}

export async function openListOf(page: Page, owner: string) {
  const list = page
    .getByTestId('list-container')
    .locator('a.card')
    .filter({ has: page.getByTestId('list-name').filter({ hasText: new RegExp(owner, 'i') }) })
  await expect(list).toBeVisible()
  await list.click()
  await expect(page.getByRole('heading', { name: new RegExp(owner, 'i') }).first()).toBeVisible()
}

export function item(page: Page, name: string) {
  return page.getByTestId('items-container').locator('.card').filter({ has: page.getByTestId('name').filter({ hasText: name }) })
}

export async function addItem(page: Page, name: string) {
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
  await item(page, name).getByRole('button', { name: 'Claim', exact: true }).click()
  await expect(item(page, name).getByRole('button', { name: 'Unclaim', exact: true })).toBeVisible()
}
