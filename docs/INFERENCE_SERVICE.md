# INFERENCE_SERVICE.md - Python FastAPI Inference Service

## Service Overview

The **Python FastAPI Inference Service** is Layer 2 of the system architecture. It's a high-performance REST API that loads the trained CNN model and serves digit classification predictions in real-time.

## Quick Start

### Prerequisites
- Python 3.9+
- Virtual environment (recommended)
- pip package manager

### Installation & Setup

```bash
# Navigate to service directory
cd python-inference-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service
python main.py
```

Service will be available at: `http://localhost:8000`

## Service Architecture

### Application Structure
```
python-inference-service/
├── main.py                          # FastAPI application
├── requirements.txt                 # Python dependencies
├── test_main.py                     # Service tests
├── mnist_cnn_model.h5              # Trained CNN model
├── Dockerfile                       # Docker configuration
└── .env                            # Environment variables (optional)
```

### Key Components

#### 1. **FastAPI Application**
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import tensorflow as tf

app = FastAPI(
    title="MNIST Digit Classification Service",
    description="FastAPI service for MNIST digit classification",
    version="1.0.0"
)
```

#### 2. **Request Model (Pydantic)**
```python
class PredictionRequest(BaseModel):
    pixels: List[float] = Field(
        ...,
        min_items=784,
        max_items=784,
        description="Flattened 28x28 image pixels (normalized 0-255)"
    )
```

#### 3. **Response Model**
```python
class PredictionResponse(BaseModel):
    prediction: int = Field(..., ge=0, le=9, description="Predicted digit 0-9")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    processing_time_ms: float = Field(..., description="Model inference time in ms")
```

#### 4. **Health Check Model**
```python
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    service: str
    timestamp: str
```

## API Endpoints

### 1. **POST /predict** - Classify Digit

**Description**: Classify a handwritten digit from pixel data.

**Request**:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pixels": [0, 0, 0, ..., 255, 128, ..., 0]  # 784 values
  }'
```

**Request Body**:
```json
{
  "pixels": [0.0, 0.0, 0.0, ..., 1.0, 0.5, ..., 0.0]
}
```

**Response** (Success - 200):
```json
{
  "prediction": 5,
  "confidence": 0.98,
  "processing_time_ms": 45.2
}
```

**Response** (Validation Error - 422):
```json
{
  "detail": [
    {
      "loc": ["body", "pixels"],
      "msg": "ensure this value has at least 784 items",
      "type": "value_error.list.min_items"
    }
  ]
}
```

**Response** (Server Error - 500):
```json
{
  "detail": "Error loading model or making prediction"
}
```

### 2. **GET /health** - Service Health Check

**Description**: Check if the service and model are ready.

**Request**:
```bash
curl http://localhost:8000/health
```

**Response** (Healthy - 200):
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "MNIST Digit Classification Service",
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

**Response** (Unhealthy - 503):
```json
{
  "status": "unhealthy",
  "model_loaded": false,
  "service": "MNIST Digit Classification Service",
  "error": "Model failed to load on startup"
}
```

### 3. **GET /docs** - Interactive API Documentation

**Description**: OpenAPI/Swagger UI for API exploration.

**URL**: `http://localhost:8000/docs`

**Features**:
- Interactive endpoint testing
- Request/response examples
- Model schema documentation
- Auto-generated from code docstrings

### 4. **GET /redoc** - ReDoc Alternative Documentation

**URL**: `http://localhost:8000/redoc`

## Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.104.1 | Web framework |
| uvicorn | 0.24.0 | ASGI server |
| tensorflow | 2.15.0 | ML model framework |
| numpy | 1.24.3 | Numerical computing |
| pydantic | 2.5.0 | Data validation |
| python-multipart | 0.0.6 | Form data parsing |

### Installation from requirements.txt
```bash
pip install -r requirements.txt
```

### requirements.txt Contents
```
fastapi==0.104.1
uvicorn==0.24.0
tensorflow==2.15.0
numpy==1.24.3
pydantic==2.5.0
python-multipart==0.0.6
```

## Configuration

### Environment Variables

Create a `.env` file in the service directory:

