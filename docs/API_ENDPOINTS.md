# API_ENDPOINTS.md - Complete API Reference

## Overview

This document provides comprehensive API endpoint documentation for the MNIST Digit Classification System, including all available endpoints, request/response formats, error codes, and examples.

## API Layers

```
Layer 4 (Frontend)
    ↓ HTTP REST
Layer 3 (Spring Boot API) - Port 8080
    ↓ HTTP REST  
Layer 2 (FastAPI Service) - Port 8000
```

## Spring Boot API (Port 8080)

### Base URL
```
http://localhost:8080/api
```

### 1. POST /api/predict

**Purpose**: Classify a handwritten digit from pixel data.

**HTTP Method**: POST  
**Content-Type**: application/json  
**Authentication**: None

#### Request

**URL**:
```
POST http://localhost:8080/api/predict
```

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "pixels": [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ... (784 total values)
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]
}
```

**Pixel Array Details**:
- **Total Elements**: 784 (28×28 pixels)
- **Value Range**: 0-255 (grayscale intensity)
- **Data Type**: Float or Integer
- **Format**: Flattened 1D array (row-major order)

**Example with cURL**:
```bash
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d @request.json
```

**Example with JavaScript/Fetch**:
```javascript
const pixels = Array(784).fill(0);  // Initialize with zeros
pixels[100] = 255;  // Set some pixels

fetch('http://localhost:8080/api/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ pixels })
})
.then(response => response.json())
.then(data => console.log('Prediction:', data));
```

#### Response

**Success (200 OK)**:
```json
{
  "prediction": 5,
  "confidence": 0.9847,
  "processingTimeMs": 145.23,
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| prediction | integer | Predicted digit (0-9) |
| confidence | number | Confidence score (0.0-1.0) |
| processingTimeMs | number | Total processing time in milliseconds |
| timestamp | string | ISO 8601 timestamp of prediction |

**Bad Request (400)**:
```json
{
  "pixels": "size must be between 784 and 784"
}
```

**Service Unavailable (503)**:
```json
{
  "status": 503,
  "message": "Python service is not healthy",
  "timestamp": 1703678645000,
  "path": "/api/predict"
}
```

**Internal Server Error (500)**:
```json
{
  "status": 500,
  "message": "Error processing prediction",
  "timestamp": 1703678645000,
  "path": "/api/predict"
}
```

#### Status Codes

| Code | Meaning | Reason |
|------|---------|--------|
| 200 | OK | Successful prediction |
| 400 | Bad Request | Invalid pixel array size or format |
| 422 | Unprocessable Entity | JSON parsing error or missing fields |
| 503 | Service Unavailable | Python service is down or unhealthy |
| 504 | Gateway Timeout | Python service response timeout |
| 500 | Internal Server Error | Unexpected server error |

---

### 2. GET /health

**Purpose**: Check if the Spring Boot API service is healthy.

**HTTP Method**: GET  
**Authentication**: None

#### Request

**URL**:
```
GET http://localhost:8080/health
```

**Headers**: None required

#### Response

**Success (200 OK)**:
```json
{
  "status": "UP",
  "components": {
    "pythonService": {
      "status": "UP",
      "details": {
        "modelLoaded": true
      }
    }
  }
}
```

**Service Degraded (200 with warning)**:
```json
{
  "status": "UP",
  "components": {
    "pythonService": {
      "status": "DOWN",
      "details": {
        "modelLoaded": false,
        "error": "Connection refused"
      }
    }
  }
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Service is up (components may be degraded) |
| 503 | Service is down |

---

## Python FastAPI Service (Port 8000)

### Base URL
```
http://localhost:8000
```

### 1. POST /predict

**Purpose**: Classify a handwritten digit (Direct model inference).

**HTTP Method**: POST  
**Content-Type**: application/json

#### Request

**URL**:
```
POST http://localhost:8000/predict
```

**Body** (JSON):
```json
{
  "pixels": [0, 0, ..., 255, ..., 0]
}
```

**Example with cURL**:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"pixels": [0, 0, 0, ..., 255, 0]}'
```

#### Response

**Success (200 OK)**:
```json
{
  "prediction": 5,
  "confidence": 0.98,
  "processing_time_ms": 45.2
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| prediction | integer | Predicted digit (0-9) |
| confidence | number | Confidence score (0.0-1.0) |
| processing_time_ms | number | Model inference time in milliseconds |

**Validation Error (422)**:
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

---

### 2. GET /health

**Purpose**: Check if the Python FastAPI service is healthy.

**HTTP Method**: GET

#### Request

**URL**:
```
GET http://localhost:8000/health
```

#### Response

**Success (200 OK)**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "MNIST Digit Classification Service",
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

**Model Not Ready (503)**:
```json
{
  "status": "unhealthy",
  "model_loaded": false,
  "service": "MNIST Digit Classification Service",
  "error": "Model failed to load on startup"
}
```

---

### 3. GET /docs

**Purpose**: Interactive API documentation (Swagger UI).

**HTTP Method**: GET

#### Request

**URL**:
```
GET http://localhost:8000/docs
```

**Response**: HTML page with interactive API explorer

**Features**:
- Try-it-out functionality
- Request/response examples
- Schema documentation
- Auto-generated from code

---

### 4. GET /redoc

**Purpose**: Alternative API documentation (ReDoc).

**HTTP Method**: GET

#### Request

**URL**:
```
GET http://localhost:8000/redoc
```

**Response**: HTML page with API documentation

---

## Request/Response Examples

### Example 1: Simple Digit 5

#### Request
```bash
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pixels": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 51, 159, 253, 159, 50, 0, 0,
      ... (764 more values)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]
  }'
