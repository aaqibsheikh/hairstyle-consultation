export interface HairRecommendation {
  title: string
  description: string
  hairCare: string
  images: string[]
  maintenanceSchedule: string[]
}

export interface HairCombination {
  hairColor: string
  hairLength: string
  personalStyle: string
}

// Mapping hair color options to folder names
const hairColorMapping: Record<string, string> = {
  'Blonde': 'blonde',
  'Brunette': 'brunette',
  'Natural Blonde': 'blonde',
  'Brown': 'brunette',
  'Black': 'brunette', // Assuming black hair uses brunette images
  'Red': 'brunette'    // Assuming red hair uses brunette images
}

// Mapping hair length options to folder names
const hairLengthMapping: Record<string, string> = {
  'Short': 'short_hair',
  'Medium': 'medium_hair', 
  'Long': 'long_hair',
  'Extra-long': 'extralong_hair'
}

// Mapping personal style to folder names
const personalStyleMapping: Record<string, string> = {
  'Classic': 'classic',
  'Trendy': 'trendy',
  'Elegant': 'elegant',
  'Minimal': 'minimal'
}

// Base hair recommendations (same content for all hair colors)
const baseRecommendations: Record<string, Omit<HairRecommendation, 'images'>> = {
  'Short-Classic': {
    title: 'Short Hair Classic',
    description: 'With your short and classic style, the best hair color options are an all-over shade or highlights. All-over color is usually refreshed every 4–6 weeks, while highlights can be maintained every 6–8 weeks.',
    hairCare: 'Short hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2 to 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['All-over color: every 4-6 weeks', 'Highlights: every 6-8 weeks', 'Trim: every 2-3 months']
  },
  'Short-Trendy': {
    title: 'Short Hair Trendy',
    description: 'With your short and trendy style, the best hair color option will be highlights. Highlights will add dimension to your hair and can be maintained every 6–8 weeks.',
    hairCare: 'Short hair needs more maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2 to 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Highlights: every 6-8 weeks', 'Trim: every 2-3 months']
  },
  'Short-Elegant': {
    title: 'Short Hair Elegant',
    description: 'With your short and elegant style, the best hair color options are Babylights or Highlights. Babylights are usually done every 10-12 weeks, while Highlights can be maintained every 6–8 weeks.',
    hairCare: 'Short hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2 to 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 10-12 weeks', 'Highlights: every 6-8 weeks', 'Trim: every 2-3 months']
  },
  'Short-Minimal': {
    title: 'Short Hair Minimal',
    description: 'With your short and minimal style, the best hair color options are Babylights or Lowlights. Babylights are usually done every 10-12 weeks, while lowlights can be maintained every 12-16weeks.',
    hairCare: 'Short hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2 to 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 10-12 weeks', 'Lowlights: every 12-16 weeks', 'Trim: every 2-3 months']
  },
  'Medium-Classic': {
    title: 'Medium Hair Classic',
    description: 'With your medium and classic style, the best hair color options are an all-over shade or highlights. All-over color is usually refreshed every 4–6 weeks, while highlights can be maintained every 8-10 weeks.',
    hairCare: 'Medium hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2-3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['All-over color: every 4-6 weeks', 'Highlights: every 8-10 weeks', 'Trim: every 2-3 months']
  },
  'Medium-Trendy': {
    title: 'Medium Hair Trendy',
    description: 'With your medium and trendy style, the best hair color options are Money piece with Balayage, Balayage or Highlights. Money piece and Balayage or Balayage is done every 12 weeks, while highlights can be maintained every 8-10 weeks.',
    hairCare: 'Medium hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2-3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Money piece with Balayage: every 12 weeks', 'Highlights: every 8-10 weeks', 'Trim: every 2-3 months']
  },
  'Medium-Elegant': {
    title: 'Medium Hair Elegant',
    description: 'With your medium and elegant style, the best hair color options are Babylights and Balayage. Babylights are done every 8-12 weeks, while Balayage can be maintained every 12 weeks.',
    hairCare: 'Medium hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2-3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 8-12 weeks', 'Balayage: every 12 weeks', 'Trim: every 2-3 months']
  },
  'Medium-Minimal': {
    title: 'Medium Hair Minimal',
    description: 'With your medium and minimal style, the best hair color options are Babylights, Lowlight or Rootmelt. Babylights are usually done every 8-12 weeks, Lowlights add dimension to your natural and can be done every 12 weeks while Rootmelt can be maintained every 16 weeks.',
    hairCare: 'Medium hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 2-3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 8-12 weeks', 'Lowlights: every 12 weeks', 'Rootmelt: every 16 weeks', 'Trim: every 2-3 months']
  },
  'Long-Classic': {
    title: 'Long Hair Classic',
    description: 'With your long and classic style, the best hair color options are an all-over shade or Highlights. All-over color is usually refreshed every 4–8 weeks, while highlights can be maintained every 12-14 weeks.',
    hairCare: 'Long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['All-over color: every 4-8 weeks', 'Highlights: every 12-14 weeks', 'Trim: every 3 months']
  },
  'Long-Trendy': {
    title: 'Long Hair Trendy',
    description: 'With your long and trendy style, the best hair color options are a Money piece with Balayage, Balayage or Highlights. Money piece and Balayage or Balayage is done every 12 weeks, while highlights can be maintained every 8-10 weeks.',
    hairCare: 'Long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Money piece with Balayage: every 12 weeks', 'Highlights: every 8-10 weeks', 'Trim: every 3 months']
  },
  'Long-Elegant': {
    title: 'Long Hair Elegant',
    description: 'With your long and elegant style, the best hair color options are Babylights and Balayage. Babylights are done every 8-12 weeks, while Balayage can be maintained every 12 weeks.',
    hairCare: 'Long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 8-12 weeks', 'Balayage: every 12 weeks', 'Trim: every 3 months']
  },
  'Long-Minimal': {
    title: 'Long Hair Minimal',
    description: 'With your long and minimal style, the best hair color options are Babylights, Balayage, Lowlight or Rootmelt. Babylights are usually done every 3- 4 months, Balayage can be maintained 4- 6 months, Lowlights add dimension to your natural and can be done every 3 months while Rootmelt can be maintained every 4 months.',
    hairCare: 'Long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 3 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 3-4 months', 'Balayage: every 4-6 months', 'Lowlights: every 3 months', 'Rootmelt: every 4 months', 'Trim: every 3 months']
  },
  'Extra-long-Classic': {
    title: 'Extra Long Hair Classic',
    description: 'With your Extra-long and classic style, the best hair color options are an all-over shade or Highlights. All-over color is usually refreshed every 4–8 weeks, while highlights can be maintained every 12-14 weeks.',
    hairCare: 'Extra-long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 4 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['All-over color: every 4-8 weeks', 'Highlights: every 12-14 weeks', 'Trim: every 4 months']
  },
  'Extra-long-Trendy': {
    title: 'Extra Long Hair Trendy',
    description: 'With your Extra-long and trendy style, the best hair color options are a Money piece with Balayage, Balayage, Highlights or Rootmelt. Money piece and Balayage or Balayage is done every 4-6 months, Highlights can be done every 3-4 months, while Rootmelt can be maintained every 4 months.',
    hairCare: 'Extra-long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 4 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Money piece with Balayage: every 4-6 months', 'Highlights: every 3-4 months', 'Rootmelt: every 4 months', 'Trim: every 4 months']
  },
  'Extra-long-Elegant': {
    title: 'Extra Long Hair Elegant',
    description: 'With your Extra-long and elegant style, the best hair color options are Babylights and Balayage. Babylights are done every 3-4 months, while Balayage can be maintained every 6 months.',
    hairCare: 'Extra-long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 4 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 3-4 months', 'Balayage: every 6 months', 'Trim: every 4 months']
  },
  'Extra-long-Minimal': {
    title: 'Extra Long Hair Minimal',
    description: 'With your Extra-long and minimal style, the best hair color options are Babylights, Balayage, Lowlight or Rootmelt. Babylights are usually done every 3-4 months, Balayage can be maintained every 6 months, Lowlights add dimension to your natural and can be done every 3 months, while Rootmelt can be maintained every 4 months.',
    hairCare: 'Extra-long hair needs maintenance to keep it healthy and vibrant looking, nourish your hair with good quality hair care products, a trim every 4 months with professional hair conditioning treatment.',
    maintenanceSchedule: ['Babylights: every 3-4 months', 'Balayage: every 6 months', 'Lowlights: every 3 months', 'Rootmelt: every 4 months', 'Trim: every 4 months']
  }
}

