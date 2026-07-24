import { expect, test } from '@playwright/test'

const user = {
  blockedEmail: 'auth-e2e-blocked@example.com',
  email: 'auth-e2e-customer@example.com',
  password: 'Valid-password-1234',
}

test.describe.serial('customer authentication', () => {
  test.setTimeout(120_000)

  test('protects account routes with a server redirect', async ({ page }) => {
    await page.goto('/account/security')
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('uses the same public error for wrong and unknown credentials', async ({ request }) => {
    const wrong = await request.post('/api/auth/login', {
      data: { email: user.email, password: 'wrong-password' },
    })
    const unknown = await request.post('/api/auth/login', {
      data: { email: 'unknown@example.com', password: 'wrong-password' },
    })
    expect(wrong.status()).toBe(401)
    expect(unknown.status()).toBe(401)
    expect((await wrong.json()).message).toBe((await unknown.json()).message)
  })

  test('logs in, persists securely, exposes a safe session, and logs out', async ({
    context,
    page,
  }) => {
    await page.goto('/login?returnTo=/account/security')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL((url) => url.pathname === '/account/security')
    await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Security' })).toBeVisible()
    const sessionBody = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      return response.json()
    })
    expect(sessionBody.authenticated).toBe(true)
    expect(sessionBody.user.email).toBe(user.email)
    expect(JSON.stringify(sessionBody)).not.toMatch(/token|hash|salt|googleSubject/)

    const storage = await page.evaluate(() => ({
      local: { ...window.localStorage },
      session: { ...window.sessionStorage },
    }))
    expect(JSON.stringify(storage.local)).not.toMatch(/token|jwt|oauth/i)
    expect(JSON.stringify(storage.session)).not.toMatch(/token|jwt|oauth/i)

    const authCookie = (await context.cookies()).find((cookie) => cookie.name.endsWith('-token'))
    expect(authCookie?.httpOnly).toBe(true)
    expect(authCookie?.sameSite).toBe('Lax')

    await page.getByRole('button', { name: 'Log out on this device' }).click()
    await expect(page).toHaveURL('/', { timeout: 30_000 })
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login/)
  })

  test('rejects a blocked customer through the controlled login route', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: user.blockedEmail, password: user.password },
    })
    expect(response.status()).toBe(403)
    expect((await response.json()).code).toBe('ACCOUNT_BLOCKED')
  })
})
