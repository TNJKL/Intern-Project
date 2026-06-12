package com.beverage.payment.application.usecase;

import java.math.BigDecimal;
import java.util.Map;

public interface VNPayUseCase {
    String generatePaymentUrl(String orderCode, BigDecimal amount, String ipAddress);
    boolean verifySignature(Map<String, String> fields);
}
