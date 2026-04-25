from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import tensorflow as tf
import logging
import time
from typing import List
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MNIST Digit Classification Service",
    description="FastAPI service for MNIST digit classification using trained CNN model",
    version="1.0.0"
)

class PredictionRequest(BaseModel):
    pixels: List[float] = Field(..., min_items=784, max_items=784, description="Flattened 28x28 image pixels (784 values)")

class PredictionResponse(BaseModel):
    prediction: int = Field(..., ge=0, le=9, description="Predicted digit (0-9)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence score")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    service: str

# Global model variable
model = None

@app.on_event("startup")
async def load_model():
    """Load the trained CNN model on startup"""
    global model
    try:
        logger.info("Loading CNN model...")
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(BASE_DIR, 'mnist_cnn_model.h5')
        model = tf.keras.models.load_model(model_path)
        logger.info("✅ CNN model loaded successfully")
        logger.info(f"Model expects input shape: {model.input_shape}")
        logger.info(f"Model output shape: {model.output_shape}")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        model = None

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None,
        service="mnist-classification-api"
    )

@app.get("/test-mnist")
async def test_with_mnist_sample():
    """
    Test the model with real MNIST samples from Keras dataset.
    This confirms if the model works correctly with proper data.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        logger.info("[TEST] Loading MNIST test dataset...")
        (_, _), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
        
        # Get first 5 test samples
        results = []
        for idx in range(5):
            # Normalize and reshape
            img = x_test[idx].astype(np.float32) / 255.0
            img_reshaped = img.reshape(1, 28, 28, 1)
            true_label = int(y_test[idx])
            
            logger.info(f"[TEST-{idx}] True label: {true_label}")
            logger.info(f"[TEST-{idx}] Tensor shape: {img_reshaped.shape}, Min: {np.min(img_reshaped):.4f}, Max: {np.max(img_reshaped):.4f}, Mean: {np.mean(img_reshaped):.4f}")
            
            # Predict
            probs = model.predict(img_reshaped, verbose=0)[0]
            pred = int(np.argmax(probs))
            conf = float(np.max(probs))
            
            logger.info(f"[TEST-{idx}] Prediction: {pred}, Confidence: {conf:.4f}")
            logger.info(f"[TEST-{idx}] All probabilities: {[f'{p:.4f}' for p in probs]}")
            
            results.append({
                "index": idx,
                "true_label": true_label,
                "predicted": pred,
                "confidence": conf,
                "match": true_label == pred
            })
        
        return {
            "message": "MNIST test completed",
            "results": results,
            "model_status": "working" if any(r["match"] for r in results) else "potential_issue"
        }
    
    except Exception as e:
        logger.error(f"[TEST] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")


@app.post("/predict", response_model=PredictionResponse)
async def predict_digit(request: PredictionRequest):
    """
    Predict digit from flattened pixel array
    
    - **pixels**: Flattened 28x28 image (784 pixel values between 0-255)
    - **Returns**: Predicted digit, confidence, and processing time
    """
    if model is None:
        logger.error("Model not loaded")
        raise HTTPException(status_code=500, detail="Model not loaded - service unavailable")
    
    start_time = time.time()
    
    try:
        # Validate input length
        if len(request.pixels) != 784:
            raise HTTPException(status_code=400, detail="Expected exactly 784 pixel values")
        
        # Convert to 2D image
        image = np.array(request.pixels, dtype=np.float32).reshape(28, 28)

        # ---------- STEP 1: CROP DIGIT ----------
        threshold = 0.1 if np.max(image) <= 1 else 20

        rows = np.any(image > threshold, axis=1)
        cols = np.any(image > threshold, axis=0)

        if not rows.any() or not cols.any():
            raise HTTPException(status_code=400, detail="Empty drawing")

        y_min, y_max = np.where(rows)[0][[0, -1]]
        x_min, x_max = np.where(cols)[0][[0, -1]]

        digit = image[y_min:y_max+1, x_min:x_max+1]

        # ---------- STEP 2: RESIZE ----------
        digit = tf.image.resize(digit[..., np.newaxis], (20, 20)).numpy().squeeze(axis=-1)

        # ---------- STEP 3: PAD TO 28x28 ----------
        padded = np.zeros((28, 28), dtype=np.float32)

        start_x = (28 - 20) // 2
        start_y = (28 - 20) // 2

        padded[start_y:start_y+20, start_x:start_x+20] = digit

        # ---------- STEP 4: NORMALIZE ----------
        if np.max(padded) > 1:
            padded = padded / 255.0

        # ---------- STEP 5: FINAL SHAPE ----------
        img_reshaped = padded.reshape(1, 28, 28, 1)
        
        # Log tensor statistics
        logger.info(f"[TENSOR] Shape: {img_reshaped.shape}, Min: {np.min(img_reshaped):.4f}, Max: {np.max(img_reshaped):.4f}, Mean: {np.mean(img_reshaped):.4f}")


        # Make prediction
        prediction_probs = model.predict(img_reshaped, verbose=0)[0]
        predicted_digit = int(np.argmax(prediction_probs))
        confidence = float(np.max(prediction_probs))
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        logger.info(f"Prediction: {predicted_digit} with confidence: {confidence:.3f} (took {processing_time:.2f}ms)")
        logger.info(f"[PROBS] All probabilities: {[f'{p:.4f}' for p in prediction_probs]}")
        
        return PredictionResponse(
            prediction=predicted_digit,
            confidence=confidence,
            processing_time_ms=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "MNIST Digit Classification API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "test-mnist": "/test-mnist (GET) - Test with real MNIST samples",
            "predict": "/predict (POST)",
            "docs": "/docs"
        },
        "model_status": "loaded" if model is not None else "not_loaded"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)