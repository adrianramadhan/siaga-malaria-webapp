import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client
// Note: In production, you should use environment variables for the API key
let genAI: GoogleGenAI | null = null;

export function initGeminiAPI(apiKey: string) {
  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

export async function generateMedicalReport(
  prediction: "Parasitized" | "Uninfected",
  confidence: number,
  patientInfo?: {
    age?: number;
    gender?: string;
    symptoms?: string;
    location?: string;
  }
) {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Call initGeminiAPI first.");
  }

  // Format patient information for the prompt
  const patientDetails = patientInfo
    ? `
Patient Information:
- Age: ${patientInfo.age || "Not provided"}
- Gender: ${patientInfo.gender || "Not provided"}
- Reported Symptoms: ${patientInfo.symptoms || "Not provided"}
- Location: ${patientInfo.location || "Not provided"}`
    : "No additional patient information provided.";

  // Create a prompt for the Gemini model
  const prompt = `
Generate a concise medical report for a patient tested for malaria in Indonesia.

Test Results:
- Diagnosis: ${
    prediction === "Parasitized"
      ? "Malaria parasites detected"
      : "No malaria parasites detected"
  }
- Confidence: ${Math.round(confidence * 100)}%

${patientDetails}

Please provide:
1. A clinical assessment based on the test results
2. Recommended next steps or treatment options
3. Follow-up recommendations
4. Preventive measures

Format the report professionally as if written by a medical professional. Keep it concise but comprehensive.
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
