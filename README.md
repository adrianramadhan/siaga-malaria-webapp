# Siaga Malaria Nusantara Web App

A Next.js application for rapid, AI-powered malaria screening and automated medical reporting.

## Features

- **Image Upload & Classification**  
  Upload blood-smear images and run on-device inference with a TensorFlow.js CNN model (grayscale 224×224×1).
- **Automated Medical Report**  
  Generate a concise clinical report (assessment, treatment recommendations, follow-up, preventive measures) via Google GenAI **gemini-2.0-flash**.
- **Global Layout**  
  Reusable **Header** and **Footer**, plus standalone **About** and **Contact** pages.
- **Zero-Config Dev**  
  Live reload, built-in CSS support, and image optimization with Next.js.

## Tech Stack

- **Framework**: Next.js 15.3.2 (App Router + Turbopack)
- **ML Inference**: TensorFlow.js (`@tensorflow/tfjs`)
- **GenAI**: Google GenAI Client (`@google/genai`)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

1. **Clone & Install**

   ```
   git clone https://github.com/adrianramadhan/siaga-malaria-webapp.git
   cd siaga-malaria-webapp
   npm install
   ```

2. **Environment Variables**

   ```
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key
   ```

3. **Run Dev Server**
   ```
   npm run dev
   ```

## Screenshots & Mockups

### System Screenshots

- Upload Section
  ![alt text](/public/image/upload.png)
- Preview Section
  ![alt text](/public/image/preview.png)
- Classification Section
  ![alt text](/public/image/classification.png)
- Report Section
  ![alt text](/public/image/report.png)
  ![alt text](/public/image/result.png)
### Figma Mockups
https://www.figma.com/proto/5KlgRPbByHH9zA90iWofbc/MockUp?node-id=1-2&t=t0SpaRn3M4uaCiFs-1