"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, Info } from "lucide-react";
import * as tf from "@tensorflow/tfjs";

interface ModelDebugProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
}

export function ModelDebug({ imageRef }: ModelDebugProps) {
  interface DebugInfo {
    originalImageSize?: { width: number; height: number };
    canvasSize?: { width: number; height: number };
    imageDataLength?: number;
    grayscaleDataLength?: number;
    tensorShape?: number[];
    tensorDtype?: string;
    sampleValues?: {
      first10: number[];
      min: number;
      max: number;
      mean: number;
    };
    error?: string;
  }
  
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    if (!imageRef.current) return;

    setLoading(true);
    try {
      // Create canvas for preprocessing
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(imageRef.current, 0, 0, 224, 224);

      // Get image data
      const imageData = ctx.getImageData(0, 0, 224, 224);
      const data = imageData.data;

      // Create grayscale array
      const grayscaleData = new Float32Array(224 * 224);

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;
        grayscaleData[i / 4] = grayscale / 255.0;
      }

      // Create tensor
      const tensor = tf.tensor4d(grayscaleData, [1, 224, 224, 1]);

      setDebugInfo({
        originalImageSize: {
          width: imageRef.current.width,
          height: imageRef.current.height,
        },
        canvasSize: {
          width: canvas.width,
          height: canvas.height,
        },
        imageDataLength: data.length,
        grayscaleDataLength: grayscaleData.length,
        tensorShape: tensor.shape,
        tensorDtype: tensor.dtype,
        sampleValues: {
          first10: Array.from(grayscaleData.slice(0, 10)),
          min: Math.min(...grayscaleData),
          max: Math.max(...grayscaleData),
          mean: grayscaleData.reduce((a, b) => a + b, 0) / grayscaleData.length,
        },
      });

      tensor.dispose();
    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Model Debug Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={runDebug}
          disabled={loading || !imageRef.current}
          className="mb-4"
        >
          {loading ? "Running Debug..." : "Debug Tensor Shape"}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            {debugInfo.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Error: {debugInfo.error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Image Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Original Size:</span>
                        <Badge variant="outline">
                          {debugInfo.originalImageSize?.width}x
                          {debugInfo.originalImageSize?.height}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Canvas Size:</span>
                        <Badge variant="outline">
                          {debugInfo.canvasSize?.width}x
                          {debugInfo.canvasSize?.height}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Image Data Length:</span>
                        <Badge variant="outline">
                          {debugInfo.imageDataLength}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Grayscale Data Length:</span>
                        <Badge variant="outline">
                          {debugInfo.grayscaleDataLength}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Tensor Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Tensor Shape:</span>
                        <Badge variant="default">
                          [{debugInfo.tensorShape?.join(", ") ?? "N/A"}]
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Type:</span>
                        <Badge variant="outline">{debugInfo.tensorDtype}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Value:</span>
                        <Badge variant="outline">
                          {debugInfo.sampleValues?.min?.toFixed(4) ?? "N/A"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Value:</span>
                        <Badge variant="outline">
                          {debugInfo.sampleValues?.max?.toFixed(4) ?? "N/A"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Mean Value:</span>
                        <Badge variant="outline">
                          {debugInfo.sampleValues?.mean?.toFixed(4) ?? "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">
                    Sample Values (First 10 pixels)
                  </h4>
                  <div className="p-3 bg-gray-50 rounded text-xs font-mono">
                    [
                    {debugInfo.sampleValues?.first10
                      ?.map((v: number) => v.toFixed(4))
                      .join(", ")}
                    ]
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Expected Model Input:</p>
              <p>Shape: [batch_size, 224, 224, 1] (grayscale)</p>
              <p>Data Type: float32</p>
              <p>Value Range: 0.0 - 1.0 (normalized)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
