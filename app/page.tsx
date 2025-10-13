"use client";
import InputMask from "react-input-mask";
import { useState } from "react";
import Calendar from "react-calendar";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
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

      // ===== PAGE 1: RECOMMENDATIONS =====
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Header with Logo
      try {
        const logoResponse = await fetch(mkhLogo.src);
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });

        pdf.addImage(logoBase64 as string, "JPEG", margin, 15, 40, 40);
      } catch (error) {
        console.log("Logo not available, continuing without logo");
      }

      // Header title
      pdf
        .setFontSize(26)
        .setTextColor(255, 127, 80)
        .setFont("helvetica", "bold");
      pdf.text("MKH Hair Color Analysis", margin + 45, 35);

      pdf
        .setFontSize(16)
        .setTextColor(255, 255, 255)
        .setFont("helvetica", "bold");
      pdf.text("Professional Consultation Report", margin + 45, 45);

      // Header separator line
      pdf.setDrawColor(255, 127, 80).setLineWidth(0.5);
      pdf.line(margin, 55, pageWidth - margin, 55);

      yPosition = 70;

      // ===== RECOMMENDATIONS SECTION - PAGE 1 =====
      const combination: HairCombination = {
        hairColor: formData.selectedHairColor,
        hairLength: formData.hairLength,
        personalStyle: formData.personalStyle,
      };

      const recommendation = getHairRecommendation(combination);
      const images = getAllRecommendationImages(combination);

      const addSection = (title: string, content: string[], y: number) => {
        if (y > pageHeight - margin - 60) {
          pdf.addPage();
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          y = margin;
        }

        pdf
          .setFontSize(18)
          .setTextColor(255, 127, 80)
          .setFont("helvetica", "bold");
        pdf.text(title, margin, y);

        pdf.setDrawColor(255, 127, 80).setLineWidth(0.5);
        pdf.line(margin, y + 2, margin + pdf.getTextWidth(title), y + 2);

        let currentY = y + 12;

        pdf
          .setFontSize(11)
          .setTextColor(255, 255, 255)
          .setFont("helvetica", "normal");

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

        currentY += 10;
        return currentY;
      };

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
          ...recommendation.maintenanceSchedule.map(
            (schedule) => `• ${schedule}`
          ),
        ];

        yPosition = addSection(
          "Professional Recommendations",
          recommendationsContent,
          yPosition
        );
      }

      // ===== PAGE 2: RECOMMENDED STYLE IMAGES =====
      pdf.addPage();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      yPosition = margin;

      if (images.length > 0) {
        // Image section title
        pdf
          .setFontSize(18)
          .setTextColor(255, 127, 80)
          .setFont("helvetica", "bold");
        pdf.text("Recommended Style Visuals", margin, yPosition);

        pdf.setDrawColor(255, 127, 80).setLineWidth(0.5);
        pdf.line(
          margin,
          yPosition + 2,
          margin + pdf.getTextWidth("Recommended Style Visuals"),
          yPosition + 2
        );

        yPosition += 20;

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
              const fmt = imagesToProcess[index].toLowerCase().includes(".png")
                ? "PNG"
                : "JPEG";

              const imgProps = pdf.getImageProperties(dataUrl);
              const imgWidth = imgProps.width;
              const imgHeight = imgProps.height;
              const aspectRatio = imgWidth / imgHeight;

              let finalWidth = maxImageWidth;
              let finalHeight = maxImageWidth / aspectRatio;

              if (finalHeight > maxImageHeight) {
                finalHeight = maxImageHeight;
                finalWidth = maxImageHeight * aspectRatio;
              }

              const xOffset = (maxImageWidth - finalWidth) / 2;
              const yOffset = (maxImageHeight - finalHeight) / 2;

              pdf.addImage(
                dataUrl,
                fmt,
                xPos + xOffset,
                currentRowY + yOffset,
                finalWidth,
                finalHeight
              );

              // Image label
              pdf
                .setFontSize(10)
                .setTextColor(255, 255, 255)
                .setFont("helvetica", "bold");
              pdf.text(
                `Style ${index + 1}`,
                xPos + maxImageWidth / 2 - 10,
                currentRowY + maxImageHeight + 10
              );
            }
          } catch (error) {
            console.error("Error loading image:", error);
            pdf.setFillColor(50, 50, 50);
            pdf.rect(xPos, currentRowY, maxImageWidth, maxImageHeight, "F");
            pdf.setFontSize(9).setTextColor(255, 127, 80);
            pdf.text(
              "Image Preview",
              xPos + maxImageWidth / 2 - 15,
              currentRowY + maxImageHeight / 2
            );
            pdf
              .setFontSize(10)
              .setTextColor(255, 255, 255)
              .setFont("helvetica", "bold");
            pdf.text(
              `Style ${index + 1}`,
              xPos + maxImageWidth / 2 - 10,
              currentRowY + maxImageHeight + 10
            );
          }

          const currentImageBottom = currentRowY + maxImageHeight + 25;
          if (currentImageBottom > maxRowY) {
            maxRowY = currentImageBottom;
          }

          if (col === 1) {
            currentRowY = maxRowY;
          }
        }
      }

      // ===== PAGE 3: CLIENT INFORMATION AND SCHEDULE =====
      pdf.addPage();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      yPosition = margin;

      // ===== CLIENT SUMMARY SECTION =====
      const summaryContent = [
        `Name: ${formData.firstName} ${formData.lastName}`,
        `Analysis Date: ${format(new Date(), "MMMM d, yyyy")}`,
        `Reference: MKH-${Date.now().toString().slice(-6)}`,
        `Report generated on: ${format(
          new Date(),
          "EEEE, MMMM d, yyyy 'at' h:mm a"
        )}`,
      ];

      yPosition = addSection("Client Summary", summaryContent, yPosition);

      // ===== PERSONAL INFORMATION SECTION =====
      const personalInfoContent = [
        `Full Name: ${formData.firstName} ${formData.lastName}`,
        `Email: ${formData.email}`,
        `Phone: ${formData.phone || "Not provided"}`,
      ];

      yPosition = addSection(
        "Personal Information",
        personalInfoContent,
        yPosition
      );

      // ===== HAIR ANALYSIS SECTION =====
      const hairAnalysisContent = [
        `Natural Hair Color: ${formData.naturalHairColor || "Not specified"}`,
        `Skin Tone: ${formData.skinColor || "Not specified"}`,
        `Eye Color: ${formData.eyeColor || "Not specified"}`,
        `Hair Texture: ${formData.hairTexture || "Not specified"}`,
        `Hair Length: ${formData.hairLength || "Not specified"}`,
        `Personal Style: ${formData.personalStyle || "Not specified"}`,
        `Maintenance Preference: ${formData.hairMaintenance || "Not specified"}`,
      ];

      yPosition = addSection(
        "Hair Analysis Profile",
        hairAnalysisContent,
        yPosition
      );

      // ===== SCHEDULED PERFECT HAIR DAYS =====
      if (formData.selectedDates && formData.selectedDates.length > 0) {
        if (yPosition > pageHeight - margin - 100) {
          pdf.addPage();
          pdf.setFillColor(0, 0, 0);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        const sortedDates = [...formData.selectedDates].sort(
          (a, b) => a.getTime() - b.getTime()
        );

        const datesContent = [
          "Your scheduled appointment dates:",
          "",
          ...sortedDates.map(
            (date: Date, index: number) =>
              `${index + 1}. ${format(date, "EEEE, MMMM d, yyyy")}`
          ),
          "",
          `Total appointments scheduled: ${formData.selectedDates.length}`,
        ];

        yPosition = addSection(
          "Scheduled Perfect Hair Days",
          datesContent,
          yPosition
        );
      }

      // ===== FIXED FOOTER ON EACH PAGE =====
      const totalPages = (pdf.internal as any).getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        const footerY = pageHeight - 15;

        // Footer separator
        pdf.setDrawColor(255, 127, 80).setLineWidth(0.2);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        // Footer text
        pdf
          .setFontSize(8)
          .setTextColor(150, 150, 150)
          .setFont("helvetica", "normal");
        pdf.text(
          "MKH Professional Hair Care - Confidential Client Report",
          margin,
          footerY
        );
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 20,
          footerY
        );
      }

      // ===== SAVE FILE =====
      const fileName = `MKH_Hair_Analysis_${formData.firstName}_${formData.lastName
        }_${format(new Date(), "yyyyMMdd")}.pdf`;
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
    console.log(formData.email, "email");
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
            <div className="glass-card mobile-card mt-0 md:h-[432px] relative mb-32">
              {/* Title */}
              <div className="text-center mb-12">
                <p className="mt-0 pt-7 pb-4 flex justify-center text-sm sm:text-base text-white/90 max-w-md mx-auto leading-relaxed mb-6 sm:mb-8 ">
                  Get your hair color analysis in 3 minutes.*
                </p>

                <h3
                  className="mobile-heading font-bold mb-4"
                  style={{ color: "#ff7f50" }}
                >
                  Tell us a little about yourself
                </h3>
              </div>

              {/* Duration at bottom-right */}
              <p className="absolute bottom-4 right-4 text-white/70 text-sm opacity-0">
                Duration 3 minutes
              </p>

              {/* First & Last Name */}
              <div className="form-grid gap-6 mb-8">
                <div>
                  <label className="block text-white/90 font-medium mb-2 text-sm">
                    First Name<span className="text-red-500">*</span>
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
                    Last Name<span className="text-red-500">*</span>
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
                    Email<span className="text-red-500">*</span>
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
                    Phone Number <span className="text-red-500">*</span>
                  </label>

                  <InputMask
                    mask="+1 (999) 999-9999"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  >
                    {(inputProps) => (
                      <input
                        {...inputProps}
                        type="tel"
                        required
                        placeholder="+1 (555) 123-4567"
                        className="input-field placeholder-gray-300 placeholder-opacity-10 bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral text-white"
                      />
                    )}
                  </InputMask>
                </div>
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="glass-card mobile-card max-w-full md:max-w-4xl w-full h-auto p-6 md:h-[432px] flex flex-col justify-between mb-12">
              {/* Top content */}
              <div className="flex-1 flex items-center">
                <div className="w-full">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div>
                      <label className="block text-white/90 font-medium mb-2 text-sm">
                        Your Natural Hair Color{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.naturalHairColor}
                        onChange={(e) =>
                          handleInputChange("naturalHairColor", e.target.value)
                        }
                        className={`input-field w-full bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.naturalHairColor === ""
                          ? "text-gray-300 opacity-60"
                          : "text-white"
                          }`}
                      >
                        <option value="" disabled className="opacity-60">
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
                        Skin Color<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.skinColor}
                        onChange={(e) =>
                          handleInputChange("skinColor", e.target.value)
                        }
                        className={`input-field w-full bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.skinColor === ""
                          ? "text-gray-300 opacity-60"
                          : "text-white"
                          }`}
                      >
                        <option value="" disabled className="opacity-60">
                          Select skin color
                          <span className="text-red-500">*</span>
                        </option>
                        <option value="Dark">Dark</option>
                        <option value="Medium">Medium</option>
                        <option value="Fair">Fair</option>
                        <option value="Light">Light</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/90 font-medium mb-2 text-sm">
                        Eye Color <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.eyeColor}
                        onChange={(e) =>
                          handleInputChange("eyeColor", e.target.value)
                        }
                        className={`input-field w-full bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.eyeColor === ""
                          ? "text-gray-300 opacity-60"
                          : "text-white"
                          }`}
                      >
                        <option value="" disabled className="opacity-60">
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
                        Hair Texture <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.hairTexture}
                        onChange={(e) =>
                          handleInputChange("hairTexture", e.target.value)
                        }
                        className={`input-field w-full bg-transparent border border-gray-400 rounded-lg focus:border-coral focus:ring-1 focus:ring-coral ${formData.hairTexture === ""
                          ? "text-gray-300 opacity-60"
                          : "text-white"
                          }`}
                      >
                        <option value="" disabled className="opacity-60">
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

              {/* Duration at the bottom-right */}
              <div className="flex justify-end mt-8">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="glass-card mobile-card mb-9 max-w-full md:max-w-4xl w-full min-h-[430px] md:h-[432px] p-6 flex flex-col justify-between">
              {/* Header */}
              <div className="text-center mb-6">
                <h4
                  className="mobile-heading font-bold mb-4"
                  style={{ color: "#ff7f50", marginTop: "10px" }}
                >
                  Choose Your Hair Color
                </h4>
              </div>

              {/* Hair color options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-12">
                {[
                  { value: "Blonde", label: "Blonde", emoji: "💛" },
                  { value: "Brunette", label: "Brunette", emoji: "🤎" },
                ].map((color) => (
                  <label
                    key={color.value}
                    className="space-x-3 cursor-pointer p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/40 transition-all"
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
                    <span
                      className="text-white/90 text-lg font-medium"
                      style={{ fontSize: "15px" }}
                    >
                      {color.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Duration at the bottom-right */}
              <div className="flex justify-end mt-4">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="glass-card mobile-card max-w-full mb-12 md:max-w-4xl w-full h-auto p-6 md:h-[442px] flex flex-col justify-between">
              {/* Header */}
              <h3
                className="mobile-heading font-bold text-center"
                style={{ color: "#ff7f50", marginTop: "10px" }}
              >
                Your present hair length?
              </h3>

              {/* Hair length options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
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
                    <span
                      className="text-white/90 text-lg font-medium"
                      style={{ fontSize: "15px" }}
                    >
                      {length}
                    </span>
                  </label>
                ))}
              </div>

              {/* Duration at the bottom-right */}
              <div className="flex justify-end mt-8 md:mt-4">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 5:
        return (
          <>
            <div className="glass-card mb-12 mobile-card max-w-full md:max-w-4xl w-full h-auto p-6 md:h-[432px] flex flex-col justify-between">
              {/* Header */}
              <h3
                className="mobile-heading font-bold mb-6 text-center"
                style={{ color: "#ff7f50", marginTop: "10px" }}
              >
                Your personal style?
              </h3>

              {/* Personal style options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
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
                    <span
                      className="text-white/90 text-lg font-medium"
                      style={{ fontSize: "15px" }}
                    >
                      {style}
                    </span>
                  </label>
                ))}
              </div>

              {/* Duration at bottom-right */}
              <div className="flex justify-end mt-4">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 6:
        return (
          <>
            <div className="mb-12 glass-card mobile-card max-w-full md:max-w-4xl w-full h-auto p-6 md:h-[432px] flex flex-col justify-between">
              {/* Header */}
              <h3
                className="mobile-heading font-bold mb-6 text-center"
                style={{ color: "#ff7f50", marginTop: "10px" }}
              >
                How often you get your hair services?
              </h3>

              {/* Hair maintenance options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
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
                      <span
                        className="text-white/90 text-lg font-medium"
                        style={{ fontSize: "15px" }}
                      >
                        {maintenance}
                      </span>
                    </label>
                  )
                )}
              </div>

              {/* Duration at bottom-right */}
              <div className="flex justify-end mt-4">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 7:
        return (
          <>
            <div className="glass-card mobile-card max-w-full md:max-w-4xl w-full h-auto p-6 md:h-[442px] flex flex-col justify-between relative">
              {/* Header */}
              <h3
                className="mobile-heading font-bold mb-6 text-center"
                style={{ color: "#ff7f50", marginTop: "10px" }}
              >
                Apart from your usual routine,on which special occasions you
                choose your hair services frequently?
              </h3>

              {/* Special occasions options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-12">
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
                    <span
                      className="text-white/90 text-lg font-medium"
                      style={{ fontSize: "15px" }}
                    >
                      {occasion}
                    </span>
                  </label>
                ))}
              </div>

              {/* Duration at bottom-right */}
              <div className="flex justify-end mt-4">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 8:
        return (
          <>
            <div className="glass-card mobile-card max-w-full md:max-w-4xl w-full h-auto p-6 md:h-[442px] flex flex-col justify-between relative mb-32">
              {/* Header */}
              <h3
                className="mobile-heading font-bold mb-6 text-center"
                style={{ color: "#ff7f50", marginTop: "10px" }}
              >
                Which treatments do you prefer presently or would like to try in
                future?
              </h3>

              {/* Treatment options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-12">
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
                    <span
                      className="text-white/90 text-lg font-medium"
                      style={{ fontSize: "15px" }}
                    >
                      {treatment}
                    </span>
                  </label>
                ))}
              </div>

              {/* Duration at bottom-right */}
              <div className="flex justify-end mt-4">
                <p className="text-white/70 text-sm opacity-0">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 9:
        return (
          <>
            <div className="glass-card mobile-card max-w-full md:max-w-4xl w-full h-[500px] p-6 flex flex-col overflow-y-auto relative">
              {/* Duration at bottom-right */}
              <p className="absolute bottom-4 right-4 text-white/70 text-sm opacity-0">
                Duration 3 minutes
              </p>

              {/* Header */}
              <div className="text-center mb-6 flex-shrink-0">
                <h3
                  className="mobile-heading font-bold mb-4"
                  style={{ color: "#ff7f50" }}
                >
                  Upload some styles that inspire you
                </h3>
                <p className="text-white/70 mobile-text">
                  (Optional - You can skip to the next slide)
                </p>
              </div>

              {/* File upload area - mobile optimized */}
              <div className="border-2 border-dashed border-coral/50 file-upload-area text-center hover:border-coral transition-colors bg-black/20 p-4 sm:p-6 mb-2 flex-shrink-0 min-h-[120px] flex flex-col justify-center">
                <div className="text-3xl sm:text-4xl mb-3">☁️</div>
                <p className="text-white/90 mb-2 text-sm sm:text-base">
                  Browse Files
                </p>
                <p className="text-white/70 mb-4 text-xs sm:text-sm">
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
                  className="btn-primary cursor-pointer py-3 px-6 text-sm sm:text-base touch-manipulation"
                >
                  Choose Files
                </label>
              </div>

              {/* Info line */}
              <p className="text-white/60 mobile-description mb-2 text-center flex-shrink-0">
                You can upload up to 5 image files (JPG, PNG, GIF, etc.)
              </p>

              {/* Uploaded files - now takes full remaining space */}
              {formData.files.length > 0 && (
                <div className="flex-1">
                  {formData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-black/40 p-3 border border-white/10 mb-2"
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
              )}
            </div>
          </>
        );

      case 10:
        return (
          <>
            {/* Main Card */}
            <div
              className="glass-card mobile-card mb-9 max-w-full md:max-w-4xl w-full p-6 relative"
              style={{
                height: "auto",
                maxHeight: "80vh", 
                overflowY: "auto" 
              }}
            >
              {/* Heading */}
              <h3
                className="mobile-heading font-bold mb-4 text-center sticky top-0 bg-black/80 backdrop-blur-sm py-2 z-10"
                style={{ color: "#ff7f50", marginTop: "10px" }}
              >
                Your Lifestyle
              </h3>

              {/* Optional Text */}
              <p className="text-white/70 mobile-text mb-6 text-center">
                (Optional - You can skip to next slide)
              </p>

              {/* Work Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-10">
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
                    <span
                      className="text-white/90 text-lg font-medium"
                      style={{ fontSize: "15px" }}
                    >
                      {work.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Industry Input — Conditional */}
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
                      className="input-field placeholder-gray-300 placeholder-opacity-60 w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-coral focus:ring-1 focus:ring-coral"
                      placeholder="e.g., Technology, Healthcare, Finance..."
                    />
                  </div>
                )}

              {/* Duration (Bottom-right for large, below for mobile) */}
              <div className="flex justify-end mt-6 sm:mt-8 sticky bottom-0 bg-black/80 backdrop-blur-sm py-2">
                <p className="text-white/70 text-sm">
                  Duration 3 minutes
                </p>
              </div>
            </div>
          </>
        );

      case 11:
        return (
          <>
            <div
              className="glass-card mobile-card relative mb-44"
              style={{ overflowY: "auto" }}
            >
              {/* Duration at bottom-right */}
              <p className="absolute bottom-4 right-4 text-white/70 text-sm opacity-0">
                Duration 3 minutes
              </p>

              <div className="mb-6">
                <h3
                  className="mobile-heading font-bold mb-4 text-center"
                  style={{ color: "#ff7f50" }}
                >
                  Select Your Perfect Hair Days
                </h3>
                <p className="text-white/80 mobile-text mb-2 text-center">
                  Choose your important dates so we can send you reminders 3
                  weeks before with a special offer plus 10% off
                  your hair services.
                </p>
                <p className="text-white/60 italic mobile-description text-center">
                  (Optional - You can skip to the next slide)
                </p>
              </div>

              <div className="calendar-responsive">
                <div>
                  {/* Calendar Header */}
                  <div className="mb-4">
                    <h3
                      className="mobile-heading font-bold text-white"
                      style={{ color: "#ff7f50" }}
                    >
                      CALENDAR
                    </h3>
                  </div>

                  {/* Calendar */}
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
                      className="w-full border-0 bg-transparent text-white text-sm sm:text-base"
                      navigationLabel={({ date }) => format(date, "MMMM yyyy")}
                      formatShortWeekday={(locale, date) => format(date, "EEE")}
                      tileDisabled={({ date }) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />

                    {/* Dates Selected */}
                    <div className="mt-6 bg-black/60 backdrop-blur-sm border border-white/10 p-3">
                      <span className="text-white font-semibold text-sm">
                        <span className="text-xl font-bold text-coral mr-1">
                          {formData.selectedDates.length}
                        </span>
                        dates selected
                      </span>
                    </div>

                    {/* Clear All Button */}
                    <div className="mt-3">
                      <button
                        onClick={clearSelection}
                        disabled={formData.selectedDates.length === 0}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed mobile-btn w-full sm:w-auto"
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Dates Section */}
                <div>
                  <h3
                    className="mobile-heading font-bold mb-2 sm:mb-8 md:mb-20"
                    style={{ color: "#ff7f50" }}
                  >
                    SELECTED DATES
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
          </>
        );
      case 12:
        return (
          <>
            <div
              className="glass-card mobile-card relative flex flex-col items-center justify-between text-center"
              style={{
                maxWidth: "896px",
                height: "500px",
                padding: "20px",
              }}
            >
              {/* ---- Heading (Top) ---- */}
              {/* isy thira nichy laana and white karna  */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center">
                <h3
                  className="mobile-heading  font-bold mb-2"
                  style={{ color: "#ff7f50" }}
                >
                  Download your Mini Hair Color Analysis
                </h3>
              </div>

              {/* ---- Centered Button ---- */}
              <div className="flex flex-col items-center justify-center w-full mt-10 flex-grow">
                <button
                  onClick={downloadPDFHandler}
                  disabled={
                    isSubmitting ||
                    isGeneratingPDF ||
                    !formData.firstName ||
                    !formData.lastName
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #ff6347 0%, #ff7f50 100%)",
                    transform: "scale(1.05)",
                    transition: "all 0.3s ease",
                  }}
                  className="relative overflow-hidden text-white font-bold py-4 px-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none border-2 border-white/20 hover:border-white/40"
                >
                  {isGeneratingPDF ? (
                    <span className="flex items-center justify-center relative z-10 text-white">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white mr-3"></div>
                      <span className="text-lg">Generating...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center relative z-10 text-white">
                      <div className="text-2xl mr-3">📄</div>
                      <span className="text-lg">Download</span>
                    </span>
                  )}
                </button>
              </div>

              {/* ---- Buttons at Bottom ---- */}

              {/* todo : white button  square with black text */}
              {/* bold captions  */}
              <div className="w-full px-3 py-3 text-center absolute bottom-6 left-1/2 -translate-x-1/2">
                <div className="flex flex-row items-start justify-center gap-4 flex-wrap">
                  {/* ---- Button 1 ---- */}
                  <div className="text-center flex-1 min-w-[130px]">
                    <p className="text-white text-xs mb-1 leading-tight font-bold">
                      Get Full Hair Color Analysis at a special offer now
                    </p>
                    <button
                      onClick={() =>
                        window.open("https://example.com/book-now", "_blank")
                      }
                      className="bg-white text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-none shadow-md transition-all w-full hover:bg-gray-200"
                    >
                      Book Now
                    </button>
                  </div>

                  {/* ---- Button 2 ---- */}
                  <div className="text-center flex-1 min-w-[130px] mt-4 sm:mt-0">
                    <p className="text-white text-xs mb-1 leading-tight font-bold">
                      Book hair services now with a special offer
                    </p>
                    <button
                      onClick={() =>
                        window.open("https://example.com/book-appointment", "_blank")
                      }
                      className="bg-white text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-none shadow-md transition-all w-full hover:bg-gray-200"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>

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

      <div className="relative z-10 container mx-auto mobile-container px-4 py-0 sm:py-0 lg:py-0">
        <header className="mobile-header mt-4 mb-0">
          <div className="w-full max-w-sm mx-auto bg-black/40 backdrop-blur-sm border border-coral/30 p-0">
            <div className="mobile-heading font-bold text-white flex items-center">
              {/* Image */}
              <div className="bg-black/40 backdrop-blur-sm ">
                <Image
                  src="/lgag.png"
                  alt="MKH Logo" 
                  width={80}
                  height={80}
                  className="w-28 h-28 sm:w-28 sm:h-28 object-cover flex-shrink-0"
                />
              </div>

              {/* Text stacked vertically */}
              <div className="flex flex-col justify-center flex-1 text-left pl-3 sm:pl-5">
                <span className="text-3xl sm:text-4xl font-bold leading-tight text-left">
                  HAIR COLOR
                </span>
                <span
                  className="text-3xl sm:text-4xl font-extrabold text-left"
                  style={{ color: "#ff5533", lineHeight: "1.1" }}
                >
                  ANALYSIS
                </span>
              </div>
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
        <div className="max-w-4xl mx-auto mobile-section relative">
          {/* Slide Content */}
          {renderSlide()}

          {/* ---- Navigation Buttons (Fixed to Bottom) ---- */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 sm:bottom-6">
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6
      bg-black/40 backdrop-blur-md border border-white/10
      px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl shadow-lg"
            >
              <button
                onClick={prevSlide}
                disabled={currentSlide === 1}
                className="btn-secondary w-full sm:w-auto text-xs sm:text-base
        disabled:opacity-50 disabled:cursor-not-allowed mobile-btn py-1"
              >
                {currentSlide === totalSlides ? "← Go back to make any changes" : "← Previous"}
              </button>

              <button
                onClick={nextSlide}
                disabled={
                  currentSlide === totalSlides ||
                  (currentSlide === 1 &&
                    (!formData.firstName ||
                      !formData.lastName ||
                      !formData.email ||
                      !formData.phone)) ||
                  (currentSlide === 2 &&
                    (!formData.naturalHairColor ||
                      !formData.skinColor ||
                      !formData.eyeColor ||
                      !formData.hairTexture)) ||
                  (currentSlide === 3 && !formData.selectedHairColor) ||
                  (currentSlide === 4 && !formData.hairLength) ||
                  (currentSlide === 5 && !formData.personalStyle) ||
                  (currentSlide === 6 && !formData.hairMaintenance) ||
                  (currentSlide === 7 &&
                    formData.specialOccasions?.length === 0) ||
                  (currentSlide === 8 &&
                    formData.preferredTreatments?.length === 0)
                }
                className={
                  currentSlide === totalSlides
                    ? "hidden" 
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold w-full sm:w-auto text-xs sm:text-base disabled:opacity-50 disabled:cursor-not-allowed mobile-btn py-2 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                }
              >
                {currentSlide === totalSlides ? "" : "Next →"}
              </button>
            </div>

            {/* Duration (moved below buttons) */}
            <div className="flex justify-end mt-2 pr-2">
              <span className="text-white/70 text-[11px] bg-black/70 px-2 py-0.5 rounded-md">
                Duration 3 minutes
              </span>
            </div>
          </div>z
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
