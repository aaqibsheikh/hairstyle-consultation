import { NextRequest, NextResponse } from 'next/server'
import { getAllRecommendationImages } from '../../utils/hairRecommendations'

export async function GET(request: NextRequest) {
  try {
    // Test with blonde short classic
    const combination = {
      hairColor: 'Blonde',
      hairLength: 'Short',
      personalStyle: 'Classic'
    }
    
    const images = getAllRecommendationImages(combination)
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host') || 'localhost:3000'}`
    
    const imageUrls = images.map(imagePath => `${baseUrl}${imagePath}`)
    
    return NextResponse.json({
      success: true,
      baseUrl,
      imagePaths: images,
      imageUrls,
      message: 'Image URLs generated successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
