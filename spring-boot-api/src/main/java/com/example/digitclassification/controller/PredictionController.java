package com.example.digitclassification.controller;

import com.example.digitclassification.dto.ErrorResponse;
import com.example.digitclassification.dto.PredictionRequest;
import com.example.digitclassification.dto.PredictionResponse;
import com.example.digitclassification.service.PredictionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PredictionController {

    private static final Logger logger = LoggerFactory.getLogger(PredictionController.class);

    @Autowired
    private PredictionService predictionService;

    @PostMapping("/predict")
    public ResponseEntity<?> predictDigit(@Valid @RequestBody PredictionRequest request, 
                                          BindingResult bindingResult,
                                          HttpServletRequest httpRequest) {
        logger.info("Received prediction request from: {}", httpRequest.getRemoteAddr());

        // Validate request
        if (bindingResult.hasErrors()) {
            logger.warn("Invalid prediction request: {}", bindingResult.getAllErrors());
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> 
                errors.put(error.getField(), error.getDefaultMessage()));
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            // Check if Python service is healthy before proceeding
            if (!predictionService.isPythonServiceHealthy()) {
                logger.error("Python service is not healthy");
                ErrorResponse errorResponse = new ErrorResponse(
                    HttpStatus.SERVICE_UNAVAILABLE.value(),
                    "Service Unavailable",
                    "Python prediction service is not available",
                    httpRequest.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
            }

            // Process prediction
            PredictionResponse response = predictionService.predictDigit(request);
            logger.info("Prediction completed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Prediction failed: {}", e.getMessage());
            ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Prediction failed: " + e.getMessage(),
                httpRequest.getRequestURI()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        logger.debug("Health check requested");
        
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "digit-classification-api");
        health.put("python_service_healthy", predictionService.isPythonServiceHealthy());
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        logger.debug("Info endpoint requested");
        
        Map<String, Object> info = new HashMap<>();
        info.put("service", "MNIST Digit Classification API");
        info.put("version", "1.0.0");
        info.put("description", "Spring Boot API for MNIST digit classification with Python ML backend");
        info.put("endpoints", Map.of(
            "predict", "POST /api/predict - Predict digit from pixel array",
            "health", "GET /api/health - Health check",
            "info", "GET /api/info - Service information"
        ));
        info.put("python_service_url", "http://localhost:8000");
        
        return ResponseEntity.ok(info);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
        logger.error("Unhandled exception: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            "An unexpected error occurred: " + ex.getMessage(),
            request.getRequestURI()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
