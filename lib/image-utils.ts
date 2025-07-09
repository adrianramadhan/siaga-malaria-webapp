// Helper function to check if image is too large
function isImageTooLarge(width: number, height: number): boolean {
  const maxPixels = 2048 * 2048; // 4MP limit
  return width * height > maxPixels;
}

// Helper function to calculate optimal resize dimensions
function calculateOptimalSize(
  width: number,
  height: number,
  maxSize = 1024
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  const aspectRatio = width / height;
  if (width > height) {
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize,
    };
  }
}

export function convertToGrayscale(
  imageElement: HTMLImageElement
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Preprocess large images first
      let processedImage: HTMLImageElement;
      try {
        processedImage = await preprocessLargeImage(imageElement, 1024);
      } catch (preprocessError) {
        console.warn(
          "Preprocessing failed, using original image:",
          preprocessError
        );
        processedImage = imageElement;
      }

      // Ensure image is loaded
      if (!processedImage.complete || processedImage.naturalWidth === 0) {
        reject(new Error("Image not loaded properly"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Set canvas size to processed image size
      canvas.width = processedImage.naturalWidth || processedImage.width;
      canvas.height = processedImage.naturalHeight || processedImage.height;

      console.log(`Converting to grayscale: ${canvas.width}x${canvas.height}`);

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        // Draw the image
        ctx.drawImage(processedImage, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Check if we got valid image data
        if (data.length === 0) {
          reject(new Error("No image data retrieved"));
          return;
        }

        // Convert to grayscale using luminance formula
        // Process in chunks to avoid blocking the UI
        const chunkSize = 10000; // Process 10k pixels at a time
        let currentIndex = 0;

        const processChunk = () => {
          const endIndex = Math.min(currentIndex + chunkSize * 4, data.length);

          for (let i = currentIndex; i < endIndex; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];

            // Calculate grayscale value using luminance formula
            const grayscale = Math.round(
              0.299 * red + 0.587 * green + 0.114 * blue
            );

            data[i] = grayscale; // Red
            data[i + 1] = grayscale; // Green
            data[i + 2] = grayscale; // Blue
            // Alpha channel (data[i + 3]) remains unchanged
          }

          currentIndex = endIndex;

          if (currentIndex < data.length) {
            // Continue processing in next frame
            setTimeout(processChunk, 0);
          } else {
            // Processing complete
            try {
              ctx.putImageData(imageData, 0, 0);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

              if (dataUrl === "data:,") {
                reject(new Error("Failed to convert canvas to data URL"));
                return;
              }

              console.log("Grayscale conversion completed");
              resolve(dataUrl);
            } catch (finalError) {
              reject(
                new Error(
                  "Failed to finalize grayscale conversion: " +
                    (finalError instanceof Error ? finalError.message : String(finalError))
                )
              );
            }
          }
        };

        // Start processing
        processChunk();
      } catch (canvasError) {
        console.error("Canvas operation failed:", canvasError);
        reject(
          new Error(
            "Canvas operation failed: " +
              (canvasError instanceof Error ? canvasError.message : String(canvasError))
          )
        );
      }
    } catch (error) {
      console.error("Grayscale conversion error:", error);
      reject(error);
    }
  });
}

export function resizeImage(
  imageElement: HTMLImageElement,
  targetSize = 224
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Preprocess large images first
      let processedImage: HTMLImageElement;
      try {
        processedImage = await preprocessLargeImage(imageElement, 1024);
      } catch (preprocessError) {
        console.warn(
          "Preprocessing failed, using original image:",
          preprocessError
        );
        processedImage = imageElement;
      }

      // Ensure image is loaded
      if (!processedImage.complete || processedImage.naturalWidth === 0) {
        reject(new Error("Image not loaded properly"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = targetSize;
      canvas.height = targetSize;

      console.log(`Resizing to: ${targetSize}x${targetSize}`);

      // Clear canvas first
      ctx.clearRect(0, 0, targetSize, targetSize);

      try {
        // Draw the resized image
        ctx.drawImage(processedImage, 0, 0, targetSize, targetSize);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        // Validate the result
        if (dataUrl === "data:,") {
          reject(new Error("Failed to convert canvas to data URL"));
          return;
        }

        console.log("Image resize completed");
        resolve(dataUrl);
      } catch (canvasError) {
        console.error("Canvas resize operation failed:", canvasError);
        reject(
          new Error(
            "Canvas resize operation failed: " +
              (canvasError instanceof Error ? canvasError.message : String(canvasError))
          )
        );
      }
    } catch (error) {
      console.error("Image resize error:", error);
      reject(error);
    }
  });
}

