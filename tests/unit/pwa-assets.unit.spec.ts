import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const publicDirectory = path.join(process.cwd(), 'public')

describe('PWA assets', () => {
  it('publishes an installable manifest with valid local icons and shortcuts', async () => {
    const manifest = JSON.parse(await readFile(path.join(publicDirectory, 'manifest.webmanifest'), 'utf8')) as {
      display: string
      icons: Array<{ src: string; purpose: string }>
      id: string
      scope: string
      shortcuts: Array<{ url: string }>
      start_url: string
    }

    expect(manifest).toMatchObject({
      display: 'standalone',
      id: '/',
      scope: '/',
      start_url: '/',
    })
    expect(manifest.icons).toContainEqual(expect.objectContaining({ src: '/alemah-icon-192.png', purpose: 'any maskable' }))
    expect(manifest.icons).toContainEqual(expect.objectContaining({ src: '/alemah-icon-512.png', purpose: 'any maskable' }))
    expect(manifest.shortcuts).toContainEqual(expect.objectContaining({ url: '/ai-home-advisor' }))
    await Promise.all(manifest.icons.map((icon) => expect(readFile(path.join(publicDirectory, icon.src))).resolves.toBeTruthy()))
    await expect(readFile(path.join(publicDirectory, 'alemah-icon-180.png'))).resolves.toBeTruthy()
  })

  it('keeps the service worker scoped to Alemah caches and avoids caching failed assets', async () => {
    const serviceWorker = await readFile(path.join(publicDirectory, 'sw.js'), 'utf8')

    expect(serviceWorker).toContain("key.startsWith(CACHE_PREFIX)")
    expect(serviceWorker).toContain('if (!response.ok) return response')
    expect(serviceWorker).toContain("const OFFLINE_URL = '/offline.html'")
  })
})
