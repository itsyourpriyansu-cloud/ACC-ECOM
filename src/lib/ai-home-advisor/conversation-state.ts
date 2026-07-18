import type { AdvisorIntent } from './intent-schema'

const lower = (value: string) => value.toLowerCase()
const categories: Record<string, string> = { curtain: 'curtains', curtains: 'curtains', bedsheet: 'bedsheets', bedsheets: 'bedsheets', cushion: 'cushion-covers', pillow: 'pillowcases' }
const colourWords = ['white', 'cream', 'beige', 'grey', 'gray', 'blue', 'green', 'maroon', 'brown', 'pink', 'black']

export function mergeHeuristicIntent(current: AdvisorIntent, message: string): AdvisorIntent {
  const value = lower(message)
  const next = structuredClone(current)
  for (const [word, slug] of Object.entries(categories)) if (value.includes(word)) next.categorySlug = slug
  if (/bedroom|living room|drawing room|kitchen|balcony|door/.test(value)) next.room = (value.match(/bedroom|living room|drawing room|kitchen|balcony|door/) || [])[0] || next.room
  for (const colour of colourWords) if (value.includes(colour) && !next.preferredColours.includes(colour)) next.preferredColours.push(colour)
  if (/blackout|dark|privacy/.test(value) && !next.needs.includes('privacy')) next.needs.push('privacy')
  if (/soft daylight|light filtering|sheer/.test(value) && !next.needs.includes('light filtering')) next.needs.push('light filtering')
  const feet = value.match(/(\d+(?:\.\d+)?)\s*(?:feet|foot|ft)/)
  const cm = value.match(/(\d+(?:\.\d+)?)\s*cm/)
  if (feet) next.measurements.heightCm = Math.round(Number(feet[1]) * 30.48)
  if (cm) next.measurements.heightCm = Math.round(Number(cm[1]))
  const budget = value.match(/(?:₹|rs\.?|rupees?)\s*(\d{2,6})/)
  if (budget) next.budgetMaxPaise = Number(budget[1]) * 100
  return next
}

export function nextAdvisorQuestion(state: AdvisorIntent) {
  const language = state.language
  const copy = language === 'hinglish'
    ? ['Aap kis cheez ke liye help chahte hain—curtains ya koi aur home textile?', 'Yeh kis room ya use ke liye hai?', 'Aapke liye sabse important kya hai: privacy, soft daylight, darker room, easy hanging, ya style?', 'Aapko kitni curtain drop chahiye? Feet ya centimetres mein bata sakte hain.', 'Aapka budget kya hai, ya main best available options dikhaun?']
    : language === 'hindi'
      ? ['आप किस चीज़ के लिए मदद चाहते हैं—परदे या कोई और होम टेक्सटाइल?', 'यह किस कमरे या उपयोग के लिए है?', 'आपके लिए सबसे ज़रूरी क्या है: प्राइवेसी, हल्की रोशनी, गहरा कमरा, आसान हैंगिंग, या स्टाइल?', 'आपको कितनी पर्दे की लंबाई चाहिए? फीट या सेंटीमीटर में बता सकते हैं।', 'आपका बजट क्या है, या मैं सबसे अच्छे उपलब्ध विकल्प दिखाऊँ?']
      : ['What would you like help choosing—curtains or another home textile?', 'Which room or application is this for?', 'What matters most: privacy, soft daylight, a darker room, easy hanging, or style?', 'What curtain drop do you need? You can enter feet or centimetres.', 'Do you have a budget in mind, or should I show the best available matches?']
  if (!state.categorySlug) return copy[0]
  if (!state.room) return copy[1]
  if (!state.needs.length) return copy[2]
  if (state.categorySlug === 'curtains' && !state.measurements.heightCm) return copy[3]
  if (!state.budgetMaxPaise) return copy[4]
  return null
}

export function guidedReply(state: AdvisorIntent) {
  const question = nextAdvisorQuestion(state)
  return question || 'I have enough to check the currently published catalogue for the closest matches.'
}
