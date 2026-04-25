package com.example.digitclassification.service;

import com.example.digitclassification.dto.PredictionRequest;
import com.example.digitclassification.dto.PredictionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;

@Service
public class PredictionService {

    private static final Logger logger = LoggerFactory.getLogger(PredictionService.class);

    @Autowired
    private WebClient webClient;

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    @Value("${python.service.timeout}")
    private int timeoutMs;

    public PredictionResponse predictDigit(PredictionRequest request) {
        logger.info("Sending prediction request to Python service: {}", pythonServiceUrl);
        logger.debug("Request contains {} pixel values", request.getPixels().size());

        try {
            PredictionResponse response = webClient.post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(PredictionResponse.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .retryWhen(Retry.backoff(2, Duration.ofMillis(100))
                            .maxBackoff(Duration.ofMillis(500))
                            .doBeforeRetry(retrySignal -> 
                                logger.warn("Retrying prediction request, attempt: {}", 
                                    retrySignal.totalRetries() + 1)))
                    .doOnError(error -> logger.error("Error calling Python service: {}", error.getMessage()))
                    .block();

            if (response != null) {
                logger.info("Prediction successful: digit {} with confidence {:.3f}", 
                    response.getPrediction(), response.getConfidence());
                logger.debug("Processing time: {:.2f}ms", response.getProcessingTimeMs());
            } else {
                logger.error("Received null response from Python service");
                throw new RuntimeException("Null response from prediction service");
            }

            return response;

        } catch (WebClientResponseException e) {
            logger.error("HTTP error from Python service: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Python service error: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            logger.error("Error calling Python prediction service: {}", e.getMessage());
            throw new RuntimeException("Failed to get prediction from Python service: " + e.getMessage(), e);
        }
    }

    public boolean isPythonServiceHealthy() {
        try {
            logger.debug("Checking Python service health at: {}/health", pythonServiceUrl);
            
            String healthResponse = webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(2000))
                    .block();
            
            boolean isHealthy = healthResponse != null && healthResponse.contains("healthy");
            logger.debug("Python service health check result: {}", isHealthy);
            return isHealthy;
            
        } catch (Exception e) {
            logger.warn("Python service health check failed: {}", e.getMessage());
            return false;
        }
    }
}
