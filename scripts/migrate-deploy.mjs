import { spawnSync } from 'node:child_process'

const databaseURL = process.env.DATABASE_URL || ''

if (!databaseURL.startsWith('postgres')) {
  console.log('No PostgreSQL DATABASE_URL configured; skipping build-time migrations.')
  process.exit(0)
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npmCommand, ['run', 'migrate'], {
  env: process.env,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
