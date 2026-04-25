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
        
        # Convert to numpy array and preprocess
        pixels_array = np.array(request.pixels, dtype=np.float32)
        
        # Validate pixel values (should be 0-255)
        if np.any(pixels_array < 0) or np.any(pixels_array > 255):
            raise HTTPException(status_code=400, detail="Pixel values must be between 0 and 255")
        
        # Normalize and reshape for CNN
        img_normalized = pixels_array / 255.0
        img_reshaped = img_normalized.reshape(1, 28, 28, 1)
        
        # Make prediction
        prediction_probs = model.predict(img_reshaped, verbose=0)[0]
        predicted_digit = int(np.argmax(prediction_probs))
        confidence = float(np.max(prediction_probs))
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        logger.info(f"Prediction: {predicted_digit} with confidence: {confidence:.3f} (took {processing_time:.2f}ms)")
        
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
            "predict": "/predict (POST)",
            "docs": "/docs"
        },
        "model_status": "loaded" if model is not None else "not_loaded"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
