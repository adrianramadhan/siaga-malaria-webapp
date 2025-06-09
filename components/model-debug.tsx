"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, ImageIcon, Info, Palette } from "lucide-react";
import * as tf from "@tensorflow/tfjs";

interface ModelDebugProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  colorMode?: "rgb" | "grayscale";
}

export function ModelDebug({ imageRef, colorMode }: ModelDebugProps) {
  interface DebugInfo {
    originalImageSize?: { width: number; height: number };
    canvasSize?: { width: number; height: number };
    imageDataLength?: number;
    grayscaleDataLength?: number;
    processedDataLength?: number;
    tensorShape?: number[];
    tensorDtype?: string;
    sampleValues?: {
      first10: number[];
      min: number;
      max: number;
      mean: number;
    };
    error?: string;
    colorMode?: "rgb" | "grayscale";
    channelInfo?: unknown;
    memoryUsage?: {
      originalPixels: number;
      processedValues: number;
      tensorBytes: number;
    };
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

      let tensorData: Float32Array;
      let tensorShape: [number, number, number, number];
      let channelInfo: unknown;

      if (colorMode === "grayscale") {
        // Create grayscale array
        const grayscaleData = new Float32Array(224 * 224);

        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;
          grayscaleData[i / 4] = grayscale / 255.0;
        }

        tensorData = grayscaleData;
        tensorShape = [1, 224, 224, 1];
        channelInfo = {
          channels: 1,
          description: "Single grayscale channel",
          sampleValues: Array.from(grayscaleData.slice(0, 10)),
          min: Math.min(...grayscaleData),
          max: Math.max(...grayscaleData),
          mean: grayscaleData.reduce((a, b) => a + b, 0) / grayscaleData.length,
        };
      } else {
        // Create RGB array
        const rgbData = new Float32Array(224 * 224 * 3);

        for (let i = 0; i < data.length; i += 4) {
          const pixelIndex = i / 4;
          const red = data[i] / 255.0;
          const green = data[i + 1] / 255.0;
          const blue = data[i + 2] / 255.0;

          rgbData[pixelIndex * 3] = red;
          rgbData[pixelIndex * 3 + 1] = green;
          rgbData[pixelIndex * 3 + 2] = blue;
        }

        tensorData = rgbData;
        tensorShape = [1, 224, 224, 3];

        // Calculate stats for each channel
        const redChannel = [];
        const greenChannel = [];
        const blueChannel = [];

        for (let i = 0; i < rgbData.length; i += 3) {
          redChannel.push(rgbData[i]);
          greenChannel.push(rgbData[i + 1]);
          blueChannel.push(rgbData[i + 2]);
        }

        channelInfo = {
          channels: 3,
          description: "RGB color channels",
          sampleValues: {
            red: Array.from(redChannel.slice(0, 5)),
            green: Array.from(greenChannel.slice(0, 5)),
            blue: Array.from(blueChannel.slice(0, 5)),
          },
          stats: {
            red: {
              min: Math.min(...redChannel),
              max: Math.max(...redChannel),
              mean: redChannel.reduce((a, b) => a + b, 0) / redChannel.length,
            },
            green: {
              min: Math.min(...greenChannel),
              max: Math.max(...greenChannel),
              mean:
                greenChannel.reduce((a, b) => a + b, 0) / greenChannel.length,
            },
            blue: {
              min: Math.min(...blueChannel),
              max: Math.max(...blueChannel),
              mean: blueChannel.reduce((a, b) => a + b, 0) / blueChannel.length,
            },
          },
        };
      }
      // Create tensor
      const tensor = tf.tensor4d(tensorData, tensorShape);

      setDebugInfo({
        colorMode,
        originalImageSize: {
          width: imageRef.current.width,
          height: imageRef.current.height,
        },
        canvasSize: {
          width: canvas.width,
          height: canvas.height,
        },
        imageDataLength: data.length,
        processedDataLength: tensorData.length,
        tensorShape: tensor.shape,
        tensorDtype: tensor.dtype,
        channelInfo,
        memoryUsage: {
          originalPixels: data.length,
          processedValues: tensorData.length,
          tensorBytes: tensorData.length * 4, // 4 bytes per float32
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
          <Badge variant="outline" className="ml-2">
            {(colorMode ?? "rgb").toUpperCase()} Mode
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={runDebug}
          disabled={loading || !imageRef.current}
          className="mb-4"
        >
          {loading
            ? "Running Debug..."
            : `Debug Tensor Shape (${(colorMode ?? "rgb").toUpperCase()})`}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            {debugInfo.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Error: {debugInfo.error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Information */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image Information
                    </h4>
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
                        <span>Raw Data Length:</span>
                        <Badge variant="outline">
                          {(debugInfo.imageDataLength ?? 0).toLocaleString()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Processed Data Length:</span>
                        <Badge variant="outline">
                          {(
                            debugInfo.processedDataLength ?? 0
                          ).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tensor Information */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Tensor Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Tensor Shape:</span>
                        <Badge variant="default">
                          [
                          {debugInfo.tensorShape
                            ? debugInfo.tensorShape.join(", ")
                            : "N/A"}
                          ]
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Type:</span>
                        <Badge variant="outline">{debugInfo.tensorDtype}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Color Mode:</span>
                        <Badge
                          variant={
                            debugInfo.colorMode === "grayscale"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {(debugInfo.colorMode ?? "rgb").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Channels:</span>
                        <Badge variant="outline">
                          {debugInfo.channelInfo &&
                          typeof debugInfo.channelInfo === "object" &&
                          "channels" in debugInfo.channelInfo
                            ? (debugInfo.channelInfo as { channels: number })
                                .channels
                            : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Channel Information */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Channel Analysis (
                    {
                      (debugInfo.channelInfo as { description?: string })
                        ?.description
                    }
                    )
                  </h4>

                  {debugInfo.colorMode === "grayscale" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <h5 className="text-sm font-medium mb-2">
                          Grayscale Channel
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Min:</span>
                            <span>
                              {(
                                debugInfo.channelInfo as { min: number }
                              ).min.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max:</span>
                            <span>
                              {(
                                debugInfo.channelInfo as { max: number }
                              ).max.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mean:</span>
                            <span>
                              {(
                                debugInfo.channelInfo as { mean: number }
                              ).mean.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h5 className="text-sm font-medium mb-2">
                          Sample Values (First 10 pixels)
                        </h5>
                        <div className="p-3 bg-gray-50 rounded text-xs font-mono">
                          [
                          {(
                            debugInfo.channelInfo as { sampleValues: number[] }
                          ).sampleValues
                            .map((v: number) => v.toFixed(4))
                            .join(", ")}
                          ]
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Red Channel */}
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                          <h5 className="text-sm font-medium mb-2 text-red-800">
                            Red Channel
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Min:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { red: { min: number } };
                                  }
                                ).stats.red.min.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { red: { max: number } };
                                  }
                                ).stats.red.max.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mean:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { red: { mean: number } };
                                  }
                                ).stats.red.mean.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Green Channel */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <h5 className="text-sm font-medium mb-2 text-green-800">
                            Green Channel
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Min:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { green: { min: number } };
                                  }
                                ).stats.green.min.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { green: { max: number } };
                                  }
                                ).stats.green.max.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mean:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { green: { mean: number } };
                                  }
                                ).stats.green.mean.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Blue Channel */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <h5 className="text-sm font-medium mb-2 text-blue-800">
                            Blue Channel
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Min:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { blue: { min: number } };
                                  }
                                ).stats.blue.min.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { blue: { max: number } };
                                  }
                                ).stats.blue.max.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mean:</span>
                              <span>
                                {(
                                  debugInfo.channelInfo as {
                                    stats: { blue: { mean: number } };
                                  }
                                ).stats.blue.mean.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sample Values for RGB */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">
                          Sample Values (First 5 pixels per channel)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="p-2 bg-red-50 rounded text-xs">
                            <div className="font-medium text-red-800 mb-1">
                              Red:
                            </div>
                            <div className="font-mono">
                              [
                              {(
                                debugInfo.channelInfo as {
                                  sampleValues: { red: number[] };
                                }
                              ).sampleValues.red
                                .map((v: number) => v.toFixed(3))
                                .join(", ")}
                              ]
                            </div>
                          </div>
                          <div className="p-2 bg-green-50 rounded text-xs">
                            <div className="font-medium text-green-800 mb-1">
                              Green:
                            </div>
                            <div className="font-mono">
                              [
                              {(
                                debugInfo.channelInfo as {
                                  sampleValues: { green: number[] };
                                }
                              ).sampleValues.green
                                .map((v: number) => v.toFixed(3))
                                .join(", ")}
                              ]
                            </div>
                          </div>
                          <div className="p-2 bg-blue-50 rounded text-xs">
                            <div className="font-medium text-blue-800 mb-1">
                              Blue:
                            </div>
                            <div className="font-mono">
                              [
                              {(
                                debugInfo.channelInfo as {
                                  sampleValues: { blue: number[] };
                                }
                              ).sampleValues.blue
                                .map((v: number) => v.toFixed(3))
                                .join(", ")}
                              ]
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Memory Usage */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Memory Usage</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm font-medium">Original Pixels</div>
                      <div className="text-lg font-bold text-blue-600">
                        {debugInfo.memoryUsage?.originalPixels?.toLocaleString?.() ??
                          "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">RGBA values</div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="text-sm font-medium">
                        Processed Values
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {debugInfo.memoryUsage?.processedValues?.toLocaleString?.() ??
                          "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {debugInfo.colorMode === "grayscale"
                          ? "Grayscale"
                          : "RGB"}{" "}
                        values
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                      <div className="text-sm font-medium">Tensor Size</div>
                      <div className="text-lg font-bold text-purple-600">
                        {debugInfo.memoryUsage?.tensorBytes
                          ? (debugInfo.memoryUsage.tensorBytes / 1024).toFixed(
                              1
                            )
                          : "N/A"}{" "}
                        KB
                      </div>
                      <div className="text-xs text-gray-500">
                        Float32 tensor
                      </div>
                    </div>
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
              {debugInfo?.colorMode === "grayscale" ? (
                <>
                  <p>Shape: [batch_size, 224, 224, 1] (grayscale)</p>
                  <p>Data Type: float32</p>
                  <p>Value Range: 0.0 - 1.0 (normalized)</p>
                  <p>Channels: 1 (luminance)</p>
                </>
              ) : (
                <>
                  <p>Shape: [batch_size, 224, 224, 3] (RGB)</p>
                  <p>Data Type: float32</p>
                  <p>Value Range: 0.0 - 1.0 (normalized)</p>
                  <p>Channels: 3 (Red, Green, Blue)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