```
# Model Configuration
MODEL_PATH=./mnist_cnn_model.h5

# Service Configuration
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8000

# Logging
LOG_LEVEL=INFO

# Performance
MAX_WORKERS=4
```

### Load Environment Variables
```python
from dotenv import load_dotenv
import os

load_dotenv()
MODEL_PATH = os.getenv('MODEL_PATH', './mnist_cnn_model.h5')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
```

## Model Loading & Lifecycle

### Startup Event
```python
@app.on_event("startup")
async def load_model():
    global model
    try:
        logger.info("Loading CNN model...")
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(BASE_DIR, 'mnist_cnn_model.h5')
        
        model = tf.keras.models.load_model(model_path)
        
        logger.info("✅ Model loaded successfully")
        logger.info(f"Input shape: {model.input_shape}")
        logger.info(f"Output shape: {model.output_shape}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        model = None
```

### Shutdown Event
```python
@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down FastAPI service...")
    # Cleanup resources
```

## Prediction Pipeline

### Step-by-Step Process

```python
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest) -> PredictionResponse:
    """
    Classify a handwritten digit from pixel data.
    
    Args:
        request: PredictionRequest with 784 pixel values
        
    Returns:
        PredictionResponse with prediction, confidence, and processing time
    """
    
    start_time = time.time()
    
    try:
        # Step 1: Validate model is loaded
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Service starting..."
            )
        
        # Step 2: Convert to numpy array
        pixels = np.array(request.pixels, dtype=np.float32)
        
        # Step 3: Validate range
        if np.any(pixels < 0) or np.any(pixels > 255):
            raise ValueError("Pixel values must be between 0 and 255")
        
        # Step 4: Normalize pixels to 0-1
        pixels = pixels / 255.0
        
        # Step 5: Reshape to (1, 28, 28, 1)
        image = pixels.reshape(1, 28, 28, 1)
        
        # Step 6: Model inference
        logger.debug("Running model inference...")
        predictions = model.predict(image, verbose=0)
        
        # Step 7: Extract prediction & confidence
        prediction = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]))
        
        # Step 8: Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.info(
            f"Prediction: {prediction}, "
            f"Confidence: {confidence:.2%}, "
            f"Time: {processing_time_ms:.2f}ms"
        )
        
        return PredictionResponse(
            prediction=prediction,
            confidence=confidence,
            processing_time_ms=processing_time_ms
        )
        
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error during prediction"
        )
```

## Logging & Monitoring

### Logger Configuration
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

### Log Levels
- **DEBUG**: Detailed internal information
- **INFO**: General informational messages
- **WARNING**: Warning messages for potentially harmful situations
- **ERROR**: Error messages for serious issues
- **CRITICAL**: Critical errors requiring immediate attention

### Sample Logs
```
2025-04-25 10:15:30 - main - INFO - Loading CNN model...
2025-04-25 10:15:35 - main - INFO - ✅ CNN model loaded successfully
2025-04-25 10:15:35 - main - INFO - Model expects input shape: (None, 28, 28, 1)
2025-04-25 10:15:35 - main - INFO - Model output shape: (None, 10)
2025-04-25 10:15:40 - main - INFO - Received prediction request
2025-04-25 10:15:40 - main - INFO - Prediction: 5, Confidence: 0.98, Time: 45.23ms
```

## Error Handling

### Input Validation Errors
```python
# When pixels array is wrong size
{
  "detail": [
    {
      "loc": ["body", "pixels"],
      "msg": "ensure this value has exactly 784 items",
      "type": "value_error.list.min_items"
    }
  ]
}
```

### Model Errors
```python
if model is None:
    raise HTTPException(
        status_code=503,
        detail="Model not loaded. Service starting..."
    )
```

### Processing Errors
```python
try:
    predictions = model.predict(image)
except Exception as e:
    logger.error(f"Model prediction failed: {e}")
    raise HTTPException(
        status_code=500,
        detail="Error during prediction"
    )
```

## Testing

### Unit Tests

