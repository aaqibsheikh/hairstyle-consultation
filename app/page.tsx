'use client'

import { useState } from 'react'
import Calendar from 'react-calendar'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'react-calendar/dist/Calendar.css'

type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  lifestyle: string[]
  files: File[]
  questionnaire: {
    balayage: string
    highlights: string
    babylights: string
    extensions: string
  }
  selectedDates: Date[]
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    lifestyle: [],
    files: [],
    questionnaire: {
      balayage: '',
      highlights: '',
      babylights: '',
      extensions: ''
    },
    selectedDates: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [message, setMessage] = useState('')

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLifestyleChange = (lifestyle: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(lifestyle)
        ? prev.lifestyle.filter(l => l !== lifestyle)
        : [...prev.lifestyle, lifestyle]
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Check if files are images
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

  const handleQuestionnaireChange = (service: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      questionnaire: { ...prev.questionnaire, [service]: value }
    }))
  }

  const handleDayClick = (value: Date) => {
    // Check if the date is in the past
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

      // Header with background
      pdf.setFillColor(102, 126, 234)
      pdf.rect(0, 0, pageWidth, 40, 'F')
      
      // Title
      pdf.setFontSize(28)
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      const title = '💇‍♀️ Hair Consultation Report'
      const titleWidth = pdf.getTextWidth(title)
      pdf.text(title, (pageWidth - titleWidth) / 2, 25)
      
      yPosition = 50

      // Date
      pdf.setFontSize(11)
      pdf.setTextColor(100, 100, 100)
      pdf.setFont('helvetica', 'normal')
      const dateText = `Generated on: ${format(new Date(), 'EEEE, MMMM d, yyyy')}`
      pdf.text(dateText, margin, yPosition)
      yPosition += 20

      // Personal Information Section with box
      pdf.setFillColor(245, 247, 250)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 50, 'F')
      pdf.setDrawColor(102, 126, 234)
      pdf.setLineWidth(0.5)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 50, 'S')
      
      pdf.setFontSize(16)
      pdf.setTextColor(102, 126, 234)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Personal Information', margin, yPosition)
      yPosition += 12

      pdf.setFontSize(11)
      pdf.setTextColor(50, 50, 50)
      pdf.setFont('helvetica', 'normal')
      
      const personalInfo = [
        `Name: ${formData.firstName} ${formData.lastName}`,
        `Email: ${formData.email}`,
        `Phone: ${formData.phone}`,
        `Lifestyle: ${formData.lifestyle.join(', ') || 'Not specified'}`
      ]

      personalInfo.forEach(info => {
        pdf.text(info, margin, yPosition)
        yPosition += 7
      })
      yPosition += 20

      // Style Preferences Section with box
      pdf.setFillColor(245, 247, 250)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 60, 'F')
      pdf.setDrawColor(102, 126, 234)
      pdf.setLineWidth(0.5)
      pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 60, 'S')
      
      pdf.setFontSize(16)
      pdf.setTextColor(102, 126, 234)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Style Preferences', margin, yPosition)
      yPosition += 12

      pdf.setFontSize(11)
      pdf.setTextColor(50, 50, 50)
      pdf.setFont('helvetica', 'normal')

      const services = [
        { name: 'Balayage', key: 'balayage' },
        { name: 'Highlights', key: 'highlights' },
        { name: 'Babylights', key: 'babylights' },
        { name: 'Hair Extensions', key: 'extensions' }
      ]

      services.forEach(service => {
        const experience = formData.questionnaire[service.key as keyof typeof formData.questionnaire] || 'Not specified'
        pdf.text(`${service.name}: ${experience}`, margin, yPosition)
        yPosition += 7
      })
      yPosition += 20

      // Selected Dates Section
      if (formData.selectedDates.length > 0) {
        const datesHeight = Math.min(80, formData.selectedDates.length * 8 + 30)
        pdf.setFillColor(245, 247, 250)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, datesHeight, 'F')
        pdf.setDrawColor(102, 126, 234)
        pdf.setLineWidth(0.5)
        pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, datesHeight, 'S')
        
        pdf.setFontSize(16)
        pdf.setTextColor(102, 126, 234)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Selected Perfect Hair Days', margin, yPosition)
        yPosition += 12

        pdf.setFontSize(11)
        pdf.setTextColor(50, 50, 50)
        pdf.setFont('helvetica', 'normal')

        formData.selectedDates
          .sort((a, b) => a.getTime() - b.getTime())
          .forEach((date, index) => {
            const dateText = `${index + 1}. ${format(date, 'EEEE, MMMM d, yyyy')}`
            
            // Check if we need a new page
            if (yPosition > pageHeight - 40) {
              pdf.addPage()
              yPosition = margin
            }
            
            pdf.text(dateText, margin, yPosition)
            yPosition += 7
          })

        yPosition += 10
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Total dates selected: ${formData.selectedDates.length}`, margin, yPosition)
        yPosition += 20
      }

      // Footer with background
      pdf.setFillColor(248, 250, 252)
      pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F')
      pdf.setDrawColor(102, 126, 234)
      pdf.setLineWidth(0.5)
      pdf.line(0, pageHeight - 30, pageWidth, pageHeight - 30)
      
      yPosition = pageHeight - 15
      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Thank you for choosing our hair consultation service!', margin, yPosition)
      yPosition += 6
      pdf.text('We\'ll be in touch soon to schedule your perfect hair days.', margin, yPosition)

      const fileName = `hair-consultation-${formData.firstName}-${formData.lastName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
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
          formData: formData
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
          lifestyle: [],
          files: [],
          questionnaire: {
            balayage: '',
            highlights: '',
            babylights: '',
            extensions: ''
          },
          selectedDates: []
        })
      } else {
        setMessage(data.error || 'Failed to submit form. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl floating-animation mobile-bg-decoration"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl floating-animation mobile-bg-decoration" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl floating-animation mobile-bg-decoration" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto mobile-container py-4 sm:py-6 lg:py-8">
        <header className="mobile-header">
          <div className="inline-block p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 sm:mb-6 pulse-glow">
            <h1 className="mobile-heading font-bold text-white mb-2 sm:mb-3">
              💇‍♀️ Hair Consultation Form
            </h1>
          </div>
          <p className="mobile-text text-white/90 max-w-2xl mx-auto leading-relaxed">
            Tell us about your style preferences and schedule your perfect hair days
          </p>
        </header>

        <div className="max-w-4xl mx-auto mobile-section">
          {/* User Information Section */}
          <div className="glass-card rounded-3xl mobile-card">
            <h2 className="mobile-heading font-bold text-white mb-4 sm:mb-6">Personal Information</h2>
            
            <div className="form-grid mb-4 sm:mb-6">
              <div>
                <label className="block text-white/90 font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-white/90 font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-grid mb-4 sm:mb-6">
              <div>
                <label className="mobile-label block text-white/90 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <label className="mobile-label block text-white/90 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="10001 000-0000"
                />
                <p className="mobile-description text-white/60 mt-1">Please enter a valid phone number.</p>
              </div>
            </div>

            <div>
              <label className="mobile-label block text-white/90 mb-3">Lifestyle</label>
              <div className="lifestyle-grid">
                {['Low-maintenance', 'High-maintenance', 'Stay-at-home', 'Social'].map((lifestyle) => (
                  <label key={lifestyle} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lifestyle.includes(lifestyle)}
                      onChange={() => handleLifestyleChange(lifestyle)}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/30 rounded focus:ring-blue-500"
                    />
                    <span className="text-white/90 mobile-text">{lifestyle}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🏔️</div>
              <h2 className="text-3xl font-bold text-white mb-2">Upload some hair styles that inspire you</h2>
            </div>

            <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-white/50 transition-colors">
              <div className="text-4xl mb-4">☁️</div>
              <p className="text-white/90 mb-4">Browse Files</p>
              <p className="text-white/70 mb-6">Drag and drop Files here</p>
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
                <h3 className="text-white font-semibold mb-3">Uploaded Files:</h3>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <span className="text-white/90 text-sm">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-300 hover:text-red-100 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-white/60 text-sm mt-4 text-center">
              You can upload up to 5 image files (JPG, PNG, GIF, etc.) of maximum file size 1MB each
            </p>
          </div>

          {/* Questionnaire Section */}
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Type a question</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3 font-semibold">Service</th>
                    <th className="p-3 font-semibold">Never</th>
                    <th className="p-3 font-semibold">Once</th>
                    <th className="p-3 font-semibold">More than once</th>
                    <th className="p-3 font-semibold">Would try</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'balayage', label: 'Balayage' },
                    { key: 'highlights', label: 'Highlights' },
                    { key: 'babylights', label: 'Babylights' },
                    { key: 'extensions', label: 'Hair extensions' }
                  ].map(({ key, label }) => (
                    <tr key={key} className="border-b border-white/10">
                      <td className="p-3 font-medium">{label}</td>
                      {['Never', 'Once', 'More than once', 'Would try'].map((option) => (
                        <td key={option} className="p-3 text-center">
                          <input
                            type="radio"
                            name={key}
                            value={option}
                            checked={formData.questionnaire[key as keyof typeof formData.questionnaire] === option}
                            onChange={(e) => handleQuestionnaireChange(key, e.target.value)}
                            className="w-4 h-4 text-blue-600 bg-white/10 border-white/30 focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="glass-card rounded-3xl p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-4">Select Your Perfect Hair Days</h2>
              <p className="text-white/80 text-lg mb-2">
                Select some of your most important days of the year when you would like to look your very best. 
                Let us send you a reminder 2 weeks before to consult or set an appointment.
              </p>
              <p className="text-white/60 italic">A personalized schedule created just for your convenience.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Calendar</h3>
                  <button
                    onClick={clearSelection}
                    disabled={formData.selectedDates.length === 0}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🗑️ Clear All
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Calendar
                    onClickDay={handleDayClick}
                    value={null}
                    tileClassName={tileClassName}
                    className="w-full border-0 bg-transparent text-white"
                    navigationLabel={({ date }) => format(date, 'MMMM yyyy')}
                    formatShortWeekday={(locale, date) => format(date, 'EEE')}
                  />
                </div>

                <div className="mt-4 text-center">
                  <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                    <p className="text-white font-semibold">
                      <span className="text-2xl font-bold text-yellow-300">{formData.selectedDates.length}</span> dates selected
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Selected Dates</h3>
                
                {formData.selectedDates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-white/70 text-lg mb-2">No dates selected yet</p>
                    <p className="text-white/50">Click on dates in the calendar to select them</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {formData.selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => (
                        <div key={index} className="date-card group">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-lg">
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
                              className="text-red-300 hover:text-red-100 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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

          {/* Action Buttons */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.email || formData.selectedDates.length === 0}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-white/20 hover:border-white/40"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white mr-3"></div>
                  <span className="text-lg">Submitting...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <div className="text-2xl mr-3">📧</div>
                  <span className="text-lg">Submit Consultation Form</span>
                </span>
              )}
            </button>

            <div className="h-6"></div>

            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF || !formData.firstName || !formData.lastName}
              className="w-full max-w-md mx-auto relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-white/20 hover:border-white/40"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
              {isGeneratingPDF ? (
                <span className="flex items-center justify-center relative z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white mr-3"></div>
                  <span className="text-lg">Generating PDF...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center relative z-10">
                  <div className="text-2xl mr-3">📄</div>
                  <span className="text-lg">Generate PDF Report</span>
                </span>
              )}
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
