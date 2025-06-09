"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadModel, classifyImage } from "@/lib/model-loader";
import Image from "next/image";
import { MedicalReport } from "@/components/medical-report";
import { ImagePreview } from "@/components/image-preview";
import { ModelDebug } from "@/components/model-debug";
import { waitForRef } from "@/lib/ref-utils";

export function ImageUploader() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{
    prediction: "Parasitized" | "Uninfected";
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [colorMode, setColorMode] = useState<"rgb" | "grayscale">("grayscale");

  // Load the model on component mount
  useEffect(() => {
    const initModel = async () => {
      try {
        setIsLoading(true);
        await loadModel();
        setModelLoaded(true);
        setError(null);
      } catch {
        setError(
          "Failed to load the malaria detection model. Please try refreshing the page."
        );
      } finally {
        setIsLoading(false);
      }
    };

    initModel();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous prediction and preview
    setPrediction(null);
    setError(null);
    setShowPreview(false);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    // Read and display the image
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePrediction = async () => {
    if (!selectedImage || !modelLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      // Wait for the image ref to be ready
      const imageElement = await waitForRef(imageRef, 5000);

      // Wait for the image to be fully loaded
      if (!imageElement.complete) {
        await new Promise((resolve) => {
          imageElement.onload = resolve;
        });
      }

      // Classify the image
      const result = await classifyImage(imageElement);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction error:", err);
      function hasMessageProperty(
        error: unknown
      ): error is { message: string } {
        return (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        );
      }

      if (hasMessageProperty(err) && err.message === "Ref timeout") {
        setError(
          "Image loading timeout. Please try uploading the image again."
        );
      } else {
        setError(
          "An error occurred during image classification. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPrediction(null);
    setError(null);
    setShowPreview(false);
    setShowDebug(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Malaria Detection Tool
        </h2>
        <p className="text-gray-600">
          Upload a blood smear image to detect the presence of malaria parasites
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            {!selectedImage ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-gray-400 text-sm">
                  PNG, JPG or JPEG (max 5MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div className="w-full">
                {/* Hidden image for processing */}
                <Image
                  src={selectedImage || "/placeholder.svg"}
                  alt="Blood smear sample"
                  width={224}
                  height={224}
                  className="hidden"
                  ref={imageRef}
                  crossOrigin="anonymous"
                  onLoad={() => console.log("Image loaded successfully")}
                  onError={(e) => console.error("Image load error:", e)}
                />

                <div className="flex flex-col gap-4 mb-6">
                  {/* Color Mode Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-sm font-medium mb-3">
                      Analysis Mode / Mode Analisis
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={colorMode === "rgb" ? "default" : "outline"}
                        onClick={() => setColorMode("rgb")}
                        className="flex flex-col items-center p-4 h-auto"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-red-400 via-green-400 to-blue-400 rounded mb-2"></div>
                        <span className="font-medium">RGB Color</span>
                        <span className="text-xs text-gray-500 mt-1">
                          Original Color
                        </span>
                      </Button>
                      <Button
                        variant={
                          colorMode === "grayscale" ? "default" : "outline"
                        }
                        onClick={() => setColorMode("grayscale")}
                        className="flex flex-col items-center p-4 h-auto"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-600 rounded mb-2"></div>
                        <span className="font-medium">Grayscale</span>
                        <span className="text-xs text-gray-500 mt-1">
                          Enhanced detection
                        </span>
                      </Button>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-blue-700">
                        {colorMode === "rgb"
                          ? "🎨 RGB mode preserves original colors but may have lower detection accuracy."
                          : "⚫ Grayscale mode enhances parasite detection by improving contrast between infected and healthy cells."}
                      </p>
                    </div>
                  </div>
                  {/* Action Button */}
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      Upload New Image
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDebug(!showDebug)}
                      disabled={isLoading}
                      size="sm"
                    >
                      {showDebug ? "Hide Debug" : "Show Debug"}
                    </Button>
                    <Button
                      onClick={handlePrediction}
                      disabled={isLoading || !modelLoaded}
                      className="px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Analyze Image ({colorMode.toUpperCase()})</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Component */}
      {showDebug && selectedImage && (
        <ModelDebug imageRef={imageRef} colorMode={colorMode} />
      )}

      {/* Image Preview */}
      {showPreview && selectedImage && (
        <ImagePreview
          originalImage={selectedImage}
          imageRef={imageRef}
          colorMode={colorMode}
          onImageProcessed={() => {
            console.log(`Image processed to ${colorMode} mode`);
          }}
        />
      )}

      {prediction && (
        <Card
          className={`mb-6 ${
            prediction.prediction === "Parasitized"
              ? "border-red-500 bg-red-50"
              : "border-green-500 bg-green-50"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {prediction.prediction === "Parasitized" ? (
                <AlertCircle className="h-10 w-10 text-red-500" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              )}
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {prediction.prediction === "Parasitized"
                    ? "Malaria Parasites Detected"
                    : "No Malaria Parasites Detected"}
                </h3>
                <p className="text-sm">
                  Accuracy: {Math.round(prediction.confidence * 100)}%
                </p>
                <p className="text-sm mt-2 text-gray-600">
                  {prediction.prediction === "Parasitized"
                    ? "This sample shows signs of malaria infection. Please consult a healthcare professional for confirmation."
                    : "This sample appears to be free of malaria parasites. Regular testing is still recommended."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {prediction && (
        <MedicalReport
          prediction={prediction.prediction}
          confidence={prediction.confidence}
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Important Note</h3>
        <p className="text-sm text-blue-700">
          This tool is designed to assist in the early detection of malaria, but
          it should not replace professional medical diagnosis. Always consult
          healthcare professionals for definitive diagnosis and treatment.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6" id="about">
        <h2 className="text-xl font-bold mb-4">
          About Siaga Malaria Nusantara Nusantara
        </h2>
        <p className="mb-4">
          Malaria remains a serious health issue in Indonesia, especially in
          remote and endemic areas. Indonesia is one of the malaria-endemic
          countries in Southeast Asia, contributing approximately 15.6% of
          regional cases.
        </p>
        <p className="mb-4">
          Conventional malaria diagnosis relies on laboratory microscopic
          examination by experts, a procedure that requires special equipment
          and is time-consuming. This creates a service gap as hospitals and
          clinics in remote areas often lack microscopic laboratory facilities,
          making it difficult to screen patients at risk early.
        </p>
        <p>
          The Siaga Malaria Nusantara project aims to provide a quick and
          accurate diagnostic aid tool to support medical personnel without
          replacing them. This system is expected to detect patients earlier,
          minimize complications, and accelerate treatment/clinical decisions.
        </p>
      </div>
    </div>
  );
}
