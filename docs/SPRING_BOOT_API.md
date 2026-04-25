# SPRING_BOOT_API.md - Java REST API Gateway

## Service Overview

The **Spring Boot REST API Gateway** is Layer 3 of the system architecture. It acts as a bridge between the frontend and the Python inference service, providing request validation, error handling, health checks, and service orchestration.

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- Python service running on port 8000

### Installation & Setup

```bash
# Navigate to service directory
cd spring-boot-api

# Build project
mvn clean install

# Run application
mvn spring-boot:run
```

Service will be available at: `http://localhost:8080`

## Project Structure

```
spring-boot-api/
├── pom.xml                                          # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/com/example/digitclassification/
│   │   │   ├── DigitClassificationApiApplication.java  # Main entry point
│   │   │   ├── config/
│   │   │   │   └── WebClientConfig.java               # HTTP client config
│   │   │   ├── controller/
│   │   │   │   └── PredictionController.java           # REST endpoints
│   │   │   ├── dto/
│   │   │   │   ├── PredictionRequest.java              # Request DTO
│   │   │   │   ├── PredictionResponse.java             # Response DTO
│   │   │   │   └── ErrorResponse.java                  # Error response
│   │   │   ├── service/
│   │   │   │   └── PredictionService.java              # Business logic
│   │   │   └── exception/
│   │   │       └── GlobalExceptionHandler.java         # Error handling
│   │   └── resources/
│   │       ├── application.properties                   # Configuration
│   │       └── logback.xml                              # Logging config
│   └── test/
│       └── java/...                                     # Test classes
├── target/                                          # Build output
└── Dockerfile                                       # Docker config
```

## Core Components

### 1. Spring Boot Application

**File**: `DigitClassificationApiApplication.java`

```java
package com.example.digitclassification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DigitClassificationApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(DigitClassificationApiApplication.class, args);
    }
}
```

**Features**:
- Auto-configuration of Spring Boot components
- Component scanning for controllers, services, configurations
- Application startup management

### 2. REST Controller

**File**: `PredictionController.java`

**Endpoints**:

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PredictionController {
    
    @Autowired
    private PredictionService predictionService;
    
    @PostMapping("/predict")
    public ResponseEntity<?> predictDigit(
        @Valid @RequestBody PredictionRequest request,
        BindingResult bindingResult,
        HttpServletRequest httpRequest
    ) {
        // Prediction logic
    }
}
```

### 3. Data Transfer Objects (DTOs)

**PredictionRequest.java**:
```java
public class PredictionRequest {
    @Size(min = 784, max = 784, message = "Pixel array must have exactly 784 elements")
    private List<Float> pixels;
    
    // Getters & setters
}
```

**PredictionResponse.java**:
```java
public class PredictionResponse {
    private Integer prediction;      // 0-9
    private Double confidence;       // 0.0-1.0
    private Long processingTimeMs;   // Milliseconds
    private String timestamp;        // ISO format
    
    // Getters & setters
}
```

**ErrorResponse.java**:
```java
public class ErrorResponse {
    private Integer status;          // HTTP status code
    private String message;          // Error message
    private Long timestamp;          // Error timestamp
    private String path;             // Request path
    
    // Getters & setters
}
```

### 4. Service Layer

**File**: `PredictionService.java`

**Responsibilities**:
- Call Python inference service
- Handle retry logic
- Manage health checks
- Request/response transformation

```java
@Service
public class PredictionService {
    
    @Autowired
    private WebClient webClient;
    
    @Value("${python.service.url}")
    private String pythonServiceUrl;
    
    public PredictionResponse predictDigit(PredictionRequest request) {
        try {
            // Call Python service with retry logic
            PredictionResponse response = webClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PredictionResponse.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .retryWhen(Retry.backoff(2, Duration.ofMillis(100)))
                .block();
                
            return response;
        } catch (Exception e) {
            logger.error("Error calling Python service: {}", e.getMessage());
            throw new RuntimeException("Prediction service unavailable");
        }
    }
    
