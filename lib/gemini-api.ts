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
Buatkan laporan medis profesional untuk deteksi parasit malaria dengan format yang terstruktur dan rapi seperti contoh berikut:

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

## 1. Penilaian Klinis

Berdasarkan hasil pemeriksaan deteksi parasit malaria dengan AI yang menunjukkan hasil ${resultStatus}, pasien didiagnosis ${
          isPositive ? "terinfeksi malaria" : "tidak terinfeksi malaria"
        }. 

Buatlah penilaian klinis yang komprehensif dengan:
- Evaluasi kondisi pasien berdasarkan hasil ${resultStatus}
- Pemeriksaan fisik yang diperlukan
- Pemeriksaan penunjang yang direkomendasikan
- Tanda-tanda yang perlu diperhatikan

## 2. Rencana Penatalaksanaan

Buatlah rencana penatalaksanaan yang detail meliputi:
- Terapi anti-malaria sesuai pedoman Indonesia
- Terapi simtomatik
- Edukasi pasien dan keluarga
- Monitoring yang diperlukan

## 3. Rekomendasi Tindak Lanjut

Berikan rekomendasi tindak lanjut yang spesifik:
- Jadwal evaluasi lanjutan
- Pemantauan efek samping obat
- Konseling pasca-pengobatan
- Kapan harus kembali ke dokter

## 4. Langkah Pencegahan

Berikan langkah pencegahan yang relevan untuk Indonesia:
- Penggunaan kelambu berinsektisida
- Penggunaan repelan nyamuk
- Pembersihan lingkungan
- Edukasi kesehatan masyarakat

PENTING: 
- Gunakan format markdown yang konsisten
- Berikan jarak yang tepat antar paragraf
- Gunakan bullet points untuk daftar
- JANGAN sertakan bagian tanda tangan dokter atau nama fasilitas medis di akhir laporan
- Pastikan setiap bagian terpisah dengan jelas
- Gunakan sub-heading yang jelas untuk setiap bagian
`
      : `
Generate a professional medical report for malaria parasite detection with the following structured and well-formatted layout:

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

## 1. Clinical Assessment

Based on the AI malaria parasite detection results showing ${resultStatusEn}, the patient is diagnosed as ${
          isPositive ? "infected with malaria" : "not infected with malaria"
        }.

Provide comprehensive clinical assessment including:
- Patient condition evaluation based on ${resultStatusEn} result
- Required physical examination
- Recommended laboratory investigations
- Warning signs to monitor

## 2. Management Plan

Create detailed management plan covering:
- Anti-malarial therapy according to Indonesian guidelines
- Symptomatic treatment
- Patient and family education
- Required monitoring

## 3. Follow-Up Recommendations

Provide specific follow-up recommendations:
- Follow-up evaluation schedule
- Drug side effect monitoring
- Post-treatment counseling
- When to return to healthcare provider

## 4. Preventive Measures

Provide preventive measures relevant for Indonesia:
- Use of insecticide-treated nets
- Mosquito repellent application
- Environmental management
- Community health education

IMPORTANT:
- Use consistent markdown formatting
- Provide proper spacing between paragraphs
- Use bullet points for lists
- DO NOT include any physician signature or medical facility name at the end of the report
- Ensure each section is clearly separated
- Use clear sub-headings for each section
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
