import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { getHairRecommendation, getAllRecommendationImages, type HairCombination } from '../../utils/hairRecommendations'

// Helper function to fetch image as data URL for email
async function fetchImageAsDataURLForEmail(imagePath: string, baseUrl: string): Promise<string | null> {
  try {
    const fullUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`
    console.log('Fetching image for email:', fullUrl)
    
    const response = await fetch(fullUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image for email: ${response.status} ${response.statusText}`)
      return null
    }
    
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('Error fetching image for email:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, dates, formData } = await request.json()

    if (!email || !dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Create transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER, // Add this to your .env.local file
        pass: process.env.EMAIL_PASS, // Add this to your .env.local file
      },
    })

    // Format dates for email
    const formattedDates = dates
      .map((dateStr: string) => {
        const date = new Date(dateStr)
        return format(date, 'EEEE, MMMM d, yyyy')
      })
      .join('\n• ')

    // Get hair recommendations
    const combination: HairCombination = {
      hairColor: formData.selectedHairColor,
      hairLength: formData.hairLength,
      personalStyle: formData.personalStyle
    }
    
    const recommendation = getHairRecommendation(combination)
    const images = getAllRecommendationImages(combination)
    
    // Get base URL for images
    const baseUrl = process.env.NEXTAUTH_URL || `http://${request.headers.get('host') || 'localhost:3000'}`
    
    // Convert recommendation images to full URLs for email
    let imageUrls: string[] = []
    if (recommendation && images.length > 0) {
      console.log('Preparing image URLs for email...')
      console.log('Full image paths:', images)
      for (const imagePath of images.slice(0, 4)) {
        console.log('Processing image for email:', imagePath)
        const fullImageUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`
        imageUrls.push(fullImageUrl)
        console.log('Full image URL:', fullImageUrl)
      }
      console.log(`Prepared ${imageUrls.length} image URLs for email`)
    }

    // Debug: Log the image URLs that will be used in email
    console.log('=== EMAIL DEBUG INFO ===')
    console.log('Base URL:', baseUrl)
    console.log('Number of image URLs:', imageUrls.length)
    console.log('Image URLs:', imageUrls)
    
    // Test: Create a simple HTML snippet with one image to test
    if (imageUrls.length > 0) {
      const testHtml = `<div><h3>Test Image:</h3><img src="${imageUrls[0]}" style="width: 100px; height: 100px;" alt="test" /></div>`
      console.log('Test HTML snippet:', testHtml)
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Hair Consultation Form Submission',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 20px;">
          <h1 style="color: white; text-align: center; margin-bottom: 30px; font-size: 32px;">Hair Consultation Form</h1>
          
          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 24px;">Personal Information</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <strong>Name:</strong> ${formData.firstName} ${formData.lastName}
              </div>
              <div>
                <strong>Email:</strong> ${formData.email}
              </div>
              <div>
                <strong>Phone:</strong> ${formData.phone}
              </div>
              <div>
                <strong>Natural Hair Color:</strong> ${formData.naturalHairColor || 'Not specified'}
              </div>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 24px;">Hair Analysis</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <strong>Hair Length:</strong> ${formData.hairLength || 'Not specified'}
              </div>
              <div>
                <strong>Personal Style:</strong> ${formData.personalStyle || 'Not specified'}
              </div>
              <div>
                <strong>Skin Color:</strong> ${formData.skinColor || 'Not specified'}
              </div>
              <div>
                <strong>Eye Color:</strong> ${formData.eyeColor || 'Not specified'}
              </div>
              <div>
                <strong>Hair Texture:</strong> ${formData.hairTexture || 'Not specified'}
              </div>
              <div>
                <strong>Maintenance:</strong> ${formData.hairMaintenance || 'Not specified'}
              </div>
            </div>
          </div>

            ${recommendation ? `
          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 24px;">Your Personalized Hair Recommendations</h2>
            <div style="background: rgba(255, 127, 80, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h3 style="color: #ff7f50; margin-bottom: 15px; font-size: 20px;">${recommendation.title}</h3>
              
              <div style="margin-bottom: 15px;">
                <h4 style="color: #ff7f50; margin-bottom: 8px; font-size: 16px;">Recommended Treatments:</h4>
                <p style="color: white; line-height: 1.6; margin-bottom: 0;">${recommendation.description}</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h4 style="color: #ff7f50; margin-bottom: 8px; font-size: 16px;">Hair Care Routine:</h4>
                <p style="color: white; line-height: 1.6; margin-bottom: 0;">${recommendation.hairCare}</p>
              </div>
              
              <div>
                <h4 style="color: #ff7f50; margin-bottom: 8px; font-size: 16px;">Maintenance Schedule:</h4>
                <ul style="color: white; margin: 0; padding-left: 20px;">
                  ${recommendation.maintenanceSchedule.map(schedule => `<li style="margin-bottom: 5px;">${schedule}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            ${imageUrls.length > 0 ? `
            <div style="margin-top: 20px;">
              <h4 style="color: #ff7f50; margin-bottom: 15px; font-size: 16px;">Recommended Styles:</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                ${imageUrls.map((imageUrl, index) => {
                  const imageName = images[index]?.split('/').pop() || `style-${index + 1}`
                  return `
                    <div style="text-align: center; background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px;">
                      <div style="width: 100%; height: 120px; border-radius: 8px; margin-bottom: 10px; border: 2px solid rgba(255, 127, 80, 0.3); overflow: hidden; background: rgba(255, 255, 255, 0.05);">
                        <img 
                          src="${imageUrl}" 
                          alt="${imageName}" 
                          style="width: 100%; height: 100%; object-fit: cover; display: block;"
                          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        />
                        <div style="display: none; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.1); align-items: center; justify-content: center; text-align: center;">
                          <div>
                            <div style="font-size: 24px; margin-bottom: 8px; color: #ff7f50;">💇‍♀️</div>
                            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.7);">${imageName}</div>
                          </div>
                        </div>
                      </div>
                      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">${imageName.replace('.jpg', '')}</div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
            ` : `
            <div style="margin-top: 20px;">
              <h4 style="color: #ff7f50; margin-bottom: 15px; font-size: 16px;">Recommended Styles:</h4>
              <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; text-align: center;">
                <p style="color: white; margin: 0;">Images for your recommended styles are being processed. Please check your PDF report for the complete visual recommendations.</p>
              </div>
            </div>
            `}
          </div>
          ` : ''}

          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 24px;">Preferences & Treatments</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <strong>Special Occasions:</strong> ${formData.specialOccasions?.join(', ') || 'Not specified'}
              </div>
              <div>
                <strong>Preferred Treatments:</strong> ${formData.preferredTreatments?.join(', ') || 'Not specified'}
              </div>
              <div>
                <strong>Work Type:</strong> ${formData.workType || 'Not specified'}
              </div>
              <div>
                <strong>Work Industry:</strong> ${formData.workIndustry || 'Not specified'}
              </div>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 24px;">Selected Perfect Hair Days</h2>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 15px;">
              Here are the dates you selected for your perfect hair days:
            </p>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <ul style="margin: 0; padding-left: 20px; color: white;">
                <li>${formattedDates}</li>
              </ul>
            </div>
            <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">
              <strong>Total dates selected:</strong> ${dates.length}
            </p>
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 12px; font-style: italic; margin-top: 15px;">
              We'll send you a reminder 2 weeks before each date to consult or set an appointment.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">
              Thank you for choosing our hair consultation service! We'll be in touch soon to schedule your perfect hair days.
            </p>
            <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-top: 10px;">
              This email was sent from your Hair Consultation Form application.
            </p>
          </div>
        </div>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'Form submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
