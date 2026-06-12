package com.beverage.payment.domain.exception;

public class InvalidPaymentAmountException extends BusinessException {
    public InvalidPaymentAmountException(String message) {
        super(message);
    }
}
