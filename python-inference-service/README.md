# Python FastAPI Inference Service - README

## Overview

This directory contains the **Python FastAPI Inference Service** - Layer 2 of the system. It's a high-performance REST API that loads the trained CNN model and serves digit classification predictions.

## Contents

- **main.py** - FastAPI application with endpoints
- **test_main.py** - Unit tests for the service
- **requirements.txt** - Python dependencies
- **mnist_cnn_model.h5** - Trained CNN model (referenced from ml-model/)
- **Dockerfile** - Container configuration
- **README.md** - This file

## Quick Start

### Prerequisites

- Python 3.9+
- pip package manager

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service
python main.py
```

Service runs on: **http://localhost:8000**

## Key Features

- ✓ FastAPI framework for high performance
- ✓ Automatic request validation (Pydantic)
- ✓ Interactive API docs (Swagger UI)
- ✓ Health check endpoint
- ✓ Comprehensive logging
- ✓ CORS support
- ✓ Error handling with detailed messages

## API Endpoints

### POST /predict
Classify a handwritten digit from pixel data

**Request**:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"pixels": [0, 0, ..., 255, ..., 0]}'  # 784 values
```

**Response**:
```json
{
  "prediction": 5,
  "confidence": 0.98,
  "processing_time_ms": 45.2
}
```

### GET /health
Service health status

**Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "MNIST Digit Classification Service"
}
```

### GET /docs
Interactive API documentation (Swagger UI)

**URL**: http://localhost:8000/docs

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.104.1 | Web framework |
| uvicorn | 0.24.0 | ASGI server |
| tensorflow | 2.15.0 | ML framework |
| numpy | 1.24.3 | Numerical computing |
| pydantic | 2.5.0 | Data validation |

## Configuration

### Environment Variables

```
MODEL_PATH=./mnist_cnn_model.h5
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8000
LOG_LEVEL=INFO
```

### Update Configuration

Edit `main.py` line with `@app.on_event("startup")` to change model path.

## Testing

### Run Unit Tests

```bash
pip install pytest
pytest test_main.py -v
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test prediction with sample data
python -c "
import requests
pixels = [0] * 784
response = requests.post('http://localhost:8000/predict', 
                        json={'pixels': pixels})
print(response.json())
"
```

## Production Deployment

### Docker

```bash
# Build image
docker build -t mnist-python-service .

# Run container
docker run -p 8000:8000 mnist-python-service
```

### With Docker Compose

```bash
docker-compose up -d python-service
```

### On Linux/macOS with Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## Performance

- **Model Inference**: ~50-100ms
- **Network Overhead**: ~10-20ms
- **Total**: ~60-120ms per prediction

## Monitoring

### View Logs

```bash
# Docker logs
docker-compose logs -f python-service

# Direct logs (if running locally)
# Check console output
```

### Metrics

Access at: http://localhost:8000/metrics (if Prometheus is configured)

## Integration with System

This service is called by the **Spring Boot API Gateway** on port 8080.

Request flow:
```
Frontend → Spring Boot (8080) → Python Service (8000) → CNN Model
```

## See Also

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [INFERENCE_SERVICE.md](../docs/INFERENCE_SERVICE.md) - Detailed service docs
- [API_ENDPOINTS.md](../docs/API_ENDPOINTS.md) - API reference

## Troubleshooting

### Model fails to load
- Check `mnist_cnn_model.h5` exists in same directory
- Verify TensorFlow version: `python -c "import tensorflow as tf; print(tf.__version__)"`

### Connection refused on port 8000
- Check if service is running
- Verify port 8000 is not already in use

### Slow predictions
- Check CPU usage
- Consider GPU acceleration
- Check network latency

## Future Enhancements

- Batch prediction support
- Model versioning
- Metrics collection (Prometheus)
- Authentication (JWT)
- Rate limiting
- Caching layer

---

**Last Updated**: April 2025  
**Status**: Production Ready  
**Framework**: FastAPI 0.104.1  
**Python**: 3.9+
