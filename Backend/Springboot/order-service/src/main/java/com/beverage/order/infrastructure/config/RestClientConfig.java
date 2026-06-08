package com.beverage.order.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient productRestClient(
            @Value("${app.product-service.base-url}") String baseUrl,
            @Value("${app.product-service.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.product-service.read-timeout-ms:5000}") int readTimeoutMs
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    @Bean
    public RestClient inventoryRestClient(
            @Value("${app.inventory-service.base-url}") String baseUrl,
            @Value("${app.inventory-service.connect-timeout-ms:5000}") int connectTimeoutMs,
            @Value("${app.inventory-service.read-timeout-ms:5000}") int readTimeoutMs,
            // SEC-01: Secret dùng để xác thực internal request đến /check-availability
            @Value("${app.internal.secret:internal-beverage-secret-2024}") String internalSecret
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                // Header này được gửi tự động trong mọi request đến inventory-service
                .defaultHeader("X-Internal-Secret", internalSecret)
                .build();
    }
}

