# ARCHITECTURE.md - System Architecture & Design

## System Overview

The MNIST Digit Classification System is built using a **4-layer microservices architecture** with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: PRESENTATION LAYER (Frontend)                      │
│  - React-based UI with HTML5 Canvas                           │
│  - Real-time digit drawing & visualization                   │
│  - Browser-based (No server required)                        │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP/JSON (Port 8080)
┌────────────────────▼─────────────────────────────────────────┐
│  Layer 3: API GATEWAY LAYER (Spring Boot)                    │
│  - REST API Gateway (Port 8080)                              │
│  - Request validation & transformation                       │
│  - Health checks & circuit breaker pattern                   │
│  - CORS & error handling                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTP/REST (Port 8000)
┌────────────────────▼─────────────────────────────────────────┐
│  Layer 2: INFERENCE SERVICE (Python FastAPI)                 │
│  - ML Model Serving                                          │
│  - Real-time predictions with confidence scores             │
│  - Model lifecycle management                               │
│  - Performance monitoring                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │ Model Loading
┌────────────────────▼─────────────────────────────────────────┐
│  Layer 1: ML MODEL LAYER                                     │
│  - Pre-trained CNN Model (TensorFlow/Keras)                 │
│  - MNIST Dataset Reference                                   │
│  - Training Notebook (Jupyter)                               │
└──────────────────────────────────────────────────────────────┘
```

## Layer Details

### Layer 1: Machine Learning Model
**Purpose**: Model training and development  
**Technology Stack**: TensorFlow/Keras, NumPy, Matplotlib, Scikit-learn

**Components**:
- **Training Notebook**: `ML_LAB-MID(SP24-BCS-051-076).ipynb`
  - Problem statement & dataset analysis
  - Preprocessing & normalization
  - Model architecture (ANN baseline + CNN extension)
  - Training & evaluation
  - Visualization (confusion matrix, precision/recall)
  
- **Trained Model**: `mnist_cnn_model.h5`
  - Binary Keras model file
  - Pre-trained on 60,000 MNIST images
  - ~98% accuracy on test set

**Key Algorithms**:
1. **Convolutional Neural Network (CNN)**
   - Conv2D layers for feature extraction
   - MaxPooling for dimensionality reduction
   - Dense layers for classification
   - Dropout for regularization

2. **Training Process**:
   - Optimizer: Adam
   - Loss: Categorical Crossentropy
   - Metrics: Accuracy, Precision, Recall
   - Batch Size: 128
   - Epochs: 10-20

**Data Flow**:
```
Raw Images (28×28×1) → Normalization → Reshape → Model → 
Predictions (0-9) + Confidence Scores
```

---

### Layer 2: Python FastAPI Inference Service
**Purpose**: Serve the ML model as a REST API  
**Technology Stack**: FastAPI, Uvicorn, TensorFlow/Keras, Pydantic  
**Port**: 8000

**Components**:

#### 1. **Startup & Model Loading**
```python
@app.on_event("startup")
async def load_model():
    """Load the trained CNN model on startup"""
    global model
    model = tf.keras.models.load_model(MODEL_PATH)
```

#### 2. **API Endpoints**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/predict` | POST | Classify digit | `{prediction: 0-9, confidence: 0-1, processing_time_ms}` |
| `/health` | GET | Service status | `{status: "healthy", model_loaded: true}` |
| `/docs` | GET | Swagger UI | Interactive API documentation |

#### 3. **Request Validation** (Pydantic)
```python
class PredictionRequest(BaseModel):
    pixels: List[float] = Field(
        ..., 
        min_items=784, 
        max_items=784, 
        description="Flattened 28×28 image pixels"
    )
```

#### 4. **Response Format** (Structured)
```python
class PredictionResponse(BaseModel):
    prediction: int  # 0-9
    confidence: float  # 0.0-1.0
    processing_time_ms: float
```

