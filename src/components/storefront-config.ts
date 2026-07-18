export const shopLink = (params: Record<string, string> = {}) => {
  const search = new URLSearchParams(params)
  return `/shop${search.size ? `?${search.toString()}` : ''}`
}

export const curtainColors = [
  { name: 'Ash Grey', value: '#9a9a98' },
  { name: 'Beige', value: '#d2b48c' },
  { name: 'Maroon', value: '#6d1f2a' },
  { name: 'Ruby Red', value: '#a32035' },
  { name: 'Pastel Pink', value: '#eab7bc' },
  { name: 'Yellow', value: '#d7aa31' },
  { name: 'Sea Blue', value: '#5a9bb2' },
  { name: 'Blue Multi', value: 'linear-gradient(135deg, #335f8a 50%, #e7ba45 50%)' },
  { name: 'Parrot Green', value: '#5f9b4b' },
] as const

export const shopMenuGroups = [
  { title: 'Shop by type', links: [
    ['Window Curtains', shopLink({ type: 'window' })], ['Door Curtains', shopLink({ type: 'door' })],
    ['Striped Curtains', shopLink({ pattern: 'striped' })], ['Solid Curtains', shopLink({ pattern: 'solid' })],
    ['Blackout & Room-Darkening', shopLink({ light: 'darkening' })], ['Combos & Sets', shopLink({ pack: '2' })], ['Shop All Curtains', '/shop'],
  ] },
  { title: 'Shop by size', links: [
    ['5 ft Curtains', shopLink({ size: '5 ft' })], ['6 ft Curtains', shopLink({ size: '6 ft' })],
    ['6.5 ft Curtains', shopLink({ size: '6.5 ft' })], ['7 ft Curtains', shopLink({ size: '7 ft' })],
    ['8 ft Curtains', shopLink({ size: '8 ft' })], ['9 ft+ Extra-Long', shopLink({ size: '9 ft' })],
  ] },
  { title: 'Featured', links: [
    ['Best Sellers', shopLink({ sort: 'best' })], ['Customer Favorites', shopLink({ sort: 'best' })],
    ['Value Packs', shopLink({ pack: '2' })],
  ] },
] as const

export const curtainMenu = [
  ['Window Curtains', shopLink({ type: 'window' })], ['Door Curtains', shopLink({ type: 'door' })],
  ['Striped Collection', shopLink({ pattern: 'striped' })], ['Solid Collection', shopLink({ pattern: 'solid' })],
  ['Light-Filtering Curtains', shopLink({ light: 'light filtering' })], ['Room-Darkening Curtains', shopLink({ light: 'room darkening' })],
] as const

export const guideMenu = [
  ['Curtain Size Guide', '/#size-guide'], ['Fabric & Light Guide', '/#fabric-guide'], ['How to Measure', '/#size-guide'],
  ['Installation Tips', '/faq'], ['Washing & Maintenance', '/faq'], ['Curtain Styling Ideas', '/#signature-stripes'], ['FAQ', '/faq'],
] as const