**File**: `test_main.py`

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_predict_valid():
    """Test prediction with valid input"""
    pixels = [0.0] * 784
    response = client.post(
        "/predict",
        json={"pixels": pixels}
    )
    assert response.status_code == 200
    assert "prediction" in response.json()
    assert "confidence" in response.json()

def test_predict_invalid_size():
    """Test prediction with wrong pixel count"""
    pixels = [0.0] * 100  # Wrong size
    response = client.post(
        "/predict",
        json={"pixels": pixels}
    )
    assert response.status_code == 422  # Validation error

def test_predict_invalid_range():
    """Test prediction with out-of-range values"""
    pixels = [256.0] * 784  # Out of range
    response = client.post(
        "/predict",
        json={"pixels": pixels}
    )
    assert response.status_code == 400  # Bad request
```

### Running Tests
```bash
# Install pytest
pip install pytest

# Run tests
pytest test_main.py -v

# Run with coverage
pytest test_main.py --cov=main --cov-report=html
```

## Performance Optimization

### 1. **Model Caching**
- Model loaded once at startup
- Reused for all predictions
- No memory leaks (model reference management)

### 2. **Batch Predictions** (Optional Enhancement)
```python
@app.post("/batch-predict")
async def batch_predict(request: BatchPredictionRequest):
    """Predict multiple digits in one request"""
    # Vectorized prediction for efficiency
    images = np.array(request.images).reshape(-1, 28, 28, 1)
    predictions = model.predict(images)
    return [format_response(pred) for pred in predictions]
```

### 3. **Async Processing**
```python
@app.post("/predict")
async def predict(request: PredictionRequest):
    # FastAPI handles async naturally
    # Can add thread pool for CPU-bound operations if needed
    pass
```

### 4. **Response Caching** (Future)
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_predict(pixels_tuple):
    """Cache predictions for identical inputs"""
    pass
```

## Deployment

### Local Development
```bash
python main.py
# or with reload on changes:
uvicorn main:app --reload
```

### Production with Uvicorn
```bash
uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info
```

### Docker Container
```bash
# Build image
docker build -t mnist-python-service .

# Run container
docker run -p 8000:8000 \
  -e MODEL_PATH=/app/mnist_cnn_model.h5 \
  mnist-python-service
```

### Docker Compose
```bash
# Start service with other services
docker-compose up python-service
```

## Monitoring & Observability

### Health Check Integration
```python
# For load balancers/orchestration
@app.get("/health")
async def health():
    return {
        "status": "healthy" if model else "unhealthy",
        "model_loaded": model is not None
    }
```

### Metrics (Prometheus Format - Optional)
```python
from prometheus_client import Counter, Histogram

prediction_counter = Counter(
    'predictions_total',
    'Total number of predictions'
)

prediction_duration = Histogram(
    'prediction_duration_seconds',
    'Prediction processing time'
)

@prediction_duration.time()
async def predict(request: PredictionRequest):
    prediction_counter.inc()
    # ... prediction logic
```

## Troubleshooting

### Issue: Model fails to load
```
Solution: 
- Check MODEL_PATH environment variable
- Verify mnist_cnn_model.h5 exists and is readable
- Check TensorFlow version compatibility
```

### Issue: Out of memory errors
```
Solution:
- Reduce batch size
- Use model quantization
- Deploy on GPU
```

### Issue: Slow predictions
```
Solution:
- Use GPU acceleration
- Implement batching
- Optimize model (quantization, pruning)
```

## Security Considerations

1. **Input Validation**
   - Strict array size checking (784 values)
   - Type validation with Pydantic
   - Range validation for pixel values

2. **Rate Limiting** (Future)
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   
   @app.post("/predict")
   @limiter.limit("100/minute")
   async def predict(request: PredictionRequest):
       pass
   ```

3. **Authentication** (Future)
   ```python
   from fastapi.security import HTTPBearer
   security = HTTPBearer()
   
   @app.post("/predict")
   async def predict(
       request: PredictionRequest,
       credentials = Depends(security)
   ):
       pass
   ```

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**Service Version**: 1.0  
**Status**: Production Ready  
**Framework**: FastAPI 0.104.1  
**Python Version**: 3.9+
