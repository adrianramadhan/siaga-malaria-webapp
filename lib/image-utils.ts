export function convertToGrayscale(
  imageElement: HTMLImageElement
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure image is loaded
      if (!imageElement.complete || imageElement.naturalWidth === 0) {
        reject(new Error("Image not loaded properly"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Set canvas size to image size
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        // Draw the original image
        ctx.drawImage(imageElement, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Check if we got valid image data
        if (data.length === 0) {
          reject(new Error("No image data retrieved"));
          return;
        }

        // Convert to grayscale using luminance formula
        for (let i = 0; i < data.length; i += 4) {
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

        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        // Validate the result
        if (dataUrl === "data:,") {
          reject(new Error("Failed to convert canvas to data URL"));
          return;
        }

        resolve(dataUrl);
      } catch (canvasError) {
        console.error("Canvas operation failed:", canvasError);
        const errorMessage =
          typeof canvasError === "object" && canvasError !== null && "message" in canvasError
            ? (canvasError as { message: string }).message
            : String(canvasError);
        reject(new Error("Canvas operation failed: " + errorMessage));
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
  return new Promise((resolve, reject) => {
    try {
      // Ensure image is loaded
      if (!imageElement.complete || imageElement.naturalWidth === 0) {
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

      // Clear canvas first
      ctx.clearRect(0, 0, targetSize, targetSize);

      try {
        // Draw the resized image
        ctx.drawImage(imageElement, 0, 0, targetSize, targetSize);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        // Validate the result
        if (dataUrl === "data:,") {
          reject(new Error("Failed to convert canvas to data URL"));
          return;
        }

        resolve(dataUrl);
      } catch (canvasError) {
        console.error("Canvas resize operation failed:", canvasError);
        const errorMessage =
          typeof canvasError === "object" && canvasError !== null && "message" in canvasError
            ? (canvasError as { message: string }).message
            : String(canvasError);
        reject(
          new Error("Canvas resize operation failed: " + errorMessage)
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
  return new Promise((resolve, reject) => {
    try {
      // Ensure image is loaded
      if (!imageElement.complete || imageElement.naturalWidth === 0) {
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
        ctx.drawImage(imageElement, 0, 0, 224, 224);

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

        resolve(grayscaleData);
      } catch (canvasError) {
        console.error("Canvas tensor operation failed:", canvasError);
        const errorMessage =
          typeof canvasError === "object" && canvasError !== null && "message" in canvasError
            ? (canvasError as { message: string }).message
            : String(canvasError);
        reject(
          new Error("Canvas tensor operation failed: " + errorMessage)
        );
      }
    } catch (error) {
      console.error("Grayscale tensor conversion error:", error);
      reject(error);
    }
  });
}

// Helper function to ensure image is properly loaded
export function ensureImageLoaded(
  imageElement: HTMLImageElement
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imageElement.complete && imageElement.naturalWidth > 0) {
      resolve(imageElement);
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error("Image loading timeout"));
    }, 10000); // 10 second timeout

    imageElement.onload = () => {
      clearTimeout(timeout);
      if (imageElement.naturalWidth > 0) {
        resolve(imageElement);
      } else {
        reject(new Error("Image loaded but has no dimensions"));
      }
    };

    imageElement.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Image failed to load"));
    };

    // If image src is not set, reject immediately
    if (!imageElement.src) {
      clearTimeout(timeout);
      reject(new Error("Image src not set"));
    }
  });
}

// Helper function to create a safe image element
export function createSafeImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Set crossOrigin to handle CORS issues
    img.crossOrigin = "anonymous";

    const timeout = setTimeout(() => {
      reject(new Error("Image loading timeout"));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error("Image loaded but has invalid dimensions"));
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load image"));
    };

    // Set src last to trigger loading
    img.src = src;
  });
}
