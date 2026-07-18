import 'dotenv/config'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type EmailAdapter } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { Wishlists } from '@/collections/Wishlists'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const isProduction = process.env.NODE_ENV === 'production'
// Static route generation initializes Payload but never sends customer email. Keep
// provider validation at runtime so a CI build can verify the application without
// pretending to have production delivery credentials.
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
const allowDemoSeed = process.env.ALLOW_DEMO_SEED === 'true'
const databaseURL = process.env.DATABASE_URL
const usePostgres = databaseURL?.startsWith('postgres')
const vercelBlobToken = process.env.BLOB_READ_WRITE_TOKEN
const payloadSecret = process.env.PAYLOAD_SECRET || (allowDemoSeed ? 'demo-seed-only-secret' : '')
const missingSMTPConfig = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_ADDRESS'].filter(
  (key) => !process.env[key],
)
const phonePeEnabled = process.env.NEXT_PUBLIC_PHONEPE_ENABLED === 'true'
const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
const missingPhonePeConfig = [
  'PHONEPE_CLIENT_ID',
  'PHONEPE_CLIENT_SECRET',
  'PHONEPE_CLIENT_VERSION',
  'NEXT_PUBLIC_SERVER_URL',
].filter((key) => !process.env[key])

if (isProduction && !isProductionBuild && !payloadSecret) {
  throw new Error('PAYLOAD_SECRET must be configured in production.')
}

if (isProduction && !isProductionBuild && !usePostgres) {
  throw new Error('A PostgreSQL DATABASE_URL must be configured in production.')
}

if (process.env.VERCEL && !isProductionBuild && !usePostgres) {
  throw new Error('DATABASE_URL must point to PostgreSQL on Vercel. SQLite cannot persist data or run Payload migrations there.')
}

if (process.env.VERCEL && !isProductionBuild && !vercelBlobToken) {
  throw new Error('BLOB_READ_WRITE_TOKEN must be configured on Vercel so Payload media uploads are stored durably.')
}

if (isProduction && !isProductionBuild && phonePeEnabled && missingPhonePeConfig.length > 0) {
  throw new Error(`PhonePe configuration missing in production: ${missingPhonePeConfig.join(', ')}.`)
}

if (isProduction && !isProductionBuild && googleAuthEnabled && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
  throw new Error('Google sign-in is enabled but GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.')
}

const db = usePostgres
  ? postgresAdapter({
      pool: {
        connectionString: databaseURL,
        max: Number(process.env.DATABASE_POOL_MAX || 20),
      },
      // Shared and production-like databases must change only through committed migrations.
      push: false,
    })
  : sqliteAdapter({
      client: {
        url: 'file:./local.db',
      },
    })

const unavailableEmailAdapter: EmailAdapter = () => ({
  defaultFromAddress: 'noreply@example.com',
  defaultFromName: 'Alemah',
  name: 'unconfigured-email',
  sendEmail: async () => {
    throw new Error(`Transactional email is unavailable until SMTP is configured: ${missingSMTPConfig.join(', ')}.`)
  },
})

const email =
  missingSMTPConfig.length === 0
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'noreply@example.com',
        defaultFromName: process.env.SMTP_FROM_NAME || 'Alemah',
        transportOptions: {
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASS
              ? { pass: process.env.SMTP_PASS, user: process.env.SMTP_USER }
              : undefined,
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
        },
      })
    : isProduction
      ? unavailableEmailAdapter
      : nodemailerAdapter()

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [Users, Wishlists, Pages, Categories, Media],
  db,
  email,
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  endpoints: [],
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    vercelBlobStorage({
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      clientUploads: true,
      collections: { media: true },
      enabled: Boolean(vercelBlobToken),
      token: vercelBlobToken,
    }),
  ],
  secret: payloadSecret || 'development-only-payload-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
