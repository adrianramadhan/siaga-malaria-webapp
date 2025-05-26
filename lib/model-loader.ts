import * as tf from "@tensorflow/tfjs";
import { ensureImageLoaded } from "./image-utils";

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

export async function classifyImage(imageElement: HTMLImageElement): Promise<{
  prediction: "Parasitized" | "Uninfected";
  confidence: number;
}> {
  if (!model) {
    await loadModel();
  }

  try {
    // Ensure we have a valid image element
    const loadedImage = await ensureImageLoaded(imageElement);

    console.log("Classifying image:", {
      dimensions: `${loadedImage.naturalWidth}x${loadedImage.naturalHeight}`,
      complete: loadedImage.complete,
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

    // Get image data and convert to grayscale
    const imageData = ctx.getImageData(0, 0, 224, 224);
    const data = imageData.data;

    // Check if we got valid image data
    if (data.length === 0) {
      throw new Error("No image data retrieved from canvas");
    }

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

    // Validate grayscale data
    const minVal = Math.min(...grayscaleData);
    const maxVal = Math.max(...grayscaleData);
    console.log("Grayscale data stats:", {
      min: minVal,
      max: maxVal,
      length: grayscaleData.length,
    });

    if (maxVal === 0) {
      throw new Error(
        "Image appears to be completely black - processing failed"
      );
    }

    // Create tensor from grayscale data with correct shape [1, 224, 224, 1]
    const tensor = tf.tensor4d(grayscaleData, [1, 224, 224, 1]);

    try {
      // Run inference
      const predictions = (await model!.predict(tensor)) as tf.Tensor;

      // Get the prediction value (0-1)
      const value = predictions.dataSync()[0];

      console.log("Model prediction:", value);

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
