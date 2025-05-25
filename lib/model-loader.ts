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

  // Preprocess the image to match the model's expected input [1,224,224,1]
  const tensor = tf.tidy(() => {
    // fromPixels dengan numChannels=1 akan langsung grayscale
    const img = tf.browser.fromPixels(imageElement, 1); // [h, w, 1]
    const resized = tf.image.resizeNearestNeighbor(img, [224, 224]); // [224, 224, 1]
    const normalized = resized.toFloat().div(tf.scalar(255)); // [224,224,1], range 0–1
    return normalized.expandDims(0); // [1,224,224,1]
  });

  // Run inference
  const output = (await model!.predict(tensor)) as tf.Tensor;
  const value = output.dataSync()[0];

  // Clean up
  tensor.dispose();
  output.dispose();

  // Return prediction (threshold at 0.5)
  return {
    prediction: value > 0.5 ? "Uninfected" : "Parasitized",
    confidence: value > 0.5 ? value : 1 - value,
  };
}