export function convertToGrayscaleTensor(
  imageElement: HTMLImageElement
): Promise<Float32Array> {
  return new Promise(async (resolve, reject) => {
    try {
      // Preprocess large images first
      let processedImage: HTMLImageElement;
      try {
        processedImage = await preprocessLargeImage(imageElement, 512); // Smaller for tensor processing
      } catch (preprocessError) {
        console.warn(
          "Preprocessing failed, using original image:",
          preprocessError
        );
        processedImage = imageElement;
      }

      // Ensure image is loaded
      if (!processedImage.complete || processedImage.naturalWidth === 0) {
        reject(new Error("Image not loaded properly"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = 224;
      canvas.height = 224;

      // Clear canvas first
      ctx.clearRect(0, 0, 224, 224);

      try {
        // Draw and resize image
        ctx.drawImage(processedImage, 0, 0, 224, 224);

        // Get image data
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const data = imageData.data;

        // Check if we got valid image data
        if (data.length === 0) {
          reject(new Error("No image data retrieved"));
          return;
        }

        // Create grayscale array (single channel)
        const grayscaleData = new Float32Array(224 * 224);

        // Convert to grayscale and normalize
        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          // Calculate grayscale value using luminance formula
          const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;

          // Normalize to 0-1 range
          grayscaleData[i / 4] = grayscale / 255.0;
        }

        console.log("Tensor conversion completed");
        resolve(grayscaleData);
      } catch (canvasError) {
        console.error("Canvas tensor operation failed:", canvasError);
        reject(
          new Error(
            "Canvas tensor operation failed: " +
              (canvasError instanceof Error ? canvasError.message : String(canvasError))
          )
        );
      }
    } catch (error) {
      console.error("Grayscale tensor conversion error:", error);
      reject(error);
    }
  });
}

// Fixed ensureImageLoaded function - NO RECURSION
export function ensureImageLoaded(
  imageElement: HTMLImageElement
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // If image is already loaded and has valid dimensions
    if (
      imageElement.complete &&
      imageElement.naturalWidth > 0 &&
      imageElement.naturalHeight > 0
    ) {
      resolve(imageElement);
      return;
    }

    // Check if it's a placeholder image (these load immediately)
    if (imageElement.src.includes("/placeholder.svg")) {
      // For placeholder images, we can resolve immediately after a short delay
      setTimeout(() => {
        if (imageElement.naturalWidth > 0 || imageElement.width > 0) {
          resolve(imageElement);
        } else {
          // Create a fallback for placeholder images
          const canvas = document.createElement("canvas");
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#f3f4f6";
            ctx.fillRect(0, 0, 400, 400);
            ctx.fillStyle = "#6b7280";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Sample Image", 200, 200);
          }

          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.src = canvas.toDataURL();
        }
      }, 100);
      return;
    }

    // For large images, increase timeout
    const isLargeImage =
      imageElement.naturalWidth > 2048 || imageElement.naturalHeight > 2048;
    const timeoutDuration = isLargeImage ? 15000 : 5000; // 15s for large images, 5s for normal

    const timeout = setTimeout(() => {
      reject(new Error("Image loading timeout"));
    }, timeoutDuration);

    const cleanup = () => {
      clearTimeout(timeout);
      imageElement.onload = null;
      imageElement.onerror = null;
    };

    imageElement.onload = () => {
      cleanup();
      if (imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
        resolve(imageElement);
      } else {
        reject(new Error("Image loaded but has invalid dimensions"));
      }
    };

    imageElement.onerror = () => {
      cleanup();
      reject(new Error("Image failed to load"));
    };

    // If image src is not set, reject immediately
    if (!imageElement.src) {
      cleanup();
      reject(new Error("Image src not set"));
    }
  });
}

// Update createSafeImageElement to handle large images better
export function createSafeImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Don't set crossOrigin for data URLs or placeholder images
    if (!src.includes("/placeholder.svg") && !src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }

    const timeout = setTimeout(() => {
      reject(new Error("Image loading timeout"));
    }, 10000); // Increased timeout for large images

    const cleanup = () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      cleanup();
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error("Image loaded but has invalid dimensions"));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image"));
    };

    // Set src last to trigger loading
    img.src = src;
  });
}

// Pre-process large images before conversion
export function preprocessLargeImage(
  imageElement: HTMLImageElement,
  maxSize = 1024
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    try {
      const { naturalWidth, naturalHeight } = imageElement;

      // If image is not too large, return as is
      if (!isImageTooLarge(naturalWidth, naturalHeight)) {
        resolve(imageElement);
        return;
      }

      console.log(
        `Preprocessing large image: ${naturalWidth}x${naturalHeight}`
      );

      // Calculate optimal size
      const optimalSize = calculateOptimalSize(
        naturalWidth,
        naturalHeight,
        maxSize
      );

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context for preprocessing"));
        return;
      }

      canvas.width = optimalSize.width;
      canvas.height = optimalSize.height;

      // Clear canvas
      ctx.clearRect(0, 0, optimalSize.width, optimalSize.height);

      try {
        // Draw resized image
        ctx.drawImage(
          imageElement,
          0,
          0,
          optimalSize.width,
          optimalSize.height
        );

        // Create new image element with resized data
        const resizedImage = new Image();
        resizedImage.onload = () => {
          console.log(
            `Image preprocessed to: ${optimalSize.width}x${optimalSize.height}`
          );
          resolve(resizedImage);
        };
        resizedImage.onerror = () => {
          reject(new Error("Failed to create preprocessed image"));
        };
        resizedImage.src = canvas.toDataURL("image/jpeg", 0.9);
      } catch (canvasError) {
        console.error("Canvas preprocessing failed:", canvasError);
        reject(
          new Error(
            "Canvas preprocessing failed: " +
              (canvasError instanceof Error ? canvasError.message : String(canvasError))
          )
        );
      }
    } catch (error) {
      console.error("Image preprocessing error:", error);
      reject(error);
    }
  });
}