// Image mapping for different hair colors and styles
const imageMapping: Record<string, Record<string, string[]>> = {
  blonde: {
    'Short-Classic': ['sbc1.jpg', 'sbc2.jpg'],
    'Short-Trendy': ['sbt1.jpg'],
    'Short-Elegant': ['sbc1.jpg'],
    'Short-Minimal': ['sbm1.jpg', 'sbm2.jpg', 'sbm3.jpg'],
    'Medium-Classic': ['mbc1.jpg', 'mbc2.jpg', 'mbc3.jpg', 'mbc4.jpg', 'mbc5.jpg'],
    'Medium-Trendy': ['mbt1.jpg', 'mbt2.jpg', 'mbt3.jpg', 'mbt4.jpg', 'mbt5.jpg'],
    'Medium-Elegant': ['mbe1.jpg', 'mbe2.jpg', 'mbe3.jpg', 'mbe4.jpg'],
    'Medium-Minimal': ['mbm1.jpg', 'mbm2.jpg', 'mbm3.jpg', 'mbm4.jpg'],
    'Long-Classic': ['lbc1.jpg', 'lbc2.jpg', 'lbc3.jpg', 'lbc4.jpg', 'lbc5.jpg'],
    'Long-Trendy': ['lbt1.jpg', 'lbt2.jpg', 'lbt3.jpg', 'lbt4.jpg', 'lbt5.jpg', 'lbt6.jpg', 'lbt7.jpg'],
    'Long-Elegant': ['lbe1.jpg', 'lbe2.jpg', 'lbe3.jpg', 'lbe4.jpg', 'lbe5.jpg', 'lbe6.jpg'],
    'Long-Minimal': ['lbm1.jpg', 'lbm2.jpg', 'lbm3.jpg', 'lbm4.jpg', 'lbm5.jpg', 'lbm6.jpg', 'lbm7.jpg'],
    'Extra-long-Classic': ['elbc1.jpg', 'elbc2.jpg', 'elbc3.jpg'],
    'Extra-long-Trendy': ['elbt1.jpg', 'elbt2.jpg', 'elbt3.jpg', 'elbt4.jpg'],
    'Extra-long-Elegant': ['elbe1.jpg', 'elbe2.jpg', 'elbe3.jpg', 'elbe4.jpg', 'elbe5.jpg', 'elbe6.jpg', 'elbe7.jpg'],
    'Extra-long-Minimal': ['elm1.jpg', 'elm2.jpg', 'elm3.jpg', 'elm4.jpg', 'elm5.jpg', 'elm6.jpg', 'elm7.jpg', 'elm8.jpg']
  },
  brunette: {
    'Short-Classic': ['asc1.jpg', 'asc2.jpg', 'asc3.jpg', 'asc4.jpg'],
    'Short-Trendy': ['ast1.jpg', 'ast2.jpg', 'ast3.jpg', 'ast4.jpg', 'ast5.jpg'],
    'Short-Elegant': ['ase1.jpg', 'ase2.jpg', 'ase3.jpg'],
    'Short-Minimal': ['asm1.jpg', 'asm2.jpg', 'asm3.jpg'],
    'Medium-Classic': ['amc1.jpg', 'amc2.jpg', 'amc3.jpg', 'amc4.jpg', 'amc5.jpg', 'amc6.jpg'],
    'Medium-Trendy': ['amt1.jpg', 'amt2.jpg', 'amt3.jpg', 'amt4.jpg', 'amt5.jpg', 'amt6.jpg', 'amt7.jpg', 'amt8.jpg'],
    'Medium-Elegant': ['ame1.jpg', 'ame2.jpg', 'ame3.jpg', 'ame4.jpg', 'ame5.jpg'],
    'Medium-Minimal': ['amm1.jpg', 'amm2.jpg', 'amm3.jpg', 'amm4.jpg', 'amm5.jpg'],
    'Long-Classic': ['alc1.jpg', 'alc2.jpg', 'alc3.jpg', 'alc4.jpg', 'alc5.jpg'],
    'Long-Trendy': ['alt1.jpg', 'alt2.jpg', 'alt3.jpg', 'alt4.jpg', 'alt5.jpg', 'alt6.jpg', 'alt7.jpg', 'alt8.jpg'],
    'Long-Elegant': ['ale1.jpg', 'ale2.jpg', 'ale3.jpg', 'ale4.jpg', 'ale5.jpg', 'ale6.jpg', 'ale7.jpg'],
    'Long-Minimal': ['alm1.jpg', 'alm2.jpg', 'alm3.jpg', 'alm4.jpg', 'alm5.jpg', 'alm6.jpg'],
    'Extra-long-Classic': ['aelc1.jpg', 'aelc2.jpg', 'aelc3.jpg', 'aelc4.jpg'],
    'Extra-long-Trendy': ['aelt1.jpg', 'aelt2.jpg', 'aelt3.jpg', 'aelt4.jpg', 'aelt5.jpg', 'aelt6.jpg', 'aelt7.jpg'],
    'Extra-long-Elegant': ['aele1.jpg', 'aele2.jpg', 'aele3.jpg', 'aele4.jpg', 'aele5.jpg', 'aele6.jpg', 'aele7.jpg'],
    'Extra-long-Minimal': ['aelm1.jpg', 'aelm2.jpg', 'aelm3.jpg', 'aelm4.jpg', 'aelm5.jpg']
  }
}

