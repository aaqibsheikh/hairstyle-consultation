// Utility function to load images for PDF generation
import jsPDF from 'jspdf'

export interface ImageInfo {
  path: string
  name: string
  width: number
  height: number
  base64?: string
}

// Helper function to fetch image as data URL for public/remote paths
export async function fetchImageAsDataURL(src: string): Promise<string | null> {
  try {
    console.log('fetchImageAsDataURL called with src:', src)
    
    if (typeof window === 'undefined') {
      console.log('Window not available, returning null')
      return null
    }
    
    // Build the full URL
    const fullUrl = src.startsWith('http') ? src : `${window.location.origin}${src}`
    console.log('Full URL:', fullUrl)
    
    // Try fetch approach first
    try {
      const response = await fetch(fullUrl, {
        mode: 'cors',
        credentials: 'same-origin'
      })
      
      console.log('Fetch response:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      console.log('Blob received:', blob.size, 'bytes, type:', blob.type)
      
      // Convert blob to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          console.log('Data URL created via FileReader, length:', dataUrl.length)
          resolve(dataUrl)
        }
        reader.onerror = () => {
          console.error('FileReader error')
          reject(new Error('FileReader failed'))
        }
        reader.readAsDataURL(blob)
      })
      
    } catch (fetchError) {
      console.error('Fetch failed, trying Image approach:', fetchError)
      
      // Fallback to Image + Canvas approach
      return new Promise((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          try {
            console.log('Image loaded, dimensions:', img.naturalWidth, 'x', img.naturalHeight)
            
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'))
              return
            }
            
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            
            ctx.drawImage(img, 0, 0)
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
            console.log('Data URL created via Canvas, length:', dataUrl.length)
            resolve(dataUrl)
          } catch (canvasError) {
            console.error('Canvas error:', canvasError)
            reject(canvasError)
          }
        }
        
        img.onerror = (error) => {
          console.error('Image load error:', error)
          reject(new Error('Image failed to load'))
        }
        
        // Don't set crossOrigin for same-origin requests
        img.src = fullUrl
        console.log('Loading image from:', img.src)
      })
    }
    
  } catch (error) {
    console.error('fetchImageAsDataURL error:', error)
    return null
  }
}

// Helper function to convert File to data URL for uploaded files
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to convert file to data URL'))
    reader.readAsDataURL(file)
  })
}

// Function to load image as base64 for PDF
export async function loadImageAsBase64(imagePath: string): Promise<string | null> {
  try {
    // In a Next.js environment, we need to handle the image loading differently
    // For client-side, we can use fetch to get the image
    if (typeof window !== 'undefined') {
      console.log('Loading image:', imagePath)
      
      // Ensure we have the full URL for the image
      const fullUrl = imagePath.startsWith('http') ? imagePath : `${window.location.origin}${imagePath}`
      console.log('Full URL:', fullUrl)
      
      const response = await fetch(fullUrl)
      
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status, response.statusText)
        return null
      }
      
      const blob = await response.blob()
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          console.log('Image loaded successfully as base64')
          resolve(result)
        }
        reader.onerror = (error) => {
          console.error('FileReader error:', error)
          reject(error)
        }
        reader.readAsDataURL(blob)
      })
    }
    
    return null
  } catch (error) {
    console.error('Error loading image:', error)
    return null
  }
}

// Function to get image dimensions
export async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        resolve({ width: 150, height: 120 }) // fallback dimensions
      }
      img.src = imagePath
    } else {
      resolve({ width: 150, height: 120 }) // fallback dimensions
    }
  })
}

// Function to add image to PDF
export async function addImageToPDF(
  pdf: jsPDF, 
  imagePath: string, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): Promise<boolean> {
  try {
    const base64Image = await loadImageAsBase64(imagePath)
    
    if (base64Image) {
      pdf.addImage(base64Image, 'JPEG', x, y, width, height)
      return true
    } else {
      // Fallback to placeholder if image can't be loaded
      pdf.setDrawColor(255, 127, 80)
      pdf.setFillColor(250, 250, 250)
      pdf.setLineWidth(1)
      pdf.rect(x, y, width, height, 'FD')
      
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.setFont('helvetica', 'bold')
      const imageName = imagePath.split('/').pop()?.replace('.jpg', '') || 'image'
      const textWidth = pdf.getTextWidth(imageName)
      pdf.text(imageName, x + (width - textWidth) / 2, y + height / 2)
      
      return false
    }
  } catch (error) {
    console.error('Error adding image to PDF:', error)
    return false
  }
}

// Function to create image info
export async function getImageInfo(imagePath: string): Promise<ImageInfo> {
  const name = imagePath.split('/').pop() || 'unknown-image'
  const dimensions = await getImageDimensions(imagePath)
  
  return {
    path: imagePath,
    name: name,
    width: dimensions.width,
    height: dimensions.height
  }
}
