"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadModel, classifyImage } from "@/lib/model-loader";
import Image from "next/image";

export function ImageUploader() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{
    prediction: "Parasitized" | "Uninfected";
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load the model on component mount
  useEffect(() => {
    const initModel = async () => {
      try {
        setIsLoading(true);
        await loadModel();
        setModelLoaded(true);
        setError(null);
      } catch (err) {
        console.error("Model loading error:", err);
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

    // Reset previous prediction
    setPrediction(null);
    setError(null);

    // Read and display the image
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePrediction = async () => {
    if (!selectedImage || !imageRef.current || !modelLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      // Wait for the image to be fully loaded
      if (!imageRef.current.complete) {
        await new Promise((resolve) => {
          if (imageRef.current) {
            imageRef.current.onload = resolve;
          }
        });
      }

      // Classify the image
      const result = await classifyImage(imageRef.current);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(
        "An error occurred during image classification. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPrediction(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
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
                <div className="relative w-full max-w-md mx-auto aspect-square mb-4">
                  <Image
                    src={selectedImage || "/placeholder.svg"}
                    alt="Blood smear sample"
                    fill
                    className="object-contain rounded-lg"
                    ref={imageRef as React.RefObject<HTMLImageElement>}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>

                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    Upload New Image
                  </Button>
                  <Button
                    onClick={handlePrediction}
                    disabled={isLoading || !modelLoaded}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Analyze Image"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  Confidence: {Math.round(prediction.confidence * 100)}%
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
          About Siaga Malaria Nusantara
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