export function getHairRecommendation(combination: HairCombination): HairRecommendation | null {
  const { hairColor, hairLength, personalStyle } = combination
  
  const key = `${hairLength}-${personalStyle}`
  const baseRecommendation = baseRecommendations[key]
  
  if (!baseRecommendation) {
    return null
  }
  
  // Get the appropriate images based on hair color
  const colorFolder = hairColorMapping[hairColor]
  const images = imageMapping[colorFolder]?.[key] || []
  
  return {
    ...baseRecommendation,
    images
  }
}

export function getImagePath(hairColor: string, hairLength: string, personalStyle: string, imageName: string): string {
  const colorFolder = hairColorMapping[hairColor]
  const lengthFolder = hairLengthMapping[hairLength]
  const styleFolder = personalStyleMapping[personalStyle]
  
  if (!colorFolder || !lengthFolder || !styleFolder) {
    return ''
  }
  
  return `/${colorFolder}/${lengthFolder}/${styleFolder}/${imageName}`
}

export function getAllRecommendationImages(combination: HairCombination): string[] {
  const recommendation = getHairRecommendation(combination)
  if (!recommendation) return []
  
  return recommendation.images.map(imageName => 
    getImagePath(combination.hairColor, combination.hairLength, combination.personalStyle, imageName)
  )
}
