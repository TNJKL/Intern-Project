package com.beverage.payment.domain.exception;

public class PaymentNotFoundException extends BusinessException {
    public PaymentNotFoundException(String message) {
        super(message);
    }
}