**Features**:
- ✓ Automatic input validation
- ✓ Performance tracking
- ✓ Error handling with detailed messages
- ✓ CORS support for cross-origin requests
- ✓ Asynchronous request handling
- ✓ Graceful shutdown

---

### Layer 3: Spring Boot REST API Gateway
**Purpose**: Request orchestration and validation layer  
**Technology Stack**: Spring Boot, Spring Web, WebClient, Maven  
**Port**: 8080

**Components**:

#### 1. **REST Endpoint**
```
POST /api/predict
Content-Type: application/json
Body: { "pixels": [0, 0, ..., 255, 0] }
```

#### 2. **Request Flow**
```
HTTP Request → Validation → WebClient Call → Python Service →
Response Transformation → HTTP Response
```

#### 3. **Key Classes**

| Class | Purpose |
|-------|---------|
| `DigitClassificationApiApplication` | Spring Boot entry point |
| `PredictionController` | REST endpoints handler |
| `PredictionService` | Business logic & Python service calls |
| `WebClientConfig` | HTTP client configuration |
| `GlobalExceptionHandler` | Centralized error handling |

#### 4. **Configuration**
```properties
# application.properties
python.service.url=http://localhost:8000
python.service.timeout=30000
spring.application.name=digit-classification-api
server.port=8080
```

**Features**:
- ✓ Input validation (Hibernate Validator)
- ✓ Error handling with custom ErrorResponse
- ✓ Retry logic with exponential backoff
- ✓ Health check before service calls
- ✓ CORS configuration
- ✓ Logging & request tracing
- ✓ Service health endpoint

---

### Layer 4: Frontend UI (React + HTML5 Canvas)
**Purpose**: User interaction and visualization  
**Technology Stack**: React 18, HTML5 Canvas, JavaScript, CSS  
**Deployment**: Browser (no server required)

**Components**:

#### 1. **Canvas Drawing Interface**
- HTML5 Canvas for digit drawing
- Real-time drawing feedback
- Clear button to reset canvas
- Support for mouse & touch events

#### 2. **Request/Response Handling**
```javascript
// Send drawn image to Spring Boot API
fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pixels: pixelArray })
})
.then(response => response.json())
.then(data => displayPrediction(data))
```

#### 3. **Result Display**
- Predicted digit (0-9)
- Confidence percentage
- Processing time
- Visualization of prediction probability

**Features**:
- ✓ Real-time drawing on canvas
- ✓ Pixel extraction from canvas
- ✓ Responsive design
- ✓ Error messages
- ✓ Loading indicators
- ✓ Cross-browser compatible

---

## Data Flow Diagram

### Complete Prediction Flow

```
User draws digit on canvas
        ↓
[Canvas → Pixel Array (784 values)]
        ↓
HTTP POST /api/predict
        ↓
[Spring Boot API]
  - Validate 784 pixels
  - Check Python service health
  - Call Python service
        ↓
HTTP POST localhost:8000/predict
        ↓
[Python FastAPI Service]
  - Receive pixel array
  - Reshape to 28×28×1
  - Normalize (divide by 255)
  - Feed to CNN model
  - Get prediction & confidence
        ↓
TensorFlow/Keras CNN Model
  - Conv2D → ReLU → MaxPooling
  - Conv2D → ReLU → MaxPooling
  - Flatten → Dense → Softmax
        ↓
Return: { prediction: 5, confidence: 0.98, time_ms: 45 }
        ↓
[Spring Boot Response]
  - Transform response
  - Add timestamp
  - Return to frontend
        ↓
HTTP 200 + JSON Response
        ↓
Display prediction on UI
  "Predicted Digit: 5"
  "Confidence: 98%"
  "Time: 145ms"
```

---

## Communication Protocols

### Frontend ↔ Spring Boot
- **Protocol**: HTTP/JSON
- **Method**: POST/GET
- **Port**: 8080
- **CORS**: Enabled for localhost:3000