```

#### Response
```json
{
  "prediction": 5,
  "confidence": 0.9847,
  "processingTimeMs": 145.23,
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

### Example 2: Digit 0

#### Request
```bash
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d @digit-0.json
```

#### Response
```json
{
  "prediction": 0,
  "confidence": 0.9923,
  "processingTimeMs": 142.56,
  "timestamp": "2025-04-25T10:31:12.456Z"
}
```

---

## Error Handling

### Validation Errors

**Pixel Array Too Small**:
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

**Pixel Array Too Large**:
```json
{
  "detail": [
    {
      "loc": ["body", "pixels"],
      "msg": "ensure this value has at most 784 items",
      "type": "value_error.list.max_items"
    }
  ]
}
```

### Service Errors

**Python Service Unavailable**:
```json
{
  "status": 503,
  "message": "Python service is not healthy",
  "timestamp": 1703678645000,
  "path": "/api/predict"
}
```

**Timeout Error**:
```json
{
  "status": 504,
  "message": "Request timeout while calling Python service",
  "timestamp": 1703678645000,
  "path": "/api/predict"
}
```

---

## Performance Metrics

### Response Times

| Component | Typical Time |
|-----------|--------------|
| Model Inference | 50-100ms |
| Network Overhead | 20-50ms |
| Validation | 1-5ms |
| **Total (Spring → Python)** | **100-150ms** |

### Confidence Scores

| Confidence | Meaning |
|-----------|---------|
| > 0.95 | Very confident prediction |
| 0.85-0.95 | Confident prediction |
| 0.75-0.85 | Reasonable prediction |
| < 0.75 | Low confidence (may be incorrect) |

---

## Batch Processing (Future Enhancement)

### POST /batch-predict

**Purpose**: Classify multiple digits in one request.

**Request**:
```json
{
  "images": [
    [0, 0, ..., 255, ...],
    [0, 0, ..., 255, ...],
    ...
  ]
}
```

**Response**:
```json
{
  "predictions": [
    {"prediction": 5, "confidence": 0.98},
    {"prediction": 3, "confidence": 0.97},
    ...
  ]
}
```

---

## CORS Configuration

### Allowed Origins
- `http://localhost:3000` (Frontend dev)
- `http://localhost` (Local access)
- `*` (Any origin - in development only)

### Allowed Methods
- GET
- POST
- OPTIONS
- PUT (future)
- DELETE (future)

### Allowed Headers
- Content-Type
- Authorization (future)

---

## Rate Limiting (Future)

### Recommended Limits
```
/api/predict: 100 requests/minute per IP
/health: 1000 requests/minute per IP
```

---

## Authentication (Future)

### OAuth2 with JWT

```bash
# Get token
POST /auth/token
Authorization: Basic username:password

# Use token in prediction request
POST /api/predict
Authorization: Bearer <token>
```

---

## Webhook Support (Future)

### Async Predictions

```bash
POST /api/predict-async
{
  "pixels": [...],
  "webhook_url": "https://myapp.com/callback"
}
```

---

## API Versioning (Future)

```
/v1/api/predict  (Current version)
/v2/api/predict  (Future version)
```

---

## Testing the API

### Using Postman

1. Create new request: POST
2. URL: `http://localhost:8080/api/predict`
3. Headers: `Content-Type: application/json`
4. Body (raw): Paste JSON with pixel array
5. Send

### Using curl in bash

```bash
# Create request file
cat > request.json << EOF
{
  "pixels": [0, 0, ..., 255, ..., 0]
}
EOF

# Send request
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Using Python

```python
import requests
import json

pixels = [0] * 784
response = requests.post(
    'http://localhost:8080/api/predict',
    json={'pixels': pixels},
    headers={'Content-Type': 'application/json'}
)

print(response.json())
```

### Using JavaScript

```javascript
const pixels = Array(784).fill(0);

fetch('http://localhost:8080/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pixels })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## OpenAPI/Swagger Schema

### Base Schema

```yaml
openapi: 3.0.0
info:
  title: MNIST Digit Classification API
  version: 1.0.0
servers:
  - url: http://localhost:8080
paths:
  /api/predict:
    post:
      operationId: predictDigit
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PredictionRequest'
      responses:
        '200':
          description: Successful prediction
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PredictionResponse'
components:
  schemas:
    PredictionRequest:
      type: object
      properties:
        pixels:
          type: array
          items:
            type: number
          minItems: 784
          maxItems: 784
    PredictionResponse:
      type: object
      properties:
        prediction:
          type: integer
          minimum: 0
          maximum: 9
        confidence:
          type: number
          minimum: 0
          maximum: 1
        processingTimeMs:
          type: number
```

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**API Version**: 1.0  
**Status**: Production Ready
