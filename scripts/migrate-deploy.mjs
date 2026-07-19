import 'dotenv/config'

import { spawnSync } from 'node:child_process'

// Payload projects historically used DATABASE_URI. Prefer the current name,
// but keep existing deployments working while they are migrated to DATABASE_URL.
const databaseURL = [process.env.DATABASE_URL, process.env.DATABASE_URI].find((url) =>
  url?.startsWith('postgres'),
) || ''

if (!databaseURL) {
  console.log('No PostgreSQL DATABASE_URL or DATABASE_URI configured; skipping build-time migrations.')
  process.exit(0)
}

const npmExecPath = process.env.npm_execpath
const command = npmExecPath || (process.platform === 'win32' ? 'npm.cmd' : 'npm')
const args = npmExecPath ? [npmExecPath, 'run', 'migrate'] : ['run', 'migrate']
const result = spawnSync(npmExecPath ? process.execPath : command, args, {
  env: process.env,
  stdio: 'inherit',
})

if (result.error) {
  console.error(`Unable to start database migrations: ${result.error.message}`)
}

process.exit(result.status ?? 1)
