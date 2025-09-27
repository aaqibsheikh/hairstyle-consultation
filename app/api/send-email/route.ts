import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { getHairRecommendation, getAllRecommendationImages, type HairCombination } from '../../utils/hairRecommendations'
import fs from 'fs'
import path from 'path'

// Helper function to get image as base64 - handles both local files and URLs
async function getImageAsBase64(imagePath: string, baseUrl: string): Promise<{ data: string; mimeType: string; filename: string } | null> {
  try {
    console.log('Processing image:', imagePath)

    // Check if it's a local file path (starts with /)
    if (imagePath.startsWith('/')) {
      try {
        // Try to read from public directory first
        const publicPath = path.join(process.cwd(), 'public', imagePath)
        if (fs.existsSync(publicPath)) {
          const imageBuffer = fs.readFileSync(publicPath)
          const base64 = imageBuffer.toString('base64')
          const ext = path.extname(imagePath).toLowerCase()
          const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
          }
          const mimeType = mimeTypes[ext] || 'image/jpeg'

          console.log(`Successfully read local file: ${publicPath}`)
          return { data: base64, mimeType, filename: path.basename(imagePath) }
        }
      } catch (error) {
        console.log('Local file not found, trying URL approach:', error)
      }
    }

    // If not a local file or local file not found, try URL approach
    const fullUrl = imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`
    console.log('Fetching image from URL:', fullUrl)

    const response = await fetch(fullUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    const filename = imagePath.split('/').pop() || `image_${Date.now()}.jpg`

    console.log('Successfully fetched image from URL')
    return { data: base64, mimeType, filename }

  } catch (error) {
    console.error('Error processing image:', error)
    return null
  }
}

// Helper function to create embedded image CID
function createCid(index: number, imageName: string): string {
  const cleanName = imageName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  return `image_${index}_${cleanName}`
}

export async function POST(request: NextRequest) {
  try {
    const { email, dates, formData, sendAdditionalEmail } = await request.json()

    if (!email || !dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Create transporter with better configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    })

    // Verify transporter configuration
    try {
      await transporter.verify()
      console.log('Email transporter verified successfully')
    } catch (error) {
      console.error('Email transporter verification failed:', error)
      return NextResponse.json(
        { error: 'Email service configuration error' },
        { status: 500 }
      )
    }

    // Format dates for email
    const formattedDates = dates
      .map((dateStr: string, index: number) => {
        const date = new Date(dateStr)
        return `${index + 1}. ${format(date, 'EEEE, MMMM d, yyyy')}`
      })
      .join('<br>')

    // Get hair recommendations
    const combination: HairCombination = {
      hairColor: formData.selectedHairColor,
      hairLength: formData.hairLength,
      personalStyle: formData.personalStyle
    }

    const recommendation = getHairRecommendation(combination)
    const images = getAllRecommendationImages(combination)

    // Get base URL for images
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host') || 'localhost:3000'}`
    console.log('Base URL for images:', baseUrl)
    console.log('Available images:', images)

    // Prepare images for email embedding
    const embeddedImages: Array<{ cid: string; imageData: any; filename: string; alt: string }> = []
    let imagesHtml = ''

    if (recommendation && images && images.length > 0) {
      console.log('Processing images for email embedding...')

      // Process up to 4 images for email
      const imagesToProcess = images.slice(0, 4)

      for (let i = 0; i < imagesToProcess.length; i++) {
        const imagePath = imagesToProcess[i]
        if (!imagePath) continue

        const imageData = await getImageAsBase64(imagePath, baseUrl)

        if (imageData) {
          const filename = imageData.filename
          const alt = `Style ${i + 1}`
          const cid = createCid(i, filename)

          embeddedImages.push({
            cid,
            imageData,
            filename,
            alt
          })

          // Create HTML for this image (will be embedded via CID)
          imagesHtml += `
            <div style="text-align: center; padding: 10px; margin: 5px;">
              <div style="width: 100%; height: 120px; margin-bottom: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="cid:${cid}" 
                  alt="${alt}" 
                  style="max-width: 100%; max-height: 100%; object-fit: contain;"
                  border="0"
                />
              </div>
              <div style="font-size: 12px; color: #000000; font-weight: bold;">${alt}</div>
            </div>
          `
        } else {
          console.warn(`Failed to process image: ${imagePath}`)
        }
      }

      console.log(`Successfully prepared ${embeddedImages.length} images for embedding`)
    } else {
      console.log('No recommendation or images available')
    }

    // Build clean email HTML with black text and NO boxes
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hair Consultation Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000000; background-color: #ffffff; line-height: 1.6;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 30px; font-size: 28px; color: #000000;">Hair Consultation Form</h1>
          
          <!-- Personal Information Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin-bottom: 15px; font-size: 20px; color: #000000;">Personal Information</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="color: #000000;">
                <strong>Name:</strong> ${formData.firstName} ${formData.lastName}
              </div>
              <div style="color: #000000;">
                <strong>Email:</strong> ${formData.email}
              </div>
              <div style="color: #000000;">
                <strong>Phone:</strong> ${formData.phone || 'Not provided'}
              </div>
              <div style="color: #000000;">
                <strong>Natural Hair Color:</strong> ${formData.naturalHairColor || 'Not specified'}
              </div>
            </div>
          </div>

          <!-- Hair Analysis Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin-bottom: 15px; font-size: 20px; color: #000000;">Hair Analysis</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="color: #000000;">
                <strong>Hair Length:</strong> ${formData.hairLength || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Personal Style:</strong> ${formData.personalStyle || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Skin Tone:</strong> ${formData.skinColor || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Eye Color:</strong> ${formData.eyeColor || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Hair Texture:</strong> ${formData.hairTexture || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Maintenance Preference:</strong> ${formData.hairMaintenance || 'Not specified'}
              </div>
            </div>
          </div>

          <!-- Recommendations Section -->
          ${recommendation ? `
          <div style="margin-bottom: 30px;">
            <h2 style="margin-bottom: 15px; font-size: 20px; color: #000000;">Your Personalized Hair Recommendations</h2>
            
            <div style="margin-bottom: 20px;">
              <h3 style="margin-bottom: 10px; font-size: 18px; color: #000000;">${recommendation.title}</h3>
              
              <div style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 8px; font-size: 16px; color: #000000;">Recommended Treatments:</h4>
                <p style="line-height: 1.6; margin-bottom: 0; color: #000000;">${recommendation.description}</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 8px; font-size: 16px; color: #000000;">Hair Care Routine:</h4>
                <p style="line-height: 1.6; margin-bottom: 0; color: #000000;">${recommendation.hairCare}</p>
              </div>
              
              <div>
                <h4 style="margin-bottom: 8px; font-size: 16px; color: #000000;">Maintenance Schedule:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #000000;">
                  ${recommendation.maintenanceSchedule.map(schedule => `<li style="margin-bottom: 5px;">${schedule}</li>`).join('')}
                </ul>
              </div>
            </div>
            
            ${imagesHtml ? `
            <div style="margin-top: 20px;">
              <h4 style="margin-bottom: 15px; font-size: 16px; color: #000000;">Recommended Style Visuals</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                ${imagesHtml}
              </div>
            </div>
            ` : `
            <div style="margin-top: 20px;">
              <h4 style="margin-bottom: 10px; font-size: 16px; color: #000000;">Recommended Styles:</h4>
              <p style="color: #000000;">No style images available for your hair combination.</p>
            </div>
            `}
          </div>
          ` : ''}

          <!-- Preferences & Treatments Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin-bottom: 15px; font-size: 20px; color: #000000;">Preferences & Treatments</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="color: #000000;">
                <strong>Special Occasions:</strong> ${formData.specialOccasions?.join(', ') || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Preferred Treatments:</strong> ${formData.preferredTreatments?.join(', ') || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Work Type:</strong> ${formData.workType || 'Not specified'}
              </div>
              <div style="color: #000000;">
                <strong>Work Industry:</strong> ${formData.workIndustry || 'Not specified'}
              </div>
            </div>
          </div>

          <!-- Selected Perfect Hair Days Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin-bottom: 15px; font-size: 20px; color: #000000;">Selected Perfect Hair Days</h2>
            
            <div style="margin-bottom: 15px;">
              <p style="margin-bottom: 10px; color: #000000;">
                Here are the dates you selected for your perfect hair days:
              </p>
              <div style="color: #000000; padding-left: 10px;">
                ${formattedDates}
              </div>
            </div>
            
            <div style="color: #000000; margin-bottom: 10px;">
              <strong>Total appointments scheduled:</strong> ${dates.length}
            </div>
            
            <p style="font-size: 14px; font-style: italic; margin-top: 10px; color: #000000;">
              We'll send you a reminder 2 weeks before each date to consult or set an appointment.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #000000;">
              Thank you for choosing our hair consultation service! We'll be in touch soon to schedule your perfect hair days.
            </p>
            <p style="font-size: 12px; margin-top: 8px; color: #666666;">
              This email was sent from your Hair Consultation Form application.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Email content with embedded images
    const mailOptions: any = {
      from: `"Hair Consultation" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Your Hair Consultation Form Submission',
      html: emailHtml,
      attachments: []
    }

    // Add attachments for embedded images
    if (embeddedImages.length > 0) {
      for (const embeddedImage of embeddedImages) {
        mailOptions.attachments.push({
          filename: embeddedImage.filename,
          content: embeddedImage.imageData.data,
          encoding: 'base64',
          contentType: embeddedImage.imageData.mimeType,
          cid: embeddedImage.cid
        })
      }
      console.log(`Added ${embeddedImages.length} image attachments to email`)
    } else {
      console.log('No images to attach')
    }

    // Send email
    const emailResult = await transporter.sendMail(mailOptions)
    console.log('Main email sent successfully:', emailResult.messageId)

    // Send additional email if requested (simple dates only email with name and email)
    if (sendAdditionalEmail) {
      const mailOptionsDatesOnly = {
        from: `"Hair Consultation" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: 'Your Selected Perfect Hair Days',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #000000; line-height: 1.6;">
            <h2 style="margin-bottom: 15px; font-size: 20px; color: #000000;">Selected Perfect Hair Days</h2>
            
            <div style="margin-bottom: 15px;">
              <p style="color: #000000;"><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
              <p style="color: #000000;"><strong>Email:</strong> ${formData.email}</p>
            </div>
            
            <p style="margin-bottom: 10px; color: #000000;">
              Here are the dates you selected for your perfect hair days:
            </p>
            <div style="color: #000000; padding-left: 10px; margin-bottom: 15px;">
              ${formattedDates}
            </div>
            <p style="font-size: 14px; color: #000000;">
              <strong>Total dates selected:</strong> ${dates.length}
            </p>
            <p style="font-size: 12px; font-style: italic; margin-top: 10px; color: #000000;">
              We'll send you a reminder 2 weeks before each date to consult or set an appointment.
            </p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptionsDatesOnly)
      console.log('Additional email sent successfully')
    }

    return NextResponse.json(
      {
        message: 'Form submitted successfully and emails sent',
        imagesProcessed: embeddedImages.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}