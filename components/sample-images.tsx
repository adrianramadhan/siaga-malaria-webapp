"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, CheckCircle } from "lucide-react";
import Image from "next/image";

interface SampleImage {
  id: string;
  name: string;
  description: string;
  type: "parasitized" | "uninfected";
  mode: "rgb" | "grayscale";
  url: string;
  expectedResult: string;
}

interface SampleImagesProps {
  onSelectSample: (imageUrl: string, colorMode: "rgb" | "grayscale") => void;
}

export function SampleImages({ onSelectSample }: SampleImagesProps) {
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  // Sample images untuk testing
  const sampleImages: SampleImage[] = [
    {
      id: "parasitized-rgb",
      name: "Parasitized Blood Smear (RGB)",
      description: "Blood smear with malaria parasites - RGB color mode",
      type: "parasitized",
      mode: "rgb",
      url: "/image/parasitized-rgb.jpg",
      expectedResult: "Positive for malaria parasites",
    },
    {
      id: "parasitized-grayscale",
      name: "Parasitized Blood Smear (Grayscale)",
      description: "Blood smear with malaria parasites - Grayscale enhanced",
      type: "parasitized",
      mode: "grayscale",
      url: "/image/parasitized.jpg",
      expectedResult: "Positive for malaria parasites",
    },
    {
      id: "uninfected-rgb",
      name: "Uninfected Blood Smear (RGB)",
      description: "Healthy blood smear without parasites - RGB color mode",
      type: "uninfected",
      mode: "rgb",
      url: "/image/uninfected-rgb.jpg",
      expectedResult: "Negative for malaria parasites",
    },
    {
      id: "uninfected-grayscale",
      name: "Uninfected Blood Smear (Grayscale)",
      description: "Healthy blood smear without parasites - Grayscale enhanced",
      type: "uninfected",
      mode: "grayscale",
      url: "/image/uninfected.jpg",
      expectedResult: "Negative for malaria parasites",
    },
  ];

  const handleSelectSample = async (sample: SampleImage) => {
    try {
      setLoadingSample(sample.id);
      setSelectedSample(sample.id);

      console.log("Selecting sample:", sample.id, sample.mode);

      // Call the parent handler
      await onSelectSample(sample.url, sample.mode);

      console.log("Sample selection completed");
    } catch (error) {
      console.error("Error selecting sample:", error);
      setSelectedSample(null);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Sample Images / Gambar Contoh
        </CardTitle>
        <p className="text-sm text-gray-600">
          Try our sample blood smear images to test the malaria detection system
          / Coba gambar contoh untuk menguji sistem deteksi malaria
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleImages.map((sample) => (
            <div
              key={sample.id}
              className={`border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                selectedSample === sample.id
                  ? "ring-2 ring-green-500 bg-green-50"
                  : "hover:border-gray-300"
              }`}
              onClick={() => handleSelectSample(sample)}
            >
              {/* Image Preview */}
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={sample.url || "/placeholder.svg"}
                  alt={sample.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  onLoad={() =>
                    console.log(`Sample image loaded: ${sample.id}`)
                  }
                  onError={(e) =>
                    console.warn(`Sample image error: ${sample.id}`, e)
                  }
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
                {selectedSample === sample.id && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-green-500 text-white p-2 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                )}
                {loadingSample === sample.id && (
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

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Expected Result:</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    {sample.expectedResult}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={selectedSample === sample.id ? "default" : "outline"}
                  className="w-full mt-3 text-xs"
                  disabled={loadingSample === sample.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSample(sample);
                  }}
                >
                  {loadingSample === sample.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2"></div>
                      Loading...
                    </>
                  ) : selectedSample === sample.id ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-2" />
                      Selected
                    </>
                  ) : (
                    "Use This Sample"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            How to Use Sample Images / Cara Menggunakan
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. Click on any sample image above to select it</p>
            <p>
              2. The image will be automatically loaded and processed for
              analysis
            </p>
            <p>
              3. The color mode (RGB or Grayscale) is pre-configured for each
              sample
            </p>
            <p>4. Click &quot;Analyze Image&quot; to see the AI detection results</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
