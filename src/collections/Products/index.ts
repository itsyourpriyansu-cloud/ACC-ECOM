import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'sku', 'catalogue.salesRank', 'enableVariants', '_status'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInINR: true,
    inventory: true,
    meta: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'sku',
      type: 'text',
      unique: true,
      index: true,
      required: true,
      admin: {
        description: 'Internal product code used for inventory and catalogue reconciliation.',
        position: 'sidebar',
      },
    },
    {
      name: 'asin',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Original marketplace identifier, retained for catalogue reconciliation.',
        position: 'sidebar',
      },
    },
    {
      name: 'catalogue',
      type: 'group',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'salesRank', type: 'number', admin: { readOnly: true } },
        {
          name: 'visual',
          type: 'group',
          admin: {
            description: 'Temporary stock visual for storefront previews. Replace with approved product photography before launch.',
          },
          fields: [
            { name: 'stockImageUrl', type: 'text', admin: { description: 'External image URL used by the storefront.' } },
            { name: 'alt', type: 'text' },
          ],
        },
        {
          name: 'pricingNote',
          type: 'textarea',
          admin: {
            description: 'Import note about the provenance of the displayed reference price.',
            readOnly: true,
          },
        },
        {
          name: 'variantGroupKey',
          type: 'text',
          index: true,
          admin: {
            description: 'Products with the same key represent colour variants of one merchandising group.',
          },
        },
        {
          name: 'attributes',
          type: 'group',
          fields: [
            { name: 'size', type: 'text' },
            { name: 'sizeInches', type: 'number' },
            { name: 'curtainType', type: 'text' },
            { name: 'fabric', type: 'text' },
            { name: 'pattern', type: 'text' },
            { name: 'opacity', type: 'text' },
            { name: 'color', type: 'text' },
            { name: 'colorFamily', type: 'text' },
            { name: 'recommendedRoom', type: 'text' },
            { name: 'packOf', type: 'number' },
            { name: 'closureType', type: 'text' },
            { name: 'installation', type: 'text' },
            { name: 'styleNote', type: 'text' },
          ],
        },
        {
          name: 'salesInsight',
          type: 'group',
          admin: { readOnly: true },
          fields: [
            { name: 'sessions90d', type: 'number' },
            { name: 'unitsOrdered', type: 'number' },
            { name: 'revenueINR', type: 'number' },
            { name: 'conversionRatePct', type: 'number' },
            { name: 'sourceNote', type: 'textarea' },
          ],
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      labels: { plural: 'Highlights', singular: 'Highlight' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'faqs',
      type: 'array',
      labels: { plural: 'FAQs', singular: 'FAQ' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'seoKeywords',
      type: 'group',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'focusKeyword', type: 'text' },
        { name: 'secondaryKeywords', type: 'array', fields: [{ name: 'keyword', type: 'text' }] },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'slug',
      type: 'text',
    },
  ],
})
