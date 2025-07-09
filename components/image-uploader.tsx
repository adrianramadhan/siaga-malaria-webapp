"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadModel, classifyImage } from "@/lib/model-loader";
import Image from "next/image";
import { MedicalReport } from "@/components/medical-report";
import { ImagePreview } from "@/components/image-preview";
import { ModelDebug } from "@/components/model-debug";
import { SampleImages } from "@/components/sample-images";
import { createSafeImageElement } from "@/lib/image-utils";

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
  const [imageSource, setImageSource] = useState<"upload" | "sample">("upload");
  const [processingStep, setProcessingStep] = useState<string>("");
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
    setImageSource("upload");

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
      const imageUrl = event.target?.result as string;
      setSelectedImage(imageUrl);
      setShowPreview(true);

      // Update imageRef for uploaded images
      if (imageRef.current) {
        imageRef.current.src = imageUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = async (
    imageUrl: string,
    sampleColorMode: "rgb" | "grayscale"
  ) => {
    try {
      // Reset previous prediction and preview
      setPrediction(null);
      setError(null);
      setImageSource("sample");
      setProcessingStep("Creating sample image...");

      console.log("Sample selected:", { imageUrl, sampleColorMode });

      // For sample images, create a proper realistic blood smear image
      const sampleImageData = await createRealisticSampleImage(
        imageUrl,
        sampleColorMode
      );

      // Set the image and color mode based on sample
      setSelectedImage(sampleImageData);
      setColorMode(sampleColorMode);
      setShowPreview(true);

      // Update imageRef with the sample image data
      if (imageRef.current) {
        imageRef.current.src = sampleImageData;
      }

      setProcessingStep("");
      console.log("Sample image created successfully");
    } catch (error) {
      console.error("Error creating sample image:", error);
      setError("Failed to create sample image. Please try again.");
      setProcessingStep("");
    }
  };

  // Create realistic blood smear sample images
  const createRealisticSampleImage = async (
    placeholderUrl: string,
    mode: "rgb" | "grayscale"
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = 512;
      canvas.height = 512;

      // Determine sample type from URL
      const isParasitized = placeholderUrl.includes("Parasitized");
      const isGrayscale = mode === "grayscale";

      // Background
      if (isGrayscale) {
        ctx.fillStyle = "#f8f8f8";
      } else {
        ctx.fillStyle = "#fef9f9";
      }
      ctx.fillRect(0, 0, 512, 512);

      // Create realistic blood cell pattern
      const numCells = 80 + Math.floor(Math.random() * 40); // 80-120 cells

      for (let i = 0; i < numCells; i++) {
        const x = Math.random() * 480 + 16;
        const y = Math.random() * 480 + 16;
        const radius = 12 + Math.random() * 8; // 12-20 pixel radius

        // Red blood cell
        if (isGrayscale) {
          // Grayscale RBC
          ctx.fillStyle = "#c0c0c0";
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();

          // RBC center (donut effect)
          ctx.fillStyle = "#e0e0e0";
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
          ctx.fill();

          // RBC border
          ctx.strokeStyle = "#a0a0a0";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          // RGB RBC
          ctx.fillStyle = "#ff6b6b";
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();

          // RBC center (donut effect)
          ctx.fillStyle = "#ffb3b3";
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
          ctx.fill();

          // RBC border
          ctx.strokeStyle = "#e55555";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // Add parasites for infected samples
      if (isParasitized) {
        const numParasites = 15 + Math.floor(Math.random() * 10); // 15-25 parasites

        for (let i = 0; i < numParasites; i++) {
          const x = Math.random() * 460 + 26;
          const y = Math.random() * 460 + 26;
          const size = 3 + Math.random() * 4; // 3-7 pixel size

          // Parasite (dark spot)
          if (isGrayscale) {
            ctx.fillStyle = "#404040";
          } else {
            ctx.fillStyle = "#2d1b69";
          }

          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fill();

          // Add some irregular shape to parasites
          ctx.fillStyle = isGrayscale ? "#606060" : "#4c3d8a";
          ctx.beginPath();
          ctx.arc(x + 1, y + 1, size * 0.6, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Add some white blood cells (larger, different color)
      const numWBC = 3 + Math.floor(Math.random() * 3); // 3-6 WBCs
      for (let i = 0; i < numWBC; i++) {
        const x = Math.random() * 440 + 36;
        const y = Math.random() * 440 + 36;
        const radius = 20 + Math.random() * 8; // 20-28 pixel radius

        if (isGrayscale) {
          ctx.fillStyle = "#909090";
        } else {
          ctx.fillStyle = "#9b59b6";
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // WBC nucleus
        if (isGrayscale) {
          ctx.fillStyle = "#606060";
        } else {
          ctx.fillStyle = "#6a4c93";
        }

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Add sample label
      ctx.fillStyle = isGrayscale ? "#333333" : "#2c3e50";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        `${isParasitized ? "Parasitized" : "Uninfected"} Sample`,
        256,
        30
      );
      ctx.font = "12px Arial";
      ctx.fillText(`(${mode.toUpperCase()} Mode)`, 256, 50);

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    });
  };

  const handlePrediction = async () => {
    if (!selectedImage || !modelLoaded) return;

    try {
      setIsLoading(true);
      setError(null);
      setProcessingStep("Preparing image for analysis...");

      console.log("Starting prediction:", {
        imageSource,
        colorMode,
        hasImageRef: !!imageRef.current,
        selectedImage: selectedImage.substring(0, 50) + "...",
      });

      // Always create a new image element for consistent processing
      setProcessingStep("Loading image for analysis...");
      const imageElement: HTMLImageElement = await createSafeImageElement(
        selectedImage
      );

      console.log("Image element created:", {
        width: imageElement.naturalWidth,
        height: imageElement.naturalHeight,
        complete: imageElement.complete,
        source: imageSource,
      });

      setProcessingStep("Running AI analysis...");
      console.log("Image ready for classification:", {
        dimensions: `${imageElement.naturalWidth}x${imageElement.naturalHeight}`,
        complete: imageElement.complete,
        mode: colorMode,
        source: imageSource,
      });

      // Classify the image with selected color mode
      const result = await classifyImage(imageElement, colorMode);

      console.log("Classification result:", result);
      setPrediction(result);
      setProcessingStep("");
    } catch (err: unknown) {
      console.error("Prediction error:", err);
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        if (err.message === "Ref timeout") {
          setError(
            "Image loading timeout. Please try uploading the image again."
          );
        } else {
          setError(`Analysis failed: ${err.message}. Please try again.`);
        }
      } else {
        setError("Analysis failed due to an unknown error. Please try again.");
      }
      setProcessingStep("");
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
    setImageSource("upload");
    setProcessingStep("");
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
          Upload a blood smear image or try our samples to detect malaria
          parasites
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Selection Tabs */}
      <Tabs
        value={imageSource}
        onValueChange={(value) => setImageSource(value as "upload" | "sample")}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Image
          </TabsTrigger>
          <TabsTrigger value="sample" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Try Samples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                {!selectedImage || imageSource !== "upload" ? (
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
                  <div className="w-full text-center">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">
                        ✅ Image uploaded successfully!
                      </p>
                      <p className="text-green-600 text-sm">
                        Your image is ready for analysis
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sample">
          <SampleImages onSelectSample={handleSampleSelect} />
        </TabsContent>
      </Tabs>

      {/* Image Processing Section */}
      {selectedImage && (
        <Card className="mb-6">
          <CardContent className="p-6">
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
                {/* Image Source Info */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {imageSource === "upload" ? (
                      <Upload className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">
                      {imageSource === "upload"
                        ? "Uploaded Image"
                        : "Sample Image"}
                    </span>
                    {processingStep && (
                      <span className="text-xs text-blue-600 ml-2">
                        ({processingStep})
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    {imageSource === "upload"
                      ? "Upload New"
                      : "Try Different Sample"}
                  </Button>
                </div>

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
                      disabled={imageSource === "sample"} // Disable if using sample (mode is pre-selected)
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-red-400 via-green-400 to-blue-400 rounded mb-2"></div>
                      <span className="font-medium">RGB Color</span>
                      <span className="text-xs text-gray-500 mt-1">
                        Original colors
                      </span>
                    </Button>
                    <Button
                      variant={
                        colorMode === "grayscale" ? "default" : "outline"
                      }
                      onClick={() => setColorMode("grayscale")}
                      className="flex flex-col items-center p-4 h-auto"
                      disabled={imageSource === "sample"} // Disable if using sample (mode is pre-selected)
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
                      {imageSource === "sample"
                        ? `🔒 Sample image mode is pre-configured for optimal results (${colorMode.toUpperCase()})`
                        : colorMode === "rgb"
                        ? "🎨 RGB mode preserves original colors but may have lower detection accuracy."
                        : "⚫ Grayscale mode enhances parasite detection by improving contrast between infected and healthy cells."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
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
                        {processingStep || "Processing..."}
                      </>
                    ) : (
                      <>Analyze Image ({colorMode.toUpperCase()})</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            console.log(`Image processed to ${colorMode}`);
          }}
        />
      )}

      {/* Prediction Results */}
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
                {imageSource === "sample" && (
                  <p className="text-xs mt-2 text-blue-600 font-medium">
                    📊 This result is from a sample image for demonstration
                    purposes
                  </p>
                )}
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