### Spring Boot ↔ Python Service
- **Protocol**: HTTP/JSON
- **Method**: POST
- **Port**: 8000
- **Retry**: 2 attempts with exponential backoff

### Python Service ↔ Model
- **Protocol**: In-memory (TensorFlow/Keras)
- **Format**: NumPy arrays
- **Latency**: ~50-100ms per prediction

---

## Deployment Models

### 1. **Local Development**
```
Frontend (file://) ↔ Port 8080 (Spring Boot) ↔ Port 8000 (FastAPI)
```

### 2. **Docker Compose**
```
frontend container → spring-boot container ↔ python-service container
```

### 3. **Kubernetes**
```
frontend pod → ingress → spring-boot pods ↔ python-service pods
```

### 4. **Cloud Services**
```
AWS/Azure/GCP: Containerized services with auto-scaling
```

---

## Error Handling Strategy

### Python Service Errors
```
- Model loading failure → Start service in error state
- Invalid input → Return 400 Bad Request
- Prediction error → Return 500 with error details
```

### Spring Boot Errors
```
- Validation failure → Return 400 with field errors
- Python service unavailable → Return 503 with retry info
- Timeout → Return 504 Gateway Timeout
```

### Frontend Errors
```
- Network errors → Display error message with retry
- Validation errors → Show field-level errors
- Service unavailable → Display service status
```

---

## Security Considerations

1. **Input Validation**
   - Strict pixel array size (784 values)
   - Type validation for all fields
   - Range validation (0-255 for pixels)

2. **Service Communication**
   - Use HTTPS in production
   - Service-to-service authentication tokens
   - Rate limiting on endpoints

3. **Model Security**
   - Model file integrity checks
   - Access controls on model endpoints
   - Version management

4. **Frontend Security**
   - XSS protection
   - CSRF tokens for state-changing operations
   - Content Security Policy headers

---

## Performance Optimization

### Caching
- Model loaded once at service startup
- Reused for all predictions

### Async Processing
- FastAPI async handlers for I/O
- Spring WebClient for non-blocking HTTP

### Batch Processing
- Support for multiple predictions (future enhancement)
- Reduced overhead per prediction

### Monitoring
- Request latency tracking
- Model loading time logging
- Service health metrics

---

## Scalability Considerations

### Horizontal Scaling
- Multiple Spring Boot instances behind load balancer
- Multiple Python service replicas
- Frontend static content on CDN

### Vertical Scaling
- Increased JVM heap for Spring Boot
- GPU acceleration for Python service
- Optimized CNN model (quantization, pruning)

### Database (Future)
- Prediction history logging
- User analytics
- Model versioning

---

## Technology Stack Summary

| Layer | Component | Technology | Version |
|-------|-----------|-----------|---------|
| 1 | ML Training | TensorFlow/Keras | 2.15.0 |
| 2 | Inference | FastAPI | 0.104.1 |
| 2 | Server | Uvicorn | 0.24.0 |
| 3 | API Gateway | Spring Boot | 3.x |
| 3 | HTTP Client | Spring WebClient | 6.x |
| 4 | Frontend | React | 18.x |
| 4 | UI | HTML5/Canvas/JavaScript | ES6+ |

---

## Future Enhancements

1. **Model Improvements**
   - Transfer learning from ResNet/MobileNet
   - Ensemble models
   - Model versioning & A/B testing

2. **Service Enhancements**
   - Batch prediction API
   - Model reloading without restart
   - Prediction caching

3. **Monitoring & Observability**
   - Prometheus metrics
   - Grafana dashboards
   - Distributed tracing

4. **Frontend Enhancements**
   - Image upload support
   - Prediction history
   - Model confidence visualization

5. **Deployment**
   - Kubernetes manifests
   - CI/CD pipeline
   - Automated testing

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**Maintainer**: ML Lab Mid (SP24-BCS-051-076)
