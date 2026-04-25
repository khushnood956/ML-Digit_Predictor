# SETUP_GUIDE.md - Installation & Setup Instructions

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker Compose)](#quick-start-docker-compose)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 2GB for dependencies + models

### Required Software

#### For Docker Compose (Recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) 20.10+
  - Includes Docker Engine and Docker Compose

#### For Manual Setup - Java/Spring Boot
- [Java Development Kit (JDK) 17+](https://www.oracle.com/java/technologies/downloads/)
  - Verify: `java -version`
- [Maven 3.8+](https://maven.apache.org/download.cgi)
  - Verify: `mvn -version`

#### For Manual Setup - Python/FastAPI
- [Python 3.9+](https://www.python.org/downloads/)
  - Verify: `python --version`
- pip (comes with Python)

#### For Frontend
- Any modern web browser
  - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Optional
- [Git](https://git-scm.com/) - For cloning repository
- [Postman](https://www.postman.com/) - For API testing
- IDE: [VS Code](https://code.visualstudio.com/), [IntelliJ IDEA](https://www.jetbrains.com/idea/)

---

## Quick Start (Docker Compose)

### Step 1: Install Docker

Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop) for your OS.

Verify installation:
```bash
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
git clone <repository-url>
cd "ML LABMID"
```

### Step 3: Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # Python FastAPI Service
  python-service:
    build:
      context: ./python-inference-service
      dockerfile: Dockerfile
    container_name: mnist-python-service
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/mnist_cnn_model.h5
      - LOG_LEVEL=INFO
    volumes:
      - ./python-inference-service:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Spring Boot API Gateway
  spring-boot-api:
    build:
      context: ./spring-boot-api
      dockerfile: Dockerfile
    container_name: mnist-spring-api
    ports:
      - "8080:8080"
    environment:
      - PYTHON_SERVICE_URL=http://python-service:8000
      - PYTHON_SERVICE_TIMEOUT=30000
    depends_on:
      python-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (Optional - serve with nginx)
  frontend:
    image: nginx:alpine
    container_name: mnist-frontend
    ports:
      - "80:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
```

### Step 4: Build and Run

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 5: Verify Services

```bash
# Check running containers
docker-compose ps

# Test Python Service
curl http://localhost:8000/health

# Test Spring Boot API
curl http://localhost:8080/health

# Open Frontend
open http://localhost:80  # or http://localhost:80/frontend/mnist-classifier.html
```

---

## Manual Setup

### Option 1: Step-by-Step Setup

#### Part A: Python FastAPI Service (Port 8000)

**Step 1: Navigate to service directory**
```bash
cd python-inference-service
```

**Step 2: Create virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

**Step 3: Install dependencies**
```bash
pip install -r requirements.txt
```

**Step 4: Verify model file**
```bash
ls -la mnist_cnn_model.h5  # Check if file exists
```

**Step 5: Start service**
```bash
python main.py
```

**Output should show:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify service is running:**
```bash
# In another terminal
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "MNIST Digit Classification Service"
}
```

---

#### Part B: Spring Boot API (Port 8080)

**Step 1: Navigate to service directory**
```bash
cd ../spring-boot-api
```

**Step 2: Build project**
```bash
# Download dependencies and compile
mvn clean install
```

This may take 2-5 minutes on first run.

**Step 3: Run application**
```bash
mvn spring-boot:run
```

**Output should show:**
```
Started DigitClassificationApiApplication in X seconds
```

**Verify service is running:**
```bash
# In another terminal
curl http://localhost:8080/health
```

---

#### Part C: Open Frontend

**Step 1: Navigate to frontend**
```bash
cd ../frontend
```

**Step 2: Open in browser**

Option 1 - Direct file open:
```bash
# Windows
start mnist-classifier.html

# macOS
open mnist-classifier.html

# Linux
xdg-open mnist-classifier.html
```

Option 2 - Using Python simple server:
```bash
# Python 3
python -m http.server 8001
```

Then open: `http://localhost:8001/mnist-classifier.html`

---

### Option 2: Individual Service Startup

If you want to run services individually without docker-compose:

**Terminal 1 - Python Service:**
```bash
cd python-inference-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py
```

**Terminal 2 - Spring Boot API:**
```bash
cd spring-boot-api
mvn spring-boot:run
```

**Terminal 3 - Frontend:**
Open `frontend/mnist-classifier.html` in your browser

---

## Configuration

### Python Service Configuration

**File**: `python-inference-service/.env`

```
# Model Configuration
MODEL_PATH=./mnist_cnn_model.h5

# Service Configuration
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8000

# Logging
LOG_LEVEL=INFO
```

### Spring Boot Configuration

**File**: `spring-boot-api/src/main/resources/application.properties`

```properties
# Server
server.port=8080
spring.application.name=digit-classification-api

# Python Service
python.service.url=http://localhost:8000
python.service.timeout=30000

# Logging
logging.level.root=INFO
logging.level.com.example.digitclassification=DEBUG
```

For Docker, use environment variables:
```bash
docker run -e PYTHON_SERVICE_URL=http://python-service:8000 mnist-spring-api
```

### Frontend Configuration

**File**: `frontend/mnist-classifier.html`

Update API URL (if not on localhost:8080):
```javascript
// Line: fetch('http://localhost:8080/api/predict', {
fetch('http://your-api-host:8080/api/predict', {
```

---

## Verification

### 1. Check All Services Running

```bash
# Python Service
curl -v http://localhost:8000/health

# Spring Boot API
curl -v http://localhost:8080/health

# Both should return status: 200 OK
```

### 2. Test Prediction Endpoint

```bash
# Create test request
cat > test_request.json << EOF
{
  "pixels": $(python -c "import json; print(json.dumps([0]*784))")
}
EOF

# Send to Spring Boot API
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

Expected response:
```json
{
  "prediction": 0,
  "confidence": 0.95,
  "processingTimeMs": 145.2
}
```

### 3. Test Frontend

Open `http://localhost:8000/frontend/mnist-classifier.html` in browser and:
1. Draw a digit (0-9)
2. Click Submit
3. Should see prediction appear

---

## Production Deployment

### 1. Cloud Deployment (AWS/Azure/GCP)

#### AWS ECS (Recommended)

```bash
# Push Docker images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag mnist-python-service <account-id>.dkr.ecr.us-east-1.amazonaws.com/mnist-python:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/mnist-python:latest

docker tag mnist-spring-api <account-id>.dkr.ecr.us-east-1.amazonaws.com/mnist-spring:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/mnist-spring:latest
```

#### Kubernetes Deployment

Create `kubernetes/deployment.yml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mnist-python-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: python-service
        image: mnist-python-service:latest
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### 2. Environment-Specific Configuration

**Development** (.env.dev):
```
LOG_LEVEL=DEBUG
PYTHON_SERVICE_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=*
```

**Production** (.env.prod):
```
LOG_LEVEL=INFO
PYTHON_SERVICE_URL=https://ml-inference.company.com
CORS_ALLOWED_ORIGINS=https://app.company.com
ENABLE_RATE_LIMITING=true
RATE_LIMIT_PER_MINUTE=100
```

### 3. Performance Tuning

**Python Service**:
```bash
# Use uvicorn workers
uvicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

**Spring Boot**:
```properties
server.tomcat.threads.max=200
server.tomcat.threads.min-spare=50
server.tomcat.max-connections=10000
```

### 4. Security Hardening

- Enable HTTPS/TLS
- Implement API rate limiting
- Add authentication (OAuth2/JWT)
- Use API keys for production
- Configure firewall rules
- Enable logging & monitoring
- Regular security audits

### 5. Monitoring & Logging

```bash
# Enable Prometheus metrics
# Add to Spring Boot pom.xml:
# <dependency>
#   <groupId>io.micrometer</groupId>
#   <artifactId>micrometer-registry-prometheus</artifactId>
# </dependency>

# Access metrics: http://localhost:8080/actuator/prometheus
```

---

## Troubleshooting

### Issue: Docker build fails

**Solution**:
```bash
# Clean build
docker-compose down --volumes
docker system prune -a
docker-compose up --build
```

### Issue: Port 8000/8080 already in use

**Solution**:
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process and start service on different port
export SPRING_PORT=8081
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

### Issue: Python model fails to load

**Solution**:
```bash
# Check file exists
ls -la python-inference-service/mnist_cnn_model.h5

# Check TensorFlow installation
python -c "import tensorflow as tf; print(tf.__version__)"

# Reinstall dependencies
pip install --upgrade tensorflow
```

### Issue: API returns 503 Service Unavailable

**Solution**:
```bash
# Check if Python service is running
curl http://localhost:8000/health

# Check logs
docker-compose logs python-service

# Restart service
docker-compose restart python-service
```

### Issue: Frontend shows "Cannot reach API"

**Solution**:
```bash
# Check if Spring Boot is running
curl http://localhost:8080/health

# Check CORS configuration
# Verify browser console for CORS errors

# Enable all origins for testing (not production)
spring.web.cors.allowed-origins=*
```

### Issue: Slow predictions (>1 second)

**Solution**:
- Use GPU acceleration (if available)
- Reduce model complexity
- Implement batch processing
- Check network latency
- Verify no CPU bottleneck

---

## System Check Checklist

- [ ] Java 17+ installed: `java -version`
- [ ] Maven installed: `mvn -version`
- [ ] Python 3.9+ installed: `python --version`
- [ ] pip updated: `pip --version`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Git installed: `git --version`
- [ ] Model file exists: `ls mnist_cnn_model.h5`
- [ ] All dependencies installed
- [ ] Ports 8000, 8080 available
- [ ] Sufficient disk space (2GB+)
- [ ] Sufficient RAM (4GB+)

---

## Next Steps

After successful setup:

1. **Test the API**
   - Use curl or Postman to test endpoints
   - Verify all status codes and responses

2. **Explore the System**
   - Review architecture in [ARCHITECTURE.md](ARCHITECTURE.md)
   - Check individual service docs

3. **Customize**
   - Modify model in Jupyter notebook
   - Add custom business logic in Spring Boot
   - Enhance frontend UI

4. **Deploy**
   - Choose deployment platform (AWS/Azure/GCP/K8s)
   - Configure environment variables
   - Set up monitoring and logging

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**Status**: Production Ready
