import { Page, expect } from '@playwright/test'
import { env } from './env'

export async function login(page: Page) {
  await page.goto('/')

  const username = page.locator('#username-textfield')
  await expect(username).toBeVisible()
  await username.fill(env('PLAYWRIGHT_DEVICE_USER'))
  await page.locator('#password-textfield').fill(env('PLAYWRIGHT_DEVICE_PASSWORD'))
  await page.locator('#sign-in-button').click()

  await expect(page.getByRole('button', { name: 'User Menu' })).toBeVisible()
  await expect(page.getByTestId('list-container')).toBeVisible()
}

export async function openMyList(page: Page) {
  const list = page.getByTestId('list-container').locator('a.card').first()
  await expect(list).toBeVisible()
  await list.click()
  await expect(page.getByTestId('items-container').or(page.getByText('No wishes yet'))).toBeVisible()
}

export async function addItem(page: Page, name: string) {
  await page.getByRole('button', { name: 'add item' }).click()
  await expect(page.getByRole('heading', { name: 'Create Wish' })).toBeVisible()
  await page.getByLabel('Item Name').fill(name)
  await page.getByRole('button', { name: 'Create item' }).click()
  await expectItem(page, name)
}

export async function expectItem(page: Page, name: string) {
  await expect(page.getByTestId('items-container').getByTestId('name').filter({ hasText: name })).toBeVisible()
}

export async function hasItem(page: Page, name: string): Promise<boolean> {
  return (await page.getByTestId('name').filter({ hasText: name }).count()) > 0
}
