package com.example.digitclassification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PredictionResponse {

    @JsonProperty("prediction")
    private int prediction;

    @JsonProperty("confidence")
    private double confidence;

    @JsonProperty("processing_time_ms")
    private double processingTimeMs;

    public PredictionResponse() {
    }

    public PredictionResponse(int prediction, double confidence, double processingTimeMs) {
        this.prediction = prediction;
        this.confidence = confidence;
        this.processingTimeMs = processingTimeMs;
    }

    public int getPrediction() {
        return prediction;
    }

    public void setPrediction(int prediction) {
        this.prediction = prediction;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public double getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(double processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    @Override
    public String toString() {
        return "PredictionResponse{" +
                "prediction=" + prediction +
                ", confidence=" + confidence +
                ", processingTimeMs=" + processingTimeMs +
                '}';
    }
}
