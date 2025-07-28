"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import Image from "next/image";

interface SampleImage {
  id: string;
  name: string;
  description: string;
  type: "parasitized" | "uninfected";
  mode: "rgb" | "grayscale";
  expectedResult: string;
  filename: string;
  imagePath: string;
}

export function SampleImages() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Sample images menggunakan gambar yang sudah ada di public/image
  const sampleImages: SampleImage[] = [
    {
      id: "parasitized-rgb",
      name: "Parasitized Blood Smear (RGB)",
      description: "Blood smear with malaria parasites - RGB color mode",
      type: "parasitized",
      mode: "rgb",
      expectedResult: "Positive for malaria parasites",
      filename: "malaria_parasitized_rgb_sample.jpg",
      imagePath: "/image/parasitized-rgb.jpg",
    },
    {
      id: "parasitized-grayscale",
      name: "Parasitized Blood Smear (Grayscale)",
      description: "Blood smear with malaria parasites - Grayscale enhanced",
      type: "parasitized",
      mode: "grayscale",
      expectedResult: "Positive for malaria parasites",
      filename: "malaria_parasitized_grayscale_sample.jpg",
      imagePath: "/image/parasitized.jpg",
    },
    {
      id: "uninfected-rgb",
      name: "Uninfected Blood Smear (RGB)",
      description: "Healthy blood smear without parasites - RGB color mode",
      type: "uninfected",
      mode: "rgb",
      expectedResult: "Negative for malaria parasites",
      filename: "malaria_uninfected_rgb_sample.jpg",
      imagePath: "/image/uninfected-rgb.jpg",
    },
    {
      id: "uninfected-grayscale",
      name: "Uninfected Blood Smear (Grayscale)",
      description: "Healthy blood smear without parasites - Grayscale enhanced",
      type: "uninfected",
      mode: "grayscale",
      expectedResult: "Negative for malaria parasites",
      filename: "malaria_uninfected_grayscale_sample.jpg",
      imagePath: "/image/uninfected.jpg",
    },
  ];

  const handleDownloadSample = async (sample: SampleImage) => {
    try {
      setDownloadingId(sample.id);

      // Fetch the image from public folder
      const response = await fetch(sample.imagePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Convert to blob
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = sample.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log(`Downloaded sample: ${sample.filename}`);
    } catch (error) {
      console.error("Error downloading sample:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Failed to download sample: ${errorMessage}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Sample Images / Unduh Gambar Contoh
        </CardTitle>
        <p className="text-sm text-gray-600">
          Download realistic blood smear sample images to test the malaria
          detection system / Unduh gambar contoh untuk menguji sistem deteksi
          malaria
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleImages.map((sample) => (
            <div
              key={sample.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-all"
            >
              {/* Image Preview */}
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={sample.imagePath || "/placeholder.svg"}
                  alt={sample.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  onError={(e) => {
                    console.error(`Failed to load image: ${sample.imagePath}`);
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.src =
                      "/placeholder.svg?height=300&width=300&text=Sample+Image";
                  }}
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge
                    variant={
                      sample.type === "parasitized" ? "destructive" : "default"
                    }
                    className="text-xs"
                  >
                    {sample.type === "parasitized" ? "Infected" : "Healthy"}
                  </Badge>
                  <Badge
                    variant={sample.mode === "rgb" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {sample.mode.toUpperCase()}
                  </Badge>
                </div>
                {downloadingId === sample.id && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-blue-500 text-white p-2 rounded-full">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Info */}
              <div className="p-3">
                <h3 className="font-medium text-sm mb-1">{sample.name}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {sample.description}
                </p>

                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Expected Result:</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    {sample.expectedResult}
                  </p>
                  <p className="text-xs text-blue-600">📁 {sample.filename}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs bg-transparent"
                  disabled={downloadingId === sample.id}
                  onClick={() => handleDownloadSample(sample)}
                >
                  {downloadingId === sample.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border border-gray-600 border-t-transparent mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-2" />
                      Download Sample
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            How to Use Sample Images / Cara Menggunakan Gambar Contoh
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              1. Click &quot;Download Sample&quot; on any image above to save it to your
              computer
            </p>
            <p>2. Go to the &quot;Upload Image&quot; tab</p>
            <p>3. Upload the downloaded sample image from your computer</p>
            <p>4. Select the appropriate analysis mode (RGB or Grayscale)</p>
            <p>5. Click &quot;Analyze Image&quot; to see the AI detection results</p>
            <p className="text-xs mt-2 text-blue-600">
              💡 Tip: Each sample is designed to demonstrate different aspects
              of malaria detection!
            </p>
          </div>
        </div>

        {/* Sample Types Explanation */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-1">
              🦠 Parasitized Samples
            </h4>
            <p className="text-xs text-red-700">
              Blood smears containing malaria parasites. These samples should be
              detected as &quot;Positive&quot; by the AI model. The parasites appear as
              dark spots within red blood cells.
            </p>
            <div className="mt-2 text-xs text-red-600">
              <p>• Contains malaria parasites</p>
              <p>• Dark spots in red blood cells</p>
              <p>• Expected: Positive result</p>
            </div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-1">
              ✅ Uninfected Samples
            </h4>
            <p className="text-xs text-green-700">
              Healthy blood smears without parasites. These samples should be
              detected as &quot;Negative&quot; by the AI model. Only normal red blood
              cells are visible.
            </p>
            <div className="mt-2 text-xs text-green-600">
              <p>• No parasites present</p>
              <p>• Normal red blood cells only</p>
              <p>• Expected: Negative result</p>
            </div>
          </div>
        </div>

        {/* File Information */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            📋 Sample Files Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <p>
                <strong>Source:</strong> Real blood smear images
              </p>
              <p>
                <strong>Format:</strong> JPEG (High Quality)
              </p>
              <p>
                <strong>Usage:</strong> Testing and demonstration
              </p>
            </div>
            <div>
              <p>
                <strong>Types:</strong> Parasitized & Uninfected
              </p>
              <p>
                <strong>Modes:</strong> RGB Color & Grayscale
              </p>
              <p>
                <strong>Quality:</strong> Medical grade samples
              </p>
            </div>
          </div>
        </div>

        {/* Download All Button */}
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={async () => {
              // Download all samples sequentially
              for (const sample of sampleImages) {
                await handleDownloadSample(sample);
                // Small delay between downloads
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }}
            disabled={downloadingId !== null}
            className="px-6"
          >
            {downloadingId ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border border-gray-600 border-t-transparent mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download All Samples
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Download all 4 sample images at once
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
