'use client'

import { useState } from 'react'
import Calendar from 'react-calendar'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'react-calendar/dist/Calendar.css'
import ImageGallery from './components/ImageGallery'
import { getHairRecommendation, getAllRecommendationImages, type HairCombination } from './utils/hairRecommendations'
import { fetchImageAsDataURL } from './utils/pdfImageLoader'
import mkhLogo from '/public/mkh-logo.jpg';
import Image from 'next/image'

type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

interface FormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string

  // Hair Color Selection
  selectedHairColor: string

  // Hair Analysis
  naturalHairColor: string
  skinColor: string
  eyeColor: string
  hairTexture: string
  hairLength: string
  personalStyle: string
  hairMaintenance: string
  specialOccasions: string[]
  preferredTreatments: string[]
  workType: string
  workIndustry: string

  // Files and Calendar
  files: File[]
  selectedDates: Date[]
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    selectedHairColor: '',
    naturalHairColor: '',
    skinColor: '',
    eyeColor: '',
    hairTexture: '',
    hairLength: '',
    personalStyle: '',
    hairMaintenance: '',
    specialOccasions: [],
    preferredTreatments: [],
    workType: '',
    workIndustry: '',
    files: [],
    selectedDates: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [message, setMessage] = useState('')

  const totalSlides = 12

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'))

    if (nonImageFiles.length > 0) {
      setMessage('Please upload only image files (JPG, PNG, GIF, etc.)')
      return
    }

    if (imageFiles.length + formData.files.length <= 5) {
      setFormData(prev => ({ ...prev, files: [...prev.files, ...imageFiles] }))
    } else {
      setMessage('You can only upload up to 5 image files')
    }
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const handleDayClick = (value: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (value < today) {
      setMessage('Cannot select past dates. Please choose a future date.')
      return
    }

    const dateStr = format(value, 'yyyy-MM-dd')
    const isSelected = formData.selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr)
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selectedDates: prev.selectedDates.filter(d => format(d, 'yyyy-MM-dd') !== dateStr)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        selectedDates: [...prev.selectedDates, value]
      }))
    }
  }

  const clearSelection = () => {
    setFormData(prev => ({ ...prev, selectedDates: [] }))
  }

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      const next = currentSlide + 1
      // Temporarily skip slide 11
      setCurrentSlide(next === 11 ? 12 : next)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 1) {
      const prev = currentSlide - 1
      // Temporarily skip slide 11
      setCurrentSlide(prev === 11 ? 10 : prev)
    }
  }

  const goToSlide = (slide: number) => {
    setCurrentSlide(slide)
  }

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd')
      const isSelected = formData.selectedDates.some(
        selectedDate => format(selectedDate, 'yyyy-MM-dd') === dateStr
      )
      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

      let className = 'calendar-tile'
      if (isSelected) className += ' selected'
      if (isToday) className += ' today'
      if (isPast) className += ' past-date'

      return className
    }
    return ''
  }

  const downloadPDFHandler = async () => {

    generatePDF()
    handleSubmit()
  }


  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    setMessage('')

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 25
      const contentWidth = pageWidth - (2 * margin)

      let yPosition = margin

      // ===== HEADER =====
      pdf.setFillColor(255, 127, 80)
      pdf.rect(0, 0, pageWidth, 40, 'F')

      pdf.setFontSize(24).setTextColor(255, 255, 255).setFont('helvetica', 'bold')
      const title = 'MKH Hair Color Analysis Report'
      const titleWidth = pdf.getTextWidth(title)
      pdf.text(title, (pageWidth - titleWidth) / 2, 25)

      yPosition = 50

      // ===== DATE =====
      pdf.setFontSize(10).setTextColor(100, 100, 100).setFont('helvetica', 'normal')
      const dateText = `Generated on: ${format(new Date(), 'EEEE, MMMM d, yyyy')}`
      pdf.text(dateText, margin, yPosition)
      yPosition += 20

      // ===== PERSONAL INFORMATION =====
      const personalInfoHeight = 50
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, personalInfoHeight, 'F')
      pdf.setDrawColor(255, 127, 80).setLineWidth(0.5)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, personalInfoHeight, 'S')

      pdf.setFontSize(14).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
      pdf.text('Personal Information', margin, yPosition)
      yPosition += 12

      pdf.setFontSize(10).setTextColor(50, 50, 50).setFont('helvetica', 'normal')
      const personalInfo = [
        `Name: ${formData.firstName} ${formData.lastName}`,
        `Email: ${formData.email}`,
        `Phone: ${formData.phone}`
      ]
      personalInfo.forEach((info: string) => {
        pdf.text(info, margin, yPosition)
        yPosition += 7
      })
      yPosition += 20

      // ===== HAIR ANALYSIS =====
      const hairAnalysisHeight = 100
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, hairAnalysisHeight, 'F')
      pdf.setDrawColor(255, 127, 80).setLineWidth(0.5)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, hairAnalysisHeight, 'S')

      pdf.setFontSize(14).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
      pdf.text('Hair Analysis', margin, yPosition)
      yPosition += 12

      pdf.setFontSize(10).setTextColor(50, 50, 50).setFont('helvetica', 'normal')
      const hairAnalysis = [
        `Natural Hair Color: ${formData.naturalHairColor || 'Not specified'}`,
        `Skin Color: ${formData.skinColor || 'Not specified'}`,
        `Eye Color: ${formData.eyeColor || 'Not specified'}`,
        `Hair Texture: ${formData.hairTexture || 'Not specified'}`,
        `Hair Length: ${formData.hairLength || 'Not specified'}`,
        `Personal Style: ${formData.personalStyle || 'Not specified'}`,
        `Maintenance: ${formData.hairMaintenance || 'Not specified'}`
      ]
      hairAnalysis.forEach((info: string) => {
        pdf.text(info, margin, yPosition)
        yPosition += 7
      })
      yPosition += 20

      // ===== RECOMMENDATIONS =====
      const combination: HairCombination = {
        hairColor: formData.selectedHairColor,
        hairLength: formData.hairLength,
        personalStyle: formData.personalStyle
      }

      const recommendation = getHairRecommendation(combination)
      const images = getAllRecommendationImages(combination)

      if (recommendation) {
        // ==== Calculate dynamic box height ====
        let calcHeight = 0
        calcHeight += 12 // title
        calcHeight += 10 // sub-title
        calcHeight += 7 // heading

        const descLines: string[] = pdf.splitTextToSize(recommendation.description, contentWidth)
        calcHeight += descLines.length * 5 + 5

        calcHeight += 7 // heading
        const careLines: string[] = pdf.splitTextToSize(recommendation.hairCare, contentWidth)
        calcHeight += careLines.length * 5 + 5

        calcHeight += 7 // heading
        calcHeight += recommendation.maintenanceSchedule.length * 5

        calcHeight += 20 // bottom padding

        // If not enough space, shift to new page
        if (yPosition + calcHeight > pageHeight - 40) {
          pdf.addPage()
          yPosition = margin
        }

        // Draw box
        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, calcHeight, 'F')
        pdf.setDrawColor(255, 127, 80).setLineWidth(0.5)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, calcHeight, 'S')

        // Content inside box
        pdf.setFontSize(14).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
        pdf.text('Personalized Hair Recommendations', margin, yPosition)
        yPosition += 12

        pdf.setFontSize(12).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
        pdf.text(recommendation.title, margin, yPosition)
        yPosition += 10

        // Treatments
        pdf.setFontSize(10).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
        pdf.text('Recommended Treatments:', margin, yPosition)
        yPosition += 7

        pdf.setFont('helvetica', 'normal').setTextColor(50, 50, 50)
        descLines.forEach((line: string) => {
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
        yPosition += 5

        // Care Routine
        pdf.setFont('helvetica', 'bold').setTextColor(255, 127, 80)
        pdf.text('Hair Care Routine:', margin, yPosition)
        yPosition += 7

        pdf.setFont('helvetica', 'normal').setTextColor(50, 50, 50)
        careLines.forEach((line: string) => {
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
        yPosition += 5

        // Schedule
        pdf.setFont('helvetica', 'bold').setTextColor(255, 127, 80)
        pdf.text('Maintenance Schedule:', margin, yPosition)
        yPosition += 7

        pdf.setFont('helvetica', 'normal').setTextColor(50, 50, 50)
        recommendation.maintenanceSchedule.forEach((schedule: string) => {
          pdf.text(`• ${schedule}`, margin, yPosition)
          yPosition += 5
        })

        yPosition += 20

        // ==== Recommended Styles (images) ====
        if (images.length > 0) {
          if (yPosition > pageHeight - 100) {
            pdf.addPage()
            yPosition = margin
          }

          // ADD EXTRA SPACE before heading
          yPosition += 10

          pdf.setFontSize(14).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
          pdf.text('Recommended Styles', margin, yPosition)
          yPosition += 15

          const imagesPerRow = 2
          const imageWidth = (contentWidth - 10) / imagesPerRow
          const imageHeight = 80
          const imagesToProcess = images.slice(0, 4)

          for (let index = 0; index < imagesToProcess.length; index++) {
            const imagePath = imagesToProcess[index]
            const row = Math.floor(index / imagesPerRow)
            const col = index % imagesPerRow

            if (row > 0 && col === 0) {
              if (yPosition + imageHeight + 30 > pageHeight - 40) {
                pdf.addPage()
                yPosition = margin
              } else {
                yPosition += imageHeight + 30
              }
            }

            const xPos = margin + col * (imageWidth + 10)
            const yPos = yPosition

            try {
              const dataUrl = await fetchImageAsDataURL(imagePath)
              if (dataUrl) {
                const fmt = imagePath.toLowerCase().includes('.png') ? 'PNG' : 'JPEG'
                pdf.addImage(dataUrl, fmt, xPos, yPos, imageWidth, imageHeight)
              }
            } catch {
              pdf.setFillColor(240, 240, 240)
              pdf.rect(xPos, yPos, imageWidth, imageHeight, 'FD')
              pdf.setFontSize(8).setTextColor(150).text('Image failed to load', xPos + 5, yPos + imageHeight / 2)
            }
          }
          yPosition += imageHeight + 30
        }
      }

      // ===== SELECTED PERFECT HAIR DAYS =====
      if (formData.selectedDates.length > 0) {
        const lineHeight = 7
        const totalLines = formData.selectedDates.length
        const totalHeight = totalLines * lineHeight + 35

        if (yPosition + totalHeight > pageHeight - 40) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFillColor(245, 245, 245)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, totalHeight, 'F')
        pdf.setDrawColor(255, 127, 80).setLineWidth(0.5)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, totalHeight, 'S')

        pdf.setFontSize(14).setTextColor(255, 127, 80).setFont('helvetica', 'bold')
        pdf.text('Selected Perfect Hair Days', margin, yPosition)
        yPosition += 12

        pdf.setFontSize(10).setTextColor(50, 50, 50).setFont('helvetica', 'normal')
        formData.selectedDates
          .sort((a, b) => a.getTime() - b.getTime())
          .forEach((date: Date, index: number) => {
            const dateText = `${index + 1}. ${format(date, 'EEEE, MMMM d, yyyy')}`
            pdf.text(dateText, margin, yPosition)
            yPosition += lineHeight
          })

        yPosition += 5
        pdf.setFontSize(9).setTextColor(100, 100, 100).setFont('helvetica', 'bold')
        pdf.text(`Total dates selected: ${formData.selectedDates.length}`, margin, yPosition)
      }

      // ===== SAVE FILE =====
      const fileName = `hair-analysis-${formData.firstName}-${formData.lastName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)

      setMessage('PDF generated successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      setMessage('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }


  const handleSubmit = async () => {
    if (!formData.email || formData.selectedDates.length === 0) {
      setMessage('Please enter an email address and select at least one date.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          dates: formData.selectedDates.map(date => format(date, 'yyyy-MM-dd')),
          formData: formData,
          sendAdditionalEmail: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Form submitted successfully! Check your email.')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          selectedHairColor: '',
          naturalHairColor: '',
          skinColor: '',
          eyeColor: '',
          hairTexture: '',
          hairLength: '',
          personalStyle: '',
          hairMaintenance: '',
          specialOccasions: [],
          preferredTreatments: [],
          workType: '',
          workIndustry: '',
          files: [],
          selectedDates: []
        })
        setCurrentSlide(1)
      } else {
        setMessage(data.error || 'Failed to submit form. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSlide = () => {
    switch (currentSlide) {
      case 1:
        return (
          <div className="glass-card mobile-card">
            <div className="text-center mb-6">
              <Image src={mkhLogo}
                alt="MKH Logo"
                className="mx-auto mb-4 w-32 h-auto"
              />
              <h2 className="mobile-heading font-bold text-white mb-4">Tell us a little about yourself</h2>
              <p className="text-white/80 mobile-text">Duration to complete: 3 minutes</p>
            </div>

            <div className="form-grid mb-6">
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field placeholder-gray-300 placeholder-opacity-60"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field placeholder-gray-300 placeholder-opacity-60"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-grid mb-6">
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field placeholder-gray-300 placeholder-opacity-60"
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <label className="block text-white/90 font-medium mb-2 text-sm">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // sirf digits allow karo
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    handleInputChange("phone", onlyNums);
                  }}
                  className="input-field placeholder-gray-300 placeholder-opacity-60"
                  placeholder="10001 000-0000"
                />
              </div>

            </div>

            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">Hair Analysis</h3>
              <div className="form-grid mb-4">
                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    Your Natural Hair Color
                  </label>
                  <select
                    value={formData.naturalHairColor}
                    onChange={(e) => handleInputChange("naturalHairColor", e.target.value)}
                    className={`input-field ${formData.naturalHairColor === "" ? "text-gray-300 opacity-60" : "text-white"
                      }`}
                  >
                    <option value="" disabled>
                      Select hair color
                    </option>
                    <option value="Black">Black</option>
                    <option value="Brown">Brown</option>
                    <option value="Natural Blonde">Natural Blonde</option>
                    <option value="Red">Red</option>
                  </select>
                </div>


                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    Skin Color
                  </label>
                  <select
                    value={formData.skinColor}
                    onChange={(e) => handleInputChange("skinColor", e.target.value)}
                    className={`input-field ${formData.skinColor === "" ? "text-gray-300 opacity-60" : "text-white"
                      }`}
                  >
                    <option value="" disabled>
                      Select skin color
                    </option>
                    <option value="Dark">Dark</option>
                    <option value="Medium">Medium</option>
                    <option value="Fair">Fair</option>
                    <option value="Light">Light</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    Eye Color
                  </label>
                  <select
                    value={formData.eyeColor}
                    onChange={(e) => handleInputChange("eyeColor", e.target.value)}
                    className={`input-field ${formData.eyeColor === "" ? "text-gray-300 opacity-60" : "text-white"
                      }`}
                  >
                    <option value="" disabled>
                      Select eye color
                    </option>
                    <option value="Black">Black</option>
                    <option value="Dark brown">Dark brown</option>
                    <option value="Light brown">Light brown</option>
                    <option value="Hazel">Hazel</option>
                    <option value="Green">Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Grey">Grey</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    Hair Texture
                  </label>
                  <select
                    value={formData.hairTexture}
                    onChange={(e) => handleInputChange("hairTexture", e.target.value)}
                    className={`input-field ${formData.hairTexture === "" ? "text-gray-300 opacity-60" : "text-white"
                      }`}
                  >
                    <option value="" disabled>
                      Select hair texture
                    </option>
                    <option value="Fine">Fine</option>
                    <option value="Medium">Medium</option>
                    <option value="Coarse">Coarse</option>
                    <option value="Resistant">Resistant</option>
                  </select>
                </div>

              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="glass-card mobile-card">
            <div className="text-center mb-6">
              <h2 className="mobile-heading font-bold text-white mb-4">Choose Your Hair Color</h2>
              <p className="text-white/80 mobile-text">Select the hair color category you're most interested in</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'Blonde', label: 'Blonde', emoji: '💛' },
                { value: 'Brunette', label: 'Brunette', emoji: '🤎' }
              ].map((color) => (
                <label key={color.value} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="radio"
                    name="selectedHairColor"
                    value={color.value}
                    checked={formData.selectedHairColor === color.value}
                    onChange={(e) => handleInputChange('selectedHairColor', e.target.value)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral focus:ring-2"
                  />
                  {/* <span className="text-2xl">{color.emoji}</span> */}
                  <span className="text-white/90 text-lg font-medium">{color.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="glass-card mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-6 text-center">Your present hair length?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Short', 'Medium', 'Long', 'Extra-long'].map((length) => (
                <label key={length} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="radio"
                    name="hairLength"
                    value={length}
                    checked={formData.hairLength === length}
                    onChange={(e) => handleInputChange('hairLength', e.target.value)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                  />
                  <span className="text-white/90 text-lg font-medium">{length}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="glass-card mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-6 text-center">Your personal style?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Classic', 'Trendy', 'Elegant', 'Minimal'].map((style) => (
                <label key={style} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="radio"
                    name="personalStyle"
                    value={style}
                    checked={formData.personalStyle === style}
                    onChange={(e) => handleInputChange('personalStyle', e.target.value)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                  />
                  <span className="text-white/90 text-lg font-medium">{style}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="glass-card mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-6 text-center">Your hair maintenance routine?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Up to 6 weeks', '3 months', '6 months', 'Yearly'].map((maintenance) => (
                <label key={maintenance} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="radio"
                    name="hairMaintenance"
                    value={maintenance}
                    checked={formData.hairMaintenance === maintenance}
                    onChange={(e) => handleInputChange('hairMaintenance', e.target.value)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                  />
                  <span className="text-white/90 text-lg font-medium">{maintenance}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="glass-card mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-6 text-center">Which occasions do you choose your hair treatments frequently?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Birthdays/Anniversary', 'Work', 'Holiday', 'Weddings/Social events'].map((occasion) => (
                <label key={occasion} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.specialOccasions.includes(occasion)}
                    onChange={() => handleArrayFieldChange('specialOccasions', occasion)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                  />
                  <span className="text-white/90 text-lg font-medium">{occasion}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 7:
        return (
          <div className="glass-card mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-6 text-center">Which treatments do you prefer presently or would like to try in future?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['All over color', 'Balayage', 'Babylights', 'Highlights', 'Lowlights', 'Root melt'].map((treatment) => (
                <label key={treatment} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.preferredTreatments.includes(treatment)}
                    onChange={() => handleArrayFieldChange('preferredTreatments', treatment)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                  />
                  <span className="text-white/90 text-lg font-medium">{treatment}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 8:
        return (
          <div className="glass-card mobile-card">
            <div className="text-center mb-6">
              <h2 className="mobile-heading font-bold text-white mb-4">Upload some styles that inspire you</h2>
              <p className="text-white/70 mobile-text">(Optional)</p>
            </div>

            <div className="border-2 border-dashed border-coral/50 file-upload-area text-center hover:border-coral transition-colors bg-black/20">
              <div className="text-4xl mb-4">☁️</div>
              <p className="text-white/90 mb-4 mobile-text">Browse Files</p>
              <p className="text-white/70 mb-6 mobile-description">Drag and drop Files here</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="btn-primary cursor-pointer">
                Choose Files
              </label>
            </div>

            {formData.files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3 mobile-text">Uploaded Files:</h3>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/40 p-3 border border-white/10">
                      <span className="text-white/90 mobile-text truncate mr-2">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-300 hover:text-red-100 mobile-text flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-white/60 mobile-description mt-4 text-center">
              You can upload up to 5 image files (JPG, PNG, GIF, etc.)
            </p>
          </div>
        )

      case 9:
        return (
          <div className="glass-card mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-6 text-center">Work</h2>
            <p className="text-white/70 mobile-text mb-6 text-center">(Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'Corporate', label: 'Corporate' },
                { value: 'Stay at home', label: 'Stay at home' },
                { value: 'Work from home', label: 'Work from home' },
                { value: 'Entrepreneur', label: 'Entrepreneur' },
                { value: 'Student', label: 'Student' }
              ].map((work) => (
                <label key={work.value} className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all">
                  <input
                    type="radio"
                    name="workType"
                    value={work.value}
                    checked={formData.workType === work.value}
                    onChange={(e) => handleInputChange('workType', e.target.value)}
                    className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                  />
                  <span className="text-white/90 text-lg font-medium">{work.label}</span>
                </label>
              ))}
            </div>

            {(formData.workType === 'Corporate' || formData.workType === 'Work from home' || formData.workType === 'Entrepreneur') && (
              <div className="mt-6">
                <label className="block text-white/90 font-medium mb-2 text-sm">Please specify industry</label>
                <input
                  type="text"
                  value={formData.workIndustry}
                  onChange={(e) => handleInputChange('workIndustry', e.target.value)}
                  className="input-field placeholder-gray-300 placeholder-opacity-60"
                  placeholder="e.g., Technology, Healthcare, Finance..."
                />
              </div>
            )}
          </div>
        )

      case 10:
        return (
          <div className="glass-card mobile-card">
            <div className="mb-6">
              <h2 className="mobile-heading font-bold text-white mb-4 text-center">Select Your Perfect Hair Days</h2>
              <p className="text-white/80 mobile-text mb-2 text-center">
                Select some of your most important days of the year when you would like to look your very best.
                Let us send you a reminder 2 weeks before to consult or set an appointment.
              </p>
              <p className="text-white/60 italic mobile-description text-center">(Optional)</p>
            </div>

            <div className="calendar-responsive">
              <div>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="mobile-heading font-bold text-white">Calendar</h3>
                  <button
                    onClick={clearSelection}
                    disabled={formData.selectedDates.length === 0}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed mobile-btn"
                  >
                    🗑️ Clear All
                  </button>
                </div>

                <div className="bg-black/40 backdrop-blur-sm p-6 border border-white/10">
                  <Calendar
                    onClickDay={handleDayClick}
                    value={null}
                    tileClassName={tileClassName}
                    tileContent={({ date, view }) => {
                      if (view === 'month') {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const isSelected = formData.selectedDates.some(
                          selectedDate => format(selectedDate, 'yyyy-MM-dd') === dateStr
                        )
                        return isSelected ? <span className="calendar-selected-dot" /> : null
                      }
                      return null
                    }}
                    className="w-full border-0 bg-transparent text-white"
                    navigationLabel={({ date }) => format(date, 'MMMM yyyy')}
                    formatShortWeekday={(locale, date) => format(date, 'EEE')}
                  />

                  <div className="mt-6">
                    <div className="flex items-center justify-between bg-black/60 backdrop-blur-sm border border-white/10 p-3">
                      <div className="flex items-center">
                        <span className="text-white font-semibold text-sm">
                          <span className="text-xl font-bold text-coral mr-1">{formData.selectedDates.length}</span>
                          dates selected
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mobile-heading font-bold text-white mb-4">Selected Dates</h3>

                {formData.selectedDates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-white/70 mobile-text mb-2">No dates selected yet</p>
                    <p className="text-white/50 mobile-description">Click on dates in the calendar to select them</p>
                  </div>
                ) : (
                  <div className="space-y-3 selected-dates-container">
                    {formData.selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => (
                        <div key={index} className="date-card group">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white mobile-text">
                              {format(date, 'EEEE, MMMM d, yyyy')}
                            </span>
                            <button
                              onClick={() => {
                                const dateStr = format(date, 'yyyy-MM-dd')
                                setFormData(prev => ({
                                  ...prev,
                                  selectedDates: prev.selectedDates.filter(
                                    d => format(d, 'yyyy-MM-dd') !== dateStr
                                  )
                                }))
                              }}
                              className="text-red-300 hover:text-red-100 mobile-text font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 11:
        // Hidden for now; kept for future use
        return null

      case 12:
        return (
          <div className="glass-card mobile-card">
            <div className="text-center mb-8">
              <h2 className="mobile-heading font-bold text-white mb-4">Review & Submit</h2>
              <p className="text-white/80 mobile-text">Please review your information before submitting</p>
            </div>

            <div className="space-y-6">
              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Hair Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
                  <p><strong>Hair Color:</strong> {formData.naturalHairColor}</p>
                  <p><strong>Skin Color:</strong> {formData.skinColor}</p>
                  <p><strong>Eye Color:</strong> {formData.eyeColor}</p>
                  <p><strong>Hair Texture:</strong> {formData.hairTexture}</p>
                  <p><strong>Hair Length:</strong> {formData.hairLength}</p>
                  <p><strong>Personal Style:</strong> {formData.personalStyle}</p>
                  <p><strong>Maintenance:</strong> {formData.hairMaintenance}</p>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Selected Dates</h3>
                <p className="text-white/80">{formData.selectedDates.length} dates selected</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {/* <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.email || formData.selectedDates.length === 0}
                className="mobile-btn bg-gradient-to-r from-coral to-coral-dark hover:from-coral-dark hover:to-coral text-white font-bold py-4 px-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-white/20 hover:border-white/40"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white mr-3"></div>
                    <span className="text-lg">Submitting...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="text-lg">Submit Analysis</span>
                  </span>
                )}
              </button> */}

              <button
                onClick={downloadPDFHandler}
                disabled={isSubmitting || isGeneratingPDF || !formData.firstName || !formData.lastName}
                className="mobile-btn relative overflow-hidden bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white font-bold py-4 px-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-white/20 hover:border-white/40"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                {isGeneratingPDF ? (
                  <span className="flex items-center justify-center relative z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white mr-3"></div>
                    <span className="text-lg">Generating...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center relative z-10">
                    <div className="text-2xl mr-3">📄</div>
                    <span className="text-lg">Download PDF</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-coral/10 rounded-full blur-3xl floating-animation mobile-bg-decoration"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/20 rounded-full blur-3xl floating-animation mobile-bg-decoration" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl floating-animation mobile-bg-decoration" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto mobile-container py-4 sm:py-6 lg:py-8">
        <header className="mobile-header">
          <div className="inline-block p-3 sm:p-4 bg-black/40 backdrop-blur-sm border border-coral/30 mb-4 sm:mb-6">
            <h1 className="mobile-heading font-bold text-white">
              MKH Hair Color Analysis
            </h1>
          </div>
          <p className="mobile-text text-white/90 max-w-2xl mx-auto leading-relaxed">
            Complete your hair color analysis in just 3 minutes
          </p>
        </header>

        {/* Progress Bar */}
        {/* <div className="max-w-4xl mx-auto mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold">Progress</span>
              <span className="text-white/70 text-sm">{currentSlide} of {totalSlides}</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-coral to-coral-dark h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: totalSlides }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => goToSlide(i + 1)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentSlide === i + 1 
                      ? 'bg-coral scale-125' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div> */}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto mobile-section">
          {renderSlide()}

          {/* Footer Logo – hidden on first slide */}
          {/* Footer Logo – hidden on first slide */}
          {currentSlide !== 1 && (
            <div className="flex justify-center mt-6">
              <Image
                src={mkhLogo}
                alt="MKH Logo"
                className="w-16 h-16 opacity-80 rounded-full object-cover"
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center sm:space-y-0 space-y-4 mt-8">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed mobile-btn"
            >
              ← Previous
            </button>

            <button
              onClick={nextSlide}
              disabled={currentSlide === totalSlides}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed mobile-btn"
            >
              Next →
            </button>
          </div>
        </div>


        {/* Notification */}
        {message && (
          <div className="fixed bottom-6 right-6 notification p-6 max-w-sm z-50">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.includes('successfully') ? (
                  <div className="text-green-400 text-xl">✅</div>
                ) : (
                  <div className="text-red-400 text-xl">⚠️</div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${message.includes('successfully') ? 'text-green-100' : 'text-red-100'}`}>
                  {message}
                </p>
              </div>
              <button
                onClick={() => setMessage('')}
                className="ml-4 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
