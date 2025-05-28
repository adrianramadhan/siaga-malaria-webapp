import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
let genAI: GoogleGenAI | null = null;

// Try to initialize with environment variable
export function initGeminiAPI(customApiKey?: string) {
  // Use custom API key if provided, otherwise try to use environment variable
  const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not found. Please provide an API key.");
  }

  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

export async function generateMedicalReport(
  prediction: "Parasitized" | "Uninfected",
  confidence: number,
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    symptoms?: string;
    location?: string;
  },
  language: "id" | "en" = "id"
) {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Call initGeminiAPI first.");
  }

  // Get current date
  const currentDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format patient information
  const patientName = patientInfo?.name || "[Nama Pasien]";
  const patientAge = patientInfo?.age || "[Usia]";
  const patientGender = patientInfo?.gender || "[Jenis Kelamin]";
  const patientLocation = patientInfo?.location || "[Lokasi]";
  const patientSymptoms = patientInfo?.symptoms || "Demam";
  const confidencePercentage = Math.round(confidence * 100);

  // Determine result status
  const isPositive = prediction === "Parasitized";
  const resultStatus = isPositive ? "Positif" : "Negatif";
  const resultStatusEn = isPositive ? "Positive" : "Negative";

  // Create a prompt for the Gemini model based on language
  const prompt =
    language === "id"
      ? `
Buatkan laporan medis profesional untuk deteksi parasit malaria dengan format yang terstruktur seperti contoh berikut:

# Laporan Medis untuk Deteksi Parasit Malaria (Hasil ${resultStatus})

**Informasi Pasien:**
- **Nama:** ${patientName}
- **Usia:** ${patientAge} tahun
- **Jenis Kelamin:** ${patientGender}
- **Lokasi:** ${patientLocation}
- **Tanggal:** ${currentDate}

**Riwayat:**
- **Keluhan Utama:** ${patientSymptoms}

**Pemeriksaan:**
- **Tes Diagnostik:** Deteksi Parasit Malaria menggunakan AI (Analisis Mikroskopi Digital)
- **Hasil:** ${resultStatus} untuk parasit malaria
- **Tingkat Kepercayaan:** ${confidencePercentage}%

**Diagnosis:**
- ${isPositive ? "Infeksi malaria" : "Infeksi malaria tidak mungkin"}

Lanjutkan laporan dengan:
1. **Penilaian Klinis** yang komprehensif berdasarkan hasil ${resultStatus}
2. **Rencana Penatalaksanaan** yang detail dan sesuai dengan kondisi Indonesia
3. **Rekomendasi Tindak Lanjut** yang spesifik
4. **Langkah Pencegahan** yang relevan untuk Indonesia

Pastikan laporan menggunakan terminologi medis yang tepat, mengacu pada pedoman kesehatan Indonesia, dan memberikan rekomendasi yang praktis untuk kondisi di Indonesia.

**Dokter:** [Nama Dokter/Tanda Tangan]
[Nama Fasilitas Medis]
`
      : `
Generate a professional medical report for malaria parasite detection with the following structured format:

# Medical Report for Malaria Parasite Detection (${resultStatusEn} Result)

**Patient Information:**
- **Name:** ${patientName}
- **Age:** ${patientAge} years
- **Gender:** ${patientGender}
- **Location:** ${patientLocation}
- **Date:** ${currentDate}

**History:**
- **Chief Complaint:** ${patientSymptoms}

**Investigations:**
- **Diagnostic Test:** Malaria Parasite Detection using AI (Digital Microscopy Analysis)
- **Results:** ${resultStatusEn} for malaria parasites
- **Confidence Level:** ${confidencePercentage}%

**Diagnosis:**
- ${isPositive ? "Malaria infection" : "Malaria infection unlikely"}

Continue the report with:
1. **Clinical Assessment** that is comprehensive based on the ${resultStatusEn} result
2. **Management Plan** that is detailed and appropriate for Indonesian healthcare context
3. **Follow-Up Recommendations** that are specific
4. **Preventive Measures** that are relevant for Indonesia

Ensure the report uses proper medical terminology, references Indonesian health guidelines, and provides practical recommendations for conditions in Indonesia.

**Physician:** [Physician's Name/Signature]
[Medical Facility Name]
`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating medical report:", error);
    throw new Error(
      "Failed to generate medical report. Please try again later."
    );
  }
}
