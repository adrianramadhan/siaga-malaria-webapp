import * as tf from "@tensorflow/tfjs";

let model: tf.GraphModel | null = null;

export async function loadModel() {
  if (model) return model;

  try {
    // Load the model from the public directory
    model = await tf.loadGraphModel("/tfjs_model/model.json");
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

  // Preprocess the image to match the model's expected input
  const tensor = tf.browser
    .fromPixels(imageElement)
    .resizeNearestNeighbor([224, 224]) // Resize to model input size
    .toFloat()
    .expandDims(0); // Add batch dimension

  // Run inference
  const predictions = (await model!.predict(tensor)) as tf.Tensor;

  // Get the prediction value (0-1)
  const value = predictions.dataSync()[0];

  // Clean up tensors
  tensor.dispose();
  predictions.dispose();

  // Return prediction (threshold at 0.5)
  return {
    prediction: value > 0.5 ? "Uninfected" : "Parasitized",
    confidence: value > 0.5 ? value : 1 - value,
  };
}
