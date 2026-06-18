package com.beverage.payment.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.payment")
@Getter
@Setter
public class PaymentConfig {
    private int expirationMinutes = 15;
    private int maxRetry = 2;
    private long expireCheckIntervalMs = 60000;
    private long outboxCheckIntervalMs = 5000;
    private long outboxRetryIntervalMs = 60000;
    private boolean simulateOutboxError = false;
}
