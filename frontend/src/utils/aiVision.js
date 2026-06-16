let model = null;
let modelLoading = false;

const loadModel = async () => {
  if (model) return model;
  if (modelLoading) {
    await new Promise(r => setTimeout(r, 500));
    return model;
  }
  modelLoading = true;
  try {
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    modelLoading = false;
    return model;
  } catch (e) {
    modelLoading = false;
    throw new Error("AI model failed to load: " + e.message);
  }
};

const captureFrameFromVideo = (videoEl) => {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return { canvas, dataUrl: canvas.toDataURL("image/jpeg", 0.8) };
};

const LANDMARK_LABELS = [
  "fire hydrant", "stop sign", "bench", "chair", "bottle",
  "cup", "person", "car", "motorcycle", "bicycle",
  "potted plant", "backpack", "handbag", "suitcase", "umbrella"
];

const CAMPUS_LABELS = {
  "fire hydrant": "Fire Extinguisher",
  "stop sign": "Sign Board",
  "bench": "Bench",
  "chair": "Seat Area",
  "bottle": "Notice Board",
  "person": "Entry Point",
  "car": "Vehicle Bay",
  "motorcycle": "Two-Wheeler Zone",
  "bicycle": "Bicycle Stand",
  "potted plant": "Garden Area",
  "backpack": "Storage Area",
  "suitcase": "Storage Area",
  "umbrella": "Covered Area"
};

const generateHint = (predictions) => {
  if (!predictions || predictions.length === 0) {
    return "Near the parking entrance — remember your floor and spot number.";
  }
  const landmarks = predictions
    .filter(p => p.score > 0.3)
    .slice(0, 3)
    .map(p => CAMPUS_LABELS[p.class] || p.class);

  const unique = [...new Set(landmarks)];
  if (unique.length === 0) return "Near the parking entrance — remember your floor and spot number.";
  if (unique.length === 1) return `Your vehicle is parked near the ${unique[0]}.`;
  if (unique.length === 2) return `Your vehicle is parked near the ${unique[0]} and ${unique[1]}.`;
  return `Your vehicle is parked near the ${unique[0]}, ${unique[1]}, and ${unique[2]}.`;
};

const runAIDetection = async (videoEl) => {
  const m = await loadModel();
  const { canvas, dataUrl } = captureFrameFromVideo(videoEl);
  const predictions = await m.detect(canvas);
  const hint = generateHint(predictions);
  return { hint, imageDataUrl: dataUrl, predictions };
};

const storeAIContext = (spaceId, hint, imageDataUrl) => {
  const ctx = { spaceId, hint, imageDataUrl, savedAt: Date.now() };
  localStorage.setItem("trilens_ai_context", JSON.stringify(ctx));
};

const getAIContext = () => {
  try {
    const raw = localStorage.getItem("trilens_ai_context");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearAIContext = () => {
  localStorage.removeItem("trilens_ai_context");
};

export { loadModel, runAIDetection, storeAIContext, getAIContext, clearAIContext, generateHint };