    public boolean isPythonServiceHealthy() {
        try {
            HealthResponse response = webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(HealthResponse.class)
                .timeout(Duration.ofMillis(5000))
                .block();
                
            return response != null && response.isModelLoaded();
        } catch (Exception e) {
            logger.warn("Python service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
```

### 5. WebClient Configuration

**File**: `WebClientConfig.java`

```java
@Configuration
public class WebClientConfig {
    
    @Bean
    public WebClient webClient(
        @Value("${python.service.url}") String pythonServiceUrl
    ) {
        return WebClient.builder()
            .baseUrl(pythonServiceUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }
}
```

### 6. Global Exception Handler

**File**: `GlobalExceptionHandler.java`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
        MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(errors);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
        Exception ex,
        HttpServletRequest request
    ) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            ex.getMessage(),
            System.currentTimeMillis(),
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

## Configuration

### Application Properties

**File**: `application.properties`

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/
spring.application.name=digit-classification-api

# Python Service Configuration
python.service.url=http://localhost:8000
python.service.timeout=30000

# Logging
logging.level.root=INFO
logging.level.com.example.digitclassification=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %logger{36} - %msg%n

# Jackson Configuration
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.time-zone=UTC

# CORS Configuration
spring.web.cors.allowed-origins=http://localhost:3000,http://localhost:8000
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allow-credentials=true
```

## API Endpoints

### 1. POST /api/predict - Classify Digit

**Description**: Classify a handwritten digit using the ML model.

**Request**:
```bash
curl -X POST http://localhost:8080/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "pixels": [0, 0, 0, ..., 255, 128, ..., 0]
  }'
```

**Request Body** (JSON):
```json
{
  "pixels": [0.0, 0.0, 0.0, ..., 1.0, 0.5, ..., 0.0]
}
```

**Response** (200 OK):
```json
{
  "prediction": 5,
  "confidence": 0.98,
  "processingTimeMs": 145,
  "timestamp": "2025-04-25T10:30:45.123Z"
}
```

**Response** (400 Bad Request - Validation Error):
```json
{
  "pixels": "Pixel array must have exactly 784 elements"
}
```

**Response** (503 Service Unavailable):
```json
{
  "status": 503,
  "message": "Python service is not healthy",
  "timestamp": 1703678645000,
  "path": "/api/predict"
}
```

### 2. GET /health - Service Health Check

**Description**: Check if the Spring Boot API is healthy.

**Request**:
```bash
curl http://localhost:8080/health
```

**Response** (200 OK):
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

## Request Flow & Validation

### Step-by-Step Process

```
1. Frontend sends HTTP POST to /api/predict
                    ↓
2. Spring Boot receives request
                    ↓
3. PredictionController @PostMapping handler
                    ↓
4. Request body deserialized to PredictionRequest
                    ↓
5. Validation (Hibernate Validator)
   - Pixel array size == 784
   - All values are floats
                    ↓
6. BindingResult checked for errors
   - If errors: Return 400 with validation messages
                    ↓
7. PredictionService.isPythonServiceHealthy()
   - If unhealthy: Return 503
                    ↓
8. PredictionService.predictDigit(request)
   - WebClient calls Python service
                    ↓
9. Python service returns PredictionResponse
                    ↓
10. ResponseEntity.ok(response) returned
                    ↓
11. Spring converts to JSON
                    ↓
12. Frontend receives 200 + JSON response
```

## Error Handling

### HTTP Status Codes

| Code | Scenario | Example |
|------|----------|---------|
| 200 | Successful prediction | Valid input, prediction returned |
| 400 | Bad request | Invalid pixel array size |
| 422 | Validation error | Malformed JSON |
| 503 | Service unavailable | Python service down |
| 504 | Gateway timeout | Python service too slow |
| 500 | Internal server error | Unexpected error |

### Exception Handling Hierarchy

```
Exception
├── MethodArgumentNotValidException (400)
├── HttpClientErrorException (4xx)
│   ├── HttpClientErrorException.BadRequest (400)
│   └── HttpClientErrorException.Unauthorized (401)
├── HttpServerErrorException (5xx)
│   ├── HttpServerErrorException.ServiceUnavailable (503)
│   └── HttpServerErrorException.GatewayTimeout (504)
└── Generic Exception (500)
```

## Logging

### Log Configuration

**File**: `logback.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>
                %d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
    </appender>
    
    <logger name="com.example.digitclassification" level="DEBUG"/>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

### Sample Logs

```
2025-04-25 10:30:45 [http-nio-8080-exec-1] INFO  PredictionController - Received prediction request from: 127.0.0.1
2025-04-25 10:30:45 [http-nio-8080-exec-1] DEBUG PredictionService - Sending prediction request to: http://localhost:8000/predict
2025-04-25 10:30:45 [http-nio-8080-exec-1] INFO  PredictionService - Prediction response received: {prediction: 5, confidence: 0.98, time_ms: 45}
2025-04-25 10:30:45 [http-nio-8080-exec-1] INFO  PredictionController - Prediction request completed successfully
```

## Retry Logic

### WebClient Retry Configuration

```java
webClient.post()
    .uri("/predict")
    .bodyValue(request)
    .retrieve()
    .bodyToMono(PredictionResponse.class)
    .retryWhen(
        Retry.backoff(2, Duration.ofMillis(100))  // 2 retries, 100ms initial delay
            .maxBackoff(Duration.ofMillis(500))    // Max 500ms between retries
            .jitter(0.5)                           // Add jitter to prevent thundering herd
            .doBeforeRetry(retrySignal -> 
                logger.warn("Retrying prediction request, attempt: {}", 
                    retrySignal.totalRetries() + 1)
            )
    )
    .block();
```

### Retry Behavior

- **Attempt 1**: Immediate
- **Attempt 2**: 100ms delay
- **Attempt 3**: ~250ms delay (with jitter)
- **Failure**: Return 504 Gateway Timeout

## Dependencies

### Maven Dependencies

```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- WebFlux for WebClient -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Logging -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-logging</artifactId>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## Testing

### Unit Tests

```java
@SpringBootTest
@WebMvcTest(PredictionController.class)
public class PredictionControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private PredictionService predictionService;
    
    @Test
    public void testPredictValid() throws Exception {
        // Arrange
        List<Float> pixels = new ArrayList<>();
        for (int i = 0; i < 784; i++) {
            pixels.add(0.5f);
        }
        PredictionRequest request = new PredictionRequest(pixels);
        
        PredictionResponse response = new PredictionResponse(5, 0.98, 45L);
        when(predictionService.predictDigit(any()))
            .thenReturn(response);
        
        // Act & Assert
        mockMvc.perform(post("/api/predict")
            .contentType(MediaType.APPLICATION_JSON)
            .content(new ObjectMapper().writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.prediction").value(5))
            .andExpect(jsonPath("$.confidence").value(0.98));
    }
    
    @Test
    public void testPredictInvalidSize() throws Exception {
        // Arrange
        List<Float> pixels = new ArrayList<>();
        for (int i = 0; i < 100; i++) {  // Wrong size
            pixels.add(0.5f);
        }
        PredictionRequest request = new PredictionRequest(pixels);
        
        // Act & Assert
        mockMvc.perform(post("/api/predict")
            .contentType(MediaType.APPLICATION_JSON)
            .content(new ObjectMapper().writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
```

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=PredictionControllerTest

# Run with coverage
mvn clean test jacoco:report
```

## Deployment

### Build Project

```bash
# Clean build
mvn clean install

# Skip tests during build (not recommended)
mvn clean install -DskipTests
```

### Run Application

#### Local Development
```bash
mvn spring-boot:run
```

#### JAR Executable
```bash
# Build JAR
mvn clean package

# Run JAR
java -jar target/digitclassification-1.0.0.jar
```

### Docker

#### Dockerfile
```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/digitclassification-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Build & Run
```bash
# Build Docker image
docker build -t mnist-spring-api .

# Run container
docker run -p 8080:8080 \
  -e PYTHON_SERVICE_URL=http://python-service:8000 \
  mnist-spring-api
```

## Performance Optimization

### Connection Pooling
```java
@Bean
public WebClient webClient() {
    HttpClient httpClient = HttpClient.create()
        .secure(t -> t.sslContext(SslContextBuilder.forClient().build()))
        .responseTimeout(Duration.ofMillis(30000))
        .connectionProvider(
            ConnectionProvider.builder("fixed")
                .maxConnections(100)
                .build()
        );
    
    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .build();
}
```

### Timeout Configuration
```properties
# Set appropriate timeouts
python.service.timeout=30000
spring.servlet.multipart.max-request-size=10MB
spring.servlet.multipart.max-file-size=10MB
```

## Security

### CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### Input Validation

```java
@Valid
@RequestBody
PredictionRequest request  // Validated automatically
```

## Monitoring

### Actuator Endpoints (Optional)

Add dependency:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Access endpoints:
- `/actuator/health` - Health status
- `/actuator/metrics` - Application metrics
- `/actuator/env` - Environment variables

---

**Document Version**: 1.0  
**Last Updated**: April 2025  
**Framework**: Spring Boot 3.x  
**Java Version**: 17+  
**Status**: Production Ready
