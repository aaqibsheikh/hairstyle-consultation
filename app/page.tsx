"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import { format } from "date-fns";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import "react-calendar/dist/Calendar.css";
import ImageGallery from "./components/ImageGallery";
import {
  getHairRecommendation,
  getAllRecommendationImages,
  type HairCombination,
} from "./utils/hairRecommendations";
import { fetchImageAsDataURL } from "./utils/pdfImageLoader";
import mkhLogo from "/public/mkh-logo.jpg";
import Image from "next/image";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Hair Color Selection
  selectedHairColor: string;

  // Hair Analysis
  naturalHairColor: string;
  skinColor: string;
  eyeColor: string;
  hairTexture: string;
  hairLength: string;
  personalStyle: string;
  hairMaintenance: string;
  specialOccasions: string[];
  preferredTreatments: string[];
  workType: string;
  workIndustry: string;

  // Files and Calendar
  files: File[];
  selectedDates: Date[];
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    selectedHairColor: "",
    naturalHairColor: "",
    skinColor: "",
    eyeColor: "",
    hairTexture: "",
    hairLength: "",
    personalStyle: "",
    hairMaintenance: "",
    specialOccasions: [],
    preferredTreatments: [],
    workType: "",
    workIndustry: "",
    files: [],
    selectedDates: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [message, setMessage] = useState("");

  const totalSlides = 12;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter((item) => item !== value)
        : [...(prev[field] as string[]), value],
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const nonImageFiles = files.filter(
      (file) => !file.type.startsWith("image/")
    );

    if (nonImageFiles.length > 0) {
      setMessage("Please upload only image files (JPG, PNG, GIF, etc.)");
      return;
    }

    if (imageFiles.length + formData.files.length <= 5) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...imageFiles],
      }));
    } else {
      setMessage("You can only upload up to 5 image files");
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleDayClick = (value: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (value < today) {
      setMessage("Cannot select past dates. Please choose a future date.");
      return;
    }

    const dateStr = format(value, "yyyy-MM-dd");
    const isSelected = formData.selectedDates.some(
      (d) => format(d, "yyyy-MM-dd") === dateStr
    );
    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        selectedDates: prev.selectedDates.filter(
          (d) => format(d, "yyyy-MM-dd") !== dateStr
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedDates: [...prev.selectedDates, value],
      }));
    }
  };

  const clearSelection = () => {
    setFormData((prev) => ({ ...prev, selectedDates: [] }));
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };


  const prevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };


  const goToSlide = (slide: number) => {
    setCurrentSlide(slide);
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateStr = format(date, "yyyy-MM-dd");
      const isSelected = formData.selectedDates.some(
        (selectedDate) => format(selectedDate, "yyyy-MM-dd") === dateStr
      );
      const isToday =
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      let className = "calendar-tile";
      if (isSelected) className += " selected";
      if (isToday) className += " today";
      if (isPast) className += " past-date";

      return className;
    }
    return "";
  };

  const downloadPDFHandler = async () => {
    generatePDF();
    handleSubmit();
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    setMessage("");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      let yPosition = margin;

      // ===== BLACK BACKGROUND FOR ENTIRE PAGE =====
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // ===== HEADER WITH LOGO =====
      try {
        const logoResponse = await fetch(mkhLogo.src);
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });

        pdf.addImage(logoBase64 as string, 'JPEG', margin, 15, 40, 40);
      } catch (error) {
        console.log('Logo not available, continuing without logo');
      }

      // Header title - BIGGER
      pdf.setFontSize(26).setTextColor(255, 127, 80).setFont("helvetica", "bold");
      pdf.text("MKH Hair Color Analysis", margin + 45, 35);

      pdf.setFontSize(16).setTextColor(255, 255, 255).setFont("helvetica", "bold");
      pdf.text("Professional Consultation Report", margin + 45, 45);

      // Header separator line
      pdf.setDrawColor(255, 127, 80).setLineWidth(0.5);
      pdf.line(margin, 55, pageWidth - margin, 55);

      yPosition = 70;

      // ===== IMPROVED SECTION TITLE FUNCTION WITH BIGGER HEADINGS =====
      const addSection = (title: string, content: string[], y: number) => {
        // Check if we need a new page
        if (y > pageHeight - margin - 60) {
          pdf.addPage();
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          y = margin;
        }

        // Section title - BIGGER
        pdf.setFontSize(18).setTextColor(255, 127, 80).setFont("helvetica", "bold");
        pdf.text(title, margin, y);

        // Title underline
        pdf.setDrawColor(255, 127, 80).setLineWidth(0.5);
        pdf.line(margin, y + 2, margin + pdf.getTextWidth(title), y + 2);

        let currentY = y + 12;

        // Section content
        pdf.setFontSize(11).setTextColor(255, 255, 255).setFont("helvetica", "normal");

        content.forEach((line) => {
          if (currentY > pageHeight - margin - 15) {
            pdf.addPage();
            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, pageWidth, pageHeight, "F");
            currentY = margin + 10;
          }

          if (line.trim() === "") {
            currentY += 6;
            return;
          }

          const lines = pdf.splitTextToSize(line, contentWidth);
          lines.forEach((textLine: string) => {
            if (currentY > pageHeight - margin - 10) {
              pdf.addPage();
              pdf.setFillColor(0, 0, 0);
              pdf.rect(0, 0, pageWidth, pageHeight, "F");
              currentY = margin + 10;
            }
            pdf.text(textLine, margin, currentY);
            currentY += 6;
          });
          currentY += 2;
        });

        // Add spacing
        currentY += 10;

        return currentY;
      };

      // ===== CLIENT SUMMARY SECTION =====
      const summaryContent = [
        `Name: ${formData.firstName} ${formData.lastName}`,
        `Analysis Date: ${format(new Date(), "MMMM d, yyyy")}`,
        `Reference: MKH-${Date.now().toString().slice(-6)}`,
        `Report generated on: ${format(new Date(), "EEEE, MMMM d, yyyy 'at' h:mm a")}`
      ];

      yPosition = addSection("Client Summary", summaryContent, yPosition);

      // ===== PERSONAL INFORMATION SECTION =====
      const personalInfoContent = [
        `Full Name: ${formData.firstName} ${formData.lastName}`,
        `Email: ${formData.email}`,
        `Phone: ${formData.phone || "Not provided"}`
      ];

      yPosition = addSection("Personal Information", personalInfoContent, yPosition);

      // ===== HAIR ANALYSIS SECTION =====
      const hairAnalysisContent = [
        `Natural Hair Color: ${formData.naturalHairColor || "Not specified"}`,
        `Skin Tone: ${formData.skinColor || "Not specified"}`,
        `Eye Color: ${formData.eyeColor || "Not specified"}`,
        `Hair Texture: ${formData.hairTexture || "Not specified"}`,
        `Hair Length: ${formData.hairLength || "Not specified"}`,
        `Personal Style: ${formData.personalStyle || "Not specified"}`,
        `Maintenance Preference: ${formData.hairMaintenance || "Not specified"}`
      ];

      yPosition = addSection("Hair Analysis Profile", hairAnalysisContent, yPosition);

      // ===== SCHEDULED PERFECT HAIR DAYS ON SECOND PAGE =====
      if (formData.selectedDates && formData.selectedDates.length > 0) {
        // Check if we need a new page for Scheduled Perfect Hair Days
        if (yPosition > pageHeight - margin - 100) {
          pdf.addPage();
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        const sortedDates = [...formData.selectedDates].sort((a, b) => a.getTime() - b.getTime());

        const datesContent = [
          "Your scheduled appointment dates:",
          "",
          ...sortedDates.map((date: Date, index: number) =>
            `${index + 1}. ${format(date, "EEEE, MMMM d, yyyy")}`
          ),
          "",
          `Total appointments scheduled: ${formData.selectedDates.length}`
        ];

        yPosition = addSection("Scheduled Perfect Hair Days", datesContent, yPosition);
      }

      // ===== RECOMMENDATIONS SECTION =====
      const combination: HairCombination = {
        hairColor: formData.selectedHairColor,
        hairLength: formData.hairLength,
        personalStyle: formData.personalStyle,
      };

      const recommendation = getHairRecommendation(combination);
      const images = getAllRecommendationImages(combination);

      if (recommendation) {
        const recommendationsContent = [
          `Recommended Style: ${recommendation.title}`,
          "",
          "Recommended Treatments:",
          recommendation.description,
          "",
          "Hair Care Routine:",
          recommendation.hairCare,
          "",
          "Maintenance Schedule:",
          ...recommendation.maintenanceSchedule.map(schedule => `• ${schedule}`)
        ];

        yPosition = addSection("Professional Recommendations", recommendationsContent, yPosition);
      }

      // ===== RECOMMENDED STYLES IMAGES ON LAST PAGE =====
      if (images.length > 0) {
        // Check if we need a new page for images
        if (yPosition > pageHeight - margin - 150) {
          pdf.addPage();
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        // Image section title - BIGGER
        pdf.setFontSize(18).setTextColor(255, 127, 80).setFont("helvetica", "bold");
        pdf.text("Recommended Style Visuals", margin, yPosition);

        pdf.setDrawColor(255, 127, 80).setLineWidth(0.5);
        pdf.line(margin, yPosition + 2, margin + pdf.getTextWidth("Recommended Style Visuals"), yPosition + 2);

        yPosition += 15;

        const imagesToProcess = images.slice(0, 4);
        const maxImageWidth = (contentWidth - 10) / 2;
        const maxImageHeight = 80;

        let currentRowY = yPosition;
        let maxRowY = currentRowY;

        for (let index = 0; index < imagesToProcess.length; index++) {
          const col = index % 2;
          const xPos = margin + col * (maxImageWidth + 10);

          // Check if we need a new page for this row
          if (currentRowY + maxImageHeight + 40 > pageHeight - margin) {
            pdf.addPage();
            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, pageWidth, pageHeight, "F");
            currentRowY = margin + 20;
            maxRowY = currentRowY;
          }

          try {
            const dataUrl = await fetchImageAsDataURL(imagesToProcess[index]);
            if (dataUrl) {
              const fmt = imagesToProcess[index].toLowerCase().includes(".png") ? "PNG" : "JPEG";

              // Get image dimensions using jsPDF's internal method
              const imgProps = pdf.getImageProperties(dataUrl);
              const imgWidth = imgProps.width;
              const imgHeight = imgProps.height;
              const aspectRatio = imgWidth / imgHeight;

              // Calculate dimensions to fit within our container while maintaining aspect ratio
              let finalWidth = maxImageWidth;
              let finalHeight = maxImageWidth / aspectRatio;

              // If calculated height exceeds max height, scale down
              if (finalHeight > maxImageHeight) {
                finalHeight = maxImageHeight;
                finalWidth = maxImageHeight * aspectRatio;
              }

              // Center the image in the allocated space
              const xOffset = (maxImageWidth - finalWidth) / 2;
              const yOffset = (maxImageHeight - finalHeight) / 2;

              pdf.addImage(dataUrl, fmt, xPos + xOffset, currentRowY + yOffset, finalWidth, finalHeight);

              // Image label
              pdf.setFontSize(10).setTextColor(255, 255, 255).setFont("helvetica", "bold");
              pdf.text(`Style ${index + 1}`, xPos + maxImageWidth / 2 - 10, currentRowY + maxImageHeight + 10);
            }
          } catch (error) {
            console.error('Error loading image:', error);
            // Fallback rectangle
            pdf.setFillColor(50, 50, 50);
            pdf.rect(xPos, currentRowY, maxImageWidth, maxImageHeight, "F");
            pdf.setFontSize(9).setTextColor(255, 127, 80);
            pdf.text("Image Preview", xPos + maxImageWidth / 2 - 15, currentRowY + maxImageHeight / 2);
            pdf.setFontSize(10).setTextColor(255, 255, 255).setFont("helvetica", "bold");
            pdf.text(`Style ${index + 1}`, xPos + maxImageWidth / 2 - 10, currentRowY + maxImageHeight + 10);
          }

          // Track the maximum Y position in this row
          const currentImageBottom = currentRowY + maxImageHeight + 25;
          if (currentImageBottom > maxRowY) {
            maxRowY = currentImageBottom;
          }

          // Move to next row after every 2 images
          if (col === 1) {
            currentRowY = maxRowY;
          }
        }
      }

      // ===== FIXED FOOTER ON EACH PAGE =====
const totalPages = (pdf.internal as any).getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        const footerY = pageHeight - 15;

        // Footer separator
        pdf.setDrawColor(255, 127, 80).setLineWidth(0.2);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        // Footer text - FIXED PAGE NUMBERING
        pdf.setFontSize(8).setTextColor(150, 150, 150).setFont("helvetica", "normal");
        pdf.text("MKH Professional Hair Care - Confidential Client Report", margin, footerY);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, footerY);
      }

      // ===== SAVE FILE =====
      const fileName = `MKH_Hair_Analysis_${formData.firstName}_${formData.lastName}_${format(new Date(), "yyyyMMdd")}.pdf`;
      pdf.save(fileName);

      setMessage("PDF report generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      setMessage("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  const handleSubmit = async () => {
    console.log(formData.email, "email")
    if (!formData.email || formData.selectedDates.length === 0) {
      setMessage("Please enter an email address and select at least one date.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          dates: formData.selectedDates.map((date) =>
            format(date, "yyyy-MM-dd")
          ),
          formData: formData,
          sendAdditionalEmail: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {

        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          selectedHairColor: "",
          naturalHairColor: "",
          skinColor: "",
          eyeColor: "",
          hairTexture: "",
          hairLength: "",
          personalStyle: "",
          hairMaintenance: "",
          specialOccasions: [],
          preferredTreatments: [],
          workType: "",
          workIndustry: "",
          files: [],
          selectedDates: [],
        });
        setCurrentSlide(1);
        setMessage("");
      } else {
        setMessage(data.error || "Failed to submit form. Please try again.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 1:
        return (
          <>
            <p className="mt-0 flex justify-center mobile-text text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
              Complete your hair color analysis in just 3 minutes
            </p>

            <div className="glass-card mobile-card mb-9">
              {/* Title */}
              <div className="text-center mb-12">
                <h2 className="mobile-heading font-bold text-white mb-4">
                  Tell us a little about yourself
                </h2>
              </div>

              {/* First & Last Name */}
              <div className="form-grid gap-6 mb-8">
                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`input-field placeholder-gray-300 placeholder-opacity-10 border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral text-white ${formData.firstName ? "bg-black" : "bg-transparent"
                      }`}
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`input-field placeholder-gray-300 placeholder-opacity-10 border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral text-white ${formData.lastName ? "bg-black" : "bg-transparent"
                      }`}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="form-grid gap-6 mb-8">
                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="input-field placeholder-gray-300 placeholder-opacity-10 bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral text-white"
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
                      // Sirf numbers allow karo
                      let onlyNums = e.target.value.replace(/\D/g, "");

                      // Max 10 digits hi allow hongi
                      if (onlyNums.length > 10) {
                        onlyNums = onlyNums.slice(0, 10);
                      }

                      handleInputChange("phone", onlyNums);
                    }}
                    className="input-field placeholder-gray-300 placeholder-opacity-10 bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral text-white"
                    placeholder="123-456-7890"
                    maxLength={12} // formatted dashes ke sath 12 chars tak
                  />
                </div>

              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="glass-card mobile-card mb-9">
              {/* Hair Analysis */}
              <div className="mb-8">
                <h3 className="text-white font-semibold mb-6">Hair Analysis</h3>

                {/* Row 1 */}
                <div className="form-grid gap-6 mb-6">
                  <div>
                    <label className="block text-white/90 font-medium mb-2 text-sm">
                      Your Natural Hair Color
                    </label>
                    <select
                      value={formData.naturalHairColor}
                      onChange={(e) =>
                        handleInputChange("naturalHairColor", e.target.value)
                      }
                      className={`input-field bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.naturalHairColor === ""
                        ? "text-gray-300 opacity-60"
                        : "text-white"
                        }`}
                    >
                      <option value="" disabled className="opacity-0">
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
                      onChange={(e) =>
                        handleInputChange("skinColor", e.target.value)
                      }
                      className={`input-field bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.skinColor === ""
                        ? "text-gray-300 opacity-60"
                        : "text-white"
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

                {/* Row 2 */}
                <div className="form-grid gap-6">
                  <div>
                    <label className="block text-white/90 font-medium mb-2 text-sm">
                      Eye Color
                    </label>
                    <select
                      value={formData.eyeColor}
                      onChange={(e) =>
                        handleInputChange("eyeColor", e.target.value)
                      }
                      className={`input-field bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.eyeColor === ""
                        ? "text-gray-300 opacity-60"
                        : "text-white"
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
                      onChange={(e) =>
                        handleInputChange("hairTexture", e.target.value)
                      }
                      className={`input-field bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.hairTexture === ""
                        ? "text-gray-300 opacity-60"
                        : "text-white"
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

            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div
              className="glass-card mobile-card"
              style={{ marginBottom: "0" }}
            >
              <div className="text-center mb-6">
                <h2 className="mobile-heading font-bold text-white mb-4">
                  Choose Your Hair Color
                </h2>
                <p className="text-white/80 mobile-text">
                  Select the hair color category you're most interested in
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: "Blonde", label: "Blonde", emoji: "💛" },
                  { value: "Brunette", label: "Brunette", emoji: "🤎" },
                ].map((color) => (
                  <label
                    key={color.value}
                    className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <input
                      type="radio"
                      name="selectedHairColor"
                      value={color.value}
                      checked={formData.selectedHairColor === color.value}
                      onChange={(e) =>
                        handleInputChange("selectedHairColor", e.target.value)
                      }
                      className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral focus:ring-2"
                    />
                    {/* <span className="text-2xl">{color.emoji}</span> */}
                    <span className="text-white/90 text-lg font-medium">
                      {color.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <div className="glass-card mobile-card">
              <h2 className="mobile-heading font-bold text-white mb-6 text-center">
                Your present hair length?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["Short", "Medium", "Long", "Extra-long"].map((length) => (
                  <label
                    key={length}
                    className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <input
                      type="radio"
                      name="hairLength"
                      value={length}
                      checked={formData.hairLength === length}
                      onChange={(e) =>
                        handleInputChange("hairLength", e.target.value)
                      }
                      className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                    />
                    <span className="text-white/90 text-lg font-medium">
                      {length}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 5:
        return (
          <>
            <div className="glass-card mobile-card">
              <h2 className="mobile-heading font-bold text-white mb-6 text-center">
                Your personal style?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["Classic", "Trendy", "Elegant", "Minimal"].map((style) => (
                  <label
                    key={style}
                    className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <input
                      type="radio"
                      name="personalStyle"
                      value={style}
                      checked={formData.personalStyle === style}
                      onChange={(e) =>
                        handleInputChange("personalStyle", e.target.value)
                      }
                      className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                    />
                    <span className="text-white/90 text-lg font-medium">
                      {style}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 6:
        return (
          <>
            <div className="glass-card mobile-card">
              <h2 className="mobile-heading font-bold text-white mb-6 text-center">
                Your hair maintenance routine?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["Up to 6 weeks", "3 months", "6 months", "Yearly"].map(
                  (maintenance) => (
                    <label
                      key={maintenance}
                      className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                    >
                      <input
                        type="radio"
                        name="hairMaintenance"
                        value={maintenance}
                        checked={formData.hairMaintenance === maintenance}
                        onChange={(e) =>
                          handleInputChange("hairMaintenance", e.target.value)
                        }
                        className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                      />
                      <span className="text-white/90 text-lg font-medium">
                        {maintenance}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 7:
        return (
          <>
            <div className="glass-card mobile-card">
              <h2 className="mobile-heading font-bold text-white mb-6 text-center">
                Which occasions do you choose your hair treatments frequently?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Birthdays/Anniversary",
                  "Work",
                  "Holiday",
                  "Weddings/Social events",
                ].map((occasion) => (
                  <label
                    key={occasion}
                    className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialOccasions.includes(occasion)}
                      onChange={() =>
                        handleArrayFieldChange("specialOccasions", occasion)
                      }
                      className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                    />
                    <span className="text-white/90 text-lg font-medium">
                      {occasion}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 8:
        return (
          <>
            <div className="glass-card mobile-card">
              <h2 className="mobile-heading font-bold text-white mb-6 text-center">
                Which treatments do you prefer presently or would like to try in
                future?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "All over color",
                  "Balayage",
                  "Babylights",
                  "Highlights",
                  "Lowlights",
                  "Root melt",
                ].map((treatment) => (
                  <label
                    key={treatment}
                    className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferredTreatments.includes(treatment)}
                      onChange={() =>
                        handleArrayFieldChange("preferredTreatments", treatment)
                      }
                      className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                    />
                    <span className="text-white/90 text-lg font-medium">
                      {treatment}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 9:
        return (
          <>
            <div className="glass-card mobile-card">
              <div className="text-center mb-6">
                <h2 className="mobile-heading font-bold text-white mb-4">
                  Upload some styles that inspire you
                </h2>
                <p className="text-white/70 mobile-text">
                  (Optional you can skip to the next)
                </p>
              </div>

              <div className="border-2 border-dashed border-coral/50 file-upload-area text-center hover:border-coral transition-colors bg-black/20">
                <div className="text-4xl mb-4">☁️</div>
                <p className="text-white/90 mb-4 mobile-text">Browse Files</p>
                <p className="text-white/70 mb-6 mobile-description">
                  Drag and drop Files here
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="btn-primary cursor-pointer"
                >
                  Choose Files
                </label>
              </div>

              {formData.files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3 mobile-text">
                    Uploaded Files:
                  </h3>
                  <div className="space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-black/40 p-3 border border-white/10"
                      >
                        <span className="text-white/90 mobile-text truncate mr-2">
                          {file.name}
                        </span>
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
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 10:
        return (
          <>
            <div className="glass-card mobile-card">
              <h2 className="mobile-heading font-bold text-white mb-6 text-center">
                Work
              </h2>
              <p className="text-white/70 mobile-text mb-6 text-center">
                (Optional you can skip to next)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: "Corporate", label: "Corporate" },
                  { value: "Stay at home", label: "Stay at home" },
                  { value: "Work from home", label: "Work from home" },
                  { value: "Entrepreneur", label: "Entrepreneur" },
                  { value: "Student", label: "Student" },
                ].map((work) => (
                  <label
                    key={work.value}
                    className="flex items-center space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
                  >
                    <input
                      type="radio"
                      name="workType"
                      value={work.value}
                      checked={formData.workType === work.value}
                      onChange={(e) =>
                        handleInputChange("workType", e.target.value)
                      }
                      className="w-5 h-5 text-coral bg-white/10 border-white/30 focus:ring-coral"
                    />
                    <span className="text-white/90 text-lg font-medium">
                      {work.label}
                    </span>
                  </label>
                ))}
              </div>

              {(formData.workType === "Corporate" ||
                formData.workType === "Work from home" ||
                formData.workType === "Entrepreneur") && (
                  <div className="mt-6">
                    <label className="block text-white/90 font-medium mb-2 text-sm">
                      Please specify industry
                    </label>
                    <input
                      type="text"
                      value={formData.workIndustry}
                      onChange={(e) =>
                        handleInputChange("workIndustry", e.target.value)
                      }
                      className="input-field placeholder-gray-300 placeholder-opacity-60"
                      placeholder="e.g., Technology, Healthcare, Finance..."
                    />
                  </div>
                )}
            </div>
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      case 11:
        return (
          <>
            <div className="glass-card mobile-card">
              <div className="mb-6">
                <h2 className="mobile-heading font-bold text-white mb-4 text-center">
                  Select Your Perfect Hair Days
                </h2>
                <p className="text-white/80 mobile-text mb-2 text-center">
                  Select some of your most important days of the year when you
                  would like to look your very best. Let us send you a reminder
                  2 weeks before to consult or set an appointment.
                </p>
                <p className="text-white/60 italic mobile-description text-center">
                  (Optional you can skip to the next)
                </p>
              </div>

              <div className="calendar-responsive">
                <div>
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="mobile-heading font-bold text-white">
                      Calendar
                    </h3>
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
                        if (view === "month") {
                          const dateStr = format(date, "yyyy-MM-dd");
                          const isSelected = formData.selectedDates.some(
                            (selectedDate) =>
                              format(selectedDate, "yyyy-MM-dd") === dateStr
                          );
                          return isSelected ? (
                            <span className="calendar-selected-dot" />
                          ) : null;
                        }
                        return null;
                      }}
                      className="w-full border-0 bg-transparent text-white"
                      navigationLabel={({ date }) => format(date, "MMMM yyyy")}
                      formatShortWeekday={(locale, date) => format(date, "EEE")}
                    />

                    <div className="mt-6">
                      <div className="flex items-center justify-between bg-black/60 backdrop-blur-sm border border-white/10 p-3">
                        <div className="flex items-center">
                          <span className="text-white font-semibold text-sm">
                            <span className="text-xl font-bold text-coral mr-1">
                              {formData.selectedDates.length}
                            </span>
                            dates selected
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mobile-heading font-bold text-white mb-4">
                    Selected Dates
                  </h3>

                  {formData.selectedDates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📅</div>
                      <p className="text-white/70 mobile-text mb-2">
                        No dates selected yet
                      </p>
                      <p className="text-white/50 mobile-description">
                        Click on dates in the calendar to select them
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 selected-dates-container">
                      {formData.selectedDates
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date, index) => (
                          <div key={index} className="date-card">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white mobile-text">
                                {format(date, "EEEE, MMMM d, yyyy")}
                              </span>
                              <button
                                onClick={() => {
                                  const dateStr = format(date, "yyyy-MM-dd");
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedDates: prev.selectedDates.filter(
                                      (d) => format(d, "yyyy-MM-dd") !== dateStr
                                    ),
                                  }));
                                }}
                                className="text-red-300 hover:text-red-100 mobile-text font-medium transition-colors duration-300"
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
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );
      case 12:
        return (
          <>
            <div className="glass-card mobile-card">
              <div className="text-center mb-8">
                <h2 className="mobile-heading font-bold text-white mb-4">
                  Review & Submit
                </h2>
                <p className="text-white/80 mobile-text">
                  Please review your information before submitting
                </p>
              </div>

              {/* <div className="space-y-6">
              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
                  <p>
                    <strong>Name:</strong> {formData.firstName}{" "}
                    {formData.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone}
                  </p>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Hair Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/80">
                  <p>
                    <strong>Hair Color:</strong> {formData.naturalHairColor}
                  </p>
                  <p>
                    <strong>Skin Color:</strong> {formData.skinColor}
                  </p>
                  <p>
                    <strong>Eye Color:</strong> {formData.eyeColor}
                  </p>
                  <p>
                    <strong>Hair Texture:</strong> {formData.hairTexture}
                  </p>
                  <p>
                    <strong>Hair Length:</strong> {formData.hairLength}
                  </p>
                  <p>
                    <strong>Personal Style:</strong> {formData.personalStyle}
                  </p>
                  <p>
                    <strong>Maintenance:</strong> {formData.hairMaintenance}
                  </p>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-3">
                  Selected Dates
                </h3>
                <p className="text-white/80">
                  {formData.selectedDates.length} dates selected
                </p>
              </div>
            </div> */}

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
                  disabled={
                    isSubmitting ||
                    isGeneratingPDF ||
                    !formData.firstName ||
                    !formData.lastName
                  }
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
            <div>
              <p className="mt-0 flex justify-end mobile-text mb-10 text-white/25 ">
                Duration 3 minutes
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-coral/10 rounded-full blur-3xl floating-animation mobile-bg-decoration"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/20 rounded-full blur-3xl floating-animation mobile-bg-decoration"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl floating-animation mobile-bg-decoration"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto mobile-container py-4 sm:py-6 lg:py-8">
        <header className="mobile-header">
          <div className="inline-block p-3 sm:p-4 bg-black/40 backdrop-blur-sm border border-coral/30">
            <div className="mobile-heading font-bold text-white flex flex-row">
              <Image
                src={mkhLogo}
                alt="MKH Logo"
                className="ml-3 w-16 h-auto opacity-80 rounded-full object-cover"
              />
              <h1 className="mt-3 ml-5"> MKH Hair Color Analysis</h1>
            </div>
          </div>
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

          {/* Sticky Footer Navigation */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div
              className="flex flex-row items-center justify-center gap-6
                 bg-transparent backdrop-blur-md
                 px-6 py-3 rounded-2xl"
            >
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
        </div>

        {/* Notification */}
        {message && (
          <div className="fixed bottom-6 right-6 notification p-6 max-w-sm z-50">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {message.includes("successfully") ? (
                  <div className="text-green-400 text-xl">✅</div>
                ) : (
                  <div className="text-red-400 text-xl">⚠️</div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${message.includes("successfully")
                    ? "text-green-100"
                    : "text-red-100"
                    }`}
                >
                  {message}
                </p>
              </div>
              <button
                onClick={() => setMessage("")}
                className="ml-4 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
