package com.beverage.payment.domain.exception;

public class DuplicateEventException extends BusinessException {
    public DuplicateEventException(String message) {
        super(message);
    }
}
