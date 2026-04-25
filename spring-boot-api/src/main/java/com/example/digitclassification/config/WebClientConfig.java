package com.example.digitclassification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    @Value("${python.service.timeout}")
    private int timeoutMs;

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .baseUrl(pythonServiceUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)) // 1MB
                .build();
    }

    @Bean
    public Duration timeoutDuration() {
        return Duration.ofMillis(timeoutMs);
    }
}
