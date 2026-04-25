package com.example.digitclassification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class PredictionRequest {


    @Size(min = 784, max = 784)
    private List<@Min(0) @Max(255) Double> pixels;

    public PredictionRequest() {
    }

    public PredictionRequest(List<Double> pixels) {
        this.pixels = pixels;
    }

    public List<Double> getPixels() {
        return pixels;
    }

    public void setPixels(List<Double> pixels) {
        this.pixels = pixels;
    }

    @Override
    public String toString() {
        return "PredictionRequest{" +
                "pixels=" + (pixels != null ? pixels.size() + " values" : "null") +
                '}';
    }
}
