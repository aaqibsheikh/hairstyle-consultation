'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: string[]
  title: string
  className?: string
}

export default function ImageGallery({ images, title, className = '' }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!images || images.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-6xl mb-4">💇‍♀️</div>
        <p className="text-white/70 mobile-text">No images available for this style</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-white font-semibold text-lg mb-4">{title}</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((imagePath, index) => (
          <div 
            key={index}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border border-white/10 hover:border-coral/50 transition-all duration-300"
            onClick={() => setSelectedImage(imagePath)}
          >
            <Image
              src={imagePath}
              alt={`${title} style ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={(e) => {
                // Hide broken images
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white text-2xl">🔍</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for enlarged image */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <Image
              src={selectedImage}
              alt={`${title} enlarged view`}
              width={800}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg"
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}
