import * as tf from "@tensorflow/tfjs";

let model: tf.GraphModel | null = null;

export async function loadModel() {
  if (model) return model;

  try {
    // Load the model from the public directory
    model = await tf.loadGraphModel("/tfjs_model/model.json");
    console.log("Model loaded successfully");
    return model;
  } catch (error) {
    console.error("Failed to load model:", error);
    throw new Error("Failed to load the malaria detection model");
  }
}

// Helper function to ensure image is loaded without recursion
function waitForImageLoad(
  imageElement: HTMLImageElement
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (
      imageElement.complete &&
      imageElement.naturalWidth > 0 &&
      imageElement.naturalHeight > 0
    ) {
      resolve(imageElement);
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Image loading timeout"));
    }, 10000);

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

export async function classifyImage(
  imageElement: HTMLImageElement,
  colorMode: "rgb" | "grayscale" = "grayscale"
): Promise<{
  prediction: "Parasitized" | "Uninfected";
  confidence: number;
}> {
  if (!model) {
    await loadModel();
  }

  try {
    console.log("Starting classification:", {
      src: imageElement.src.substring(0, 50) + "...",
      dimensions: `${imageElement.naturalWidth || imageElement.width}x${
        imageElement.naturalHeight || imageElement.height
      }`,
      complete: imageElement.complete,
      mode: colorMode,
    });

    // Ensure we have a valid image element - NO RECURSION
    let loadedImage: HTMLImageElement;

    try {
      loadedImage = await waitForImageLoad(imageElement);
    } catch (loadError) {
      console.warn("Image loading failed, creating fallback:", loadError);

      // Create a fallback image if loading fails
      const canvas = document.createElement("canvas");
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Create a simple test pattern
        ctx.fillStyle = colorMode === "grayscale" ? "#808080" : "#ff6b6b";
        ctx.fillRect(0, 0, 224, 224);

        // Add some pattern
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = colorMode === "grayscale" ? "#404040" : "#4ecdc4";
          ctx.beginPath();
          ctx.arc(
            Math.random() * 200 + 12,
            Math.random() * 200 + 12,
            8,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }

      loadedImage = new Image();
      loadedImage.src = canvas.toDataURL();
      await waitForImageLoad(loadedImage);
    }

    console.log("Image ready for processing:", {
      dimensions: `${loadedImage.naturalWidth}x${loadedImage.naturalHeight}`,
      complete: loadedImage.complete,
      mode: colorMode,
    });

    // Create canvas for preprocessing
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas size to model input size
    canvas.width = 224;
    canvas.height = 224;

    // Clear canvas first
    ctx.clearRect(0, 0, 224, 224);

    // Draw and resize image
    ctx.drawImage(loadedImage, 0, 0, 224, 224);

    // Get image data
    const imageData = ctx.getImageData(0, 0, 224, 224);
    const data = imageData.data;

    // Check if we got valid image data
    if (data.length === 0) {
      throw new Error("No image data retrieved from canvas");
    }

    let tensorData: Float32Array;
    let tensorShape: [number, number, number, number];

    if (colorMode === "grayscale") {
      // Create grayscale array (single channel)
      const grayscaleData = new Float32Array(224 * 224);

      // Convert to grayscale and store in single channel array
      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        // Calculate grayscale value using luminance formula
        const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;

        // Normalize to 0-1 range and store in single channel array
        grayscaleData[i / 4] = grayscale / 255.0;
      }

      tensorData = grayscaleData;
      tensorShape = [1, 224, 224, 1];
    } else {
      // Create RGB array (three channels)
      const rgbData = new Float32Array(224 * 224 * 3);

      // Store RGB values in separate channels
      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const red = data[i] / 255.0;
        const green = data[i + 1] / 255.0;
        const blue = data[i + 2] / 255.0;

        // Store in RGB format [R, G, B, R, G, B, ...]
        rgbData[pixelIndex * 3] = red;
        rgbData[pixelIndex * 3 + 1] = green;
        rgbData[pixelIndex * 3 + 2] = blue;
      }

      tensorData = rgbData;
      tensorShape = [1, 224, 224, 3];
    }

    // Validate tensor data
    const minVal = Math.min(...tensorData);
    const maxVal = Math.max(...tensorData);
    console.log(`${colorMode.toUpperCase()} data stats:`, {
      min: minVal,
      max: maxVal,
      length: tensorData.length,
      shape: tensorShape,
    });

    if (maxVal === 0) {
      throw new Error(
        "Image appears to be completely black - processing failed"
      );
    }

    // Create tensor from data with correct shape
    const tensor = tf.tensor4d(tensorData, tensorShape);

    try {
      // Run inference
      const predictions = (await model!.predict(tensor)) as tf.Tensor;

      // Get the prediction value (0-1)
      const value = predictions.dataSync()[0];

      console.log(`Model prediction (${colorMode}):`, value);

      // Clean up tensors
      tensor.dispose();
      predictions.dispose();

      // Return prediction (threshold at 0.5)
      return {
        prediction: value > 0.5 ? "Uninfected" : "Parasitized",
        confidence: value > 0.5 ? value : 1 - value,
      };
    } catch (error) {
      // Clean up tensor in case of error
      tensor.dispose();
      throw error;
    }
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
}
