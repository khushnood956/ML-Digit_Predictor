# Spring Boot REST API Gateway - README

## Overview

This directory contains the **Spring Boot REST API Gateway** - Layer 3 of the system. It's a Java-based REST API that acts as a bridge between the frontend and the Python inference service.

## Contents

- **pom.xml** - Maven build configuration
- **src/main/java/com/example/digitclassification/** - Java source code
  - Controller, Service, DTOs, Config, Exception handlers
- **src/main/resources/application.properties** - Configuration
- **Dockerfile** - Container configuration
- **README.md** - This file

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.8+
- Python service running on port 8000

### Installation

```bash
# Build project
mvn clean install

# Run application
mvn spring-boot:run
```

API runs on: **http://localhost:8080**

## Key Features

- ✓ RESTful API endpoints
- ✓ Request/response validation
- ✓ Error handling with detailed messages
- ✓ Health checks for Python service
- ✓ Retry logic with exponential backoff
- ✓ CORS configuration
- ✓ Comprehensive logging
- ✓ Spring Boot autoconfiguration

## Main Endpoints

### POST /api/predict
Classify a digit through the gateway

**Request**:
```bash
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d '{"pixels": [0, 0, ..., 255, ..., 0]}'  # 784 values
```

**Response**:
```json
{
  "prediction": 5,
  "confidence": 0.98,
  "processingTimeMs": 145,
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

### GET /health
API health status

**Response**:
```json
{
  "status": "UP",
  "components": {
    "pythonService": {
      "status": "UP"
    }
  }
}
```

## Architecture

### Class Structure

```
DigitClassificationApiApplication (Entry point)
├── PredictionController (@RestController)
│   ├── POST /api/predict
│   └── GET /health
├── PredictionService (Business logic)
│   ├── predictDigit(request)
│   └── isPythonServiceHealthy()
├── WebClientConfig (HTTP client setup)
└── GlobalExceptionHandler (Error handling)
```

### Request Flow

```
HTTP Request
    ↓
@PostMapping /api/predict
    ↓
Validation (BindingResult)
    ↓
Health Check (Python service)
    ↓
WebClient.post() → Python Service
    ↓
Response Transformation
    ↓
HTTP Response (JSON)
```

## Configuration

### application.properties

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

### Environment Variables (Docker)

```bash
PYTHON_SERVICE_URL=http://python-service:8000
PYTHON_SERVICE_TIMEOUT=30000
```

## Dependencies (Maven)

Key dependencies in `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

## Testing

### Run Tests

```bash
mvn test
```

### Unit Test Example

```bash
mvn test -Dtest=PredictionControllerTest
```

## Production Deployment

### Build JAR

```bash
mvn clean package
java -jar target/digitclassification-1.0.0.jar
```

### Docker

```bash
# Build image
docker build -t mnist-spring-api .

# Run container
docker run -p 8080:8080 \
  -e PYTHON_SERVICE_URL=http://python-service:8000 \
  mnist-spring-api
```

### With Docker Compose

```bash
docker-compose up -d spring-boot-api
```

## Error Handling

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Successful prediction |
| 400 | Invalid input (wrong pixel array size) |
| 422 | JSON parsing error |
| 503 | Python service unavailable |
| 504 | Python service timeout |
| 500 | Internal server error |

### Error Response Example

```json
{
  "status": 503,
  "message": "Python service is not healthy",
  "timestamp": 1703678645000,
  "path": "/api/predict"
}
```

## Monitoring

### View Logs

```bash
# Docker logs
docker-compose logs -f spring-boot-api

# Or access logs directly
tail -f target/logs/application.log
```

### Actuator Endpoints (Optional)

```bash
# Add to pom.xml:
# <dependency>
#   <groupId>org.springframework.boot</groupId>
#   <artifactId>spring-boot-starter-actuator</artifactId>
# </dependency>

# Access:
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/metrics
```

## Performance Optimization

### Connection Pooling

Configured in `WebClientConfig.java`:
- Max connections: 100
- Timeout: 30 seconds
- Retry: 2 attempts with backoff

### Tuning for Production

```properties
server.tomcat.threads.max=200
server.tomcat.threads.min-spare=50
server.tomcat.max-connections=10000
```

## Integration with System

This service bridges the **Frontend** and **Python Inference Service**.

Request flow:
```
Frontend (Port 3000) → Spring Boot (8080) → Python Service (8000)
```

## Security Features

- ✓ Input validation (Hibernate Validator)
- ✓ CORS configuration
- ✓ Error message sanitization
- ✓ Request logging
- ✓ Health checks

For production, add:
- HTTPS/TLS
- API authentication (OAuth2/JWT)
- Rate limiting
- API gateway (Kong/AWS API Gateway)

## See Also

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [SPRING_BOOT_API.md](../docs/SPRING_BOOT_API.md) - Detailed documentation
- [API_ENDPOINTS.md](../docs/API_ENDPOINTS.md) - API reference

## Troubleshooting

### Port 8080 already in use
```bash
# Find process using port
lsof -i :8080

# Use different port
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

### Python service connection refused
- Verify Python service is running on port 8000
- Check network connectivity
- Review Spring Boot logs: `cat target/logs/application.log`

### Slow predictions
- Check Python service logs
- Verify network latency
- Monitor CPU/memory usage

## Future Enhancements

- Authentication & Authorization
- Rate limiting
- Response caching
- Batch predictions
- Metrics collection (Prometheus)
- Service mesh integration (Istio)

---

**Last Updated**: April 2025  
**Status**: Production Ready  
**Framework**: Spring Boot 3.x  
**Java**: 17+
