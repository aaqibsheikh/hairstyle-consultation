import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { format } from 'date-fns'

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
                <strong>Lifestyle:</strong> ${formData.lifestyle.join(', ') || 'Not specified'}
              </div>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 20px; font-size: 24px;">Style Preferences</h2>
            <table style="width: 100%; border-collapse: collapse; color: white;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.3);">
                  <th style="text-align: left; padding: 12px; font-weight: bold;">Service</th>
                  <th style="text-align: center; padding: 12px; font-weight: bold;">Experience</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                  <td style="padding: 12px;">Balayage</td>
                  <td style="text-align: center; padding: 12px;">${formData.questionnaire.balayage || 'Not specified'}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                  <td style="padding: 12px;">Highlights</td>
                  <td style="text-align: center; padding: 12px;">${formData.questionnaire.highlights || 'Not specified'}</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                  <td style="padding: 12px;">Babylights</td>
                  <td style="text-align: center; padding: 12px;">${formData.questionnaire.babylights || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px;">Hair Extensions</td>
                  <td style="text-align: center; padding: 12px;">${formData.questionnaire.extensions || 'Not specified'}</td>
                </tr>
              </tbody>
            </table>
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
